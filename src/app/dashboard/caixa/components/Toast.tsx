'use client'
// src/app/dashboard/caixa/components/Toast.tsx

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Check, X, AlertCircle } from 'lucide-react'
import { typography, radius, shadows } from '@/shared/theme'

export type ToastKind = 'success' | 'error' | 'info'

interface Props {
  message:     string
  kind?:       ToastKind
  onClose:     () => void
  durationMs?: number
}

export default function Toast({ message, kind = 'success', onClose, durationMs = 2400 }: Props) {
  useEffect(() => {
    const t = setTimeout(onClose, durationMs)
    return () => clearTimeout(t)
  }, [onClose, durationMs])

  if (typeof document === 'undefined') return null

  const bgMap: Record<ToastKind, string> = {
    success: 'rgba(22,163,74,0.95)',
    error:   'rgba(220,38,38,0.95)',
    info:    'rgba(31,41,55,0.95)',
  }
  const Icon = kind === 'error' ? AlertCircle : Check

  return createPortal(
    <div style={{
      position: 'fixed',
      bottom: 'calc(20px + env(safe-area-inset-bottom))',
      left: '50%',
      transform: 'translateX(-50%)',
      background: bgMap[kind],
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
      zIndex: 12999,
      animation: 'pos-toast-in 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      maxWidth: '90vw',
    }}>
      <style>{`
        @keyframes pos-toast-in {
          from { opacity: 0; transform: translate(-50%, 12px) }
          to   { opacity: 1; transform: translate(-50%, 0) }
        }
      `}</style>
      <Icon size={14} strokeWidth={3} />
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={onClose}
        aria-label="Fechar"
        style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          padding: 0, display: 'flex', marginLeft: 4, opacity: 0.7,
        }}
      >
        <X size={12} color="#fff" strokeWidth={2.5} />
      </button>
    </div>,
    document.body,
  )
}
