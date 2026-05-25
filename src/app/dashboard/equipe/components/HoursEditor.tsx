'use client'
// src/app/dashboard/equipe/components/HoursEditor.tsx

import { colors, typography, transitions } from '@/shared/theme'
import { HourSlot } from '@/features/professionals/types'
import { generateTimeOptions } from '@/features/professionals/utils/format'

interface Props {
  slots:    HourSlot[]
  onChange: (slots: HourSlot[]) => void
}

const DAYS_FULL = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
const TIME_OPTS = generateTimeOptions()

export default function HoursEditor({ slots, onChange }: Props) {
  // Segunda-domingo (ordem brasileira)
  const ordered = [1, 2, 3, 4, 5, 6, 0]

  function update(weekday: number, patch: Partial<HourSlot>) {
    onChange(slots.map(s => s.weekday === weekday ? { ...s, ...patch } : s))
  }

  return (
    <div>
      {ordered.map(wd => {
        const slot = slots.find(s => s.weekday === wd)
                  ?? { weekday: wd, open: false, startTime: '09:00', endTime: '18:00' }

        return (
          <div key={wd} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 0',
            borderBottom: `1px solid ${colors.gray.border}`,
          }}>
            {/* Toggle */}
            <button
              onClick={() => update(wd, { open: !slot.open })}
              aria-label={`${slot.open ? 'Desativar' : 'Ativar'} ${DAYS_FULL[wd]}`}
              style={{
                width: 40, height: 22, borderRadius: 11,
                border: 'none', cursor: 'pointer', padding: 0,
                background: slot.open ? colors.red.DEFAULT : colors.gray.borderMd,
                transition: `background ${transitions.fast}`,
                flexShrink: 0,
                position: 'relative',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <div style={{
                width: 18, height: 18, borderRadius: '50%',
                background: '#fff',
                position: 'absolute',
                top: 2,
                left: slot.open ? 'calc(100% - 20px)' : 2,
                transition: `left ${transitions.fast}`,
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
              }} />
            </button>

            <span style={{
              width: 100, fontSize: 13, fontWeight: 600,
              color: slot.open ? colors.gray[900] : colors.gray.dimText,
              flexShrink: 0,
            }}>
              {DAYS_FULL[wd]}
            </span>

            {slot.open ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                <select
                  value={slot.startTime}
                  onChange={e => update(wd, { startTime: e.target.value })}
                  style={selectStyle}
                >
                  {TIME_OPTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <span style={{ color: colors.gray.dimText, fontSize: 12 }}>–</span>
                <select
                  value={slot.endTime}
                  onChange={e => update(wd, { endTime: e.target.value })}
                  style={selectStyle}
                >
                  {TIME_OPTS.filter(t => t > slot.startTime).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            ) : (
              <span style={{
                fontSize: 13, color: colors.gray.dimText,
                fontStyle: 'italic', flex: 1,
              }}>
                Folga
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

const selectStyle: React.CSSProperties = {
  flex: 1, height: 34, padding: '0 8px',
  borderRadius: 8,
  border: `1px solid ${colors.gray.borderMd}`,
  fontSize: 13, outline: 'none',
  background: colors.background.page,
  fontFamily: typography.fontFamily,
  cursor: 'pointer',
}
