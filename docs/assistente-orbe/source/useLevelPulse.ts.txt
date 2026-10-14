'use client'
// src/features/agenda/components/assistant/useLevelPulse.ts
// Envelope com ataque instantaneo e decaimento suave, alimentado por eventos
// discretos (uma palavra reconhecida, uma palavra falada). Usado quando nao ha
// medidor de audio disponivel — nao e um pulso inventado: cada ataque
// corresponde a um evento real de fala.

import { useCallback, useEffect, useRef } from 'react'

interface Options {
  onLevel: (level: number) => void
  /** Quanto o nivel cai por frame. Maior = decaimento mais seco. */
  decay?: number
}

interface PulseController {
  pulse: () => void
  stop: () => void
}

export function useLevelPulse({ onLevel, decay = 0.05 }: Options): PulseController {
  const rafRef = useRef<number | null>(null)
  const levelValueRef = useRef(0)
  const levelRef = useRef(onLevel)
  useEffect(() => { levelRef.current = onLevel }, [onLevel])

  const stop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    levelValueRef.current = 0
    levelRef.current(0)
  }, [])

  const pulse = useCallback(() => {
    levelValueRef.current = 1
    if (rafRef.current !== null) return
    const tick = () => {
      levelValueRef.current = Math.max(0, levelValueRef.current - decay)
      levelRef.current(levelValueRef.current)
      if (levelValueRef.current <= 0) {
        rafRef.current = null
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [decay])

  useEffect(() => stop, [stop])

  return { pulse, stop }
}
