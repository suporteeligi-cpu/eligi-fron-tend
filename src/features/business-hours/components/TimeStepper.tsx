'use client'
// src/features/business-hours/components/TimeStepper.tsx
// @eligi:business-hours-stepper
// @eligi:stepper-v2-editable
//
// Seletor de horario. Substitui tanto o <select> nativo (48 opcoes em memoria
// via generateTimeOptions) quanto a roleta de scroll do painel de agendamento,
// que gastava 100px de altura para mostrar um numero e tinha alvo de toque
// abaixo do minimo.
//
// Tres formas de mexer no valor, porque nenhuma sozinha resolve:
//   - toque simples nos botoes: um passo
//   - toque longo: acelera (500ms para engatar, depois um passo a cada 90ms)
//   - toque no numero: vira campo de texto e voce digita
//
// O terceiro nao e luxo. Com passo de 5 min, ir de 10:40 ate 15:00 sao 52
// cliques; digitando sao dois toques e quatro digitos.

import { useCallback, useEffect, useRef, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { STEP_MINUTES, shiftTime, toMinutes, toTime } from '../types'

const HOLD_DELAY_MS  = 500
const HOLD_REPEAT_MS = 90

/** '1500' | '15:00' | '15' -> 'HH:mm'. Retorna null se nao der para entender. */
export function parseTimeInput(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 0 || digits.length > 4) return null

  let h: number
  let m: number
  if (digits.length <= 2) {
    h = Number(digits)
    m = 0
  } else {
    h = Number(digits.slice(0, digits.length - 2))
    m = Number(digits.slice(-2))
  }
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  if (h > 23 || m > 59) return null
  return toTime(h * 60 + m)
}

interface TimeStepperProps {
  value:     string
  onChange:  (next: string) => void
  disabled?: boolean
  invalid?:  boolean
  /** Lido por leitor de tela: "abertura", "inicio". */
  label:     string
  /** Minutos por passo. 15 no horario de funcionamento, 5 no agendamento. */
  step?:     number
  /** Toque no numero abre teclado para digitar. */
  editable?: boolean
  /** 'md' no horario de funcionamento, 'lg' no painel de agendamento. */
  size?:     'md' | 'lg'
}

