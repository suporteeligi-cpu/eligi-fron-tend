'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

import { NavItemType } from './navigation.config'

interface NavItemProps {
  item: NavItemType
  collapsed: boolean
}

export default function NavItem({ item, collapsed }: NavItemProps) {
  const pathname = usePathname()
  const isActive = pathname === item.path
  const Icon = item.icon
  const [hover, setHover] = useState(false)

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Link
        href={item.path}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: '12px',
          padding: '10px 14px',
          borderRadius: '10px',
          background: isActive ? 'rgba(220,38,38,0.08)' : 'transparent',
          color: isActive ? '#dc2626' : '#1f2937',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: 500,
          position: 'relative',
          transition: 'all 150ms ease',
        }}
      >
        {isActive && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 6,
              bottom: 6,
              width: '3px',
              background: '#dc2626',
              borderRadius: '0 4px 4px 0',
            }}
          />
        )}

        <Icon size={18} />
        {!collapsed && item.label}
      </Link>

      {collapsed && hover && (
        <div
          style={{
            position: 'absolute',
            left: '70px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: '#111827',
            color: '#fff',
            padding: '6px 10px',
            borderRadius: '6px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
            zIndex: 100,
          }}
        >
          {item.label}
        </div>
      )}
    </div>
  )
}