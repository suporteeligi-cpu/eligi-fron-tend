'use client'
// src/app/dashboard/financeiro/comissoes/components/MyCommissionsView.tsx
// Visao somente leitura para STAFF / BASIC_STAFF / RECEPTIONIST
// Direcao A (performance): hero + delta + KPIs + por dia + onde rende mais + detalhamento

import { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronDown, ChevronRight, Check, Clock, TrendingUp, TrendingDown } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { colors, typography } from '@/shared/theme'
import { methodLabel, fmtPayoutPeriod } from '@/features/payouts/utils/format'

// --- Types ---
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
  periodLabel:    string
  periodStart:    string
  periodEnd:      string
  paymentDate:    string | null
  serviceTotal:   number
  productTotal:   number
  total:          number
  previousTotal?: number
  serviceCount:   number
  productCount:   number
  days:           CommissionDay[]
  paidPayouts:    PaidPayout[]
}

// --- Helpers ---
function fmtBRL(v: number) {
  return `R$ ${(v ?? 0).toFixed(2).replace('.', ',')}`
}

function fmtDateBR(iso: string | null) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric' })
}

const PERIOD_LABELS: Record<Period, string> = {
  week:      'Esta semana',
  last_week: 'Semana passada',
  month:     'Este mes',
}

const cardStyle: React.CSSProperties = {
  background:'#fff',
  border:`0.5px solid ${colors.gray.borderMd}`,
  borderRadius:14,
  marginBottom:10,
  boxShadow:'0 1px 3px rgba(0,0,0,0.04)',
}

function SecTitle({ children, bordered }: { children: React.ReactNode; bordered?: boolean }) {
  return (
    <div style={{
      padding: bordered ? '12px 16px 8px' : '12px 18px 0',
      fontSize:11, fontWeight:700, color:typography.color.muted,
      textTransform:'uppercase', letterSpacing:'.06em',
      borderBottom: bordered ? `0.5px solid ${colors.gray.border}` : 'none',
    }}>
      {children}
    </div>
  )
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div style={{ background:colors.background?.page ?? '#f9fafb', borderRadius:10, padding:'10px 14px' }}>
      <div style={{ fontSize:10, color:typography.color.muted, marginBottom:3, textTransform:'uppercase', letterSpacing:'.05em' }}>{label}</div>
      <div style={{ fontSize:16, fontWeight:700, color:typography.color.primary }}>{value}</div>
      {hint && <div style={{ fontSize:10, color:typography.color.muted, marginTop:2 }}>{hint}</div>}
    </div>
  )
}

