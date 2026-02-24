'use client'

import { useState } from 'react'
import { navigationByRole, NavItemType } from './navigation.config'
import { useAuth } from '@/hooks/useAuth'
import NavItem from './NavItem'

export default function Sidebar() {
  const { user } = useAuth()

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('eligi-sidebar-collapsed') === 'true'
  })

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

  return (
    <aside
      style={{
        width: collapsed ? '72px' : '260px',
        transition: 'width 250ms ease',
        background: 'linear-gradient(180deg, #f9fafb 0%, #f3f4f6 100%)',
        borderRight: '1px solid #e6e8ec',
        padding: '24px 12px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'inset -1px 0 0 rgba(0,0,0,0.04)',
      }}
    >
      <button
        onClick={toggleSidebar}
        style={{
          marginBottom: '20px',
          padding: '8px',
          borderRadius: '8px',
          border: 'none',
          background: 'linear-gradient(180deg, #f9fafb 0%, #f3f4f6 100%)',
          cursor: 'pointer',
        }}
      >
        ☰
      </button>

      {renderSection('Principal', sections.principal, collapsed)}
      {renderSection('Financeiro', sections.financeiro, collapsed)}
      {renderSection('Gestão', sections.gestao, collapsed)}
      {renderSection('Admin', sections.admin, collapsed)}
    </aside>
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
