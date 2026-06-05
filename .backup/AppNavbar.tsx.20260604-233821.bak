'use client'

import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/hooks/useAuth'
import { Bell, Sun, Moon, Search, X, Calendar, Users, ChevronRight, Clock } from 'lucide-react'
import { colors, typography, radius, shadows, transitions } from '@/shared/theme'
import { useIsMobile } from '@/hooks/useIsMobile'
import api from '@/shared/lib/apiClient'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useRouter } from 'next/navigation'


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

interface Notification {
  id:      string
  title:   string
  body:    string
  time:    string
  read:    boolean
  type:    'booking' | 'system'
}

// ─── Mock notifications (base para futuro real-time) ─────────────────────────
const MOCK_NOTIFS: Notification[] = [
  { id:'1', title:'Novo agendamento', body:'Lucas Mendes agendou Corte às 14:00', time: dayjs().subtract(5,'minute').toISOString(), read:false, type:'booking' },
  { id:'2', title:'Agendamento cancelado', body:'Rafael Costa cancelou Barba às 10:30', time: dayjs().subtract(1,'hour').toISOString(), read:false, type:'booking' },
  { id:'3', title:'Lembrete', body:'Você tem 3 agendamentos amanhã', time: dayjs().subtract(2,'hour').toISOString(), read:true, type:'system' },
]

// ─── SearchModal ──────────────────────────────────────────────────────────────
function SearchModal({ onClose }: { onClose: () => void }) {
  const router  = useRouter()
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80) }, [])

  // Busca com debounce
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

  // Navegação por teclado
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

        {/* Input */}
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

        {/* Resultados */}
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

        {/* Footer */}
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

// ─── NotifPanel ───────────────────────────────────────────────────────────────
function NotifPanel({ onClose, isMobile }: { onClose: () => void; isMobile: boolean }) {
  const [notifs, setNotifs] = useState<Notification[]>(MOCK_NOTIFS)

  function markAllRead() { setNotifs(n => n.map(x => ({ ...x, read:true }))) }
  function markRead(id: string) { setNotifs(n => n.map(x => x.id===id ? { ...x, read:true } : x)) }

  const unread = notifs.filter(n => !n.read).length

  const panel = (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:9990, background:'rgba(0,0,0,0.12)' }} />
      <div style={isMobile ? {
        position:'fixed', bottom:0, left:0, right:0,
        maxHeight:'80dvh',
        background:'rgba(255,255,255,0.98)',
        borderRadius:'24px 24px 0 0',
        boxShadow:'0 -8px 40px rgba(0,0,0,0.15)',
        zIndex:9991, display:'flex', flexDirection:'column',
        fontFamily:typography.fontFamily,
        animation:'npUp 0.28s cubic-bezier(0.34,1.2,0.64,1)',
        paddingBottom:'max(16px,env(safe-area-inset-bottom))',
      } : {
        position:'fixed', top:80, right:20,
        width:360,
        background:'rgba(255,255,255,0.98)',
        borderRadius:radius['2xl'],
        boxShadow:shadows.lg,
        border:`1px solid ${colors.gray.borderMd}`,
        zIndex:9991, display:'flex', flexDirection:'column',
        fontFamily:typography.fontFamily,
        animation:'npIn 0.18s cubic-bezier(0.34,1.56,0.64,1)',
        maxHeight:'70vh',
      }}>
        <style>{`
          @keyframes npIn{from{opacity:0;transform:translateY(-8px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}
          @keyframes npUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        `}</style>

        {/* Handle mobile */}
        {isMobile && (
          <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 4px' }}>
            <div style={{ width:40, height:4, borderRadius:2, background:'rgba(0,0,0,0.12)' }} />
          </div>
        )}

        {/* Header */}
        <div style={{ padding:'14px 18px', borderBottom:`1px solid ${colors.gray.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:15, fontWeight:700, color:colors.gray[900] }}>Notificações</span>
            {unread > 0 && (
              <span style={{ padding:'1px 8px', borderRadius:radius.full, background:colors.red.gradient, color:'#fff', fontSize:11, fontWeight:700, boxShadow:`0 2px 6px ${colors.red.glow}` }}>{unread}</span>
            )}
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            {unread > 0 && (
              <button onClick={markAllRead} style={{ fontSize:11, fontWeight:600, color:colors.red.DEFAULT, background:'none', border:'none', cursor:'pointer', padding:'4px 8px', borderRadius:radius.sm, transition:transitions.fast }}
                onMouseEnter={e => (e.currentTarget.style.background = colors.red.subtle)}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                Marcar todas como lidas
              </button>
            )}
            <button onClick={onClose} style={{ width:26, height:26, borderRadius:radius.full, border:`1px solid ${colors.gray.borderMd}`, background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <X size={13} color={colors.gray.dimText} />
            </button>
          </div>
        </div>

        {/* Lista */}
        <div style={{ flex:1, overflowY:'auto' }}>
          {notifs.length === 0 ? (
            <div style={{ padding:'48px 20px', textAlign:'center', color:colors.gray.dimText }}>
              <Bell size={28} style={{ opacity:0.2, marginBottom:8 }} />
              <div style={{ fontSize:14, fontWeight:500 }}>Sem notificações</div>
            </div>
          ) : notifs.map(n => (
            <button
              key={n.id}
              onClick={() => markRead(n.id)}
              style={{
                width:'100%', display:'flex', alignItems:'flex-start', gap:12,
                padding:'14px 18px', border:'none',
                borderBottom:`1px solid ${colors.gray.border}`,
                background: n.read ? 'transparent' : colors.red.subtle,
                cursor:'pointer', textAlign:'left',
                transition:`background ${transitions.fast}`,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = n.read ? colors.gray.hover : 'rgba(220,38,38,0.09)')}
              onMouseLeave={e => (e.currentTarget.style.background = n.read ? 'transparent' : colors.red.subtle)}
            >
              {/* Ícone */}
              <div style={{ width:36, height:36, borderRadius:radius.sm, background: n.read ? colors.background.page : 'rgba(220,38,38,0.1)', border:`1px solid ${n.read ? colors.gray.border : colors.red.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                {n.type === 'booking'
                  ? <Calendar size={16} color={n.read ? colors.gray.dimText : colors.red.DEFAULT} strokeWidth={2} />
                  : <Bell     size={16} color={n.read ? colors.gray.dimText : colors.red.DEFAULT} strokeWidth={2} />
                }
              </div>

              {/* Texto */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight: n.read ? 500 : 700, color:colors.gray[900], marginBottom:2 }}>{n.title}</div>
                <div style={{ fontSize:12, color:colors.gray.dimText, lineHeight:1.4 }}>{n.body}</div>
                <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:4 }}>
                  <Clock size={10} color={colors.gray.dimText} />
                  <span style={{ fontSize:11, color:colors.gray.dimText }}>
                    {dayjs(n.time).fromNow()}
                  </span>
                </div>
              </div>

              {/* Dot não lido */}
              {!n.read && (
                <div style={{ width:8, height:8, borderRadius:'50%', background:colors.red.DEFAULT, flexShrink:0, marginTop:4, boxShadow:`0 0 6px ${colors.red.glow}` }} />
              )}
            </button>
          ))}
        </div>
      </div>
    </>
  )

  if (typeof document === 'undefined') return null
  return createPortal(panel, document.body)
}

