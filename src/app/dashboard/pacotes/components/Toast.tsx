'use client'
// src/app/dashboard/pacotes/components/Toast.tsx

import { useEffect } from 'react'
import { CheckCircle2, XCircle, X } from 'lucide-react'
import { colors, typography } from '@/shared/theme'

export type ToastKind = 'success' | 'error'

interface Props {
  message: string
  kind:    ToastKind
  onClose: () => void
}

export default function Toast({ message, kind, onClose }: Props) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [onClose])

  const Icon = kind === 'success' ? CheckCircle2 : XCircle
  const color = kind === 'success' ? '#15803d' : colors.red.DEFAULT

  return (
    <>
      <style>{`@keyframes pkg-toast-in {
        from { opacity: 0; transform: translate(-50%, 20px) }
        to   { opacity: 1; transform: translate(-50%, 0) }
      }`}</style>
      <div style={{
        position: 'fixed',
        bottom: 'calc(80px + env(safe-area-inset-bottom))',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        background: '#fff',
        boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
        borderRadius: 12,
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        animation: 'pkg-toast-in 0.25s cubic-bezier(0.22, 1, 0.36, 1) both',
        fontFamily: typography.fontFamily,
        maxWidth: 'calc(100vw - 32px)',
        border: `1px solid ${color}30`,
      }}>
        <Icon size={17} color={color} strokeWidth={2.2} />
        <span style={{
          fontSize: 13, fontWeight: 600,
          color: colors.gray[900],
          flex: 1,
        }}>{message}</span>
        <button
          onClick={onClose}
          aria-label="Fechar"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 2, display: 'flex',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <X size={14} color={colors.gray.dimText} />
        </button>
      </div>
    </>
  )
}
