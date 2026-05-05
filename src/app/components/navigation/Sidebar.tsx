'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { navigationByRole, NavItemType } from './navigation.config'
import { useAuth } from '@/hooks/useAuth'
import NavItem from './NavItem'
import { LogOut, MoreHorizontal, X } from 'lucide-react'

const NAVBAR_OFFSET = 104
const BOTTOM_NAV_H  = 64 // height of the mobile bottom bar

/* ── helpers ── */
function getRoleLabel(role?: string) {
  if (role === 'BUSINESS_OWNER') return 'Proprietário'
  if (role === 'PROFESSIONAL')   return 'Profissional'
  return 'Afiliado'
}

/* ============================================================
   MOBILE BOTTOM NAV
   - First 4 items pinned as tabs
   - Overflow items accessible via "Mais" sheet
============================================================ */
function MobileBottomNav({
  navItems,
  user,
  logout,
}: {
  navItems: NavItemType[]
  user: { name?: string; role?: string } | null
  logout: () => void
}) {
  const pathname  = usePathname()
  const [sheetOpen, setSheetOpen] = useState(false)

  // Pin up to 4 items; rest go into the "Mais" sheet
  const pinned   = navItems.slice(0, 4)
  const overflow = navItems.slice(4)
  const hasMore  = overflow.length > 0

  const initials = user?.name
    ?.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase() ?? '?'

  useEffect(() => {
    document.body.style.overflow = sheetOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [sheetOpen])

  // Expose bottom nav height so main content can add padding
  useEffect(() => {
    document.documentElement.style.setProperty('--bottom-nav-h', `${BOTTOM_NAV_H}px`)
    return () => document.documentElement.style.removeProperty('--bottom-nav-h')
  }, [])

  return (
    <>
      <style>{`
        @keyframes eligi-sheet-in {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes eligi-overlay-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* ── Tab item ── */
        .eligi-tab {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          flex: 1;
          padding: 6px 4px;
          border: none;
          background: transparent;
          cursor: pointer;
          text-decoration: none;
          color: rgba(255,255,255,0.40);
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.01em;
          position: relative;
          transition: color 160ms ease, transform 130ms ease;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .eligi-tab.active {
          color: #f87171;
        }
        .eligi-tab:active {
          transform: scale(0.90);
        }
        .eligi-tab svg {
          transition: transform 160ms ease, opacity 160ms ease;
        }
        .eligi-tab:active svg {
          transform: scale(0.88);
        }

        /* Active pip */
        .eligi-tab.active::after {
          content: '';
          position: absolute;
          bottom: 2px;
          left: 50%;
          transform: translateX(-50%);
          width: 18px;
          height: 2.5px;
          background: #ef4444;
          border-radius: 999px;
          box-shadow: 0 0 6px rgba(239,68,68,0.6);
        }

        /* ── Sheet item ── */
        .eligi-sheet-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 13px 16px;
          border-radius: 14px;
          border: 1px solid transparent;
          background: transparent;
          text-decoration: none;
          color: rgba(255,255,255,0.82);
          font-size: 14px;
          font-weight: 500;
          transition: background 150ms ease, color 150ms ease, transform 120ms ease;
          -webkit-tap-highlight-color: transparent;
        }
        .eligi-sheet-item.active {
          background: rgba(220,38,38,0.16);
          border-color: rgba(220,38,38,0.20);
          color: #f87171;
        }
        .eligi-sheet-item:active {
          transform: scale(0.97);
        }
        .eligi-sheet-item:not(.active):active {
          background: rgba(255,255,255,0.06);
        }

        /* ── Logout sheet ── */
        .eligi-sheet-logout {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 13px 16px;
          border-radius: 14px;
          border: none;
          background: transparent;
          width: 100%;
          cursor: pointer;
          color: rgba(255,255,255,0.82);
          font-size: 14px;
          font-weight: 500;
          transition: background 150ms ease, color 150ms ease, transform 120ms ease;
          -webkit-tap-highlight-color: transparent;
        }
        .eligi-sheet-logout:active {
          background: rgba(220,38,38,0.10);
          color: #f87171;
          transform: scale(0.97);
        }
      `}</style>

      {/* ── Sheet overlay ── */}
      {sheetOpen && (
        <div
          onClick={() => setSheetOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)',
            zIndex: 58,
            animation: 'eligi-overlay-in 200ms ease',
          }}
        />
      )}

      {/* ── Overflow sheet ── */}
      {sheetOpen && (
        <div style={{
          position: 'fixed',
          bottom: `${BOTTOM_NAV_H}px`,
          left: 0, right: 0,
          zIndex: 59,
          background: 'rgba(14,14,20,0.97)',
          backdropFilter: 'blur(24px) saturate(160%)',
          WebkitBackdropFilter: 'blur(24px) saturate(160%)',
          borderTop: '1px solid rgba(255,255,255,0.09)',
          borderRadius: '20px 20px 0 0',
          padding: '8px 12px 12px',
          animation: 'eligi-sheet-in 260ms cubic-bezier(.22,1,.36,1)',
          color: 'rgba(255,255,255,0.88)',
        }}>
          {/* Drag handle */}
          <div style={{
            width: '36px', height: '4px',
            background: 'rgba(255,255,255,0.18)',
            borderRadius: '999px',
            margin: '6px auto 14px',
          }} />

          {/* User card */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '12px 16px', borderRadius: '14px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            marginBottom: '10px',
          }}>
            <div style={{
              width:'38px', height:'38px', borderRadius:'11px', flexShrink:0,
              background:'linear-gradient(145deg,#ef4444 0%,#dc2626 60%,#b91c1c 100%)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'14px', fontWeight:700, color:'#fff',
              boxShadow:'0 3px 10px rgba(220,38,38,0.35)',
            }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow:'hidden' }}>
              <div style={{ fontSize:'14px', fontWeight:600, color:'rgba(255,255,255,0.90)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                {user?.name}
              </div>
              <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.42)', marginTop:'2px' }}>
                {getRoleLabel(user?.role)}
              </div>
            </div>
          </div>

          {/* Overflow nav items */}
          {overflow.length > 0 && (
            <div style={{ display:'flex', flexDirection:'column', gap:'2px', marginBottom:'8px' }}>
              {overflow.map(item => {
                const Icon = item.icon
                const active = pathname === item.path
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`eligi-sheet-item${active ? ' active' : ''}`}
                    onClick={() => setSheetOpen(false)}
                  >
                    <Icon size={20} style={{ flexShrink:0, opacity: active ? 1 : 0.70 }} />
                    {item.label}
                    {active && (
                      <div style={{
                        marginLeft:'auto',
                        width:'6px', height:'6px', borderRadius:'50%',
                        background:'#ef4444',
                        boxShadow:'0 0 6px rgba(239,68,68,0.7)',
                      }} />
                    )}
                  </Link>
                )
              })}
            </div>
          )}

          {/* Divider */}
          <div style={{
            height:'1px', background:'rgba(255,255,255,0.07)',
            margin:'4px 4px 8px', borderRadius:'999px',
          }} />

          {/* Logout */}
          <button className="eligi-sheet-logout" onClick={() => { setSheetOpen(false); logout() }}>
            <LogOut size={20} style={{ flexShrink:0, opacity:0.70 }} />
            Sair da conta
          </button>
        </div>
      )}

      {/* ── Bottom bar ── */}
      <nav
        aria-label="Navegação inferior"
        style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          height: `${BOTTOM_NAV_H}px`,
          zIndex: 60,
          display: 'flex',
          alignItems: 'stretch',
          background: 'rgba(12,12,18,0.92)',
          backdropFilter: 'blur(24px) saturate(160%)',
          WebkitBackdropFilter: 'blur(24px) saturate(160%)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.28)',
          // Safe area for notch phones
          paddingBottom: 'env(safe-area-inset-bottom)',
          color: 'rgba(255,255,255,0.88)',
        }}
      >
        {pinned.map(item => {
          const Icon   = item.icon
          const active = pathname === item.path
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`eligi-tab${active ? ' active' : ''}`}
            >
              <Icon size={22} />
              <span>{item.label}</span>
            </Link>
          )
        })}

        {/* "Mais" tab — opens sheet with overflow + logout */}
        {hasMore && (
          <button
            className={`eligi-tab${sheetOpen ? ' active' : ''}`}
            onClick={() => setSheetOpen(v => !v)}
            aria-label="Mais opções"
          >
            {sheetOpen
              ? <X size={22} />
              : <MoreHorizontal size={22} />
            }
            <span>Mais</span>
          </button>
        )}

        {/* If no overflow, show logout as last tab */}
        {!hasMore && (
          <button
            className="eligi-tab"
            onClick={logout}
            aria-label="Sair"
          >
            <LogOut size={22} />
            <span>Sair</span>
          </button>
        )}
      </nav>
    </>
  )
}

