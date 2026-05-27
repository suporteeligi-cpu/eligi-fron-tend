'use client'
// src/app/dashboard/caixa/components/ProfPicker.tsx

import { Users, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { colors, typography, transitions } from '@/shared/theme'
import { ProfLite } from '@/features/sales/types'
import Avatar from './Avatar'

interface Props {
  professionals: ProfLite[]
  value:         string | null
  onChange:      (id: string | null) => void
  label?:        string
  disabled?:     boolean
  compact?:      boolean
}

export default function ProfPicker({
  professionals, value, onChange, label = 'Profissional', disabled, compact,
}: Props) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const selected = professionals.find(p => p.id === value)

  return (
    <div ref={wrapRef} style={{ position: 'relative', fontFamily: typography.fontFamily }}>
      <button
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        type="button"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: compact ? '7px 10px' : '10px 12px',
          background: colors.background.page,
          border: `1px solid ${colors.gray.borderMd}`,
          borderRadius: compact ? 8 : 11,
          cursor: disabled ? 'not-allowed' : 'pointer',
          textAlign: 'left',
          fontFamily: 'inherit',
          opacity: disabled ? 0.5 : 1,
          transition: `border-color ${transitions.fast}`,
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {selected ? (
          <>
            <Avatar name={selected.name} url={selected.avatarUrl} size={compact ? 22 : 28} />
            <div style={{ flex: 1, minWidth: 0 }}>
              {!compact && (
                <div style={{
                  fontSize: 10, fontWeight: 700,
                  color: colors.gray.dimText,
                  textTransform: 'uppercase',
                  letterSpacing: '.06em',
                  marginBottom: 1,
                }}>{label}</div>
              )}
              <div style={{
                fontSize: compact ? 12 : 13,
                fontWeight: 600,
                color: colors.gray[900],
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {selected.name}
              </div>
            </div>
          </>
        ) : (
          <>
            <Users size={compact ? 13 : 14} color={colors.gray.dimText} />
            <div style={{ flex: 1, minWidth: 0 }}>
              {!compact && (
                <div style={{
                  fontSize: 10, fontWeight: 700,
                  color: colors.gray.dimText,
                  textTransform: 'uppercase',
                  letterSpacing: '.06em',
                  marginBottom: 1,
                }}>{label}</div>
              )}
              <div style={{
                fontSize: compact ? 12 : 13,
                color: colors.gray.dimText,
                fontStyle: 'italic',
              }}>
                Sem profissional
              </div>
            </div>
          </>
        )}
        <ChevronDown size={12} color={colors.gray.dimText} />
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0, right: 0,
          maxHeight: 320,
          overflowY: 'auto',
          background: '#fff',
          borderRadius: 11,
          border: `1px solid ${colors.gray.border}`,
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          zIndex: 100,
        }}>
          <button
            onClick={() => { onChange(null); setOpen(false) }}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px',
              border: 'none',
              borderBottom: `1px solid ${colors.gray.border}`,
              background: value === null ? colors.red.subtle : 'transparent',
              cursor: 'pointer', textAlign: 'left',
              fontFamily: 'inherit',
              transition: `background ${transitions.fast}`,
            }}
            onMouseEnter={e => {
              if (value !== null) e.currentTarget.style.background = colors.gray.hover
            }}
            onMouseLeave={e => {
              if (value !== null) e.currentTarget.style.background = 'transparent'
            }}
          >
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              border: `1px dashed ${colors.gray.borderMd}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              fontSize: 10, color: colors.gray.dimText,
            }}>—</div>
            <span style={{ fontSize: 13, color: colors.gray[700], fontStyle: 'italic' }}>
              Sem profissional
            </span>
          </button>
          {professionals.map(p => (
            <button
              key={p.id}
              onClick={() => { onChange(p.id); setOpen(false) }}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px',
                border: 'none',
                borderBottom: `1px solid ${colors.gray.border}`,
                background: value === p.id ? colors.red.subtle : 'transparent',
                cursor: 'pointer', textAlign: 'left',
                fontFamily: 'inherit',
                transition: `background ${transitions.fast}`,
              }}
              onMouseEnter={e => {
                if (value !== p.id) e.currentTarget.style.background = colors.gray.hover
              }}
              onMouseLeave={e => {
                if (value !== p.id) e.currentTarget.style.background = 'transparent'
              }}
            >
              <Avatar name={p.name} url={p.avatarUrl} size={24} />
              <span style={{ fontSize: 13, fontWeight: 600, color: colors.gray[900] }}>
                {p.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
