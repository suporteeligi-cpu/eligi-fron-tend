'use client'
// src/app/dashboard/caixa/page.tsx

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ShoppingBag, Clock, CheckCircle, Search, X, ChevronRight,
  Banknote, CreditCard, Smartphone, ArrowLeftRight, Split,
  Gift, Package, UserCheck, Check, Loader2, Calendar, User,
  TrendingUp, Receipt,
} from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { colors, typography, radius, transitions } from '@/shared/theme'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import 'dayjs/locale/pt-br'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale('pt-br')

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'cobrar' | 'venda' | 'transacoes'
type PaymentMethod = 'CASH'|'CREDIT_CARD'|'DEBIT_CARD'|'PIX'|'BANK_TRANSFER'|'SPLIT'|'SUBSCRIPTION'|'GIFT_CARD'|'PACKAGE'

interface Booking {
  id: string; startAt: string; endAt: string
  clientName: string; clientPhone?: string
  status: string
  service:      { id:string; name:string; price:number|null; color:string|null; duration:number }
  professional?:{ id:string; name:string; avatarUrl?:string }
  client?:      { id:string; name:string; phone:string }
}

interface Transaction {
  id: string; amount: number; method: string; status: string; createdAt: string
  booking?: { clientName:string; startAt:string; service?:{ name:string; color?:string|null }; professional?:{ name:string } }
  client?:  { id:string; name:string }
}

interface DayGroup {
  date: string; total: number
  byMethod: Record<string,number>
  payments: Transaction[]
}

interface Service { id:string; name:string; price:number|null; duration:number; color:string|null }
interface Professional { id:string; name:string }

// ─── Constants ────────────────────────────────────────────────────────────────
const METHODS: {id:PaymentMethod; label:string; icon:React.ComponentType<{size?:number;strokeWidth?:number;color?:string}>}[] = [
  { id:'CASH',          label:'Dinheiro',        icon:Banknote       },
  { id:'CREDIT_CARD',   label:'Crédito',         icon:CreditCard     },
  { id:'DEBIT_CARD',    label:'Débito',           icon:CreditCard     },
  { id:'PIX',           label:'Pix',              icon:Smartphone     },
  { id:'SPLIT',         label:'Dividir',          icon:Split          },
  { id:'BANK_TRANSFER', label:'Transferência',    icon:ArrowLeftRight },
  { id:'SUBSCRIPTION',  label:'Assinatura',       icon:UserCheck      },
  { id:'GIFT_CARD',     label:'Presente',         icon:Gift           },
  { id:'PACKAGE',       label:'Pacote',           icon:Package        },
]

