'use client'
// src/app/dashboard/equipe/components/ServicesReadOnly.tsx

import { useState } from 'react'
import { Scissors, Search, Clock } from 'lucide-react'
import { colors, typography } from '@/shared/theme'
import { fmtDuration, fmtPrice } from '@/features/professionals/utils/format'

interface ServiceLite {
  id:        string
  name:      string
  duration:  number
  price?:    number | null
  color?:    string | null
}

interface Props {
  services: ServiceLite[]
  isMobile: boolean
}

export default function ServicesReadOnly({ services, isMobile }: Props) {
  const [q, setQ] = useState('')
  const filtered = services.filter(s =>
    s.name.toLowerCase().includes(q.toLowerCase())
  )

  if (services.length === 0) return (
    <div style={{
      padding: '40px 20px', textAlign: 'center',
      fontFamily: typography.fontFamily,
    }}>
      <Scissors size={28} color={colors.gray.dimText} style={{ opacity: 0.3, marginBottom: 10 }} />
      <div style={{ fontSize: 14, color: colors.gray.dimText, marginBottom: 4 }}>
        Nenhum serviço vinculado
      </div>
      <div style={{ fontSize: 12, color: colors.gray.dimTextLight }}>
        Clique em &ldquo;Editar&rdquo; para vincular serviços
      </div>
    </div>
  )

  return (
    <div style={{ fontFamily: typography.fontFamily }}>
      {services.length > 4 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px',
          borderRadius: 10,
          background: colors.background.page,
          border: `1px solid ${colors.gray.borderMd}`,
          marginBottom: 10,
        }}>
          <Search size={13} color={colors.gray.dimText} />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Pesquisar..."
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontSize: 13, background: 'transparent',
              fontFamily: typography.fontFamily,
              color: colors.gray[900],
            }}
          />
        </div>
      )}

      <div style={{
        fontSize: 10, fontWeight: 700,
        color: colors.gray.dimText,
        textTransform: 'uppercase',
        letterSpacing: '.07em',
        marginBottom: 8,
      }}>
        Serviços vinculados ({services.length})
      </div>

      {filtered.map((s) => (
        <div key={s.id} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: isMobile ? '12px 0' : '11px 12px',
          background: isMobile ? 'transparent' : colors.background.page,
          borderRadius: isMobile ? 0 : 9,
          marginBottom: isMobile ? 0 : 4,
          borderBottom: isMobile ? `1px solid ${colors.gray.border}` : 'none',
        }}>
          <div style={{
            width: 3, height: 28, borderRadius: 2,
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
            </div>
          </div>
          {s.price != null && (
            <span style={{
              fontSize: 13, fontWeight: 700,
              color: colors.gray[900],
              fontVariantNumeric: 'tabular-nums',
              flexShrink: 0,
            }}>
              {fmtPrice(s.price)}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
