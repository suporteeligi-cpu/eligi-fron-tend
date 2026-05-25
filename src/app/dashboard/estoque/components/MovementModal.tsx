'use client'
// src/app/dashboard/estoque/components/MovementModal.tsx

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  X, Save, ArrowDownToLine, ArrowUpFromLine, Sliders, AlertOctagon,
} from 'lucide-react'

import api from '@/shared/lib/apiClient'
import { colors, typography, transitions, radius, shadows } from '@/shared/theme'
import { Product } from '@/features/products/types'
import { StockMovementType } from '@/features/stock/types'

interface Props {
  product:  Product
  isMobile: boolean
  onSaved:  (updatedProduct: Product) => void
  onClose:  () => void
}

interface TypeOption {
  id:    StockMovementType
  label: string
  desc:  string
  icon:  typeof ArrowDownToLine
  color: string
  bg:    string
}

const TYPE_OPTIONS: TypeOption[] = [
  { id: 'IN',     label: 'Entrada', desc: 'Compra, devolução',     icon: ArrowDownToLine, color: '#15803d', bg: 'rgba(22,163,74,0.10)' },
  { id: 'OUT',    label: 'Saída',   desc: 'Venda manual, transfer.', icon: ArrowUpFromLine, color: '#991b1b', bg: 'rgba(220,38,38,0.10)' },
  { id: 'ADJUST', label: 'Ajuste',  desc: 'Contagem de inventário',  icon: Sliders,         color: '#1d4ed8', bg: 'rgba(59,130,246,0.10)' },
  { id: 'LOSS',   label: 'Perda',   desc: 'Quebra, vencimento',      icon: AlertOctagon,    color: '#b45309', bg: 'rgba(245,158,11,0.12)' },
]

