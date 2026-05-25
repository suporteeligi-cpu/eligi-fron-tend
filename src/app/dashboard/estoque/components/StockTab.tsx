'use client'
// src/app/dashboard/estoque/components/StockTab.tsx
//
// Aba "Estoque" do ProductModal.
// Estados:
// - trackStock=false → mostra só o toggle pra ativar
// - trackStock=true (criando) → toggle + saldo inicial + alerta
// - trackStock=true (editando) → toggle + saldo atual + alerta + form movimentação + histórico

import { useState, useEffect } from 'react'
import {
  Boxes, ArrowDownToLine, ArrowUpFromLine, Sliders, AlertOctagon,
  Plus, Loader2, AlertCircle,
} from 'lucide-react'

import api from '@/shared/lib/apiClient'
import { colors, typography, transitions, radius } from '@/shared/theme'
import { Product } from '@/features/products/types'
import {
  StockMovement, StockMovementType,
} from '@/features/stock/types'
import {
  MOVEMENT_TYPE_LABEL, MOVEMENT_TYPE_COLOR,
  movementDelta, formatDelta, formatRelative, formatBRL,
} from '@/features/stock/utils/format'

interface Props {
  productId:     string | null         // null = criando produto novo (ainda sem id)
  isMobile:      boolean
  // Estado controlado pelo modal pai (formulário do produto)
  trackStock:    boolean
  setTrackStock: (v: boolean) => void
  initialStock:  string                 // só usado se criando
  setInitialStock: (v: string) => void
  stockAlertStr: string
  setStockAlertStr: (v: string) => void
  defaultCost?:  number | null         // cost atual do produto, pra preencher unitCost
  currentStock?: number                // saldo atual (se editando)
  onMoved?:      (updated: Product) => void   // callback quando registrar movimento
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
  { id: 'IN',     label: 'Entrada', desc: 'Compra, devolução',       icon: ArrowDownToLine, color: '#15803d', bg: 'rgba(22,163,74,0.10)' },
  { id: 'OUT',    label: 'Saída',   desc: 'Venda manual, transfer.', icon: ArrowUpFromLine, color: '#991b1b', bg: 'rgba(220,38,38,0.10)' },
  { id: 'ADJUST', label: 'Ajuste',  desc: 'Contagem',                icon: Sliders,         color: '#1d4ed8', bg: 'rgba(59,130,246,0.10)' },
  { id: 'LOSS',   label: 'Perda',   desc: 'Quebra, vencimento',      icon: AlertOctagon,    color: '#b45309', bg: 'rgba(245,158,11,0.12)' },
]

const ICON_MAP: Record<StockMovementType, typeof ArrowDownToLine> = {
  IN:     ArrowDownToLine,
  OUT:    ArrowUpFromLine,
  ADJUST: Sliders,
  LOSS:   AlertOctagon,
}

