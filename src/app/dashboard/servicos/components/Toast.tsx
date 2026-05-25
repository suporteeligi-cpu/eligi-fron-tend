'use client'
// src/app/dashboard/servicos/components/Toast.tsx

import { typography, radius, shadows } from '@/shared/theme'

interface Props {
  message: string
  type:    'success' | 'error'
}

export default function Toast({ message, type }: Props) {
  return (
    <div style={{
      position: 'fixed', bottom: 28, left: '50%',
      transform: 'translateX(-50%)',
      padding: '12px 22px',
      borderRadius: radius.md,
      zIndex: 9999,
      background: type === 'success'
        ? 'linear-gradient(135deg,#22c55e,#16a34a)'
        : 'linear-gradient(135deg,#dc2626,#b91c1c)',
      color: '#fff',
      fontSize: typography.scale.base,
      fontWeight: typography.weight.semibold,
      boxShadow: shadows.lg,
      fontFamily: typography.fontFamily,
      whiteSpace: 'nowrap',
      animation: 'toastIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
    }}>
      <style>{`
        @keyframes toastIn { from { opacity:0; transform: translateX(-50%) translateY(10px) } to { opacity:1; transform: translateX(-50%) translateY(0) } }
      `}</style>
      {message}
    </div>
  )
}
