'use client'
// src/app/dashboard/estoque/components/QuickStockSheet.tsx
//
// Atalho rápido de movimentação de estoque.
// Abre como bottom-sheet (mobile) ou modal centrado (desktop).
// Permite registrar entrada/saída/ajuste/perda SEM abrir o ProductModal completo.

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X, ArrowDownToLine, ArrowUpFromLine, Sliders, AlertOctagon,
  Plus, Loader2, AlertCircle, Package,
} from 'lucide-react'

import api from '@/shared/lib/apiClient'
import { colors, typography, transitions, radius } from '@/shared/theme'
import { Product } from '@/features/products/types'
import { StockMovementType } from '@/features/stock/types'

interface Props {
  product:  Product
  isMobile: boolean
  onMoved:  (updated: Product) => void
  onClose:  () => void
}

interface TypeOption {
  id:    StockMovementType
  label: string
  icon:  typeof ArrowDownToLine
  color: string
  bg:    string
}

const TYPE_OPTIONS: TypeOption[] = [
  { id: 'IN',     label: 'Entrada', icon: ArrowDownToLine, color: '#15803d', bg: 'rgba(22,163,74,0.10)' },
  { id: 'OUT',    label: 'Saída',   icon: ArrowUpFromLine, color: '#991b1b', bg: 'rgba(220,38,38,0.10)' },
  { id: 'ADJUST', label: 'Ajuste',  icon: Sliders,         color: '#1d4ed8', bg: 'rgba(59,130,246,0.10)' },
  { id: 'LOSS',   label: 'Perda',   icon: AlertOctagon,    color: '#b45309', bg: 'rgba(245,158,11,0.12)' },
]

