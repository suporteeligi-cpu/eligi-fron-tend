'use client'
// src/features/extended-hours/XhSimulator.tsx
// @eligi:xh-fe-sim — "Teste antes de ativar" (direcao B, fundo branco).
// Cada toque e um cliente marcando pelo link: o sistema so oferece o horario
// logo depois do ultimo. Nada e gravado; e so a explicacao da fila.
// Vai por portal no <body> (ancestral com transform prenderia o fixed).

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { FlameIcon, XH, XH_CSS } from './ui'
import { hhmmToMin, minToHhmm } from './api'

type Svc = { name: string; duration: number }
type Placed = Svc & { startM: number; endM: number }

const LANE_H = 300
const FALLBACK: Svc[] = [
  { name: 'Serviço de 60 min', duration: 60 },
  { name: 'Serviço de 30 min', duration: 30 },
  { name: 'Serviço de 15 min', duration: 15 },
]
const noop = () => () => {}

/** Ate 3 servicos de duracoes diferentes do proprio negocio, repetidos 2x. */
function queueFrom(list: Svc[]): Svc[] {
  const seen = new Set<number>()
  const picked = list
    .filter((s) => s.duration >= 10 && s.duration <= 120)
    .sort((a, b) => b.duration - a.duration)
    .filter((s) => {
      if (seen.has(s.duration)) return false
      seen.add(s.duration)
      return true
    })
    .slice(0, 3)
  const base = picked.length > 0 ? picked : FALLBACK
  return [...base, ...base]
}

type SvcRow = { name?: unknown; duration?: unknown; active?: unknown; availableOnline?: unknown }

function fetchServices(): Promise<Svc[]> {
  return api.get('/services').then((r) => {
    const raw = (r.data?.data ?? r.data) as unknown
    const rows = Array.isArray(raw) ? (raw as SvcRow[]) : []
    return rows
      .filter((s) => s.active !== false && s.availableOnline !== false)
      .filter((s): s is { name: string; duration: number } => typeof s.name === 'string' && typeof s.duration === 'number')
      .map((s) => ({ name: s.name, duration: s.duration }))
  })
}

