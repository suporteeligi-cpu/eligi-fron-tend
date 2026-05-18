'use client'
// src/app/dashboard/clientes/[id]/page.tsx

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ChevronLeft, Phone, Calendar, Clock, CheckCircle, X,
  Pencil, Trash2, Check, TrendingUp, Star, AlertTriangle,
} from 'lucide-react'
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

interface Metrics {
  totalBookings:   number
  completed:       number
  canceled:        number
  confirmed:       number
  noShows:         number
  totalRevenue:    number
  lastVisit:       string | null
  favoriteService: string | null
  avgMonthly:      number
}

interface ClientProfile {
  id: string; name: string; phone: string; createdAt: string
  metrics: Metrics
  bookings: Booking[]
}

function getInitials(n: string) { return n.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase() }
function formatPhone(p: string) {
  const d = p.replace(/\D/g,'')
  if (d.length===11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
  if (d.length===10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
  return p
}
function maskPhone(v: string) {
  const d = v.replace(/\D/g,'').slice(0,11)
  if (d.length<=2)  return `(${d}`
  if (d.length<=7)  return `(${d.slice(0,2)}) ${d.slice(2)}`
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
}

const STATUS_CFG = {
  CONFIRMED: { label:'Confirmado', color:colors.red.DEFAULT,   bg:colors.red.subtle,   icon:Clock },
  COMPLETED: { label:'Concluído',  color:colors.slate.DEFAULT, bg:colors.slate.subtle, icon:CheckCircle },
  CANCELED:  { label:'Cancelado',  color:colors.gray.dimText,  bg:`rgba(0,0,0,0.04)`,  icon:X },
} as const

// ─── Componente de campo editável inline ──────────────────────────────────────
function EditableField({ label, value, onSave, mask }: {
  label: string; value: string
  onSave: (v: string) => Promise<void>
  mask?: (v: string) => string
}) {
  const [editing, setEditing] = useState(false)
  const [val,     setVal]     = useState(value)
  const [saving,  setSaving]  = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editing) setTimeout(() => inputRef.current?.focus(), 50) }, [editing])

  async function handleSave() {
    if (val.trim() === value) { setEditing(false); return }
    try { setSaving(true); await onSave(val.trim()); setEditing(false) }
    catch { setVal(value) }
    finally { setSaving(false) }
  }

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:`1px solid ${colors.gray.border}` }}>
      <span style={{ fontSize:typography.scale.base, color:typography.color.muted, minWidth:120 }}>{label}</span>
      {editing ? (
        <div style={{ display:'flex', alignItems:'center', gap:6, flex:1, maxWidth:260 }}>
          <input
            ref={inputRef}
            value={val}
            onChange={e => setVal(mask ? mask(e.target.value) : e.target.value)}
            onKeyDown={e => { if (e.key==='Enter') handleSave(); if (e.key==='Escape') { setVal(value); setEditing(false) } }}
            style={{ flex:1, height:34, padding:'0 10px', borderRadius:radius.sm, border:`1px solid ${colors.red.borderHover}`, background:colors.background.surface, fontSize:typography.scale.base, outline:'none', fontFamily:typography.fontFamily, color:typography.color.primary, boxShadow:`0 0 0 3px ${colors.red.focusRing}` }}
          />
          <button onClick={handleSave} disabled={saving} style={{ width:30, height:30, borderRadius:radius.sm, border:'none', background:colors.red.gradient, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            {saving ? <div style={{ width:12, height:12, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', animation:'spin 0.6s linear infinite' }} /> : <Check size={13} strokeWidth={2.5} />}
          </button>
          <button onClick={() => { setVal(value); setEditing(false) }} style={{ width:30, height:30, borderRadius:radius.sm, border:`1px solid ${colors.gray.borderMd}`, background:colors.background.surface, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X size={13} color={colors.gray.dimText} />
          </button>
        </div>
      ) : (
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:typography.scale.base, fontWeight:typography.weight.semibold, color:typography.color.primary }}>{value}</span>
          <button onClick={() => setEditing(true)} style={{ width:26, height:26, borderRadius:radius.sm, border:`1px solid ${colors.gray.borderMd}`, background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', opacity:0.5, transition:`opacity ${transitions.fast}` }}
            onMouseEnter={e => (e.currentTarget.style.opacity='1')}
            onMouseLeave={e => (e.currentTarget.style.opacity='0.5')}
          >
            <Pencil size={12} color={colors.gray.dimText} />
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Modal de confirmação de delete ───────────────────────────────────────────
function DeleteModal({ name, onConfirm, onCancel, deleting }: {
  name: string; onConfirm: () => void; onCancel: () => void; deleting: boolean
}) {
  return (
    <>
      <div onClick={onCancel} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.25)', backdropFilter:'blur(6px)', zIndex:9998 }} />
      <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:340, maxWidth:'90vw', background:'#fff', borderRadius:radius['2xl'], boxShadow:shadows.lg, zIndex:9999, padding:'28px 24px 22px', textAlign:'center', fontFamily:typography.fontFamily }}>
        <div style={{ width:52, height:52, borderRadius:radius.full, background:'rgba(220,38,38,0.08)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
          <AlertTriangle size={24} color={colors.red.DEFAULT} />
        </div>
        <h3 style={{ margin:'0 0 8px', fontSize:17, fontWeight:typography.weight.bold, color:typography.color.primary }}>Apagar cliente?</h3>
        <p style={{ margin:'0 0 6px', fontSize:typography.scale.base, color:typography.color.muted, lineHeight:1.5 }}>
          Tem certeza que deseja apagar <strong>{name}</strong>?
        </p>
        <p style={{ margin:'0 0 22px', fontSize:typography.scale.sm, color:typography.color.muted }}>
          Os agendamentos serão mantidos, mas o vínculo com o cliente será removido.
        </p>
        <button onClick={onConfirm} disabled={deleting} style={{ width:'100%', padding:'12px', marginBottom:8, background:colors.red.gradient, color:'#fff', border:'none', borderRadius:radius.sm, fontWeight:typography.weight.bold, fontSize:typography.scale.base, cursor:deleting?'not-allowed':'pointer', boxShadow:shadows.redMd, opacity:deleting?0.7:1 }}>
          {deleting ? 'Apagando...' : 'Sim, apagar cliente'}
        </button>
        <button onClick={onCancel} style={{ width:'100%', padding:'11px', background:`rgba(0,0,0,0.04)`, border:`1px solid ${colors.gray.borderMd}`, borderRadius:radius.sm, fontSize:typography.scale.base, cursor:'pointer', color:typography.color.muted }}>
          Cancelar
        </button>
      </div>
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ClientProfilePage() {
  const router = useRouter()
  const params = useParams()
  const id     = params?.id as string

  const [client,      setClient]      = useState<ClientProfile | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [tab,         setTab]         = useState<'bookings' | 'info'>('bookings')
  const [showDelete,  setShowDelete]  = useState(false)
  const [deleting,    setDeleting]    = useState(false)
  const [toast,       setToast]       = useState<{ msg: string; type: 'success'|'error' } | null>(null)

  function showToast(msg: string, type: 'success'|'error') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    if (!id) return
    api.get(`/clients/${id}`)
      .then(res => setClient(res.data?.data ?? res.data))
      .catch(() => setClient(null))
      .finally(() => setLoading(false))
  }, [id])

  async function handleUpdate(field: 'name' | 'phone', value: string) {
    const res = await api.put(`/clients/${id}`, { [field]: value.replace(/\D/g, field==='phone'?'':value) })
    const updated = res.data?.data ?? res.data
    setClient(prev => prev ? { ...prev, [field]: updated[field] } : prev)
    showToast('Dados atualizados!', 'success')
  }

  async function handleDelete() {
    try {
      setDeleting(true)
      await api.delete(`/clients/${id}`)
      router.push('/dashboard/clientes')
    } catch { showToast('Erro ao apagar cliente', 'error') }
    finally  { setDeleting(false) }
  }

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', padding:80 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width:32, height:32, borderRadius:'50%', border:`3px solid ${colors.red.subtle}`, borderTopColor:colors.red.DEFAULT, animation:'spin 0.8s linear infinite' }} />
    </div>
  )

  if (!client) return (
    <div style={{ textAlign:'center', padding:80 }}>
      <div style={{ fontSize:40, marginBottom:12 }}>😕</div>
      <div style={{ fontSize:16, fontWeight:typography.weight.semibold, color:typography.color.primary, marginBottom:12 }}>Cliente não encontrado</div>
      <button onClick={() => router.back()} style={{ padding:'8px 16px', borderRadius:radius.sm, border:`1px solid ${colors.gray.borderMd}`, background:'transparent', cursor:'pointer', fontSize:typography.scale.base, color:typography.color.secondary }}>Voltar</button>
    </div>
  )

  const { metrics, bookings } = client

  const metricCards = [
    { label:'Agendamentos', value:String(metrics.totalBookings),    sub:'total',      color:typography.color.primary },
    { label:'Concluídos',   value:String(metrics.completed),        sub:'realizados', color:colors.slate.DEFAULT },
    { label:'Cancelados',   value:String(metrics.canceled),         sub:'vezes',      color:typography.color.muted },
    { label:'Receita',      value:`R$ ${metrics.totalRevenue.toFixed(2).replace('.',',')}`, sub:'gerado', color:colors.red.DEFAULT },
  ]

  return (
    <>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        .bk-row{display:flex;align-items:center;gap:12px;padding:13px 20px;border-bottom:1px solid ${colors.gray.border};transition:background ${transitions.fast}}
        .bk-row:last-child{border-bottom:none}
        .bk-row:hover{background:${colors.red.subtle}}
        .pr-tab{flex:1;padding:10px;border:none;background:transparent;font-size:${typography.scale.sm}px;font-weight:${typography.weight.bold};letter-spacing:.06em;text-transform:uppercase;cursor:pointer;color:${colors.gray.dimText};border-bottom:2px solid transparent;transition:all ${transitions.fast};font-family:${typography.fontFamily}}
        .pr-tab.active{color:${colors.red.DEFAULT};border-bottom-color:${colors.red.DEFAULT}}
        .back-btn:hover{background:${colors.red.subtle}!important}
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', bottom:28, left:'50%', transform:'translateX(-50%)', padding:'11px 20px', borderRadius:radius.md, background:toast.type==='success'?'linear-gradient(135deg,#22c55e,#16a34a)':'linear-gradient(135deg,#dc2626,#b91c1c)', color:'#fff', fontSize:typography.scale.base, fontWeight:typography.weight.semibold, boxShadow:shadows.lg, zIndex:9999, whiteSpace:'nowrap', animation:'toastIn 0.25s cubic-bezier(0.34,1.56,0.64,1)', fontFamily:typography.fontFamily }}>
          {toast.msg}
        </div>
      )}

      {showDelete && (
        <DeleteModal
          name={client.name}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
          deleting={deleting}
        />
      )}

      <div style={{ maxWidth:760, animation:'fadeUp 0.3s ease', fontFamily:typography.fontFamily }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:22 }}>
          <button className="back-btn" onClick={() => router.push('/dashboard/clientes')} style={{ display:'flex', alignItems:'center', justifyContent:'center', width:34, height:34, borderRadius:radius.sm, border:`1px solid ${colors.gray.borderMd}`, background:glass.surface.default.background, cursor:'pointer', flexShrink:0, transition:transitions.fast, marginTop:6 }}>
            <ChevronLeft size={18} color={colors.gray.dimText} strokeWidth={2} />
          </button>

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
                  <Phone size={13} color={colors.gray.dimText} /> {formatPhone(client.phone)}
                </span>
                <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:typography.scale.base, color:typography.color.muted }}>
                  <Calendar size={13} color={colors.gray.dimText} /> Cliente desde {dayjs(client.createdAt).format('MMM YYYY')}
                </span>
              </div>
              {metrics.lastVisit && (
                <div style={{ marginTop:3, fontSize:typography.scale.sm, color:typography.color.muted }}>
                  Última visita: <strong style={{ color:typography.color.primary }}>{dayjs(metrics.lastVisit).format('DD [de] MMMM [de] YYYY')}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Botão apagar */}
          <button onClick={() => setShowDelete(true)} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:radius.sm, border:`1px solid rgba(220,38,38,0.2)`, background:'rgba(220,38,38,0.06)', color:colors.red.DEFAULT, fontSize:typography.scale.sm, fontWeight:typography.weight.semibold, cursor:'pointer', flexShrink:0, transition:transitions.fast, marginTop:6 }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.12)'; e.currentTarget.style.borderColor = colors.red.borderHover }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.06)'; e.currentTarget.style.borderColor = 'rgba(220,38,38,0.2)' }}
          >
            <Trash2 size={14} strokeWidth={2} /> Apagar
          </button>
        </div>

        {/* Métricas */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 }}>
          {metricCards.map(m => (
            <div key={m.label} style={{ padding:'14px 16px', borderRadius:radius.lg, background:glass.surface.default.background, backdropFilter:glass.surface.default.backdropFilter, border:`1px solid ${colors.gray.border}`, boxShadow:shadows.sm }}>
              <div style={{ fontSize:typography.scale.xs, fontWeight:typography.weight.bold, color:typography.color.muted, textTransform:'uppercase', letterSpacing:'.07em', marginBottom:6 }}>{m.label}</div>
              <div style={{ fontSize:20, fontWeight:typography.weight.bold, color:m.color, fontVariantNumeric:'tabular-nums' }}>{m.value}</div>
              <div style={{ fontSize:typography.scale.xs, color:typography.color.muted, marginTop:2 }}>{m.sub}</div>
            </div>
          ))}
        </div>

        {/* Insights rápidos */}
        {(metrics.favoriteService || metrics.avgMonthly > 0) && (
          <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
            {metrics.favoriteService && (
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px', borderRadius:radius.full, background:colors.red.subtle, border:`1px solid ${colors.red.border}` }}>
                <Star size={13} color={colors.red.DEFAULT} fill={colors.red.DEFAULT} />
                <span style={{ fontSize:typography.scale.sm, fontWeight:typography.weight.semibold, color:colors.red.dark }}>Serviço favorito: {metrics.favoriteService}</span>
              </div>
            )}
            {metrics.avgMonthly > 0 && (
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px', borderRadius:radius.full, background:colors.slate.subtle, border:`1px solid ${colors.slate.border}` }}>
                <TrendingUp size={13} color={colors.slate.DEFAULT} />
                <span style={{ fontSize:typography.scale.sm, fontWeight:typography.weight.semibold, color:colors.slate.dark }}>{metrics.avgMonthly}x por mês em média</span>
              </div>
            )}
          </div>
        )}

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
                <div style={{ fontSize:typography.scale.md, fontWeight:typography.weight.semibold, color:typography.color.primary, marginBottom:4 }}>Nenhum agendamento</div>
                <div style={{ fontSize:typography.scale.sm }}>Os agendamentos deste cliente aparecerão aqui.</div>
              </div>
            ) : (
              <div>
                {bookings.map(b => {
                  const cfg      = STATUS_CFG[b.status]
                  const gradient = b.serviceColor ? colorToGradient(b.serviceColor) : colors.red.gradient
                  return (
                    <div key={b.id} className="bk-row">
                      <div style={{ width:3, height:42, borderRadius:2, background:gradient, flexShrink:0 }} />
                      <div style={{ minWidth:82, flexShrink:0 }}>
                        <div style={{ fontSize:typography.scale.base, fontWeight:typography.weight.semibold, color:typography.color.primary }}>{dayjs(b.startAt).format('DD MMM')}</div>
                        <div style={{ fontSize:typography.scale.sm, color:typography.color.muted }}>{dayjs(b.startAt).format('HH:mm')}–{dayjs(b.endAt).format('HH:mm')}</div>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:typography.scale.base, fontWeight:typography.weight.semibold, color:typography.color.primary, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{b.serviceName}</div>
                        {b.professionalName && <div style={{ fontSize:typography.scale.sm, color:typography.color.muted }}>{b.professionalName}</div>}
                      </div>
                      {b.servicePrice != null && (
                        <div style={{ fontSize:typography.scale.base, fontWeight:typography.weight.semibold, color:typography.color.primary, flexShrink:0 }}>
                          R$ {b.servicePrice.toFixed(2).replace('.',',')}
                        </div>
                      )}
                      <div style={{ padding:'3px 10px', borderRadius:radius.full, background:cfg.bg, fontSize:typography.scale.xs, fontWeight:typography.weight.bold, color:cfg.color, flexShrink:0 }}>
                        {cfg.label}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          ) : (
            /* Tab Informações com edição inline */
            <div style={{ padding:'4px 20px 20px' }}>
              <EditableField
                label="Nome completo"
                value={client.name}
                onSave={v => handleUpdate('name', v)}
              />
              <EditableField
                label="Telefone"
                value={formatPhone(client.phone)}
                onSave={v => handleUpdate('phone', v)}
                mask={maskPhone}
              />
              {/* Campos futuros — em breve */}
              {[
                { label:'Cliente desde', value:dayjs(client.createdAt).format('DD [de] MMMM [de] YYYY') },
                { label:'Cliente confiável', value:'Não' },
                { label:'Desconto',          value:'Sem desconto' },
              ].map(f => (
                <div key={f.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:`1px solid ${colors.gray.border}` }}>
                  <span style={{ fontSize:typography.scale.base, color:typography.color.muted }}>{f.label}</span>
                  <span style={{ fontSize:typography.scale.base, fontWeight:typography.weight.semibold, color:typography.color.primary }}>{f.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}