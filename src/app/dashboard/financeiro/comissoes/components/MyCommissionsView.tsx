'use client'
// src/app/dashboard/financeiro/comissoes/components/MyCommissionsView.tsx
// Visão somente leitura para STAFF / BASIC_STAFF / RECEPTIONIST

import { useState, useEffect, useCallback } from 'react'
import { ChevronDown, ChevronRight, Check, Clock } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { colors, typography } from '@/shared/theme'
import { methodLabel, fmtPayoutPeriod } from '@/features/payouts/utils/format'

// ─── Types ────────────────────────────────────────────────────────────────────
type Period = 'week' | 'last_week' | 'month'

interface CommissionItem {
  id:         string
  name:       string
  type:       string
  clientName: string
  time:       string
  amount:     number
  baseAmount: number
  pct:        number
}

interface CommissionDay {
  date:         string
  label:        string
  serviceCount: number
  productCount: number
  total:        number
  items:        CommissionItem[]
}

interface PaidPayout {
  id:          string
  periodStart: string
  periodEnd:   string
  totalAmount: number
  paidAt:      string | null
  paidVia:     string | null
}

interface MyCommissions {
  periodLabel:  string
  periodStart:  string
  periodEnd:    string
  paymentDate:  string | null
  serviceTotal: number
  productTotal: number
  total:        number
  serviceCount: number
  productCount: number
  days:         CommissionDay[]
  paidPayouts:  PaidPayout[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtBRL(v: number) {
  return `R$ ${v.toFixed(2).replace('.', ',')}`
}

function fmtDateBR(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric' })
}

const PERIOD_LABELS: Record<Period, string> = {
  week:      'Esta semana',
  last_week: 'Semana passada',
  month:     'Este mês',
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function MyCommissionsView({ isMobile }: { isMobile: boolean }) {
  const [period,    setPeriod]    = useState<Period>('week')
  const [data,      setData]      = useState<MyCommissions | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [expanded,  setExpanded]  = useState<Set<string>>(new Set())

  const fetchData = useCallback(async (p: Period) => {
    try {
      setLoading(true)
      const res = await api.get('/payouts/my-commissions', { params: { period: p } })
      const d   = res.data?.data ?? null
      setData(d)
      // Auto-expande o primeiro dia (hoje)
      if (d?.days?.[0]) setExpanded(new Set([d.days[0].date]))
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData(period) }, [fetchData, period])

  function toggleDay(date: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(date) ? next.delete(date) : next.add(date)
      return next
    })
  }

  const wrap: React.CSSProperties = {
    maxWidth:   680,
    padding:    isMobile ? '0 12px' : 0,
    fontFamily: typography.fontFamily,
    animation:  'fadeUp 0.3s ease',
  }

  if (loading) return (
    <div style={{ ...wrap, display:'flex', alignItems:'center', justifyContent:'center', padding:60 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ width:28, height:28, borderRadius:'50%', border:`3px solid rgba(220,38,38,0.15)`, borderTopColor:'#dc2626', animation:'spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <div style={wrap}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom:16 }}>
        <h1 style={{ fontSize: isMobile ? 22 : 26, fontWeight:700, color:typography.color.primary, margin:'0 0 4px', letterSpacing:'-0.02em' }}>
          Minhas comissões
        </h1>
        <p style={{ fontSize:13, color:typography.color.muted, margin:0 }}>
          {data?.periodLabel ?? '—'}
        </p>
      </div>

      {/* ── Seletor de período ── */}
      <div style={{
        display:'flex', gap:6, marginBottom:16,
        background: colors.background?.page ?? '#f9fafb',
        borderRadius:10, padding:4,
        border:`0.5px solid ${colors.gray.border}`,
        width:'fit-content',
      }}>
        {(['week','last_week','month'] as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            style={{
              padding:'6px 14px', borderRadius:8, border:'none',
              background: period === p ? '#fff' : 'transparent',
              color:      period === p ? typography.color.primary : typography.color.muted,
              fontSize:   12, fontWeight: period === p ? 700 : 500,
              cursor:'pointer', fontFamily:'inherit',
              boxShadow: period === p ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition:'all 150ms ease',
            }}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {/* ── Hero total ── */}
      <div style={{
        background:'#fff',
        border:`0.5px solid ${colors.gray.borderMd}`,
        borderTop:`3px solid #16a34a`,
        borderRadius:14,
        padding:'20px 24px',
        marginBottom:10,
        boxShadow:'0 1px 3px rgba(0,0,0,0.04)',
      }}>
        {/* Total principal */}
        <div style={{ textAlign:'center', paddingBottom:16, borderBottom:`0.5px solid ${colors.gray.border}`, marginBottom:16 }}>
          <div style={{ fontSize:11, color:typography.color.muted, textTransform:'uppercase', letterSpacing:'.07em', marginBottom:6 }}>
            A receber
          </div>
          <div style={{ fontSize: isMobile ? 36 : 48, fontWeight:700, color:'#16a34a', lineHeight:1, letterSpacing:'-1px' }}>
            {fmtBRL(data?.total ?? 0)}
          </div>
          <div style={{ fontSize:12, color:typography.color.muted, marginTop:8, display:'flex', alignItems:'center', justifyContent:'center', gap:10, flexWrap:'wrap' }}>
            <span>{(data?.serviceCount ?? 0) + (data?.productCount ?? 0)} atendimentos</span>
            {data?.paymentDate && (
              <>
                <span style={{ width:3, height:3, borderRadius:'50%', background:colors.gray.borderMd, display:'inline-block' }} />
                <span style={{ display:'inline-flex', alignItems:'center', gap:4, color:'#854d0e', background:'#fef9c3', padding:'2px 8px', borderRadius:999, fontSize:11, fontWeight:600 }}>
                  <Clock size={10} />
                  Pagamento {data.paymentDate}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Barra de progresso semanal */}
        {period === 'week' && (() => {
          const totalDays = 7
          const today = new Date()
          const start = new Date(data?.periodStart ?? today)
          const elapsed = Math.max(0, Math.min(7, Math.ceil((today.getTime() - start.getTime()) / (1000*60*60*24)) + 1))
          const pct = Math.round((elapsed / totalDays) * 100)
          const dayNames = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']
          return (
            <div style={{ marginBottom:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5, fontSize:10, color:typography.color.muted }}>
                <span>{dayNames[0]}</span>
                <span style={{ color:'#16a34a', fontWeight:600 }}>Hoje · {pct}% da semana</span>
                <span>{dayNames[6]}</span>
              </div>
              <div style={{ background:colors.background?.page ?? '#f3f4f6', borderRadius:999, height:6, overflow:'hidden' }}>
                <div style={{ width:`${pct}%`, height:'100%', background:'#16a34a', borderRadius:999, transition:'width 600ms ease' }} />
              </div>
            </div>
          )
        })()}

        {/* Mini KPIs */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <div style={{ background:colors.background?.page ?? '#f9fafb', borderRadius:10, padding:'10px 14px' }}>
            <div style={{ fontSize:10, color:typography.color.muted, marginBottom:3, textTransform:'uppercase', letterSpacing:'.05em' }}>Serviços</div>
            <div style={{ fontSize:16, fontWeight:700, color:typography.color.primary }}>{fmtBRL(data?.serviceTotal ?? 0)}</div>
            <div style={{ fontSize:10, color:typography.color.muted, marginTop:2 }}>{data?.serviceCount ?? 0} atendimentos</div>
          </div>
          <div style={{ background:colors.background?.page ?? '#f9fafb', borderRadius:10, padding:'10px 14px' }}>
            <div style={{ fontSize:10, color:typography.color.muted, marginBottom:3, textTransform:'uppercase', letterSpacing:'.05em' }}>Produtos</div>
            <div style={{ fontSize:16, fontWeight:700, color:typography.color.primary }}>{fmtBRL(data?.productTotal ?? 0)}</div>
            <div style={{ fontSize:10, color:typography.color.muted, marginTop:2 }}>{data?.productCount ?? 0} {data?.productCount === 1 ? 'item' : 'itens'}</div>
          </div>
        </div>
      </div>

      {/* ── Dias detalhados ── */}
      {data && data.days.length > 0 && (
        <div style={{
          background:'#fff',
          border:`0.5px solid ${colors.gray.borderMd}`,
          borderRadius:14,
          overflow:'hidden',
          marginBottom:10,
          boxShadow:'0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{ padding:'12px 16px 8px', fontSize:11, fontWeight:700, color:typography.color.muted, textTransform:'uppercase', letterSpacing:'.06em', borderBottom:`0.5px solid ${colors.gray.border}` }}>
            Detalhamento por dia
          </div>

          {data.days.map((day, idx) => {
            const isOpen = expanded.has(day.date)
            const isLast = idx === data.days.length - 1
            return (
              <div key={day.date} style={{ borderBottom: isLast ? 'none' : `0.5px solid ${colors.gray.border}` }}>
                {/* Header do dia */}
                <button
                  onClick={() => toggleDay(day.date)}
                  style={{
                    width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'12px 16px',
                    background: isOpen ? colors.background?.page ?? '#f9fafb' : 'transparent',
                    border:'none', cursor:'pointer', fontFamily:'inherit',
                    transition:'background 150ms ease',
                  }}
                >
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ color:typography.color.muted }}>
                      {isOpen
                        ? <ChevronDown size={15} />
                        : <ChevronRight size={15} />
                      }
                    </div>
                    <div style={{ textAlign:'left' }}>
                      <div style={{ fontSize:13, fontWeight:600, color:typography.color.primary }}>{day.label}</div>
                      <div style={{ fontSize:10, color:typography.color.muted, marginTop:1 }}>
                        {day.serviceCount > 0 && `${day.serviceCount} serviço${day.serviceCount > 1 ? 's' : ''}`}
                        {day.serviceCount > 0 && day.productCount > 0 && ' · '}
                        {day.productCount > 0 && `${day.productCount} produto${day.productCount > 1 ? 's' : ''}`}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize:15, fontWeight:700, color:typography.color.primary }}>
                    {fmtBRL(day.total)}
                  </div>
                </button>

                {/* Items do dia */}
                {isOpen && (
                  <div style={{ background:'#fff', borderTop:`0.5px solid ${colors.gray.border}` }}>
                    {day.items.map((item, iIdx) => (
                      <div
                        key={item.id}
                        style={{
                          display:'flex', alignItems:'center', gap:12,
                          padding:'10px 16px 10px 42px',
                          borderBottom: iIdx < day.items.length - 1 ? `0.5px solid ${colors.gray.border}` : 'none',
                        }}
                      >
                        <div style={{
                          width:8, height:8, borderRadius:'50%', flexShrink:0,
                          background: item.type === 'SERVICE' ? '#dc2626' : '#2563eb',
                        }} />
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:500, color:typography.color.primary, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                            {item.name}
                          </div>
                          <div style={{ fontSize:11, color:typography.color.muted, marginTop:1 }}>
                            {item.clientName} · {item.time}
                            {item.pct > 0 && ` · ${item.pct}% de ${fmtBRL(item.baseAmount)}`}
                          </div>
                        </div>
                        <div style={{ fontSize:14, fontWeight:700, color:typography.color.primary, flexShrink:0 }}>
                          {fmtBRL(item.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Já recebi ── */}
      {data && data.paidPayouts.length > 0 && (
        <div style={{
          background:'#fff',
          border:`0.5px solid ${colors.gray.borderMd}`,
          borderRadius:14,
          overflow:'hidden',
          marginBottom:10,
          boxShadow:'0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{ padding:'12px 16px 8px', fontSize:11, fontWeight:700, color:typography.color.muted, textTransform:'uppercase', letterSpacing:'.06em', borderBottom:`0.5px solid ${colors.gray.border}` }}>
            Já recebi
          </div>
          {data.paidPayouts.map((payout, idx) => (
            <div
              key={payout.id}
              style={{
                display:'flex', alignItems:'center', gap:12, padding:'12px 16px',
                borderBottom: idx < data.paidPayouts.length - 1 ? `0.5px solid ${colors.gray.border}` : 'none',
              }}
            >
              <div style={{
                width:36, height:36, borderRadius:10, flexShrink:0,
                background:'#f0fdf4', border:'0.5px solid #bbf7d0',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <Check size={16} color="#16a34a" />
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:500, color:typography.color.primary }}>
                  {fmtPayoutPeriod(payout.periodStart, payout.periodEnd)}
                </div>
                <div style={{ fontSize:11, color:typography.color.muted, marginTop:2 }}>
                  Pago em {fmtDateBR(payout.paidAt)}
                  {payout.paidVia && ` · ${methodLabel(payout.paidVia as Parameters<typeof methodLabel>[0])}`}
                </div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontSize:14, fontWeight:700, color:typography.color.primary }}>{fmtBRL(payout.totalAmount)}</div>
                <span style={{ fontSize:10, fontWeight:600, color:'#166534', background:'#f0fdf4', padding:'1px 7px', borderRadius:999 }}>
                  Pago
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Estado vazio */}
      {data && data.days.length === 0 && (
        <div style={{
          background:'#fff', border:`0.5px solid ${colors.gray.borderMd}`,
          borderRadius:14, padding:'48px 24px', textAlign:'center',
          boxShadow:'0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{ fontSize:32, marginBottom:12 }}>💈</div>
          <div style={{ fontSize:15, fontWeight:600, color:typography.color.primary, marginBottom:4 }}>
            Nenhuma comissão neste período
          </div>
          <div style={{ fontSize:13, color:typography.color.muted }}>
            As comissões aparecem aqui conforme os atendimentos são confirmados.
          </div>
        </div>
      )}
    </div>
  )
}
