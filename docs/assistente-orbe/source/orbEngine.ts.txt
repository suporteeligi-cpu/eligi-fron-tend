// src/features/agenda/components/assistant/orbEngine.ts
// Motor de particulas do orbe. Vive fora do React: nenhum frame dispara render.
//
// O globo Eligi e amostrado uma unica vez por sessao (cache de modulo) e cada
// pixel de continente vira uma particula. O orbe interpola entre a forma do
// globo (repouso) e uma casca esferica caotica (ativo) — o "morph".

import { AssistantState, GLOBE_SRC } from './constants'

type ParticleKind = 'red' | 'ember' | 'white' | 'dark'

interface GlobePoint {
  x: number
  y: number
  z: number
  kind: ParticleKind
}

interface Particle {
  /** posicao no globo montado */
  gx: number; gy: number; gz: number
  /** posicao na casca caotica */
  cx: number; cy: number; cz: number
  kind:  ParticleKind
  seed:  number
  tw:    number
  phase: number
  cluster: number
  spiralAngle: number
  spiralSpeed: number
}

interface NavigatorWithHints extends Navigator {
  deviceMemory?: number
}

/* ─── densidade adaptativa ─────────────────────────────────────────────────
 * Additive blending e fill-rate bound. Em aparelho fraco, menos particulas.
 */
function particleCount(): number {
  if (typeof navigator === 'undefined') return 900
  const nav = navigator as NavigatorWithHints
  const mem = typeof nav.deviceMemory === 'number' ? nav.deviceMemory : 4
  const cpu = typeof nav.hardwareConcurrency === 'number' ? nav.hardwareConcurrency : 4
  if (mem <= 2 || cpu <= 2) return 500
  if (mem <= 4 || cpu <= 4) return 900
  return 1400
}

/* ─── sprites ──────────────────────────────────────────────────────────────
 * Um gradiente radial pre-renderizado por cor. Desenhar 1400 sprites prontos
 * e ordens de grandeza mais barato que 1400 createRadialGradient por frame.
 */
function makeSprite(mid: string, core: string): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = 64
  c.height = 64
  const g = c.getContext('2d')
  if (!g) return c
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  grd.addColorStop(0, core)
  grd.addColorStop(0.35, mid)
  grd.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, 64, 64)
  return c
}

let spriteCache: Record<ParticleKind | 'core', HTMLCanvasElement> | null = null
function sprites(): Record<ParticleKind | 'core', HTMLCanvasElement> {
  if (!spriteCache) {
    spriteCache = {
      red:   makeSprite('rgba(220,38,38,0.50)',  'rgba(255,130,105,0.95)'),
      ember: makeSprite('rgba(249,115,22,0.55)', 'rgba(255,210,160,1)'),
      white: makeSprite('rgba(226,232,240,0.42)','rgba(255,255,255,0.92)'),
      dark:  makeSprite('rgba(140,20,20,0.40)',  'rgba(220,90,70,0.65)'),
      core:  makeSprite('rgba(220,38,38,0.28)',  'rgba(255,160,130,0.85)'),
    }
  }
  return spriteCache
}

/* ─── amostragem do globo (uma vez por sessao) ─────────────────────────────── */

const SAMPLE_SIZE = 192

let globeCache: GlobePoint[] | null = null
let globePending: Promise<GlobePoint[]> | null = null

function classify(r: number, g: number, b: number, radius: number): ParticleKind | null {
  if (r > 150 && g < 95 && b < 95) return 'red'      // Africa / Europa
  if (r > 165 && g > 165 && b > 165) return 'white'  // Americas
  if (radius > 0.86) return 'dark'                   // limbo da esfera
  return null                                        // oceano: descartado
}

function extractPoints(img: HTMLImageElement): GlobePoint[] {
  const off = document.createElement('canvas')
  off.width = SAMPLE_SIZE
  off.height = SAMPLE_SIZE
  const g = off.getContext('2d', { willReadFrequently: true })
  if (!g) return []
  g.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE)

  let data: Uint8ClampedArray
  try {
    data = g.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data
  } catch {
    return [] // canvas tainted: cai no fallback de casca pura
  }

  const out: GlobePoint[] = []
  for (let py = 0; py < SAMPLE_SIZE; py += 2) {
    for (let px = 0; px < SAMPLE_SIZE; px += 2) {
      const i = (py * SAMPLE_SIZE + px) * 4
      if (data[i + 3] < 140) continue
      const nx = (px / SAMPLE_SIZE) * 2 - 1
      const ny = (py / SAMPLE_SIZE) * 2 - 1
      const radius = Math.hypot(nx, ny)
      if (radius > 0.97) continue
      const kind = classify(data[i], data[i + 1], data[i + 2], radius)
      if (!kind) continue
      out.push({
        x: nx * 0.94,
        y: ny * 0.94,
        z: Math.sqrt(Math.max(0, 1 - radius * radius)) * 0.94,
        kind,
      })
    }
  }
  return out
}

