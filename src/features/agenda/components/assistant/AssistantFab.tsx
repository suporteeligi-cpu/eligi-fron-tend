'use client'
// src/features/agenda/components/assistant/AssistantFab.tsx
// Botao flutuante do assistente. Arrastavel, gruda na lateral mais proxima e
// guarda a posicao como fracao (nao px) — assim a mesma conta sobrevive a troca
// de celular para desktop sem nascer fora da tela.

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ASSISTANT_Z,
  FAB_DEFAULT_Y_RATIO,
  FAB_DRAG_THRESHOLD_PX,
  FAB_MARGIN,
  FAB_SIZE,
  FAB_STORAGE_KEY,
  FAB_Y_MAX_RATIO,
  FAB_Y_MIN_RATIO,
  GLOBE_SRC,
} from './constants'

const KEYFRAMES = `
@keyframes eligi-fab-ping {
  0%   { transform: scale(0.9);  opacity: 0.8 }
  80%  { transform: scale(1.55); opacity: 0 }
  100% { opacity: 0 }
}
@keyframes eligi-fab-breathe {
  0%, 100% { transform: scale(0.92); opacity: 0.9 }
  50%      { transform: scale(1.04); opacity: 1 }
}
@media (prefers-reduced-motion: reduce) {
  .eligi-fab-ping, .eligi-fab-globe { animation: none !important }
}
`

type Side = 'left' | 'right'

interface StoredPosition {
  side: Side
  yRatio: number
}

function clampRatio(value: number): number {
  return Math.max(FAB_Y_MIN_RATIO, Math.min(FAB_Y_MAX_RATIO, value))
}

function readPosition(): StoredPosition {
  const fallback: StoredPosition = { side: 'right', yRatio: FAB_DEFAULT_Y_RATIO }
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(FAB_STORAGE_KEY)
    if (!raw) return fallback
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return fallback
    const record = parsed as Record<string, unknown>
    const side: Side = record.side === 'left' ? 'left' : 'right'
    const yRatio = typeof record.yRatio === 'number' && Number.isFinite(record.yRatio)
      ? clampRatio(record.yRatio)
      : FAB_DEFAULT_Y_RATIO
    return { side, yRatio }
  } catch {
    return fallback
  }
}

interface Props {
  onOpen: () => void
  /** Recolhe o botao enquanto o painel esta aberto. */
  hidden: boolean
}

