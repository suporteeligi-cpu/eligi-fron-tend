'use client'

import { useState, useEffect, useRef } from 'react'
import { navigationByRole, NavItemType } from './navigation.config'
import { useAuth } from '@/hooks/useAuth'
import NavItem from './NavItem'
import { LogOut } from 'lucide-react'

const NAVBAR_OFFSET = 104

/* ── helpers ── */
function getRoleLabel(role?: string) {
  if (role === 'BUSINESS_OWNER') return 'Proprietário'
  if (role === 'PROFESSIONAL')   return 'Profissional'
  return 'Afiliado'
}

/* ── Sidebar ── */
export default function Sidebar() {
  const { user, logout } = useAuth()

  const [hovered,      setHovered]      = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isMobile,     setIsMobile]     = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  )
  const [mounted] = useState<boolean>(() => typeof window !== 'undefined')
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function handleResize() {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (!mobile) setIsMobileOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isMobileOpen])

  function onEnter() {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setHovered(true)
  }
  function onLeave() {
    closeTimer.current = setTimeout(() => setHovered(false), 120)
  }

  // Derived — computed before any hook so order is always stable
  const expanded     = isMobile || hovered
  const sidebarWidth = isMobile ? '260px' : (expanded ? '220px' : '64px')

  // Must be before early return — Rules of Hooks
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--sidebar-width',
      isMobile ? '0px' : sidebarWidth
    )
    // Also expose navbar offset for other components
    document.documentElement.style.setProperty('--navbar-offset', `${NAVBAR_OFFSET}px`)
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

  return (
    <>
      <style>{`
        @keyframes eligi-slide-in {
          from { opacity: 0; transform: translateX(-16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes eligi-overlay-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes eligi-label-in {
          from { opacity: 0; transform: translateX(-5px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        .eligi-sb-scroll { scrollbar-width: none; }
        .eligi-sb-scroll::-webkit-scrollbar { display: none; }

        /* ── Section divider ── */
        .eligi-sec-div {
          height: 1px;
          background: rgba(255,255,255,0.07);
          margin: 6px 4px;
          border-radius: 999px;
        }

        /* ── Section label ── */
        .eligi-sec-label {
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.10em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.88);
          padding: 0 12px;
          margin: 8px 0 3px;
          white-space: nowrap;
          animation: eligi-label-in 160ms ease both;
        }

        /* ── Logout ── */
        .eligi-logout-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 0;
          width: 100%;
          border: none;
          border-radius: 12px;
          background: transparent;
          cursor: pointer;
          color: rgba(255,255,255,0.85);
          font-size: 13px;
          font-weight: 500;
          justify-content: center;
          transition: background 160ms ease, color 160ms ease, transform 130ms ease;
        }
        .eligi-logout-btn.exp {
          padding: 10px 12px;
          justify-content: flex-start;
        }
        .eligi-logout-btn:hover {
          background: rgba(220,38,38,0.12);
          color: #ffffff;
        }
        .eligi-logout-btn:active { transform: scale(0.95); }

        /* ── Hamburger ── */
        .eligi-hamburger {
          position: fixed;
          top: 22px; left: 16px;
          z-index: 60;
          width: 44px; height: 44px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(14,14,20,0.88);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          cursor: pointer;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 4px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.30);
          transition: all 200ms ease;
        }
        .eligi-hamburger:hover {
          border-color: rgba(220,38,38,0.28);
        }
      `}</style>

      {/* ── Mobile hamburger ── */}
      {isMobile && (
        <button
          className="eligi-hamburger"
          onClick={() => setIsMobileOpen(true)}
          aria-label="Abrir menu"
        >
          {[0,1,2].map(i => (
            <span key={i} style={{
              display: 'block',
              width: i === 1 ? '14px' : '18px',
              height: '2px',
              borderRadius: '99px',
              background: 'rgba(255,255,255,0.78)',
            }} />
          ))}
        </button>
      )}

      {/* ── Mobile overlay ── */}
      {isMobile && isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 49,
            animation: 'eligi-overlay-in 220ms ease',
          }}
        />
      )}

      {/* ── Sidebar aside ── */}
      <aside
        aria-label="Navegação lateral"
        onMouseEnter={!isMobile ? onEnter : undefined}
        onMouseLeave={!isMobile ? onLeave : undefined}
        style={{
          width: sidebarWidth,
          position: 'fixed',
          top: 0,
          left: isMobile && !isMobileOpen ? '-100%' : '0',
          height: '100dvh',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(12, 12, 18, 0.86)',
          backdropFilter: 'blur(24px) saturate(160%)',
          WebkitBackdropFilter: 'blur(24px) saturate(160%)',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          boxShadow: expanded
            ? '4px 0 40px rgba(0,0,0,0.38), 1px 0 0 rgba(255,255,255,0.04)'
            : '1px 0 0 rgba(255,255,255,0.04)',
          transition: 'width 230ms cubic-bezier(.4,0,.2,1), left 280ms cubic-bezier(.4,0,.2,1), box-shadow 230ms ease',
          overflowX: 'hidden',
          overflowY: 'hidden',
          color: 'rgba(255,255,255,0.88)',
          animation: mounted ? 'eligi-slide-in 300ms cubic-bezier(.22,1,.36,1) both' : 'none',
        }}
      >
        {/* Top specular shine */}
        <div aria-hidden style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '28%',
          background: 'linear-gradient(180deg,rgba(255,255,255,0.035) 0%,transparent 100%)',
          pointerEvents: 'none', zIndex: 0,
        }} />

        {/* ── Mobile header ── */}
        {isMobile && (
          <div style={{
            padding: '22px 16px 14px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            position: 'relative', zIndex: 1,
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <div style={{
                width:'32px', height:'32px', borderRadius:'10px',
                background:'linear-gradient(145deg,#ef4444 0%,#dc2626 60%,#b91c1c 100%)',
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:'0 4px 12px rgba(220,38,38,0.35)',
              }}>
                <span style={{ color:'#fff', fontWeight:800, fontSize:'14px' }}>e</span>
              </div>
              <span style={{ fontWeight:700, fontSize:'16px', color:'rgba(255,255,255,0.90)', letterSpacing:'-0.03em' }}>
                eligi
              </span>
            </div>
            <button
              onClick={() => setIsMobileOpen(false)}
              style={{
                width:'30px', height:'30px', borderRadius:'8px',
                border:'1px solid rgba(255,255,255,0.10)',
                background:'rgba(255,255,255,0.05)',
                cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                color:'rgba(255,255,255,0.50)', fontSize:'13px',
              }}
            >✕</button>
          </div>
        )}

        {/* ── Nav items ── */}
        <div
          className="eligi-sb-scroll"
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            paddingTop: `${NAVBAR_OFFSET + 12}px`,
            paddingBottom: '12px',
            paddingLeft: expanded ? '8px' : '4px',
            paddingRight: expanded ? '8px' : '4px',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            zIndex: 1,
            transition: 'padding-left 230ms cubic-bezier(.4,0,.2,1), padding-right 230ms cubic-bezier(.4,0,.2,1)',
          }}
        >
          <RailSections sections={sections} expanded={expanded} />
        </div>

        {/* ── Footer ── */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.07)',
          padding: expanded ? '10px 8px' : '10px 4px',
          display: 'flex', flexDirection: 'column', gap: '4px',
          position: 'relative', zIndex: 1,
          transition: 'padding 230ms cubic-bezier(.4,0,.2,1)',
        }}>
          {/* User expanded card */}
          {expanded ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', borderRadius: '12px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              marginBottom: '4px',
              animation: 'eligi-label-in 180ms ease both',
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
            /* User collapsed avatar */
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
   RAIL SECTIONS
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
          {expanded && (
            <div className="eligi-sec-label">{s.label}</div>
          )}
          <div style={{ display:'flex', flexDirection:'column', gap:'1px' }}>
            {sections[s.key].map(item => (
              <NavItem
                key={item.path}
                item={item}
                collapsed={!expanded}
              />
            ))}
          </div>
        </div>
      ))}
    </>
  )
}