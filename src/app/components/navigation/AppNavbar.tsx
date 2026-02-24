'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Bell, Sun, Moon, Search } from 'lucide-react'

export default function AppNavbar() {
  const { user } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  function toggleTheme() {
    const html = document.documentElement
    const newTheme = !darkMode
    setDarkMode(newTheme)

    if (newTheme) {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
  }

  return (
    <div style={wrapperStyle}>
      <header
        style={{
          ...navbarStyle,
          boxShadow: scrolled
            ? '0 12px 30px rgba(0,0,0,0.08)'
            : '0 8px 20px rgba(0,0,0,0.04)',
        }}
      >
        {/* ESQUERDA */}
        <div style={leftStyle}>
          <div style={logoStyle}>ELIGI</div>
          <span style={businessNameStyle}>{user?.name}</span>
        </div>

        {/* CENTRO */}
        <div style={searchWrapper}>
          <Search size={16} />
          <span style={{ fontSize: '13px', opacity: 0.6 }}>
            Buscar (Ctrl + K)
          </span>
        </div>

        {/* DIREITA */}
        <div style={rightStyle}>
          <button style={iconButton}>
            <Bell size={18} />
          </button>

          <button onClick={toggleTheme} style={iconButton}>
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div style={avatarStyle}>
            {user?.name?.charAt(0)}
          </div>
        </div>
      </header>
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
  borderRadius: '20px',
  padding: '0 28px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  backdropFilter: 'blur(20px) saturate(180%)',
  background: 'rgba(255,255,255,0.75)',
  border: '1px solid rgba(255,255,255,0.6)',
  transition: 'all 200ms ease',
}

const leftStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '14px',
}

const logoStyle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: '16px',
  letterSpacing: '0.04em',
}

const businessNameStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 500,
  opacity: 0.8,
}

const searchWrapper: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 14px',
  borderRadius: '12px',
  background: 'rgba(0,0,0,0.04)',
  cursor: 'pointer',
}

const rightStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
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
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  background: '#dc2626',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 600,
  fontSize: '14px',
}