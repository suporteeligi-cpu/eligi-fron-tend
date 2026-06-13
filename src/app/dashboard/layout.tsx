'use client'
// src/app/dashboard/layout.tsx

import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

import AppNavbar from '@/app/components/navigation/AppNavbar'
import { DASHBOARD_ROLES } from '@/app/components/navigation/navigation.config'
import Sidebar from '@/app/components/navigation/Sidebar'
import CommandPalette from '@/app/components/search/CommandPalette'
import { DashboardProvider } from '@/app/dashboard/DashboardContext'

const NAVBAR_HEIGHT = 104

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.replace('/login')

    // Role não reconhecido → volta pro login
    if (!loading && user && !DASHBOARD_ROLES.includes(user.role as never)) {
      router.replace('/login')
    }

    // Owner que ainda não concluiu o onboarding → wizard
    if (!loading && user && user.role === 'BUSINESS_OWNER' && !user.onboardingDone) {
      router.replace('/onboarding')
      return
    }

    // Funcionários tentando acessar /dashboard raiz → agenda
    const staffRoles = ['MANAGER', 'RECEPTIONIST', 'STAFF', 'BASIC_STAFF']
    if (!loading && user && staffRoles.includes(user.role) &&
        window.location.pathname === '/dashboard') {
      router.replace('/dashboard/agenda')
    }
  }, [user, loading, router])

  useEffect(() => {
    document.body.classList.add('eligi-dashboard')
    return () => { document.body.classList.remove('eligi-dashboard') }
  }, [])

  if (loading) {
    return (
      <div style={centerStyle}>
        <style>{`@keyframes eligi-spin { to { transform: rotate(360deg); } }`}</style>
        <div style={spinnerStyle} />
      </div>
    )
  }

  if (!user) {
    return (
      <div style={centerStyle}>
        <div style={unauthorizedCard}>
          <h1 style={{ marginBottom: 12 }}>Sessão expirada</h1>
          <p style={{ opacity: 0.7, marginBottom: 20 }}>Sua sessão terminou. Faça login novamente.</p>
          <button onClick={() => router.push('/login')} style={loginButton}>Fazer login</button>
        </div>
      </div>
    )
  }

  // Owner incompleto: não renderiza o dashboard, só segura enquanto redireciona
  if (user.role === 'BUSINESS_OWNER' && !user.onboardingDone) {
    return (
      <div style={centerStyle}>
        <style>{`@keyframes eligi-spin { to { transform: rotate(360deg); } }`}</style>
        <div style={spinnerStyle} />
      </div>
    )
  }

  return (
    <DashboardProvider>
      <AppNavbar />
      <Sidebar />

      <main style={{
        marginTop: `${NAVBAR_HEIGHT}px`,
        marginLeft: 'var(--sidebar-width, 64px)',
        minHeight: `calc(100dvh - ${NAVBAR_HEIGHT}px)`,
        padding: '32px',
        paddingBottom: 'calc(32px + var(--bottom-nav-h, 0px))',
        transition: 'margin-left 230ms cubic-bezier(.4,0,.2,1)',
        position: 'relative',
      }}>
        {children}
      </main>

      <CommandPalette />
    </DashboardProvider>
  )
}

const centerStyle: React.CSSProperties = {
  minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
}
const spinnerStyle: React.CSSProperties = {
  width: 40, height: 40, borderRadius: '50%',
  border: '3px solid rgba(220,38,38,0.15)', borderTop: '3px solid #dc2626',
  animation: 'eligi-spin 0.9s linear infinite',
}
const unauthorizedCard: React.CSSProperties = {
  background: '#ffffff', padding: '40px', borderRadius: '20px',
  boxShadow: '0 20px 40px rgba(0,0,0,0.08)', textAlign: 'center', maxWidth: '400px',
}
const loginButton: React.CSSProperties = {
  background: '#dc2626', color: '#ffffff', border: 'none',
  padding: '12px 24px', borderRadius: '12px', cursor: 'pointer', fontWeight: 600,
}