export default function StockTab({
  productId, isMobile,
  trackStock, setTrackStock,
  initialStock, setInitialStock,
  stockAlertStr, setStockAlertStr,
  defaultCost, currentStock, onMoved,
}: Props) {
  const isEditing = productId != null

  // Estados do form de movimentação
  const [movType,        setMovType]        = useState<StockMovementType>('IN')
  const [movQtyStr,      setMovQtyStr]      = useState('')
  const [movReason,      setMovReason]      = useState('')
  const [movReference,   setMovReference]   = useState('')
  const [movUnitCostStr, setMovUnitCostStr] = useState(
    defaultCost != null ? String(defaultCost) : ''
  )
  const [movSaving, setMovSaving] = useState(false)
  const [movError,  setMovError]  = useState<string | null>(null)

  // Histórico
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  // Carrega histórico quando produto existe e tracking está ligado
  useEffect(() => {
    if (!productId || !trackStock) return
    let cancelled = false

    // Defer setState pra escapar do "set-state-in-effect" do React Compiler
    const tLoad = setTimeout(() => {
      if (!cancelled) setHistoryLoading(true)
    }, 0)

    api.get(`/products/${productId}/movements`, { params: { limit: 30 } })
      .then(res => {
        if (cancelled) return
        const data = res.data?.data ?? res.data
        setMovements(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (!cancelled) setMovements([])
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false)
      })

    return () => {
      cancelled = true
      clearTimeout(tLoad)
    }
  }, [productId, trackStock])

  async function submitMovement() {
    if (!productId) return
    setMovError(null)

    const quantity = parseInt(movQtyStr.replace(/\D/g, ''), 10)
    if (isNaN(quantity) || quantity < 0) {
      setMovError('Quantidade inválida')
      return
    }
    if (quantity === 0 && movType !== 'ADJUST') {
      setMovError('Quantidade deve ser maior que zero')
      return
    }

    const unitCost = movUnitCostStr ? parseFloat(movUnitCostStr.replace(',', '.')) : undefined
    if (unitCost != null && (isNaN(unitCost) || unitCost < 0)) {
      setMovError('Custo unitário inválido')
      return
    }

    try {
      setMovSaving(true)
      const res = await api.post(`/products/${productId}/movements`, {
        type:      movType,
        quantity,
        reason:    movReason.trim()    || undefined,
        reference: movReference.trim() || undefined,
        unitCost:  movType === 'IN' ? unitCost : undefined,
      })
      const data = res.data?.data ?? res.data
      const movement: StockMovement = data?.movement
      const newStock = data?.stockAfter ?? movement?.stockAfter

      // Limpa form
      setMovQtyStr('')
      setMovReason('')
      setMovReference('')

      // Prepende histórico
      if (movement) {
        setMovements(prev => [movement, ...prev])
      }

      // Avisa o pai pra atualizar saldo do produto
      if (onMoved && newStock != null) {
        onMoved({
          id: productId,
          stock: newStock,
        } as Product)
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setMovError(e.response?.data?.error ?? 'Erro ao registrar movimentação')
    } finally {
      setMovSaving(false)
    }
  }

  // Preview saldo após movimento
  const qtyNum = parseInt(movQtyStr.replace(/\D/g, ''), 10) || 0
  const base = currentStock ?? 0
  let newStockPreview: number | null = null
  if (qtyNum > 0 || movType === 'ADJUST') {
    switch (movType) {
      case 'IN':     newStockPreview = base + qtyNum; break
      case 'OUT':
      case 'LOSS':   newStockPreview = base - qtyNum; break
      case 'ADJUST': newStockPreview = qtyNum; break
    }
  }
  const previewInvalid = newStockPreview != null && newStockPreview < 0

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

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 14,
      fontFamily: typography.fontFamily,
    }}>
      {/* Toggle controlar estoque */}
      <button
        onClick={() => setTrackStock(!trackStock)}
        type="button"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          padding: '12px 14px',
          background: trackStock ? 'rgba(220,38,38,0.04)' : colors.background.page,
          border: `1px solid ${trackStock ? colors.red.border : colors.gray.border}`,
          borderRadius: radius.md,
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: 'inherit',
          WebkitTapHighlightColor: 'transparent',
          transition: `background ${transitions.fast}`,
          width: '100%',
        }}
      >
        <div style={{
          width: 40, height: 22, borderRadius: 11,
          background: trackStock ? colors.red.DEFAULT : colors.gray.borderMd,
          position: 'relative',
          transition: `background ${transitions.fast}`,
          flexShrink: 0,
          marginTop: 1,
        }}>
          <div style={{
            width: 18, height: 18, borderRadius: '50%',
            background: '#fff',
            position: 'absolute',
            top: 2,
            left: trackStock ? 'calc(100% - 20px)' : 2,
            transition: `left ${transitions.fast}`,
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 700,
            color: colors.gray[900],
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <Boxes size={13} strokeWidth={2} color={colors.red.DEFAULT} />
            Controlar estoque
          </div>
          <div style={{ fontSize: 11, color: colors.gray.dimText, marginTop: 2, lineHeight: 1.4 }}>
            Habilite para acompanhar saldo, movimentações e alertas de estoque baixo.
          </div>
        </div>
      </button>

      {!trackStock && (
        <div style={{
          padding: '16px',
          background: colors.background.page,
          borderRadius: radius.md,
          textAlign: 'center',
          color: colors.gray.dimText,
          fontSize: 12,
        }}>
          <Boxes size={28} strokeWidth={1.5} style={{ opacity: 0.3, marginBottom: 6 }} />
          <div>Este produto não controla estoque.</div>
          <div style={{ marginTop: 2 }}>Ative o controle acima para ver opções.</div>
        </div>
      )}

      {trackStock && (
        <>
          {/* Estado: criando produto com estoque */}
          {!isEditing && (
            <div>
              <label style={labelStyle}>Estoque inicial</label>
              <input
                type="text"
                inputMode="numeric"
                value={initialStock}
                onChange={e => setInitialStock(e.target.value.replace(/\D/g, ''))}
                placeholder="0"
                style={{ ...inputStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
              />
              <div style={{
                fontSize: 10, color: colors.gray.dimText,
                marginTop: 4,
              }}>
                Será registrado como movimentação de entrada &ldquo;Saldo inicial&rdquo;.
              </div>
            </div>
          )}

          {/* Saldo atual (editando) */}
          {isEditing && (
            <div style={{
              padding: '12px 14px',
              background: colors.background.page,
              borderRadius: radius.md,
              border: `1px solid ${colors.gray.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{
                  fontSize: 10, fontWeight: 700,
                  color: colors.gray.dimText,
                  textTransform: 'uppercase',
                  letterSpacing: '.06em',
                }}>Saldo atual</div>
                <div style={{
                  fontSize: 24, fontWeight: 700,
                  color: colors.red.DEFAULT,
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                  marginTop: 4,
                }}>
                  {currentStock ?? 0}
                  <span style={{ fontSize: 12, color: colors.gray.dimText, marginLeft: 4, fontWeight: 500 }}>
                    un.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Alerta */}
          <div>
            <label style={labelStyle}>Alertar quando estoque ≤ (opcional)</label>
            <input
              type="text"
              inputMode="numeric"
              value={stockAlertStr}
              onChange={e => setStockAlertStr(e.target.value.replace(/\D/g, ''))}
              placeholder="Ex: 5"
              style={{ ...inputStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
            />
          </div>

          {/* ───── Movimentações inline (só editando) ───── */}
          {isEditing && (
            <>
              <div style={{
                marginTop: 4,
                paddingTop: 14,
                borderTop: `1px dashed ${colors.gray.border}`,
              }}>
                <div style={{
                  fontSize: 11, fontWeight: 700,
                  color: colors.gray.dimText,
                  textTransform: 'uppercase',
                  letterSpacing: '.07em',
                  marginBottom: 10,
                }}>Nova movimentação</div>

                {/* Tipo */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 6,
                  marginBottom: 12,
                }}>
                  {TYPE_OPTIONS.map(opt => {
                    const isSelected = movType === opt.id
                    const Icon = opt.icon
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setMovType(opt.id)}
                        type="button"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 7,
                          padding: '8px 10px',
                          border: isSelected
                            ? `2px solid ${opt.color}`
                            : `1px solid ${colors.gray.borderMd}`,
                          borderRadius: 9,
                          background: isSelected ? opt.bg : 'transparent',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: `all ${transitions.fast}`,
                          fontFamily: 'inherit',
                          WebkitTapHighlightColor: 'transparent',
                        }}
                      >
                        <Icon size={13} color={opt.color} strokeWidth={2.2} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{
                            fontSize: 12, fontWeight: 700,
                            color: isSelected ? opt.color : colors.gray[900],
                          }}>{opt.label}</div>
                          <div style={{
                            fontSize: 9,
                            color: colors.gray.dimText,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>{opt.desc}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Quantidade */}
                <div style={{ marginBottom: 10 }}>
                  <label style={labelStyle}>
                    {movType === 'ADJUST' ? 'Novo saldo (contagem)' : 'Quantidade'}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={movQtyStr}
                    onChange={e => setMovQtyStr(e.target.value.replace(/\D/g, ''))}
                    placeholder="0"
                    style={{
                      ...inputStyle,
                      fontSize: 16,
                      fontWeight: 700,
                      textAlign: 'right',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  />
                </div>

                {/* Preview saldo */}
                {newStockPreview != null && (
                  <div style={{
                    marginBottom: 10,
                    padding: '8px 12px',
                    background: previewInvalid
                      ? 'rgba(220,38,38,0.08)'
                      : 'rgba(0,0,0,0.03)',
                    border: `1px solid ${previewInvalid ? colors.red.border : colors.gray.border}`,
                    borderRadius: 8,
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: colors.gray[700],
                  }}>
                    <span style={{ fontWeight: 600 }}>Saldo após</span>
                    <span style={{
                      fontSize: 14,
                      fontWeight: 700,
                      fontVariantNumeric: 'tabular-nums',
                      color: previewInvalid ? colors.red.DEFAULT : colors.gray[900],
                    }}>
                      {base} → <strong>{newStockPreview}</strong>
                      {previewInvalid && ' ⚠️'}
                    </span>
                  </div>
                )}
                {previewInvalid && (
                  <div style={{
                    marginBottom: 10,
                    padding: '8px 10px',
                    background: 'rgba(220,38,38,0.06)',
                    border: `1px solid ${colors.red.border}`,
                    borderRadius: 7,
                    fontSize: 11,
                    color: colors.red.DEFAULT,
                    fontWeight: 600,
                  }}>
                    Saldo não pode ficar negativo
                  </div>
                )}

                {/* Custo unitário (só pra entrada) */}
                {movType === 'IN' && (
                  <div style={{ marginBottom: 10 }}>
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
                        value={movUnitCostStr}
                        onChange={e => setMovUnitCostStr(e.target.value.replace(/[^\d,.]/g, ''))}
                        placeholder="0,00"
                        style={{ ...inputStyle, paddingLeft: 34, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
                      />
                    </div>
                  </div>
                )}

                {/* Motivo */}
                <div style={{ marginBottom: 10 }}>
                  <label style={labelStyle}>Motivo (opcional)</label>
                  <input
                    value={movReason}
                    onChange={e => setMovReason(e.target.value)}
                    placeholder={
                      movType === 'IN'   ? 'Ex: Compra fornecedor' :
                      movType === 'OUT'  ? 'Ex: Uso interno' :
                      movType === 'LOSS' ? 'Ex: Vencimento' :
                                           'Ex: Contagem mensal'
                    }
                    style={inputStyle}
                  />
                </div>

                {/* Referência */}
                {(movType === 'IN' || movType === 'OUT') && (
                  <div style={{ marginBottom: 10 }}>
                    <label style={labelStyle}>Referência (opcional)</label>
                    <input
                      value={movReference}
                      onChange={e => setMovReference(e.target.value)}
                      placeholder="Ex: NF-12345"
                      style={inputStyle}
                    />
                  </div>
                )}

                {movError && (
                  <div style={{
                    marginBottom: 10,
                    padding: '8px 10px',
                    background: 'rgba(220,38,38,0.06)',
                    border: `1px solid ${colors.red.border}`,
                    borderRadius: 7,
                    fontSize: 11,
                    color: colors.red.DEFAULT,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <AlertCircle size={12} strokeWidth={2.5} />
                    {movError}
                  </div>
                )}

                <button
                  onClick={submitMovement}
                  disabled={!movQtyStr || movSaving || previewInvalid}
                  type="button"
                  style={{
                    width: '100%',
                    padding: '11px',
                    borderRadius: 10,
                    border: 'none',
                    background: (!movQtyStr || movSaving || previewInvalid)
                      ? colors.gray.borderMd
                      : colors.red.gradient,
                    color: (!movQtyStr || movSaving || previewInvalid)
                      ? colors.gray.dimText
                      : '#fff',
                    fontSize: 13,
                    cursor: (!movQtyStr || movSaving || previewInvalid) ? 'not-allowed' : 'pointer',
                    fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    fontFamily: 'inherit',
                    boxShadow: (!movQtyStr || movSaving || previewInvalid)
                      ? 'none'
                      : `0 3px 10px ${colors.red.glow}`,
                  }}
                >
                  {movSaving
                    ? <><Loader2 size={13} style={{ animation: 'es-spin 0.8s linear infinite' }} />Registrando...</>
                    : <><Plus size={13} strokeWidth={2.5} />Registrar movimentação</>}
                </button>
              </div>

              {/* ───── Histórico inline ───── */}
              <div style={{
                marginTop: 4,
                paddingTop: 14,
                borderTop: `1px dashed ${colors.gray.border}`,
              }}>
                <div style={{
                  fontSize: 11, fontWeight: 700,
                  color: colors.gray.dimText,
                  textTransform: 'uppercase',
                  letterSpacing: '.07em',
                  marginBottom: 10,
                }}>Histórico ({movements.length})</div>

                {historyLoading ? (
                  <div style={{
                    padding: 20, textAlign: 'center',
                    fontSize: 12, color: colors.gray.dimText,
                  }}>
                    Carregando histórico...
                  </div>
                ) : movements.length === 0 ? (
                  <div style={{
                    padding: 18, textAlign: 'center',
                    fontSize: 12, color: colors.gray.dimText,
                    background: colors.background.page,
                    borderRadius: 9,
                    border: `1px dashed ${colors.gray.borderMd}`,
                  }}>
                    Nenhuma movimentação ainda.
                  </div>
                ) : (
                  <div style={{
                    display: 'flex', flexDirection: 'column', gap: 6,
                  }}>
                    {movements.map(m => <MovementItem key={m.id} movement={m} />)}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

function MovementItem({ movement }: { movement: StockMovement }) {
  const Icon  = ICON_MAP[movement.type]
  const color = MOVEMENT_TYPE_COLOR[movement.type]
  const delta = movementDelta(movement.type, movement.quantity, movement.stockBefore)

  return (
    <div style={{
      display: 'flex',
      gap: 10,
      padding: '10px 12px',
      background: '#fff',
      borderRadius: 9,
      border: `1px solid ${colors.gray.border}`,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 7,
        background: color.bg,
        color: color.fg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={13} strokeWidth={2.2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          marginBottom: 1,
        }}>
          <span style={{
            fontSize: 12, fontWeight: 700,
            color: colors.gray[900],
          }}>
            {MOVEMENT_TYPE_LABEL[movement.type]}
          </span>
          <span style={{
            fontSize: 12, fontWeight: 700,
            color: color.fg,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {formatDelta(delta)}
          </span>
        </div>
        <div style={{
          fontSize: 10,
          color: colors.gray.dimText,
          display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap',
        }}>
          <span>{formatRelative(movement.createdAt)}</span>
          {movement.user?.name && (
            <><span>·</span><span>{movement.user.name}</span></>
          )}
          <span>·</span>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>
            {movement.stockBefore} → {movement.stockAfter}
          </span>
        </div>
        {movement.reason && (
          <div style={{
            fontSize: 11,
            color: colors.gray[700],
            marginTop: 3,
            padding: '3px 6px',
            background: colors.background.page,
            borderRadius: 5,
            wordBreak: 'break-word',
          }}>
            {movement.reason}
          </div>
        )}
        {(movement.reference || movement.unitCost != null) && (
          <div style={{
            display: 'flex', gap: 8, marginTop: 4,
            fontSize: 10, color: colors.gray.dimText,
            flexWrap: 'wrap',
          }}>
            {movement.reference && <span>Ref: <strong>{movement.reference}</strong></span>}
            {movement.unitCost != null && <span>Custo un.: <strong>{formatBRL(movement.unitCost)}</strong></span>}
          </div>
        )}
      </div>
    </div>
  )
}
