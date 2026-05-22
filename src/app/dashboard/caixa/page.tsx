'use client'
// src/app/dashboard/caixa/page.tsx

import { useState, useEffect, useCallback } from 'react'
import {
  ShoppingBag, Clock, CheckCircle, Search, X, ChevronRight,
  Banknote, CreditCard, Smartphone, ArrowLeftRight, Split,
  Gift, Package, UserCheck, Check, Loader2, Calendar, User,
  TrendingUp, Receipt,
} from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { colors, typography, radius, transitions } from '@/shared/theme'
import { useIsMobile } from '@/hooks/useIsMobile'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import 'dayjs/locale/pt-br'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale('pt-br')

type Tab = 'cobrar' | 'venda' | 'transacoes'
type PaymentMethod = 'CASH'|'CREDIT_CARD'|'DEBIT_CARD'|'PIX'|'BANK_TRANSFER'|'SPLIT'|'SUBSCRIPTION'|'GIFT_CARD'|'PACKAGE'

interface Booking {
  id:string; startAt:string; endAt:string; clientName:string; clientPhone?:string; status:string
  service:{ id:string; name:string; price:number|null; color:string|null; duration:number }
  professional?:{ id:string; name:string; avatarUrl?:string }
  client?:{ id:string; name:string; phone:string }
}
interface Transaction {
  id:string; amount:number; method:string; status:string; createdAt:string
  booking?:{ clientName:string; startAt:string; service?:{ name:string; color?:string|null }; professional?:{ name:string } }
  client?:{ id:string; name:string }
}
interface DayGroup { date:string; total:number; byMethod:Record<string,number>; payments:Transaction[] }
interface Service { id:string; name:string; price:number|null; duration:number; color:string|null }
interface Professional { id:string; name:string }

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
const METHOD_LABELS: Record<string,string> = {
  CASH:'Dinheiro', CREDIT_CARD:'Cartão de Crédito', DEBIT_CARD:'Débito',
  PIX:'Pix', BANK_TRANSFER:'Transferência bancária', SPLIT:'Dividir pagamento',
  SUBSCRIPTION:'Assinatura', GIFT_CARD:'Cartão Presente', PACKAGE:'Pacote',
}

function getInitials(n:string){ return n.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase() }
function fmtBRL(v:number){ return `R$ ${v.toFixed(2).replace('.',',')}` }

