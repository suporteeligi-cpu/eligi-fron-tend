'use client'
// src/app/dashboard/equipe/components/ServicesPicker.tsx

import { useState } from 'react'
import { Search, Clock, Check, Scissors } from 'lucide-react'
import { colors, typography, transitions } from '@/shared/theme'
import { ServiceItem } from '@/features/professionals/types'
import { fmtDuration, fmtPrice } from '@/features/professionals/utils/format'

interface Props {
  selected:    string[]
  allServices: ServiceItem[]
  onChange:    (ids: string[]) => void
}

export default function ServicesPicker({ selected, allServices, onChange }: Props) {
  const [q, setQ] = useState('')

  const filtered = allServices.filter(s =>
    s.name.toLowerCase().includes(q.toLowerCase())
  )

  function toggle(id: string) {
    onChange(
      selected.includes(id)
        ? selected.filter(x => x !== id)
        : [...selected, id]
    )
  }

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '9px 12px',
        borderRadius: 10,
        background: colors.background.page,
        border: `1px solid ${colors.gray.borderMd}`,
        marginBottom: 10,
      }}>
        <Search size={13} color={colors.gray.dimText} />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Pesquisar serviços..."
          style={{
            flex: 1, border: 'none', outline: 'none',
            fontSize: 13, background: 'transparent',
            fontFamily: typography.fontFamily,
            color: colors.gray[900],
          }}
        />
      </div>

      <div style={{
        maxHeight: 260, overflowY: 'auto',
        border: `1px solid ${colors.gray.border}`,
        borderRadius: 10, overflow: 'hidden',
      }}>
        {filtered.length === 0 ? (
          <div style={{
            padding: '32px 20px', textAlign: 'center',
            color: colors.gray.dimText, fontSize: 13,
          }}>
            <Scissors size={20} style={{ opacity: 0.3, marginBottom: 8 }} />
            <div>Nenhum serviço encontrado</div>
          </div>
        ) : filtered.map(s => {
          const isSel = selected.includes(s.id)
          return (
            <button
              key={s.id}
              onClick={() => toggle(s.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px',
                border: 'none',
                borderBottom: `1px solid ${colors.gray.border}`,
                background: isSel ? colors.red.subtle : 'transparent',
                cursor: 'pointer', textAlign: 'left',
                transition: `background ${transitions.fast}`,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <div style={{
                width: 3, height: 32, borderRadius: 2,
                background: s.color ?? colors.red.DEFAULT,
                flexShrink: 0,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: 600,
                  color: colors.gray[900],
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {s.name}
                </div>
                <div style={{
                  fontSize: 11, color: colors.gray.dimText, marginTop: 1,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <Clock size={10} strokeWidth={2} />
                  {fmtDuration(s.duration)}
                  {s.price != null && <> · {fmtPrice(s.price)}</>}
                </div>
              </div>
              <div style={{
                width: 20, height: 20, borderRadius: 6,
                border: isSel ? 'none' : `1.5px solid ${colors.gray.borderMd}`,
                background: isSel ? colors.red.DEFAULT : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {isSel && <Check size={12} color="#fff" strokeWidth={3} />}
              </div>
            </button>
          )
        })}
      </div>

      <div style={{ marginTop: 8, fontSize: 12, color: colors.gray.dimText }}>
        {selected.length} serviço{selected.length !== 1 ? 's' : ''} selecionado{selected.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}
