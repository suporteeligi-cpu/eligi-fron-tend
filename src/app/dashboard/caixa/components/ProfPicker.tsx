'use client'
// src/app/dashboard/caixa/components/ProfPicker.tsx
//
// Seletor de profissional por item do carrinho.
// O dropdown é PORTALIZADO (createPortal + position:fixed) para escapar dos
// overflow:hidden (CartItemRow) e overflow:auto (CartPanel) que o clipavam.
// Reposiciona no scroll/resize enquanto aberto. React-Compiler-safe: leitura de
// layout só em useLayoutEffect, nunca no render body.

import { Users, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
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
  /** Quando false, oculta a opção "Sem profissional" (venda de funcionário sempre tem dono). */
  allowNone?:    boolean
}

interface Coords { top: number; left: number; width: number }

export default function ProfPicker({
  professionals, value, onChange, label = 'Profissional', disabled, compact, allowNone = true,
}: Props) {
  const [open,   setOpen]   = useState(false)
  const [coords, setCoords] = useState<Coords | null>(null)
  const btnRef  = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Calcula a posição do menu a partir do botão (fixed → viewport-relative).
  const recalc = useCallback(() => {
    const el = btnRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setCoords({ top: r.bottom + 4, left: r.left, width: r.width })
  }, [])

  // Posiciona ao abrir + acompanha scroll/resize (capture pega scroll de qualquer ancestral).
  useLayoutEffect(() => {
    if (!open) return
    recalc()
    window.addEventListener('scroll',  recalc, true)
    window.addEventListener('resize',  recalc)
    return () => {
      window.removeEventListener('scroll',  recalc, true)
      window.removeEventListener('resize',  recalc)
    }
  }, [open, recalc])

  // Click-outside: ignora cliques no botão E no menu portalizado.
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      const t = e.target as Node
      if (btnRef.current?.contains(t))  return
      if (menuRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const selected = professionals.find(p => p.id === value)

  const menu = open && coords ? createPortal(
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: coords.top,
        left: coords.left,
        width: coords.width,
        maxHeight: 'min(320px, 60vh)',
        overflowY: 'auto',
        background: '#fff',
        borderRadius: 11,
        border: `1px solid ${colors.gray.border}`,
        boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
        zIndex: 10999,
        fontFamily: typography.fontFamily,
      }}
    >
      {allowNone && (
        <button
          type="button"
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
          onMouseEnter={e => { if (value !== null) e.currentTarget.style.background = colors.gray.hover }}
          onMouseLeave={e => { if (value !== null) e.currentTarget.style.background = 'transparent' }}
        >
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            border: `1px dashed ${colors.gray.borderMd}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, fontSize: 10, color: colors.gray.dimText,
          }}>—</div>
          <span style={{ fontSize: 13, color: colors.gray[700], fontStyle: 'italic' }}>
            Sem profissional
          </span>
        </button>
      )}
      {professionals.map(p => (
        <button
          key={p.id}
          type="button"
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
          onMouseEnter={e => { if (value !== p.id) e.currentTarget.style.background = colors.gray.hover }}
          onMouseLeave={e => { if (value !== p.id) e.currentTarget.style.background = 'transparent' }}
        >
          <Avatar name={p.name} url={p.avatarUrl} size={24} />
          <span style={{ fontSize: 13, fontWeight: 600, color: colors.gray[900] }}>
            {p.name}
          </span>
        </button>
      ))}
    </div>,
    document.body,
  ) : null

  return (
    <div style={{ position: 'relative', fontFamily: typography.fontFamily }}>
      <button
        ref={btnRef}
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

      {menu}
    </div>
  )
}