function Avatar({ name, size=40, color, url }: { name:string; size?:number; color?:string; url?:string }) {
  const isColorGrad = url?.startsWith('color:')
  const bg = isColorGrad ? url!.replace('color:','') : color ?? colors.red.gradient
  return (
    <div style={{width:size,height:size,borderRadius:'50%',background:url&&!isColorGrad?'transparent':bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*0.34,fontWeight:800,color:'#fff',flexShrink:0,overflow:'hidden',boxShadow:'0 2px 8px rgba(0,0,0,0.12)'}}>
      {url&&!isColorGrad
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={url} alt={name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
        : getInitials(name)
      }
    </div>
  )
}

// ─── Checkout Modal ───────────────────────────────────────────────────────────
// Mobile: bottom sheet respeitando navbar(104px) e bottom-nav(64px)
// Desktop: modal centralizado
function CheckoutModal({ booking, onClose, onDone }: { booking:Booking; onClose:()=>void; onDone:()=>void }) {
  const isMobile = useIsMobile()
  const [method,  setMethod]  = useState<PaymentMethod|null>(null)
  const [discount,setDiscount]= useState('')
  const [paying,  setPaying]  = useState(false)
  const [success, setSuccess] = useState(false)
  const [error,   setError]   = useState<string|null>(null)

  const base  = booking.service.price ?? 0
  const disc  = Math.min(parseFloat(discount.replace(',','.')) || 0, base)
  const total = Math.max(0, base - disc)
  const time  = dayjs(booking.startAt).tz('America/Sao_Paulo').format('HH:mm')

  async function handlePay() {
    if (!method) return
    try {
      setPaying(true); setError(null)
      await api.post('/payments/checkout', { bookingId:booking.id, method, amount:total, discount:disc })
      setSuccess(true)
      setTimeout(()=>{ onDone(); onClose() }, 1500)
    } catch(e:unknown) {
      setError((e as {response?:{data?:{error?:string}}})?.response?.data?.error ?? 'Erro ao processar')
    } finally { setPaying(false) }
  }

  const modalStyle: React.CSSProperties = isMobile ? {
    position:'fixed',
    left:0, right:0,
    bottom:'calc(64px + env(safe-area-inset-bottom, 0px))',
    maxHeight:'calc(100dvh - 104px - 64px - env(safe-area-inset-bottom, 0px))',
    background:'#f8f8fa',
    borderRadius:'24px 24px 0 0',
    boxShadow:'0 -12px 40px rgba(0,0,0,0.20)',
    zIndex:9999,
    overflow:'hidden',
    display:'flex',
    flexDirection:'column',
    fontFamily:typography.fontFamily,
    animation:'sheetUp 0.30s cubic-bezier(0.32,0.72,0,1)',
  } : {
    position:'fixed',
    top:'50%', left:'50%',
    transform:'translate(-50%,-50%)',
    width:480, maxWidth:'94vw', maxHeight:'90vh',
    background:'#f8f8fa',
    borderRadius:24,
    boxShadow:'0 40px 80px rgba(0,0,0,0.20)',
    zIndex:9999,
    overflow:'hidden',
    display:'flex',
    flexDirection:'column',
    fontFamily:typography.fontFamily,
  }

  return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes popIn{from{transform:scale(0.6);opacity:0}to{transform:scale(1);opacity:1}} @keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
      <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.35)',backdropFilter:'blur(10px)',zIndex:9998}}/>
      <div style={modalStyle}>
        {isMobile && <div style={{display:'flex',justifyContent:'center',paddingTop:10,flexShrink:0}}><div style={{width:36,height:4,borderRadius:2,background:'rgba(0,0,0,0.14)'}}/></div>}

        {/* Header escuro */}
        <div style={{background:'linear-gradient(135deg,#1e293b,#0f172a)',padding:'16px 20px 18px',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
            <span style={{fontSize:12,fontWeight:700,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'.08em'}}>Checkout</span>
            <button onClick={onClose} style={{width:28,height:28,borderRadius:'50%',border:'1px solid rgba(255,255,255,0.2)',background:'rgba(255,255,255,0.1)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <X size={13} color="#fff" strokeWidth={2.5}/>
            </button>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <Avatar name={booking.clientName} size={44}/>
            <div>
              <div style={{fontSize:17,fontWeight:800,color:'#fff',letterSpacing:'-0.02em'}}>{booking.clientName}</div>
              <div style={{fontSize:13,color:'rgba(255,255,255,0.55)',marginTop:2}}>{time} · {booking.service.name} · {fmtBRL(booking.service.price??0)}</div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{flex:1,overflowY:'auto',padding:'16px 20px',display:'flex',flexDirection:'column',gap:14}}>
          {success ? (
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'28px 0',gap:12}}>
              <div style={{width:60,height:60,borderRadius:'50%',background:'linear-gradient(135deg,#22c55e,#16a34a)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 10px 28px rgba(22,163,74,0.35)',animation:'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)'}}>
                <Check size={30} color="#fff" strokeWidth={3}/>
              </div>
              <div style={{fontSize:18,fontWeight:800,color:'#0f0f14'}}>Pago! {fmtBRL(total)}</div>
            </div>
          ) : (
            <>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:colors.gray.dimText,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:10}}>Método de pagamento</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:7}}>
                  {METHODS.map(m=>{
                    const isSel=method===m.id
                    return (
                      <button key={m.id} onClick={()=>setMethod(m.id)} style={{padding:'12px 6px 10px',borderRadius:12,border:isSel?'2px solid #0f172a':'1.5px solid rgba(0,0,0,0.10)',background:isSel?'#0f172a':'#fff',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:5,transition:`all ${transitions.spring}`,boxShadow:isSel?'0 4px 16px rgba(15,23,42,0.22)':'0 1px 4px rgba(0,0,0,0.05)',position:'relative'}}>
                        {isSel&&<div style={{position:'absolute',top:5,right:5,width:16,height:16,borderRadius:'50%',background:colors.red.DEFAULT,display:'flex',alignItems:'center',justifyContent:'center'}}><Check size={10} color="#fff" strokeWidth={3}/></div>}
                        <m.icon size={20} strokeWidth={1.8} color={isSel?'#fff':'#374151'}/>
                        <span style={{fontSize:10,fontWeight:700,color:isSel?'rgba(255,255,255,0.9)':'#374151',textAlign:'center',lineHeight:1.2}}>{m.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:colors.gray.dimText,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:6}}>Total</div>
                  <div style={{padding:'11px 13px',borderRadius:11,background:'rgba(0,0,0,0.04)',fontSize:17,fontWeight:800,color:'#0f0f14',fontVariantNumeric:'tabular-nums'}}>{fmtBRL(total)}</div>
                </div>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:colors.gray.dimText,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:6}}>Desconto</div>
                  <input value={discount} onChange={e=>setDiscount(e.target.value)} placeholder="0,00"
                    style={{width:'100%',padding:'11px 13px',borderRadius:11,border:`1.5px solid ${colors.gray.borderMd}`,background:'#fff',fontSize:14,outline:'none',boxSizing:'border-box',fontFamily:typography.fontFamily,color:'#0f0f14'}}/>
                </div>
              </div>
              {error&&<div style={{padding:'9px 13px',borderRadius:10,background:'rgba(220,38,38,0.06)',border:`1px solid ${colors.red.border}`,color:colors.red.DEFAULT,fontSize:13}}>{error}</div>}
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div style={{padding:'12px 20px 16px',borderTop:'1px solid rgba(0,0,0,0.07)',background:'#fff',display:'flex',gap:10,flexShrink:0}}>
            <button onClick={onClose} style={{flex:1,padding:'13px',borderRadius:12,border:'1.5px solid rgba(0,0,0,0.10)',background:'transparent',fontSize:13,fontWeight:700,cursor:'pointer',color:'#374151',fontFamily:typography.fontFamily}}>CANCELAR</button>
            <button onClick={handlePay} disabled={!method||paying} style={{flex:2,padding:'13px',borderRadius:12,border:'none',background:!method||paying?'rgba(0,0,0,0.07)':'linear-gradient(135deg,#1e293b,#0f172a)',color:!method||paying?colors.gray.dimText:'#fff',fontSize:13,fontWeight:800,cursor:!method||paying?'not-allowed':'pointer',letterSpacing:'.06em',textTransform:'uppercase' as const,boxShadow:!method||paying?'none':'0 6px 20px rgba(15,23,42,0.28)',fontFamily:typography.fontFamily,display:'flex',alignItems:'center',justifyContent:'center',gap:7,transition:`all ${transitions.spring}`}}>
              {paying?<><Loader2 size={15} style={{animation:'spin 0.8s linear infinite'}}/>Processando...</>:`CONFIRMAR · ${fmtBRL(total)}`}
            </button>
          </div>
        )}
      </div>
    </>
  )
}

