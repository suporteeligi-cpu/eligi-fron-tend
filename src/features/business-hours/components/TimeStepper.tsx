'use client'
// src/features/business-hours/components/TimeStepper.tsx
// @eligi:business-hours-stepper
//
// Substitui o <select> nativo de horario. O select abria roleta no iOS e
// dialogo no Android, com alvo de toque abaixo de 44px, e exigia uma lista de
// 48 opcoes em memoria (generateTimeOptions) so para escolher um horario.
//
// Aqui o valor e sempre visivel e o ajuste e de 15 em 15 minutos. Segurar o
// botao acelera: 500ms para engatar, depois um passo a cada 90ms.

import { useCallback, useEffect, useRef, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { STEP_MINUTES, shiftTime } from '../types'

const HOLD_DELAY_MS  = 500
const HOLD_REPEAT_MS = 90

interface TimeStepperProps {
  value:     string
  onChange:  (next: string) => void
  disabled?: boolean
  invalid?:  boolean
  /** Lido por leitor de tela: "Abre", "Fecha". */
  label:     string
}

export default function TimeStepper({
  value, onChange, disabled = false, invalid = false, label,
}: TimeStepperProps) {
  const [holding, setHolding] = useState<'down' | 'up' | null>(null)

  // Callback em ref: o intervalo nao pode capturar um onChange velho.
  const onChangeRef = useRef(onChange)
  const valueRef    = useRef(value)
  useEffect(() => { onChangeRef.current = onChange })
  useEffect(() => { valueRef.current = value })

  useEffect(() => {
    if (!holding || disabled) return

    const delta = holding === 'up' ? STEP_MINUTES : -STEP_MINUTES
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
  }, [holding, disabled])

  const step = useCallback((delta: number) => {
    if (disabled) return
    onChangeRef.current(shiftTime(valueRef.current, delta))
  }, [disabled])

  const btn: React.CSSProperties = {
    width: 40, height: 44, borderRadius: 11, border: 'none',
    background: 'transparent', display: 'flex', alignItems: 'center',
    justifyContent: 'center', cursor: disabled ? 'default' : 'pointer',
    color: disabled ? 'rgba(0,0,0,0.18)' : 'rgba(0,0,0,0.42)',
    transition: 'background 0.15s, color 0.15s', padding: 0,
    touchAction: 'manipulation',
  }

  const holdProps = (dir: 'down' | 'up') => ({
    onPointerDown: () => setHolding(dir),
    onPointerUp:   () => setHolding(null),
    onPointerLeave:() => setHolding(null),
    onPointerCancel: () => setHolding(null),
  })

  return (
    <div
      className="bh-stepper"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 2, padding: 3,
        borderRadius: 14, flexShrink: 0,
        background: disabled ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.045)',
        border: invalid ? '1px solid rgba(220,38,38,0.45)' : '1px solid transparent',
      }}
    >
      <button
        type="button"
        style={btn}
        disabled={disabled}
        aria-label={`Diminuir ${label} em 15 minutos`}
        onClick={() => step(-STEP_MINUTES)}
        {...holdProps('down')}
      >
        <Minus size={16} strokeWidth={2.4} />
      </button>

      <span
        aria-live="polite"
        style={{
          minWidth: 62, textAlign: 'center', padding: '0 2px',
          fontFamily: '"Space Grotesk",-apple-system,system-ui,sans-serif',
          fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em',
          fontVariantNumeric: 'tabular-nums',
          color: disabled ? 'rgba(0,0,0,0.28)' : invalid ? '#b91c1c' : '#0f0f14',
        }}
      >
        {value}
      </span>

      <button
        type="button"
        style={btn}
        disabled={disabled}
        aria-label={`Aumentar ${label} em 15 minutos`}
        onClick={() => step(STEP_MINUTES)}
        {...holdProps('up')}
      >
        <Plus size={16} strokeWidth={2.4} />
      </button>
    </div>
  )
}
