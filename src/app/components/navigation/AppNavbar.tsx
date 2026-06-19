'use client'

import { useEffect, useState, useRef, useCallback, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/hooks/useAuth'
import {
  Bell, Sun, Moon, Search, X, Calendar, Users, ChevronRight, Clock, Share2, Store,
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
import { useRouter } from 'next/navigation'
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

export default function AppNavbar() {
  const auth     = useAuth()
  const isMobile = useIsMobile(768)

  const [scrolled,    setScrolled]    = useState(false)
  const [darkMode,    setDarkMode]    = useState<boolean>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('eligi-theme') === 'dark' : false
  )
  const [showSearch,  setShowSearch]  = useState(false)
  const [showNotifs,  setShowNotifs]  = useState(false)
  const [showShare,   setShowShare]   = useState(false)
  const [qrDataUrl,   setQrDataUrl]   = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [toast,       setToast]       = useState<ToastState>(null)
  const [refreshKey,  setRefreshKey]  = useState(0)
  const [avatarHover, setAvatarHover] = useState(false)
  const [shareHover,  setShareHover]  = useState(false)
  const [themeNotice, setThemeNotice] = useState(false)
  const [themeShake,  setThemeShake]  = useState(false)

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
  const onNotifRef = useRef<(n: NotifItem) => void>(() => {})
  useLayoutEffect(() => {
    onNotifRef.current = (n: NotifItem) => {
      setUnreadCount(c => c + 1)
      setToast({ kind: 'item', notif: n })
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
    socket.on('notification:created', (n: NotifItem) => onNotifRef.current(n))
    const ping = setInterval(() => { if (socket.connected) socket.emit('ping') }, 25_000)
    return () => {
      clearInterval(ping)
      socket.emit('leave:business', businessId)
      socket.disconnect()
    }
  }, [businessId])

  function toggleTheme() {
    const next = !darkMode
    setDarkMode(next)
    localStorage.setItem('eligi-theme', next ? 'dark' : 'light')
  }
  /** TEMPORARIO: modo escuro ainda em desenvolvimento. Bloqueia o clique
   *  mantendo toggleTheme/darkMode intactos. Reativar = trocar onClick de volta. */
  function denyTheme() {
    setThemeShake(true)
    setThemeNotice(true)
    window.setTimeout(() => setThemeShake(false), 380)
    window.setTimeout(() => setThemeNotice(false), 2600)
  }

  const firstName = auth?.user?.name?.split(' ')[0] ?? ''
  const roleLabel = ROLE_LABEL[auth?.user?.role ?? ''] ?? ''
  const logoUrl   = auth?.user?.logoUrl ?? null
  const bizName   = auth?.user?.businessName ?? ''

  return (
    <>
      {themeNotice && (
        <div
          role="status"
          style={{
            position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)',
            zIndex: 999999,
            padding: '10px 16px',
            background: 'rgba(24,24,27,0.92)',
            color: '#fff',
            borderRadius: 12,
            fontSize: 13, fontWeight: 500,
            boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            animation: 'eligi-theme-toast-in 0.18s ease-out',
          }}
        >
          Modo escuro em desenvolvimento. Volta em breve.
        </div>
      )}
      <style>{`
        @keyframes eligi-shake {
          0%, 100% { transform: translateX(0); }
          15%, 55% { transform: translateX(-3px); }
          30%, 70% { transform: translateX(3px); }
          85%      { transform: translateX(-1px); }
        }
        .eligi-shake { animation: eligi-shake 0.38s ease-in-out; }
        @keyframes eligi-theme-toast-in {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes eligi-pulse {
          0%   { transform:scale(1);   opacity:0.85; }
          65%  { transform:scale(2.6); opacity:0; }
          100% { transform:scale(2.6); opacity:0; }
        }
        @keyframes eligi-navbar-in {
          from { opacity:0; transform:translateY(-10px) scale(0.98); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        .eligi-icon-btn {
          position:relative; width:38px; height:38px; border-radius:11px;
          border:1px solid transparent; background:transparent; cursor:pointer;
          display:flex; align-items:center; justify-content:center;
          color:var(--text-secondary);
          transition:background 160ms ease, border-color 160ms ease, color 160ms ease, transform 130ms ease;
          -webkit-tap-highlight-color:transparent;
        }
        .eligi-icon-btn:hover { background:var(--surface-1); border-color:var(--glass-border); color:var(--text-primary); }
        .eligi-icon-btn:active { transform:scale(0.91); }
        .eligi-search-bar {
          display:flex; align-items:center; gap:8px;
          padding:7px 14px; border-radius:11px;
          background:var(--surface-2); border:1px solid var(--divider);
          cursor:pointer; transition:all 160ms ease;
          min-width:180px;
        }
        .eligi-search-bar:hover { background:var(--surface-1); border-color:var(--glass-border); }
      `}</style>

      {showSearch && <SearchModal onClose={() => setShowSearch(false)} />}
      {showNotifs && <NotifPanel onClose={() => setShowNotifs(false)} isMobile={isMobile} refreshKey={refreshKey} onUnread={setUnreadCount} />}
      {showShare  && <ShareProfileModal onClose={() => setShowShare(false)} qrDataUrl={qrDataUrl} />}
      {toast && <NotifToast toast={toast} isMobile={isMobile} onClose={() => setToast(null)} />}

      <div style={{ position:'fixed', top:16, left:0, right:0, display:'flex', justifyContent:'center', zIndex:1000, pointerEvents:'none' }}>
        <header style={{
          pointerEvents:'auto',
          position:'relative',
          width: isMobile ? 'calc(100% - 20px)' : '95%',
          maxWidth:1400,
          height:60,
          borderRadius:18,
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding: isMobile ? '0 12px' : '0 18px',
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

          {/* LEFT — avatar do usuário + saudação + cargo */}
          <div style={{ display:'flex', alignItems:'center', gap:10, zIndex:1 }}>
            <div style={{ borderRadius:'50%', padding:2, border:'2px solid var(--glass-border)', display:'flex', flexShrink:0 }}>
              <ProfAvatar name={auth?.user?.name ?? '?'} avatarUrl={auth?.user?.avatarUrl ?? undefined} size={32} />
            </div>
            {!isMobile && (
              <div style={{ display:'flex', flexDirection:'column', lineHeight:1.2, minWidth:0 }}>
                <span style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', letterSpacing:'-0.02em', whiteSpace:'nowrap' }}>
                  Olá, {firstName}
                </span>
                {roleLabel && (
                  <span style={{ fontSize:11, color:'var(--text-muted)', whiteSpace:'nowrap' }}>{roleLabel}</span>
                )}
              </div>
            )}
          </div>

          {/* CENTER — search bar (desktop) / search icon (mobile) */}
          {!isMobile ? (
            <button className="eligi-search-bar" onClick={() => setShowSearch(true)} style={{ zIndex:1 }}>
              <Search size={13} color="var(--text-muted)" />
              <span style={{ fontSize:13, color:'var(--text-muted)', flex:1, textAlign:'left' }}>Buscar clientes...</span>
              <kbd style={{ fontSize:10, color:'var(--text-muted)', fontWeight:600, border:'1px solid var(--divider)', padding:'1px 5px', borderRadius:5, background:'var(--surface-1)', letterSpacing:'.01em' }}>⌘K</kbd>
            </button>
          ) : (
            <button className="eligi-icon-btn" onClick={() => setShowSearch(true)} style={{ zIndex:1 }} title="Buscar">
              <Search size={18} />
            </button>
          )}

          {/* RIGHT */}
          <div style={{ display:'flex', alignItems:'center', gap:4, zIndex:1 }}>

            {/* ── Botão Link de agendamento ── */}
            {!isMobile && (
              <button
                onClick={() => setShowShare(true)}
                onMouseEnter={() => setShareHover(true)}
                onMouseLeave={() => setShareHover(false)}
                title="Compartilhar link de agendamento"
                style={{
                  display:      'flex',
                  alignItems:   'center',
                  gap:          6,
                  padding:      '6px 13px',
                  borderRadius: 10,
                  border:       `1px solid ${shareHover ? 'var(--glass-border)' : 'var(--divider)'}`,
                  background:   shareHover ? 'var(--surface-1)' : 'var(--surface-2)',
                  cursor:       'pointer',
                  fontSize:     12,
                  fontWeight:   600,
                  color:        'var(--text-primary)',
                  transition:   'all 160ms ease',
                  whiteSpace:   'nowrap',
                  fontFamily:   typography.fontFamily,
                  marginRight:  4,
                }}
              >
                <Share2 size={13} color="var(--text-secondary)" strokeWidth={2} />
                Link de agendamento
              </button>
            )}

            {/* Mobile: só ícone */}
            {isMobile && (
              <button
                className="eligi-icon-btn"
                onClick={() => setShowShare(true)}
                title="Link de agendamento"
              >
                <Share2 size={18} />
              </button>
            )}

            {/* Bell */}
            <button
              className="eligi-icon-btn"
              onClick={() => setShowNotifs(v => !v)}
              title="Notificações"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <>
                  <span style={{ position:'absolute', top:8, right:8, width:7, height:7, borderRadius:'50%', background:'var(--eligi-red)', border:'1.5px solid transparent', zIndex:2 }} />
                  <span style={{ position:'absolute', top:8, right:8, width:7, height:7, borderRadius:'50%', background:'var(--eligi-red)', animation:'eligi-pulse 1.8s ease-out infinite', zIndex:1 }} />
                </>
              )}
            </button>

            {/* Dark mode - TEMPORARIAMENTE em desenvolvimento (denyTheme) */}
            <button
              className={`eligi-icon-btn${themeShake ? ' eligi-shake' : ''}`}
              onClick={denyTheme}
              title="Modo escuro em desenvolvimento"
              aria-disabled="true"
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Logo do estabelecimento + nome */}
            {!isMobile && bizName && (
              <span style={{ fontSize:12, fontWeight:600, color:'var(--text-secondary)', whiteSpace:'nowrap', marginLeft:2, maxWidth:140, overflow:'hidden', textOverflow:'ellipsis' }}>
                {bizName}
              </span>
            )}
            <div
              onMouseEnter={() => setAvatarHover(true)}
              onMouseLeave={() => setAvatarHover(false)}
              title={bizName}
              style={{
                marginLeft:4,
                width:36, height:36, borderRadius:10,
                background: logoUrl ? 'var(--surface-2)' : 'linear-gradient(145deg,#ef4444 0%,#dc2626 60%,#b91c1c 100%)',
                border:'1px solid var(--glass-border)',
                display:'flex', alignItems:'center', justifyContent:'center',
                cursor:'pointer', overflow:'hidden', flexShrink:0,
                boxShadow: avatarHover ? '0 6px 18px rgba(0,0,0,0.18)' : '0 2px 8px rgba(0,0,0,0.10)',
                transform: avatarHover ? 'scale(1.07)' : 'scale(1)',
                transition:'all 160ms ease', userSelect:'none',
              }}
            >
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt={bizName || 'Logo'} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              ) : (
                <Store size={18} color="#fff" strokeWidth={2} />
              )}
            </div>
          </div>
        </header>
      </div>
    </>
  )
}
