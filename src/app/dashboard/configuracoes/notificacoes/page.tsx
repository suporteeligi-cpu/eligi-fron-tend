'use client'
// configuracoes/notificacoes/page.tsx

import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/shared/lib/apiClient'
import {
  BellRing, ChevronLeft, Users, Check,
  Sunrise, CalendarPlus, CalendarClock, CalendarX2,
  Package, UserPlus, CreditCard, UserX,
} from 'lucide-react'

type CatDef = { key: string; label: string; icon: React.ElementType; locked?: boolean }

const CATS: CatDef[] = [
  { key: 'DAILY_SUMMARY',  label: 'Resumo do dia',          icon: Sunrise },
  { key: 'BOOKING_ONLINE', label: 'Agendamento online',     icon: CalendarPlus },
  { key: 'RESCHEDULE',     label: 'Reagendamento',          icon: CalendarClock },
  { key: 'CANCELLATION',   label: 'Cancelamento',           icon: CalendarX2 },
  { key: 'STOCK_LOW',      label: 'Estoque baixo',          icon: Package },
  { key: 'NEW_CLIENT',     label: 'Novo cliente pelo link', icon: UserPlus },
  { key: 'BILLING',        label: 'Assinatura e cobrança',  icon: CreditCard },
  { key: 'NO_SHOW',        label: 'Não compareceu',         icon: UserX, locked: true },
]

function Toggle({ on, disabled, onClick }: { on: boolean; disabled?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={disabled}
      onClick={onClick}
      style={{
        width: 42, height: 25, borderRadius: 999, border: 'none', flexShrink: 0,
        position: 'relative', cursor: disabled ? 'not-allowed' : 'pointer',
        background: on ? '#1D9E75' : 'rgba(0,0,0,0.16)',
        opacity: disabled ? 0.4 : 1, transition: 'background 0.18s ease',
      }}
    >
      <span style={{
        position: 'absolute', top: 2.5, left: on ? 19.5 : 2.5,
        width: 20, height: 20, borderRadius: '50%', background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        transition: 'left 0.18s cubic-bezier(0.34,1.56,0.64,1)',
      }} />
    </button>
  )
}

export default function NotificacoesConfigPage() {
  const [loading, setLoading] = useState(true)
  const [popup, setPopup] = useState(true)
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(CATS.map(c => [c.key, true])),
  )
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let alive = true
    const run = async () => {
      try {
        const { data } = await api.get('/notifications/settings')
        if (!alive) return
        const muted: string[] = data?.mutedCategories ?? []
        setEnabled(Object.fromEntries(CATS.map(c => [c.key, !muted.includes(c.key)])))
        setPopup(data?.popupEnabled ?? true)
      } catch {
        /* mantem defaults */
      } finally {
        if (alive) setLoading(false)
      }
    }
    void run()
    return () => { alive = false }
  }, [])

  const persist = async (nextEnabled: Record<string, boolean>, nextPopup: boolean) => {
    const mutedCategories = CATS.filter(c => !c.locked && !nextEnabled[c.key]).map(c => c.key)
    try {
      await api.put('/notifications/settings', { mutedCategories, popupEnabled: nextPopup })
      setSaved(true)
      window.setTimeout(() => setSaved(false), 1600)
    } catch {
      /* silencioso */
    }
  }

  const toggleCat = (key: string, locked?: boolean) => {
    if (locked || loading) return
    const next = { ...enabled, [key]: !enabled[key] }
    setEnabled(next)
    void persist(next, popup)
  }

  const togglePopup = () => {
    if (loading) return
    const next = !popup
    setPopup(next)
    void persist(enabled, next)
  }

  return (
    <>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }`}</style>
      <div style={{ maxWidth: 720, animation: 'fadeUp 0.3s ease', fontFamily: '-apple-system,"SF Pro Display",system-ui,sans-serif' }}>

        <Link href="/dashboard/configuracoes" style={{
          display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none',
          fontSize: 13, fontWeight: 600, color: 'rgba(0,0,0,0.45)', marginBottom: 18,
        }}>
          <ChevronLeft size={16} strokeWidth={2.2} /> Configurações
        </Link>

        <div style={{ marginBottom: 26 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em', color: '#0f0f14' }}>Notificações</h2>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'rgba(0,0,0,0.45)' }}>Escolha o que te avisa e como o pop-up aparece.</p>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
          borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)',
          boxShadow: '0 1px 6px rgba(0,0,0,0.04)', overflow: 'hidden',
          opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s ease',
        }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', background: 'rgba(0,0,0,0.015)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, background: 'linear-gradient(135deg,rgba(220,38,38,0.10),rgba(185,28,28,0.06))', border: '1px solid rgba(220,38,38,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BellRing size={18} color="#dc2626" strokeWidth={1.8} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Pop-up na tela</div>
              <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginTop: 2 }}>Balão no topo da tela quando chega algo novo.</div>
            </div>
            <Toggle on={popup} disabled={loading} onClick={togglePopup} />
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,0.32)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '14px 20px 6px' }}>
            O que me notifica
          </div>

          {CATS.map((c, i) => {
            const Icon = c.icon
            return (
              <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 20px', borderTop: i === 0 ? 'none' : '1px solid rgba(0,0,0,0.04)' }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={17} color="rgba(0,0,0,0.45)" strokeWidth={1.8} />
                </div>
                <div style={{ flex: 1, minWidth: 0, fontSize: 14, color: c.locked ? 'rgba(0,0,0,0.4)' : '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {c.label}
                  {c.locked && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: 'rgba(0,0,0,0.06)', color: 'rgba(0,0,0,0.35)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      Em breve
                    </span>
                  )}
                </div>
                <Toggle on={c.locked ? false : !!enabled[c.key]} disabled={loading || c.locked} onClick={() => toggleCat(c.key, c.locked)} />
              </div>
            )
          })}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 20px', borderTop: '1px solid rgba(0,0,0,0.05)', background: 'rgba(0,0,0,0.015)', fontSize: 12, color: 'rgba(0,0,0,0.42)' }}>
            <Users size={15} strokeWidth={1.8} /> Lembretes para clientes e profissionais — em breve
          </div>
        </div>

        <div style={{ height: 18, marginTop: 10, display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#1D9E75', fontWeight: 600, opacity: saved ? 1 : 0, transition: 'opacity 0.2s ease' }}>
          <Check size={14} strokeWidth={2.4} /> Salvo
        </div>
      </div>
    </>
  )
}
