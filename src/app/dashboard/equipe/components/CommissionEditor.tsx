'use client'
// src/app/dashboard/equipe/components/CommissionEditor.tsx

import { useState } from 'react'
import { Percent, DollarSign, Plus, X } from 'lucide-react'
import { colors, typography, transitions, radius } from '@/shared/theme'
import {
  CommissionType, CommissionOverride, ServiceItem,
} from '@/features/professionals/types'
import { fmtCommission } from '@/features/professionals/utils/format'

interface Props {
  defaultType:    CommissionType | null
  defaultValue:   number | null
  overrides:      CommissionOverride[]
  allServices:    ServiceItem[]
  /** Recebe a estrutura completa, simplifica updates atômicos */
  onChange:       (next: {
    defaultType:  CommissionType | null
    defaultValue: number | null
    overrides:    CommissionOverride[]
  }) => void
}

export default function CommissionEditor({
  defaultType, defaultValue, overrides, allServices, onChange,
}: Props) {
  const [showAddOverride, setShowAddOverride] = useState(false)

  // ─── Helpers ───────────────────────────────────────────────────────
  function setDefault(type: CommissionType | null, value: number | null) {
    onChange({ defaultType: type, defaultValue: value, overrides })
  }

  function updateOverride(serviceId: string, patch: Partial<CommissionOverride>) {
    const next = overrides.map(o => o.serviceId === serviceId ? { ...o, ...patch } : o)
    onChange({ defaultType, defaultValue, overrides: next })
  }

  function removeOverride(serviceId: string) {
    onChange({
      defaultType, defaultValue,
      overrides: overrides.filter(o => o.serviceId !== serviceId),
    })
  }

  function addOverride(serviceId: string) {
    // Override novo herda o tipo do default ou começa em PERCENT
    const newOverride: CommissionOverride = {
      serviceId,
      commissionType:  defaultType ?? 'PERCENT',
      commissionValue: 0,
    }
    onChange({
      defaultType, defaultValue,
      overrides: [...overrides, newOverride],
    })
    setShowAddOverride(false)
  }

  const overrideServiceIds = new Set(overrides.map(o => o.serviceId))
  const availableForOverride = allServices.filter(s => !overrideServiceIds.has(s.id))

  return (
    <div style={{ fontFamily: typography.fontFamily }}>
      {/* ═══════════ COMISSÃO PADRÃO ═══════════ */}
      <div style={{ marginBottom: 24 }}>
        <h4 style={sectionTitleStyle}>Comissão padrão</h4>
        <p style={sectionHelpStyle}>
          Vale para todos os serviços. Você pode definir um valor diferente para serviços específicos abaixo.
        </p>

        {defaultType === null ? (
          <button
            onClick={() => setDefault('PERCENT', 50)}
            style={ghostButtonStyle}
          >
            <Plus size={14} strokeWidth={2.5} />
            Definir comissão padrão
          </button>
        ) : (
          <div style={commissionRowStyle}>
            <TypeToggle
              value={defaultType}
              onChange={type => setDefault(type, defaultValue ?? 0)}
            />
            <ValueInput
              type={defaultType}
              value={defaultValue ?? 0}
              onChange={v => setDefault(defaultType, v)}
            />
            <button
              onClick={() => setDefault(null, null)}
              aria-label="Remover comissão padrão"
              style={removeButtonStyle}
            >
              <X size={14} color={colors.gray.dimText} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>

      {/* ═══════════ OVERRIDES POR SERVIÇO ═══════════ */}
      <div>
        <h4 style={sectionTitleStyle}>Comissões específicas por serviço</h4>
        <p style={sectionHelpStyle}>
          Para serviços que pagam comissão diferente do padrão.
        </p>

        {overrides.length === 0 && !showAddOverride && (
          <div style={emptyOverrideStyle}>
            <span style={{ color: colors.gray.dimText, fontSize: 13 }}>
              Nenhuma comissão específica
            </span>
          </div>
        )}

        {overrides.map(o => {
          const service = allServices.find(s => s.id === o.serviceId)
          if (!service) return null
          return (
            <div key={o.serviceId} style={overrideRowStyle}>
              <div style={{
                width: 3, height: 36, borderRadius: 2,
                background: service.color ?? colors.red.DEFAULT,
                flexShrink: 0,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: 600,
                  color: colors.gray[900],
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {service.name}
                </div>
              </div>
              <TypeToggle
                value={o.commissionType}
                onChange={type => updateOverride(o.serviceId, { commissionType: type })}
                compact
              />
              <ValueInput
                type={o.commissionType}
                value={o.commissionValue}
                onChange={v => updateOverride(o.serviceId, { commissionValue: v })}
                compact
              />
              <button
                onClick={() => removeOverride(o.serviceId)}
                aria-label="Remover override"
                style={removeButtonStyle}
              >
                <X size={14} color={colors.gray.dimText} strokeWidth={2.5} />
              </button>
            </div>
          )
        })}

        {/* Botão adicionar */}
        {!showAddOverride ? (
          availableForOverride.length > 0 && (
            <button
              onClick={() => setShowAddOverride(true)}
              style={{
                ...ghostButtonStyle,
                marginTop: overrides.length > 0 ? 10 : 0,
              }}
            >
              <Plus size={14} strokeWidth={2.5} />
              Adicionar serviço
            </button>
          )
        ) : (
          <div style={{
            marginTop: 10,
            padding: 12,
            background: colors.background.page,
            border: `1px solid ${colors.gray.borderMd}`,
            borderRadius: radius.md,
          }}>
            <div style={{
              fontSize: 11, fontWeight: 700,
              color: colors.gray.dimText,
              textTransform: 'uppercase', letterSpacing: '.06em',
              marginBottom: 8,
            }}>
              Escolha o serviço
            </div>
            <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 10 }}>
              {availableForOverride.map(s => (
                <button
                  key={s.id}
                  onClick={() => addOverride(s.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 10px',
                    border: 'none',
                    borderRadius: 8,
                    background: 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: 13,
                    color: colors.gray[900],
                    transition: `background ${transitions.fast}`,
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = colors.red.subtle)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{
                    width: 3, height: 18, borderRadius: 2,
                    background: s.color ?? colors.red.DEFAULT,
                  }} />
                  <span style={{ flex: 1, fontWeight: 600 }}>{s.name}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAddOverride(false)}
              style={{
                width: '100%', padding: '8px',
                background: 'transparent',
                border: `1px solid ${colors.gray.borderMd}`,
                borderRadius: 8,
                fontSize: 12,
                color: colors.gray.dimText,
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
          </div>
        )}
      </div>

      {/* Preview do default */}
      {defaultType != null && defaultValue != null && (
        <div style={{
          marginTop: 24,
          padding: '12px 14px',
          background: colors.red.subtle,
          border: `1px solid ${colors.red.border}`,
          borderRadius: radius.md,
          fontSize: 12,
          color: colors.gray[700],
        }}>
          <strong>Resumo:</strong> {fmtCommission(defaultType, defaultValue)} padrão
          {overrides.length > 0 && (
            <> · {overrides.length} serviço{overrides.length !== 1 ? 's' : ''} com valor específico</>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Subcomponentes ─────────────────────────────────────────────────

function TypeToggle({
  value, onChange, compact,
}: {
  value: CommissionType
  onChange: (type: CommissionType) => void
  compact?: boolean
}) {
  const size = compact ? 28 : 34
  return (
    <div style={{
      display: 'flex',
      borderRadius: 8,
      border: `1px solid ${colors.gray.borderMd}`,
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      <button
        onClick={() => onChange('PERCENT')}
        aria-label="Percentual"
        title="Percentual"
        style={{
          width: size, height: size,
          border: 'none',
          background: value === 'PERCENT' ? colors.red.gradient : 'transparent',
          color: value === 'PERCENT' ? '#fff' : colors.gray[700],
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: `background ${transitions.fast}`,
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <Percent size={compact ? 12 : 14} strokeWidth={2.5} />
      </button>
      <button
        onClick={() => onChange('FIXED')}
        aria-label="Valor fixo"
        title="Valor fixo (R$)"
        style={{
          width: size, height: size,
          border: 'none',
          background: value === 'FIXED' ? colors.red.gradient : 'transparent',
          color: value === 'FIXED' ? '#fff' : colors.gray[700],
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: `background ${transitions.fast}`,
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <DollarSign size={compact ? 12 : 14} strokeWidth={2.5} />
      </button>
    </div>
  )
}

function ValueInput({
  type, value, onChange, compact,
}: {
  type: CommissionType
  value: number
  onChange: (v: number) => void
  compact?: boolean
}) {
  const suffix = type === 'PERCENT' ? '%' : ''
  const prefix = type === 'FIXED' ? 'R$' : ''

  return (
    <div style={{
      position: 'relative',
      width: compact ? 100 : 120,
      flexShrink: 0,
    }}>
      {prefix && (
        <span style={{
          position: 'absolute', left: 10, top: '50%',
          transform: 'translateY(-50%)',
          fontSize: 12, color: colors.gray.dimText,
          fontWeight: 500,
          pointerEvents: 'none',
        }}>{prefix}</span>
      )}
      <input
        type="number"
        inputMode="decimal"
        min="0"
        step={type === 'PERCENT' ? '0.5' : '0.01'}
        max={type === 'PERCENT' ? '100' : undefined}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        style={{
          width: '100%',
          height: compact ? 28 : 34,
          padding: prefix ? '0 18px 0 28px' : `0 ${suffix ? 22 : 10}px 0 10px`,
          borderRadius: 8,
          border: `1px solid ${colors.gray.borderMd}`,
          background: '#fff',
          fontSize: 13,
          fontWeight: 600,
          outline: 'none',
          textAlign: 'right',
          fontFamily: typography.fontFamily,
          color: colors.gray[900],
          boxSizing: 'border-box',
          fontVariantNumeric: 'tabular-nums',
        }}
      />
      {suffix && (
        <span style={{
          position: 'absolute', right: 10, top: '50%',
          transform: 'translateY(-50%)',
          fontSize: 12, color: colors.gray.dimText,
          fontWeight: 500,
          pointerEvents: 'none',
        }}>{suffix}</span>
      )}
    </div>
  )
}

// ─── Styles ─────────────────────────────────────────────────────────

const sectionTitleStyle: React.CSSProperties = {
  margin: '0 0 4px',
  fontSize: 13,
  fontWeight: 700,
  color: colors.gray[900],
  letterSpacing: '-0.01em',
}

const sectionHelpStyle: React.CSSProperties = {
  margin: '0 0 12px',
  fontSize: 12,
  color: colors.gray.dimText,
  lineHeight: 1.4,
}

const ghostButtonStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  width: '100%', padding: '10px 14px',
  border: `1.5px dashed ${colors.gray.borderMd}`,
  borderRadius: 10,
  background: 'transparent',
  cursor: 'pointer',
  fontSize: 13, fontWeight: 600,
  color: colors.gray[700],
  transition: `all ${transitions.fast}`,
  WebkitTapHighlightColor: 'transparent',
}

const commissionRowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  padding: '10px 12px',
  background: colors.background.page,
  border: `1px solid ${colors.gray.border}`,
  borderRadius: radius.md,
}

const overrideRowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  padding: '10px 0',
  borderBottom: `1px solid ${colors.gray.border}`,
}

const removeButtonStyle: React.CSSProperties = {
  width: 28, height: 28,
  borderRadius: 8,
  border: `1px solid ${colors.gray.borderMd}`,
  background: 'transparent',
  cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0,
  WebkitTapHighlightColor: 'transparent',
}

const emptyOverrideStyle: React.CSSProperties = {
  padding: '14px',
  textAlign: 'center',
  background: colors.background.page,
  borderRadius: radius.md,
  border: `1px dashed ${colors.gray.borderMd}`,
}