export default function XhSimulator({
  closeAt, limit, proName, onClose, onActivate, activateLabel,
}: {
  closeAt: string
  limit: string
  proName: string | null
  onClose: () => void
  onActivate: () => void
  activateLabel: string
}) {
  const mounted = useSyncExternalStore(noop, () => true, () => false)
  const [queue, setQueue] = useState<Svc[]>(() => queueFrom([]))
  const [placed, setPlaced] = useState<Placed[]>([])
  const [idx, setIdx] = useState(0)
  const [msg, setMsg] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  useEffect(() => { closeRef.current = onClose })

  useEffect(() => {
    let vivo = true
    fetchServices()
      .then((list) => { if (vivo && list.length > 0) setQueue(queueFrom(list)) })
      .catch((e) => console.error('[modo-dezembro] simulador: servicos', e))
    return () => { vivo = false }
  }, [])

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    ref.current?.querySelector<HTMLButtonElement>('[data-xh-first]')?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeRef.current() }
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      prev?.focus()
    }
  }, [])

  const openM = hhmmToMin(closeAt)
  const rawLimit = hhmmToMin(limit)
  const limitM = rawLimit > openM ? rawLimit : openM + 180
  const px = LANE_H / (limitM - openM)
  const frontier = placed.length > 0 ? placed[placed.length - 1].endM : openM
  const shortest = Math.min(...queue.map((q) => q.duration))
  const done = idx >= queue.length || frontier + shortest > limitM
  const next = queue[idx]
  const who = proName ?? 'O profissional'

  const ticks: number[] = []
  for (let m = Math.ceil(openM / 60) * 60; m < limitM; m += 60) if (m > openM) ticks.push(m)

  function simulate() {
    if (done || !next) return
    if (frontier + next.duration > limitM) {
      setIdx(idx + 1)
      setMsg(`${next.name} (${next.duration} min) não cabe: terminaria depois das ${minToHhmm(limitM)}. O link nem mostra esse serviço.`)
      return
    }
    const end = frontier + next.duration
    setPlaced([...placed, { ...next, startM: frontier, endM: end }])
    setIdx(idx + 1)
    setMsg(end + shortest > limitM
      ? `Fila cheia. ${who} termina às ${minToHhmm(end)} e o link para de oferecer horário.`
      : `Marcado ${minToHhmm(frontier)}–${minToHhmm(end)}. Agora o link só oferece ${minToHhmm(end)}.`)
  }

  function reset() {
    setPlaced([])
    setIdx(0)
    setMsg(null)
  }

  if (!mounted) return null

  return createPortal(
    <>
      <style>{XH_CSS}</style>
      <div className="xh-drop" onClick={onClose} aria-hidden />
      <div className="xh-sheet" role="dialog" aria-modal="true" aria-labelledby="xh-sim-h" ref={ref}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="xh-eyebrow"><FlameIcon size={14} className="xh-flame" />Teste antes de ativar</span>
          <button type="button" className="xh-x" onClick={onClose} aria-label="Fechar"><X size={17} /></button>
        </div>
        <h2 id="xh-sim-h" className="xh-sim-h xh-d">Veja a fila enchendo depois das {closeAt}.</h2>
        <p className="xh-sim-p">Cada toque é um cliente marcando pelo link. O sistema só oferece o horário logo depois do último atendimento, até {minToHhmm(limitM)}.</p>

        <div className="xh-sim-body" style={{ height: LANE_H }}>
          <div className="xh-sim-axis" aria-hidden>
            <span className="xh-m" style={{ top: 0, color: '#111114' }}>{minToHhmm(openM)}</span>
            {ticks.map((m) => <span key={m} className="xh-m" style={{ top: Math.round((m - openM) * px) }}>{minToHhmm(m)}</span>)}
            <span className="xh-m end" style={{ top: LANE_H }}>{minToHhmm(limitM)}</span>
          </div>
          <div className="xh-sim-lane" role="list" aria-label={`Fila de ${who}`}>
            {placed.map((p) => (
              <div
                key={`${p.startM}-${p.name}`}
                role="listitem"
                className="xh-sim-card"
                style={{ top: Math.round((p.startM - openM) * px) + 2, height: Math.max(22, Math.round(p.duration * px) - 4) }}
              >
                <span className="xh-m">{minToHhmm(p.startM)}</span><b>{p.name}</b><span className="dur">{p.duration} min</span>
              </div>
            ))}
            {!done && (
              <div className="xh-sim-next" style={{ top: Math.min(LANE_H - 32, Math.round((frontier - openM) * px) + 2) }}>
                Próximo no link: {minToHhmm(frontier)}
              </div>
            )}
            <div className="xh-sim-limit" aria-hidden />
          </div>
        </div>

        <div className={`xh-sim-msg${done ? ' end' : ''}`} role="status">
          {msg ?? `O dia normal terminou às ${minToHhmm(openM)}. Toque para um cliente marcar.`}
        </div>
        <div className="xh-sim-acts">
          {!done && next && (
            <button type="button" data-xh-first className="xh-btn grow" onClick={simulate}>
              Cliente marca: {next.duration} min
            </button>
          )}
          {done && <button type="button" className="xh-btn ghost" onClick={reset}>De novo</button>}
          {done && <button type="button" data-xh-first className="xh-btn red grow" onClick={onActivate}>{activateLabel}</button>}
        </div>
        <p style={{ margin: '12px 0 0', fontSize: 12.5, lineHeight: 1.45, color: XH.ink }}>
          O horário normal não muda. Fora do período escolhido, tudo volta ao normal sozinho.
        </p>
      </div>
    </>,
    document.body,
  )
}
