'use client'
// src/features/business-hours/components/DayCard.tsx
// @eligi:business-hours-daycard
//
// Um dia da semana como cartao. Substitui a linha em flex rigido que estourava
// os 390px do celular: o segundo horario ficava cortado e o botao de replicar
// simplesmente nao aparecia.
//
// O cartao empilha no mobile e entra em grid no desktop -- quem decide isso e
// a media query do grid pai, nunca JavaScript de largura.

import { Ban, Copy, Plus } from 'lucide-react'
import TimeStepper from './TimeStepper'
import {
  DAY_NAMES, DAY_SHORT, durationLabel, isSlotInvalid, slotMinutes,
  type HourSlot,
} from '../types'

interface DayCardProps {
  slot:        HourSlot
  onToggle:    (open: boolean) => void
  onStart:     (time: string) => void
  onEnd:       (time: string) => void
  onReplicate: () => void
  /** Quantos outros dias estao abertos: define se replicar faz sentido. */
  replicateTargets: number
}

export default function DayCard({
  slot, onToggle, onStart, onEnd, onReplicate, replicateTargets,
}: DayCardProps) {
  const invalid  = isSlotInvalid(slot)
  const duration = durationLabel(slotMinutes(slot))
  const name     = DAY_NAMES[slot.weekday] ?? `Dia ${slot.weekday}`
  const short    = DAY_SHORT[slot.weekday] ?? ''

  return (
    <div
      style={{
        position: 'relative', overflow: 'hidden',
        background: slot.open ? '#fff' : 'rgba(0,0,0,0.015)',
        border: invalid ? '1px solid rgba(220,38,38,0.35)' : '1px solid rgba(0,0,0,0.07)',
        borderRadius: 18, padding: '16px 16px 16px 20px',
        boxShadow: slot.open ? '0 2px 14px rgba(15,15,20,0.05)' : 'none',
        transition: 'background 0.18s, box-shadow 0.18s, border-color 0.18s',
      }}
    >
      {/* Trilho lateral: le o estado do dia sem precisar de texto */}
      <span
        aria-hidden
        style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
          background: invalid ? '#dc2626' : slot.open ? '#10b981' : 'rgba(0,0,0,0.10)',
          transition: 'background 0.18s',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: slot.open ? 14 : 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 15.5, fontWeight: 700, letterSpacing: '-0.015em',
            color: slot.open ? '#0f0f14' : 'rgba(0,0,0,0.42)',
          }}>
            {name}
          </div>
          <div style={{ fontSize: 11, letterSpacing: '0.07em', color: 'rgba(0,0,0,0.32)', marginTop: 1 }}>
            {short}
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={slot.open}
          aria-label={`${slot.open ? 'Fechar' : 'Abrir'} ${name}`}
          onClick={() => onToggle(!slot.open)}
          style={{
            width: 46, height: 28, borderRadius: 14, border: 'none', flexShrink: 0,
            background: slot.open ? '#10b981' : 'rgba(0,0,0,0.13)',
            position: 'relative', cursor: 'pointer', padding: 0,
            transition: 'background 0.18s', touchAction: 'manipulation',
          }}
        >
          <span style={{
            position: 'absolute', top: 3, left: slot.open ? 21 : 3,
            width: 22, height: 22, borderRadius: '50%', background: '#fff',
            boxShadow: '0 1px 4px rgba(0,0,0,0.20)',
            transition: 'left 0.18s cubic-bezier(0.34,1.56,0.64,1)',
          }} />
        </button>
      </div>

      {slot.open ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <TimeStepper value={slot.startTime} onChange={onStart} label="abertura" invalid={invalid} />
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'rgba(0,0,0,0.32)' }}>até</span>
            <TimeStepper value={slot.endTime} onChange={onEnd} label="fechamento" invalid={invalid} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
            {invalid ? (
              <span style={{
                fontSize: 12, fontWeight: 700, borderRadius: 8, padding: '5px 9px',
                background: 'rgba(220,38,38,0.08)', color: '#b91c1c',
              }}>
                Fim antes do início
              </span>
            ) : (
              <span style={{
                fontSize: 12, fontWeight: 700, borderRadius: 8, padding: '5px 9px',
                background: 'rgba(16,185,129,0.10)', color: '#0f6e56',
                fontFamily: '"Space Grotesk",-apple-system,system-ui,sans-serif',
                letterSpacing: '-0.01em',
              }}>
                {duration}
              </span>
            )}

            {replicateTargets > 0 && !invalid && (
              <button
                type="button"
                className="bh-ghost"
                onClick={onReplicate}
                title={`Aplicar ${slot.startTime}–${slot.endTime} nos outros ${replicateTargets} dias abertos`}
              >
                <Copy size={14} strokeWidth={2} />
                Replicar
              </button>
            )}
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            display: 'flex', alignItems: 'center', gap: 7, flex: 1,
            fontSize: 13.5, color: 'rgba(0,0,0,0.34)', minHeight: 44,
          }}>
            <Ban size={15} strokeWidth={2} />
            Fechado o dia todo
          </span>
          <button type="button" className="bh-ghost" onClick={() => onToggle(true)}>
            <Plus size={14} strokeWidth={2.2} />
            Definir horário
          </button>
        </div>
      )}
    </div>
  )
}
