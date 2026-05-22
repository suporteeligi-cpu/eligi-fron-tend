'use client'
// src/app/dashboard/checkout/page.tsx

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ChevronLeft, Banknote, CreditCard, Smartphone, ArrowLeftRight,
  Split, Gift, Package, UserCheck, Check, Loader2, Phone,
} from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { colors, typography, radius } from '@/shared/theme'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import 'dayjs/locale/pt-br'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale('pt-br')

type PaymentMethod = 'CASH'|'CREDIT_CARD'|'DEBIT_CARD'|'PIX'|'BANK_TRANSFER'|'SPLIT'|'SUBSCRIPTION'|'GIFT_CARD'|'PACKAGE'

interface BookingDetail {
  id:string; status:string; startAt:string; endAt:string
  clientName:string; clientPhone?:string
  service:{ id:string; name:string; price:number|null; color:string|null; duration:number }
  professional?:{ id:string; name:string; avatarUrl?:string }
}

const METHODS: {id:PaymentMethod; label:string; icon:React.ComponentType<{size?:number;strokeWidth?:number;color?:string}>}[] = [
  { id:'CASH',          label:'Dinheiro',        icon:Banknote       },
  { id:'CREDIT_CARD',   label:'Cartão Crédito',  icon:CreditCard     },
  { id:'DEBIT_CARD',    label:'Débito',           icon:CreditCard     },
  { id:'PIX',           label:'Pix',              icon:Smartphone     },
  { id:'SPLIT',         label:'Dividir',          icon:Split          },
  { id:'BANK_TRANSFER', label:'Transferência',    icon:ArrowLeftRight },
  { id:'SUBSCRIPTION',  label:'Assinatura',       icon:UserCheck      },
  { id:'GIFT_CARD',     label:'Cartão Presente',  icon:Gift           },
  { id:'PACKAGE',       label:'Pacote',           icon:Package        },
]

