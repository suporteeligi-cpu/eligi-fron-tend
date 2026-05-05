'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

import AppNavbar from '@/app/components/navigation/AppNavbar'
import Sidebar from '@/app/components/navigation/Sidebar'
import CommandPalette from '@/app/components/search/CommandPalette'
import { DashboardProvider } from '@/app/dashboard/DashboardContext'

const NAVBAR_HEIGHT = 104 // 20px top + 64px navbar + 20px gap

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  if (loading) {
    return (
      <div style={centerStyle}>
        <style>{`
          @keyframes eligi-spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
        <div style={spinnerStyle} />
      </div>
    )
  }

  if (!user) {
    return (
      <div style={centerStyle}>
        <div style={unauthorizedCard}>
          <h1 style={{ marginBottom: 12 }}>Sessão expirada</h1>
          <p style={{ opacity: 0.7, marginBottom: 20 }}>
            Sua sessão terminou. Faça login novamente.
          </p>
          <button onClick={() => router.push('/login')} style={loginButton}>
            Fazer login
          </button>
        </div>
      </div>
    )
  }

  return (
    <DashboardProvider>
      <AppNavbar />
      <Sidebar />

      {/* Main content — offset left to clear the fixed sidebar */}
      <main style={{
        marginTop: `${NAVBAR_HEIGHT}px`,
        marginLeft: 'var(--sidebar-width, 64px)',
        minHeight: `calc(100dvh - ${NAVBAR_HEIGHT}px)`,
        padding: '32px',
        transition: 'margin-left 230ms cubic-bezier(.4,0,.2,1)',
      }}>
        {children}
      </main>

      <CommandPalette />
    </DashboardProvider>
  )
}

/* ── shared ── */
const centerStyle: React.CSSProperties = {
  minHeight: '100dvh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const spinnerStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: '50%',
  border: '3px solid rgba(220,38,38,0.15)',
  borderTop: '3px solid #dc2626',
  animation: 'eligi-spin 0.9s linear infinite',
}

const unauthorizedCard: React.CSSProperties = {
  background: '#ffffff',
  padding: '40px',
  borderRadius: '20px',
  boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
  textAlign: 'center',
  maxWidth: '400px',
}

const loginButton: React.CSSProperties = {
  background: '#dc2626',
  color: '#ffffff',
  border: 'none',
  padding: '12px 24px',
  borderRadius: '12px',
  cursor: 'pointer',
  fontWeight: 600,
}