export default function AssistantFab({ onOpen, hidden }: Props) {
  const [mounted, setMounted] = useState(false)
  const [position, setPosition] = useState<StoredPosition>({ side: 'right', yRatio: FAB_DEFAULT_Y_RATIO })
  const [dragging, setDragging] = useState(false)

  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const gestureRef = useRef<{
    pointerId: number
    offsetX: number
    offsetY: number
    startX: number
    startY: number
    moved: boolean
  } | null>(null)

  // Mount + hidratacao da posicao salva, sem setState sincrono no effect.
  useEffect(() => {
    const id = setTimeout(() => {
      setMounted(true)
      setPosition(readPosition())
    }, 0)
    return () => clearTimeout(id)
  }, [])

  const persist = useCallback((next: StoredPosition) => {
    try {
      window.localStorage.setItem(FAB_STORAGE_KEY, JSON.stringify(next))
    } catch {
      /* modo privativo / quota: a posicao apenas nao persiste */
    }
  }, [])

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    const node = buttonRef.current
    if (!node) return
    node.setPointerCapture(e.pointerId)
    const rect = node.getBoundingClientRect()
    gestureRef.current = {
      pointerId: e.pointerId,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
    }
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    const gesture = gestureRef.current
    const node = buttonRef.current
    if (!gesture || !node || gesture.pointerId !== e.pointerId) return

    if (!gesture.moved) {
      const travelled = Math.hypot(e.clientX - gesture.startX, e.clientY - gesture.startY)
      if (travelled <= FAB_DRAG_THRESHOLD_PX) return
      gesture.moved = true
      setDragging(true)
    }

    // Mutacao direta do DOM durante o arraste: um render por frame de dedo
    // seria desperdicio, e o React Compiler proibe ler ref.current no render.
    const x = Math.min(
      Math.max(e.clientX - gesture.offsetX, FAB_MARGIN),
      window.innerWidth - FAB_SIZE - FAB_MARGIN,
    )
    const y = Math.min(
      Math.max(e.clientY - gesture.offsetY, FAB_MARGIN),
      window.innerHeight - FAB_SIZE - FAB_MARGIN,
    )
    node.style.transition = 'none'
    node.style.left = `${x}px`
    node.style.right = 'auto'
    node.style.top = `${y}px`
    node.style.bottom = 'auto'
  }, [])

  const finishGesture = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    const gesture = gestureRef.current
    const node = buttonRef.current
    if (!gesture || !node || gesture.pointerId !== e.pointerId) return
    gestureRef.current = null

    if (node.hasPointerCapture(e.pointerId)) node.releasePointerCapture(e.pointerId)

    if (!gesture.moved) {
      onOpen()
      return
    }

    const rect = node.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const side: Side = centerX < window.innerWidth / 2 ? 'left' : 'right'
    const yRatio = clampRatio(rect.top / Math.max(1, window.innerHeight))
    const next: StoredPosition = { side, yRatio }

    // Devolve o controle ao React e deixa o CSS animar ate a borda.
    node.style.transition = ''
    node.style.left = ''
    node.style.right = ''
    node.style.top = ''
    node.style.bottom = ''

    setDragging(false)
    setPosition(next)
    persist(next)
  }, [onOpen, persist])

  if (!mounted) return null

  const horizontal = position.side === 'left'
    ? { left: FAB_MARGIN, right: 'auto' as const }
    : { right: FAB_MARGIN, left: 'auto' as const }

  return createPortal(
    <>
      <style>{KEYFRAMES}</style>
      <button
        ref={buttonRef}
        type="button"
        aria-label="Abrir o Assistente Eligi"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishGesture}
        onPointerCancel={finishGesture}
        style={{
          position: 'fixed',
          ...horizontal,
          top: `${position.yRatio * 100}vh`,
          width: FAB_SIZE, height: FAB_SIZE, borderRadius: '50%',
          zIndex: ASSISTANT_Z.fab,
          padding: 0, border: 'none',
          background: 'radial-gradient(circle at 34% 30%, #ff6a5a 0%, #dc2626 42%, #7a0f0f 100%)',
          boxShadow: dragging
            ? '0 0 0 1px rgba(255,255,255,0.25), 0 16px 36px rgba(220,38,38,0.65)'
            : '0 0 0 1px rgba(255,255,255,0.18), 0 10px 28px rgba(220,38,38,0.5), inset 0 0 14px rgba(255,180,150,0.35)',
          cursor: dragging ? 'grabbing' : 'grab',
          touchAction: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
          opacity: hidden ? 0 : 1,
          pointerEvents: hidden ? 'none' : 'auto',
          transition: dragging
            ? 'box-shadow 0.2s ease'
            : 'left 0.28s ease, right 0.28s ease, top 0.28s ease, opacity 0.25s ease, box-shadow 0.2s ease',
        }}
      >
        {!dragging && [0, 1].map(i => (
          <span
            key={i}
            className="eligi-fab-ping"
            aria-hidden="true"
            style={{
              position: 'absolute', inset: -6, borderRadius: '50%',
              border: '1.5px solid rgba(220,38,38,0.55)',
              animation: 'eligi-fab-ping 2.6s ease-out infinite',
              animationDelay: `${i * 1.3}s`,
              pointerEvents: 'none',
            }}
          />
        ))}
        <img
          className="eligi-fab-globe"
          src={GLOBE_SRC}
          alt=""
          aria-hidden="true"
          draggable={false}
          style={{
            position: 'absolute', inset: 9, width: 38, height: 38, objectFit: 'contain',
            filter: 'drop-shadow(0 0 6px rgba(220,38,38,0.8))',
            animation: 'eligi-fab-breathe 3.2s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />
      </button>
    </>,
    document.body,
  )
}
