'use client'

import { useState, useEffect } from 'react'
import { navigationByRole, NavItemType } from './navigation.config'
import { useAuth } from '@/hooks/useAuth'
import NavItem from './NavItem'
import { LogOut } from 'lucide-react'

/* =========================================================
   LAYOUT CONSTANTS
========================================================= */

const NAVBAR_OFFSET = 84 // 20px top + 64px navbar height

export default function Sidebar() {
  const { user, logout } = useAuth()

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('eligi-sidebar-collapsed') === 'true'
  })

  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 1024)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? 'hidden' : 'auto'
  }, [isMobileOpen])

  function toggleSidebar() {
    setCollapsed(prev => {
      const next = !prev
      localStorage.setItem('eligi-sidebar-collapsed', String(next))
      return next
    })
  }

  if (!user) return null

  const navItems: NavItemType[] = navigationByRole[user.role]

  const sections = {
    principal: navItems.filter(i => i.section === 'principal'),
    financeiro: navItems.filter(i => i.section === 'financeiro'),
    gestao: navItems.filter(i => i.section === 'gestao'),
    admin: navItems.filter(i => i.section === 'admin'),
  }

  const effectiveCollapsed = collapsed && !isMobile

  return (
    <>
      {/* Botão mobile */}
      {isMobile && (
        <button
          onClick={() => setIsMobileOpen(true)}
          style={{
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: 60,
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: 10,
            padding: '8px 12px',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
          }}
        >
          ☰
        </button>
      )}

      {/* Overlay */}
      {isMobile && isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
            zIndex: 49,
          }}
        />
      )}

      <aside
        style={{
          width: effectiveCollapsed ? '72px' : '260px',
          position: isMobile ? 'fixed' : 'relative',
          left: isMobile && !isMobileOpen ? '-100%' : '0',
          top: `${NAVBAR_OFFSET}px`,
          height: `calc(100vh - ${NAVBAR_OFFSET}px)`,
          zIndex: 50,
          transition: 'all 280ms cubic-bezier(.4,0,.2,1)',
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          borderRight: '1px solid #e5e7eb',
          padding: '20px 12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: 'inset -1px 0 0 rgba(0,0,0,0.04)',
        }}
      >
        <div>
          {!isMobile && (
            <button
              onClick={toggleSidebar}
              style={{
                marginBottom: '20px',
                padding: '8px',
                borderRadius: '10px',
                border: '1px solid #e5e7eb',
                background: '#ffffff',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              {collapsed ? '›' : '‹'}
            </button>
          )}

          {renderSection('Principal', sections.principal, effectiveCollapsed)}
          {renderSection('Financeiro', sections.financeiro, effectiveCollapsed)}
          {renderSection('Gestão', sections.gestao, effectiveCollapsed)}
          {renderSection('Admin', sections.admin, effectiveCollapsed)}
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: effectiveCollapsed
              ? 'center'
              : 'flex-start',
            gap: '12px',
            padding: '10px 14px',
            borderRadius: '12px',
            border: 'none',
            background: 'transparent',
            color: '#dc2626',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 200ms ease',
          }}
          onMouseEnter={e =>
            (e.currentTarget.style.background =
              'rgba(220,38,38,0.08)')
          }
          onMouseLeave={e =>
            (e.currentTarget.style.background =
              'transparent')
          }
        >
          <LogOut size={18} />
          {!effectiveCollapsed && 'Sair'}
        </button>
      </aside>
    </>
  )
}

function renderSection(
  title: string,
  items: NavItemType[],
  collapsed: boolean
) {
  if (!items.length) return null

  return (
    <div style={{ marginBottom: '18px' }}>
      {!collapsed && (
        <div
          style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            color: '#9ca3af',
            margin: '12px 8px',
            letterSpacing: '0.05em',
          }}
        >
          {title}
        </div>
      )}

      {items.map(item => (
        <NavItem
          key={item.path}
          item={item}
          collapsed={collapsed}
        />
      ))}
    </div>
  )
}