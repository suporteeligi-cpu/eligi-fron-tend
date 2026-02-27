'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Bell, Sun, Moon, Search } from 'lucide-react'
import { useSocketStatus } from '@/hooks/useSocketStatus'

export default function AppNavbar() {
  const auth = useAuth()

  const [scrolled, setScrolled] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  // ✅ Inicialização correta (sem effect + sem setState)
  const [token] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('accessToken')
  })

  const [isMobile, setIsMobile] = useState(false)
  const [hasNotification, setHasNotification] = useState(true)

  const connected = useSocketStatus(token)

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 10)
    }

    function handleResize() {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()

    window.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  function toggleTheme() {
    const html = document.documentElement
    const newTheme = !darkMode
    setDarkMode(newTheme)

    if (newTheme) html.classList.add('dark')
    else html.classList.remove('dark')
  }

  return (
    <div style={wrapperStyle}>
      <header
        style={{
          ...navbarStyle,
          padding: isMobile ? '0 18px' : '0 32px',
          boxShadow: scrolled
            ? '0 18px 40px rgba(0,0,0,0.10)'
            : '0 10px 24px rgba(0,0,0,0.06)',
        }}
      >
        {/* ESQUERDA */}
        <div style={leftStyle}>
          <div style={logoStyle}>Olá!</div>
          {!isMobile && (
            <span style={businessNameStyle}>
              {auth?.user?.name}
            </span>
          )}
        </div>

        {/* CENTRO */}
        {!isMobile && (
          <div style={searchWrapper}>
            <Search size={16} />
            <span style={{ fontSize: '13px', opacity: 0.6 }}>
              Buscar (Ctrl + K)
            </span>
          </div>
        )}

        {/* DIREITA */}
        <div style={rightStyle}>
          {/* Indicador socket */}
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: connected ? '#22c55e' : '#9ca3af',
              boxShadow: connected
                ? '0 0 10px rgba(34,197,94,0.6)'
                : '0 0 4px rgba(0,0,0,0.1)',
              transition: 'all 300ms ease',
            }}
          />

          {/* 🔔 Bell */}
          <button
            style={{
              ...iconButton,
              position: 'relative',
            }}
            onClick={() => setHasNotification(false)}
          >
            <Bell size={18} />

            {hasNotification && (
              <>
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#dc2626',
                  }}
                />

                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#dc2626',
                    animation: 'pulse 1.8s infinite',
                  }}
                />
              </>
            )}
          </button>

          <button onClick={toggleTheme} style={iconButton}>
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div style={avatarStyle}>
            {auth?.user?.name?.charAt(0)}
          </div>
        </div>
      </header>

      <style>
        {`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.8; }
          70% { transform: scale(2.4); opacity: 0; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        `}
      </style>
    </div>
  )
}

const wrapperStyle: React.CSSProperties = {
  position: 'fixed',
  top: '20px',
  left: '0',
  right: '0',
  display: 'flex',
  justifyContent: 'center',
  zIndex: 1000,
}

const navbarStyle: React.CSSProperties = {
  width: '95%',
  maxWidth: '1400px',
  height: '64px',
  borderRadius: '22px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  backdropFilter: 'blur(24px) saturate(180%)',
  background: 'rgba(255,255,255,0.75)',
  border: '1px solid rgba(255,255,255,0.6)',
  transition: 'all 250ms ease',
}

const leftStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
}

const logoStyle: React.CSSProperties = {
  fontWeight: 400,
  fontSize: '16px',
  letterSpacing: '0.08em',
}

const businessNameStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 400,
  opacity: 0.8,
}

const searchWrapper: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '10px 16px',
  borderRadius: '14px',
  background: 'rgba(0,0,0,0.04)',
  cursor: 'pointer',
}

const rightStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '20px',
}

const iconButton: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const avatarStyle: React.CSSProperties = {
  width: '38px',
  height: '38px',
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #dc2626, #ef4444)',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 600,
  fontSize: '14px',
  boxShadow: '0 6px 18px rgba(220,38,38,0.25)',
}