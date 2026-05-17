'use client'
// src/app/dashboard/clientes/id/page.tsx

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ChevronLeft, Phone, Calendar, TrendingUp, X, Ban, Clock, CheckCircle } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { colors, typography, radius, shadows, transitions, glass } from '@/shared/theme'
import { colorToGradient } from '@/features/agenda/constants/serviceColors'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
dayjs.locale('pt-br')

interface Booking {
  id:               string
  startAt:          string
  endAt:            string
  status:           'CONFIRMED' | 'COMPLETED' | 'CANCELED'
  serviceName:      string
  serviceColor:     string | null
  servicePrice:     number | null
  professionalName: string | null
}

interface ClientProfile {
  id:        string
  name:      string
  phone:     string
  createdAt: string
  metrics: {
    totalBookings: number
    completed:     number
    canceled:      number
    noShows:       number
    totalRevenue:  number
    lastVisit:     string | null
  }
  bookings: Booking[]
}

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function formatPhone(p: string): string {
  const d = p.replace(/\D/g, '')
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
  return p
}

const STATUS_CFG = {
  CONFIRMED: { label:'Confirmado', color:colors.red.DEFAULT,    bg:colors.red.subtle,              icon:Clock },
  COMPLETED: { label:'Concluído',  color:colors.slate.DEFAULT,  bg:colors.slate.subtle,            icon:CheckCircle },
  CANCELED:  { label:'Cancelado',  color:colors.gray.dimText,   bg:`rgba(0,0,0,0.04)`,             icon:X },
} as const

