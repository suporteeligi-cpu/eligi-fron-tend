'use client'
// src/app/dashboard/estoque/components/StockCountMode.tsx
// @eligi:stock-count-mode
//
// Conferência de estoque: conta a prateleira inteira e grava de uma vez.
//
// Antes, ajustar 40 produtos eram 40 requisições sem atomicidade. Se a décima
// falhasse, o estoque ficava meio conferido e ninguém sabia qual metade era
// confiável. Aqui é POST /products/stock/count: uma transação, tudo ou nada.
//
// Nada é gravado até o modal de confirmação. O motivo é obrigatório ANTES de
// contar, porque vai em toda movimentação gerada.

import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  X, Minus, Plus, ClipboardList, TriangleAlert, ArrowDown, ArrowUp, Check, Loader2,
} from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { colors, typography } from '@/shared/theme'
import { Product } from '@/features/products/types'

type OutType = 'LOSS' | 'OUT' | 'ADJUST'

const OUT_LABEL: Record<OutType, string> = {
  LOSS:   'Perda',
  OUT:    'Venda avulsa',
  ADJUST: 'Ajuste',
}

interface Props {
  products: Product[]
  isMobile: boolean
  onClose:  () => void
  /** Recebe os produtos com o saldo novo, para a lista atrás refletir. */
  onSaved:  (updates: Array<{ id: string; stock: number }>, resumo: string) => void
}

