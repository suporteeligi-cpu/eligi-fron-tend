'use client'

import { useEffect, useState, useRef, useCallback, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/hooks/useAuth'
import {
  Bell, Search, X, Calendar, Users, ChevronRight, ChevronDown, Clock, Share2, Store, Settings, LogOut,
  Sunrise, CalendarPlus, CalendarClock, CalendarX, UserX, Package, CreditCard, UserPlus, CheckCheck,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { colors, typography, radius, shadows, transitions } from '@/shared/theme'
import { useIsMobile } from '@/hooks/useIsMobile'
import api from '@/shared/lib/apiClient'
import { io, Socket } from 'socket.io-client'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useRouter, usePathname } from 'next/navigation'
import { navigationByRole, activeNavPath, type Role } from './navigation.config'
import { canAccessRoute } from './routeAccess'
import { useAgendaStore } from '@/features/agenda/hooks/useAgendaStore'
import ShareProfileModal from '@/features/sharing/ShareProfileModal'
import ProfAvatar from '@/features/agenda/components/shared/ProfAvatar'
import QRCode from 'qrcode'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

// ─── Types ────────────────────────────────────────────────────────────────────
interface SearchResult {
  type:     'client' | 'booking'
  id:       string
  title:    string
  sub:      string
  meta?:    string
}

type NotifSeverity = 'INFO' | 'WARNING' | 'CRITICAL'
type NotifCategory =
  | 'DAILY_SUMMARY' | 'BOOKING_ONLINE' | 'RESCHEDULE' | 'CANCELLATION'
  | 'NO_SHOW' | 'STOCK_LOW' | 'NEW_CLIENT' | 'BILLING'

interface NotifItem {
  id:        string
  category:  NotifCategory
  severity:  NotifSeverity
  title:     string
  body:      string | null
  createdAt: string
  readAt:    string | null
}

type ToastState =
  | { kind: 'summary'; count: number }
  | { kind: 'item'; notif: NotifItem }
  | null

// Severidade → cores (fixas, legíveis em claro e escuro)
const SEV: Record<NotifSeverity, { accent: string; soft: string; ink: string }> = {
  INFO:     { accent: '#378ADD', soft: '#E6F1FB', ink: '#0C447C' },
  WARNING:  { accent: '#EF9F27', soft: '#FAEEDA', ink: '#633806' },
  CRITICAL: { accent: '#E24B4A', soft: '#FCEBEB', ink: '#791F1F' },
}
// Categoria → ícone
const CAT_ICON: Record<NotifCategory, LucideIcon> = {
  DAILY_SUMMARY:  Sunrise,
  BOOKING_ONLINE: CalendarPlus,
  RESCHEDULE:     CalendarClock,
  CANCELLATION:   CalendarX,
  NO_SHOW:        UserX,
  STOCK_LOW:      Package,
  NEW_CLIENT:     UserPlus,
  BILLING:        CreditCard,
}

// ─── SearchModal ──────────────────────────────────────────────────────────────
function SearchModal({ onClose }: { onClose: () => void }) {
  const router  = useRouter()
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80) }, [])

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const t = setTimeout(async () => {
      try {
        setLoading(true)
        const [clientsRes] = await Promise.all([
          api.get('/clients', { params: { search: query, limit: 5 } }),
        ])
        const clients: SearchResult[] = (clientsRes.data?.data?.clients ?? []).map((c: { id: string; name: string; phone: string; totalBookings?: number }) => ({
          type: 'client' as const,
          id:   c.id,
          title: c.name,
          sub:   c.phone?.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3') ?? '',
          meta:  `${c.totalBookings ?? 0} agend.`,
        }))
        setResults(clients)
        setFocused(0)
      } catch { setResults([]) }
      finally  { setLoading(false) }
    }, 280)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    function handleSelect(r: SearchResult) {
      if (r.type === 'client')  router.push(`/dashboard/clientes/${r.id}`)
      if (r.type === 'booking') router.push(`/dashboard/agenda`)
      onClose()
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowDown') { e.preventDefault(); setFocused(f => Math.min(f+1, results.length-1)) }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setFocused(f => Math.max(f-1, 0)) }
      if (e.key === 'Enter' && results[focused]) { handleSelect(results[focused]) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [results, focused, onClose, router])

  function handleSelect(r: SearchResult) {
    if (r.type === 'client')  router.push(`/dashboard/clientes/${r.id}`)
    if (r.type === 'booking') router.push(`/dashboard/agenda`)
    onClose()
  }

  const iconMap = { client: Users, booking: Calendar }

  return createPortal(
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.25)', backdropFilter:'blur(8px)', zIndex:9998 }} />
      <div style={{
        position:'fixed', top:80, left:'50%', transform:'translateX(-50%)',
        width:560, maxWidth:'calc(100vw - 32px)',
        background:'rgba(255,255,255,0.98)',
        borderRadius:radius['2xl'],
        boxShadow:shadows.lg,
        border:`1px solid ${colors.gray.borderMd}`,
        zIndex:9999, overflow:'hidden',
        fontFamily:typography.fontFamily,
        animation:'smIn 0.18s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <style>{`@keyframes smIn{from{opacity:0;transform:translateX(-50%) translateY(-8px) scale(0.97)}to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}}`}</style>

        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 16px', borderBottom:`1px solid ${colors.gray.border}` }}>
          <Search size={18} color={colors.gray.dimText} strokeWidth={2} style={{ flexShrink:0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar clientes, agendamentos..."
            style={{ flex:1, border:'none', outline:'none', fontSize:15, color:colors.gray[900], background:'transparent', fontFamily:typography.fontFamily }}
          />
          {loading && (
            <div style={{ width:16, height:16, borderRadius:'50%', border:`2px solid ${colors.red.subtle}`, borderTopColor:colors.red.DEFAULT, animation:'spin 0.7s linear infinite', flexShrink:0 }} />
          )}
          {query && !loading && (
            <button onClick={() => setQuery('')} style={{ background:'none', border:'none', cursor:'pointer', display:'flex', padding:2 }}>
              <X size={15} color={colors.gray.dimText} />
            </button>
          )}
          <kbd style={{ padding:'2px 8px', borderRadius:6, border:`1px solid ${colors.gray.borderMd}`, background:colors.background.page, fontSize:11, color:colors.gray.dimText, fontWeight:600, flexShrink:0 }}>ESC</kbd>
        </div>

        {results.length > 0 ? (
          <div style={{ maxHeight:360, overflowY:'auto' }}>
            {results.map((r, i) => {
              const Icon = iconMap[r.type]
              const isFocused = i === focused
              return (
                <button
                  key={r.id}
                  onClick={() => handleSelect(r)}
                  onMouseEnter={() => setFocused(i)}
                  style={{
                    width:'100%', display:'flex', alignItems:'center', gap:12,
                    padding:'12px 16px', border:'none', borderBottom:`1px solid ${colors.gray.border}`,
                    background: isFocused ? colors.red.subtle : 'transparent',
                    cursor:'pointer', textAlign:'left', transition:`background ${transitions.fast}`,
                  }}
                >
                  <div style={{ width:36, height:36, borderRadius:radius.sm, background: isFocused ? colors.red.subtle : colors.background.page, border:`1px solid ${isFocused ? colors.red.border : colors.gray.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:transitions.fast }}>
                    <Icon size={16} color={isFocused ? colors.red.DEFAULT : colors.gray.dimText} strokeWidth={2} />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:600, color:colors.gray[900], whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{r.title}</div>
                    <div style={{ fontSize:12, color:colors.gray.dimText, marginTop:1 }}>{r.sub}</div>
                  </div>
                  {r.meta && <span style={{ fontSize:11, color:colors.gray.dimText, flexShrink:0 }}>{r.meta}</span>}
                  <ChevronRight size={14} color={colors.gray.dimText} />
                </button>
              )
            })}
          </div>
        ) : query && !loading ? (
          <div style={{ padding:'32px 16px', textAlign:'center', color:colors.gray.dimText }}>
            <Search size={28} color={colors.gray.dimText} style={{ opacity:0.3, marginBottom:8 }} />
            <div style={{ fontSize:14, fontWeight:500 }}>Nenhum resultado para &quot;{query}&quot;</div>
          </div>
        ) : !query ? (
          <div style={{ padding:'16px' }}>
            <div style={{ fontSize:11, fontWeight:700, color:colors.gray.dimText, textTransform:'uppercase', letterSpacing:'.07em', marginBottom:8 }}>Atalhos</div>
            {[
              { label:'Clientes', icon:Users,    path:'/dashboard/clientes' },
              { label:'Agenda',   icon:Calendar, path:'/dashboard/agenda'   },
            ].map(s => (
              <button key={s.path} onClick={() => { router.push(s.path); onClose() }} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'9px 10px', borderRadius:radius.sm, border:'none', background:'transparent', cursor:'pointer', textAlign:'left', transition:`background ${transitions.fast}` }}
                onMouseEnter={e => (e.currentTarget.style.background = colors.gray.hover)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <s.icon size={15} color={colors.gray.dimText} />
                <span style={{ fontSize:13, color:colors.gray[700], fontWeight:500 }}>{s.label}</span>
              </button>
            ))}
          </div>
        ) : null}

        <div style={{ padding:'8px 16px', borderTop:`1px solid ${colors.gray.border}`, display:'flex', gap:12 }}>
          {[['↑↓','navegar'],['↵','selecionar'],['ESC','fechar']].map(([key, label]) => (
            <div key={key} style={{ display:'flex', alignItems:'center', gap:4 }}>
              <kbd style={{ padding:'1px 6px', borderRadius:5, border:`1px solid ${colors.gray.borderMd}`, background:colors.background.page, fontSize:10, color:colors.gray.dimText, fontWeight:600 }}>{key}</kbd>
              <span style={{ fontSize:11, color:colors.gray.dimText }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>,
    document.body
  )
}

// ─── NotifPanel (dados reais, Direção B, liquid glass) ──────────────────────────
function NotifPanel({
  onClose, isMobile, refreshKey, onUnread,
}: {
  onClose:   () => void
  isMobile:  boolean
  refreshKey: number
  onUnread:  (n: number) => void
}) {
  const [items,   setItems]   = useState<NotifItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await api.get('/notifications', { params: { limit: 30 } })
      setItems(res.data?.items ?? [])
      onUnread(res.data?.unread ?? 0)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [onUnread])

  useEffect(() => { void load() }, [load, refreshKey])

  const unread = items.filter(n => !n.readAt).length

  function markAll() {
    const now = new Date().toISOString()
    setItems(prev => prev.map(n => (n.readAt ? n : { ...n, readAt: now })))
    onUnread(0)
    void api.patch('/notifications/read-all').catch(() => {})
  }
  function markOne(id: string) {
    const now = new Date().toISOString()
    setItems(prev => {
      const next = prev.map(n => (n.id === id && !n.readAt ? { ...n, readAt: now } : n))
      onUnread(next.filter(n => !n.readAt).length)
      return next
    })
    void api.patch(`/notifications/${id}/read`).catch(() => {})
  }

  const panel = (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:9990, background:'rgba(0,0,0,0.12)' }} />
      <div style={isMobile ? {
        position:'fixed', bottom:0, left:0, right:0, maxHeight:'80dvh',
        background:'var(--glass-bg)', backdropFilter:'var(--glass-blur)', WebkitBackdropFilter:'var(--glass-blur)',
        borderRadius:'24px 24px 0 0', borderTop:'1px solid var(--glass-border)',
        boxShadow:'0 -8px 40px var(--glass-shadow), 0 1px 0 var(--glass-shine) inset',
        zIndex:9991, display:'flex', flexDirection:'column', fontFamily:typography.fontFamily,
        animation:'npUp 0.28s cubic-bezier(0.34,1.2,0.64,1)',
        paddingBottom:'max(16px,env(safe-area-inset-bottom))',
      } : {
        position:'fixed', top:80, right:20, width:380,
        background:'var(--glass-bg)', backdropFilter:'var(--glass-blur)', WebkitBackdropFilter:'var(--glass-blur)',
        borderRadius:18, border:'1px solid var(--glass-border)',
        boxShadow:'0 8px 32px var(--glass-shadow), 0 1px 0 var(--glass-shine) inset',
        zIndex:9991, display:'flex', flexDirection:'column', fontFamily:typography.fontFamily,
        animation:'npIn 0.18s cubic-bezier(0.34,1.56,0.64,1)', maxHeight:'70vh',
      }}>
        <style>{`
          @keyframes npIn{from{opacity:0;transform:translateY(-8px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}
          @keyframes npUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        `}</style>

        {isMobile && (
          <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 4px' }}>
            <div style={{ width:40, height:4, borderRadius:2, background:'var(--glass-border)' }} />
          </div>
        )}

        <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--glass-border)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>Notificações</span>
            {unread > 0 && (
              <span style={{ padding:'1px 8px', borderRadius:radius.full, background:colors.red.gradient, color:'#fff', fontSize:11, fontWeight:700, boxShadow:`0 2px 6px ${colors.red.glow}` }}>{unread}</span>
            )}
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            {unread > 0 && (
              <button onClick={markAll} style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, fontWeight:600, color:colors.red.DEFAULT, background:'none', border:'none', cursor:'pointer', padding:'4px 8px', borderRadius:radius.sm }}>
                <CheckCheck size={13} /> Marcar lidas
              </button>
            )}
            <button onClick={onClose} style={{ width:26, height:26, borderRadius:radius.full, border:'1px solid var(--glass-border)', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <X size={13} color="var(--text-muted)" />
            </button>
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto' }}>
          {loading ? (
            <div style={{ padding:'40px 20px', textAlign:'center', color:'var(--text-muted)', fontSize:13 }}>Carregando…</div>
          ) : items.length === 0 ? (
            <div style={{ padding:'48px 20px', textAlign:'center', color:'var(--text-muted)' }}>
              <Bell size={28} style={{ opacity:0.3, marginBottom:8 }} />
              <div style={{ fontSize:14, fontWeight:500 }}>Sem notificações</div>
            </div>
          ) : items.map(n => {
            const sv = SEV[n.severity] ?? SEV.INFO
            const Icon = CAT_ICON[n.category] ?? Bell
            const isUnread = !n.readAt
            return (
              <button
                key={n.id}
                onClick={() => markOne(n.id)}
                style={{
                  width:'100%', display:'flex', alignItems:'flex-start', gap:12, padding:'14px 18px',
                  border:'none', borderBottom:'1px solid var(--glass-border)',
                  background: isUnread ? 'var(--surface-1)' : 'transparent',
                  cursor:'pointer', textAlign:'left', transition:`background ${transitions.fast}`,
                }}
              >
                <div style={{ width:40, height:40, borderRadius:radius.sm, background:sv.soft, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon size={19} color={sv.ink} strokeWidth={2} />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:2 }}>
                    <span style={{ fontSize:13, fontWeight: isUnread ? 600 : 500, color:'var(--text-primary)' }}>{n.title}</span>
                    {isUnread && (
                      <span style={{ fontSize:11, fontWeight:600, padding:'0 7px', borderRadius:radius.full, background:sv.soft, color:sv.ink, flexShrink:0 }}>novo</span>
                    )}
                  </div>
                  {n.body && <div style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.4 }}>{n.body}</div>}
                  <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:4 }}>
                    <span style={{ width:6, height:6, borderRadius:'50%', background:sv.accent, flexShrink:0 }} />
                    <Clock size={10} color="var(--text-muted)" />
                    <span style={{ fontSize:11, color:'var(--text-muted)' }}>{dayjs(n.createdAt).fromNow()}</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )

  if (typeof document === 'undefined') return null
  return createPortal(panel, document.body)
}

// ─── NotifToast (popup leve) ────────────────────────────────────────────────────
function NotifToast({ toast, isMobile, onClose }: { toast: NonNullable<ToastState>; isMobile: boolean; onClose: () => void }) {
  const isSummary = toast.kind === 'summary'
  const sv    = isSummary ? SEV.INFO : (SEV[toast.notif.severity] ?? SEV.INFO)
  const Icon  = isSummary ? Bell : (CAT_ICON[toast.notif.category] ?? Bell)
  const title = isSummary
    ? `${toast.count} ${toast.count === 1 ? 'nova notificação' : 'novas notificações'}`
    : toast.notif.title
  const body  = isSummary ? 'Toque no sino para ver' : (toast.notif.body ?? '')

  if (typeof document === 'undefined') return null
  return createPortal(
    <div
      onClick={onClose}
      style={{
        position:'fixed',
        right: isMobile ? 12 : 24,
        bottom: isMobile ? 'calc(64px + env(safe-area-inset-bottom) + 12px)' : 24,
        width:300, maxWidth:'calc(100vw - 32px)',
        background:'var(--glass-bg)', backdropFilter:'var(--glass-blur)', WebkitBackdropFilter:'var(--glass-blur)',
        border:'1px solid var(--glass-border)', borderRadius:14,
        boxShadow:'0 8px 32px var(--glass-shadow), 0 1px 0 var(--glass-shine) inset',
        zIndex:10050, display:'flex', gap:11, alignItems:'flex-start', padding:'12px 14px',
        cursor:'pointer', fontFamily:typography.fontFamily,
        animation:'ntIn 0.26s cubic-bezier(0.34,1.56,0.64,1)',
      }}
    >
      <style>{`@keyframes ntIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ width:36, height:36, borderRadius:radius.sm, background:sv.soft, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Icon size={18} color={sv.ink} strokeWidth={2} />
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>{title}</div>
        {body && <div style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.4, marginTop:1 }}>{body}</div>}
      </div>
    </div>,
    document.body
  )
}

// ─── AppNavbar ────────────────────────────────────────────────────────────────
const ROLE_LABEL: Record<string, string> = {
  BUSINESS_OWNER: 'Proprietário',
  MANAGER:        'Gerente',
  RECEPTIONIST:   'Recepção',
  STAFF:          'Equipe',
  BASIC_STAFF:    'Equipe',
  PROFESSIONAL:   'Profissional',
  AFFILIATE:      'Afiliado',
}

// @eligi:navbar-contexto (out/2026) — direção A "Contexto" de 3 mockups.
// Esquerda: o nome da tela + o dia (na agenda, o dia escolhido). Centro: busca.
// Direita: link de agendamento, sino (contador grafite) e UM botão de conta com a
// logo do estabelecimento, que abre conta, link, configurações e sair.
// Saíram: "Olá, nome" (repetia o rodapé do menu lateral) e o botão de modo
// escuro, que estava bloqueado. Altura igual (60 px, topo em 16): o 104 dos
// outros arquivos não muda.
const WEEK_PT  = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const MONTH_PT = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
const NAV_INK  = '#111114'
const NAV_INK3 = '#8a8a93'

/** Títulos que não são o rótulo do menu lateral. */
const TITLE_OVERRIDE: Record<string, string> = { '/dashboard': 'Visão geral' }

function longDay(d: dayjs.Dayjs): string {
  return `${WEEK_PT[d.day()]}, ${d.date()} de ${MONTH_PT[d.month()]}`
}

export default function AppNavbar() {
  const auth     = useAuth()
  const isMobile = useIsMobile(768)
  const router   = useRouter()
  const pathname = usePathname()
  const agendaDate = useAgendaStore(s => s.selectedDate)

  const [scrolled,    setScrolled]    = useState(false)
  const [darkMode]                    = useState<boolean>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('eligi-theme') === 'dark' : false
  )
  const [showSearch,  setShowSearch]  = useState(false)
  const [showNotifs,  setShowNotifs]  = useState(false)
  const [showShare,   setShowShare]   = useState(false)
  const [qrDataUrl,   setQrDataUrl]   = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [toast,       setToast]       = useState<ToastState>(null)
  const [refreshKey,  setRefreshKey]  = useState(0)
  const [menuAt,      setMenuAt]      = useState<{ top: number; right: number } | null>(null)
  const [confirmOut,  setConfirmOut]  = useState(false)

  const businessId = auth?.user?.businessId ?? ''

  /* ── Pré-gera QR Code assim que slug disponível ── */
  useEffect(() => {
    const slug = auth?.user?.businessSlug
    if (!slug) return
    QRCode.toDataURL(`https://app.eligi.com.br/${slug}`, {
      width: 200, margin: 2,
      color: { dark: '#1a1a1a', light: '#ffffff' },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null))
  }, [auth?.user?.businessSlug])

  // Modo escuro segue desligado (em desenvolvimento): só respeita quem já tinha
  // salvo 'dark' antes do bloqueio. O botão saiu da barra.
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark')
    else          document.documentElement.classList.remove('dark')
  }, [darkMode])

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 10) }
    window.addEventListener('scroll', onScroll, { passive:true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setShowSearch(v => !v) }
      if (e.key === 'Escape') { setMenuAt(null); setConfirmOut(false) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  /* ── Notificações: contador inicial + toast de boas-vindas ── */
  useEffect(() => {
    let alive = true
    async function run() {
      try {
        const res = await api.get('/notifications/unread-count')
        if (!alive) return
        const count: number = res.data?.count ?? 0
        setUnreadCount(count)
        if (count > 0) setToast({ kind: 'summary', count })
      } catch { /* silencioso */ }
    }
    void run()
    return () => { alive = false }
  }, [])

  /* ── Toast auto-dismiss ── */
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4500)
    return () => clearTimeout(t)
  }, [toast])

  /* ── Socket: notification:created em tempo real ── */
  // @eligi:notif-signal-ref — o evento virou SINAL: so traz o id.
  const onNotifRef = useRef<(n: { id: string }) => void>(() => {})
  useLayoutEffect(() => {
    // @eligi:notif-signal-handler — o payload nao e mais fonte de dado.
    onNotifRef.current = (n: { id: string }) => {
      // @eligi:notif-signal-fetch — o conteudo vem do GET autorizado, que ja
      // filtra por recipientId no servidor. Se a notificacao nao for deste
      // usuario, ela nao volta na lista e nenhum toast e exibido.
      // O contador tambem passa a ser verdade do servidor, nao incremento otimista.
      void (async () => {
        try {
          const res = await api.get('/notifications', { params: { limit: 1 } })
          setUnreadCount(res.data?.unread ?? 0)
          const first: NotifItem | undefined = res.data?.items?.[0]
          if (first && first.id === n.id) setToast({ kind: 'item', notif: first })
        } catch {
          /* silencioso: o sino se corrige no proximo fetch */
        }
      })()
      setRefreshKey(k => k + 1)
    }
  })
  useEffect(() => {
    if (!businessId) return
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'
    const socket: Socket = io(apiUrl, {
      withCredentials:      true,
      transports:           ['polling'],
      upgrade:              false,
      forceNew:             true,
      reconnection:         true,
      reconnectionAttempts: 10,
      reconnectionDelay:    1000,
      reconnectionDelayMax: 5000,
      timeout:              10000,
    })
    socket.on('connect',   () => socket.emit('join:business', businessId))
    socket.on('reconnect', () => socket.emit('join:business', businessId))
    // @eligi:notif-signal-listener — payload reduzido a { id }.
    socket.on('notification:created', (n: { id: string }) => onNotifRef.current(n))
    const ping = setInterval(() => { if (socket.connected) socket.emit('ping') }, 25_000)
    return () => {
      clearInterval(ping)
      socket.emit('leave:business', businessId)
      socket.disconnect()
    }
  }, [businessId])

  const role      = auth?.user?.role ?? ''
  const fullName  = auth?.user?.name ?? ''
  const firstName = fullName.split(' ')[0] ?? ''
  const roleLabel = ROLE_LABEL[role] ?? ''
  const logoUrl   = auth?.user?.logoUrl ?? null
  const bizName   = auth?.user?.businessName ?? ''
  const canSettings = canAccessRoute(role, '/dashboard/configuracoes')

  // ── Onde estou: rótulo do item do menu lateral (prefixo mais longo) ──
  const navItems = navigationByRole[role as Role] ?? []
  const activePath = activeNavPath(navItems, pathname)
  const pageTitle = activePath
    ? (TITLE_OVERRIDE[activePath] ?? navItems.find(i => i.path === activePath)?.label ?? '')
    : ''
  const onAgenda = activePath === '/dashboard/agenda'
  const subDay = longDay(onAgenda && agendaDate ? dayjs(agendaDate) : dayjs())
  const subDayShort = (() => {
    const d = onAgenda && agendaDate ? dayjs(agendaDate) : dayjs()
    return `${WEEK_PT[d.day()].slice(0, 3)}, ${d.date()} ${MONTH_PT[d.month()].slice(0, 3)}`
  })()

  function openMenu(e: React.MouseEvent<HTMLButtonElement>) {
    if (menuAt) { setMenuAt(null); setConfirmOut(false); return }
    const r = e.currentTarget.getBoundingClientRect()
    setMenuAt({ top: r.bottom + 10, right: Math.max(12, window.innerWidth - r.right) })
    setConfirmOut(false)
  }
  function closeMenu() { setMenuAt(null); setConfirmOut(false) }

  const bellLabel = unreadCount > 0 ? `Notificações, ${unreadCount} não lidas` : 'Notificações'
  const badgeText = unreadCount > 9 ? '9+' : String(unreadCount)

  const logoBox = (size: number) => (
    <span className="nb-logo" style={{ width: size, height: size }} aria-hidden>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
      ) : (
        <Store size={Math.round(size * 0.5)} color="#fff" strokeWidth={2} />
      )}
    </span>
  )

  return (
    <>
      <style>{`
        @keyframes eligi-navbar-in {
          from { opacity:0; transform:translateY(-10px) scale(0.98); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes nb-menu-in { from{opacity:0; transform:translateY(-4px) scale(.98)} to{opacity:1; transform:none} }
        .eligi-icon-btn {
          position:relative; width:40px; height:40px; border-radius:12px;
          border:1px solid transparent; background:transparent; cursor:pointer;
          display:flex; align-items:center; justify-content:center;
          color:var(--text-secondary);
          transition:background 160ms ease, border-color 160ms ease, color 160ms ease, transform 130ms ease;
          -webkit-tap-highlight-color:transparent;
        }
        .eligi-icon-btn:hover { background:var(--surface-1); border-color:var(--glass-border); color:var(--text-primary); }
        .eligi-icon-btn:active { transform:scale(0.91); }
        .eligi-search-bar {
          display:flex; align-items:center; gap:8px; height:38px;
          padding:0 12px; border-radius:12px;
          background:var(--surface-2); border:1px solid var(--divider);
          cursor:pointer; transition:all 160ms ease;
          flex:1 1 auto; min-width:160px; max-width:340px; margin:0 auto;
        }
        .eligi-search-bar:hover { background:var(--surface-1); border-color:var(--glass-border); }
        .nb-title{display:flex; flex-direction:column; line-height:1.15; min-width:0}
        .nb-title b{font-family:${typography.fontFamilyDisplay}; font-size:18px; font-weight:600; letter-spacing:-.025em; color:${NAV_INK}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis}
        .nb-title span{font-size:11.5px; color:${NAV_INK3}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis}
        .nb-link{display:flex; align-items:center; gap:6px; height:36px; padding:0 12px; border-radius:11px; border:1px solid var(--divider); background:var(--surface-2); cursor:pointer; font-family:${typography.fontFamily}; font-size:12.5px; font-weight:600; color:var(--text-primary); white-space:nowrap; transition:all 160ms ease}
        .nb-link:hover{background:var(--surface-1); border-color:var(--glass-border)}
        .nb-badge{position:absolute; top:3px; right:2px; min-width:17px; height:17px; padding:0 4px; border-radius:999px; background:${NAV_INK}; color:#fff; font-family:${typography.fontFamily}; font-size:10px; font-weight:700; line-height:13px; text-align:center; border:2px solid #fff; font-variant-numeric:tabular-nums}
        .nb-logo{border-radius:10px; flex-shrink:0; overflow:hidden; display:flex; align-items:center; justify-content:center; background:${NAV_INK}; border:1px solid var(--glass-border)}
        .nb-acct{display:flex; align-items:center; gap:9px; height:44px; padding:0 8px 0 4px; border-radius:14px; border:1px solid transparent; background:transparent; cursor:pointer; min-width:0; max-width:240px; font-family:${typography.fontFamily}; transition:background 160ms ease}
        .nb-acct:hover, .nb-acct[aria-expanded="true"]{background:var(--surface-1)}
        .nb-acct .nb-t{display:flex; flex-direction:column; line-height:1.2; text-align:left; min-width:0}
        .nb-acct .nb-t b{font-size:13px; font-weight:600; color:${NAV_INK}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis}
        .nb-acct .nb-t span{font-size:11px; color:${NAV_INK3}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis}
        .nb-menu{position:fixed; z-index:100000; width:264px; background:#fff; border-radius:16px; padding:6px; box-shadow:0 24px 50px -12px rgba(7,7,11,.28), 0 0 0 1px rgba(17,17,20,.07); font-family:${typography.fontFamily}; color:${NAV_INK}; animation:nb-menu-in .18s cubic-bezier(.34,1.56,.64,1)}
        .nb-menu .nb-hd{display:flex; align-items:center; gap:10px; padding:10px 10px 12px; border-bottom:1px solid rgba(17,17,20,.08); margin-bottom:4px; min-width:0}
        .nb-menu .nb-hd b{display:block; font-size:13.5px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:${NAV_INK}}
        .nb-menu .nb-hd span{display:block; font-size:11.5px; color:${NAV_INK3}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis}
        .nb-mi{display:flex; align-items:center; gap:10px; width:100%; height:42px; padding:0 10px; border:0; border-radius:10px; background:transparent; font-family:inherit; font-size:13px; font-weight:500; color:${NAV_INK}; cursor:pointer; text-align:left}
        .nb-mi:hover{background:#f0f0f3}
        .nb-mi span{color:${NAV_INK}}
        .nb-hr{border:0; border-top:1px solid rgba(17,17,20,.08); margin:4px 6px}
        .nb-confirm{padding:8px 10px 6px}
        .nb-confirm p{margin:0 0 10px; font-size:13px; color:#4b4b52}
        .nb-confirm div{display:flex; gap:8px}
        .nb-confirm button{flex:1; height:38px; border-radius:10px; font-family:inherit; font-size:13px; font-weight:600; cursor:pointer}
        @media (prefers-reduced-motion: reduce){ .nb-menu{animation:none} }
      `}</style>

      {showSearch && <SearchModal onClose={() => setShowSearch(false)} />}
      {showNotifs && <NotifPanel onClose={() => setShowNotifs(false)} isMobile={isMobile} refreshKey={refreshKey} onUnread={setUnreadCount} />}
      {showShare  && <ShareProfileModal onClose={() => setShowShare(false)} qrDataUrl={qrDataUrl} />}
      {toast && <NotifToast toast={toast} isMobile={isMobile} onClose={() => setToast(null)} />}

      {menuAt && typeof document !== 'undefined' && createPortal(
        <>
          <div onClick={closeMenu} style={{ position:'fixed', inset:0, zIndex:99999 }} />
          <div className="nb-menu" role="menu" style={{ top: menuAt.top, right: menuAt.right }}>
            <div className="nb-hd">
              <ProfAvatar name={fullName || '?'} avatarUrl={auth?.user?.avatarUrl ?? undefined} size={36} />
              <div style={{ minWidth:0 }}>
                <b>{fullName}</b>
                <span>{[roleLabel, bizName].filter(Boolean).join(' · ')}</span>
              </div>
            </div>
            {confirmOut ? (
              <div className="nb-confirm">
                <p>Sair da sua conta neste aparelho?</p>
                <div>
                  <button onClick={() => setConfirmOut(false)} style={{ border:'1px solid rgba(17,17,20,.14)', background:'#fff', color:NAV_INK }}>Cancelar</button>
                  <button onClick={() => { closeMenu(); void auth?.logout?.() }} style={{ border:0, background:NAV_INK, color:'#fff' }}>Sair</button>
                </div>
              </div>
            ) : (
              <>
                <button className="nb-mi" role="menuitem" onClick={() => { closeMenu(); setShowShare(true) }}>
                  <Share2 size={16} color="#4b4b52" strokeWidth={2} /><span>Link de agendamento</span>
                </button>
                {canSettings && (
                  <button className="nb-mi" role="menuitem" onClick={() => { closeMenu(); router.push('/dashboard/configuracoes') }}>
                    <Settings size={16} color="#4b4b52" strokeWidth={2} /><span>Configurações</span>
                  </button>
                )}
                <hr className="nb-hr" />
                <button className="nb-mi" role="menuitem" onClick={() => setConfirmOut(true)}>
                  <LogOut size={16} color="#4b4b52" strokeWidth={2} /><span>Sair</span>
                </button>
              </>
            )}
          </div>
        </>,
        document.body,
      )}

      <div style={{ position:'fixed', top:16, left:0, right:0, display:'flex', justifyContent:'center', zIndex:1000, pointerEvents:'none' }}>
        <header style={{
          pointerEvents:'auto',
          position:'relative',
          width: isMobile ? 'calc(100% - 20px)' : '95%',
          maxWidth:1400,
          height:60,
          borderRadius:18,
          display:'flex', alignItems:'center', gap: isMobile ? 4 : 14,
          padding: isMobile ? '0 6px 0 10px' : '0 10px 0 18px',
          backdropFilter:'var(--glass-blur)',
          WebkitBackdropFilter:'var(--glass-blur)',
          background: scrolled ? 'var(--glass-bg-hover)' : 'var(--glass-bg)',
          border:'1px solid var(--glass-border)',
          boxShadow: scrolled
            ? `0 8px 32px var(--glass-shadow), 0 2px 8px var(--glass-shadow), 0 1px 0 var(--glass-shine) inset`
            : `0 4px 20px var(--glass-shadow), 0 1px 0 var(--glass-shine) inset`,
          transition:'all 280ms cubic-bezier(.4,0,.2,1)',
          animation:'eligi-navbar-in 380ms cubic-bezier(.22,1,.36,1) both',
          overflow:'hidden',
        }}>
          {/* Specular shine */}
          <div aria-hidden style={{ position:'absolute', top:0, left:0, right:0, height:'50%', background:'linear-gradient(180deg,var(--glass-shine) 0%,transparent 100%)', opacity:0.45, pointerEvents:'none', borderRadius:'18px 18px 0 0' }} />

          {/* LEFT — onde estou */}
          <div style={{ display:'flex', alignItems:'center', gap:10, zIndex:1, minWidth:0, flex: isMobile ? '1 1 auto' : '0 1 auto' }}>
            {isMobile && logoBox(32)}
            {pageTitle && (
              <div className="nb-title">
                <b>{pageTitle}</b>
                <span>{isMobile ? subDayShort : subDay}</span>
              </div>
            )}
          </div>

          {/* CENTER — busca */}
          {!isMobile && (
            <button className="eligi-search-bar" onClick={() => setShowSearch(true)} style={{ zIndex:1 }}>
              <Search size={14} color="var(--text-muted)" />
              <span style={{ fontSize:13, color:'var(--text-muted)', flex:1, textAlign:'left' }}>Buscar clientes…</span>
              <kbd style={{ fontSize:10, color:'var(--text-muted)', fontWeight:600, border:'1px solid var(--divider)', padding:'1px 5px', borderRadius:5, background:'var(--surface-1)', letterSpacing:'.01em' }}>⌘K</kbd>
            </button>
          )}

          {/* RIGHT */}
          <div style={{ display:'flex', alignItems:'center', gap:4, zIndex:1, flexShrink:0, marginLeft: isMobile ? 0 : 'auto' }}>
            {isMobile && (
              <button className="eligi-icon-btn" onClick={() => setShowSearch(true)} aria-label="Buscar clientes">
                <Search size={18} />
              </button>
            )}

            {isMobile ? (
              <button className="eligi-icon-btn" onClick={() => setShowShare(true)} aria-label="Link de agendamento">
                <Share2 size={18} />
              </button>
            ) : (
              <button className="nb-link" onClick={() => setShowShare(true)} title="Compartilhar link de agendamento" style={{ marginRight:2 }}>
                <Share2 size={14} color="var(--text-secondary)" strokeWidth={2} />
                Link de agendamento
              </button>
            )}

            {/* Sino — contador grafite (vermelho fica para o que pede ação) */}
            <button className="eligi-icon-btn" onClick={() => setShowNotifs(v => !v)} aria-label={bellLabel}>
              <Bell size={18} />
              {unreadCount > 0 && <span className="nb-badge">{badgeText}</span>}
            </button>

            {/* Conta: logo do estabelecimento + nome; abre o menu */}
            {!isMobile && (
              <button className="nb-acct" onClick={openMenu} aria-haspopup="menu" aria-expanded={menuAt !== null} title={bizName}>
                {logoBox(36)}
                <span className="nb-t">
                  <b>{bizName || firstName}</b>
                  <span>{[firstName, roleLabel].filter(Boolean).join(' · ')}</span>
                </span>
                <ChevronDown size={14} color={NAV_INK3} strokeWidth={2.4} />
              </button>
            )}
          </div>
        </header>
      </div>
    </>
  )
}