export default function ClientProfilePage() {
  const router = useRouter()
  const params = useParams()
  const id     = params?.id as string

  const [client,  setClient]  = useState<ClientProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState<'bookings' | 'info'>('bookings')

  useEffect(() => {
    if (!id) return
    api.get(`/clients/${id}`)
      .then(res => setClient(res.data?.data ?? res.data))
      .catch(() => setClient(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', padding:80 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width:32, height:32, borderRadius:'50%', border:`3px solid ${colors.red.subtle}`, borderTopColor:colors.red.DEFAULT, animation:'spin 0.8s linear infinite' }} />
    </div>
  )

  if (!client) return (
    <div style={{ textAlign:'center', padding:80, color:typography.color.muted }}>
      <div style={{ fontSize:40, marginBottom:12 }}>😕</div>
      <div style={{ fontSize:16, fontWeight:typography.weight.semibold }}>Cliente não encontrado</div>
      <button onClick={() => router.back()} style={{ marginTop:16, padding:'8px 16px', borderRadius:radius.sm, border:`1px solid ${colors.gray.borderMd}`, background:'transparent', cursor:'pointer', fontSize:typography.scale.base, color:typography.color.secondary }}>Voltar</button>
    </div>
  )

  const { metrics, bookings } = client

  const metricCards = [
    { label:'Agendamentos',    value:metrics.totalBookings, sub:'total',    color:colors.gray[900] },
    { label:'Não comparec.',   value:metrics.noShows,       sub:'faltas',   color:colors.gray[900] },
    { label:'Cancelamentos',   value:metrics.canceled,      sub:'vezes',    color:colors.gray[900] },
    { label:'Receita total',   value:`R$ ${metrics.totalRevenue.toFixed(2).replace('.', ',')}`, sub:'gerado', color:colors.red.DEFAULT },
  ]

  return (
    <>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .bk-row{display:flex;align-items:center;gap:12px;padding:14px 20px;border-bottom:1px solid ${colors.gray.border};transition:background ${transitions.fast};cursor:default}
        .bk-row:last-child{border-bottom:none}
        .bk-row:hover{background:${colors.red.subtle}}
        .pr-tab{flex:1;padding:10px;border:none;background:transparent;font-size:${typography.scale.sm}px;font-weight:${typography.weight.bold};letter-spacing:.06em;text-transform:uppercase;cursor:pointer;color:${colors.gray.dimText};border-bottom:2px solid transparent;transition:all ${transitions.fast};font-family:${typography.fontFamily}}
        .pr-tab.active{color:${colors.red.DEFAULT};border-bottom-color:${colors.red.DEFAULT}}
        .back-btn:hover{background:${colors.red.subtle}!important}
      `}</style>

      <div style={{ maxWidth:760, animation:'fadeUp 0.3s ease', fontFamily:typography.fontFamily }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:24 }}>
          <button className="back-btn" onClick={() => router.push('/dashboard/clientes')} style={{ display:'flex', alignItems:'center', justifyContent:'center', width:34, height:34, borderRadius:radius.sm, border:`1px solid ${colors.gray.borderMd}`, background:glass.surface.default.background, cursor:'pointer', flexShrink:0, transition:transitions.fast, marginTop:4 }}>
            <ChevronLeft size={18} color={colors.gray.dimText} strokeWidth={2} />
          </button>

          {/* Avatar + info */}
          <div style={{ display:'flex', alignItems:'center', gap:16, flex:1, minWidth:0 }}>
            <div style={{ width:60, height:60, borderRadius:radius.full, background:colors.red.gradient, color:'#fff', fontSize:22, fontWeight:typography.weight.bold, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:shadows.redMd }}>
              {getInitials(client.name)}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <h2 style={{ margin:0, fontSize:typography.scale['2xl'], fontWeight:typography.weight.bold, letterSpacing:'-0.025em', color:typography.color.primary, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                {client.name}
              </h2>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:4, flexWrap:'wrap' }}>
                <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:typography.scale.base, color:typography.color.muted }}>
                  <Phone size={13} color={colors.gray.dimText} />
                  {formatPhone(client.phone)}
                </span>
                <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:typography.scale.base, color:typography.color.muted }}>
                  <Calendar size={13} color={colors.gray.dimText} />
                  Cliente desde {dayjs(client.createdAt).format('MMM YYYY')}
                </span>
              </div>
              {metrics.lastVisit && (
                <div style={{ marginTop:4, fontSize:typography.scale.sm, color:typography.color.muted }}>
                  Última visita: <strong style={{ color:typography.color.primary }}>{dayjs(metrics.lastVisit).format('DD [de] MMMM [de] YYYY')}</strong>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Métricas */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:24 }}>
          {metricCards.map(m => (
            <div key={m.label} style={{ padding:'14px 16px', borderRadius:radius.lg, background:glass.surface.default.background, backdropFilter:glass.surface.default.backdropFilter, border:`1px solid ${colors.gray.border}`, boxShadow:shadows.sm }}>
              <div style={{ fontSize:typography.scale.xs, fontWeight:typography.weight.bold, color:typography.color.muted, textTransform:'uppercase', letterSpacing:'.07em', marginBottom:6 }}>{m.label}</div>
              <div style={{ fontSize:20, fontWeight:typography.weight.bold, color:m.color, fontVariantNumeric:'tabular-nums' }}>{m.value}</div>
              <div style={{ fontSize:typography.scale.xs, color:typography.color.muted, marginTop:2 }}>{m.sub}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ background:glass.surface.default.background, backdropFilter:glass.surface.default.backdropFilter, borderRadius:radius.xl, border:`1px solid ${colors.gray.border}`, boxShadow:shadows.sm, overflow:'hidden' }}>
          <div style={{ display:'flex', borderBottom:`1px solid ${colors.gray.border}`, padding:'0 4px' }}>
            <button className={`pr-tab${tab==='bookings'?' active':''}`} onClick={() => setTab('bookings')}>
              Agendamentos ({bookings.length})
            </button>
            <button className={`pr-tab${tab==='info'?' active':''}`} onClick={() => setTab('info')}>
              Informações
            </button>
          </div>

          {tab === 'bookings' ? (
            bookings.length === 0 ? (
              <div style={{ padding:'48px 32px', textAlign:'center', color:typography.color.muted }}>
                <div style={{ fontSize:32, marginBottom:10 }}>📅</div>
                <div style={{ fontSize:typography.scale.md, fontWeight:typography.weight.semibold, color:typography.color.primary }}>Nenhum agendamento</div>
              </div>
            ) : (
              <div>
                {bookings.map(b => {
                  const cfg      = STATUS_CFG[b.status]
                  const gradient = b.serviceColor ? colorToGradient(b.serviceColor) : colors.red.gradient
                  return (
                    <div key={b.id} className="bk-row">
                      {/* Cor do serviço */}
                      <div style={{ width:3, height:40, borderRadius:2, background:gradient, flexShrink:0 }} />

                      {/* Data */}
                      <div style={{ minWidth:80, flexShrink:0 }}>
                        <div style={{ fontSize:typography.scale.base, fontWeight:typography.weight.semibold, color:typography.color.primary }}>
                          {dayjs(b.startAt).format('DD MMM')}
                        </div>
                        <div style={{ fontSize:typography.scale.sm, color:typography.color.muted }}>
                          {dayjs(b.startAt).format('HH:mm')}–{dayjs(b.endAt).format('HH:mm')}
                        </div>
                      </div>

                      {/* Serviço + profissional */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:typography.scale.base, fontWeight:typography.weight.semibold, color:typography.color.primary, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                          {b.serviceName}
                        </div>
                        {b.professionalName && (
                          <div style={{ fontSize:typography.scale.sm, color:typography.color.muted }}>{b.professionalName}</div>
                        )}
                      </div>

                      {/* Preço */}
                      {b.servicePrice != null && (
                        <div style={{ fontSize:typography.scale.base, fontWeight:typography.weight.semibold, color:typography.color.primary, minWidth:70, textAlign:'right', flexShrink:0 }}>
                          R$ {b.servicePrice.toFixed(2).replace('.', ',')}
                        </div>
                      )}

                      {/* Status badge */}
                      <div style={{ padding:'3px 10px', borderRadius:radius.full, background:cfg.bg, fontSize:typography.scale.xs, fontWeight:typography.weight.bold, color:cfg.color, flexShrink:0, whiteSpace:'nowrap' }}>
                        {cfg.label}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          ) : (
            /* Tab Informações */
            <div style={{ padding:'20px' }}>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {[
                  { label:'Nome completo', value:client.name },
                  { label:'Telefone', value:formatPhone(client.phone) },
                  { label:'Cliente desde', value:dayjs(client.createdAt).format('DD [de] MMMM [de] YYYY') },
                  { label:'Cliente confiável', value:'Não' },
                  { label:'Desconto', value:'Sem desconto' },
                ].map(f => (
                  <div key={f.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:`1px solid ${colors.gray.border}` }}>
                    <span style={{ fontSize:typography.scale.base, color:typography.color.muted }}>{f.label}</span>
                    <span style={{ fontSize:typography.scale.base, fontWeight:typography.weight.semibold, color:typography.color.primary }}>{f.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}