export default function StockCountMode({ products, isMobile, onClose, onSaved }: Props) {
  // Só produtos com controle: sem trackStock não há saldo para conferir.
  const itens = useMemo(() => products.filter(p => p.trackStock), [products])

  const [reason,  setReason]  = useState('')
  const [counted, setCounted] = useState<Record<string, number>>(
    () => Object.fromEntries(itens.map(p => [p.id, p.stock ?? 0])),
  )
  const [query,   setQuery]   = useState('')
  const [confirm, setConfirm] = useState(false)
  const [outType, setOutType] = useState<OutType>('LOSS')
  const [saving,  setSaving]  = useState(false)
  const [erro,    setErro]    = useState<string | null>(null)

  const visiveis = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return itens
    return itens.filter(p =>
      p.name.toLowerCase().includes(q) || (p.sku ?? '').toLowerCase().includes(q))
  }, [itens, query])

  const diffs = useMemo(() => {
    const out: Array<{ p: Product; antes: number; agora: number; delta: number }> = []
    for (const p of itens) {
      const antes = p.stock ?? 0
      const agora = counted[p.id] ?? antes
      if (agora !== antes) out.push({ p, antes, agora, delta: agora - antes })
    }
    return out
  }, [itens, counted])

  const entradas = diffs.filter(d => d.delta > 0)
  const saidas   = diffs.filter(d => d.delta < 0)
  const totalIn  = entradas.reduce((s, d) => s + d.delta, 0)
  const totalOut = saidas.reduce((s, d) => s - d.delta, 0)

  const motivoOk = reason.trim().length >= 3
  const podeRevisar = motivoOk && diffs.length > 0

  function ajusta(id: string, passo: number) {
    setCounted(prev => {
      const atual = prev[id] ?? 0
      const novo = Math.max(0, atual + passo)
      return { ...prev, [id]: novo }
    })
  }

  async function gravar() {
    if (saving) return
    try {
      setSaving(true)
      setErro(null)
      await api.post('/products/stock/count', {
        reason:  reason.trim(),
        outType,
        items:   diffs.map(d => ({ productId: d.p.id, counted: d.agora })),
      })
      onSaved(
        diffs.map(d => ({ id: d.p.id, stock: d.agora })),
        `${diffs.length} produto${diffs.length !== 1 ? 's' : ''} conferido${diffs.length !== 1 ? 's' : ''}`,
      )
      onClose()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
      setErro(msg ?? 'Não foi possível gravar a conferência.')
      setSaving(false)
    }
  }

  const pad = isMobile ? 14 : 22

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 11000, background: colors.background.page,
      display: 'flex', flexDirection: 'column', fontFamily: typography.fontFamily,
    }}>
      <style>{'@keyframes sc-spin { to { transform: rotate(360deg) } }'}</style>

      {/* Cabeçalho */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: `14px ${pad}px`,
        background: '#16161a', color: '#fff', flexShrink: 0,
      }}>
        <ClipboardList size={21} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 15.5, fontWeight: 700 }}>Conferência de estoque</span>
          <span style={{ display: 'block', fontSize: 12.5, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
            Nada é gravado até você confirmar
          </span>
        </span>
        <button
          onClick={onClose}
          aria-label="Sair da conferência"
          style={{
            width: 40, height: 40, borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)',
            background: 'transparent', color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >
          <X size={19} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: `16px ${pad}px 20px` }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          {/* Motivo */}
          <div style={{ marginBottom: 16 }}>
            <div style={lbl}>Motivo da conferência <span style={{ color: colors.red.DEFAULT }}>*</span></div>
            <input
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Ex.: contagem mensal de setembro"
              style={{
                width: '100%', minHeight: 52, borderRadius: 14, padding: '0 15px',
                fontSize: 16, fontFamily: 'inherit', background: '#fff', outline: 'none',
                border: `1.5px solid ${motivoOk ? colors.gray.borderMd : 'rgba(220,38,38,0.45)'}`,
                boxSizing: 'border-box', color: colors.gray[900],
              }}
            />
            <p style={{ margin: '7px 2px 0', fontSize: 12.5, color: colors.gray.dimText }}>
              Fica no histórico de toda movimentação desta conferência.
            </p>
          </div>

          {itens.length > 8 && (
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar produto na lista"
              style={{
                width: '100%', minHeight: 48, borderRadius: 13, padding: '0 15px',
                fontSize: 16, fontFamily: 'inherit', background: '#fff', outline: 'none',
                border: `1px solid ${colors.gray.borderMd}`, marginBottom: 12,
                boxSizing: 'border-box',
              }}
            />
          )}

          {/* Lista */}
          <div style={{
            background: '#fff', border: `1px solid ${colors.gray.borderMd}`,
            borderRadius: 16, overflow: 'hidden',
          }}>
            {visiveis.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', fontSize: 14, color: colors.gray.dimText }}>
                Nenhum produto com controle de estoque.
              </div>
            ) : visiveis.map((p, i) => {
              const antes = p.stock ?? 0
              const agora = counted[p.id] ?? antes
              const d = agora - antes
              return (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 11, padding: '11px 14px',
                  borderTop: i === 0 ? 'none' : `1px solid ${colors.gray.border}`,
                  background: d !== 0 ? '#fffdf5' : 'transparent',
                }}>
                  <span style={{
                    width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                    background: p.color ?? colors.gray.hover,
                  }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{
                      display: 'block', fontSize: 15, fontWeight: 700, letterSpacing: '-0.015em',
                      color: colors.gray[900], whiteSpace: 'nowrap', overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>{p.name}</span>
                    <span style={{ display: 'block', fontSize: 12.5, color: colors.gray.dimText, marginTop: 2 }}>
                      sistema: {antes} un.
                    </span>
                  </span>
                  {d !== 0 && (
                    <span style={{
                      fontSize: 13, fontWeight: 700, minWidth: 30, textAlign: 'right',
                      fontFamily: '"Space Grotesk",inherit', fontVariantNumeric: 'tabular-nums',
                      color: d > 0 ? '#0f6e56' : colors.red.dark,
                    }}>{d > 0 ? '+' : ''}{d}</span>
                  )}
                  <span style={{
                    display: 'flex', alignItems: 'center', gap: 3, background: colors.gray.hover,
                    borderRadius: 13, padding: 4, flexShrink: 0,
                  }}>
                    <button onClick={() => ajusta(p.id, -1)} aria-label={`Diminuir ${p.name}`} style={stepBtn}>
                      <Minus size={18} strokeWidth={2.4} />
                    </button>
                    <span style={{
                      minWidth: 42, textAlign: 'center', fontSize: 18, fontWeight: 700,
                      fontFamily: '"Space Grotesk",inherit', fontVariantNumeric: 'tabular-nums',
                      color: colors.gray[900],
                    }}>{agora}</span>
                    <button onClick={() => ajusta(p.id, 1)} aria-label={`Aumentar ${p.name}`} style={stepBtn}>
                      <Plus size={18} strokeWidth={2.4} />
                    </button>
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Barra fixa */}
      <div style={{
        flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12,
        padding: `12px ${pad}px`, paddingBottom: isMobile ? 'max(12px,env(safe-area-inset-bottom))' : 12,
        background: '#fff', borderTop: `1px solid ${colors.gray.borderMd}`,
      }}>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 14.5, fontWeight: 700, color: colors.gray[900] }}>
            {diffs.length === 0
              ? 'Nenhuma diferença ainda'
              : `${diffs.length} produto${diffs.length !== 1 ? 's' : ''} alterado${diffs.length !== 1 ? 's' : ''}`}
          </span>
          {diffs.length > 0 && (
            <span style={{ display: 'block', fontSize: 12.5, color: colors.gray.dimText, marginTop: 2 }}>
              +{totalIn} entraram · -{totalOut} saíram
            </span>
          )}
        </span>
        <button
          onClick={() => setConfirm(true)}
          disabled={!podeRevisar}
          style={{
            minHeight: 48, padding: '0 22px', borderRadius: 14, border: 'none',
            background: podeRevisar ? colors.red.gradient : colors.gray.hover,
            color: podeRevisar ? '#fff' : colors.gray.dimTextLight,
            fontSize: 15.5, fontWeight: 700, fontFamily: 'inherit',
            cursor: podeRevisar ? 'pointer' : 'not-allowed', flexShrink: 0,
          }}
        >
          Revisar
        </button>
      </div>

      {/* Confirmação */}
      {confirm && (
        <>
          <div
            onClick={() => !saving && setConfirm(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 11001 }}
          />
          <div style={{
            position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
            width: 'calc(100% - 28px)', maxWidth: 430, maxHeight: '88vh', zIndex: 11002,
            background: '#fff', borderRadius: 22, display: 'flex', flexDirection: 'column',
            overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.28)',
          }}>
            <div style={{ display: 'flex', gap: 12, padding: '20px 20px 14px' }}>
              <span style={{
                width: 44, height: 44, borderRadius: 13, background: '#fffbeb',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <TriangleAlert size={22} color="#b45309" />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 19, fontWeight: 700, letterSpacing: '-0.03em' }}>
                  Gravar conferência?
                </span>
                <span style={{ display: 'block', fontSize: 13.5, color: colors.gray.dimText, marginTop: 3, lineHeight: 1.45 }}>
                  Isso cria {diffs.length} movimenta{diffs.length !== 1 ? 'ções' : 'ção'} no histórico e
                  não pode ser desfeito em bloco.
                </span>
              </span>
            </div>

            <div style={{ padding: '0 20px', overflowY: 'auto', flex: 1 }}>
              {entradas.length > 0 && (
                <Bloco titulo="Entrou" cor="#0f6e56" icone={<ArrowDown size={15} color="#16a34a" />}
                       total={`+${totalIn} un.`} itens={entradas} />
              )}
              {saidas.length > 0 && (
                <Bloco titulo="Saiu" cor={colors.red.dark} icone={<ArrowUp size={15} color="#dc2626" />}
                       total={`-${totalOut} un.`} itens={saidas} />
              )}

              {saidas.length > 0 && (
                <>
                  <div style={{ ...lbl, marginTop: 4 }}>Como registrar as saídas</div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                    {(['LOSS', 'OUT', 'ADJUST'] as OutType[]).map(t => (
                      <button
                        key={t}
                        onClick={() => setOutType(t)}
                        style={{
                          flex: 1, minHeight: 44, borderRadius: 12, fontFamily: 'inherit',
                          fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
                          border: `1.5px solid ${outType === t ? colors.red.DEFAULT : colors.gray.borderMd}`,
                          background: outType === t ? 'rgba(220,38,38,0.05)' : '#fff',
                          color: outType === t ? colors.red.dark : colors.gray[700],
                        }}
                      >
                        {OUT_LABEL[t]}
                      </button>
                    ))}
                  </div>
                  <p style={{ margin: '0 0 14px', fontSize: 12.5, color: colors.gray.dimText, lineHeight: 1.5 }}>
                    O que entrou vai como <b>Entrada</b>. Para detalhar item por item,
                    use o painel do produto depois.
                  </p>
                </>
              )}

              {erro && (
                <div style={{
                  padding: '12px 14px', borderRadius: 13, marginBottom: 14,
                  background: 'rgba(220,38,38,0.06)', border: `1px solid ${colors.red.border}`,
                  color: colors.red.dark, fontSize: 13.5, lineHeight: 1.45,
                }}>{erro}</div>
              )}
            </div>

            <div style={{
              display: 'flex', gap: 10, padding: '14px 20px 18px',
              borderTop: `1px solid ${colors.gray.border}`,
            }}>
              <button
                onClick={() => setConfirm(false)}
                disabled={saving}
                style={{
                  flex: 1, minHeight: 48, borderRadius: 14, fontFamily: 'inherit',
                  border: `1.5px solid ${colors.gray.borderMd}`, background: '#fff',
                  fontSize: 15, fontWeight: 700, cursor: saving ? 'default' : 'pointer',
                  color: colors.gray[700],
                }}
              >
                Voltar
              </button>
              <button
                onClick={gravar}
                disabled={saving}
                style={{
                  flex: 2, minHeight: 48, borderRadius: 14, border: 'none',
                  background: colors.red.gradient, color: '#fff', fontFamily: 'inherit',
                  fontSize: 15.5, fontWeight: 700, cursor: saving ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving
                  ? <Loader2 size={18} style={{ animation: 'sc-spin 0.8s linear infinite' }} />
                  : <Check size={18} />}
                {saving ? 'Gravando...' : 'Gravar'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>,
    document.body,
  )
}

function Bloco({ titulo, cor, icone, total, itens }: {
  titulo: string
  cor: string
  icone: React.ReactNode
  total: string
  itens: Array<{ p: Product; antes: number; agora: number; delta: number }>
}) {
  return (
    <div style={{
      border: `1px solid ${colors.gray.borderMd}`, borderRadius: 14,
      padding: '4px 14px', marginBottom: 12,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '11px 0 8px',
        fontSize: 12.5, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase',
        color: colors.gray.dimText, borderBottom: `1px solid ${colors.gray.border}`,
      }}>
        {icone} {titulo}
        <span style={{
          marginLeft: 'auto', fontSize: 14, color: cor, letterSpacing: '-0.02em',
          fontFamily: '"Space Grotesk",inherit', fontVariantNumeric: 'tabular-nums',
        }}>{total}</span>
      </div>
      {itens.map(({ p, antes, agora, delta }, i) => (
        <div key={p.id} style={{
          display: 'flex', alignItems: 'center', gap: 9, padding: '9px 0', fontSize: 14.5,
          borderTop: i === 0 ? 'none' : `1px solid ${colors.gray.border}`,
        }}>
          <span style={{
            width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
            background: p.color ?? colors.gray.borderMd,
          }} />
          <span style={{
            flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{p.name}</span>
          <span style={{ fontSize: 12.5, color: colors.gray.dimText }}>{antes} → {agora}</span>
          <span style={{
            minWidth: 28, textAlign: 'right', color: cor, fontWeight: 700,
            fontFamily: '"Space Grotesk",inherit', fontVariantNumeric: 'tabular-nums',
          }}>{delta > 0 ? '+' : ''}{delta}</span>
        </div>
      ))}
    </div>
  )
}

const lbl: React.CSSProperties = {
  fontSize: 12.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase',
  color: colors.gray.dimText, marginBottom: 9,
}

const stepBtn: React.CSSProperties = {
  width: 42, height: 42, border: 'none', borderRadius: 11, background: '#fff',
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  boxShadow: '0 1px 2px rgba(0,0,0,0.07)', color: colors.gray[700],
  touchAction: 'manipulation',
}
