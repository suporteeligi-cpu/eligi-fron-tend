'use client'
// src/app/dashboard/layout.tsx

import { ReactNode, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

import AppNavbar from '@/app/components/navigation/AppNavbar'
import { DASHBOARD_ROLES } from '@/app/components/navigation/navigation.config'
import Sidebar from '@/app/components/navigation/Sidebar'
import CommandPalette from '@/app/components/search/CommandPalette'
import { DashboardProvider } from '@/app/dashboard/DashboardContext'
import BillingGuard from './components/BillingGuard'

const NAVBAR_HEIGHT = 104

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading, authError } = useAuth()
  const router   = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // !user → o useAuth é dono do redirect de auth (hard nav no caso 'expired');
    // não redirecionamos aqui pra não ricochetear no estado 'offline'.

    // Role não reconhecido → volta pro login
    if (!loading && user && !DASHBOARD_ROLES.includes(user.role as never)) {
      router.replace('/login')
    }

    // Owner que ainda não concluiu o onboarding → wizard
    if (!loading && user && user.role === 'BUSINESS_OWNER' && !user.onboardingDone) {
      router.replace('/onboarding')
      return
    }

    // BASIC_STAFF: só agenda e comissões próprias
    const basicStaffAllowed = ['/dashboard/agenda', '/dashboard/financeiro/comissoes']
    if (!loading && user && user.role === 'BASIC_STAFF' &&
        !basicStaffAllowed.includes(pathname)) {
      router.replace('/dashboard/agenda')
      return
    }
    // Demais funcionários: só /dashboard raiz vai pra /agenda
    const staffRoles = ['MANAGER', 'RECEPTIONIST', 'STAFF']
    if (!loading && user && staffRoles.includes(user.role) &&
        pathname === '/dashboard') {
      router.replace('/dashboard/agenda')
    }
  }, [user, loading, router, pathname])

  useEffect(() => {
    document.body.classList.add('eligi-dashboard')
    return () => { document.body.classList.remove('eligi-dashboard') }
  }, [])

  // BASIC_STAFF: retorna null enquanto redireciona (sem flash)
  const basicStaffAllowed = ['/dashboard/agenda', '/dashboard/financeiro/comissoes']
  const isAgendaOnly = user ? user.role === 'BASIC_STAFF' : false
  if (loading || (isAgendaOnly && !basicStaffAllowed.includes(pathname))) {
    return null
  }

  if (!user) {
    // Backend indisponível (cold start / queda): a sessão pode estar viva.
    // Não manda pro login — só oferece re-tentar.
    if (authError === 'offline') {
      return (
        <div style={centerStyle}>
          <div style={unauthorizedCard}>
            <h1 style={{ marginBottom: 12 }}>Sem conexão com o servidor</h1>
            <p style={{ opacity: 0.7, marginBottom: 20 }}>
              Não foi possível conectar agora. Sua sessão continua ativa — tente de novo.
            </p>
            <button onClick={() => window.location.reload()} style={loginButton}>Tentar de novo</button>
          </div>
        </div>
      )
    }

    // Sessão expirada: o useAuth já limpou o cookie e fez hard nav. Este card
    // é fallback — o botão usa hard nav (router.push ricochetearia no middleware).
    return (
      <div style={centerStyle}>
        <div style={unauthorizedCard}>
          <h1 style={{ marginBottom: 12 }}>Sessão expirada</h1>
          <p style={{ opacity: 0.7, marginBottom: 20 }}>Sua sessão terminou. Faça login novamente.</p>
          <button onClick={() => { window.location.href = '/login' }} style={loginButton}>Fazer login</button>
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
    <BillingGuard>
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
    </BillingGuard>
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