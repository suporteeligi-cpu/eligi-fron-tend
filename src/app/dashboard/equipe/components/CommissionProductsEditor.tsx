'use client'
// src/app/dashboard/equipe/components/CommissionProductsEditor.tsx
//
// Editor da categoria "Produtos" — auto-save com debounce.

import { useState, useEffect, useRef, useCallback } from 'react'
import { Percent, DollarSign, Plus, X, Loader2, Check, Package } from 'lucide-react'
import { colors, typography, transitions, radius } from '@/shared/theme'
import api from '@/shared/lib/apiClient'
import {
  Professional, CommissionType, ProductCommissionOverride, ProductLite,
} from '@/features/professionals/types'
import { fmtCommission } from '@/features/professionals/utils/format'

interface Props {
  prof:        Professional
  allProducts: ProductLite[]
  isMobile:    boolean
  onChanged:   (prof: Professional) => void
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

const SAVE_DEBOUNCE_MS = 600

export default function CommissionProductsEditor({
  prof, allProducts, onChanged,
}: Props) {
  const [defaultType,  setDefaultType]  = useState<CommissionType | null>(() => prof.commissionProductType  ?? null)
  const [defaultValue, setDefaultValue] = useState<number | null>(() => prof.commissionProductValue ?? null)
  const [overrides,    setOverrides]    = useState<ProductCommissionOverride[]>(() => prof.productCommissionOverrides ?? [])
  const [showAddOverride, setShowAddOverride] = useState(false)
  const [saveState,    setSaveState]    = useState<SaveState>('idle')

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastPushed = useRef<string>(JSON.stringify({
    t: prof.commissionProductType ?? null,
    v: prof.commissionProductValue ?? null,
    o: prof.productCommissionOverrides ?? [],
  }))
  const isMountedRef = useRef(false)

  const triggerSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const payload = {
        t: defaultType,
        v: defaultValue,
        o: overrides,
      }
      const serialized = JSON.stringify(payload)
      if (serialized === lastPushed.current) return
      try {
        setSaveState('saving')
        const res = await api.patch(`/equipe/${prof.id}`, {
          commissionProductType:        defaultType,
          commissionProductValue:       defaultValue,
          productCommissionOverrides:   overrides,
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

  // Helpers
  function updateOverride(productId: string, patch: Partial<ProductCommissionOverride>) {
    setOverrides(prev =>
      prev.map(o => o.productId === productId ? { ...o, ...patch } : o)
    )
  }

  function removeOverride(productId: string) {
    setOverrides(prev => prev.filter(o => o.productId !== productId))
  }

  function addOverride(productId: string) {
    setOverrides(prev => [...prev, {
      productId,
      commissionType:  defaultType ?? 'PERCENT',
      commissionValue: 0,
    }])
    setShowAddOverride(false)
  }

  const overrideProductIds = new Set(overrides.map(o => o.productId))
  const availableForOverride = allProducts.filter(p => !overrideProductIds.has(p.id))

  return (
    <div style={{ fontFamily: typography.fontFamily }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        gap: 12, marginBottom: 16,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            margin: 0,
            fontSize: 15, fontWeight: 700,
            color: colors.gray[900],
            letterSpacing: '-0.01em',
          }}>
            Comissão de produtos
          </h3>
          <p style={{
            margin: '2px 0 0',
            fontSize: 12,
            color: colors.gray.dimText,
            lineHeight: 1.4,
          }}>
            Define quanto {prof.name.split(' ')[0]} ganha por produto vendido.
          </p>
        </div>
        <SaveIndicator state={saveState} />
      </div>

      {/* COMISSÃO PADRÃO */}
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
        }}>Padrão</div>

        {defaultType === null ? (
          <button
            onClick={() => {
              setDefaultType('PERCENT')
              setDefaultValue(10)
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
            <TypeToggle value={defaultType} onChange={setDefaultType} />
            <ValueInput
              type={defaultType}
              value={defaultValue ?? 0}
              onChange={setDefaultValue}
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

      {/* OVERRIDES */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 8,
      }}>
        <div style={{
          fontSize: 10, fontWeight: 700,
          color: colors.gray.dimText,
          textTransform: 'uppercase',
          letterSpacing: '.07em',
        }}>Específicos ({overrides.length})</div>
      </div>

      {allProducts.length === 0 ? (
        <div style={{
          padding: '14px', textAlign: 'center',
          background: colors.background.page,
          borderRadius: radius.md,
          border: `1px dashed ${colors.gray.borderMd}`,
          color: colors.gray.dimText,
          fontSize: 12,
        }}>
          <Package size={20} strokeWidth={1.5} style={{ marginBottom: 4, opacity: 0.5 }} />
          <div>Nenhum produto cadastrado</div>
          <div style={{ fontSize: 11, marginTop: 2 }}>
            Cadastre produtos em <strong>/produtos</strong> primeiro
          </div>
        </div>
      ) : overrides.length === 0 && !showAddOverride ? (
        <div style={{
          padding: '14px', textAlign: 'center',
          background: colors.background.page,
          borderRadius: radius.md,
          border: `1px dashed ${colors.gray.borderMd}`,
          color: colors.gray.dimText,
          fontSize: 12,
          marginBottom: 8,
        }}>
          Nenhuma comissão específica
        </div>
      ) : null}

      {overrides.map(o => {
        const product = allProducts.find(p => p.id === o.productId)
        if (!product) return null
        return (
          <div key={o.productId} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 0',
            borderBottom: `1px solid ${colors.gray.border}`,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: product.imageUrl ? '#fff' : (product.color ?? colors.red.DEFAULT),
              overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Package size={13} color="#fff" strokeWidth={2.5} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 13, fontWeight: 600, color: colors.gray[900],
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {product.name}
              </div>
            </div>
            <TypeToggle
              value={o.commissionType}
              onChange={t => updateOverride(o.productId, { commissionType: t })}
              compact
            />
            <ValueInput
              type={o.commissionType}
              value={o.commissionValue}
              onChange={v => updateOverride(o.productId, { commissionValue: v })}
              compact
            />
            <button
              onClick={() => removeOverride(o.productId)}
              aria-label="Remover"
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

      {!showAddOverride && availableForOverride.length > 0 && (
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
          Adicionar produto
        </button>
      )}

      {showAddOverride && (
        <div style={{
          marginTop: 10, padding: 12,
          background: colors.background.page,
          border: `1px solid ${colors.gray.borderMd}`,
          borderRadius: radius.md,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700,
            color: colors.gray.dimText,
            textTransform: 'uppercase', letterSpacing: '.06em',
            marginBottom: 8,
          }}>Escolha o produto</div>
          <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 10 }}>
            {availableForOverride.map(p => (
              <button
                key={p.id}
                onClick={() => addOverride(p.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 10px',
                  border: 'none', borderRadius: 8,
                  background: 'transparent', cursor: 'pointer',
                  textAlign: 'left', fontSize: 13,
                  color: colors.gray[900],
                  fontFamily: 'inherit',
                  transition: `background ${transitions.fast}`,
                  WebkitTapHighlightColor: 'transparent',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = colors.red.subtle)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{
                  width: 24, height: 24, borderRadius: 6,
                  background: p.imageUrl ? '#fff' : (p.color ?? colors.red.DEFAULT),
                  overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Package size={11} color="#fff" strokeWidth={2.5} />
                  )}
                </div>
                <span style={{ flex: 1, fontWeight: 600 }}>{p.name}</span>
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
            <> · {overrides.length} produto{overrides.length !== 1 ? 's' : ''} específico{overrides.length !== 1 ? 's' : ''}</>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Subcomponentes (cópia do CommissionServicesEditor) ──────────

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
        style={{
          width: size, height: size, border: 'none',
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
        style={{
          width: size, height: size, border: 'none',
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
          fontWeight: 500, pointerEvents: 'none',
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
          fontSize: 13, fontWeight: 600,
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
          fontWeight: 500, pointerEvents: 'none',
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
