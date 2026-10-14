'use client'
// src/features/agenda/components/assistant/OrbCanvas.tsx
// Casca fina em volta do OrbEngine. O engine e imperativo de proposito:
// nenhum frame de animacao passa pelo React.

import { useEffect, useImperativeHandle, useRef } from 'react'
import { OrbEngine } from './orbEngine'
import { AssistantState } from './constants'

export interface OrbHandle {
  setMicLevel: (level: number) => void
  setVoiceLevel: (level: number) => void
}

interface Props {
  state: AssistantState
  /** Lado do canvas em px (quadrado). */
  size: number
  /** Enquanto false o loop fica parado e nao consome bateria. */
  running: boolean
  ref?: React.Ref<OrbHandle>
}

export default function OrbCanvas({ state, size, running, ref }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const engineRef = useRef<OrbEngine | null>(null)

  useImperativeHandle(ref, () => ({
    setMicLevel:   (level: number) => engineRef.current?.setMicLevel(level),
    setVoiceLevel: (level: number) => engineRef.current?.setVoiceLevel(level),
  }), [])

  // Ciclo de vida do engine
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let engine: OrbEngine
    try {
      engine = new OrbEngine(canvas)
    } catch {
      return // Canvas 2D indisponivel: o painel segue utilizavel sem o orbe
    }
    engineRef.current = engine
    const onResize = () => engine.resize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      engine.destroy()
      engineRef.current = null
    }
  }, [])

  // Play/pause acompanha a visibilidade do painel
  useEffect(() => {
    const engine = engineRef.current
    if (!engine) return
    if (running) engine.start()
    else engine.stop()
  }, [running])

  // Pausa tambem quando a aba vai para segundo plano
  useEffect(() => {
    if (!running) return
    const onVisibility = () => {
      const engine = engineRef.current
      if (!engine) return
      if (document.hidden) engine.stop()
      else engine.start()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [running])

  useEffect(() => {
    engineRef.current?.setState(state)
  }, [state])

  useEffect(() => {
    engineRef.current?.resize()
  }, [size])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ width: size, height: size, display: 'block' }}
    />
  )
}
