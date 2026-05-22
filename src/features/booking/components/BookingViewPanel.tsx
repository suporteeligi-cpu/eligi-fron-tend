'use client'
// src/features/booking/components/BookingViewPanel.tsx

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronDown, Clock, User, Calendar, AlertTriangle, CheckCircle, Ban, Phone } from 'lucide-react'
import { useRouter } from 'next/navigation'
import api from '@/shared/lib/apiClient'
import { AgendaBooking } from '@/features/agenda/types'
import { colors, typography } from '@/shared/theme'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useAgendaStore } from '@/features/agenda/hooks/useAgendaStore'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale('pt-br')

interface BookingDetail {
  id: string
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELED'
  startAt: string
  endAt: string
  clientName: string
  clientPhone?: string
  service: { id:string; name:string; price:number|null; color:string|null; duration:number }
  professional?: { id:string; name:string; avatarUrl?:string }
}

interface Props {
  booking: AgendaBooking
  date:    Date
  open:    boolean
  onClose: () => void
}

function getInitials(n: string) { return n.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase() }
function fmtPhone(p: string) {
  const d = p.replace(/\D/g,'')
  if (d.length===11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
  if (d.length===10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
  return p
}

const STATUS_CFG = {
  CONFIRMED: { label:'CONFIRMADO', gradient:'linear-gradient(135deg,#16a34a,#15803d)', glow:'rgba(22,163,74,0.35)', icon:CheckCircle },
  COMPLETED: { label:'CONCLUÍDO',  gradient:'linear-gradient(135deg,#475569,#334155)', glow:'rgba(71,85,105,0.35)', icon:CheckCircle },
  CANCELED:  { label:'CANCELADO',  gradient:'linear-gradient(135deg,#dc2626,#b91c1c)', glow:'rgba(220,38,38,0.35)', icon:Ban },
}

function ConfirmModal({ title, body, confirmLabel, danger, onConfirm, onCancel }: {
  title:string; body:string; confirmLabel:string; danger?:boolean; onConfirm:()=>void; onCancel:()=>void
}) {
  if (typeof document==='undefined') return null
  return createPortal(
    <>
      <div onClick={onCancel} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',backdropFilter:'blur(12px)',zIndex:10998}}/>
      <div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:340,maxWidth:'88vw',background:'#fff',borderRadius:24,boxShadow:'0 40px 80px rgba(0,0,0,0.22)',zIndex:10999,padding:'32px 24px 24px',textAlign:'center',fontFamily:typography.fontFamily,animation:'cmIn 0.24s cubic-bezier(0.34,1.56,0.64,1)'}}>
        <style>{`@keyframes cmIn{from{opacity:0;transform:translate(-50%,-50%) scale(0.90)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}`}</style>
        <div style={{width:52,height:52,borderRadius:'50%',background:danger?'rgba(220,38,38,0.08)':'rgba(71,85,105,0.08)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
          <AlertTriangle size={24} color={danger?colors.red.DEFAULT:'#475569'}/>
        </div>
        <h3 style={{margin:'0 0 8px',fontSize:18,fontWeight:800,color:'#0f0f14',letterSpacing:'-0.03em'}}>{title}</h3>
        <p style={{margin:'0 0 24px',fontSize:14,color:colors.gray.dimText,lineHeight:1.6}}>{body}</p>
        <button onClick={onConfirm} style={{width:'100%',padding:'14px',marginBottom:10,background:danger?colors.red.gradient:'linear-gradient(135deg,#475569,#334155)',color:'#fff',border:'none',borderRadius:14,fontWeight:700,fontSize:14,cursor:'pointer',letterSpacing:'.06em',textTransform:'uppercase' as const,boxShadow:danger?`0 6px 20px rgba(220,38,38,0.3)`:'0 6px 20px rgba(71,85,105,0.25)'}}>
          {confirmLabel}
        </button>
        <button onClick={onCancel} style={{width:'100%',padding:'13px',background:'rgba(0,0,0,0.04)',border:'none',borderRadius:14,fontSize:14,cursor:'pointer',color:colors.gray.dimText,fontWeight:600}}>
          Cancelar
        </button>
      </div>
    </>,
    document.body
  )
}

export default function BookingViewPanel({ booking, date, open, onClose }: Props) {
  const router   = useRouter()
  const isMobile = useIsMobile()
  const { removeBooking } = useAgendaStore()
  const dateStr  = dayjs(date).format('YYYY-MM-DD')

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
      .then(res => { if (!cancelled) setDetail(res.data?.data ?? res.data) })
      .catch(() => {
        if (!cancelled) setDetail({
          id: bookingId, status: status0 as BookingDetail['status'],
          startAt: dayjs.tz(`${dateStr} ${bookingStart}`, 'America/Sao_Paulo').toISOString(),
          endAt:   dayjs.tz(`${dateStr} ${bookingEnd}`,   'America/Sao_Paulo').toISOString(),
          clientName,
          service: { id:'', name:serviceName, price:null, color:serviceColor??null, duration:0 },
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

  function goToCheckout() { onClose(); router.push(`/dashboard/checkout?bookingId=${bookingId}`) }

  if (!open || typeof document==='undefined') return null

  const status    = detail?.status ?? booking.status
  const cfg       = STATUS_CFG[status as keyof typeof STATUS_CFG] ?? STATUS_CFG.CONFIRMED
  const isConfirmed = status === 'CONFIRMED'
  const price     = detail?.service.price ?? 0
  const profName  = detail?.professional?.name
  const dateLabel = dayjs(detail?.startAt ?? `${dateStr}T${bookingStart}:00`)
    .tz('America/Sao_Paulo').format('ddd, DD [de] MMM [de] YYYY').replace(/^\w/, c => c.toUpperCase())

  const panel = (
    <>
      <style>{`
        @keyframes sheetIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .bvp-alter-btn:hover{background:rgba(255,255,255,0.28)!important}
        .bvp-drop-item:hover{background:rgba(0,0,0,0.04)!important}
      `}</style>

      {confirm==='cancel' && <ConfirmModal title="Cancelar agendamento?" body="O horário ficará disponível novamente." confirmLabel="Sim, cancelar" danger onConfirm={()=>handleAction('CANCELED')} onCancel={()=>setConfirm(null)}/>}
      {confirm==='noshow' && <ConfirmModal title="Cliente não compareceu?" body="O agendamento será marcado como não compareceu." confirmLabel="Confirmar" onConfirm={()=>handleAction('NO_SHOW')} onCancel={()=>setConfirm(null)}/>}

      {/* Overlay */}
      <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:9994,background:'rgba(0,0,0,0.18)',backdropFilter:'blur(4px)'}}/>

      {/* Painel */}
      <div style={{
        position:'fixed',
        ...(isMobile
          ? {left:0,right:0,bottom:0,height:'92dvh',borderRadius:'22px 22px 0 0',animation:'sheetUp 0.30s cubic-bezier(0.32,0.72,0,1)'}
          : {top:0,right:0,bottom:0,width:420,borderRadius:'0',animation:'sheetIn 0.26s cubic-bezier(0.25,0.46,0.45,0.94)'}
        ),
        background:'#f8f8fa',
        boxShadow: isMobile ? '0 -16px 60px rgba(0,0,0,0.16)' : '-16px 0 60px rgba(0,0,0,0.12)',
        zIndex:9995,
        display:'flex', flexDirection:'column',
        fontFamily:typography.fontFamily,
        overflow:'hidden',
      }}>

        {/* Handle mobile */}
        {isMobile && (
          <div style={{display:'flex',justifyContent:'center',paddingTop:12,paddingBottom:4,flexShrink:0}}>
            <div style={{width:36,height:4,borderRadius:2,background:'rgba(0,0,0,0.14)'}}/>
          </div>
        )}

        {/* ── HEADER STATUS ── */}
        <div style={{
          background: cfg.gradient,
          padding: isMobile ? '16px 20px 20px' : '20px 24px 24px',
          flexShrink:0,
          position:'relative',
        }}>
          {/* Status + ações */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
            <div style={{display:'flex',alignItems:'center',gap:7}}>
              <cfg.icon size={15} color="#fff" strokeWidth={2.5}/>
              <span style={{color:'rgba(255,255,255,0.95)',fontWeight:800,fontSize:12,letterSpacing:'.1em'}}>{cfg.label}</span>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              {isConfirmed && (
                <div style={{position:'relative'}}>
                  <button className="bvp-alter-btn" onClick={()=>setShowAlter(v=>!v)} style={{display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:10,border:'1.5px solid rgba(255,255,255,0.3)',background:'rgba(255,255,255,0.15)',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer',letterSpacing:'.06em',backdropFilter:'blur(8px)',transition:'background 0.15s'}}>
                    ALTERAR <ChevronDown size={12} strokeWidth={2.5}/>
                  </button>
                  {showAlter && (
                    <>
                      <div onClick={()=>setShowAlter(false)} style={{position:'fixed',inset:0,zIndex:9996}}/>
                      <div style={{position:'absolute',top:'calc(100% + 8px)',right:0,width:230,background:'#fff',borderRadius:16,boxShadow:'0 20px 60px rgba(0,0,0,0.18)',zIndex:9997,overflow:'hidden',border:'1px solid rgba(0,0,0,0.06)'}}>
                        <button className="bvp-drop-item" onClick={()=>{setShowAlter(false);setConfirm('cancel')}} style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'15px 18px',border:'none',borderBottom:'1px solid rgba(0,0,0,0.06)',background:'transparent',cursor:'pointer',textAlign:'left',color:colors.red.DEFAULT,fontSize:14,fontWeight:600,fontFamily:typography.fontFamily,transition:'background 0.12s'}}>
                          <Ban size={14} strokeWidth={2}/> Cancelar agendamento
                        </button>
                        <button className="bvp-drop-item" onClick={()=>{setShowAlter(false);setConfirm('noshow')}} style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'15px 18px',border:'none',background:'transparent',cursor:'pointer',textAlign:'left',color:'#374151',fontSize:14,fontWeight:600,fontFamily:typography.fontFamily,transition:'background 0.12s'}}>
                          <User size={14} strokeWidth={2}/> Cliente não compareceu
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
              <button onClick={onClose} style={{width:30,height:30,borderRadius:'50%',border:'1.5px solid rgba(255,255,255,0.3)',background:'rgba(255,255,255,0.15)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(8px)'}}>
                <X size={14} color="#fff" strokeWidth={2.5}/>
              </button>
            </div>
          </div>

          {/* Cliente no header */}
          {!loading && (
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:48,height:48,borderRadius:'50%',background:'rgba(255,255,255,0.22)',backdropFilter:'blur(8px)',border:'2px solid rgba(255,255,255,0.35)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:15,fontWeight:800,color:'#fff',letterSpacing:'-0.02em'}}>
                {getInitials(detail?.clientName ?? clientName)}
              </div>
              <div>
                <div style={{fontSize:17,fontWeight:800,color:'#fff',letterSpacing:'-0.02em',lineHeight:1.2}}>{detail?.clientName ?? clientName}</div>
                {detail?.clientPhone && (
                  <div style={{display:'flex',alignItems:'center',gap:5,marginTop:3}}>
                    <Phone size={11} color="rgba(255,255,255,0.7)" strokeWidth={2}/>
                    <span style={{fontSize:13,color:'rgba(255,255,255,0.80)',fontVariantNumeric:'tabular-nums'}}>{fmtPhone(detail.clientPhone)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── BODY ── */}
        <div style={{flex:1,overflowY:'auto',padding:isMobile?'16px':'20px',display:'flex',flexDirection:'column',gap:12}}>
          {loading ? (
            <div style={{display:'flex',justifyContent:'center',alignItems:'center',flex:1,paddingTop:60}}>
              <div style={{width:32,height:32,borderRadius:'50%',border:`3px solid ${colors.red.subtle}`,borderTopColor:colors.red.DEFAULT,animation:'spin 0.8s linear infinite'}}/>
            </div>
          ) : (
            <>
              {/* Card serviço + horário + profissional */}
              <div style={{background:'#fff',borderRadius:18,overflow:'hidden',boxShadow:'0 2px 16px rgba(0,0,0,0.06)',border:'1px solid rgba(0,0,0,0.06)'}}>
                {/* Serviço */}
                <div style={{padding:'16px 18px',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'1px solid rgba(0,0,0,0.06)'}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,minWidth:0}}>
                    <div style={{width:4,height:40,borderRadius:2,background:detail?.service.color ?? colors.red.DEFAULT,flexShrink:0}}/>
                    <div style={{minWidth:0}}>
                      <div style={{fontSize:15,fontWeight:700,color:'#0f0f14',letterSpacing:'-0.01em',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{detail?.service.name ?? serviceName}</div>
                      <div style={{display:'flex',alignItems:'center',gap:5,marginTop:3}}>
                        <Clock size={11} color={colors.gray.dimText} strokeWidth={2}/>
                        <span style={{fontSize:12,color:colors.gray.dimText}}>
                          {detail?.service.duration ? `${detail.service.duration}min` : `${bookingStart}–${bookingEnd}`}
                        </span>
                      </div>
                    </div>
                  </div>
                  {price > 0 && (
                    <span style={{fontSize:17,fontWeight:800,color:'#0f0f14',fontVariantNumeric:'tabular-nums',flexShrink:0,marginLeft:12}}>
                      R$ {price.toFixed(2).replace('.',',')}
                    </span>
                  )}
                </div>

                {/* Horário */}
                <div style={{padding:'14px 18px',display:'flex',alignItems:'center',gap:12,borderBottom:'1px solid rgba(0,0,0,0.06)'}}>
                  <div style={{width:36,height:36,borderRadius:10,background:colors.red.subtle,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <Calendar size={16} color={colors.red.DEFAULT} strokeWidth={2}/>
                  </div>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,color:'#0f0f14'}}>{dateLabel}</div>
                    <div style={{fontSize:13,color:colors.gray.dimText,marginTop:2,fontVariantNumeric:'tabular-nums'}}>{bookingStart} – {bookingEnd}</div>
                  </div>
                </div>

                {/* Profissional */}
                {profName && (
                  <div style={{padding:'14px 18px',display:'flex',alignItems:'center',gap:12}}>
                    <div style={{width:36,height:36,borderRadius:10,background:'rgba(71,85,105,0.08)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <User size={16} color='#475569' strokeWidth={2}/>
                    </div>
                    <div>
                      <div style={{fontSize:11,fontWeight:700,color:colors.gray.dimText,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:2}}>Profissional</div>
                      <div style={{fontSize:14,fontWeight:600,color:'#0f0f14'}}>{profName}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Card total */}
              {price > 0 && (
                <div style={{background:'#fff',borderRadius:18,padding:'18px',boxShadow:'0 2px 16px rgba(0,0,0,0.06)',border:'1px solid rgba(0,0,0,0.06)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <div style={{fontSize:11,fontWeight:700,color:colors.gray.dimText,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:4}}>Total</div>
                    <div style={{fontSize:26,fontWeight:800,color:'#0f0f14',fontVariantNumeric:'tabular-nums',letterSpacing:'-0.03em'}}>R$ {price.toFixed(2).replace('.',',')}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:11,fontWeight:700,color:colors.gray.dimText,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:4}}>A ser pago</div>
                    <div style={{fontSize:26,fontWeight:800,color:colors.red.DEFAULT,fontVariantNumeric:'tabular-nums',letterSpacing:'-0.03em'}}>R$ {price.toFixed(2).replace('.',',')}</div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── FOOTER ── */}
        {!loading && (
          <div style={{
            padding: isMobile ? `14px 20px max(20px,env(safe-area-inset-bottom))` : '16px 24px',
            borderTop:'1px solid rgba(0,0,0,0.07)',
            background:'#fff',
            flexShrink:0,
            display:'flex',
            gap:10,
          }}>
            <button onClick={onClose} style={{flex:1,padding:'14px',borderRadius:14,border:'1.5px solid rgba(0,0,0,0.10)',background:'transparent',fontSize:13,fontWeight:700,cursor:'pointer',color:'#374151',letterSpacing:'.04em',fontFamily:typography.fontFamily}}>
              FECHAR
            </button>
            {isConfirmed && (
              <button onClick={goToCheckout} style={{flex:2,padding:'14px',borderRadius:14,border:'none',background:'linear-gradient(135deg,#1e293b,#0f172a)',color:'#fff',fontSize:13,fontWeight:800,cursor:'pointer',letterSpacing:'.06em',textTransform:'uppercase' as const,boxShadow:'0 6px 20px rgba(15,23,42,0.3)',fontFamily:typography.fontFamily,display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                CHECKOUT →
              </button>
            )}
            {saving && <div style={{position:'absolute',inset:0,background:'rgba(255,255,255,0.7)',display:'flex',alignItems:'center',justifyContent:'center',borderRadius:14}}/>}
          </div>
        )}
      </div>
    </>
  )

  return createPortal(panel, document.body)
}