export default function TimeStepper({
  value, onChange, disabled = false, invalid = false, label,
  step = STEP_MINUTES, editable = true, size = 'md',
}: TimeStepperProps) {
  const [holding, setHolding] = useState<'down' | 'up' | null>(null)
  const [draft, setDraft]     = useState<string | null>(null)

  // Callback e valor em ref: trocar a funcao nao pode derrubar o intervalo,
  // e o tick precisa do valor mais recente sem recriar o efeito.
  const onChangeRef = useRef(onChange)
  const valueRef    = useRef(value)
  useEffect(() => { onChangeRef.current = onChange })
  useEffect(() => { valueRef.current = value })

  useEffect(() => {
    if (!holding || disabled) return

    const delta = holding === 'up' ? step : -step
    const tick  = () => {
      const next = shiftTime(valueRef.current, delta)
      valueRef.current = next
      onChangeRef.current(next)
    }

    let interval: ReturnType<typeof setInterval> | null = null
    const timeout = setTimeout(() => {
      tick()
      interval = setInterval(tick, HOLD_REPEAT_MS)
    }, HOLD_DELAY_MS)

    return () => {
      clearTimeout(timeout)
      if (interval) clearInterval(interval)
    }
  }, [holding, disabled, step])

  const bump = useCallback((delta: number) => {
    if (disabled) return
    onChangeRef.current(shiftTime(valueRef.current, delta))
  }, [disabled])

  const commitDraft = useCallback(() => {
    const raw = draft
    setDraft(null)
    if (raw == null) return
    const parsed = parseTimeInput(raw)
    // Entrada invalida volta ao valor anterior em silencio: e menos hostil
    // do que uma mensagem de erro para quem so errou um digito.
    if (parsed && parsed !== valueRef.current) onChangeRef.current(parsed)
  }, [draft])

  const big  = size === 'lg'
  const btnW = big ? 52 : 40
  const btnH = big ? 56 : 44

  const btnStyle: React.CSSProperties = {
    width: btnW, height: btnH, borderRadius: big ? 13 : 11, border: 'none',
    background: big ? '#fff' : 'transparent',
    boxShadow: big ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: disabled ? 'default' : 'pointer', padding: 0, flexShrink: 0,
    color: disabled ? 'rgba(0,0,0,0.18)' : 'rgba(0,0,0,0.45)',
    transition: 'background 0.15s, color 0.15s', touchAction: 'manipulation',
  }

  const holdProps = (dir: 'down' | 'up') => ({
    onPointerDown:   () => setHolding(dir),
    onPointerUp:     () => setHolding(null),
    onPointerLeave:  () => setHolding(null),
    onPointerCancel: () => setHolding(null),
  })

  const valueStyle: React.CSSProperties = {
    flex: 1, minWidth: big ? 74 : 62, textAlign: 'center', padding: '0 2px',
    fontFamily: '"Space Grotesk",-apple-system,system-ui,sans-serif',
    fontWeight: 700, fontSize: big ? 28 : 17, letterSpacing: '-0.03em',
    fontVariantNumeric: 'tabular-nums', border: 'none', background: 'transparent',
    color: disabled ? 'rgba(0,0,0,0.28)' : invalid ? '#b91c1c' : '#0f0f14',
    outline: 'none', width: '100%',
  }

  return (
    <div
      className="bh-stepper"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: big ? 6 : 2,
        padding: big ? 5 : 3, borderRadius: big ? 17 : 14, flexShrink: 0,
        background: draft !== null ? '#fff' : disabled ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.045)',
        border: draft !== null
          ? '1.5px solid #dc2626'
          : invalid ? '1.5px solid rgba(220,38,38,0.45)' : '1.5px solid transparent',
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      <button
        type="button"
        style={btnStyle}
        disabled={disabled || draft !== null}
        aria-label={`Diminuir ${label} em ${step} minutos`}
        onClick={() => bump(-step)}
        {...holdProps('down')}
      >
        <Minus size={big ? 20 : 16} strokeWidth={2.4} />
      </button>

      {draft !== null ? (
        <input
          autoFocus
          type="text"
          inputMode="numeric"
          value={draft}
          aria-label={label}
          onChange={e => setDraft(e.target.value.replace(/[^\d:]/g, '').slice(0, 5))}
          onBlur={commitDraft}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); commitDraft() }
            if (e.key === 'Escape') { e.preventDefault(); setDraft(null) }
          }}
          style={valueStyle}
        />
      ) : (
        <span
          role={editable && !disabled ? 'button' : undefined}
          tabIndex={editable && !disabled ? 0 : undefined}
          aria-label={editable && !disabled ? `${label}: ${value}. Toque para digitar` : undefined}
          onClick={() => { if (editable && !disabled) setDraft(value) }}
          onKeyDown={e => {
            if (!editable || disabled) return
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDraft(value) }
          }}
          style={{ ...valueStyle, cursor: editable && !disabled ? 'text' : 'default' }}
        >
          {value}
        </span>
      )}

      <button
        type="button"
        style={btnStyle}
        disabled={disabled || draft !== null}
        aria-label={`Aumentar ${label} em ${step} minutos`}
        onClick={() => bump(step)}
        {...holdProps('up')}
      >
        <Plus size={big ? 20 : 16} strokeWidth={2.4} />
      </button>
    </div>
  )
}

/** Duracao entre dois horarios, em minutos. Negativo vira 0. */
export function spanMinutes(start: string, end: string): number {
  const diff = toMinutes(end) - toMinutes(start)
  return Number.isNaN(diff) || diff < 0 ? 0 : diff
}