/* ============================================================
   SIDEBAR (desktop rail)
============================================================ */
export default function Sidebar() {
  const { user, logout } = useAuth()

  const [hovered,  setHovered]  = useState(false)
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  )
  const [mounted] = useState<boolean>(() => typeof window !== 'undefined')
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 1024)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  function onEnter() {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setHovered(true)
  }
  function onLeave() {
    closeTimer.current = setTimeout(() => setHovered(false), 120)
  }

  const expanded     = !isMobile && hovered
  const sidebarWidth = expanded ? '220px' : '64px'

  // Sync CSS vars
  useEffect(() => {
    if (isMobile) {
      document.documentElement.style.setProperty('--sidebar-width', '0px')
    } else {
      document.documentElement.style.setProperty('--sidebar-width', sidebarWidth)
      document.documentElement.style.setProperty('--navbar-offset', `${NAVBAR_OFFSET}px`)
    }
  }, [sidebarWidth, isMobile])

  if (!user || !mounted) return null

  const navItems: NavItemType[] = navigationByRole[user.role]
  const sections = {
    principal:  navItems.filter(i => i.section === 'principal'),
    financeiro: navItems.filter(i => i.section === 'financeiro'),
    gestao:     navItems.filter(i => i.section === 'gestao'),
    admin:      navItems.filter(i => i.section === 'admin'),
  }

  const initials = user?.name
    ?.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase() ?? '?'

  /* ── Mobile → bottom nav ── */
  if (isMobile) {
    return (
      <MobileBottomNav
        navItems={navItems}
        user={user}
        logout={logout}
      />
    )
  }

  /* ── Desktop → vertical rail ── */
  return (
    <>
      <style>{`
        @keyframes eligi-slide-in {
          from { opacity: 0; transform: translateX(-16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes eligi-label-in {
          from { opacity: 0; transform: translateX(-5px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .eligi-sb-scroll { scrollbar-width: none; }
        .eligi-sb-scroll::-webkit-scrollbar { display: none; }
        .eligi-sec-div {
          height: 1px;
          background: rgba(255,255,255,0.07);
          margin: 6px 4px;
          border-radius: 999px;
        }
        .eligi-sec-label {
          font-size: 9.5px; font-weight: 700;
          letter-spacing: 0.10em; text-transform: uppercase;
          color: rgba(255,255,255,0.88);
          padding: 0 12px; margin: 8px 0 3px;
          white-space: nowrap;
          animation: eligi-label-in 160ms ease both;
        }
        .eligi-logout-btn {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 0; width: 100%; border: none;
          border-radius: 12px; background: transparent; cursor: pointer;
          color: rgba(255,255,255,0.85); font-size: 13px; font-weight: 500;
          justify-content: center;
          transition: background 160ms ease, color 160ms ease, transform 130ms ease;
        }
        .eligi-logout-btn.exp { padding: 10px 12px; justify-content: flex-start; }
        .eligi-logout-btn:hover { background: rgba(220,38,38,0.12); color: #ffffff; }
        .eligi-logout-btn:active { transform: scale(0.95); }
      `}</style>

      <aside
        aria-label="Navegação lateral"
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        style={{
          width: sidebarWidth,
          position: 'fixed',
          top: 0, left: 0,
          height: '100dvh',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(12,12,18,0.86)',
          backdropFilter: 'blur(24px) saturate(160%)',
          WebkitBackdropFilter: 'blur(24px) saturate(160%)',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          boxShadow: expanded
            ? '4px 0 40px rgba(0,0,0,0.38), 1px 0 0 rgba(255,255,255,0.04)'
            : '1px 0 0 rgba(255,255,255,0.04)',
          transition: 'width 230ms cubic-bezier(.4,0,.2,1), box-shadow 230ms ease',
          overflowX: 'hidden',
          overflowY: 'hidden',
          color: 'rgba(255,255,255,0.88)',
          animation: mounted ? 'eligi-slide-in 300ms cubic-bezier(.22,1,.36,1) both' : 'none',
        }}
      >
        {/* Specular shine */}
        <div aria-hidden style={{
          position:'absolute', top:0, left:0, right:0, height:'28%',
          background:'linear-gradient(180deg,rgba(255,255,255,0.035) 0%,transparent 100%)',
          pointerEvents:'none', zIndex:0,
        }} />

        {/* Nav scroll */}
        <div
          className="eligi-sb-scroll"
          style={{
            flex: 1, overflowY:'auto', overflowX:'hidden',
            paddingTop: `${NAVBAR_OFFSET + 12}px`,
            paddingBottom: '12px',
            paddingLeft: expanded ? '8px' : '4px',
            paddingRight: expanded ? '8px' : '4px',
            display:'flex', flexDirection:'column',
            position:'relative', zIndex:1,
            transition:'padding-left 230ms cubic-bezier(.4,0,.2,1), padding-right 230ms cubic-bezier(.4,0,.2,1)',
          }}
        >
          <RailSections sections={sections} expanded={expanded} />
        </div>

        {/* Footer */}
        <div style={{
          borderTop:'1px solid rgba(255,255,255,0.07)',
          padding: expanded ? '10px 8px' : '10px 4px',
          display:'flex', flexDirection:'column', gap:'4px',
          position:'relative', zIndex:1,
          transition:'padding 230ms cubic-bezier(.4,0,.2,1)',
        }}>
          {expanded ? (
            <div style={{
              display:'flex', alignItems:'center', gap:'10px',
              padding:'10px 12px', borderRadius:'12px',
              background:'rgba(255,255,255,0.05)',
              border:'1px solid rgba(255,255,255,0.08)',
              marginBottom:'4px',
              animation:'eligi-label-in 180ms ease both',
            }}>
              <div style={{
                width:'34px', height:'34px', borderRadius:'10px', flexShrink:0,
                background:'linear-gradient(145deg,#ef4444 0%,#dc2626 60%,#b91c1c 100%)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'13px', fontWeight:700, color:'#fff',
                boxShadow:'0 3px 8px rgba(220,38,38,0.35)',
              }}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div style={{ overflow:'hidden', flex:1 }}>
                <div style={{ fontSize:'13px', fontWeight:600, color:'rgba(255,255,255,0.88)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                  {user?.name}
                </div>
                <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.60)', marginTop:'1px' }}>
                  {getRoleLabel(user?.role)}
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              width:'36px', height:'36px', borderRadius:'10px', margin:'0 auto 4px',
              background:'linear-gradient(145deg,#ef4444 0%,#dc2626 60%,#b91c1c 100%)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'12px', fontWeight:700, color:'#fff',
              boxShadow:'0 3px 8px rgba(220,38,38,0.30)',
            }}>
              {initials}
            </div>
          )}

          <button
            className={`eligi-logout-btn${expanded ? ' exp' : ''}`}
            onClick={logout}
            title="Sair da conta"
          >
            <LogOut size={18} style={{ flexShrink:0 }} />
            {expanded && (
              <span style={{ animation:'eligi-label-in 180ms ease both' }}>
                Sair da conta
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  )
}

/* ============================================================
   RAIL SECTIONS (desktop)
============================================================ */
function RailSections({
  sections,
  expanded,
}: {
  sections: Record<string, NavItemType[]>
  expanded: boolean
}) {
  const order = [
    { key: 'principal',  label: 'Principal'  },
    { key: 'financeiro', label: 'Financeiro' },
    { key: 'gestao',     label: 'Gestão'     },
    { key: 'admin',      label: 'Admin'      },
  ] as const

  const nonEmpty = order.filter(s => sections[s.key].length > 0)

  return (
    <>
      {nonEmpty.map((s, idx) => (
        <div key={s.key}>
          {idx > 0 && <div className="eligi-sec-div" />}
          {expanded && <div className="eligi-sec-label">{s.label}</div>}
          <div style={{ display:'flex', flexDirection:'column', gap:'1px' }}>
            {sections[s.key].map(item => (
              <NavItem key={item.path} item={item} collapsed={!expanded} />
            ))}
          </div>
        </div>
      ))}
    </>
  )
}