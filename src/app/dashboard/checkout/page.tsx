'use client'
// src/app/dashboard/checkout/page.tsx

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ChevronLeft, Banknote, CreditCard, Smartphone, ArrowLeftRight,
  Split, Gift, Package, UserCheck, Check, Loader2,
} from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { colors, typography, radius, shadows, transitions } from '@/shared/theme'
import { colorToGradient } from '@/features/agenda/constants/serviceColors'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import 'dayjs/locale/pt-br'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale('pt-br')

// ─── Types ────────────────────────────────────────────────────────────────────
type PaymentMethod =
  | 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX'
  | 'BANK_TRANSFER' | 'SPLIT' | 'SUBSCRIPTION' | 'GIFT_CARD' | 'PACKAGE'

interface BookingDetail {
  id: string; status: string
  startAt: string; endAt: string
  clientName: string; clientPhone?: string
  service: { id:string; name:string; price:number|null; color:string|null; duration:number }
  professional?: { id:string; name:string; avatarUrl?:string }
}

// ─── Métodos de pagamento ─────────────────────────────────────────────────────
const METHODS: { id:PaymentMethod; label:string; icon:React.ComponentType<{size?:number;strokeWidth?:number;color?:string}> }[] = [
  { id:'CASH',          label:'Dinheiro',          icon:Banknote      },
  { id:'CREDIT_CARD',   label:'Cartão de Crédito',  icon:CreditCard    },
  { id:'DEBIT_CARD',    label:'Débito',             icon:CreditCard    },
  { id:'PIX',           label:'Pix',                icon:Smartphone    },
  { id:'SPLIT',         label:'Dividir pagamento',  icon:Split         },
  { id:'BANK_TRANSFER', label:'Transferência',       icon:ArrowLeftRight},
  { id:'SUBSCRIPTION',  label:'Assinatura',          icon:UserCheck     },
  { id:'GIFT_CARD',     label:'Cartão Presente',     icon:Gift          },
  { id:'PACKAGE',       label:'Pacote',              icon:Package       },
]

function getInitials(n: string) { return n.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase() }

