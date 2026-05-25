'use client'
// src/app/dashboard/equipe/components/CommissionServicesEditor.tsx
//
// Editor da categoria "Serviços" — auto-save com debounce.
// Não tem modo edit/cancel — toda mudança vai pro backend após 600ms.

import { useState, useEffect, useRef, useCallback } from 'react'
import { Percent, DollarSign, Plus, X, Loader2, Check } from 'lucide-react'
import { colors, typography, transitions, radius } from '@/shared/theme'
import api from '@/shared/lib/apiClient'
import {
  Professional, ServiceItem, CommissionType, CommissionOverride,
} from '@/features/professionals/types'
import { fmtCommission } from '@/features/professionals/utils/format'

interface Props {
  prof:        Professional
  allServices: ServiceItem[]
  isMobile:    boolean
  onChanged:   (prof: Professional) => void
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

const SAVE_DEBOUNCE_MS = 600

export default function CommissionServicesEditor({
  prof, allServices, isMobile, onChanged,
}: Props) {
  const [defaultType,  setDefaultType]  = useState<CommissionType | null>(() => prof.commissionType  ?? null)
  const [defaultValue, setDefaultValue] = useState<number | null>(() => prof.commissionValue ?? null)
  const [overrides,    setOverrides]    = useState<CommissionOverride[]>(() => prof.commissionOverrides ?? [])
  const [showAddOverride, setShowAddOverride] = useState(false)
  const [saveState,    setSaveState]    = useState<SaveState>('idle')

  // ref pra evitar re-criar timer no useEffect
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastPushed = useRef<string>(JSON.stringify({
    t: prof.commissionType ?? null,
    v: prof.commissionValue ?? null,
    o: prof.commissionOverrides ?? [],
  }))
  const isMountedRef = useRef(false)

  // Save com debounce
  const triggerSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const payload = {
        t: defaultType,
        v: defaultValue,
        o: overrides,
      }
      const serialized = JSON.stringify(payload)
      if (serialized === lastPushed.current) return // nada mudou
      try {
        setSaveState('saving')
        const res = await api.patch(`/equipe/${prof.id}`, {
          commissionType:      defaultType,
          commissionValue:     defaultValue,
          commissionOverrides: overrides,
        })
        const updated = res.data?.data ?? res.data
        lastPushed.current = serialized
        setSaveState('saved')
        onChanged(updated)
        setTimeout(() => setSaveState('idle'), 1400)
      } catch {
        setSaveState('error')
      }
    }, SAVE_DEBOUNCE_MS)
  }, [prof.id, defaultType, defaultValue, overrides, onChanged])

  // Dispara save quando mudar (mas não no mount inicial)
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true
      return
    }
    triggerSave()
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [defaultType, defaultValue, overrides, triggerSave])

  // ─── Helpers ─────────────────────────────────────────────────────
  function updateOverride(serviceId: string, patch: Partial<CommissionOverride>) {
    setOverrides(prev =>
      prev.map(o => o.serviceId === serviceId ? { ...o, ...patch } : o)
    )
  }

  function removeOverride(serviceId: string) {
    setOverrides(prev => prev.filter(o => o.serviceId !== serviceId))
  }

  function addOverride(serviceId: string) {
    setOverrides(prev => [...prev, {
      serviceId,
      commissionType:  defaultType ?? 'PERCENT',
      commissionValue: 0,
    }])
    setShowAddOverride(false)
  }

  // Subset: só serviços do profissional, sem override ainda
  const profServiceIds = new Set((prof.services ?? []).map(ps => ps.service.id))
  const profServices = allServices.filter(s => profServiceIds.has(s.id))
  const overrideServiceIds = new Set(overrides.map(o => o.serviceId))
  const availableForOverride = profServices.filter(s => !overrideServiceIds.has(s.id))

  return (
    <div style={{ fontFamily: typography.fontFamily }}>
      {/* Header da seção */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 16,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            margin: 0,
            fontSize: isMobile ? 15 : 15,
            fontWeight: 700,
            color: colors.gray[900],
            letterSpacing: '-0.01em',
          }}>
            Comissão de serviços
          </h3>
          <p style={{
            margin: '2px 0 0',
            fontSize: 12,
            color: colors.gray.dimText,
            lineHeight: 1.4,
          }}>
            Define quanto {prof.name.split(' ')[0]} ganha por serviço prestado.
          </p>
        </div>
        <SaveIndicator state={saveState} />
      </div>

      {/* ───── COMISSÃO PADRÃO ───── */}
      <div style={{
        marginBottom: 18,
        padding: '12px 14px',
        background: colors.background.page,
        borderRadius: radius.md,
        border: `1px solid ${colors.gray.border}`,
      }}>
        <div style={{
          fontSize: 10, fontWeight: 700,
          color: colors.gray.dimText,
          textTransform: 'uppercase',
          letterSpacing: '.07em',
          marginBottom: 8,
        }}>
          Padrão
        </div>

        {defaultType === null ? (
          <button
            onClick={() => {
              setDefaultType('PERCENT')
              setDefaultValue(50)
            }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              width: '100%', padding: '8px 12px',
              border: `1.5px dashed ${colors.gray.borderMd}`,
              borderRadius: 9,
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 13, fontWeight: 600,
              color: colors.gray[700],
              transition: `all ${transitions.fast}`,
              fontFamily: 'inherit',
            }}
          >
            <Plus size={13} strokeWidth={2.5} />
            Definir comissão padrão
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TypeToggle
              value={defaultType}
              onChange={t => setDefaultType(t)}
            />
            <ValueInput
              type={defaultType}
              value={defaultValue ?? 0}
              onChange={v => setDefaultValue(v)}
            />
            <button
              onClick={() => {
                setDefaultType(null)
                setDefaultValue(null)
              }}
              aria-label="Remover padrão"
              style={{
                width: 32, height: 32, borderRadius: 8,
                border: `1px solid ${colors.gray.borderMd}`,
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <X size={13} color={colors.gray.dimText} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>

      {/* ───── OVERRIDES ───── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 8,
      }}>
        <div style={{
          fontSize: 10, fontWeight: 700,
          color: colors.gray.dimText,
          textTransform: 'uppercase',
          letterSpacing: '.07em',
        }}>
          Específicos ({overrides.length})
        </div>
      </div>

      {overrides.length === 0 && !showAddOverride && (
        <div style={{
          padding: '14px',
          textAlign: 'center',
          background: colors.background.page,
          borderRadius: radius.md,
          border: `1px dashed ${colors.gray.borderMd}`,
          color: colors.gray.dimText,
          fontSize: 12,
          marginBottom: 8,
        }}>
          Nenhuma comissão específica
        </div>
      )}

      {overrides.map(o => {
        const service = allServices.find(s => s.id === o.serviceId)
        if (!service) return null
        return (
          <div key={o.serviceId} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 0',
            borderBottom: `1px solid ${colors.gray.border}`,
          }}>
            <div style={{
              width: 3, height: 28, borderRadius: 2,
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
              onChange={t => updateOverride(o.serviceId, { commissionType: t })}
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
              style={{
                width: 26, height: 26, borderRadius: 7,
                border: `1px solid ${colors.gray.borderMd}`,
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <X size={12} color={colors.gray.dimText} strokeWidth={2.5} />
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
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              width: '100%', padding: '9px 12px',
              border: `1.5px dashed ${colors.gray.borderMd}`,
              borderRadius: 9,
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 12, fontWeight: 600,
              color: colors.gray[700],
              transition: `all ${transitions.fast}`,
              fontFamily: 'inherit',
              marginTop: overrides.length > 0 ? 10 : 0,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Plus size={12} strokeWidth={2.5} />
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
                  fontFamily: 'inherit',
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
              fontFamily: 'inherit',
            }}
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Resumo */}
      {defaultType != null && defaultValue != null && (
        <div style={{
          marginTop: 18,
          padding: '10px 12px',
          background: colors.red.subtle,
          border: `1px solid ${colors.red.border}`,
          borderRadius: radius.md,
          fontSize: 12,
          color: colors.gray[700],
        }}>
          <strong>Resumo:</strong> {fmtCommission(defaultType, defaultValue)} padrão
          {overrides.length > 0 && (
            <> · {overrides.length} serviço{overrides.length !== 1 ? 's' : ''} específico{overrides.length !== 1 ? 's' : ''}</>
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
  const size = compact ? 26 : 32
  return (
    <div style={{
      display: 'flex',
      borderRadius: 7,
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
        <Percent size={compact ? 11 : 13} strokeWidth={2.5} />
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
        <DollarSign size={compact ? 11 : 13} strokeWidth={2.5} />
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
  const prefix = type === 'FIXED'   ? 'R$' : ''
  const height = compact ? 26 : 32

  return (
    <div style={{
      position: 'relative',
      width: compact ? 88 : 110,
      flexShrink: 0,
    }}>
      {prefix && (
        <span style={{
          position: 'absolute', left: 9, top: '50%',
          transform: 'translateY(-50%)',
          fontSize: 11, color: colors.gray.dimText,
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
          height,
          padding: prefix ? '0 18px 0 28px' : `0 ${suffix ? 20 : 10}px 0 10px`,
          borderRadius: 7,
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
          position: 'absolute', right: 9, top: '50%',
          transform: 'translateY(-50%)',
          fontSize: 11, color: colors.gray.dimText,
          fontWeight: 500,
          pointerEvents: 'none',
        }}>{suffix}</span>
      )}
    </div>
  )
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === 'idle') return null
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      fontSize: 11, fontWeight: 600,
      color: state === 'error' ? colors.red.DEFAULT
        : state === 'saved' ? '#15803d'
        : colors.gray.dimText,
      flexShrink: 0,
    }}>
      {state === 'saving' && (
        <>
          <Loader2 size={12} strokeWidth={2.5} style={{
            animation: 'eq-spin 0.8s linear infinite',
          }} />
          Salvando
        </>
      )}
      {state === 'saved' && (
        <>
          <Check size={12} strokeWidth={3} />
          Salvo
        </>
      )}
      {state === 'error' && 'Erro ao salvar'}
    </div>
  )
}