// --- Componente principal ---
export default function MyCommissionsView({ isMobile }: { isMobile: boolean }) {
  const [period,    setPeriod]    = useState<Period>('week')
  const [data,      setData]      = useState<MyCommissions | null>(null)
  const [firstLoad, setFirstLoad] = useState(true)
  const [expanded,  setExpanded]  = useState<Set<string>>(new Set())

  const cacheRef = useRef<Partial<Record<Period, MyCommissions>>>({})
  const reqRef   = useRef(0)

  // Render rapida: cache por periodo, troca otimista, token contra resposta tardia,
  // spinner so no 1o load.
  const fetchData = useCallback(async (p: Period) => {
    const token  = ++reqRef.current
    const cached = cacheRef.current[p]
    if (cached) {
      setData(cached)
      setExpanded(cached.days[0] ? new Set([cached.days[0].date]) : new Set())
    }
    try {
      const res = await api.get('/payouts/my-commissions', { params: { period: p } })
      const d: MyCommissions | null = res.data?.data ?? null
      if (token !== reqRef.current) return
      if (d) cacheRef.current[p] = d
      setData(d)
      setExpanded(d?.days?.[0] ? new Set([d.days[0].date]) : new Set())
    } catch {
      if (token !== reqRef.current) return
      if (!cached) setData(null)
    } finally {
      if (token === reqRef.current) setFirstLoad(false)
    }
  }, [])

  useEffect(() => { void fetchData(period) }, [fetchData, period])

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

  if (firstLoad && !data) return (
    <div style={{ ...wrap, display:'flex', alignItems:'center', justifyContent:'center', padding:60 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ width:28, height:28, borderRadius:'50%', border:`3px solid rgba(220,38,38,0.15)`, borderTopColor:'#dc2626', animation:'spin 0.8s linear infinite' }} />
    </div>
  )

  // --- Derivados (client-side, a partir do que o back ja devolve) ---
  const atend = (data?.serviceCount ?? 0) + (data?.productCount ?? 0)
  const avg   = atend ? ((data?.total ?? 0) / atend) : 0

  let bestDay: CommissionDay | null = null
  if (data) for (const d of data.days) { if (!bestDay || d.total > bestDay.total) bestDay = d }

  const delta = (data?.previousTotal != null && data.previousTotal > 0)
    ? Math.round((data.total - data.previousTotal) / data.previousTotal * 100)
    : null

  const ranking = (() => {
    const m = new Map<string, number>()
    data?.days.forEach(d => d.items.forEach(i => m.set(i.name, (m.get(i.name) ?? 0) + i.amount)))
    const arr = Array.from(m, ([name, v]) => ({ name, v })).sort((a, b) => b.v - a.v).slice(0, 5)
    const max = arr.length ? arr[0].v : 1
    return arr.map(r => ({ name: r.name, v: r.v, w: Math.round(r.v / max * 100) }))
  })()

  return (
    <div style={wrap}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ marginBottom:16 }}>
        <h1 style={{ fontSize: isMobile ? 22 : 26, fontWeight:700, color:typography.color.primary, margin:'0 0 4px', letterSpacing:'-0.02em' }}>
          Minhas comissoes
        </h1>
        <p style={{ fontSize:13, color:typography.color.muted, margin:0 }}>
          {data?.periodLabel ?? '-'}
        </p>
      </div>

      {/* Seletor de periodo */}
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

      {/* Hero total */}
      <div style={{
        background:'#fff',
        border:`0.5px solid ${colors.gray.borderMd}`,
        borderTop:`3px solid #16a34a`,
        borderRadius:14,
        marginBottom:10,
        boxShadow:'0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{ textAlign:'center', padding:'20px 24px 16px', borderBottom:`0.5px solid ${colors.gray.border}` }}>
          <div style={{ fontSize:11, color:typography.color.muted, textTransform:'uppercase', letterSpacing:'.07em', marginBottom:6 }}>
            A receber
          </div>
          <div style={{ fontSize: isMobile ? 36 : 46, fontWeight:700, color:'#16a34a', lineHeight:1, letterSpacing:'-1px' }}>
            {fmtBRL(data?.total ?? 0)}
          </div>
          <div style={{ fontSize:12, color:typography.color.muted, marginTop:10, display:'flex', alignItems:'center', justifyContent:'center', gap:8, flexWrap:'wrap' }}>
            {delta != null && (
              <span style={{
                display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:600,
                color:      delta >= 0 ? '#166534' : '#991b1b',
                background:  delta >= 0 ? '#f0fdf4' : '#fef2f2',
                padding:'2px 8px', borderRadius:999,
              }}>
                {delta >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {delta >= 0 ? '+' : ''}{delta}% vs anterior
              </span>
            )}
            <span>{atend} atendimentos</span>
            {data?.paymentDate && (
              <span style={{ display:'inline-flex', alignItems:'center', gap:4, color:'#854d0e', background:'#fef9c3', padding:'2px 8px', borderRadius:999, fontSize:11, fontWeight:600 }}>
                <Clock size={10} />
                Pgto {data.paymentDate}
              </span>
            )}
          </div>
        </div>

        {/* Mini KPIs 2x2 */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, padding:'16px 24px' }}>
          <Kpi label="Comissao media" value={fmtBRL(avg)} />
          <Kpi label="Melhor dia" value={bestDay ? fmtBRL(bestDay.total) : '-'} hint={bestDay ? bestDay.label.replace('Hoje, ','').replace('Ontem, ','') : undefined} />
          <Kpi label={`Servicos · ${data?.serviceCount ?? 0}`} value={fmtBRL(data?.serviceTotal ?? 0)} />
          <Kpi label={`Produtos · ${data?.productCount ?? 0}`} value={fmtBRL(data?.productTotal ?? 0)} />
        </div>
      </div>

      {/* Por dia */}
      {data && data.days.length > 0 && (
        <div style={cardStyle}>
          <SecTitle>Por dia</SecTitle>
          <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:104, padding:'14px 18px 10px' }}>
            {[...data.days].reverse().map(d => {
              const h = Math.max(Math.round(d.total / (bestDay?.total || 1) * 100), 4)
              const isBest = !!bestDay && d.date === bestDay.date
              return (
                <div key={d.date} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:5, minWidth:0 }}>
                  <div title={fmtBRL(d.total)} style={{ width:'100%', height:`${h}%`, background:'#16a34a', opacity:isBest?1:0.75, borderRadius:'4px 4px 0 0', minHeight:3 }} />
                  <div style={{ fontSize:10, color:typography.color.muted }}>{d.date.slice(8,10)}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Onde rende mais */}
      {ranking.length > 0 && (
        <div style={cardStyle}>
          <SecTitle>Onde rende mais</SecTitle>
          <div style={{ display:'flex', flexDirection:'column', gap:10, padding:'12px 18px 16px' }}>
            {ranking.map(r => (
              <div key={r.name}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:5, color:typography.color.primary }}>
                  <span style={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{r.name}</span>
                  <span style={{ color:typography.color.muted, flexShrink:0, marginLeft:8 }}>{fmtBRL(r.v)}</span>
                </div>
                <div style={{ height:7, borderRadius:999, background:colors.background?.page ?? '#f3f4f6', overflow:'hidden' }}>
                  <div style={{ width:`${r.w}%`, height:'100%', background:colors.red.DEFAULT, borderRadius:999 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detalhamento por dia */}
      {data && data.days.length > 0 && (
        <div style={{ ...cardStyle, overflow:'hidden' }}>
          <SecTitle bordered>Detalhamento por dia</SecTitle>
          {data.days.map((day, idx) => {
            const isOpen = expanded.has(day.date)
            const isLast = idx === data.days.length - 1
            return (
              <div key={day.date} style={{ borderBottom: isLast ? 'none' : `0.5px solid ${colors.gray.border}` }}>
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
                      {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                    </div>
                    <div style={{ textAlign:'left' }}>
                      <div style={{ fontSize:13, fontWeight:600, color:typography.color.primary }}>{day.label}</div>
                      <div style={{ fontSize:10, color:typography.color.muted, marginTop:1 }}>
                        {day.serviceCount > 0 && `${day.serviceCount} servico${day.serviceCount > 1 ? 's' : ''}`}
                        {day.serviceCount > 0 && day.productCount > 0 && ' · '}
                        {day.productCount > 0 && `${day.productCount} produto${day.productCount > 1 ? 's' : ''}`}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize:15, fontWeight:700, color:typography.color.primary }}>
                    {fmtBRL(day.total)}
                  </div>
                </button>

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

      {/* Ja recebi */}
      {data && data.paidPayouts.length > 0 && (
        <div style={{ ...cardStyle, overflow:'hidden' }}>
          <SecTitle bordered>Ja recebi</SecTitle>
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
            Nenhuma comissao neste periodo
          </div>
          <div style={{ fontSize:13, color:typography.color.muted }}>
            As comissoes aparecem aqui conforme os atendimentos sao confirmados.
          </div>
        </div>
      )}
    </div>
  )
}