function loadGlobePoints(): Promise<GlobePoint[]> {
  if (globeCache) return Promise.resolve(globeCache)
  if (globePending) return globePending
  globePending = new Promise<GlobePoint[]>(resolve => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      globeCache = extractPoints(img)
      resolve(globeCache)
    }
    img.onerror = () => {
      globeCache = [] // sem globo: o orbe roda como reator puro
      resolve(globeCache)
    }
    img.src = GLOBE_SRC
  })
  return globePending
}

/* ─── engine ───────────────────────────────────────────────────────────────── */

export class OrbEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private particles: Particle[] = []
  private raf: number | null = null
  private disposed = false

  private state: AssistantState = 'idle'
  /** peso animado de cada estado (crossfade) */
  private weight: Record<AssistantState, number> = { idle: 1, listening: 0, thinking: 0, speaking: 0 }

  /** nivel de entrada 0..1 vindo do microfone real */
  private micLevel = 0
  /** envelope 0..1 da voz sintetizada (fase 2) */
  private voiceLevel = 0

  private rotation = 0
  private assembled = 1
  private lastTs = 0
  private reduced = false

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D indisponivel')
    this.ctx = ctx
    this.reduced = typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    this.buildParticles(null)
    void loadGlobePoints().then(pts => {
      if (this.disposed) return
      this.buildParticles(pts.length > 0 ? pts : null)
    })
  }

  private buildParticles(globe: GlobePoint[] | null): void {
    const total = particleCount()
    const list: Particle[] = []
    for (let i = 0; i < total; i++) {
      const chaos = OrbEngine.shellPoint()
      let gx = chaos.x, gy = chaos.y, gz = chaos.z
      let kind: ParticleKind = Math.random() < 0.14 ? 'ember' : 'red'
      if (globe) {
        const s = globe[(Math.random() * globe.length) | 0]
        const back = Math.random() < 0.42 // metade povoa o hemisferio de tras
        gx = back ? -s.x : s.x
        gy = s.y
        gz = back ? -s.z : s.z
        kind = s.kind
      }
      list.push({
        gx, gy, gz,
        cx: chaos.x, cy: chaos.y, cz: chaos.z,
        kind,
        seed: Math.random(),
        tw: 1.5 + Math.random() * 3,
        phase: Math.random() * Math.PI * 2,
        cluster: i % 6,
        spiralAngle: Math.random() * Math.PI * 2,
        spiralSpeed: (0.8 + Math.random() * 2.2) * (i % 2 ? 1 : -1),
      })
    }
    this.particles = list
  }

  private static shellPoint(): { x: number; y: number; z: number } {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const r = Math.random() < 0.72 ? 0.9 + 0.1 * Math.random() : Math.cbrt(Math.random()) * 0.85
    return {
      x: r * Math.sin(phi) * Math.cos(theta),
      y: r * Math.cos(phi) * 0.94,
      z: r * Math.sin(phi) * Math.sin(theta),
    }
  }

  /** Ajusta o buffer ao tamanho de layout. Chamar no mount e a cada resize. */
  resize(): void {
    const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2)
    const size = this.canvas.clientWidth || 280
    this.canvas.width = Math.round(size * dpr)
    this.canvas.height = Math.round(size * dpr)
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  setState(next: AssistantState): void {
    this.state = next
  }

  /** Nivel de captura do microfone, 0..1. */
  setMicLevel(level: number): void {
    this.micLevel = Math.max(0, Math.min(1, level))
  }

  /** Envelope da voz sintetizada, 0..1. Usado pela fase 2. */
  setVoiceLevel(level: number): void {
    this.voiceLevel = Math.max(0, Math.min(1, level))
  }

  start(): void {
    if (this.raf !== null || this.disposed) return
    this.lastTs = 0
    this.resize()
    this.raf = requestAnimationFrame(this.tick)
  }

  /** Para o loop. Sem painel aberto nao existe frame — nem bateria gasta. */
  stop(): void {
    if (this.raf !== null) {
      cancelAnimationFrame(this.raf)
      this.raf = null
    }
  }

  destroy(): void {
    this.stop()
    this.disposed = true
    this.particles = []
  }

  private tick = (ts: number): void => {
    if (this.disposed) return
    this.raf = requestAnimationFrame(this.tick)

    const t = ts / 1000
    const dt = Math.min(0.05, this.lastTs === 0 ? 0.016 : t - this.lastTs)
    this.lastTs = t

    const states: AssistantState[] = ['idle', 'listening', 'thinking', 'speaking']
    for (const k of states) {
      const target = k === this.state ? 1 : 0
      this.weight[k] += (target - this.weight[k]) * Math.min(1, dt * 7)
    }

    // morph: montado em repouso, disperso quando ativo
    this.assembled += (this.weight.idle - this.assembled) * Math.min(1, dt * 3.2)

    const w = this.weight
    const mic = this.micLevel
    const voice = this.voiceLevel
    const size = this.canvas.clientWidth || 280
    const half = size / 2
    const scale = half * 0.86
    const k = size / 300
    const ctx = this.ctx
    const spr = sprites()

    ctx.clearRect(0, 0, size, size)
    ctx.globalCompositeOperation = 'lighter'

    const speed = this.reduced
      ? 0.04
      : 0.16 + w.listening * 0.14 + w.speaking * 0.08 - w.thinking * 0.12
    this.rotation += dt * speed
    const cos = Math.cos(this.rotation)
    const sin = Math.sin(this.rotation)
    const breath = 1 + w.speaking * voice * 0.13 + Math.sin(t * 0.9) * 0.012

    // brilho central
    const coreAlpha = 0.14
      + w.listening * mic * 0.20
      + w.speaking * voice * 0.40
      + w.thinking * (0.06 + 0.05 * Math.sin(t * 7))
    ctx.globalAlpha = Math.min(0.75, coreAlpha)
    const coreSize = scale * (0.9 + w.speaking * voice * 0.25)
    ctx.drawImage(spr.core, half - coreSize / 2, half - coreSize / 2, coreSize, coreSize)

    // centros das espirais do estado "pensando"
    const centers: Array<[number, number]> = []
    for (let i = 0; i < 6; i++) {
      const a = t * 0.5 + (i * Math.PI) / 3
      centers.push([Math.cos(a) * 0.46, Math.sin(a) * 0.46])
    }

    for (const p of this.particles) {
      const asm = this.assembled
      const bx = p.cx + (p.gx - p.cx) * asm
      const by = p.cy + (p.gy - p.cy) * asm
      const bz = p.cz + (p.gz - p.cz) * asm

      const X = bx * cos - bz * sin
      const Z = bx * sin + bz * cos
      const persp = 1 / (1.7 - Z * 0.55)
      let sx = X * persp
      let sy = by * persp

      // escutando: vibra com o volume real do microfone
      const vib = 1 + w.listening * mic * (0.05 + 0.16 * p.seed) * Math.sin(t * 26 + p.seed * 40)
      sx *= vib
      sy *= vib

      // pensando: colapsa em espirais
      if (w.thinking > 0.01) {
        const c = centers[p.cluster]
        const rad = 0.11 + 0.16 * p.seed + 0.04 * Math.sin(t * 3 + p.seed * 9)
        const a = p.spiralAngle + t * p.spiralSpeed
        sx += (c[0] + Math.cos(a) * rad - sx) * w.thinking
        sy += (c[1] + Math.sin(a) * rad - sy) * w.thinking
      }

      sx *= breath
      sy *= breath

      const depth = 0.35 + 0.65 * (Z * 0.5 + 0.5)
      const twinkle = p.kind === 'ember'
        ? 0.45 + 0.55 * Math.sin(t * p.tw * 2 + p.phase)
        : 0.70 + 0.30 * Math.sin(t * p.tw + p.phase)
      const kindMul = p.kind === 'white' ? 0.62 : p.kind === 'dark' ? 0.55 : 1
      ctx.globalAlpha = Math.max(
        0,
        depth * twinkle * kindMul * (0.55 + w.speaking * voice * 0.45 + w.listening * mic * 0.25),
      )
      const dot = (p.kind === 'ember' ? 5.5 : 4.2) * persp * (0.8 + p.seed * 0.7) * k
      ctx.drawImage(spr[p.kind], half + sx * scale - dot / 2, half + sy * scale - dot / 2, dot, dot)
    }

    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
  }
}