export default function QuickStockSheet({ product, isMobile, onMoved, onClose }: Props) {
  const [movType,   setMovType]   = useState<StockMovementType>('IN')
  const [qtyStr,    setQtyStr]    = useState('')
  const [reason,    setReason]    = useState('')
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [mounted,   setMounted]   = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10)
    return () => clearTimeout(t)
  }, [])

  const base = product.stock ?? 0
  const qtyNum = parseInt(qtyStr.replace(/\D/g, ''), 10) || 0

  let preview: number | null = null
  if (qtyNum > 0 || movType === 'ADJUST') {
    switch (movType) {
      case 'IN':     preview = base + qtyNum; break
      case 'OUT':
      case 'LOSS':   preview = base - qtyNum; break
      case 'ADJUST': preview = qtyNum; break
    }
  }
  const previewInvalid = preview != null && preview < 0

  function handleClose() {
    setMounted(false)
    setTimeout(onClose, 200)
  }

  async function submit() {
    setError(null)
    const quantity = parseInt(qtyStr.replace(/\D/g, ''), 10)
    if (isNaN(quantity) || quantity < 0) {
      setError('Quantidade inválida')
      return
    }
    if (quantity === 0 && movType !== 'ADJUST') {
      setError('Quantidade deve ser maior que zero')
      return
    }
    if (previewInvalid) {
      setError('Saldo não pode ficar negativo')
      return
    }

    try {
      setSaving(true)
      const res = await api.post(`/products/${product.id}/movements`, {
        type:     movType,
        quantity,
        reason:   reason.trim() || undefined,
      })
      const data = res.data?.data ?? res.data
      const newStock = data?.stockAfter ?? data?.movement?.stockAfter

      onMoved({ ...product, stock: newStock ?? preview ?? base } as Product)
      handleClose()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'Erro ao registrar')
      setSaving(false)
    }
  }

  const numpadKeys = ['1','2','3','4','5','6','7','8','9','C','0','⌫']

  function pressKey(k: string) {
    if (k === 'C') { setQtyStr(''); return }
    if (k === '⌫') { setQtyStr(s => s.slice(0, -1)); return }
    setQtyStr(s => (s + k).replace(/^0+(?=\d)/, ''))
  }

  const content = (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(2px)',
        zIndex: 9998,
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        opacity: mounted ? 1 : 0,
        transition: 'opacity 0.2s ease',
        fontFamily: typography.fontFamily,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          width: isMobile ? '100%' : 420,
          maxWidth: '100%',
          maxHeight: isMobile ? '92vh' : '88vh',
          borderRadius: isMobile ? '20px 20px 0 0' : radius.lg,
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          transform: mounted
            ? 'translateY(0)'
            : isMobile ? 'translateY(100%)' : 'scale(0.96)',
          transition: `transform 0.25s ${transitions.spring ?? 'cubic-bezier(0.34,1.56,0.64,1)'}`,
          boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 11,
          padding: '16px 18px',
          borderBottom: `1px solid ${colors.gray.border}`,
          flexShrink: 0,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: product.color ?? colors.red.DEFAULT,
            overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            {product.imageUrl
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <Package size={18} color="#fff" strokeWidth={2} />
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 14, fontWeight: 700, color: colors.gray[900],
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{product.name}</div>
            <div style={{ fontSize: 11, color: colors.gray.dimText }}>
              Saldo atual: <strong style={{ color: colors.gray[900] }}>{base} un.</strong>
            </div>
          </div>
          <button
            onClick={handleClose}
            aria-label="Fechar"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 6, display: 'flex',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <X size={18} color={colors.gray.dimText} />
          </button>
        </div>

        {/* Body */}
        <div style={{
          flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
          padding: 18,
          display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          {/* Tipo - cards maiores */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 6,
          }}>
            {TYPE_OPTIONS.map(opt => {
              const isSel = movType === opt.id
              const Icon = opt.icon
              return (
                <button
                  key={opt.id}
                  onClick={() => setMovType(opt.id)}
                  type="button"
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                    padding: '12px 6px',
                    border: isSel ? `2px solid ${opt.color}` : `1px solid ${colors.gray.borderMd}`,
                    borderRadius: 11,
                    background: isSel ? opt.bg : 'transparent',
                    cursor: 'pointer',
                    transition: `all ${transitions.fast}`,
                    fontFamily: 'inherit',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <Icon size={18} color={opt.color} strokeWidth={2.2} />
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: isSel ? opt.color : colors.gray[700],
                  }}>{opt.label}</span>
                </button>
              )
            })}
          </div>

          {/* Display quantidade GIGANTE */}
          <div style={{
            textAlign: 'center',
            padding: '8px 0 4px',
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700,
              color: colors.gray.dimText,
              textTransform: 'uppercase',
              letterSpacing: '.07em',
              marginBottom: 4,
            }}>
              {movType === 'ADJUST' ? 'Novo saldo (contagem)' : 'Quantidade'}
            </div>
            <div style={{
              fontSize: 46,
              fontWeight: 800,
              color: qtyNum > 0 || (movType === 'ADJUST' && qtyStr !== '')
                ? colors.gray[900]
                : colors.gray.borderMd,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.03em',
              lineHeight: 1,
            }}>
              {qtyStr || '0'}
            </div>
          </div>

          {/* Preview saldo destacado */}
          {preview != null && (
            <div style={{
              padding: '12px 16px',
              borderRadius: 12,
              background: previewInvalid
                ? 'rgba(220,38,38,0.08)'
                : 'linear-gradient(135deg, #1e293b, #0f172a)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{
                fontSize: 12, fontWeight: 700,
                color: previewInvalid ? colors.red.DEFAULT : 'rgba(255,255,255,0.65)',
                textTransform: 'uppercase',
                letterSpacing: '.05em',
              }}>Saldo após</span>
              <span style={{
                fontSize: 20, fontWeight: 800,
                fontVariantNumeric: 'tabular-nums',
                color: previewInvalid ? colors.red.DEFAULT : '#fff',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ opacity: 0.5, fontSize: 15 }}>{base}</span>
                <span style={{ opacity: 0.5, fontSize: 13 }}>→</span>
                {preview}{previewInvalid && ' ⚠️'}
              </span>
            </div>
          )}

          {/* Teclado numérico (mobile) */}
          {isMobile && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
            }}>
              {numpadKeys.map(k => (
                <button
                  key={k}
                  onClick={() => pressKey(k)}
                  type="button"
                  style={{
                    padding: '16px 0',
                    fontSize: 20,
                    fontWeight: 700,
                    border: `1px solid ${colors.gray.border}`,
                    borderRadius: 12,
                    background: k === 'C' || k === '⌫' ? colors.background.page : '#fff',
                    color: k === 'C' ? colors.red.DEFAULT : colors.gray[900],
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontVariantNumeric: 'tabular-nums',
                    WebkitTapHighlightColor: 'transparent',
                    transition: `background ${transitions.fast}`,
                  }}
                  onTouchStart={e => (e.currentTarget.style.background = colors.gray.hover)}
                  onTouchEnd={e => (e.currentTarget.style.background = k === 'C' || k === '⌫' ? colors.background.page : '#fff')}
                >
                  {k}
                </button>
              ))}
            </div>
          )}

          {/* Input quantidade (desktop) */}
          {!isMobile && (
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              value={qtyStr}
              onChange={e => setQtyStr(e.target.value.replace(/\D/g, ''))}
              placeholder="Digite a quantidade"
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '12px 14px',
                borderRadius: 10,
                fontSize: 16, fontWeight: 700,
                textAlign: 'center',
                border: `1px solid ${colors.gray.borderMd}`,
                outline: 'none',
                fontFamily: 'inherit',
                fontVariantNumeric: 'tabular-nums',
              }}
            />
          )}

          {/* Motivo */}
          <input
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder={
              movType === 'IN'   ? 'Motivo: ex. Compra fornecedor' :
              movType === 'OUT'  ? 'Motivo: ex. Uso interno' :
              movType === 'LOSS' ? 'Motivo: ex. Vencimento' :
                                   'Motivo: ex. Contagem mensal'
            }
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '11px 13px',
              borderRadius: 10,
              fontSize: 13,
              border: `1px solid ${colors.gray.borderMd}`,
              outline: 'none',
              fontFamily: 'inherit',
              background: colors.background.page,
              color: colors.gray[900],
            }}
          />

          {error && (
            <div style={{
              padding: '9px 12px',
              background: 'rgba(220,38,38,0.06)',
              border: `1px solid ${colors.red.border}`,
              borderRadius: 8,
              fontSize: 12,
              color: colors.red.DEFAULT,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <AlertCircle size={13} strokeWidth={2.5} />
              {error}
            </div>
          )}
        </div>

        {/* Footer fixo: botão registrar */}
        <div style={{
          flexShrink: 0,
          padding: '14px 18px',
          paddingBottom: isMobile ? 'calc(14px + env(safe-area-inset-bottom))' : 14,
          borderTop: `1px solid ${colors.gray.border}`,
          background: '#fff',
        }}>
          <button
            onClick={submit}
            disabled={(!qtyStr && movType !== 'ADJUST') || saving || previewInvalid}
            type="button"
            style={{
              width: '100%',
              padding: '15px',
              borderRadius: 12,
              border: 'none',
              background: ((!qtyStr && movType !== 'ADJUST') || saving || previewInvalid)
                ? colors.gray.borderMd
                : colors.red.gradient,
              color: ((!qtyStr && movType !== 'ADJUST') || saving || previewInvalid)
                ? colors.gray.dimText
                : '#fff',
              fontSize: 14,
              fontWeight: 800,
              cursor: ((!qtyStr && movType !== 'ADJUST') || saving || previewInvalid) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              fontFamily: 'inherit',
              letterSpacing: '.03em',
              boxShadow: ((!qtyStr && movType !== 'ADJUST') || saving || previewInvalid)
                ? 'none'
                : `0 6px 20px ${colors.red.glow}`,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {saving
              ? <><Loader2 size={15} style={{ animation: 'es-spin 0.8s linear infinite' }} />Registrando...</>
              : <><Plus size={15} strokeWidth={2.5} />Registrar movimentação</>}
          </button>
        </div>
      </div>

      <style>{`@keyframes es-spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(content, document.body)
}