const METHOD_LABELS: Record<string,string> = {
  CASH:'Dinheiro', CREDIT_CARD:'Cartão de Crédito', DEBIT_CARD:'Débito',
  PIX:'Pix', BANK_TRANSFER:'Transferência bancária', SPLIT:'Dividir pagamento',
  SUBSCRIPTION:'Assinatura', GIFT_CARD:'Cartão Presente', PACKAGE:'Pacote',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(n:string){ return n.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase() }
function fmtBRL(v:number){ return `R$ ${v.toFixed(2).replace('.',',')}` }

function Avatar({ name, size=40, color, url }: { name:string; size?:number; color?:string; url?:string }) {
  const isColorGrad = url?.startsWith('color:')
  const bg = isColorGrad ? url!.replace('color:','') : color ?? colors.red.gradient
  return (
    <div style={{width:size,height:size,borderRadius:'50%',background:url&&!isColorGrad?'transparent':bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*0.34,fontWeight:800,color:'#fff',flexShrink:0,overflow:'hidden',letterSpacing:'-0.02em',boxShadow:`0 2px 8px rgba(0,0,0,0.12)`}}>
      {url&&!isColorGrad
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={url} alt={name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
        : getInitials(name)
      }
    </div>
  )
}

// ─── Checkout Modal (para cobrar agendamento) ─────────────────────────────────
function CheckoutModal({ booking, onClose, onDone }: { booking:Booking; onClose:()=>void; onDone:()=>void }) {
  const [method,   setMethod]   = useState<PaymentMethod|null>(null)
  const [discount, setDiscount] = useState('')
  const [paying,   setPaying]   = useState(false)
  const [success,  setSuccess]  = useState(false)
  const [error,    setError]    = useState<string|null>(null)

  const base     = booking.service.price ?? 0
  const disc     = Math.min(parseFloat(discount.replace(',','.')) || 0, base)
  const total    = Math.max(0, base - disc)
  const timeLabel = dayjs(booking.startAt).tz('America/Sao_Paulo').format('HH:mm')

  async function handlePay() {
    if (!method) return
    try {
      setPaying(true); setError(null)
      await api.post('/payments/checkout', { bookingId: booking.id, method, amount: total, discount: disc })
      setSuccess(true)
      setTimeout(() => { onDone(); onClose() }, 1500)
    } catch(e:unknown) {
      setError((e as {response?:{data?:{error?:string}}})?.response?.data?.error ?? 'Erro ao processar')
    } finally { setPaying(false) }
  }

  return (
    <>
      <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.35)',backdropFilter:'blur(10px)',zIndex:9998}}/>
      <div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:480,maxWidth:'94vw',maxHeight:'90vh',background:'#f8f8fa',borderRadius:24,boxShadow:'0 40px 80px rgba(0,0,0,0.20)',zIndex:9999,overflow:'hidden',display:'flex',flexDirection:'column',fontFamily:typography.fontFamily}}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes popIn{from{transform:scale(0.6);opacity:0}to{transform:scale(1);opacity:1}}`}</style>

        {/* Header */}
        <div style={{background:'linear-gradient(135deg,#1e293b,#0f172a)',padding:'20px 22px 22px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
            <span style={{fontSize:12,fontWeight:700,color:'rgba(255,255,255,0.6)',textTransform:'uppercase',letterSpacing:'.08em'}}>Checkout</span>
            <button onClick={onClose} style={{width:28,height:28,borderRadius:'50%',border:'1px solid rgba(255,255,255,0.2)',background:'rgba(255,255,255,0.1)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <X size={13} color="#fff" strokeWidth={2.5}/>
            </button>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <Avatar name={booking.clientName} size={44}/>
            <div>
              <div style={{fontSize:17,fontWeight:800,color:'#fff',letterSpacing:'-0.02em'}}>{booking.clientName}</div>
              <div style={{fontSize:13,color:'rgba(255,255,255,0.6)',marginTop:2}}>
                {timeLabel} · {booking.service.name} · {fmtBRL(booking.service.price ?? 0)}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{flex:1,overflowY:'auto',padding:'18px 22px',display:'flex',flexDirection:'column',gap:16}}>
          {success ? (
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'32px 0',gap:14}}>
              <div style={{width:64,height:64,borderRadius:'50%',background:'linear-gradient(135deg,#22c55e,#16a34a)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 10px 28px rgba(22,163,74,0.35)',animation:'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)'}}>
                <Check size={32} color="#fff" strokeWidth={3}/>
              </div>
              <div style={{fontSize:18,fontWeight:800,color:'#0f0f14'}}>Pago! {fmtBRL(total)}</div>
            </div>
          ) : (
            <>
              {/* Métodos */}
              <div>
                <div style={{fontSize:12,fontWeight:700,color:colors.gray.dimText,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:10}}>Método de pagamento</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
                  {METHODS.map(m => {
                    const isSel = method===m.id
                    return (
                      <button key={m.id} onClick={()=>setMethod(m.id)} style={{padding:'12px 8px 10px',borderRadius:12,border:isSel?'2px solid #0f172a':'1.5px solid rgba(0,0,0,0.10)',background:isSel?'#0f172a':'#fff',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:5,transition:`all ${transitions.spring}`,boxShadow:isSel?'0 4px 16px rgba(15,23,42,0.22)':'none',position:'relative'}}>
                        {isSel&&<div style={{position:'absolute',top:5,right:5,width:16,height:16,borderRadius:'50%',background:colors.red.DEFAULT,display:'flex',alignItems:'center',justifyContent:'center'}}><Check size={10} color="#fff" strokeWidth={3}/></div>}
                        <m.icon size={20} strokeWidth={1.8} color={isSel?'#fff':'#374151'}/>
                        <span style={{fontSize:10,fontWeight:700,color:isSel?'rgba(255,255,255,0.9)':'#374151',textAlign:'center',lineHeight:1.2}}>{m.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Desconto */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:colors.gray.dimText,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:7}}>Total</div>
                  <div style={{padding:'12px 14px',borderRadius:11,background:'rgba(0,0,0,0.04)',fontSize:18,fontWeight:800,color:'#0f0f14',fontVariantNumeric:'tabular-nums'}}>{fmtBRL(total)}</div>
                </div>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:colors.gray.dimText,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:7}}>Desconto</div>
                  <input value={discount} onChange={e=>setDiscount(e.target.value)} placeholder="0,00"
                    style={{width:'100%',padding:'12px 14px',borderRadius:11,border:`1.5px solid ${colors.gray.borderMd}`,background:'#fff',fontSize:15,outline:'none',boxSizing:'border-box',fontFamily:typography.fontFamily,color:'#0f0f14'}}/>
                </div>
              </div>

              {error&&<div style={{padding:'10px 14px',borderRadius:10,background:'rgba(220,38,38,0.06)',border:`1px solid ${colors.red.border}`,color:colors.red.DEFAULT,fontSize:13}}>{error}</div>}
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div style={{padding:'14px 22px 20px',borderTop:'1px solid rgba(0,0,0,0.07)',background:'#fff',display:'flex',gap:10}}>
            <button onClick={onClose} style={{flex:1,padding:'14px',borderRadius:13,border:'1.5px solid rgba(0,0,0,0.10)',background:'transparent',fontSize:13,fontWeight:700,cursor:'pointer',color:'#374151',fontFamily:typography.fontFamily}}>
              CANCELAR
            </button>
            <button onClick={handlePay} disabled={!method||paying} style={{flex:2,padding:'14px',borderRadius:13,border:'none',background:!method||paying?'rgba(0,0,0,0.07)':'linear-gradient(135deg,#1e293b,#0f172a)',color:!method||paying?colors.gray.dimText:'#fff',fontSize:13,fontWeight:800,cursor:!method||paying?'not-allowed':'pointer',letterSpacing:'.06em',textTransform:'uppercase' as const,boxShadow:!method||paying?'none':'0 6px 20px rgba(15,23,42,0.28)',fontFamily:typography.fontFamily,display:'flex',alignItems:'center',justifyContent:'center',gap:7,transition:`all ${transitions.spring}`}}>
              {paying?<><Loader2 size={15} style={{animation:'spin 0.8s linear infinite'}}/>Processando...</>:`CONFIRMAR · ${fmtBRL(total)}`}
            </button>
          </div>
        )}
      </div>
    </>
  )
}

// ─── Aba: Para Ser Cobrado ────────────────────────────────────────────────────
function TabCobrar({ onRefreshTransactions }: { onRefreshTransactions: () => void }) {
  const [bookings, setBookings]   = useState<Booking[]>([])
  const [loading,  setLoading]    = useState(true)
  const [selected, setSelected]   = useState<Booking|null>(null)
  const [date,     setDate]       = useState(dayjs().format('YYYY-MM-DD'))

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await api.get('/payments/to-charge', { params: { date } })
      setBookings(res.data?.data ?? [])
    } catch { setBookings([]) }
    finally { setLoading(false) }
  }, [date])

  useEffect(() => { fetch() }, [fetch])

  const totalDay = bookings.reduce((s,b) => s+(b.service.price??0), 0)

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      {/* Seletor de data + resumo */}
      <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
        <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 14px',borderRadius:12,background:'#fff',border:`1.5px solid ${colors.gray.borderMd}`,boxShadow:'0 2px 8px rgba(0,0,0,0.05)'}}>
          <Calendar size={15} color={colors.red.DEFAULT} strokeWidth={2}/>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)}
            style={{border:'none',outline:'none',fontSize:13,fontWeight:600,color:'#0f0f14',fontFamily:typography.fontFamily,background:'transparent',cursor:'pointer'}}/>
        </div>
        {!loading && (
          <div style={{display:'flex',gap:10}}>
            <div style={{padding:'8px 16px',borderRadius:12,background:'rgba(22,163,74,0.08)',border:'1px solid rgba(22,163,74,0.18)',fontSize:13,fontWeight:700,color:'#15803d'}}>
              {bookings.length} para cobrar
            </div>
            {totalDay > 0 && (
              <div style={{padding:'8px 16px',borderRadius:12,background:colors.red.subtle,border:`1px solid ${colors.red.border}`,fontSize:13,fontWeight:700,color:colors.red.DEFAULT}}>
                {fmtBRL(totalDay)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{display:'flex',justifyContent:'center',padding:60}}>
          <Loader2 size={28} color={colors.red.DEFAULT} style={{animation:'spin 0.8s linear infinite'}}/>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : bookings.length === 0 ? (
        <div style={{textAlign:'center',padding:'60px 32px',background:'#fff',borderRadius:20,border:`1px solid ${colors.gray.border}`,boxShadow:'0 2px 12px rgba(0,0,0,0.04)'}}>
          <div style={{fontSize:44,marginBottom:14}}>✅</div>
          <div style={{fontSize:17,fontWeight:700,color:'#0f0f14',marginBottom:6}}>Tudo cobrado!</div>
          <div style={{fontSize:14,color:colors.gray.dimText}}>Nenhum agendamento aguardando pagamento nesta data.</div>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {bookings.map(b => {
            const time  = dayjs(b.startAt).tz('America/Sao_Paulo').format('HH:mm')
            return (
              <div key={b.id} style={{background:'#fff',borderRadius:18,padding:'16px 18px',border:`1px solid ${colors.gray.border}`,boxShadow:'0 2px 12px rgba(0,0,0,0.04)',display:'flex',alignItems:'center',gap:14,cursor:'pointer',transition:`all ${transitions.spring}`}}
                onClick={()=>setSelected(b)}
                onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 6px 24px rgba(0,0,0,0.10)';e.currentTarget.style.transform='translateY(-1px)'}}
                onMouseLeave={e=>{e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,0.04)';e.currentTarget.style.transform='translateY(0)'}}
              >
                <Avatar name={b.clientName} size={46} url={b.professional?.avatarUrl}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:15,fontWeight:700,color:'#0f0f14',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{b.clientName}</div>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginTop:3,flexWrap:'wrap'}}>
                    <div style={{display:'flex',alignItems:'center',gap:4}}>
                      <Clock size={12} color={colors.gray.dimText} strokeWidth={2}/>
                      <span style={{fontSize:13,color:colors.gray.dimText,fontVariantNumeric:'tabular-nums',fontWeight:600}}>{time}</span>
                    </div>
                    <div style={{width:3,height:3,borderRadius:'50%',background:colors.gray.dimText}}/>
                    <div style={{display:'flex',alignItems:'center',gap:5}}>
                      {b.service.color&&<div style={{width:8,height:8,borderRadius:'50%',background:b.service.color,flexShrink:0}}/>}
                      <span style={{fontSize:13,color:colors.gray.dimText,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:160}}>{b.service.name}</span>
                    </div>
                    {b.professional&&<>
                      <div style={{width:3,height:3,borderRadius:'50%',background:colors.gray.dimText}}/>
                      <div style={{display:'flex',alignItems:'center',gap:4}}>
                        <User size={11} color={colors.gray.dimText} strokeWidth={2}/>
                        <span style={{fontSize:12,color:colors.gray.dimText}}>{b.professional.name}</span>
                      </div>
                    </>}
                  </div>
                </div>
                <div style={{textAlign:'right',flexShrink:0}}>
                  <div style={{fontSize:17,fontWeight:800,color:'#0f0f14',fontVariantNumeric:'tabular-nums'}}>{fmtBRL(b.service.price??0)}</div>
                  <div style={{display:'flex',alignItems:'center',gap:5,marginTop:4,justifyContent:'flex-end',padding:'3px 10px',borderRadius:20,background:'rgba(22,163,74,0.08)',border:'1px solid rgba(22,163,74,0.15)'}}>
                    <CheckCircle size={11} color='#16a34a' strokeWidth={2.5}/>
                    <span style={{fontSize:11,fontWeight:700,color:'#15803d'}}>CONFIRMADO</span>
                  </div>
                </div>
                <ChevronRight size={16} color={colors.gray.dimText} strokeWidth={2}/>
              </div>
            )
          })}
        </div>
      )}

      {selected && (
        <CheckoutModal
          booking={selected}
          onClose={()=>setSelected(null)}
          onDone={()=>{ fetch(); onRefreshTransactions() }}
        />
      )}
    </div>
  )
}

// ─── Aba: Venda Rápida ────────────────────────────────────────────────────────
function TabVenda({ onRefreshTransactions }: { onRefreshTransactions: () => void }) {
  const [services,      setServices]      = useState<Service[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [clientName,    setClientName]    = useState('')
  const [serviceId,     setServiceId]     = useState('')
  const [profId,        setProfId]        = useState('')
  const [method,        setMethod]        = useState<PaymentMethod|null>(null)
  const [discount,      setDiscount]      = useState('')
  const [paying,        setPaying]        = useState(false)
  const [success,       setSuccess]       = useState(false)
  const [error,         setError]         = useState<string|null>(null)
  const [svcSearch,     setSvcSearch]     = useState('')

  useEffect(() => {
    let cancelled = false
    api.get('/services').then(r=>{if(!cancelled)setServices(r.data?.data??r.data?.services??[])}).catch(()=>{})
    api.get('/equipe').then(r=>{if(!cancelled){const d=r.data?.data??[];setProfessionals(Array.isArray(d)?d:[])}}).catch(()=>{})
    return ()=>{cancelled=true}
  }, [])

  const svc      = services.find(s=>s.id===serviceId)
  const base     = svc?.price ?? 0
  const disc     = Math.min(parseFloat(discount.replace(',','.')) || 0, base)
  const total    = Math.max(0, base - disc)
  const filtered = services.filter(s=>s.name.toLowerCase().includes(svcSearch.toLowerCase()))

  async function handleSell() {
    if (!clientName.trim()||!serviceId||!method) return
    try {
      setPaying(true); setError(null)
      await api.post('/payments/quick-sale', { clientName:clientName.trim(), serviceId, professionalId:profId||undefined, method, amount:total, discount:disc })
      setSuccess(true)
      onRefreshTransactions()
      setTimeout(()=>{ setSuccess(false); setClientName(''); setServiceId(''); setProfId(''); setMethod(null); setDiscount('') }, 2500)
    } catch(e:unknown) {
      setError((e as {response?:{data?:{error?:string}}})?.response?.data?.error ?? 'Erro ao processar venda')
    } finally { setPaying(false) }
  }

  if (success) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'80px 32px',gap:16,background:'#fff',borderRadius:20,border:`1px solid ${colors.gray.border}`}}>
      <style>{`@keyframes popIn{from{transform:scale(0.6);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
      <div style={{width:72,height:72,borderRadius:'50%',background:'linear-gradient(135deg,#22c55e,#16a34a)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 12px 32px rgba(22,163,74,0.35)',animation:'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)'}}>
        <Check size={36} color="#fff" strokeWidth={3}/>
      </div>
      <div style={{fontSize:20,fontWeight:800,color:'#0f0f14'}}>Venda concluída!</div>
      <div style={{fontSize:15,color:colors.gray.dimText}}>{fmtBRL(total)} registrado</div>
    </div>
  )

  const inputStyle: React.CSSProperties = {
    width:'100%', padding:'13px 15px', borderRadius:12, border:`1.5px solid ${colors.gray.borderMd}`,
    background:'#fff', fontSize:14, outline:'none', boxSizing:'border-box',
    fontFamily:typography.fontFamily, color:'#0f0f14', transition:`border-color ${transitions.fast}`,
  }
  const labelStyle: React.CSSProperties = {
    display:'block', fontSize:11, fontWeight:700, color:colors.gray.dimText,
    textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8,
  }

  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:20,alignItems:'start'}}>
      {/* Formulário */}
      <div style={{background:'#fff',borderRadius:20,padding:22,border:`1px solid ${colors.gray.border}`,boxShadow:'0 2px 12px rgba(0,0,0,0.04)',display:'flex',flexDirection:'column',gap:16}}>
        <h3 style={{margin:0,fontSize:15,fontWeight:800,color:'#0f0f14',letterSpacing:'-0.02em'}}>Nova venda rápida</h3>

        <div>
          <label style={labelStyle}>Cliente</label>
          <input value={clientName} onChange={e=>setClientName(e.target.value)} placeholder="Nome do cliente"
            style={inputStyle}
            onFocus={e=>{e.target.style.borderColor=colors.red.DEFAULT;e.target.style.boxShadow=`0 0 0 3px ${colors.red.focusRing}`}}
            onBlur={e=>{e.target.style.borderColor=colors.gray.borderMd;e.target.style.boxShadow='none'}}
          />
        </div>

        <div>
          <label style={labelStyle}>Serviço</label>
          <div style={{position:'relative',marginBottom:8}}>
            <Search size={13} color={colors.gray.dimText} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
            <input value={svcSearch} onChange={e=>setSvcSearch(e.target.value)} placeholder="Buscar serviço..."
              style={{...inputStyle,paddingLeft:36}}
              onFocus={e=>{e.target.style.borderColor=colors.red.DEFAULT}}
              onBlur={e=>{e.target.style.borderColor=colors.gray.borderMd}}
            />
          </div>
          <div style={{maxHeight:180,overflowY:'auto',border:`1.5px solid ${colors.gray.borderMd}`,borderRadius:12,overflow:'hidden'}}>
            {filtered.map(s=>{
              const isSel=serviceId===s.id
              return (
                <button key={s.id} onClick={()=>setServiceId(s.id)} style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'11px 14px',border:'none',borderBottom:`1px solid ${colors.gray.border}`,background:isSel?'#0f172a':'transparent',cursor:'pointer',textAlign:'left',transition:`background ${transitions.fast}`}}>
                  <div style={{width:4,height:28,borderRadius:2,background:s.color??colors.red.DEFAULT,flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:isSel?'#fff':'#0f0f14',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.name}</div>
                    <div style={{fontSize:11,color:isSel?'rgba(255,255,255,0.6)':colors.gray.dimText,marginTop:1}}>{s.duration}min{s.price?` · ${fmtBRL(s.price)}`:''}</div>
                  </div>
                  {isSel&&<Check size={14} color="#fff" strokeWidth={3}/>}
                </button>
              )
            })}
          </div>
        </div>

        {professionals.length > 1 && (
          <div>
            <label style={labelStyle}>Profissional</label>
            <select value={profId} onChange={e=>setProfId(e.target.value)} style={{...inputStyle,appearance:'none',cursor:'pointer'}}>
              <option value="">Qualquer profissional</option>
              {professionals.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        )}

        <div>
          <label style={labelStyle}>Desconto (R$)</label>
          <input value={discount} onChange={e=>setDiscount(e.target.value)} placeholder="0,00"
            style={inputStyle}
            onFocus={e=>{e.target.style.borderColor=colors.red.DEFAULT}}
            onBlur={e=>{e.target.style.borderColor=colors.gray.borderMd}}
          />
        </div>

        <div>
          <label style={labelStyle}>Método de pagamento</label>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:7}}>
            {METHODS.map(m=>{
              const isSel=method===m.id
              return (
                <button key={m.id} onClick={()=>setMethod(m.id)} style={{padding:'11px 8px 9px',borderRadius:11,border:isSel?'2px solid #0f172a':'1.5px solid rgba(0,0,0,0.10)',background:isSel?'#0f172a':'#fff',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:5,position:'relative',transition:`all ${transitions.spring}`}}>
                  {isSel&&<div style={{position:'absolute',top:4,right:4,width:15,height:15,borderRadius:'50%',background:colors.red.DEFAULT,display:'flex',alignItems:'center',justifyContent:'center'}}><Check size={9} color="#fff" strokeWidth={3}/></div>}
                  <m.icon size={18} strokeWidth={1.8} color={isSel?'#fff':'#374151'}/>
                  <span style={{fontSize:10,fontWeight:700,color:isSel?'rgba(255,255,255,0.9)':'#374151',textAlign:'center',lineHeight:1.2}}>{m.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {error&&<div style={{padding:'10px 14px',borderRadius:10,background:'rgba(220,38,38,0.06)',border:`1px solid ${colors.red.border}`,color:colors.red.DEFAULT,fontSize:13}}>{error}</div>}
      </div>

      {/* Resumo */}
      <div style={{position:'sticky',top:20,background:'#fff',borderRadius:20,border:`1px solid ${colors.gray.border}`,boxShadow:'0 2px 12px rgba(0,0,0,0.04)',overflow:'hidden'}}>
        <div style={{padding:'18px 20px',background:'linear-gradient(135deg,#1e293b,#0f172a)',borderRadius:'20px 20px 0 0'}}>
          <div style={{fontSize:12,fontWeight:700,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:8}}>Resumo da venda</div>
          <div style={{fontSize:30,fontWeight:800,color:'#fff',fontVariantNumeric:'tabular-nums',letterSpacing:'-0.04em'}}>{fmtBRL(total)}</div>
          {disc>0&&<div style={{fontSize:12,color:'rgba(255,255,255,0.5)',marginTop:4}}>Desconto: {fmtBRL(disc)}</div>}
        </div>
        <div style={{padding:'16px 20px',display:'flex',flexDirection:'column',gap:10}}>
          {clientName&&<div style={{display:'flex',alignItems:'center',gap:8}}><User size={13} color={colors.gray.dimText}/><span style={{fontSize:13,color:'#0f0f14',fontWeight:600}}>{clientName}</span></div>}
          {svc&&<div style={{display:'flex',alignItems:'center',gap:8}}><div style={{width:4,height:20,borderRadius:2,background:svc.color??colors.red.DEFAULT,flexShrink:0}}/><span style={{fontSize:13,color:'#0f0f14'}}>{svc.name}</span></div>}
          {method&&<div style={{display:'flex',alignItems:'center',gap:8}}><Receipt size={13} color={colors.gray.dimText}/><span style={{fontSize:13,color:'#0f0f14'}}>{METHOD_LABELS[method]}</span></div>}
        </div>
        <div style={{padding:'0 20px 20px'}}>
          <button onClick={handleSell} disabled={!clientName.trim()||!serviceId||!method||paying} style={{width:'100%',padding:'15px',borderRadius:13,border:'none',background:!clientName.trim()||!serviceId||!method||paying?'rgba(0,0,0,0.07)':'linear-gradient(135deg,#1e293b,#0f172a)',color:!clientName.trim()||!serviceId||!method||paying?colors.gray.dimText:'#fff',fontSize:14,fontWeight:800,cursor:!clientName.trim()||!serviceId||!method||paying?'not-allowed':'pointer',letterSpacing:'.06em',textTransform:'uppercase' as const,display:'flex',alignItems:'center',justifyContent:'center',gap:7,boxShadow:!clientName.trim()||!serviceId||!method||paying?'none':'0 6px 20px rgba(15,23,42,0.28)',fontFamily:typography.fontFamily,transition:`all ${transitions.spring}`}}>
            {paying?<><Loader2 size={15} style={{animation:'spin 0.8s linear infinite'}}/>Processando...</>:'CONFIRMAR VENDA'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Aba: Transações ──────────────────────────────────────────────────────────
function TabTransacoes({ refreshKey }: { refreshKey: number }) {
  const [days,    setDays]    = useState<DayGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [mode,    setMode]    = useState<'dias'|'meses'>('dias')
  const [expanded,setExpanded]= useState<string|null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const params = mode==='meses'
        ? { month: dayjs().format('YYYY-MM'), search: search||undefined }
        : { date: dayjs().format('YYYY-MM-DD'), search: search||undefined }
      const res  = await api.get('/payments/transactions', { params })
      setDays(res.data?.data?.days ?? [])
    } catch { setDays([]) }
    finally { setLoading(false) }
  }, [mode, search, refreshKey])

  useEffect(() => { const t=setTimeout(fetch,300); return()=>clearTimeout(t) }, [fetch])

  const totalGeral = days.reduce((s,d)=>s+d.total,0)

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      {/* Controles */}
      <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
        <div style={{display:'flex',borderRadius:12,overflow:'hidden',border:`1.5px solid ${colors.gray.borderMd}`,background:'#fff'}}>
          {(['dias','meses'] as const).map(m=>(
            <button key={m} onClick={()=>setMode(m)} style={{padding:'9px 18px',border:'none',background:mode===m?'#0f172a':'transparent',color:mode===m?'#fff':colors.gray.dimText,fontSize:13,fontWeight:700,cursor:'pointer',transition:`all ${transitions.fast}`,letterSpacing:'.02em'}}>
              {m==='dias'?'Dias':'Meses'}
            </button>
          ))}
        </div>
        <div style={{flex:1,minWidth:180,position:'relative'}}>
          <Search size={13} color={colors.gray.dimText} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por cliente..."
            style={{width:'100%',padding:'9px 14px 9px 34px',borderRadius:12,border:`1.5px solid ${colors.gray.borderMd}`,background:'#fff',fontSize:13,outline:'none',boxSizing:'border-box',fontFamily:typography.fontFamily,color:'#0f0f14'}}/>
          {search&&<button onClick={()=>setSearch('')} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',display:'flex'}}><X size={13} color={colors.gray.dimText}/></button>}
        </div>
        {totalGeral>0&&<div style={{padding:'9px 16px',borderRadius:12,background:colors.red.subtle,border:`1px solid ${colors.red.border}`,fontSize:13,fontWeight:800,color:colors.red.DEFAULT,fontVariantNumeric:'tabular-nums'}}>{fmtBRL(totalGeral)}</div>}
      </div>

      {loading ? (
        <div style={{display:'flex',justifyContent:'center',padding:60}}>
          <Loader2 size={28} color={colors.red.DEFAULT} style={{animation:'spin 0.8s linear infinite'}}/>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : days.length===0 ? (
        <div style={{textAlign:'center',padding:'60px 32px',background:'#fff',borderRadius:20,border:`1px solid ${colors.gray.border}`}}>
          <div style={{fontSize:44,marginBottom:14}}>📊</div>
          <div style={{fontSize:16,fontWeight:700,color:'#0f0f14',marginBottom:6}}>Nenhuma transação</div>
          <div style={{fontSize:14,color:colors.gray.dimText}}>Sem pagamentos registrados no período selecionado.</div>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {days.map(day=>{
            const isExp = expanded===day.date
            const label = dayjs(day.date).format('DD [de] MMM[,] YYYY')
            return (
              <div key={day.date} style={{background:'#fff',borderRadius:18,border:`1px solid ${colors.gray.border}`,boxShadow:'0 2px 12px rgba(0,0,0,0.04)',overflow:'hidden'}}>
                {/* Header do dia */}
                <button onClick={()=>setExpanded(isExp?null:day.date)} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',border:'none',background:'transparent',cursor:'pointer',textAlign:'left',fontFamily:typography.fontFamily}}>
                  <div>
                    <div style={{fontSize:15,fontWeight:800,color:'#0f0f14',letterSpacing:'-0.01em'}}>{label}</div>
                    <div style={{display:'flex',gap:8,marginTop:6,flexWrap:'wrap'}}>
                      {Object.entries(day.byMethod).map(([m,v])=>(
                        <span key={m} style={{fontSize:12,color:colors.gray.dimText,fontVariantNumeric:'tabular-nums'}}>{METHOD_LABELS[m]??m}: <strong style={{color:'#0f0f14'}}>{fmtBRL(v)}</strong></span>
                      ))}
                    </div>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0}}>
                    <div style={{fontSize:18,fontWeight:800,color:'#0f0f14',fontVariantNumeric:'tabular-nums'}}>{fmtBRL(day.total)}</div>
                    <div style={{fontSize:11,color:colors.gray.dimText,marginTop:2}}>{day.payments.length} transação{day.payments.length!==1?'es':''}</div>
                  </div>
                </button>
                {/* Transações do dia */}
                {isExp && (
                  <div style={{borderTop:`1px solid ${colors.gray.border}`}}>
                    {day.payments.map(p=>(
                      <div key={p.id} style={{display:'flex',alignItems:'center',gap:12,padding:'13px 20px',borderBottom:`1px solid ${colors.gray.border}`}}>
                        <div style={{width:36,height:36,borderRadius:10,background:'rgba(15,23,42,0.06)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                          <Receipt size={16} color='#475569' strokeWidth={2}/>
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:14,fontWeight:600,color:'#0f0f14',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.booking?.clientName ?? p.client?.name ?? '—'}</div>
                          <div style={{fontSize:12,color:colors.gray.dimText,marginTop:1}}>
                            {dayjs(p.createdAt).tz('America/Sao_Paulo').format('HH:mm')} · {METHOD_LABELS[p.method]??p.method}
                            {p.booking?.service?.name && ` · ${p.booking.service.name}`}
                          </div>
                        </div>
                        <div style={{flexShrink:0,textAlign:'right'}}>
                          <div style={{fontSize:15,fontWeight:800,color:'#0f0f14',fontVariantNumeric:'tabular-nums'}}>{fmtBRL(p.amount)}</div>
                          <div style={{display:'inline-flex',alignItems:'center',gap:4,padding:'2px 8px',borderRadius:20,background:'rgba(22,163,74,0.08)',border:'1px solid rgba(22,163,74,0.18)',marginTop:3}}>
                            <div style={{width:5,height:5,borderRadius:'50%',background:'#16a34a'}}/>
                            <span style={{fontSize:10,fontWeight:700,color:'#15803d'}}>PAGO</span>
                          </div>
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
    </div>
  )
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function CaixaPage() {
  const [tab,        setTab]        = useState<Tab>('cobrar')
  const [refreshKey, setRefreshKey] = useState(0)

  const TABS: {id:Tab; label:string; icon:React.ComponentType<{size?:number;strokeWidth?:number;color?:string}>}[] = [
    { id:'cobrar',     label:'Para Cobrar',   icon:Clock       },
    { id:'venda',      label:'Nova Venda',    icon:ShoppingBag },
    { id:'transacoes', label:'Transações',    icon:TrendingUp  },
  ]

  return (
    <>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @media(max-width:768px){
          .caixa-venda-grid{grid-template-columns:1fr!important}
        }
      `}</style>

      <div style={{maxWidth:960,margin:'0 auto',fontFamily:typography.fontFamily,animation:'fadeUp 0.3s ease'}}>
        {/* Header */}
        <div style={{marginBottom:24}}>
          <h2 style={{margin:'0 0 4px',fontSize:22,fontWeight:800,letterSpacing:'-0.03em',color:'#0f0f14'}}>Caixa</h2>
          <p style={{margin:0,fontSize:14,color:colors.gray.dimText}}>
            {dayjs().tz('America/Sao_Paulo').format('dddd, DD [de] MMMM [de] YYYY').replace(/^\w/,c=>c.toUpperCase())}
          </p>
        </div>

        {/* Tabs */}
        <div style={{display:'flex',gap:4,marginBottom:24,background:'rgba(0,0,0,0.05)',borderRadius:14,padding:4}}>
          {TABS.map(t=>{
            const isActive=tab===t.id
            return (
              <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:7,padding:'11px 16px',borderRadius:11,border:'none',background:isActive?'#fff':'transparent',cursor:'pointer',fontSize:13,fontWeight:700,color:isActive?'#0f0f14':colors.gray.dimText,boxShadow:isActive?'0 2px 12px rgba(0,0,0,0.08)':'none',transition:`all ${transitions.spring}`,fontFamily:typography.fontFamily,letterSpacing:'.01em'}}>
                <t.icon size={15} strokeWidth={2} color={isActive?colors.red.DEFAULT:colors.gray.dimText}/>
                {t.label}
              </button>
            )
          })}
        </div>

        {/* Conteúdo */}
        {tab==='cobrar'     && <TabCobrar    onRefreshTransactions={()=>setRefreshKey(k=>k+1)}/>}
        {tab==='venda'      && <TabVenda     onRefreshTransactions={()=>setRefreshKey(k=>k+1)}/>}
        {tab==='transacoes' && <TabTransacoes refreshKey={refreshKey}/>}
      </div>
    </>
  )
}
