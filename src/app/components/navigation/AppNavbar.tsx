'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Bell, Sun, Moon, Search } from 'lucide-react'
import { useSocketStatus } from '@/hooks/useSocketStatus'

export default function AppNavbar() {
  const auth = useAuth()

  const [scrolled, setScrolled] = useState(false)
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('eligi-theme') === 'dark'
  })
  const [hasNotification, setHasNotification] = useState(true)
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' && window.innerWidth < 768
  )
  const [bellHover, setBellHover]     = useState(false)
  const [themeHover, setThemeHover]   = useState(false)
  const [avatarHover, setAvatarHover] = useState(false)

  const [token] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('accessToken')
  })

  const connected = useSocketStatus(token)

  // Sync dark class — sem setState no corpo do effect
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark')
    else          document.documentElement.classList.remove('dark')
  }, [darkMode])

  // Scroll + resize — funções internas, zero deps extras
  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 10) }
    function onResize() { setIsMobile(window.innerWidth < 768) }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  function toggleTheme() {
    const next = !darkMode
    setDarkMode(next)
    localStorage.setItem('eligi-theme', next ? 'dark' : 'light')
  }

  const firstName = auth?.user?.name?.split(' ')[0] ?? ''
  const initials  = auth?.user?.name
    ?.split(' ').slice(0, 2)
    .map((n: string) => n[0])
    .join('').toUpperCase() ?? '?'

  return (
    <>
      <style>{`
        @keyframes eligi-pulse {
          0%   { transform: scale(1);   opacity: 0.85; }
          65%  { transform: scale(2.6); opacity: 0; }
          100% { transform: scale(2.6); opacity: 0; }
        }
        @keyframes eligi-navbar-in {
          from { opacity: 0; transform: translateY(-10px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)     scale(1); }
        }
        .eligi-icon-btn {
          position: relative;
          width: 42px; height: 42px;
          border-radius: 12px;
          border: 1px solid transparent;
          background: transparent;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: var(--text-secondary);
          transition: background 180ms ease, border-color 180ms ease,
                      color 180ms ease, transform 140ms ease, box-shadow 180ms ease;
        }
        .eligi-icon-btn:hover {
          background: var(--surface-1);
          border-color: var(--glass-border);
          color: var(--text-primary);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px var(--glass-shadow);
        }
        .eligi-icon-btn:active {
          transform: scale(0.93);
          box-shadow: none;
        }
        .eligi-search {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 14px;
          border-radius: 12px;
          background: var(--surface-2);
          border: 1px solid var(--divider);
          cursor: pointer;
          transition: all 180ms ease;
          user-select: none;
        }
        .eligi-search:hover {
          background: var(--surface-1);
          border-color: var(--glass-border);
        }
      `}</style>

      <div
        style={{
          position: 'fixed',
          top: '20px',
          left: 0, right: 0,
          display: 'flex',
          justifyContent: 'center',
          zIndex: 1000,
          pointerEvents: 'none',
          animation: 'eligi-navbar-in 380ms cubic-bezier(.22,1,.36,1) both',
        }}
      >
        <header
          style={{
            pointerEvents: 'auto',
            position: 'relative',
            width: isMobile ? 'calc(100% - 24px)' : '95%',
            maxWidth: '1400px',
            height: '64px',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isMobile ? '0 14px' : '0 20px',
            backdropFilter: 'var(--glass-blur)',
            WebkitBackdropFilter: 'var(--glass-blur)',
            background: scrolled ? 'var(--glass-bg-hover)' : 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            boxShadow: scrolled
              ? `0 8px 32px var(--glass-shadow), 0 2px 8px var(--glass-shadow), 0 1px 0 var(--glass-shine) inset`
              : `0 4px 20px var(--glass-shadow), 0 1px 0 var(--glass-shine) inset`,
            transition: 'all 280ms cubic-bezier(.4,0,.2,1)',
            overflow: 'hidden',
          }}
        >
          {/* ── Specular shine no topo ── */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0,
              height: '50%',
              background: 'linear-gradient(180deg, var(--glass-shine) 0%, transparent 100%)',
              opacity: 0.45,
              pointerEvents: 'none',
              borderRadius: '20px 20px 0 0',
            }}
          />

          {/* ── LEFT ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', zIndex: 1 }}>
            <div
              style={{
                width: '34px', height: '34px',
                borderRadius: '10px',
                background: 'linear-gradient(145deg, #ef4444 0%, #dc2626 60%, #b91c1c 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 14px var(--eligi-red-glow), 0 1px 0 rgba(255,255,255,0.3) inset',
                flexShrink: 0,
              }}
            >
              <span style={{ color: '#fff', fontWeight: 800, fontSize: '15px', letterSpacing: '-0.04em' }}>
                e
              </span>
            </div>

            {!isMobile && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  Olá, {firstName} 
                </span>
              </div>
            )}
          </div>

          {/* ── CENTER: Search ── */}
          {!isMobile && (
            <div className="eligi-search" role="button" tabIndex={0} style={{ zIndex: 1 }}>
              <Search size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 400 }}>
                Buscar...
              </span>
              <span
                style={{
                  marginLeft: '24px',
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                  border: '1px solid var(--divider)',
                  padding: '2px 6px',
                  borderRadius: '5px',
                  background: 'var(--surface-1)',
                  letterSpacing: '0.02em',
                }}
              >
                ⌘K
              </span>
            </div>
          )}

          {/* ── RIGHT ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', zIndex: 1 }}>
            {/* Socket status */}
            <div
              title={connected ? 'Conectado' : 'Desconectado'}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '5px 9px',
                borderRadius: '99px',
                background: connected ? 'rgba(34,197,94,0.10)' : 'var(--surface-2)',
                border: `1px solid ${connected ? 'rgba(34,197,94,0.22)' : 'var(--divider)'}`,
                transition: 'all 350ms ease',
                marginRight: '4px',
              }}
            >
              <div
                style={{
                  width: '6px', height: '6px',
                  borderRadius: '50%',
                  background: connected ? '#22c55e' : 'var(--text-muted)',
                  boxShadow: connected ? '0 0 8px rgba(34,197,94,0.80)' : 'none',
                  transition: 'all 350ms ease',
                  flexShrink: 0,
                }}
              />
              {!isMobile && (
                <span style={{
                  fontSize: '11px', fontWeight: 500,
                  color: connected ? '#16a34a' : 'var(--text-muted)',
                  transition: 'color 350ms ease',
                }}>
                  {connected ? 'Online' : 'Offline'}
                </span>
              )}
            </div>

            {/* Bell */}
            <button
              className="eligi-icon-btn"
              onMouseEnter={() => setBellHover(true)}
              onMouseLeave={() => setBellHover(false)}
              onClick={() => setHasNotification(false)}
              title="Notificações"
              style={{ color: bellHover ? 'var(--text-primary)' : 'var(--text-secondary)' }}
            >
              <Bell size={20} />
              {hasNotification && (
                <>
                  <span style={{ position: 'absolute', top: '9px', right: '9px', width: '7px', height: '7px', borderRadius: '50%', background: 'var(--eligi-red)', border: '1.5px solid transparent', zIndex: 2 }} />
                  <span style={{ position: 'absolute', top: '9px', right: '9px', width: '7px', height: '7px', borderRadius: '50%', background: 'var(--eligi-red)', animation: 'eligi-pulse 1.8s ease-out infinite', zIndex: 1 }} />
                </>
              )}
            </button>

            {/* Theme */}
            <button
              className="eligi-icon-btn"
              onMouseEnter={() => setThemeHover(true)}
              onMouseLeave={() => setThemeHover(false)}
              onClick={toggleTheme}
              title={darkMode ? 'Modo claro' : 'Modo escuro'}
              style={{ color: themeHover ? 'var(--text-primary)' : 'var(--text-secondary)' }}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Avatar */}
            <div
              onMouseEnter={() => setAvatarHover(true)}
              onMouseLeave={() => setAvatarHover(false)}
              title={auth?.user?.name ?? ''}
              style={{
                marginLeft: '6px',
                width: '42px', height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(145deg, #ef4444 0%, #dc2626 60%, #b91c1c 100%)',
                color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '14px', letterSpacing: '-0.01em',
                cursor: 'pointer',
                boxShadow: avatarHover
                  ? '0 6px 20px var(--eligi-red-glow), 0 1px 0 rgba(255,255,255,0.25) inset'
                  : '0 3px 10px var(--eligi-red-glow), 0 1px 0 rgba(255,255,255,0.25) inset',
                transform: avatarHover ? 'scale(1.07)' : 'scale(1)',
                transition: 'all 180ms ease',
                userSelect: 'none',
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