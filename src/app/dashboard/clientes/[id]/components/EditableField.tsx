'use client'
// src/app/dashboard/clientes/[id]/components/EditableField.tsx

import { useState, useEffect, useRef } from 'react'
import { Pencil, Check, X } from 'lucide-react'
import { colors, typography, radius, transitions, shadows } from '@/shared/theme'

interface Props {
  label:    string
  value:    string
  onSave:   (v: string) => Promise<void>
  mask?:    (v: string) => string
  isMobile: boolean
  /** Permite especificar inputMode para teclado mobile */
  inputMode?: 'text' | 'tel' | 'email' | 'numeric'
}

/**
 * Campo editável inline.
 * - Desktop: linha horizontal com label/valor/edit
 * - Mobile: card estilo iOS Settings (label em cima, valor + edit em baixo)
 */
export default function EditableField({ label, value, onSave, mask, isMobile, inputMode = 'text' }: Props) {
  const [editing, setEditing] = useState(false)
  const [val,     setVal]     = useState(value)
  const [saving,  setSaving]  = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Foca input ao entrar em edição (DOM ops apenas, sem setState)
  useEffect(() => {
    if (!editing) return
    const t = setTimeout(() => inputRef.current?.focus(), 50)
    return () => clearTimeout(t)
  }, [editing])

  // Inicia edição: reseta val pro valor atual + ativa modo edit
  function startEditing() {
    setVal(value)
    setEditing(true)
  }

  async function handleSave() {
    if (val.trim() === value) { setEditing(false); return }
    try {
      setSaving(true)
      await onSave(val.trim())
      setEditing(false)
    } catch {
      setVal(value)
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setVal(value)
    setEditing(false)
  }

  // ─── Mobile: card iOS Settings ───────────────────────────────────────────
  if (isMobile) {
    return (
      <div
        onClick={() => !editing && startEditing()}
        style={{
          background: 'rgba(255,255,255,0.85)',
          borderRadius: radius.md,
          border: `1px solid ${colors.gray.border}`,
          padding: '12px 14px',
          marginBottom: 8,
          cursor: editing ? 'default' : 'pointer',
          transition: `border-color ${transitions.fast}`,
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <div style={{
          fontSize: typography.scale.xs,
          fontWeight: typography.weight.bold,
          color: typography.color.muted,
          textTransform: 'uppercase',
          letterSpacing: '.06em',
          marginBottom: 6,
        }}>
          {label}
        </div>

        {editing ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              ref={inputRef}
              value={val}
              inputMode={inputMode}
              onChange={e => setVal(mask ? mask(e.target.value) : e.target.value)}
              onClick={e => e.stopPropagation()}
              onKeyDown={e => {
                if (e.key === 'Enter')  handleSave()
                if (e.key === 'Escape') handleCancel()
              }}
              style={{
                flex: 1, height: 38,
                padding: '0 12px',
                borderRadius: radius.sm,
                border: `1px solid ${colors.red.borderHover}`,
                background: '#fff',
                fontSize: typography.scale.base,
                outline: 'none',
                fontFamily: typography.fontFamily,
                color: typography.color.primary,
                boxShadow: `0 0 0 3px ${colors.red.focusRing}`,
              }}
            />
            <button
              onClick={e => { e.stopPropagation(); handleSave() }}
              disabled={saving}
              aria-label="Salvar"
              style={{
                width: 38, height: 38,
                borderRadius: radius.sm,
                border: 'none',
                background: colors.red.gradient,
                color: '#fff',
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                boxShadow: shadows.redSm,
              }}
            >
              {saving ? (
                <div style={{
                  width: 14, height: 14, borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                  animation: 'spin 0.6s linear infinite',
                }} />
              ) : (
                <Check size={15} strokeWidth={2.5} />
              )}
            </button>
            <button
              onClick={e => { e.stopPropagation(); handleCancel() }}
              aria-label="Cancelar"
              style={{
                width: 38, height: 38,
                borderRadius: radius.sm,
                border: `1px solid ${colors.gray.borderMd}`,
                background: '#fff',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <X size={15} color={colors.gray.dimText} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{
              fontSize: typography.scale.lg,
              fontWeight: typography.weight.semibold,
              color: typography.color.primary,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {value}
            </span>
            <Pencil size={14} color={colors.gray.dimText} strokeWidth={2} />
          </div>
        )}
      </div>
    )
  }

  // ─── Desktop: inline horizontal ──────────────────────────────────────────
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 0',
      borderBottom: `1px solid ${colors.gray.border}`,
    }}>
      <span style={{
        fontSize: typography.scale.base,
        color: typography.color.muted,
        minWidth: 120,
      }}>{label}</span>

      {editing ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, maxWidth: 260 }}>
          <input
            ref={inputRef}
            value={val}
            inputMode={inputMode}
            onChange={e => setVal(mask ? mask(e.target.value) : e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter')  handleSave()
              if (e.key === 'Escape') handleCancel()
            }}
            style={{
              flex: 1, height: 34, padding: '0 10px',
              borderRadius: radius.sm,
              border: `1px solid ${colors.red.borderHover}`,
              background: colors.background.surface,
              fontSize: typography.scale.base,
              outline: 'none',
              fontFamily: typography.fontFamily,
              color: typography.color.primary,
              boxShadow: `0 0 0 3px ${colors.red.focusRing}`,
            }}
          />
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: 30, height: 30,
              borderRadius: radius.sm,
              border: 'none',
              background: colors.red.gradient,
              color: '#fff',
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {saving ? (
              <div style={{
                width: 12, height: 12, borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: '#fff',
                animation: 'spin 0.6s linear infinite',
              }} />
            ) : (
              <Check size={13} strokeWidth={2.5} />
            )}
          </button>
          <button
            onClick={handleCancel}
            style={{
              width: 30, height: 30,
              borderRadius: radius.sm,
              border: `1px solid ${colors.gray.borderMd}`,
              background: colors.background.surface,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={13} color={colors.gray.dimText} />
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: typography.scale.base,
            fontWeight: typography.weight.semibold,
            color: typography.color.primary,
          }}>{value}</span>
          <button
            onClick={() => startEditing()}
            style={{
              width: 26, height: 26,
              borderRadius: radius.sm,
              border: `1px solid ${colors.gray.borderMd}`,
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: 0.5,
              transition: `opacity ${transitions.fast}`,
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}
          >
            <Pencil size={12} color={colors.gray.dimText} />
          </button>
        </div>
      )}
    </div>
  )
}
