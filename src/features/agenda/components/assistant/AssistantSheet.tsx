'use client'
// src/features/agenda/components/assistant/AssistantSheet.tsx
// Painel do Assistente Eligi. Montado via portal no <body> para escapar do
// stacking context da pagina da agenda (position:fixed com zIndex:1) — sem
// isto o scrim passaria por baixo da AppNavbar.
//
// Ciclo: idle -> listening (fala) -> thinking (consulta) -> speaking (resposta)
// -> idle. Cada transicao vem de um evento real, nunca de um timer.

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Keyboard, Mic, Send, X } from 'lucide-react'

import OrbCanvas, { OrbHandle } from './OrbCanvas'
import { useMicLevel } from './useMicLevel'
import { useSpeechRecognition } from './useSpeechRecognition'
import { useSpeechSynthesis } from './useSpeechSynthesis'
import { askAssistant } from './assistant.api'
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
  const [mounted, setMounted]       = useState(false)
  const [state, setState]           = useState<AssistantState>('idle')
  const [micError, setMicError]     = useState<MicError | null>(null)
  const [orbSize, setOrbSize]       = useState(286)
  const [transcript, setTranscript] = useState('')
  const [answer, setAnswer]         = useState('')
  const [typed, setTyped]           = useState('')
  const [typing, setTyping]         = useState(false)

  const orbRef = useRef<OrbHandle | null>(null)

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(id)
  }, [])

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

  /* ─── sinais que alimentam o orbe ────────────────────────────────────── */

  const handleMicLevel = useCallback((level: number) => {
    orbRef.current?.setMicLevel(level)
  }, [])

  const handleVoiceLevel = useCallback((level: number) => {
    orbRef.current?.setVoiceLevel(level)
  }, [])

  // O analyser e apenas o medidor visual. Se ele falhar (dois consumidores do
  // mesmo microfone), o reconhecimento de fala segue funcionando: nao vale
  // derrubar a feature por causa do brilho do orbe.
  const ignoreMicMeterError = useCallback(() => { /* silencioso */ }, [])

  const mic = useMicLevel({ onLevel: handleMicLevel, onError: ignoreMicMeterError })

  const handleSpeechEnd = useCallback(() => setState('idle'), [])
  const speech = useSpeechSynthesis({ onLevel: handleVoiceLevel, onEnd: handleSpeechEnd })

  /* ─── consulta ───────────────────────────────────────────────────────── */

  const runQuery = useCallback(async (text: string) => {
    setState('thinking')
    setTranscript(text)
    setAnswer('')
    const result = await askAssistant(text)
    setAnswer(result.answer)
    if (speech.supported && speech.speak(result.answer)) {
      setState('speaking')
    } else {
      // Sem voz disponivel a resposta fica na tela. Nenhum estado morto.
      setState('idle')
    }
  }, [speech])

  /* ─── reconhecimento de fala ─────────────────────────────────────────── */

  const handlePartial = useCallback((text: string) => setTranscript(text), [])

  const handleFinal = useCallback((text: string) => {
    mic.stop()
    void runQuery(text)
  }, [mic, runQuery])

  const handleSttError = useCallback((error: MicError) => {
    mic.stop()
    setMicError(error)
    setState('idle')
  }, [mic])

  const handleEmpty = useCallback(() => {
    mic.stop()
    setState(prev => (prev === 'listening' ? 'idle' : prev))
  }, [mic])

  const recognition = useSpeechRecognition({
    onPartial: handlePartial,
    onFinal: handleFinal,
    onError: handleSttError,
    onEmpty: handleEmpty,
  })

  const stopAll = useCallback(() => {
    recognition.stop()
    mic.stop()
    speech.cancel()
  }, [recognition, mic, speech])

  const toggleListening = useCallback(() => {
    if (state === 'listening') {
      recognition.stop()
      mic.stop()
      setState('idle')
      return
    }
    if (state === 'speaking') {
      speech.cancel()
      setState('idle')
      return
    }
    if (state === 'thinking') return

    setMicError(null)
    setTranscript('')
    setAnswer('')

    if (!recognition.supported) {
      setMicError('unsupported')
      return
    }
    if (recognition.start()) {
      setState('listening')
      void mic.start()
    }
  }, [state, recognition, mic, speech])

  const submitTyped = useCallback(() => {
    const text = typed.trim()
    if (text.length === 0) return
    setTyped('')
    setTyping(false)
    void runQuery(text)
  }, [typed, runQuery])

  /* ─── ciclo de vida do painel ────────────────────────────────────────── */

  useEffect(() => {
    if (open) return
    stopAll()
    const id = setTimeout(() => {
      setState('idle')
      setTranscript('')
      setAnswer('')
      setTyping(false)
      setTyped('')
    }, 0)
    return () => clearTimeout(id)
  }, [open, stopAll])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!mounted) return null

  const listening = state === 'listening'
  const busy = state === 'thinking'
  const blocked = micError !== null
  const showComposer = SHOW_TEXT_FALLBACK && (blocked || typing)

  const label = blocked
    ? MIC_ERROR_LABEL[micError]
    : answer !== '' && !listening
      ? answer
      : STATE_LABEL[state]

  return createPortal(
    <>
      <style>{KEYFRAMES}</style>

      {/* O blur mora no scrim, nao na agenda: zero acoplamento com a grade. */}
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
          <span style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: '0.14em', color: 'rgba(244,244,245,0.34)' }}>
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
            fontSize: 14, fontWeight: 500, minHeight: 40, marginTop: -6,
            maxWidth: '92%', textAlign: 'center', lineHeight: 1.4,
            color: blocked ? '#ffb3a3' : listening ? '#ff8f7d' : 'rgba(244,244,245,0.86)',
            transition: 'color 0.3s ease',
          }}
        >
          {label}
        </div>

        {transcript !== '' && (
          <div style={{
            fontSize: 12, fontStyle: 'italic', marginTop: 2, maxWidth: '92%',
            textAlign: 'center', color: 'rgba(244,244,245,0.34)',
          }}>
            {transcript}
          </div>
        )}

        <div style={{
          marginTop: 14, width: '100%',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        }}>
          <button
            type="button"
            onClick={toggleListening}
            aria-label={listening ? 'Parar de escutar' : 'Falar com o assistente'}
            aria-pressed={listening}
            disabled={busy || blocked}
            style={{
              position: 'relative', width: 76, height: 76, borderRadius: '50%',
              display: 'grid', placeItems: 'center', padding: 0, border: 'none',
              background: 'transparent',
              cursor: busy || blocked ? 'not-allowed' : 'pointer',
              opacity: blocked ? 0.38 : busy ? 0.6 : 1,
              filter: blocked ? 'grayscale(0.7)' : 'none',
              transition: 'opacity 0.25s ease, filter 0.25s ease',
            }}
          >
            {!blocked && [0, 1].map(i => (
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

          {showComposer ? (
            <div style={{ display: 'flex', gap: 8, width: '100%' }}>
              <input
                value={typed}
                onChange={e => setTyped(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') submitTyped() }}
                placeholder="Pergunte sobre a agenda"
                maxLength={300}
                style={{
                  flex: 1, borderRadius: 14, padding: '11px 14px', fontSize: 14,
                  border: '1px solid rgba(255,255,255,0.09)',
                  background: 'rgba(255,255,255,0.05)', color: '#f4f4f5', outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={submitTyped}
                aria-label="Enviar pergunta"
                style={{
                  width: 44, borderRadius: 14, display: 'grid', placeItems: 'center',
                  border: '1px solid rgba(220,38,38,0.4)', background: 'rgba(220,38,38,0.16)',
                  color: '#ff8a7a', cursor: 'pointer',
                }}
              >
                <Send size={17} />
              </button>
            </div>
          ) : SHOW_TEXT_FALLBACK ? (
            <button
              type="button"
              onClick={() => setTyping(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer',
                fontSize: 12, padding: '7px 12px', borderRadius: 10,
                color: 'rgba(244,244,245,0.34)', background: 'transparent', border: 'none',
              }}
            >
              <Keyboard size={15} />
              Escrever
            </button>
          ) : null}
        </div>
      </div>
    </>,
    document.body,
  )
}
