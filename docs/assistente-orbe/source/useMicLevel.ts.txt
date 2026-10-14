'use client'
// src/features/agenda/components/assistant/useMicLevel.ts
// Medidor visual do microfone. Alimenta a vibracao do orbe e NADA mais:
// o reconhecimento de fala nunca depende dele.
//
// Duas licoes aprendidas em producao, ambas no iPhone:
//
// 1. O iOS Safari limita o numero de AudioContext por pagina (~4) e `close()`
//    e assincrono. Criar um por captura esgotava o limite e, a partir dai,
//    `new AudioContext()` falhava em silencio. Por isso o contexto agora e
//    unico por pagina, reaproveitado e nunca fechado.
//
// 2. No iOS, getUserMedia e SpeechRecognition disputando o mesmo dispositivo
//    derrubam o reconhecimento depois da primeira rodada. Ali o medidor
//    simplesmente nao roda: e melhor um orbe menos vivo do que um microfone
//    que exige recarregar a pagina.

import { useCallback, useEffect, useRef } from 'react'

interface WindowWithLegacyAudio extends Window {
  webkitAudioContext?: typeof AudioContext
}

/** Contexto unico por pagina. Nunca fechado — apenas suspenso quando ocioso. */
let sharedContext: AudioContext | null = null

function getSharedContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (sharedContext) return sharedContext
  const Ctor = typeof window.AudioContext === 'function'
    ? window.AudioContext
    : (window as WindowWithLegacyAudio).webkitAudioContext
  if (typeof Ctor !== 'function') return null
  try {
    sharedContext = new Ctor()
    return sharedContext
  } catch {
    return null
  }
}

/**
 * iOS (inclui iPadOS, que se anuncia como Mac com toque).
 * Ali o medidor nao convive com o reconhecimento de fala.
 */
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  if (/iPad|iPhone|iPod/.test(ua)) return true
  return ua.includes('Macintosh') && navigator.maxTouchPoints > 1
}

interface Options {
  onLevel: (level: number) => void
}

interface MicController {
  /** false quando o medidor nao vai rodar. Nunca e motivo para abortar a fala. */
  available: boolean
  start: () => Promise<boolean>
  stop: () => void
}

export function useMicLevel({ onLevel }: Options): MicController {
  const streamRef = useRef<MediaStream | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const rafRef = useRef<number | null>(null)
  const levelRef = useRef(onLevel)
  useEffect(() => { levelRef.current = onLevel }, [onLevel])

  const available = !isIOS()
    && typeof navigator !== 'undefined'
    && Boolean(navigator.mediaDevices?.getUserMedia)

  const stop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect()
      sourceRef.current = null
    }
    if (streamRef.current) {
      // Sem isto o indicador de gravacao do sistema fica aceso.
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    levelRef.current(0)
  }, [])

  const start = useCallback(async (): Promise<boolean> => {
    if (!available) return false
    const audio = getSharedContext()
    if (!audio) return false

    try {
      if (audio.state === 'suspended') await audio.resume()
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })

      const source = audio.createMediaStreamSource(stream)
      const analyser = audio.createAnalyser()
      analyser.fftSize = 1024
      analyser.smoothingTimeConstant = 0.6
      source.connect(analyser)

      streamRef.current = stream
      sourceRef.current = source

      const buffer = new Uint8Array(analyser.frequencyBinCount)
      let smoothed = 0
      const loop = (): void => {
        rafRef.current = requestAnimationFrame(loop)
        analyser.getByteTimeDomainData(buffer)
        let sum = 0
        for (let i = 0; i < buffer.length; i++) {
          const v = (buffer[i] - 128) / 128
          sum += v * v
        }
        // RMS -> 0..1 com ganho; fala normal fica perto de 0.05 de RMS.
        const target = Math.min(1, Math.sqrt(sum / buffer.length) * 7)
        smoothed += (target - smoothed) * (target > smoothed ? 0.45 : 0.12)
        levelRef.current(smoothed)
      }
      rafRef.current = requestAnimationFrame(loop)
      return true
    } catch {
      // Medidor indisponivel nao interrompe nada: a fala segue.
      stop()
      return false
    }
  }, [available, stop])

  useEffect(() => stop, [stop])

  return { available, start, stop }
}
