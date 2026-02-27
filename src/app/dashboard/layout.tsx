'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

import AppNavbar from '@/app/components/navigation/AppNavbar'
import Sidebar from '@/app/components/navigation/Sidebar'
import CommandPalette from '@/app/components/search/CommandPalette'
import { DashboardProvider } from '@/app/dashboard/DashboardContext'

export default function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  /* =====================================================
     🔒 PROTEÇÃO DE ROTA
  ===================================================== */

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [user, loading, router])

  /* =====================================================
     ⏳ Enquanto valida sessão
  ===================================================== */

  if (loading) {
    return (
      <div style={centerStyle}>
        <div style={spinnerStyle} />
      </div>
    )
  }

  /* =====================================================
     🚫 Sessão inválida
  ===================================================== */

  if (!user) {
    return (
      <div style={centerStyle}>
        <div style={unauthorizedCard}>
          <h1 style={{ marginBottom: 12 }}>Sessão expirada</h1>
          <p style={{ opacity: 0.7, marginBottom: 20 }}>
            Sua sessão terminou. Faça login novamente.
          </p>
          <button
            onClick={() => router.push('/login')}
            style={loginButton}
          >
            Fazer login
          </button>
        </div>
      </div>
    )
  }

  /* =====================================================
     ✅ Layout normal (usuário autenticado)
  ===================================================== */

  return (
    <DashboardProvider>
      <div style={rootStyle}>
        <AppNavbar />
        <div style={bodyStyle}>
          <Sidebar />
          <main style={contentStyle}>
            {children}
          </main>
        </div>
        <CommandPalette />
      </div>
    </DashboardProvider>
  )
}

/* =====================================================
   🎨 ESTILOS
===================================================== */

const rootStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: '#f5f6f8',
}

const bodyStyle: React.CSSProperties = {
  display: 'flex',
  marginTop: '90px',
}

const contentStyle: React.CSSProperties = {
  flex: 1,
  padding: '32px',
}

const centerStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#f5f6f8',
}

const spinnerStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: '50%',
  border: '4px solid #e5e7eb',
  borderTop: '4px solid #dc2626',
  animation: 'spin 1s linear infinite',
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
  transition: 'all 200ms ease',
}