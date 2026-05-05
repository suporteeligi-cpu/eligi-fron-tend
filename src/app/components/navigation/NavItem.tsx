'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { NavItemType } from './navigation.config'

interface NavItemProps {
  item: NavItemType
  collapsed: boolean
}

export default function NavItem({ item, collapsed }: NavItemProps) {
  const pathname = usePathname()
  const isActive  = pathname === item.path
  const Icon      = item.icon

  const [hover,      setHover]      = useState(false)
  const [tooltipTop, setTooltipTop] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (hover && collapsed && ref.current) {
      const r = ref.current.getBoundingClientRect()
      setTooltipTop(r.top + r.height / 2)
    }
  }, [hover, collapsed])

  return (
    <div
      ref={ref}
      style={{ position: 'relative' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Link
        href={item.path}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: collapsed ? 0 : '10px',
          padding: collapsed ? '11px 0' : '10px 12px',
          borderRadius: '12px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          border: '1px solid transparent',
          background: isActive
            ? 'rgba(220,38,38,0.18)'
            : hover
            ? 'rgba(255,255,255,0.07)'
            : 'transparent',
          borderColor: isActive ? 'rgba(220,38,38,0.22)' : 'transparent',
          color: isActive
            ? '#f87171'
            : hover
            ? 'rgba(255,255,255,0.90)'
            : 'rgba(255,255,255,0.85)',
          textDecoration: 'none',
          fontSize: '13px',
          fontWeight: isActive ? 600 : 500,
          letterSpacing: '-0.01em',
          position: 'relative',
          transition: 'background 160ms ease, color 160ms ease, border-color 160ms ease, transform 130ms ease',
          width: '100%',
        }}
        // Press scale via onMouseDown/Up
        onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.95)' }}
        onMouseUp={e =>   { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
      >
        {/* Active indicator bar */}
        {isActive && (
          <div style={{
            position: 'absolute',
            left: 0,
            top: '20%', bottom: '20%',
            width: '3px',
            background: 'linear-gradient(180deg,#ef4444,#dc2626)',
            borderRadius: '0 3px 3px 0',
            boxShadow: '0 0 8px rgba(220,38,38,0.65)',
          }} />
        )}

        {/* Icon */}
        <Icon
          size={19}
          style={{
            flexShrink: 0,
            opacity: isActive ? 1 : hover ? 0.9 : 0.65,
            transition: 'opacity 160ms ease, transform 160ms ease',
            transform: hover && !isActive ? 'scale(1.10)' : 'scale(1)',
          }}
        />

        {/* Label — slides in when expanded */}
        {!collapsed && (
          <span style={{
            whiteSpace: 'nowrap',
            animation: 'eligi-label-in 180ms ease both',
          }}>
            {item.label}
          </span>
        )}
      </Link>

      {/* Tooltip — only in collapsed/rail mode, via fixed position */}
      {collapsed && hover && (
        <div style={{
          position: 'fixed',
          left: '74px',
          top: `${tooltipTop}px`,
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
        }}>
          {/* Arrow */}
          <div style={{
            width: 0, height: 0,
            borderTop: '5px solid transparent',
            borderBottom: '5px solid transparent',
            borderRight: '6px solid rgba(20,20,28,0.95)',
          }} />
          {/* Bubble */}
          <div style={{
            background: 'rgba(20,20,28,0.95)',
            backdropFilter: 'blur(12px)',
            color: 'rgba(255,255,255,0.95)',
            padding: '5px 11px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
          }}>
            {item.label}
          </div>
        </div>
      )}
    </div>
  )
}