// ─── Tab Para Cobrar ──────────────────────────────────────────────────────────
function TabCobrar({ onRefreshTransactions }: { onRefreshTransactions:()=>void }) {
  const [bookings,setBookings]= useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [selected,setSelected]= useState<Booking|null>(null)
  const [date,    setDate]    = useState(dayjs().format('YYYY-MM-DD'))

  const load = useCallback(async()=>{
    setLoading(true)
    try { const r=await api.get('/payments/to-charge',{params:{date}}); setBookings(r.data?.data??[]) }
    catch { setBookings([]) } finally { setLoading(false) }
  },[date])

  useEffect(()=>{load()},[load])
  const totalDay=bookings.reduce((s,b)=>s+(b.service.price??0),0)

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Filtro data + resumo */}
      <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
        <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 13px',borderRadius:12,background:'#fff',border:`1.5px solid ${colors.gray.borderMd}`,boxShadow:'0 2px 8px rgba(0,0,0,0.05)'}}>
          <Calendar size={14} color={colors.red.DEFAULT} strokeWidth={2}/>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)}
            style={{border:'none',outline:'none',fontSize:13,fontWeight:600,color:'#0f0f14',fontFamily:typography.fontFamily,background:'transparent',cursor:'pointer'}}/>
        </div>
        {!loading&&<>
          <div style={{padding:'8px 14px',borderRadius:12,background:'rgba(22,163,74,0.08)',border:'1px solid rgba(22,163,74,0.18)',fontSize:13,fontWeight:700,color:'#15803d'}}>{bookings.length} para cobrar</div>
          {totalDay>0&&<div style={{padding:'8px 14px',borderRadius:12,background:colors.red.subtle,border:`1px solid ${colors.red.border}`,fontSize:13,fontWeight:700,color:colors.red.DEFAULT}}>{fmtBRL(totalDay)}</div>}
        </>}
      </div>

      {loading ? (
        <div style={{display:'flex',justifyContent:'center',padding:60}}><Loader2 size={28} color={colors.red.DEFAULT} style={{animation:'spin 0.8s linear infinite'}}/></div>
      ) : bookings.length===0 ? (
        <div style={{textAlign:'center',padding:'48px 24px',background:'#fff',borderRadius:18,border:`1px solid ${colors.gray.border}`}}>
          <div style={{fontSize:40,marginBottom:12}}>✅</div>
          <div style={{fontSize:16,fontWeight:700,color:'#0f0f14',marginBottom:4}}>Tudo cobrado!</div>
          <div style={{fontSize:13,color:colors.gray.dimText}}>Nenhum agendamento pendente nesta data.</div>
        </div>
      ) : bookings.map(b=>{
        const t=dayjs(b.startAt).tz('America/Sao_Paulo').format('HH:mm')
        return (
          <div key={b.id} onClick={()=>setSelected(b)} style={{background:'#fff',borderRadius:16,padding:'14px 16px',border:`1px solid ${colors.gray.border}`,boxShadow:'0 2px 10px rgba(0,0,0,0.04)',display:'flex',alignItems:'center',gap:12,cursor:'pointer',transition:`all ${transitions.spring}`}}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 6px 22px rgba(0,0,0,0.10)'}}
            onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 2px 10px rgba(0,0,0,0.04)'}}
          >
            <Avatar name={b.clientName} size={44} url={b.professional?.avatarUrl}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:700,color:'#0f0f14',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{b.clientName}</div>
              <div style={{display:'flex',alignItems:'center',gap:6,marginTop:3,flexWrap:'wrap'}}>
                <div style={{display:'flex',alignItems:'center',gap:3}}><Clock size={11} color={colors.gray.dimText}/><span style={{fontSize:12,color:colors.gray.dimText,fontVariantNumeric:'tabular-nums',fontWeight:600}}>{t}</span></div>
                <span style={{color:colors.gray.dimText,fontSize:11}}>·</span>
                {b.service.color&&<div style={{width:7,height:7,borderRadius:'50%',background:b.service.color}}/>}
                <span style={{fontSize:12,color:colors.gray.dimText,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:140}}>{b.service.name}</span>
                {b.professional&&<><span style={{color:colors.gray.dimText,fontSize:11}}>·</span><span style={{fontSize:11,color:colors.gray.dimText}}>{b.professional.name}</span></>}
              </div>
            </div>
            <div style={{textAlign:'right',flexShrink:0}}>
              <div style={{fontSize:16,fontWeight:800,color:'#0f0f14',fontVariantNumeric:'tabular-nums'}}>{fmtBRL(b.service.price??0)}</div>
              <div style={{display:'inline-flex',alignItems:'center',gap:4,padding:'2px 8px',borderRadius:20,background:'rgba(22,163,74,0.08)',border:'1px solid rgba(22,163,74,0.15)',marginTop:4}}>
                <CheckCircle size={10} color='#16a34a' strokeWidth={2.5}/>
                <span style={{fontSize:10,fontWeight:700,color:'#15803d'}}>CONFIRMADO</span>
              </div>
            </div>
            <ChevronRight size={15} color={colors.gray.dimText}/>
          </div>
        )
      })}

      {selected&&<CheckoutModal booking={selected} onClose={()=>setSelected(null)} onDone={()=>{load();onRefreshTransactions()}}/>}
    </div>
  )
}

