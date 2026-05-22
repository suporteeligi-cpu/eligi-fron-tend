'use client'
// src/features/booking/components/BookingViewPanel.tsx
// Painel lateral que abre ao clicar em um card existente na agenda

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronDown, Clock, User, Calendar, AlertTriangle, CheckCircle, Ban } from 'lucide-react'
import { useRouter } from 'next/navigation'
import api from '@/shared/lib/apiClient'
import { AgendaBooking } from '@/features/agenda/types'
import { colors, glass, typography, radius } from '@/shared/theme'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useAgendaStore } from '@/features/agenda/hooks/useAgendaStore'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale('pt-br')

// ─── Types ────────────────────────────────────────────────────────────────────
interface BookingDetail {
  id:         string
  status:     'CONFIRMED' | 'COMPLETED' | 'CANCELED'
  startAt:    string
  endAt:      string
  clientName: string
  clientPhone?: string
  service:    { id:string; name:string; price:number|null; color:string|null; duration:number }
  professional?: { id:string; name:string; avatarUrl?:string }
}

interface Props {
  booking:   AgendaBooking
  date:      Date
  open:      boolean
  onClose:   () => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getInitials(n: string) { return n.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase() }

const STATUS_CFG = {
  CONFIRMED: { label:'CONFIRMADO', bg:'#16a34a', text:'#fff', icon:CheckCircle },
  COMPLETED: { label:'CONCLUÍDO',  bg:'#475569', text:'#fff', icon:CheckCircle },
  CANCELED:  { label:'CANCELADO',  bg:'#dc2626', text:'#fff', icon:Ban },
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────
function ConfirmModal({ title, body, confirmLabel, danger, onConfirm, onCancel }: {
  title:string; body:string; confirmLabel:string; danger?:boolean
  onConfirm:()=>void; onCancel:()=>void
}) {
  if (typeof document==='undefined') return null
  return createPortal(
    <>
      <div onClick={onCancel} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.32)',backdropFilter:'blur(8px)',zIndex:10998}}/>
      <div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:340,maxWidth:'88vw',background:'rgba(255,255,255,0.99)',borderRadius:22,boxShadow:'0 32px 72px rgba(0,0,0,0.18)',zIndex:10999,padding:'32px 24px 22px',textAlign:'center',fontFamily:typography.fontFamily,animation:'cmIn 0.22s cubic-bezier(0.34,1.56,0.64,1)'}}>
        <style>{`@keyframes cmIn{from{opacity:0;transform:translate(-50%,-50%) scale(0.93)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}`}</style>
        <div style={{width:48,height:48,borderRadius:'50%',background:danger?'rgba(220,38,38,0.08)':'rgba(71,85,105,0.08)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px'}}>
          <AlertTriangle size={22} color={danger?colors.red.DEFAULT:'#475569'}/>
        </div>
        <h3 style={{margin:'0 0 8px',fontSize:17,fontWeight:700,color:'#0f0f14'}}>{title}</h3>
        <p style={{margin:'0 0 22px',fontSize:14,color:colors.gray.dimText,lineHeight:1.5}}>{body}</p>
        <button onClick={onConfirm} style={{width:'100%',padding:'13px',marginBottom:8,background:danger?colors.red.gradient:'linear-gradient(135deg,#475569,#334155)',color:'#fff',border:'none',borderRadius:13,fontWeight:700,fontSize:14,cursor:'pointer',letterSpacing:'.04em',textTransform:'uppercase' as const}}>
          {confirmLabel}
        </button>
        <button onClick={onCancel} style={{width:'100%',padding:'12px',background:'transparent',border:`1px solid ${colors.gray.borderMd}`,borderRadius:13,fontSize:14,cursor:'pointer',color:colors.gray.dimText}}>
          Cancelar
        </button>
      </div>
    </>,
    document.body
  )
}