function getInitials(n:string){ return n.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase() }
function fmtPhone(p:string){
  const d=p.replace(/\D/g,'')
  if(d.length===11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
  if(d.length===10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
  return p
}

function CheckoutInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const bookingId    = searchParams.get('bookingId')

  const [booking,       setBooking]       = useState<BookingDetail|null>(null)
  const [loading,       setLoading]       = useState(true)
  const [method,        setMethod]        = useState<PaymentMethod|null>(null)
  const [discountInput, setDiscountInput] = useState('')
  const [discount,      setDiscount]      = useState(0)
  const [paying,        setPaying]        = useState(false)
  const [success,       setSuccess]       = useState(false)
  const [error,         setError]         = useState<string|null>(null)

  useEffect(() => {
    if (!bookingId) { router.replace('/dashboard/agenda'); return }
    let cancelled = false
    api.get(`/payments/booking/${bookingId}`)
      .then(res => { if(!cancelled) setBooking(res.data?.data??res.data) })
      .catch(() => { if(!cancelled) setError('Agendamento não encontrado') })
      .finally(() => { if(!cancelled) setLoading(false) })
    return () => { cancelled=true }
  }, [bookingId, router])

  const basePrice   = booking?.service.price ?? 0
  const finalAmount = Math.max(0, basePrice - discount)

  function handleDiscount(v:string) {
    setDiscountInput(v)
    const n = parseFloat(v.replace(',','.'))
    setDiscount(isNaN(n) ? 0 : Math.min(n, basePrice))
  }

  async function handlePay() {
    if (!method||!bookingId) return
    try {
      setPaying(true); setError(null)
      await api.post('/payments/checkout', { bookingId, method, amount:finalAmount, discount })
      setSuccess(true)
      setTimeout(() => router.push('/dashboard/agenda'), 2200)
    } catch(e:unknown) {
      const msg = (e as {response?:{data?:{error?:string}}})?.response?.data?.error
      setError(msg ?? 'Erro ao processar pagamento')
    } finally { setPaying(false) }
  }

  // ── Success ──
  if (success) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'65vh',fontFamily:typography.fontFamily,animation:'fadeUp 0.4s ease',gap:16,padding:24}}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}@keyframes popIn{from{transform:scale(0.5);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
      <div style={{width:80,height:80,borderRadius:'50%',background:'linear-gradient(135deg,#22c55e,#16a34a)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 12px 32px rgba(22,163,74,0.35)',animation:'popIn 0.5s cubic-bezier(0.34,1.56,0.64,1)'}}>
        <Check size={40} color="#fff" strokeWidth={3}/>
      </div>
      <h2 style={{margin:0,fontSize:24,fontWeight:800,color:'#0f0f14',letterSpacing:'-0.03em'}}>Pagamento confirmado!</h2>
      <p style={{margin:0,fontSize:16,color:colors.gray.dimText,textAlign:'center'}}>
        R$ {finalAmount.toFixed(2).replace('.',',')} via {METHODS.find(m=>m.id===method)?.label}
      </p>
      <div style={{width:6,height:6,borderRadius:'50%',background:colors.red.DEFAULT,animation:'pulse 1.2s ease infinite'}}/>
      <style>{`@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.7)}}`}</style>
    </div>
  )

  // ── Loading / Error ──
  if (loading) return (
    <div style={{display:'flex',justifyContent:'center',alignItems:'center',minHeight:'50vh'}}>
      <Loader2 size={32} color={colors.red.DEFAULT} style={{animation:'spin 0.8s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
  if (!booking||error) return (
    <div style={{textAlign:'center',padding:80,fontFamily:typography.fontFamily}}>
      <div style={{fontSize:40,marginBottom:12}}>😕</div>
      <div style={{fontSize:16,fontWeight:700,color:typography.color.primary,marginBottom:12}}>{error??'Agendamento não encontrado'}</div>
      <button onClick={()=>router.back()} style={{padding:'9px 18px',borderRadius:radius.sm,border:`1px solid ${colors.gray.borderMd}`,background:'transparent',cursor:'pointer',fontSize:14}}>Voltar</button>
    </div>
  )

  const svcColor = booking.service.color ?? colors.red.DEFAULT
  const dateLabel = dayjs(booking.startAt).tz('America/Sao_Paulo').format('DD [de] MMM, HH:mm')

  return (
    <>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .pm-btn{transition:all 0.18s cubic-bezier(0.34,1.2,0.64,1)!important}
        .pm-btn:hover:not(.pm-selected){background:rgba(0,0,0,0.03)!important;border-color:rgba(0,0,0,0.15)!important}
        @media(max-width:768px){
          .co-grid{grid-template-columns:1fr!important}
          .co-summary{order:-1}
        }
      `}</style>

      <div style={{maxWidth:960,margin:'0 auto',fontFamily:typography.fontFamily,animation:'fadeUp 0.3s ease'}}>

        {/* Header */}
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:28}}>
          <button onClick={()=>router.back()} style={{width:36,height:36,borderRadius:10,border:`1.5px solid ${colors.gray.borderMd}`,background:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
            <ChevronLeft size={18} color='#374151' strokeWidth={2.5}/>
          </button>
          <h2 style={{margin:0,fontSize:22,fontWeight:800,letterSpacing:'-0.03em',color:'#0f0f14',flex:1}}>Informações de pagamento</h2>
          <button onClick={()=>router.back()} style={{padding:'8px 16px',borderRadius:10,border:`1.5px solid rgba(220,38,38,0.25)`,background:'rgba(220,38,38,0.06)',color:colors.red.DEFAULT,fontSize:13,fontWeight:700,cursor:'pointer',letterSpacing:'.02em'}}>
            Cancelar venda
          </button>
        </div>

        <div className="co-grid" style={{display:'grid',gridTemplateColumns:'1fr 380px',gap:20,alignItems:'start'}}>

          {/* ── Esquerda ── */}
          <div style={{display:'flex',flexDirection:'column',gap:16}}>

            {/* Métodos */}
            <div style={{background:'#fff',borderRadius:20,padding:22,boxShadow:'0 2px 20px rgba(0,0,0,0.06)',border:'1px solid rgba(0,0,0,0.06)'}}>
              <h3 style={{margin:'0 0 18px',fontSize:15,fontWeight:800,color:'#0f0f14',letterSpacing:'-0.02em'}}>Método de pagamento</h3>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
                {METHODS.map(m => {
                  const isSel = method===m.id
                  return (
                    <button key={m.id} className={`pm-btn${isSel?' pm-selected':''}`} onClick={()=>setMethod(m.id)} style={{
                      padding:'15px 8px 13px', borderRadius:14,
                      border: isSel ? '2px solid #0f172a' : '1.5px solid rgba(0,0,0,0.10)',
                      background: isSel ? '#0f172a' : '#fff',
                      cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:7,
                      boxShadow: isSel ? '0 6px 20px rgba(15,23,42,0.25)' : 'none',
                      position:'relative', overflow:'hidden',
                    }}>
                      {isSel && (
                        <div style={{position:'absolute',top:6,right:6,width:18,height:18,borderRadius:'50%',background:colors.red.DEFAULT,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:`0 2px 6px ${colors.red.glow}`}}>
                          <Check size={11} color="#fff" strokeWidth={3}/>
                        </div>
                      )}
                      <m.icon size={22} strokeWidth={1.8} color={isSel?'#fff':'#374151'}/>
                      <span style={{fontSize:11,fontWeight:700,color:isSel?'rgba(255,255,255,0.90)':'#374151',textAlign:'center',lineHeight:1.3,letterSpacing:'.01em'}}>{m.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Pagamento */}
            <div style={{background:'#fff',borderRadius:20,padding:22,boxShadow:'0 2px 20px rgba(0,0,0,0.06)',border:'1px solid rgba(0,0,0,0.06)'}}>
              <h3 style={{margin:'0 0 18px',fontSize:15,fontWeight:800,color:'#0f0f14',letterSpacing:'-0.02em'}}>Pagamento</h3>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div>
                  <label style={{display:'block',fontSize:11,fontWeight:700,color:colors.gray.dimText,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:8}}>Quantia</label>
                  <div style={{padding:'13px 15px',borderRadius:12,border:`1.5px solid ${colors.gray.borderMd}`,background:'rgba(0,0,0,0.02)',fontSize:17,fontWeight:800,color:'#0f0f14',fontVariantNumeric:'tabular-nums',letterSpacing:'-0.02em'}}>
                    R$ {finalAmount.toFixed(2).replace('.',',')}
                  </div>
                </div>
                <div>
                  <label style={{display:'block',fontSize:11,fontWeight:700,color:colors.gray.dimText,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:8}}>Desconto (R$)</label>
                  <input value={discountInput} onChange={e=>handleDiscount(e.target.value)} placeholder="0,00"
                    style={{width:'100%',padding:'13px 15px',borderRadius:12,border:`1.5px solid ${colors.gray.borderMd}`,background:'#fff',fontSize:15,outline:'none',boxSizing:'border-box',fontFamily:typography.fontFamily,color:'#0f0f14',transition:'border-color 0.15s'}}
                    onFocus={e=>{e.target.style.borderColor=colors.red.DEFAULT;e.target.style.boxShadow=`0 0 0 3px ${colors.red.focusRing}`}}
                    onBlur={e=>{e.target.style.borderColor=colors.gray.borderMd;e.target.style.boxShadow='none'}}
                  />
                </div>
              </div>
              {discount>0 && (
                <div style={{marginTop:12,display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',borderRadius:10,background:'rgba(22,163,74,0.06)',border:'1px solid rgba(22,163,74,0.18)'}}>
                  <span style={{fontSize:13,color:'#15803d',fontWeight:600}}>Desconto aplicado</span>
                  <span style={{fontSize:13,color:'#15803d',fontWeight:800,fontVariantNumeric:'tabular-nums'}}>-R$ {discount.toFixed(2).replace('.',',')}</span>
                </div>
              )}
              {error && (
                <div style={{marginTop:12,padding:'10px 14px',borderRadius:10,background:'rgba(220,38,38,0.06)',border:`1px solid ${colors.red.border}`,color:colors.red.DEFAULT,fontSize:13,fontWeight:600}}>
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* ── Direita — Resumo ── */}
          <div className="co-summary" style={{position:'sticky',top:20}}>
            <div style={{background:'#fff',borderRadius:20,boxShadow:'0 2px 20px rgba(0,0,0,0.06)',border:'1px solid rgba(0,0,0,0.06)',overflow:'hidden'}}>

              {/* Cliente */}
              <div style={{padding:'18px 20px',borderBottom:'1px solid rgba(0,0,0,0.06)',display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:44,height:44,borderRadius:'50%',background:colors.red.gradient,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:14,fontWeight:800,color:'#fff',boxShadow:`0 4px 12px ${colors.red.glow}`}}>
                  {getInitials(booking.clientName)}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:15,fontWeight:700,color:'#0f0f14',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{booking.clientName}</div>
                  {booking.clientPhone && (
                    <div style={{display:'flex',alignItems:'center',gap:5,marginTop:2}}>
                      <Phone size={11} color={colors.gray.dimText} strokeWidth={2}/>
                      <span style={{fontSize:12,color:colors.gray.dimText,fontVariantNumeric:'tabular-nums'}}>{fmtPhone(booking.clientPhone)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Booking */}
              <div style={{padding:'16px 20px',borderBottom:'1px solid rgba(0,0,0,0.06)'}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
                  <span style={{padding:'3px 10px',borderRadius:20,background:'rgba(22,163,74,0.10)',border:'1px solid rgba(22,163,74,0.22)',fontSize:11,fontWeight:700,color:'#15803d',letterSpacing:'.05em'}}>CONFIRMADO</span>
                  <span style={{fontSize:13,color:colors.gray.dimText,fontVariantNumeric:'tabular-nums'}}>{dateLabel}</span>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <div style={{width:4,height:36,borderRadius:2,background:svcColor,flexShrink:0}}/>
                  <div>
                    <div style={{fontSize:15,fontWeight:700,color:'#0f0f14'}}>{booking.service.name}</div>
                    <div style={{fontSize:12,color:colors.gray.dimText,marginTop:2}}>{booking.service.duration}min</div>
                  </div>
                </div>
                {booking.professional && (
                  <div style={{display:'flex',alignItems:'center',gap:8,marginTop:12}}>
                    <div style={{width:26,height:26,borderRadius:'50%',background:'rgba(71,85,105,0.10)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:800,color:'#475569',flexShrink:0}}>
                      {getInitials(booking.professional.name)}
                    </div>
                    <span style={{fontSize:13,color:colors.gray.dimText,fontWeight:500}}>{booking.professional.name}</span>
                  </div>
                )}
              </div>

              {/* Itens */}
              <div style={{padding:'14px 20px',borderBottom:'1px solid rgba(0,0,0,0.06)'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:discount>0?8:0}}>
                  <span style={{fontSize:13,color:colors.gray.dimText}}>{booking.service.name} ({booking.service.duration}m)</span>
                  <span style={{fontSize:13,fontWeight:700,color:'#0f0f14',fontVariantNumeric:'tabular-nums'}}>R$ {basePrice.toFixed(2).replace('.',',')}</span>
                </div>
                {discount>0 && (
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontSize:13,color:'#15803d'}}>Desconto</span>
                    <span style={{fontSize:13,fontWeight:700,color:'#15803d',fontVariantNumeric:'tabular-nums'}}>-R$ {discount.toFixed(2).replace('.',',')}</span>
                  </div>
                )}
              </div>

              {/* Total + CTA */}
              <div style={{padding:'16px 20px 20px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
                  <span style={{fontSize:12,fontWeight:700,color:colors.gray.dimText,textTransform:'uppercase',letterSpacing:'.08em'}}>TOTAL</span>
                  <span style={{fontSize:28,fontWeight:800,color:'#0f0f14',fontVariantNumeric:'tabular-nums',letterSpacing:'-0.04em'}}>R$ {finalAmount.toFixed(2).replace('.',',')}</span>
                </div>
                <button onClick={handlePay} disabled={!method||paying} style={{
                  width:'100%', padding:'16px', borderRadius:14, border:'none',
                  background: !method||paying ? 'rgba(0,0,0,0.08)' : 'linear-gradient(135deg,#1e293b,#0f172a)',
                  color: !method||paying ? colors.gray.dimText : '#fff',
                  fontSize:14, fontWeight:800, cursor:!method||paying?'not-allowed':'pointer',
                  letterSpacing:'.06em', textTransform:'uppercase' as const,
                  boxShadow: !method||paying ? 'none' : '0 8px 24px rgba(15,23,42,0.30)',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  transition:'all 0.2s cubic-bezier(0.34,1.2,0.64,1)',
                  fontFamily:typography.fontFamily,
                }}
                  onMouseEnter={e=>{ if(method&&!paying) { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 12px 32px rgba(15,23,42,0.35)' }}}
                  onMouseLeave={e=>{ e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=!method||paying?'none':'0 8px 24px rgba(15,23,42,0.30)' }}
                >
                  {paying ? <><Loader2 size={16} style={{animation:'spin 0.8s linear infinite'}}/> Processando...</> : 'CONFIRMAR E PAGAR'}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div style={{display:'flex',justifyContent:'center',alignItems:'center',minHeight:'50vh'}}>
        <Loader2 size={32} color={colors.red.DEFAULT} style={{animation:'spin 0.8s linear infinite'}}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <CheckoutInner/>
    </Suspense>
  )
}