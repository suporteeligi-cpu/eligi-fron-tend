'use client'
// src/app/dashboard/checkout/page.tsx

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ChevronLeft, Banknote, CreditCard, Smartphone, ArrowLeftRight,
  Split, Gift, Package, UserCheck, Check, Loader2, Phone, X,
} from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { colors, typography } from '@/shared/theme'
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
  { id:'CASH',          label:'Dinheiro',     icon:Banknote       },
  { id:'CREDIT_CARD',   label:'Crédito',      icon:CreditCard     },
  { id:'DEBIT_CARD',    label:'Débito',        icon:CreditCard     },
  { id:'PIX',           label:'Pix',           icon:Smartphone     },
  { id:'SPLIT',         label:'Dividir',       icon:Split          },
  { id:'BANK_TRANSFER', label:'Transferência', icon:ArrowLeftRight },
  { id:'SUBSCRIPTION',  label:'Assinatura',    icon:UserCheck      },
  { id:'GIFT_CARD',     label:'Presente',      icon:Gift           },
  { id:'PACKAGE',       label:'Pacote',        icon:Package        },
]

function getInitials(n:string){ return n.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase() }
function fmtPhone(p:string){
  const d=p.replace(/\D/g,'')
  if(d.length===11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
  if(d.length===10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
  return p
}
function fmtBRL(v:number){ return `R$ ${v.toFixed(2).replace('.',',')}` }

// ─── Discount Sheet (mobile) ──────────────────────────────────────────────────
function DiscountSheet({ value, onChange, onClose, max }: {
  value:string; onChange:(v:string)=>void; onClose:()=>void; max:number
}) {
  const [local, setLocal] = useState(value)
  function confirm() { onChange(local); onClose() }
  return (
    <>
      <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',backdropFilter:'blur(10px)',zIndex:10998}}/>
      <div style={{position:'fixed',bottom:0,left:0,right:0,background:'#fff',borderRadius:'24px 24px 0 0',padding:'20px 24px max(32px,env(safe-area-inset-bottom))',zIndex:10999,boxShadow:'0 -12px 40px rgba(0,0,0,0.15)'}}>
        <div style={{width:36,height:4,borderRadius:2,background:'rgba(0,0,0,0.12)',margin:'0 auto 20px'}}/>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
          <h3 style={{margin:0,fontSize:17,fontWeight:800,color:'#0f0f14',letterSpacing:'-0.02em'}}>Aplicar desconto</h3>
          <button onClick={onClose} style={{width:30,height:30,borderRadius:'50%',border:'1px solid rgba(0,0,0,0.10)',background:'rgba(0,0,0,0.04)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <X size={14} color='#374151' strokeWidth={2.5}/>
          </button>
        </div>
        <input
          value={local} onChange={e=>setLocal(e.target.value)}
          placeholder="0,00" inputMode="decimal" autoFocus
          style={{width:'100%',padding:'16px 18px',borderRadius:14,border:'1.5px solid rgba(0,0,0,0.12)',background:'rgba(0,0,0,0.03)',fontSize:24,fontWeight:800,color:'#0f0f14',outline:'none',boxSizing:'border-box',fontFamily:typography.fontFamily,fontVariantNumeric:'tabular-nums',textAlign:'center',marginBottom:14}}
        />
        <div style={{fontSize:13,color:colors.gray.dimText,textAlign:'center',marginBottom:18}}>
          Máximo: {fmtBRL(max)}
        </div>
        <button onClick={confirm} style={{width:'100%',padding:'16px',borderRadius:14,border:'none',background:'linear-gradient(135deg,#1e293b,#0f172a)',color:'#fff',fontSize:15,fontWeight:800,cursor:'pointer',letterSpacing:'.04em',boxShadow:'0 6px 20px rgba(15,23,42,0.28)',fontFamily:typography.fontFamily}}>
          APLICAR
        </button>
      </div>
    </>
  )
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
  const [showDiscount,  setShowDiscount]  = useState(false)

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

  function applyDiscount(v:string) {
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
    <div style={{position:'fixed',inset:0,background:'linear-gradient(135deg,#0f172a,#1e293b)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:20,zIndex:9999,fontFamily:typography.fontFamily}}>
      <style>{`@keyframes popIn{from{transform:scale(0.5);opacity:0}to{transform:scale(1);opacity:1}} @keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{width:88,height:88,borderRadius:'50%',background:'linear-gradient(135deg,#22c55e,#16a34a)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 16px 48px rgba(22,163,74,0.4)',animation:'popIn 0.5s cubic-bezier(0.34,1.56,0.64,1)'}}>
        <Check size={44} color="#fff" strokeWidth={2.5}/>
      </div>
      <div style={{textAlign:'center',animation:'fadeIn 0.4s ease 0.2s both'}}>
        <div style={{fontSize:28,fontWeight:800,color:'#fff',letterSpacing:'-0.04em',marginBottom:8}}>{fmtBRL(finalAmount)}</div>
        <div style={{fontSize:16,color:'rgba(255,255,255,0.6)',fontWeight:600}}>Pagamento confirmado!</div>
      </div>
    </div>
  )

  // ── Loading / Error ──
  if (loading) return (
    <div style={{position:'fixed',inset:0,display:'flex',justifyContent:'center',alignItems:'center',background:'#f8f8fa'}}>
      <Loader2 size={32} color={colors.red.DEFAULT} style={{animation:'spin 0.8s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
  if (!booking||error) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'60vh',gap:16,fontFamily:typography.fontFamily}}>
      <div style={{fontSize:40}}>😕</div>
      <div style={{fontSize:16,fontWeight:700,color:'#0f0f14'}}>{error??'Agendamento não encontrado'}</div>
      <button onClick={()=>router.back()} style={{padding:'10px 20px',borderRadius:12,border:'1.5px solid rgba(0,0,0,0.12)',background:'transparent',cursor:'pointer',fontSize:14,fontWeight:600}}>Voltar</button>
    </div>
  )

  const svcColor  = booking.service.color ?? colors.red.DEFAULT
  const dateLabel = dayjs(booking.startAt).tz('America/Sao_Paulo').format('DD [de] MMM[,] HH:mm')
  const canPay    = !!method && !paying

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

        /* ── MOBILE FULLSCREEN ── */
        @media(max-width:768px){
          .co-root{
            position:fixed!important;
            inset:0!important;
            max-width:100%!important;
            margin:0!important;
            padding:0!important;
            display:flex!important;
            flex-direction:column!important;
            background:#0f172a!important;
            overflow:hidden!important;
          }
          .co-desktop-header{display:none!important}
          .co-desktop-grid{display:none!important}
          .co-mobile-layout{display:flex!important}
          .co-mobile-summary{display:flex!important}
          .co-mobile-methods{display:flex!important}
          .co-mobile-footer{display:flex!important}
        }

        @media(min-width:769px){
          .co-mobile-layout{display:none!important}
          .co-mobile-summary{display:none!important}
          .co-mobile-methods{display:none!important}
          .co-mobile-footer{display:none!important}
        }

        .pm-btn{transition:all 0.18s cubic-bezier(0.34,1.2,0.64,1)!important}
        .pm-btn:active{transform:scale(0.94)!important}
      `}</style>

      <div className="co-root" style={{maxWidth:960,margin:'0 auto',fontFamily:typography.fontFamily,animation:'fadeUp 0.3s ease',padding:'0 0 0 0'}}>

        {/* ══ DESKTOP ════════════════════════════════════════════════════════ */}

        {/* Header desktop */}
        <div className="co-desktop-header" style={{display:'flex',alignItems:'center',gap:12,marginBottom:28,padding:'0'}}>
          <button onClick={()=>router.back()} style={{width:36,height:36,borderRadius:10,border:'1.5px solid rgba(0,0,0,0.10)',background:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
            <ChevronLeft size={18} color='#374151' strokeWidth={2.5}/>
          </button>
          <h2 style={{margin:0,fontSize:22,fontWeight:800,letterSpacing:'-0.03em',color:'#0f0f14',flex:1}}>Informações de pagamento</h2>
          <button onClick={()=>router.back()} style={{padding:'8px 16px',borderRadius:10,border:'1.5px solid rgba(220,38,38,0.25)',background:'rgba(220,38,38,0.06)',color:colors.red.DEFAULT,fontSize:13,fontWeight:700,cursor:'pointer'}}>
            Cancelar venda
          </button>
        </div>

        {/* Grid desktop */}
        <div className="co-desktop-grid" style={{display:'grid',gridTemplateColumns:'1fr 380px',gap:20,alignItems:'start'}}>

          {/* Esquerda */}
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            <div style={{background:'#fff',borderRadius:20,padding:22,boxShadow:'0 2px 20px rgba(0,0,0,0.06)',border:'1px solid rgba(0,0,0,0.06)'}}>
              <h3 style={{margin:'0 0 18px',fontSize:15,fontWeight:800,color:'#0f0f14'}}>Método de pagamento</h3>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
                {METHODS.map(m => {
                  const isSel = method===m.id
                  return (
                    <button key={m.id} className="pm-btn" onClick={()=>setMethod(m.id)} style={{padding:'15px 8px 13px',borderRadius:14,border:isSel?'2px solid #0f172a':'1.5px solid rgba(0,0,0,0.10)',background:isSel?'#0f172a':'#fff',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:7,boxShadow:isSel?'0 6px 20px rgba(15,23,42,0.25)':'none',position:'relative'}}>
                      {isSel&&<div style={{position:'absolute',top:6,right:6,width:18,height:18,borderRadius:'50%',background:colors.red.DEFAULT,display:'flex',alignItems:'center',justifyContent:'center'}}><Check size={11} color="#fff" strokeWidth={3}/></div>}
                      <m.icon size={22} strokeWidth={1.8} color={isSel?'#fff':'#374151'}/>
                      <span style={{fontSize:11,fontWeight:700,color:isSel?'rgba(255,255,255,0.9)':'#374151',textAlign:'center',lineHeight:1.3}}>{m.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            <div style={{background:'#fff',borderRadius:20,padding:22,boxShadow:'0 2px 20px rgba(0,0,0,0.06)',border:'1px solid rgba(0,0,0,0.06)'}}>
              <h3 style={{margin:'0 0 18px',fontSize:15,fontWeight:800,color:'#0f0f14'}}>Pagamento</h3>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:colors.gray.dimText,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:8}}>Quantia</div>
                  <div style={{padding:'13px 15px',borderRadius:12,background:'rgba(0,0,0,0.03)',fontSize:17,fontWeight:800,color:'#0f0f14',fontVariantNumeric:'tabular-nums'}}>{fmtBRL(finalAmount)}</div>
                </div>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:colors.gray.dimText,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:8}}>Desconto (R$)</div>
                  <input value={discountInput} onChange={e=>applyDiscount(e.target.value)} placeholder="0,00"
                    style={{width:'100%',padding:'13px 15px',borderRadius:12,border:'1.5px solid rgba(0,0,0,0.10)',background:'#fff',fontSize:15,outline:'none',boxSizing:'border-box',fontFamily:typography.fontFamily,color:'#0f0f14'}}
                    onFocus={e=>{e.target.style.borderColor=colors.red.DEFAULT}}
                    onBlur={e=>{e.target.style.borderColor='rgba(0,0,0,0.10)'}}
                  />
                </div>
              </div>
              {error&&<div style={{marginTop:12,padding:'10px 14px',borderRadius:10,background:'rgba(220,38,38,0.06)',border:`1px solid ${colors.red.border}`,color:colors.red.DEFAULT,fontSize:13}}>{error}</div>}
            </div>
          </div>

          {/* Resumo desktop */}
          <div style={{position:'sticky',top:20,background:'#fff',borderRadius:20,boxShadow:'0 2px 20px rgba(0,0,0,0.06)',border:'1px solid rgba(0,0,0,0.06)',overflow:'hidden'}}>
            <div style={{padding:'18px 20px',background:'linear-gradient(135deg,#1e293b,#0f172a)'}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:44,height:44,borderRadius:'50%',background:colors.red.gradient,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:800,color:'#fff',boxShadow:`0 4px 12px ${colors.red.glow}`}}>{getInitials(booking.clientName)}</div>
                <div>
                  <div style={{fontSize:15,fontWeight:700,color:'#fff'}}>{booking.clientName}</div>
                  {booking.clientPhone&&<div style={{display:'flex',alignItems:'center',gap:5,marginTop:2}}><Phone size={11} color="rgba(255,255,255,0.5)"/><span style={{fontSize:12,color:'rgba(255,255,255,0.55)'}}>{fmtPhone(booking.clientPhone)}</span></div>}
                </div>
              </div>
            </div>
            <div style={{padding:'16px 20px',borderBottom:'1px solid rgba(0,0,0,0.06)'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
                <span style={{padding:'3px 10px',borderRadius:20,background:'rgba(22,163,74,0.10)',border:'1px solid rgba(22,163,74,0.22)',fontSize:11,fontWeight:700,color:'#15803d',letterSpacing:'.05em'}}>CONFIRMADO</span>
                <span style={{fontSize:13,color:colors.gray.dimText}}>{dateLabel}</span>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:4,height:36,borderRadius:2,background:svcColor,flexShrink:0}}/>
                <div>
                  <div style={{fontSize:15,fontWeight:700,color:'#0f0f14'}}>{booking.service.name}</div>
                  <div style={{fontSize:12,color:colors.gray.dimText,marginTop:2}}>{booking.service.duration}min</div>
                </div>
              </div>
              {booking.professional&&<div style={{display:'flex',alignItems:'center',gap:8,marginTop:12}}><div style={{width:26,height:26,borderRadius:'50%',background:'rgba(71,85,105,0.10)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:800,color:'#475569'}}>{getInitials(booking.professional.name)}</div><span style={{fontSize:13,color:colors.gray.dimText}}>{booking.professional.name}</span></div>}
            </div>
            <div style={{padding:'14px 20px',borderBottom:'1px solid rgba(0,0,0,0.06)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:13,color:colors.gray.dimText}}>{booking.service.name} ({booking.service.duration}m)</span>
                <span style={{fontSize:13,fontWeight:700,color:'#0f0f14',fontVariantNumeric:'tabular-nums'}}>{fmtBRL(basePrice)}</span>
              </div>
              {discount>0&&<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:6}}><span style={{fontSize:13,color:'#15803d'}}>Desconto</span><span style={{fontSize:13,fontWeight:700,color:'#15803d',fontVariantNumeric:'tabular-nums'}}>-{fmtBRL(discount)}</span></div>}
            </div>
            <div style={{padding:'16px 20px 20px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
                <span style={{fontSize:12,fontWeight:700,color:colors.gray.dimText,textTransform:'uppercase',letterSpacing:'.08em'}}>TOTAL</span>
                <span style={{fontSize:28,fontWeight:800,color:'#0f0f14',fontVariantNumeric:'tabular-nums',letterSpacing:'-0.04em'}}>{fmtBRL(finalAmount)}</span>
              </div>
              <button onClick={handlePay} disabled={!canPay} style={{width:'100%',padding:'16px',borderRadius:14,border:'none',background:!canPay?'rgba(0,0,0,0.07)':'linear-gradient(135deg,#1e293b,#0f172a)',color:!canPay?colors.gray.dimText:'#fff',fontSize:14,fontWeight:800,cursor:!canPay?'not-allowed':'pointer',letterSpacing:'.06em',textTransform:'uppercase' as const,boxShadow:!canPay?'none':'0 8px 24px rgba(15,23,42,0.30)',display:'flex',alignItems:'center',justifyContent:'center',gap:8,fontFamily:typography.fontFamily}}>
                {paying?<><Loader2 size={16} style={{animation:'spin 0.8s linear infinite'}}/>Processando...</>:'CONFIRMAR E PAGAR'}
              </button>
            </div>
          </div>
        </div>

        {/* ══ MOBILE FULLSCREEN ══════════════════════════════════════════════ */}
        <div className="co-mobile-layout" style={{display:'none',flexDirection:'column',height:'100%',overflow:'hidden'}}>

          {/* Topo escuro — cliente + serviço + total */}
          <div className="co-mobile-summary" style={{
            display:'none', flexDirection:'column',
            background:'linear-gradient(180deg,#0f172a 0%,#1e293b 100%)',
            padding:'max(56px,env(safe-area-inset-top)) 24px 20px',
            flexShrink:0,
          }}>
            {/* Nav row */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
              <button onClick={()=>router.back()} style={{width:34,height:34,borderRadius:10,border:'1px solid rgba(255,255,255,0.15)',background:'rgba(255,255,255,0.08)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <ChevronLeft size={18} color='rgba(255,255,255,0.7)' strokeWidth={2.5}/>
              </button>
              <span style={{fontSize:13,fontWeight:700,color:'rgba(255,255,255,0.5)',letterSpacing:'.06em',textTransform:'uppercase'}}>Checkout</span>
              <button onClick={()=>router.back()} style={{padding:'6px 12px',borderRadius:8,border:'1px solid rgba(220,38,38,0.35)',background:'rgba(220,38,38,0.12)',color:'rgba(220,38,38,0.9)',fontSize:12,fontWeight:700,cursor:'pointer'}}>
                Cancelar
              </button>
            </div>

            {/* Cliente */}
            <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:18}}>
              <div style={{width:52,height:52,borderRadius:'50%',background:colors.red.gradient,display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,fontWeight:800,color:'#fff',boxShadow:`0 4px 16px ${colors.red.glow}`,flexShrink:0}}>
                {getInitials(booking.clientName)}
              </div>
              <div>
                <div style={{fontSize:19,fontWeight:800,color:'#fff',letterSpacing:'-0.03em',lineHeight:1.2}}>{booking.clientName}</div>
                {booking.clientPhone&&<div style={{display:'flex',alignItems:'center',gap:5,marginTop:3}}>
                  <Phone size={12} color='rgba(255,255,255,0.45)' strokeWidth={2}/>
                  <span style={{fontSize:13,color:'rgba(255,255,255,0.45)',fontVariantNumeric:'tabular-nums'}}>{fmtPhone(booking.clientPhone)}</span>
                </div>}
              </div>
            </div>

            {/* Serviço + profissional */}
            <div style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px',borderRadius:14,background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.10)',marginBottom:16}}>
              <div style={{width:4,height:36,borderRadius:2,background:svcColor,flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:15,fontWeight:700,color:'#fff',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{booking.service.name}</div>
                <div style={{fontSize:12,color:'rgba(255,255,255,0.5)',marginTop:2}}>{booking.service.duration}min{booking.professional?` · ${booking.professional.name}`:''}</div>
              </div>
              <div style={{fontSize:16,fontWeight:800,color:'#fff',fontVariantNumeric:'tabular-nums',flexShrink:0}}>{fmtBRL(basePrice)}</div>
            </div>

            {/* Total + desconto */}
            <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between'}}>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.35)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:4}}>A PAGAR</div>
                <div style={{fontSize:36,fontWeight:800,color:'#fff',fontVariantNumeric:'tabular-nums',letterSpacing:'-0.05em',lineHeight:1}}>{fmtBRL(finalAmount)}</div>
                {discount>0&&<div style={{fontSize:12,color:'rgba(34,197,94,0.8)',marginTop:3,fontVariantNumeric:'tabular-nums'}}>-{fmtBRL(discount)} de desconto</div>}
              </div>
              <button onClick={()=>setShowDiscount(true)} style={{padding:'8px 14px',borderRadius:10,border:'1px solid rgba(255,255,255,0.15)',background:'rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.6)',fontSize:12,fontWeight:700,cursor:'pointer',letterSpacing:'.04em'}}>
                {discount>0?'EDITAR DESC.':'+ DESCONTO'}
              </button>
            </div>
          </div>

          {/* Métodos — fundo claro, grid 3x3 */}
          <div className="co-mobile-methods" style={{
            display:'none', flex:1,
            flexDirection:'column',
            background:'#f0f0f5',
            padding:'16px 16px 8px',
            overflow:'hidden',
          }}>
            <div style={{fontSize:11,fontWeight:700,color:colors.gray.dimText,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:12,paddingLeft:2}}>
              Método de pagamento
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:9,flex:1}}>
              {METHODS.map(m => {
                const isSel = method===m.id
                return (
                  <button key={m.id} className="pm-btn" onClick={()=>setMethod(m.id)} style={{
                    borderRadius:16, border:isSel?'2px solid #0f172a':'1.5px solid rgba(0,0,0,0.09)',
                    background:isSel?'#0f172a':'#fff',
                    cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8,
                    boxShadow:isSel?'0 6px 20px rgba(15,23,42,0.28)':'0 2px 8px rgba(0,0,0,0.06)',
                    position:'relative', minHeight:80,
                    padding:'12px 6px',
                  }}>
                    {isSel&&(
                      <div style={{position:'absolute',top:7,right:7,width:20,height:20,borderRadius:'50%',background:colors.red.DEFAULT,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:`0 2px 6px ${colors.red.glow}`}}>
                        <Check size={12} color="#fff" strokeWidth={3}/>
                      </div>
                    )}
                    <m.icon size={24} strokeWidth={1.7} color={isSel?'#fff':'#374151'}/>
                    <span style={{fontSize:11,fontWeight:700,color:isSel?'rgba(255,255,255,0.9)':'#374151',textAlign:'center',lineHeight:1.2,letterSpacing:'.01em'}}>{m.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Footer fixo */}
          <div className="co-mobile-footer" style={{
            display:'none', flexDirection:'column', gap:0,
            background:'#f0f0f5',
            padding:`12px 16px max(24px,env(safe-area-inset-bottom))`,
            flexShrink:0,
          }}>
            {error&&<div style={{padding:'10px 14px',borderRadius:12,background:'rgba(220,38,38,0.10)',border:`1px solid ${colors.red.border}`,color:colors.red.DEFAULT,fontSize:13,marginBottom:10,textAlign:'center'}}>{error}</div>}
            <button onClick={handlePay} disabled={!canPay} style={{
              width:'100%', padding:'18px',
              borderRadius:18, border:'none',
              background: !canPay ? 'rgba(0,0,0,0.12)' : 'linear-gradient(135deg,#1e293b,#0f172a)',
              color: !canPay ? 'rgba(0,0,0,0.3)' : '#fff',
              fontSize:16, fontWeight:800, cursor:!canPay?'not-allowed':'pointer',
              letterSpacing:'.06em', textTransform:'uppercase' as const,
              boxShadow: !canPay ? 'none' : '0 8px 28px rgba(15,23,42,0.35)',
              display:'flex', alignItems:'center', justifyContent:'center', gap:10,
              fontFamily:typography.fontFamily,
              transition:'all 0.2s cubic-bezier(0.34,1.2,0.64,1)',
            }}>
              {paying
                ? <><Loader2 size={18} style={{animation:'spin 0.8s linear infinite'}}/>Processando...</>
                : `CONFIRMAR · ${fmtBRL(finalAmount)}`
              }
            </button>
          </div>
        </div>

        {/* Discount sheet */}
        {showDiscount&&(
          <DiscountSheet
            value={discountInput}
            onChange={applyDiscount}
            onClose={()=>setShowDiscount(false)}
            max={basePrice}
          />
        )}
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