// ─── AppNavbar ────────────────────────────────────────────────────────────────
export default function AppNavbar() {
  const auth     = useAuth()
  const isMobile = useIsMobile(768)

  const [scrolled,      setScrolled]      = useState(false)
  const [darkMode,      setDarkMode]      = useState<boolean>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('eligi-theme') === 'dark' : false
  )
  const [showSearch,    setShowSearch]    = useState(false)
  const [showNotifs,    setShowNotifs]    = useState(false)
  const [unreadCount,   setUnreadCount]   = useState(MOCK_NOTIFS.filter(n => !n.read).length)
  const [avatarHover,   setAvatarHover]   = useState(false)

  // Dark mode
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark')
    else          document.documentElement.classList.remove('dark')
  }, [darkMode])

  // Scroll
  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 10) }
    window.addEventListener('scroll', onScroll, { passive:true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // ⌘K atalho
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setShowSearch(v => !v) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function toggleTheme() {
    const next = !darkMode
    setDarkMode(next)
    localStorage.setItem('eligi-theme', next ? 'dark' : 'light')
  }

  const firstName = auth?.user?.name?.split(' ')[0] ?? ''
  const initials  = auth?.user?.name
    ?.split(' ').slice(0,2).map((n: string) => n[0]).join('').toUpperCase() ?? '?'

  return (
    <>
      <style>{`
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
      {showNotifs && <NotifPanel onClose={() => { setShowNotifs(false); setUnreadCount(0) }} isMobile={isMobile} />}

      <div style={{ position:'fixed', top:16, left:0, right:0, display:'flex', justifyContent:'center', zIndex:1000, pointerEvents:'none', animation:'eligi-navbar-in 380ms cubic-bezier(.22,1,.36,1) both' }}>
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
          overflow:'hidden',
        }}>
          {/* Specular shine */}
          <div aria-hidden style={{ position:'absolute', top:0, left:0, right:0, height:'50%', background:'linear-gradient(180deg,var(--glass-shine) 0%,transparent 100%)', opacity:0.45, pointerEvents:'none', borderRadius:'18px 18px 0 0' }} />

          {/* LEFT — logo + nome */}
          <div style={{ display:'flex', alignItems:'center', gap:10, zIndex:1 }}>
            <div style={{ width:32, height:32, borderRadius:9, background:'linear-gradient(145deg,#ef4444 0%,#dc2626 60%,#b91c1c 100%)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px var(--eligi-red-glow)', flexShrink:0 }}>
              <span style={{ color:'#fff', fontWeight:800, fontSize:14, letterSpacing:'-0.04em' }}>e</span>
            </div>
            {!isMobile && (
              <span style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', letterSpacing:'-0.02em' }}>
                Olá, {firstName}
              </span>
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

            {/* Dark mode */}
            <button className="eligi-icon-btn" onClick={toggleTheme} title={darkMode ? 'Modo claro' : 'Modo escuro'}>
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Avatar */}
            <div
              onMouseEnter={() => setAvatarHover(true)}
              onMouseLeave={() => setAvatarHover(false)}
              title={auth?.user?.name ?? ''}
              style={{
                marginLeft:4,
                width:36, height:36, borderRadius:10,
                background:'linear-gradient(145deg,#ef4444 0%,#dc2626 60%,#b91c1c 100%)',
                color:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
                fontWeight:700, fontSize:13, cursor:'pointer',
                boxShadow: avatarHover ? '0 6px 20px var(--eligi-red-glow)' : '0 3px 10px var(--eligi-red-glow)',
                transform: avatarHover ? 'scale(1.07)' : 'scale(1)',
                transition:'all 160ms ease', userSelect:'none',
              }}
            >
              {initials}
            </div>
          </div>
        </header>
      </div>
    </>
  )
}