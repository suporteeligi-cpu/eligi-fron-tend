'use client'
// src/features/agenda/hooks/useDeviceMode.ts

import { useEffect, useState } from 'react'

export type DeviceMode = 'desktop' | 'ipad' | 'mobile'

function detect(): DeviceMode {
  if (typeof window === 'undefined') return 'desktop'
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  if (!hasTouch) return 'desktop'
  if (window.innerWidth >= 768) return 'ipad'
  return 'mobile'
}

/**
 * Detecta o modo de dispositivo. SSR-safe via lazy initializer:
 * - servidor: retorna 'desktop' (window indefinido)
 * - cliente: detecta no primeiro render, sem cascading render
 */
export function useDeviceMode(): DeviceMode {
  // Lazy initializer — roda 1x no primeiro render, no cliente já com window disponível.
  // Evita setState dentro de useEffect (regra react-hooks/set-state-in-effect).
  const [mode, setMode] = useState<DeviceMode>(detect)

  useEffect(() => {
    // Apenas escuta resize — não chama setMode sincronamente.
    function onResize() {
      setMode(prev => {
        const next = detect()
        return prev === next ? prev : next
      })
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return mode
}
