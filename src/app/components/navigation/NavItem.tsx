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
          gap: collapsed ? '0px' : '12px',
          padding: '10px 14px',
          borderRadius: '12px',
          background: isActive
            ? 'rgba(220,38,38,0.10)'
            : hover
            ? 'rgba(0,0,0,0.04)'
            : 'transparent',
          color: isActive ? '#dc2626' : '#1f2937',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: isActive ? 600 : 500,
          position: 'relative',
          transition: 'all 200ms ease'
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

        <Icon
          size={18}
          style={{
            transition: 'all 200ms ease',
            opacity: isActive ? 1 : 0.85,
            transform: collapsed
              ? 'scale(1.05)'
              : 'scale(1)',
          }}
        />

        <span
          style={{
            opacity: collapsed ? 0 : 1,
            transform: collapsed
              ? 'translateX(-4px)'
              : 'translateX(0)',
            transition: 'all 200ms ease',
            whiteSpace: 'nowrap',
            width: collapsed ? 0 : 'auto',
            overflow: 'hidden',
          }}
        >
          {item.label}
        </span>
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
            boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
            zIndex: 100,
          }}
        >
          {item.label}
        </div>
      )}
    </div>
  )
}