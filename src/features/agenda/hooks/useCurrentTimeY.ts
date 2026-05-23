'use client'
// src/features/agenda/hooks/useCurrentTimeY.ts

import { useEffect, useState } from 'react'

function calcY(startMin: number, pxPerMin: number, endHourCap?: number): number {
  if (typeof window === 'undefined') return -1
  const now = new Date()
  const min = now.getHours() * 60 + now.getMinutes()
  const endLimit = endHourCap != null ? endHourCap * 60 : startMin + 24 * 60
  if (min < startMin || min > endLimit) return -1
  return (min - startMin) * pxPerMin
}

/**
 * Posição Y (px) da linha de "hora atual" na grade.
 * Retorna -1 quando o horário atual está fora da janela visível.
 *
 * @param startMin minuto do topo da grade (ex: 7*60)
 * @param pxPerMin pixels por minuto da grade atual
 * @param endHourCap se informado, retorna -1 quando hora passou desse limite
 */
export function useCurrentTimeY(startMin: number, pxPerMin: number, endHourCap?: number): number {
  // Lazy initializer — calcula no primeiro render sem cascading setState
  const [y, setY] = useState<number>(() => calcY(startMin, pxPerMin, endHourCap))

  useEffect(() => {
    // Re-sincroniza ao mudar dependências (sem setState síncrono no body do effect)
    let cancelled = false
    function tick() {
      if (cancelled) return
      setY(prev => {
        const next = calcY(startMin, pxPerMin, endHourCap)
        return prev === next ? prev : next
      })
    }
    // Primeira atualização via setTimeout(0) — evita setState síncrono
    const initId = setTimeout(tick, 0)
    const id = setInterval(tick, 30_000)
    return () => {
      cancelled = true
      clearTimeout(initId)
      clearInterval(id)
    }
  }, [startMin, pxPerMin, endHourCap])

  return y
}

