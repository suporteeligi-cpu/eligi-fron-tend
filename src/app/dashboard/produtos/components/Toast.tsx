'use client'
// src/app/dashboard/produtos/components/Toast.tsx

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Check, X, AlertCircle } from 'lucide-react'
import { typography, radius, shadows } from '@/shared/theme'

export type ToastKind = 'success' | 'error' | 'info'

interface Props {
  message: string
  kind?:   ToastKind
  onClose: () => void
  durationMs?: number
}

export default function Toast({ message, kind = 'success', onClose, durationMs = 2200 }: Props) {
  useEffect(() => {
    const t = setTimeout(onClose, durationMs)
    return () => clearTimeout(t)
  }, [onClose, durationMs])

  if (typeof document === 'undefined') return null

  const colorMap = {
    success: { bg: 'rgba(22,163,74,0.95)', border: '#15803d' },
    error:   { bg: 'rgba(220,38,38,0.95)', border: '#991b1b' },
    info:    { bg: 'rgba(31,41,55,0.95)',  border: '#111827' },
  }
  const Icon = kind === 'success' ? Check : kind === 'error' ? AlertCircle : Check
  const c = colorMap[kind]

  return createPortal(
    <div style={{
      position: 'fixed',
      bottom: 'calc(20px + env(safe-area-inset-bottom))',
      left: '50%',
      transform: 'translateX(-50%)',
      background: c.bg,
      color: '#fff',
      borderRadius: radius.xl,
      padding: '10px 18px',
      fontSize: 13,
      fontWeight: 600,
      fontFamily: typography.fontFamily,
      boxShadow: shadows.md,
      display: 'flex',
      alignItems: 'center',
      gap: 9,
      zIndex: 11999,
      animation: 'eq-toast-in 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
    }}>
      <style>{`
        @keyframes eq-toast-in {
          from { opacity: 0; transform: translate(-50%, 12px) }
          to   { opacity: 1; transform: translate(-50%, 0) }
        }
      `}</style>
      <Icon size={14} strokeWidth={3} />
      {message}
      <button
        onClick={onClose}
        aria-label="Fechar"
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          display: 'flex',
          marginLeft: 4,
          opacity: 0.7,
        }}
      >
        <X size={12} color="#fff" strokeWidth={2.5} />
      </button>
    </div>,
    document.body,
  )
}