// ─── BookingViewPanel ─────────────────────────────────────────────────────────
export default function BookingViewPanel({ booking, date, open, onClose }: Props) {
  const router    = useRouter()
  const isMobile  = useIsMobile()
  const { removeBooking } = useAgendaStore()
  const dateStr   = dayjs(date).format('YYYY-MM-DD')

  const [detail,    setDetail]    = useState<BookingDetail|null>(null)
  const [loading,   setLoading]   = useState(true)
  const [showAlter, setShowAlter] = useState(false)
  const [confirm,   setConfirm]   = useState<'cancel'|'noshow'|null>(null)
  const [saving,    setSaving]    = useState(false)

  const bookingId    = booking.id
  const bookingStart = booking.start
  const bookingEnd   = booking.end
  const clientName   = booking.clientName
  const serviceName  = booking.serviceName
  const serviceColor = booking.serviceColor
  const status0      = booking.status

  useEffect(() => {
    if (!open || !bookingId) return
    let cancelled = false
    setLoading(true)
    api.get(`/payments/booking/${bookingId}`)
      .then(res => {
        if (!cancelled) setDetail(res.data?.data ?? res.data)
      })
      .catch(() => {
        if (!cancelled) setDetail({
          id:         bookingId,
          status:     status0 as BookingDetail['status'],
          startAt:    dayjs.tz(`${dateStr} ${bookingStart}`, 'America/Sao_Paulo').toISOString(),
          endAt:      dayjs.tz(`${dateStr} ${bookingEnd}`, 'America/Sao_Paulo').toISOString(),
          clientName,
          service:    { id:'', name:serviceName, price:null, color:serviceColor??null, duration:0 },
        })
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [open, bookingId, dateStr, bookingStart, bookingEnd, clientName, serviceName, serviceColor, status0])

  async function handleAction(reason: 'CANCELED'|'NO_SHOW') {
    try {
      setSaving(true)
      await api.patch(`/payments/booking/${bookingId}/action`, { reason })
      removeBooking(dateStr, bookingId)
      setConfirm(null)
      onClose()
    } catch {}
    finally { setSaving(false) }
  }

  function goToCheckout() {
    onClose()
    router.push(`/dashboard/checkout?bookingId=${bookingId}`)
  }

  if (!open || typeof document==='undefined') return null

  const status    = detail?.status ?? booking.status
  const statusCfg = STATUS_CFG[status as keyof typeof STATUS_CFG] ?? STATUS_CFG.CONFIRMED
  const isConfirmed = status === 'CONFIRMED'
  const isCompleted = status === 'COMPLETED'

  const panelStyle = isMobile ? {
    position:'fixed' as const, left:0, right:0, bottom:0, height:'88dvh',
    background:glass.surface.modal.background, backdropFilter:glass.surface.modal.backdropFilter,
    WebkitBackdropFilter:glass.surface.modal.backdropFilter,
    borderRadius:'24px 24px 0 0', boxShadow:'0 -8px 40px rgba(0,0,0,0.18)',
    zIndex:9995, display:'flex', flexDirection:'column' as const,
    fontFamily:typography.fontFamily, animation:'sheetUp 0.28s cubic-bezier(0.34,1.2,0.64,1)',
  } : {
    position:'fixed' as const, top:0, right:0, bottom:0, width:400,
    background:glass.surface.modal.background, backdropFilter:glass.surface.modal.backdropFilter,
    WebkitBackdropFilter:glass.surface.modal.backdropFilter,
    borderLeft:`1px solid ${colors.gray.borderMd}`,
    boxShadow:'-12px 0 40px rgba(0,0,0,0.12)', zIndex:9995,
    display:'flex', flexDirection:'column' as const,
    fontFamily:typography.fontFamily, animation:'sheetIn 0.24s cubic-bezier(0.25,0.46,0.45,0.94)',
  }

  const panel = (
    <>
      <style>{`
        @keyframes sheetIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
        @keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
      `}</style>

      {confirm==='cancel' && (
        <ConfirmModal
          title="Cancelar agendamento?"
          body="O agendamento será cancelado e o horário ficará disponível novamente."
          confirmLabel="Cancelar agendamento"
          danger
          onConfirm={()=>handleAction('CANCELED')}
          onCancel={()=>setConfirm(null)}
        />
      )}
      {confirm==='noshow' && (
        <ConfirmModal
          title="Cliente não compareceu?"
          body="O agendamento será marcado como não compareceu."
          confirmLabel="Confirmar"
          onConfirm={()=>handleAction('NO_SHOW')}
          onCancel={()=>setConfirm(null)}
        />
      )}

      <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:9994,background:colors.background.overlay}}/>

      <div style={panelStyle}>
        {isMobile && <div style={{display:'flex',justifyContent:'center',padding:'10px 0 4px',flexShrink:0}}><div style={{width:40,height:4,borderRadius:2,background:'rgba(0,0,0,0.12)'}}/></div>}

        {/* Status bar no topo */}
        <div style={{background:statusCfg.bg,padding:'14px 20px',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <statusCfg.icon size={16} color={statusCfg.text} strokeWidth={2.5}/>
            <span style={{color:statusCfg.text,fontWeight:800,fontSize:15,letterSpacing:'.06em'}}>{statusCfg.label}</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            {/* Botão Alterar — só para CONFIRMED */}
            {isConfirmed && (
              <div style={{position:'relative'}}>
                <button onClick={()=>setShowAlter(v=>!v)} style={{display:'flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:10,border:'1px solid rgba(255,255,255,0.3)',background:'rgba(255,255,255,0.15)',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',backdropFilter:'blur(8px)',letterSpacing:'.04em'}}>
                  ALTERAR <ChevronDown size={13} strokeWidth={2.5}/>
                </button>
                {showAlter && (
                  <>
                    <div onClick={()=>setShowAlter(false)} style={{position:'fixed',inset:0,zIndex:9996}}/>
                    <div style={{position:'absolute',top:'calc(100% + 6px)',right:0,width:220,background:'rgba(255,255,255,0.99)',borderRadius:14,boxShadow:'0 16px 48px rgba(0,0,0,0.18)',zIndex:9997,overflow:'hidden',animation:'cmIn 0.16s ease'}}>
                      <button onClick={()=>{setShowAlter(false);setConfirm('cancel')}} style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'14px 16px',border:'none',borderBottom:`1px solid ${colors.gray.border}`,background:'transparent',cursor:'pointer',textAlign:'left',color:colors.red.DEFAULT,fontSize:14,fontWeight:600,fontFamily:typography.fontFamily}}
                        onMouseEnter={e=>e.currentTarget.style.background=colors.red.subtle}
                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                      >
                        <Ban size={15} strokeWidth={2}/> Cancelar agendamento
                      </button>
                      <button onClick={()=>{setShowAlter(false);setConfirm('noshow')}} style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'14px 16px',border:'none',background:'transparent',cursor:'pointer',textAlign:'left',color:colors.gray[700],fontSize:14,fontWeight:600,fontFamily:typography.fontFamily}}
                        onMouseEnter={e=>e.currentTarget.style.background=colors.gray.hover}
                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                      >
                        <User size={15} strokeWidth={2}/> Cliente não compareceu
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
            <button onClick={onClose} style={{width:30,height:30,borderRadius:'50%',border:'1px solid rgba(255,255,255,0.3)',background:'rgba(255,255,255,0.15)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <X size={15} color="#fff" strokeWidth={2.5}/>
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{flex:1,overflowY:'auto',padding:'20px'}}>
          {loading ? (
            <div style={{display:'flex',justifyContent:'center',padding:48}}>
              <div style={{width:28,height:28,borderRadius:'50%',border:`3px solid ${colors.red.subtle}`,borderTopColor:colors.red.DEFAULT,animation:'spin 0.8s linear infinite'}}/>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:16}}>

              {/* Cliente */}
              <div style={{display:'flex',alignItems:'center',gap:12,padding:'14px',borderRadius:radius.sm,background:colors.background.page,border:`1px solid ${colors.gray.border}`}}>
                <div style={{width:44,height:44,borderRadius:'50%',background:colors.red.gradient,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:14,fontWeight:700,color:'#fff',boxShadow:`0 2px 8px ${colors.red.glow}`}}>
                  {getInitials(detail?.clientName ?? booking.clientName)}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:15,fontWeight:700,color:colors.gray[900]}}>{detail?.clientName ?? booking.clientName}</div>
                  {detail?.clientPhone && <div style={{fontSize:13,color:colors.gray.dimText,marginTop:1}}>{detail.clientPhone}</div>}
                </div>
              </div>

              {/* Serviço */}
              <div style={{borderRadius:radius.sm,border:`1px solid ${colors.gray.border}`,background:colors.background.page,overflow:'hidden'}}>
                <div style={{padding:'12px 14px',borderBottom:`1px solid ${colors.gray.border}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    {detail?.service.color && <div style={{width:3,height:32,borderRadius:2,background:detail.service.color,flexShrink:0}}/>}
                    <div>
                      <div style={{fontSize:14,fontWeight:700,color:colors.gray[900]}}>{detail?.service.name ?? booking.serviceName}</div>
                      <div style={{fontSize:12,color:colors.gray.dimText,marginTop:1,display:'flex',alignItems:'center',gap:4}}>
                        <Clock size={11} strokeWidth={2}/>
                        {detail?.service.duration ? `${detail.service.duration}min` : `${booking.start}–${booking.end}`}
                      </div>
                    </div>
                  </div>
                  {detail?.service.price != null && (
                    <span style={{fontSize:15,fontWeight:700,color:colors.gray[900],fontVariantNumeric:'tabular-nums'}}>
                      R$ {detail.service.price.toFixed(2).replace('.',',')}
                    </span>
                  )}
                </div>

                {/* Horário */}
                <div style={{padding:'12px 14px',borderBottom:`1px solid ${colors.gray.border}`,display:'flex',alignItems:'center',gap:8}}>
                  <Calendar size={14} color={colors.red.DEFAULT} strokeWidth={2}/>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:colors.gray[900]}}>
                      {dayjs(detail?.startAt ?? `${dateStr}T${booking.start}`).tz('America/Sao_Paulo').format('ddd, DD [de] MMM [de] YYYY').replace(/^\w/,c=>c.toUpperCase())}
                    </div>
                    <div style={{fontSize:12,color:colors.gray.dimText,marginTop:1,fontVariantNumeric:'tabular-nums'}}>
                      {booking.start} – {booking.end}
                    </div>
                  </div>
                </div>

                {/* Profissional */}
                {(detail?.professional || booking.professionalId) && (
                  <div style={{padding:'12px 14px',display:'flex',alignItems:'center',gap:8}}>
                    <User size={14} color={colors.gray.dimText} strokeWidth={2}/>
                    <span style={{fontSize:13,color:colors.gray[700],fontWeight:500}}>
                      {detail?.professional?.name ?? 'Profissional'}
                    </span>
                  </div>
                )}
              </div>

              {/* Total */}
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 16px',borderRadius:radius.sm,background:colors.background.page,border:`1px solid ${colors.gray.border}`}}>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:colors.gray.dimText,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:2}}>Total</div>
                  <div style={{fontSize:22,fontWeight:700,color:colors.gray[900],fontVariantNumeric:'tabular-nums'}}>
                    R$ {(detail?.service.price ?? 0).toFixed(2).replace('.',',')}
                  </div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:11,fontWeight:700,color:colors.gray.dimText,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:2}}>A ser pago</div>
                  <div style={{fontSize:22,fontWeight:700,color:colors.red.DEFAULT,fontVariantNumeric:'tabular-nums'}}>
                    R$ {(detail?.service.price ?? 0).toFixed(2).replace('.',',')}
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && (
          <div style={{padding:`12px 20px ${isMobile?'max(20px,env(safe-area-inset-bottom))':'20px'}`,borderTop:`1px solid ${colors.gray.border}`,flexShrink:0,background:colors.background.surface,display:'flex',gap:8}}>
            {isConfirmed && (
              <>
                <button onClick={onClose} style={{flex:1,padding:'13px',borderRadius:radius.sm,border:`1px solid ${colors.gray.borderMd}`,background:'transparent',fontSize:13,fontWeight:600,cursor:'pointer',color:colors.gray[700],letterSpacing:'.04em',fontFamily:typography.fontFamily}}>
                  FECHAR
                </button>
                <button onClick={goToCheckout} style={{flex:2,padding:'13px',borderRadius:radius.sm,border:'none',background:'linear-gradient(135deg,#1e293b,#0f172a)',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',letterSpacing:'.04em',textTransform:'uppercase' as const,boxShadow:'0 4px 14px rgba(15,23,42,0.28)',fontFamily:typography.fontFamily,display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                  CHECKOUT →
                </button>
              </>
            )}
            {isCompleted && (
              <button onClick={onClose} style={{flex:1,padding:'13px',borderRadius:radius.sm,border:`1px solid ${colors.gray.borderMd}`,background:'transparent',fontSize:13,fontWeight:600,cursor:'pointer',color:colors.gray[700],fontFamily:typography.fontFamily}}>
                FECHAR
              </button>
            )}
            {status==='CANCELED' && (
              <button onClick={onClose} style={{flex:1,padding:'13px',borderRadius:radius.sm,border:`1px solid ${colors.gray.borderMd}`,background:'transparent',fontSize:13,fontWeight:600,cursor:'pointer',color:colors.gray[700],fontFamily:typography.fontFamily}}>
                FECHAR
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )

  return createPortal(panel, document.body)
}