'use client'
// src/features/agenda/components/assistant/AssistantSheet.tsx
// Painel do Assistente Eligi. Montado via portal no <body> para escapar do
// stacking context da pagina da agenda (position:fixed com zIndex:1) — sem
// isto o scrim passaria por baixo da AppNavbar.

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Keyboard, Mic, X } from 'lucide-react'

import OrbCanvas, { OrbHandle } from './OrbCanvas'
import { useMicLevel } from './useMicLevel'
import {
  ASSISTANT_Z,
  AssistantState,
  MIC_ERROR_LABEL,
  MicError,
  SHEET_MAX_WIDTH,
  SHOW_TEXT_FALLBACK,
  STATE_LABEL,
} from './constants'

const KEYFRAMES = `
@keyframes eligi-assistant-halo {
  0%   { transform: scale(1);   opacity: 0.65 }
  100% { transform: scale(1.9); opacity: 0 }
}
@media (prefers-reduced-motion: reduce) {
  .eligi-assistant-wave { animation: none !important; opacity: 0.3 !important }
}
`

interface Props {
  open: boolean
  onClose: () => void
}

export default function AssistantSheet({ open, onClose }: Props) {
  const [mounted, setMounted]   = useState(false)
  const [state, setState]       = useState<AssistantState>('idle')
  const [micError, setMicError] = useState<MicError | null>(null)
  const [orbSize, setOrbSize]   = useState(286)

  const orbRef = useRef<OrbHandle | null>(null)

  // Portal so existe no cliente. setTimeout evita setState sincrono no effect.
  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(id)
  }, [])

  // Orbe acompanha a largura da tela sem estourar o painel
  useEffect(() => {
    const measure = () => {
      const width = Math.min(window.innerWidth, SHEET_MAX_WIDTH)
      setOrbSize(prev => {
        const next = Math.round(Math.max(200, Math.min(300, width * 0.74)))
        return prev === next ? prev : next
      })
    }
    const id = setTimeout(measure, 0)
    window.addEventListener('resize', measure)
    return () => {
      clearTimeout(id)
      window.removeEventListener('resize', measure)
    }
  }, [])

  const handleLevel = useCallback((level: number) => {
    orbRef.current?.setMicLevel(level)
  }, [])

  const handleMicError = useCallback((error: MicError) => {
    setMicError(error)
    setState('idle')
  }, [])

  const mic = useMicLevel({ onLevel: handleLevel, onError: handleMicError })

  const stopListening = useCallback(() => {
    mic.stop()
    setState('idle')
  }, [mic])

  const toggleListening = useCallback(() => {
    if (state === 'listening') {
      stopListening()
      return
    }
    setMicError(null)
    void mic.start().then(ok => {
      if (ok) setState('listening')
    })
  }, [state, mic, stopListening])

  // Fechar o painel encerra a captura: o microfone nunca sobrevive ao fechamento.
  useEffect(() => {
    if (open) return
    mic.stop()
    const id = setTimeout(() => setState('idle'), 0)
    return () => clearTimeout(id)
  }, [open, mic])

  // Escape fecha
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!mounted) return null

  const listening = state === 'listening'
  const label = micError ? MIC_ERROR_LABEL[micError] : STATE_LABEL[state]
  const showFallback = SHOW_TEXT_FALLBACK && micError !== null

  return createPortal(
    <>
      <style>{KEYFRAMES}</style>

      {/* Scrim: o blur mora aqui, nao na agenda. Zero acoplamento com a grade. */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: 'fixed', inset: 0, zIndex: ASSISTANT_Z.scrim,
          background: 'rgba(9,9,14,0.62)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Assistente Eligi"
        style={{
          position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: ASSISTANT_Z.sheet,
          margin: '0 auto', maxWidth: SHEET_MAX_WIDTH,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '12px 18px calc(20px + env(safe-area-inset-bottom))',
          borderRadius: '28px 28px 0 0',
          border: '1px solid rgba(255,255,255,0.09)', borderBottom: 'none',
          background: 'linear-gradient(180deg, rgba(17,17,23,0.94), rgba(10,10,14,0.97))',
          backdropFilter: 'blur(24px) saturate(1.25)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.25)',
          boxShadow: '0 -18px 60px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.07)',
          transform: open ? 'translateY(0)' : 'translateY(105%)',
          transition: 'transform 0.4s cubic-bezier(0.32,0.72,0.24,1)',
          fontFamily: '-apple-system,"SF Pro Display",system-ui,sans-serif',
          visibility: open ? 'visible' : 'hidden',
        }}
      >
        <div style={{ width: 38, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)', marginBottom: 6 }} />

        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{
            fontSize: 11.5, fontWeight: 600, letterSpacing: '0.14em',
            color: 'rgba(244,244,245,0.34)',
          }}>
            ASSISTENTE ELIGI
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar assistente"
            style={{
              width: 28, height: 28, borderRadius: '50%', display: 'grid', placeItems: 'center',
              border: '1px solid rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.06)',
              color: 'rgba(244,244,245,0.58)', cursor: 'pointer', padding: 0,
            }}
          >
            <X size={14} />
          </button>
        </div>

        <OrbCanvas ref={orbRef} state={state} size={orbSize} running={open} />

        <div
          aria-live="polite"
          style={{
            fontSize: 13.5, fontWeight: 500, minHeight: 20, marginTop: -6,
            color: micError ? '#ffb3a3' : listening ? '#ff8f7d' : 'rgba(244,244,245,0.58)',
            transition: 'color 0.3s ease',
          }}
        >
          {label}
        </div>

        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          {/* Mic 2 — halo pulsante */}
          <button
            type="button"
            onClick={toggleListening}
            aria-label={listening ? 'Parar de escutar' : 'Falar com o assistente'}
            aria-pressed={listening}
            style={{
              position: 'relative', width: 76, height: 76, borderRadius: '50%',
              display: 'grid', placeItems: 'center', padding: 0, border: 'none',
              background: 'transparent', cursor: micError ? 'not-allowed' : 'pointer',
              opacity: micError ? 0.38 : 1,
              filter: micError ? 'grayscale(0.7)' : 'none',
              transition: 'opacity 0.25s ease, filter 0.25s ease',
            }}
          >
            {!micError && [0, 1].map(i => (
              <span
                key={i}
                className="eligi-assistant-wave"
                aria-hidden="true"
                style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  border: '1.5px solid rgba(220,38,38,0.5)',
                  animation: 'eligi-assistant-halo 2.2s ease-out infinite',
                  animationDelay: `${i * 1.1}s`,
                }}
              />
            ))}
            <span
              aria-hidden="true"
              style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: listening ? 'rgba(220,38,38,0.26)' : 'rgba(220,38,38,0.14)',
                border: '1.5px solid rgba(220,38,38,0.55)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                transition: 'background 0.25s ease',
              }}
            />
            <Mic size={26} color="#ffffff" strokeWidth={2} style={{ position: 'relative', zIndex: 1 }} />
          </button>

          {showFallback && (
            <button
              type="button"
              onClick={onClose}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer',
                fontSize: 12, padding: '7px 12px', borderRadius: 10,
                color: '#ffb3a3', background: 'rgba(220,38,38,0.13)',
                border: '1px solid rgba(220,38,38,0.3)',
              }}
            >
              <Keyboard size={15} />
              Escrever o pedido
            </button>
          )}
        </div>
      </div>
    </>,
    document.body,
  )
}
