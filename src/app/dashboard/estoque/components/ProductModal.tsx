'use client'
// src/app/dashboard/estoque/components/ProductModal.tsx
//
// Modal unificado com 2 tabs:
// - Dados: nome, preço, custo, foto, SKU, categoria, etc
// - Estoque: toggle controle + saldo + movimentações inline + histórico

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, Save, Trash2, FileText, Boxes } from 'lucide-react'

import api from '@/shared/lib/apiClient'
import { colors, typography, transitions, radius, shadows } from '@/shared/theme'
import { Product } from '@/features/products/types'
import { calculateMargin, formatPrice } from '@/features/products/utils/format'
import { SERVICE_COLORS } from '@/features/services/constants/colorPalette'

import ProductImagePicker from './ProductImagePicker'
import StockTab from './StockTab'

interface Props {
  product:        Product | null
  isMobile:       boolean
  categories:     string[]
  onSaved:        (p: Product) => void
  onDeleted?:     (id: string) => void
  onStockMoved?:  (p: Product) => void
  onClose:        () => void
}

type TabId = 'data' | 'stock'

export default function ProductModal({
  product, isMobile, categories,
  onSaved, onDeleted, onStockMoved, onClose,
}: Props) {
  const isEditing = !!product

  const [tab, setTab] = useState<TabId>('data')

  // Dados gerais
  const [name,        setName]        = useState(product?.name ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [category,    setCategory]    = useState(product?.category    ?? '')
  const [color,       setColor]       = useState<string | null>(product?.color ?? null)
  const [imageUrl,    setImageUrl]    = useState<string | null>(product?.imageUrl ?? null)
  const [priceStr,    setPriceStr]    = useState(product?.price != null ? String(product.price) : '')
  const [costStr,     setCostStr]     = useState(product?.cost != null ? String(product.cost) : '')
  const [sku,         setSku]         = useState(product?.sku     ?? '')
  const [barcode,     setBarcode]     = useState(product?.barcode ?? '')
  const [active,      setActive]      = useState(product?.active ?? true)

  // Estoque
  const [trackStock,    setTrackStock]    = useState(product?.trackStock ?? false)
  const [initialStock,  setInitialStock]  = useState('')
  const [stockAlertStr, setStockAlertStr] = useState(
    product?.stockAlert != null ? String(product.stockAlert) : ''
  )
  // Saldo atual (vai sendo atualizado quando registra movimentação)
  const [currentStock, setCurrentStock] = useState<number>(product?.stock ?? 0)

  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isMobile || isEditing) return
    const t = setTimeout(() => inputRef.current?.focus(), 100)
    return () => clearTimeout(t)
  }, [isMobile, isEditing])

  // Callback chamado pelo StockTab quando registra movimentação
  const handleStockMoved = useCallback((updated: Product) => {
    setCurrentStock(updated.stock ?? 0)
    if (product && onStockMoved) {
      onStockMoved({
        ...product,
        stock: updated.stock,
      })
    }
  }, [product, onStockMoved])

  async function handleSave() {
    setError(null)
    const trimmedName = name.trim()
    if (!trimmedName) { setError('Nome é obrigatório'); setTab('data'); return }

    const price = parseFloat(priceStr.replace(',', '.'))
    if (isNaN(price) || price < 0) { setError('Preço inválido'); setTab('data'); return }

    const cost = costStr ? parseFloat(costStr.replace(',', '.')) : null
    if (cost != null && (isNaN(cost) || cost < 0)) { setError('Custo inválido'); setTab('data'); return }

    // Estoque
    let stockValue: number | undefined = undefined
    let stockAlertValue: number | null | undefined = undefined

    if (trackStock) {
      if (!isEditing) {
        const parsed = parseInt(initialStock.replace(/\D/g, ''), 10)
        stockValue = isNaN(parsed) ? 0 : Math.max(0, parsed)
      }
      if (stockAlertStr) {
        const a = parseInt(stockAlertStr.replace(/\D/g, ''), 10)
        stockAlertValue = isNaN(a) ? null : Math.max(0, a)
      } else {
        stockAlertValue = null
      }
    } else if (isEditing) {
      stockAlertValue = null
    }

    const payload = {
      name:         trimmedName,
      description:  description.trim() || null,
      category:     category.trim()    || null,
      color:        color              || null,
      imageUrl:     imageUrl           || null,
      price,
      cost,
      sku:          sku.trim()         || null,
      barcode:      barcode.trim()     || null,
      trackStock,
      ...(stockValue       !== undefined ? { stock:      stockValue }      : {}),
      ...(stockAlertValue  !== undefined ? { stockAlert: stockAlertValue } : {}),
      ...(isEditing ? { active } : {}),
    }

    try {
      setSaving(true)
      const res = isEditing
        ? await api.patch(`/products/${product!.id}`, payload)
        : await api.post('/products', payload)
      const saved = res.data?.data ?? res.data
      onSaved(saved)
      onClose()
    } catch {
      setError('Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!product || !onDeleted) return
    try {
      setDeleting(true)
      await api.delete(`/products/${product.id}`)
      onDeleted(product.id)
      onClose()
    } catch {
      setError('Erro ao apagar.')
      setDeleting(false)
      setShowConfirmDelete(false)
    }
  }

  const priceNum = parseFloat(priceStr.replace(',', '.'))
  const costNum  = costStr ? parseFloat(costStr.replace(',', '.')) : null
  const margin   = !isNaN(priceNum) && costNum != null && !isNaN(costNum)
    ? calculateMargin(priceNum, costNum)
    : null

  if (typeof document === 'undefined') return null

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: isMobile ? '12px 14px' : '10px 12px',
    borderRadius: 9,
    fontSize: 13,
    border: `1px solid ${colors.gray.borderMd}`,
    outline: 'none',
    fontFamily: typography.fontFamily,
    color: colors.gray[900],
    background: colors.background.page,
    boxSizing: 'border-box',
    transition: `border-color ${transitions.fast}`,
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 11, fontWeight: 700,
    color: colors.gray.dimText,
    textTransform: 'uppercase',
    letterSpacing: '.07em',
    marginBottom: 5,
  }

  const canSubmit = !!name.trim() && !!priceStr && !saving

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
          animation: 'pm-fade 0.18s ease',
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
        animation: 'pm-up 0.30s cubic-bezier(0.34, 1.2, 0.64, 1)',
      } : {
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 540, maxWidth: '94vw',
        maxHeight: '92vh',
        background: 'rgba(255,255,255,0.99)',
        borderRadius: radius['2xl'],
        boxShadow: shadows.lg,
        zIndex: 10999,
        display: 'flex', flexDirection: 'column',
        fontFamily: typography.fontFamily,
        animation: 'pm-in 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
        overflow: 'hidden',
      }}>
        <style>{`
          @keyframes pm-fade { from { opacity:0 } to { opacity:1 } }
          @keyframes pm-in   { from { opacity:0; transform: translate(-50%,-50%) scale(0.93) } to { opacity:1; transform: translate(-50%,-50%) scale(1) } }
          @keyframes pm-up   { from { transform: translateY(100%) } to { transform: translateY(0) } }
          @keyframes es-spin { to { transform: rotate(360deg) } }
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
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: `1px solid ${colors.gray.border}`,
          flexShrink: 0,
        }}>
          <h3 style={{
            margin: 0,
            fontSize: 17,
            fontWeight: 700,
            color: colors.gray[900],
            letterSpacing: '-0.02em',
          }}>
            {isEditing ? product!.name : 'Novo produto'}
          </h3>
          <button
            onClick={onClose}
            aria-label="Fechar"
            style={{
              width: 30, height: 30, borderRadius: '50%',
              border: `1px solid ${colors.gray.borderMd}`,
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={14} color={colors.gray.dimText} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          padding: '0 20px',
          borderBottom: `1px solid ${colors.gray.border}`,
          background: 'rgba(255,255,255,0.6)',
          flexShrink: 0,
        }}>
          {[
            { id: 'data'  as TabId, label: 'Dados',   icon: FileText },
            { id: 'stock' as TabId, label: 'Estoque', icon: Boxes    },
          ].map(t => {
            const Icon = t.icon
            const isActive = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '12px 14px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: isActive
                    ? `2px solid ${colors.red.DEFAULT}`
                    : '2px solid transparent',
                  marginBottom: -1,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 600,
                  color: isActive ? colors.red.DEFAULT : colors.gray.dimText,
                  fontFamily: 'inherit',
                  transition: `all ${transitions.fast}`,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <Icon size={14} strokeWidth={2} />
                {t.label}
                {t.id === 'stock' && trackStock && isEditing && (
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: 5,
                    background: colors.red.subtle,
                    color: colors.red.DEFAULT,
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {currentStock}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Body */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: '16px 20px',
          WebkitOverflowScrolling: 'touch',
        }}>
          {tab === 'data' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <ProductImagePicker current={imageUrl} onChange={setImageUrl} />

              <div>
                <label style={labelStyle}>Nome *</label>
                <input
                  ref={inputRef}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Pomada modeladora"
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, flexDirection: isMobile ? 'column' : 'row' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Categoria</label>
                  <input
                    list="product-categories"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    placeholder="Ex: Cosméticos"
                    style={inputStyle}
                  />
                  <datalist id="product-categories">
                    {categories.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Cor (opcional)</label>
                  <ColorPickerCompact value={color} onChange={setColor} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Preço *</label>
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
                      value={priceStr}
                      onChange={e => setPriceStr(e.target.value.replace(/[^\d,.]/g, ''))}
                      placeholder="0,00"
                      style={{ ...inputStyle, paddingLeft: 34, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
                    />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Custo (opcional)</label>
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
                      value={costStr}
                      onChange={e => setCostStr(e.target.value.replace(/[^\d,.]/g, ''))}
                      placeholder="0,00"
                      style={{ ...inputStyle, paddingLeft: 34, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
                    />
                  </div>
                </div>
              </div>

              {margin != null && (
                <div style={{
                  padding: '8px 12px',
                  background: margin > 0 ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.06)',
                  border: `1px solid ${margin > 0 ? 'rgba(22,163,74,0.2)' : colors.red.border}`,
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  color: margin > 0 ? '#15803d' : colors.red.DEFAULT,
                  display: 'flex',
                  justifyContent: 'space-between',
                }}>
                  <span>Margem</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {margin.toFixed(1)}%
                    {margin > 0 && costNum != null && !isNaN(costNum) && (
                      <> · lucro de {formatPrice(priceNum - costNum)}</>
                    )}
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, flexDirection: isMobile ? 'column' : 'row' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>SKU (opcional)</label>
                  <input
                    value={sku}
                    onChange={e => setSku(e.target.value)}
                    placeholder="POM-001"
                    style={{ ...inputStyle, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', textTransform: 'uppercase' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Cód. barras (opcional)</label>
                  <input
                    value={barcode}
                    onChange={e => setBarcode(e.target.value)}
                    placeholder="7890000000123"
                    inputMode="numeric"
                    style={{ ...inputStyle, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Descrição (opcional)</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Descrição do produto..."
                  style={{ ...inputStyle, resize: 'none', minHeight: 56 }}
                />
              </div>

              {isEditing && (
                <button
                  onClick={() => setActive(!active)}
                  type="button"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px',
                    background: 'transparent',
                    border: `1px solid ${colors.gray.border}`,
                    borderRadius: 9,
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <div style={{
                    width: 40, height: 22, borderRadius: 11,
                    background: active ? colors.red.DEFAULT : colors.gray.borderMd,
                    position: 'relative',
                    transition: `background ${transitions.fast}`,
                    flexShrink: 0,
                  }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%',
                      background: '#fff',
                      position: 'absolute',
                      top: 2,
                      left: active ? 'calc(100% - 20px)' : 2,
                      transition: `left ${transitions.fast}`,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                    }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: colors.gray[900] }}>
                      Produto ativo
                    </div>
                    <div style={{ fontSize: 11, color: colors.gray.dimText, marginTop: 1 }}>
                      Produtos inativos não aparecem nas vendas
                    </div>
                  </div>
                </button>
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
          ) : (
            <StockTab
              productId={product?.id ?? null}
              isMobile={isMobile}
              trackStock={trackStock}
              setTrackStock={setTrackStock}
              initialStock={initialStock}
              setInitialStock={setInitialStock}
              stockAlertStr={stockAlertStr}
              setStockAlertStr={setStockAlertStr}
              defaultCost={costNum}
              currentStock={currentStock}
              onMoved={handleStockMoved}
            />
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
          alignItems: 'center',
        }}>
          {isEditing && onDeleted && !showConfirmDelete && (
            <button
              onClick={() => setShowConfirmDelete(true)}
              aria-label="Apagar"
              style={{
                padding: '12px',
                borderRadius: 10,
                border: `1px solid rgba(220,38,38,0.2)`,
                background: 'rgba(220,38,38,0.06)',
                color: colors.red.DEFAULT,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <Trash2 size={14} strokeWidth={2} />
            </button>
          )}

          {showConfirmDelete ? (
            <>
              <span style={{ flex: 1, fontSize: 12, color: colors.red.DEFAULT, fontWeight: 600 }}>
                Apagar definitivamente?
              </span>
              <button
                onClick={() => setShowConfirmDelete(false)}
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: `1px solid ${colors.gray.borderMd}`,
                  background: 'transparent',
                  fontSize: 12,
                  cursor: 'pointer',
                  color: colors.gray[700], fontWeight: 600,
                  fontFamily: 'inherit',
                }}
              >
                Não
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: 'none',
                  background: colors.red.gradient,
                  color: '#fff',
                  fontSize: 12,
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  fontWeight: 700,
                  fontFamily: 'inherit',
                }}
              >
                {deleting ? 'Apagando...' : 'Sim, apagar'}
              </button>
            </>
          ) : (
            <>
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
                {saving ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar produto'}
              </button>
            </>
          )}
        </div>
      </div>
    </>,
    document.body,
  )
}

function ColorPickerCompact({
  value, onChange,
}: {
  value: string | null
  onChange: (v: string | null) => void
}) {
  const COLORS_SUBSET = SERVICE_COLORS.slice(0, 11)
  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6,
      alignItems: 'center',
      padding: '7px 8px',
      borderRadius: 9,
      border: `1px solid ${colors.gray.borderMd}`,
      background: colors.background.page,
      minHeight: 38,
    }}>
      <button
        onClick={() => onChange(null)}
        aria-label="Sem cor"
        title="Sem cor"
        type="button"
        style={{
          width: 22, height: 22, borderRadius: '50%',
          background: 'transparent',
          border: value == null ? `2px solid ${colors.gray[900]}` : `1px dashed ${colors.gray.borderMd}`,
          cursor: 'pointer',
          padding: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11,
          color: colors.gray.dimText,
        }}
      >
        ✕
      </button>
      {COLORS_SUBSET.map(c => {
        const isSelected = value === c
        return (
          <button
            key={c}
            onClick={() => onChange(c)}
            aria-label={`Cor ${c}`}
            type="button"
            style={{
              width: 22, height: 22, borderRadius: '50%',
              background: c,
              border: isSelected ? `2px solid ${colors.gray[900]}` : '2px solid transparent',
              cursor: 'pointer',
              padding: 0,
              transition: `transform ${transitions.fast}`,
              WebkitTapHighlightColor: 'transparent',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.15)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          />
        )
      })}
    </div>
  )
}