// ─── Checkout inner (usa useSearchParams) ────────────────────────────────────
function CheckoutInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const bookingId    = searchParams.get('bookingId')

  const [booking,    setBooking]    = useState<BookingDetail|null>(null)
  const [loading,    setLoading]    = useState(true)
  const [method,     setMethod]     = useState<PaymentMethod|null>(null)
  const [discount,   setDiscount]   = useState(0)
  const [discountInput, setDiscountInput] = useState('')
  const [paying,     setPaying]     = useState(false)
  const [success,    setSuccess]    = useState(false)
  const [error,      setError]      = useState<string|null>(null)

  useEffect(() => {
    if (!bookingId) { router.replace('/dashboard/agenda'); return }
    let cancelled = false
    api.get(`/payments/booking/${bookingId}`)
      .then(res => { if (!cancelled) setBooking(res.data?.data ?? res.data) })
      .catch(() => { if (!cancelled) setError('Agendamento não encontrado') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [bookingId, router])

  const basePrice   = booking?.service.price ?? 0
  const finalAmount = Math.max(0, basePrice - discount)

  function handleDiscount(v: string) {
    setDiscountInput(v)
    const n = parseFloat(v.replace(',','.'))
    setDiscount(isNaN(n) ? 0 : Math.min(n, basePrice))
  }

  async function handlePay() {
    if (!method || !bookingId) return
    try {
      setPaying(true); setError(null)
      await api.post('/payments/checkout', {
        bookingId, method, amount: finalAmount, discount,
      })
      setSuccess(true)
      setTimeout(() => router.push('/dashboard/agenda'), 2000)
    } catch (e: unknown) {
      const msg = (e as {response?:{data?:{error?:string}}})?.response?.data?.error
      setError(msg ?? 'Erro ao processar pagamento')
    } finally { setPaying(false) }
  }

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', padding:80 }}>
      <Loader2 size={32} color={colors.red.DEFAULT} style={{animation:'spin 0.8s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!booking || error) return (
    <div style={{ textAlign:'center', padding:80, fontFamily:typography.fontFamily }}>
      <div style={{ fontSize:40, marginBottom:12 }}>😕</div>
      <div style={{ fontSize:16, fontWeight:700, color:typography.color.primary, marginBottom:12 }}>
        {error ?? 'Agendamento não encontrado'}
      </div>
      <button onClick={() => router.back()} style={{ padding:'8px 16px', borderRadius:radius.sm, border:`1px solid ${colors.gray.borderMd}`, background:'transparent', cursor:'pointer', fontSize:14 }}>
        Voltar
      </button>
    </div>
  )

  if (success) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', fontFamily:typography.fontFamily, animation:'fadeUp 0.4s ease' }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ width:72, height:72, borderRadius:'50%', background:'linear-gradient(135deg,#22c55e,#16a34a)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 24px rgba(22,163,74,0.3)', marginBottom:20 }}>
        <Check size={36} color="#fff" strokeWidth={3}/>
      </div>
      <h2 style={{ margin:'0 0 8px', fontSize:22, fontWeight:700, color:typography.color.primary }}>Pagamento confirmado!</h2>
      <p style={{ margin:0, fontSize:15, color:typography.color.muted }}>
        R$ {finalAmount.toFixed(2).replace('.',',')} recebido via {METHODS.find(m=>m.id===method)?.label}
      </p>
    </div>
  )

  const gradient = booking.service.color ? colorToGradient(booking.service.color) : colors.red.gradient

  return (
    <>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ maxWidth:900, margin:'0 auto', fontFamily:typography.fontFamily, animation:'fadeUp 0.3s ease' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
          <button onClick={() => router.back()} style={{ width:34, height:34, borderRadius:radius.sm, border:`1px solid ${colors.gray.borderMd}`, background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <ChevronLeft size={18} color={colors.gray.dimText} strokeWidth={2}/>
          </button>
          <h2 style={{ margin:0, fontSize:22, fontWeight:700, letterSpacing:'-0.025em', color:typography.color.primary }}>
            Informações de pagamento
          </h2>
          <button onClick={() => router.back()} style={{ marginLeft:'auto', padding:'7px 14px', borderRadius:radius.sm, border:`1px solid rgba(220,38,38,0.2)`, background:'rgba(220,38,38,0.06)', color:colors.red.DEFAULT, fontSize:13, fontWeight:600, cursor:'pointer' }}>
            Cancelar venda
          </button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:20, alignItems:'start' }}>

          {/* Esquerda — método de pagamento */}
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

            <div style={{ background:'rgba(255,255,255,0.8)', backdropFilter:'blur(20px)', borderRadius:20, border:`1px solid ${colors.gray.border}`, boxShadow:shadows.sm, padding:20 }}>
              <h3 style={{ margin:'0 0 16px', fontSize:15, fontWeight:700, color:typography.color.primary, letterSpacing:'-0.01em' }}>Método de pagamento</h3>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
                {METHODS.map(m => {
                  const isSel = method === m.id
                  return (
                    <button key={m.id} onClick={() => setMethod(m.id)} style={{
                      padding:'14px 8px', borderRadius:12,
                      border:isSel?`2px solid ${colors.gray[900]}`:`1px solid ${colors.gray.borderMd}`,
                      background:isSel?colors.gray[900]:'transparent',
                      cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:6,
                      transition:`all ${transitions.spring}`,
                      boxShadow:isSel?shadows.sm:'none',
                      position:'relative',
                    }}
                      onMouseEnter={e=>{ if(!isSel) e.currentTarget.style.background=colors.gray.hover }}
                      onMouseLeave={e=>{ if(!isSel) e.currentTarget.style.background='transparent' }}
                    >
                      {isSel && (
                        <div style={{ position:'absolute', top:6, right:6, width:16, height:16, borderRadius:'50%', background:colors.red.DEFAULT, display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <Check size={10} color="#fff" strokeWidth={3}/>
                        </div>
                      )}
                      <m.icon size={22} strokeWidth={1.8} color={isSel?'#fff':colors.gray[700]}/>
                      <span style={{ fontSize:11, fontWeight:600, color:isSel?'#fff':colors.gray[700], textAlign:'center', lineHeight:1.2 }}>{m.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Pagamento / desconto */}
            <div style={{ background:'rgba(255,255,255,0.8)', backdropFilter:'blur(20px)', borderRadius:20, border:`1px solid ${colors.gray.border}`, boxShadow:shadows.sm, padding:20 }}>
              <h3 style={{ margin:'0 0 16px', fontSize:15, fontWeight:700, color:typography.color.primary }}>Pagamento</h3>
              <div style={{ display:'flex', gap:16, alignItems:'flex-end' }}>
                <div style={{ flex:1 }}>
                  <label style={{ display:'block', fontSize:11, fontWeight:700, color:colors.gray.dimText, textTransform:'uppercase', letterSpacing:'.07em', marginBottom:6 }}>Quantia</label>
                  <div style={{ padding:'12px 14px', borderRadius:10, border:`1px solid ${colors.gray.borderMd}`, background:colors.background.page, fontSize:16, fontWeight:700, color:typography.color.primary, fontVariantNumeric:'tabular-nums' }}>
                    R$ {finalAmount.toFixed(2).replace('.',',')}
                  </div>
                </div>
                <div style={{ flex:1 }}>
                  <label style={{ display:'block', fontSize:11, fontWeight:700, color:colors.gray.dimText, textTransform:'uppercase', letterSpacing:'.07em', marginBottom:6 }}>Desconto (R$)</label>
                  <input value={discountInput} onChange={e=>handleDiscount(e.target.value)} placeholder="0,00"
                    style={{ width:'100%', padding:'12px 14px', borderRadius:10, border:`1px solid ${colors.gray.borderMd}`, background:colors.background.page, fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:typography.fontFamily, color:typography.color.primary }}
                  />
                </div>
              </div>
              {discount > 0 && (
                <div style={{ marginTop:10, display:'flex', justifyContent:'space-between', padding:'8px 12px', borderRadius:8, background:'rgba(22,163,74,0.06)', border:'1px solid rgba(22,163,74,0.15)' }}>
                  <span style={{ fontSize:13, color:'#15803d', fontWeight:600 }}>Desconto aplicado</span>
                  <span style={{ fontSize:13, color:'#15803d', fontWeight:700, fontVariantNumeric:'tabular-nums' }}>-R$ {discount.toFixed(2).replace('.',',')}</span>
                </div>
              )}
              {error && (
                <div style={{ marginTop:10, padding:'9px 12px', borderRadius:8, background:'rgba(220,38,38,0.06)', border:`1px solid ${colors.red.border}`, color:colors.red.DEFAULT, fontSize:13 }}>
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Direita — resumo */}
          <div style={{ position:'sticky', top:20 }}>
            <div style={{ background:'rgba(255,255,255,0.8)', backdropFilter:'blur(20px)', borderRadius:20, border:`1px solid ${colors.gray.border}`, boxShadow:shadows.sm, overflow:'hidden' }}>

              {/* Cliente */}
              <div style={{ padding:'16px 20px', borderBottom:`1px solid ${colors.gray.border}`, display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:40, height:40, borderRadius:'50%', background:colors.red.gradient, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:13, fontWeight:700, color:'#fff' }}>
                  {getInitials(booking.clientName)}
                </div>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:typography.color.primary }}>{booking.clientName}</div>
                  {booking.clientPhone && <div style={{ fontSize:12, color:typography.color.muted }}>{booking.clientPhone}</div>}
                </div>
              </div>

              {/* Booking info */}
              <div style={{ padding:'14px 20px', borderBottom:`1px solid ${colors.gray.border}` }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                  <div style={{ padding:'2px 10px', borderRadius:20, background:'rgba(22,163,74,0.1)', border:'1px solid rgba(22,163,74,0.2)', fontSize:11, fontWeight:700, color:'#15803d', letterSpacing:'.04em' }}>
                    CONFIRMADO
                  </div>
                  <span style={{ fontSize:13, color:typography.color.muted, fontVariantNumeric:'tabular-nums' }}>
                    {dayjs(booking.startAt).tz('America/Sao_Paulo').format('DD [de] MMM, HH:mm')}
                  </span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:3, height:32, borderRadius:2, background:gradient, flexShrink:0 }}/>
                  <span style={{ fontSize:14, fontWeight:600, color:typography.color.primary }}>{booking.service.name}</span>
                </div>
                {booking.professional && (
                  <div style={{ marginTop:8, display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:22, height:22, borderRadius:'50%', background:colors.red.gradient, display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:700, color:'#fff' }}>
                      {getInitials(booking.professional.name)}
                    </div>
                    <span style={{ fontSize:13, color:typography.color.muted }}>{booking.professional.name}</span>
                  </div>
                )}
              </div>

              {/* Itens */}
              <div style={{ padding:'14px 20px', borderBottom:`1px solid ${colors.gray.border}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <span style={{ fontSize:13, color:typography.color.muted }}>{booking.service.name} ({booking.service.duration}m)</span>
                  <span style={{ fontSize:13, fontWeight:600, color:typography.color.primary, fontVariantNumeric:'tabular-nums' }}>
                    R$ {(booking.service.price ?? 0).toFixed(2).replace('.',',')}
                  </span>
                </div>
                {discount > 0 && (
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:13, color:'#15803d' }}>Desconto</span>
                    <span style={{ fontSize:13, fontWeight:600, color:'#15803d', fontVariantNumeric:'tabular-nums' }}>
                      -R$ {discount.toFixed(2).replace('.',',')}
                    </span>
                  </div>
                )}
              </div>

              {/* Total */}
              <div style={{ padding:'14px 20px 20px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                  <span style={{ fontSize:12, fontWeight:700, color:colors.gray.dimText, textTransform:'uppercase', letterSpacing:'.07em' }}>TOTAL</span>
                  <span style={{ fontSize:24, fontWeight:700, color:typography.color.primary, fontVariantNumeric:'tabular-nums' }}>
                    R$ {finalAmount.toFixed(2).replace('.',',')}
                  </span>
                </div>

                <button onClick={handlePay} disabled={!method || paying}
                  style={{
                    width:'100%', padding:'15px', borderRadius:12, border:'none',
                    background:!method||paying?colors.gray.borderMd:'linear-gradient(135deg,#1e293b,#0f172a)',
                    color:!method||paying?colors.gray.dimText:'#fff',
                    fontSize:14, fontWeight:700, cursor:!method||paying?'not-allowed':'pointer',
                    letterSpacing:'.04em', textTransform:'uppercase' as const,
                    boxShadow:!method||paying?'none':'0 4px 14px rgba(15,23,42,0.28)',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                    transition:`all ${transitions.spring}`,
                    fontFamily:typography.fontFamily,
                  }}
                  onMouseEnter={e=>{ if(method&&!paying) e.currentTarget.style.transform='translateY(-1px)' }}
                  onMouseLeave={e=>{ e.currentTarget.style.transform='translateY(0)' }}
                >
                  {paying
                    ? <><Loader2 size={16} style={{animation:'spin 0.8s linear infinite'}}/> Processando...</>
                    : 'CONFIRMAR E PAGAR'
                  }
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
      <div style={{ display:'flex', justifyContent:'center', padding:80 }}>
        <Loader2 size={32} color={colors.red.DEFAULT} style={{animation:'spin 0.8s linear infinite'}}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <CheckoutInner/>
    </Suspense>
  )
}