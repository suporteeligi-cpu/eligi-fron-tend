'use client'
// src/features/agenda/components/assistant/useMicLevel.ts
// Captura real do microfone. Entrega o nivel RMS via callback (nao via state),
// para nao disparar um render por frame.

import { useCallback, useEffect, useRef } from 'react'
import { MicError } from './constants'

interface WindowWithLegacyAudio extends Window {
  webkitAudioContext?: typeof AudioContext
}

function resolveAudioContext(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null
  if (typeof window.AudioContext === 'function') return window.AudioContext
  const legacy = (window as WindowWithLegacyAudio).webkitAudioContext
  return typeof legacy === 'function' ? legacy : null
}

function classifyError(err: unknown): MicError {
  if (typeof window !== 'undefined' && !window.isSecureContext) return 'insecure'
  if (err instanceof DOMException) {
    if (err.name === 'NotAllowedError' || err.name === 'SecurityError') return 'denied'
    if (err.name === 'NotFoundError' || err.name === 'OverconstrainedError') return 'unavailable'
  }
  return 'unavailable'
}

interface Options {
  /** Recebe o nivel 0..1 a cada frame enquanto a captura esta ativa. */
  onLevel: (level: number) => void
  /** Chamado quando a captura nao pode ser iniciada. */
  onError: (error: MicError) => void
}

interface MicController {
  start: () => Promise<boolean>
  stop: () => void
}

export function useMicLevel({ onLevel, onError }: Options): MicController {
  const streamRef = useRef<MediaStream | null>(null)
  const audioRef  = useRef<AudioContext | null>(null)
  const rafRef    = useRef<number | null>(null)

  const levelRef = useRef(onLevel)
  const errorRef = useRef(onError)
  useEffect(() => { levelRef.current = onLevel }, [onLevel])
  useEffect(() => { errorRef.current = onError }, [onError])

  const stop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (streamRef.current) {
      // Sem isto o indicador de gravacao do sistema fica ligado apos fechar.
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (audioRef.current) {
      void audioRef.current.close().catch(() => { /* ja fechado */ })
      audioRef.current = null
    }
    levelRef.current(0)
  }, [])

  const start = useCallback(async (): Promise<boolean> => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      errorRef.current(typeof window !== 'undefined' && !window.isSecureContext ? 'insecure' : 'unavailable')
      return false
    }
    const Ctor = resolveAudioContext()
    if (!Ctor) {
      errorRef.current('unavailable')
      return false
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })
      const audio = new Ctor()
      // iOS Safari inicia o contexto suspenso ate um gesto do usuario.
      if (audio.state === 'suspended') await audio.resume()

      const source = audio.createMediaStreamSource(stream)
      const analyser = audio.createAnalyser()
      analyser.fftSize = 1024
      analyser.smoothingTimeConstant = 0.6
      source.connect(analyser)

      const buffer = new Uint8Array(analyser.frequencyBinCount)
      streamRef.current = stream
      audioRef.current = audio

      let smoothed = 0
      const loop = (): void => {
        rafRef.current = requestAnimationFrame(loop)
        analyser.getByteTimeDomainData(buffer)
        let sum = 0
        for (let i = 0; i < buffer.length; i++) {
          const v = (buffer[i] - 128) / 128
          sum += v * v
        }
        // RMS -> 0..1 com ganho; fala normal fica em torno de 0.05 de RMS.
        const rms = Math.sqrt(sum / buffer.length)
        const target = Math.min(1, rms * 7)
        smoothed += (target - smoothed) * (target > smoothed ? 0.45 : 0.12)
        levelRef.current(smoothed)
      }
      rafRef.current = requestAnimationFrame(loop)
      return true
    } catch (err) {
      stop()
      errorRef.current(classifyError(err))
      return false
    }
  }, [stop])

  useEffect(() => stop, [stop])

  return { start, stop }
}