export default function MovementModal({ product, isMobile, onSaved, onClose }: Props) {
  const [type,         setType]         = useState<StockMovementType>('IN')
  const [quantityStr,  setQuantityStr]  = useState('')
  const [reason,       setReason]       = useState('')
  const [reference,    setReference]    = useState('')
  const [unitCostStr,  setUnitCostStr]  = useState(
    product.cost != null ? String(product.cost) : ''
  )
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)

  // Foca o input automaticamente no desktop
  useEffect(() => {
    if (isMobile) return
    const t = setTimeout(() => inputRef.current?.focus(), 120)
    return () => clearTimeout(t)
  }, [isMobile])

  async function handleSave() {
    setError(null)
    const quantity = parseInt(quantityStr.replace(/\D/g, ''), 10)
    if (isNaN(quantity) || quantity < 0) {
      setError('Quantidade inválida')
      return
    }
    if (quantity === 0 && type !== 'ADJUST') {
      setError('Quantidade deve ser maior que zero')
      return
    }

    const unitCost = unitCostStr ? parseFloat(unitCostStr.replace(',', '.')) : undefined
    if (unitCost != null && (isNaN(unitCost) || unitCost < 0)) {
      setError('Custo unitário inválido')
      return
    }

    try {
      setSaving(true)
      const res = await api.post(`/products/${product.id}/movements`, {
        type,
        quantity,
        reason:    reason.trim()    || undefined,
        reference: reference.trim() || undefined,
        unitCost:  type === 'IN' ? unitCost : undefined,
      })
      const data = res.data?.data ?? res.data
      // Backend retorna { movement, stockAfter }
      const newStock = data?.stockAfter ?? data?.movement?.stockAfter
      onSaved({
        ...product,
        stock: newStock ?? product.stock,
      })
      onClose()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'Erro ao registrar movimentação')
    } finally {
      setSaving(false)
    }
  }

  // Preview do saldo após movimento
  const quantity   = parseInt(quantityStr.replace(/\D/g, ''), 10) || 0
  const currentStock = product.stock ?? 0
  let newStockPreview: number | null = null
  if (quantity > 0 || type === 'ADJUST') {
    switch (type) {
      case 'IN':     newStockPreview = currentStock + quantity; break
      case 'OUT':
      case 'LOSS':   newStockPreview = currentStock - quantity; break
      case 'ADJUST': newStockPreview = quantity; break
    }
  }
  const previewInvalid = newStockPreview != null && newStockPreview < 0

  if (typeof document === 'undefined') return null

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: isMobile ? '11px 13px' : '9px 12px',
    borderRadius: 9,
    fontSize: 13,
    border: `1px solid ${colors.gray.borderMd}`,
    outline: 'none',
    fontFamily: typography.fontFamily,
    color: colors.gray[900],
    background: colors.background.page,
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 11, fontWeight: 700,
    color: colors.gray.dimText,
    textTransform: 'uppercase',
    letterSpacing: '.07em',
    marginBottom: 5,
  }

  const selectedOpt = TYPE_OPTIONS.find(t => t.id === type)!
  const canSubmit = !!quantityStr && !saving && !previewInvalid

  return createPortal(
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.30)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 10998,
          animation: 'mv-fade 0.18s ease',
        }}
      />

      <div style={isMobile ? {
        position: 'fixed', bottom: 0, left: 0, right: 0,
        top: 'var(--navbar-h, 60px)',
        background: 'rgba(255,255,255,0.99)',
        borderRadius: '24px 24px 0 0',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
        zIndex: 10999,
        display: 'flex', flexDirection: 'column',
        fontFamily: typography.fontFamily,
        animation: 'mv-up 0.30s cubic-bezier(0.34, 1.2, 0.64, 1)',
      } : {
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 480, maxWidth: '94vw',
        maxHeight: '90vh',
        background: 'rgba(255,255,255,0.99)',
        borderRadius: radius['2xl'],
        boxShadow: shadows.lg,
        zIndex: 10999,
        display: 'flex', flexDirection: 'column',
        fontFamily: typography.fontFamily,
        animation: 'mv-in 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
        overflow: 'hidden',
      }}>
        <style>{`
          @keyframes mv-fade { from { opacity:0 } to { opacity:1 } }
          @keyframes mv-in   { from { opacity:0; transform: translate(-50%,-50%) scale(0.93) } to { opacity:1; transform: translate(-50%,-50%) scale(1) } }
          @keyframes mv-up   { from { transform: translateY(100%) } to { transform: translateY(0) } }
        `}</style>

        {isMobile && (
          <div aria-hidden style={{
            width: 40, height: 4, borderRadius: 2,
            background: 'rgba(0,0,0,0.12)',
            margin: '12px auto 0',
            flexShrink: 0,
          }} />
        )}

        {/* Header */}
        <div style={{
          padding: '14px 20px',
          borderBottom: `1px solid ${colors.gray.border}`,
          flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ minWidth: 0 }}>
            <h3 style={{
              margin: 0,
              fontSize: 17,
              fontWeight: 700,
              color: colors.gray[900],
              letterSpacing: '-0.02em',
            }}>
              Movimentar estoque
            </h3>
            <p style={{
              margin: '2px 0 0',
              fontSize: 12,
              color: colors.gray.dimText,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {product.name} · Saldo atual: <strong>{currentStock}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            style={{
              width: 30, height: 30, borderRadius: '50%',
              border: `1px solid ${colors.gray.borderMd}`,
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <X size={14} color={colors.gray.dimText} />
          </button>
        </div>

        {/* Body */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: '16px 20px',
          display: 'flex', flexDirection: 'column', gap: 14,
          WebkitOverflowScrolling: 'touch',
        }}>
          {/* Tipo */}
          <div>
            <label style={labelStyle}>Tipo de movimentação</label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 8,
            }}>
              {TYPE_OPTIONS.map(opt => {
                const isSelected = type === opt.id
                const Icon = opt.icon
                return (
                  <button
                    key={opt.id}
                    onClick={() => setType(opt.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 9,
                      padding: '10px 12px',
                      border: isSelected
                        ? `2px solid ${opt.color}`
                        : `1px solid ${colors.gray.borderMd}`,
                      borderRadius: 10,
                      background: isSelected ? opt.bg : 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: `all ${transitions.fast}`,
                      fontFamily: 'inherit',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: 7,
                      background: opt.bg,
                      color: opt.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon size={14} strokeWidth={2.2} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontSize: 13, fontWeight: 700,
                        color: isSelected ? opt.color : colors.gray[900],
                      }}>{opt.label}</div>
                      <div style={{
                        fontSize: 10,
                        color: colors.gray.dimText,
                        marginTop: 1,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>{opt.desc}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Quantidade */}
          <div>
            <label style={labelStyle}>
              {type === 'ADJUST' ? 'Novo saldo (contagem)' : 'Quantidade'}
            </label>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              value={quantityStr}
              onChange={e => setQuantityStr(e.target.value.replace(/\D/g, ''))}
              placeholder="0"
              style={{
                ...inputStyle,
                fontSize: 18,
                fontWeight: 700,
                textAlign: 'right',
                fontVariantNumeric: 'tabular-nums',
                padding: '14px 16px',
              }}
            />
          </div>

          {/* Preview saldo após */}
          {newStockPreview != null && (
            <div style={{
              padding: '10px 14px',
              background: previewInvalid
                ? 'rgba(220,38,38,0.08)'
                : selectedOpt.bg,
              border: `1px solid ${previewInvalid
                ? colors.red.border
                : selectedOpt.color + '40'}`,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 13,
            }}>
              <span style={{ color: colors.gray[700], fontWeight: 600 }}>
                Saldo após
              </span>
              <span style={{
                fontSize: 18,
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
                color: previewInvalid ? colors.red.DEFAULT : selectedOpt.color,
              }}>
                {currentStock} → <strong>{newStockPreview}</strong>
                {previewInvalid && ' ⚠️'}
              </span>
            </div>
          )}
          {previewInvalid && (
            <div style={{
              padding: '8px 12px',
              background: 'rgba(220,38,38,0.06)',
              border: `1px solid ${colors.red.border}`,
              borderRadius: 8,
              fontSize: 12,
              color: colors.red.DEFAULT,
              fontWeight: 600,
            }}>
              Saldo não pode ficar negativo. Reduza a quantidade.
            </div>
          )}

          {/* Custo unitário (só pra entrada) */}
          {type === 'IN' && (
            <div>
              <label style={labelStyle}>Custo unitário (opcional)</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 12, top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 12, color: colors.gray.dimText, fontWeight: 600,
                  pointerEvents: 'none',
                }}>R$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={unitCostStr}
                  onChange={e => setUnitCostStr(e.target.value.replace(/[^\d,.]/g, ''))}
                  placeholder="0,00"
                  style={{ ...inputStyle, paddingLeft: 34, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
                />
              </div>
            </div>
          )}

          {/* Motivo */}
          <div>
            <label style={labelStyle}>
              Motivo {type === 'LOSS' || type === 'ADJUST' ? '*' : '(opcional)'}
            </label>
            <input
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder={
                type === 'IN'     ? 'Ex: Compra fornecedor ACME'  :
                type === 'OUT'    ? 'Ex: Uso interno, brinde'      :
                type === 'LOSS'   ? 'Ex: Vencimento, quebra'        :
                                    'Ex: Contagem mensal, divergência'
              }
              style={inputStyle}
            />
          </div>

          {/* Referência (só pra IN/OUT) */}
          {(type === 'IN' || type === 'OUT') && (
            <div>
              <label style={labelStyle}>Referência (opcional)</label>
              <input
                value={reference}
                onChange={e => setReference(e.target.value)}
                placeholder="Ex: NF-12345, Pedido #789"
                style={inputStyle}
              />
            </div>
          )}

          {error && (
            <div style={{
              padding: '10px 12px',
              borderRadius: 9,
              background: 'rgba(220,38,38,0.06)',
              border: `1px solid ${colors.red.border}`,
              fontSize: 12,
              color: colors.red.DEFAULT,
            }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: isMobile
            ? '12px 20px max(20px, env(safe-area-inset-bottom))'
            : '14px 20px',
          display: 'flex', gap: 8,
          borderTop: `1px solid ${colors.gray.border}`,
          flexShrink: 0,
          background: 'rgba(255,255,255,0.95)',
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '12px',
              borderRadius: 10,
              border: `1px solid ${colors.gray.borderMd}`,
              background: 'transparent',
              fontSize: 13, cursor: 'pointer',
              color: colors.gray[700], fontWeight: 600,
              fontFamily: 'inherit',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!canSubmit}
            style={{
              flex: 2, padding: '12px',
              borderRadius: 10,
              border: 'none',
              background: !canSubmit ? colors.gray.borderMd : colors.red.gradient,
              color: !canSubmit ? colors.gray.dimText : '#fff',
              fontSize: 13,
              cursor: !canSubmit ? 'not-allowed' : 'pointer',
              fontWeight: 700,
              boxShadow: !canSubmit ? 'none' : `0 3px 10px ${colors.red.glow}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              fontFamily: 'inherit',
            }}
          >
            <Save size={13} strokeWidth={2.5} />
            {saving ? 'Registrando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </>,
    document.body,
  )
}