// ─── Tab Venda Rápida ─────────────────────────────────────────────────────────
// Mobile: coluna única. Desktop: 2 colunas com resumo lateral.
function TabVenda({ onRefreshTransactions }: { onRefreshTransactions:()=>void }) {
  const isMobile = useIsMobile()
  const [services,     setServices]     = useState<Service[]>([])
  const [professionals,setProfessionals]= useState<Professional[]>([])
  const [clientName,   setClientName]   = useState('')
  const [serviceId,    setServiceId]    = useState('')
  const [profId,       setProfId]       = useState('')
  const [method,       setMethod]       = useState<PaymentMethod|null>(null)
  const [discount,     setDiscount]     = useState('')
  const [paying,       setPaying]       = useState(false)
  const [success,      setSuccess]      = useState(false)
  const [error,        setError]        = useState<string|null>(null)
  const [svcSearch,    setSvcSearch]    = useState('')

  useEffect(()=>{
    let c=false
    api.get('/services').then(r=>{if(!c)setServices(r.data?.data??r.data?.services??[])}).catch(()=>{})
    api.get('/equipe').then(r=>{if(!c){const d=r.data?.data??[];setProfessionals(Array.isArray(d)?d:[])}}).catch(()=>{})
    return()=>{c=true}
  },[])

  const svc     =services.find(s=>s.id===serviceId)
  const base    =svc?.price??0
  const disc    =Math.min(parseFloat(discount.replace(',','.'))||0,base)
  const total   =Math.max(0,base-disc)
  const filtered=services.filter(s=>s.name.toLowerCase().includes(svcSearch.toLowerCase()))

  async function handleSell(){
    if(!clientName.trim()||!serviceId||!method)return
    try{
      setPaying(true);setError(null)
      await api.post('/payments/quick-sale',{clientName:clientName.trim(),serviceId,professionalId:profId||undefined,method,amount:total,discount:disc})
      setSuccess(true);onRefreshTransactions()
      setTimeout(()=>{setSuccess(false);setClientName('');setServiceId('');setProfId('');setMethod(null);setDiscount('')},2500)
    }catch(e:unknown){setError((e as {response?:{data?:{error?:string}}})?.response?.data?.error??'Erro ao processar venda')}
    finally{setPaying(false)}
  }

  const inp: React.CSSProperties={width:'100%',padding:'12px 14px',borderRadius:12,border:`1.5px solid ${colors.gray.borderMd}`,background:'#fff',fontSize:14,outline:'none',boxSizing:'border-box',fontFamily:typography.fontFamily,color:'#0f0f14',transition:`border-color ${transitions.fast}`}
  const lbl: React.CSSProperties={display:'block',fontSize:11,fontWeight:700,color:colors.gray.dimText,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:7}

  if(success)return(
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'60px 24px',gap:14,background:'#fff',borderRadius:18,border:`1px solid ${colors.gray.border}`}}>
      <style>{`@keyframes popIn{from{transform:scale(0.6);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
      <div style={{width:64,height:64,borderRadius:'50%',background:'linear-gradient(135deg,#22c55e,#16a34a)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 10px 28px rgba(22,163,74,0.35)',animation:'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)'}}>
        <Check size={32} color="#fff" strokeWidth={3}/>
      </div>
      <div style={{fontSize:19,fontWeight:800,color:'#0f0f14'}}>Venda concluída!</div>
      <div style={{fontSize:14,color:colors.gray.dimText}}>{fmtBRL(total)} registrado</div>
    </div>
  )

  const formContent=(
    <div style={{background:'#fff',borderRadius:18,padding:20,border:`1px solid ${colors.gray.border}`,boxShadow:'0 2px 12px rgba(0,0,0,0.04)',display:'flex',flexDirection:'column',gap:14}}>
      <h3 style={{margin:0,fontSize:15,fontWeight:800,color:'#0f0f14'}}>Nova venda rápida</h3>
      <div><label style={lbl}>Cliente</label>
        <input value={clientName} onChange={e=>setClientName(e.target.value)} placeholder="Nome do cliente" style={inp}
          onFocus={e=>{e.target.style.borderColor=colors.red.DEFAULT}} onBlur={e=>{e.target.style.borderColor=colors.gray.borderMd}}/>
      </div>
      <div>
        <label style={lbl}>Serviço</label>
        <div style={{position:'relative',marginBottom:8}}>
          <Search size={13} color={colors.gray.dimText} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
          <input value={svcSearch} onChange={e=>setSvcSearch(e.target.value)} placeholder="Buscar serviço..." style={{...inp,paddingLeft:36}}
            onFocus={e=>{e.target.style.borderColor=colors.red.DEFAULT}} onBlur={e=>{e.target.style.borderColor=colors.gray.borderMd}}/>
        </div>
        <div style={{maxHeight:160,overflowY:'auto',border:`1.5px solid ${colors.gray.borderMd}`,borderRadius:12,overflow:'hidden'}}>
          {filtered.map(s=>{const isSel=serviceId===s.id;return(
            <button key={s.id} onClick={()=>setServiceId(s.id)} style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'10px 13px',border:'none',borderBottom:`1px solid ${colors.gray.border}`,background:isSel?'#0f172a':'transparent',cursor:'pointer',textAlign:'left',transition:`background ${transitions.fast}`}}>
              <div style={{width:4,height:26,borderRadius:2,background:s.color??colors.red.DEFAULT,flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,color:isSel?'#fff':'#0f0f14',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.name}</div>
                <div style={{fontSize:11,color:isSel?'rgba(255,255,255,0.55)':colors.gray.dimText}}>{s.duration}min{s.price?` · ${fmtBRL(s.price)}`:''}</div>
              </div>
              {isSel&&<Check size={13} color="#fff" strokeWidth={3}/>}
            </button>
          )})}
        </div>
      </div>
      {professionals.length>1&&<div><label style={lbl}>Profissional</label>
        <select value={profId} onChange={e=>setProfId(e.target.value)} style={{...inp,appearance:'none',cursor:'pointer'}}>
          <option value="">Qualquer profissional</option>
          {professionals.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>}
      <div><label style={lbl}>Desconto (R$)</label>
        <input value={discount} onChange={e=>setDiscount(e.target.value)} placeholder="0,00" style={inp}
          onFocus={e=>{e.target.style.borderColor=colors.red.DEFAULT}} onBlur={e=>{e.target.style.borderColor=colors.gray.borderMd}}/>
      </div>
      <div>
        <label style={lbl}>Método de pagamento</label>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:7}}>
          {METHODS.map(m=>{const isSel=method===m.id;return(
            <button key={m.id} onClick={()=>setMethod(m.id)} style={{padding:'11px 6px 9px',borderRadius:11,border:isSel?'2px solid #0f172a':'1.5px solid rgba(0,0,0,0.10)',background:isSel?'#0f172a':'#fff',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:4,position:'relative',transition:`all ${transitions.spring}`}}>
              {isSel&&<div style={{position:'absolute',top:4,right:4,width:15,height:15,borderRadius:'50%',background:colors.red.DEFAULT,display:'flex',alignItems:'center',justifyContent:'center'}}><Check size={9} color="#fff" strokeWidth={3}/></div>}
              <m.icon size={18} strokeWidth={1.8} color={isSel?'#fff':'#374151'}/>
              <span style={{fontSize:10,fontWeight:700,color:isSel?'rgba(255,255,255,0.9)':'#374151',textAlign:'center',lineHeight:1.2}}>{m.label}</span>
            </button>
          )})}
        </div>
      </div>
      {error&&<div style={{padding:'9px 13px',borderRadius:10,background:'rgba(220,38,38,0.06)',border:`1px solid ${colors.red.border}`,color:colors.red.DEFAULT,fontSize:13}}>{error}</div>}
    </div>
  )

  const summaryContent=(
    <div style={{background:'#fff',borderRadius:18,border:`1px solid ${colors.gray.border}`,boxShadow:'0 2px 12px rgba(0,0,0,0.04)',overflow:'hidden',position:isMobile?'static':'sticky',top:20}}>
      <div style={{padding:'16px 18px',background:'linear-gradient(135deg,#1e293b,#0f172a)',borderRadius:isMobile?'0':'18px 18px 0 0'}}>
        <div style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.45)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:6}}>Resumo</div>
        <div style={{fontSize:26,fontWeight:800,color:'#fff',fontVariantNumeric:'tabular-nums',letterSpacing:'-0.04em'}}>{fmtBRL(total)}</div>
        {disc>0&&<div style={{fontSize:12,color:'rgba(255,255,255,0.45)',marginTop:3}}>Desconto: {fmtBRL(disc)}</div>}
      </div>
      <div style={{padding:'14px 18px',display:'flex',flexDirection:'column',gap:8}}>
        {clientName&&<div style={{display:'flex',alignItems:'center',gap:7}}><User size={12} color={colors.gray.dimText}/><span style={{fontSize:13,color:'#0f0f14',fontWeight:600}}>{clientName}</span></div>}
        {svc&&<div style={{display:'flex',alignItems:'center',gap:7}}><div style={{width:4,height:18,borderRadius:2,background:svc.color??colors.red.DEFAULT}}/><span style={{fontSize:13,color:'#0f0f14'}}>{svc.name}</span></div>}
        {method&&<div style={{display:'flex',alignItems:'center',gap:7}}><Receipt size={12} color={colors.gray.dimText}/><span style={{fontSize:13,color:'#0f0f14'}}>{METHOD_LABELS[method]}</span></div>}
      </div>
      <div style={{padding:'0 18px 18px'}}>
        <button onClick={handleSell} disabled={!clientName.trim()||!serviceId||!method||paying}
          style={{width:'100%',padding:'14px',borderRadius:12,border:'none',background:!clientName.trim()||!serviceId||!method||paying?'rgba(0,0,0,0.07)':'linear-gradient(135deg,#1e293b,#0f172a)',color:!clientName.trim()||!serviceId||!method||paying?colors.gray.dimText:'#fff',fontSize:14,fontWeight:800,cursor:!clientName.trim()||!serviceId||!method||paying?'not-allowed':'pointer',letterSpacing:'.06em',textTransform:'uppercase' as const,display:'flex',alignItems:'center',justifyContent:'center',gap:7,boxShadow:!clientName.trim()||!serviceId||!method||paying?'none':'0 6px 20px rgba(15,23,42,0.28)',fontFamily:typography.fontFamily,transition:`all ${transitions.spring}`}}>
          {paying?<><Loader2 size={15} style={{animation:'spin 0.8s linear infinite'}}/>Processando...</>:'CONFIRMAR VENDA'}
        </button>
      </div>
    </div>
  )

  return isMobile ? (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      {formContent}
      {summaryContent}
    </div>
  ) : (
    <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:18,alignItems:'start'}}>
      {formContent}
      {summaryContent}
    </div>
  )
}

// ─── Tab Transações ───────────────────────────────────────────────────────────
function TabTransacoes({ refreshKey }: { refreshKey:number }) {
  const [days,    setDays]    = useState<DayGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [mode,    setMode]    = useState<'dias'|'meses'>('dias')
  const [expanded,setExpanded]= useState<string|null>(null)

  const load=useCallback(async()=>{
    setLoading(true)
    try{
      const params=mode==='meses'?{month:dayjs().format('YYYY-MM'),search:search||undefined}:{date:dayjs().format('YYYY-MM-DD'),search:search||undefined}
      const r=await api.get('/payments/transactions',{params})
      setDays(r.data?.data?.days??[])
    }catch{setDays([])}finally{setLoading(false)}
  },[mode,search,refreshKey])

  useEffect(()=>{const t=setTimeout(load,300);return()=>clearTimeout(t)},[load])

  const totalGeral=days.reduce((s,d)=>s+d.total,0)

  return(
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
        <div style={{display:'flex',borderRadius:12,overflow:'hidden',border:`1.5px solid ${colors.gray.borderMd}`,background:'#fff'}}>
          {(['dias','meses'] as const).map(m=>(
            <button key={m} onClick={()=>setMode(m)} style={{padding:'9px 16px',border:'none',background:mode===m?'#0f172a':'transparent',color:mode===m?'#fff':colors.gray.dimText,fontSize:13,fontWeight:700,cursor:'pointer',transition:`all ${transitions.fast}`}}>
              {m==='dias'?'Dias':'Meses'}
            </button>
          ))}
        </div>
        <div style={{flex:1,minWidth:160,position:'relative'}}>
          <Search size={13} color={colors.gray.dimText} style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por cliente..."
            style={{width:'100%',padding:'9px 13px 9px 32px',borderRadius:12,border:`1.5px solid ${colors.gray.borderMd}`,background:'#fff',fontSize:13,outline:'none',boxSizing:'border-box',fontFamily:typography.fontFamily,color:'#0f0f14'}}/>
          {search&&<button onClick={()=>setSearch('')} style={{position:'absolute',right:9,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',display:'flex'}}><X size={12} color={colors.gray.dimText}/></button>}
        </div>
        {totalGeral>0&&<div style={{padding:'9px 14px',borderRadius:12,background:colors.red.subtle,border:`1px solid ${colors.red.border}`,fontSize:13,fontWeight:800,color:colors.red.DEFAULT,fontVariantNumeric:'tabular-nums'}}>{fmtBRL(totalGeral)}</div>}
      </div>

      {loading?<div style={{display:'flex',justifyContent:'center',padding:60}}><Loader2 size={28} color={colors.red.DEFAULT} style={{animation:'spin 0.8s linear infinite'}}/></div>
      :days.length===0?<div style={{textAlign:'center',padding:'48px 24px',background:'#fff',borderRadius:18,border:`1px solid ${colors.gray.border}`}}>
        <div style={{fontSize:40,marginBottom:12}}>📊</div>
        <div style={{fontSize:16,fontWeight:700,color:'#0f0f14',marginBottom:4}}>Nenhuma transação</div>
        <div style={{fontSize:13,color:colors.gray.dimText}}>Sem pagamentos no período selecionado.</div>
      </div>
      :days.map(day=>{
        const isExp=expanded===day.date
        return(
          <div key={day.date} style={{background:'#fff',borderRadius:16,border:`1px solid ${colors.gray.border}`,boxShadow:'0 2px 10px rgba(0,0,0,0.04)',overflow:'hidden'}}>
            <button onClick={()=>setExpanded(isExp?null:day.date)} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 18px',border:'none',background:'transparent',cursor:'pointer',textAlign:'left',fontFamily:typography.fontFamily}}>
              <div>
                <div style={{fontSize:14,fontWeight:800,color:'#0f0f14'}}>{dayjs(day.date).format('DD [de] MMM[,] YYYY')}</div>
                <div style={{display:'flex',gap:8,marginTop:5,flexWrap:'wrap'}}>
                  {Object.entries(day.byMethod).map(([m,v])=>(
                    <span key={m} style={{fontSize:11,color:colors.gray.dimText,fontVariantNumeric:'tabular-nums'}}>{METHOD_LABELS[m]??m}: <strong style={{color:'#0f0f14'}}>{fmtBRL(v)}</strong></span>
                  ))}
                </div>
              </div>
              <div style={{textAlign:'right',flexShrink:0}}>
                <div style={{fontSize:17,fontWeight:800,color:'#0f0f14',fontVariantNumeric:'tabular-nums'}}>{fmtBRL(day.total)}</div>
                <div style={{fontSize:11,color:colors.gray.dimText,marginTop:2}}>{day.payments.length} transação{day.payments.length!==1?'es':''}</div>
              </div>
            </button>
            {isExp&&<div style={{borderTop:`1px solid ${colors.gray.border}`}}>
              {day.payments.map(p=>(
                <div key={p.id} style={{display:'flex',alignItems:'center',gap:11,padding:'12px 18px',borderBottom:`1px solid ${colors.gray.border}`}}>
                  <div style={{width:34,height:34,borderRadius:9,background:'rgba(15,23,42,0.06)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Receipt size={15} color='#475569' strokeWidth={2}/></div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:'#0f0f14',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.booking?.clientName??p.client?.name??'—'}</div>
                    <div style={{fontSize:11,color:colors.gray.dimText,marginTop:1}}>{dayjs(p.createdAt).tz('America/Sao_Paulo').format('HH:mm')} · {METHOD_LABELS[p.method]??p.method}{p.booking?.service?.name&&` · ${p.booking.service.name}`}</div>
                  </div>
                  <div style={{flexShrink:0,textAlign:'right'}}>
                    <div style={{fontSize:14,fontWeight:800,color:'#0f0f14',fontVariantNumeric:'tabular-nums'}}>{fmtBRL(p.amount)}</div>
                    <div style={{display:'inline-flex',alignItems:'center',gap:3,padding:'2px 7px',borderRadius:20,background:'rgba(22,163,74,0.08)',border:'1px solid rgba(22,163,74,0.18)',marginTop:2}}>
                      <div style={{width:4,height:4,borderRadius:'50%',background:'#16a34a'}}/>
                      <span style={{fontSize:9,fontWeight:700,color:'#15803d'}}>PAGO</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>}
          </div>
        )
      })}
    </div>
  )
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function CaixaPage() {
  const [tab,       setTab]       = useState<Tab>('cobrar')
  const [refreshKey,setRefreshKey]= useState(0)

  const TABS: {id:Tab; label:string; icon:React.ComponentType<{size?:number;strokeWidth?:number;color?:string}>}[] = [
    {id:'cobrar',     label:'Para Cobrar',  icon:Clock      },
    {id:'venda',      label:'Nova Venda',   icon:ShoppingBag},
    {id:'transacoes', label:'Transações',   icon:TrendingUp },
  ]

  return (
    <>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
      <div style={{maxWidth:960,margin:'0 auto',fontFamily:typography.fontFamily,animation:'fadeUp 0.3s ease'}}>
        <div style={{marginBottom:22}}>
          <h2 style={{margin:'0 0 3px',fontSize:22,fontWeight:800,letterSpacing:'-0.03em',color:'#0f0f14'}}>Caixa</h2>
          <p style={{margin:0,fontSize:13,color:colors.gray.dimText}}>{dayjs().tz('America/Sao_Paulo').format('dddd, DD [de] MMMM [de] YYYY').replace(/^\w/,c=>c.toUpperCase())}</p>
        </div>
        <div style={{display:'flex',gap:4,marginBottom:22,background:'rgba(0,0,0,0.05)',borderRadius:14,padding:4}}>
          {TABS.map(t=>{
            const isA=tab===t.id
            return(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'10px 8px',borderRadius:11,border:'none',background:isA?'#fff':'transparent',cursor:'pointer',fontSize:12,fontWeight:700,color:isA?'#0f0f14':colors.gray.dimText,boxShadow:isA?'0 2px 12px rgba(0,0,0,0.08)':'none',transition:`all ${transitions.spring}`,fontFamily:typography.fontFamily,letterSpacing:'.01em',whiteSpace:'nowrap'}}>
                <t.icon size={14} strokeWidth={2} color={isA?colors.red.DEFAULT:colors.gray.dimText}/>
                {t.label}
              </button>
            )
          })}
        </div>
        {tab==='cobrar'     &&<TabCobrar     onRefreshTransactions={()=>setRefreshKey(k=>k+1)}/>}
        {tab==='venda'      &&<TabVenda      onRefreshTransactions={()=>setRefreshKey(k=>k+1)}/>}
        {tab==='transacoes' &&<TabTransacoes refreshKey={refreshKey}/>}
      </div>
    </>
  )
}