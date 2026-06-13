// src/features/reports/components/panels/PlaceholderPanel.tsx
'use client'

import { BarChart3 } from 'lucide-react'
import { GLASS_CARD } from '../../constants'

export default function PlaceholderPanel({ label }: { label: string }) {
  return (
    <div
      style={{
        ...GLASS_CARD,
        padding: '48px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 48, height: 48, borderRadius: 14, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: 'rgba(220,38,38,0.08)', color: '#dc2626',
        }}
      >
        <BarChart3 size={24} />
      </div>
      <div style={{ fontSize: 16, fontWeight: 600, color: '#0c0c12' }}>{label}</div>
      <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)', maxWidth: 340 }}>
        Em breve. Esta aba será construída nas próximas fases do módulo.
      </div>
    </div>
  )
}
