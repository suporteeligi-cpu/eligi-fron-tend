'use client'
// src/app/dashboard/clientes/[id]/components/DeleteModal.tsx

import { createPortal } from 'react-dom'
import { AlertTriangle } from 'lucide-react'
import { colors, typography, radius, shadows } from '@/shared/theme'

interface Props {
  name:      string
  onConfirm: () => void
  onCancel:  () => void
  deleting:  boolean
  isMobile:  boolean
}

/**
 * Modal de confirmação de delete. Variantes:
 * - Desktop/iPad: centered
 * - Mobile: bottom sheet
 */
export default function DeleteModal({ name, onConfirm, onCancel, deleting, isMobile }: Props) {
  if (typeof document === 'undefined') return null

  return createPortal(
    <>
      <div
        onClick={onCancel}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.30)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 9998,
          animation: 'dm-fade 0.18s ease',
        }}
      />

      <div style={isMobile ? {
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(255,255,255,0.99)',
        borderRadius: '24px 24px 0 0',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.15)',
        zIndex: 9999,
        padding: `28px 24px max(36px, env(safe-area-inset-bottom))`,
        textAlign: 'center',
        fontFamily: typography.fontFamily,
        animation: 'dm-up 0.28s cubic-bezier(0.34, 1.2, 0.64, 1)',
      } : {
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: 340, maxWidth: '90vw',
        background: '#fff',
        borderRadius: radius['2xl'],
        boxShadow: shadows.lg,
        zIndex: 9999,
        padding: '28px 24px 22px',
        textAlign: 'center',
        fontFamily: typography.fontFamily,
        animation: 'dm-in 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
        <style>{`
          @keyframes dm-fade { from { opacity:0 } to { opacity:1 } }
          @keyframes dm-in   { from { opacity:0; transform: translate(-50%,-50%) scale(0.92) } to { opacity:1; transform: translate(-50%,-50%) scale(1) } }
          @keyframes dm-up   { from { transform: translateY(100%) } to { transform: translateY(0) } }
        `}</style>

        {isMobile && (
          <div aria-hidden style={{
            width: 40, height: 4, borderRadius: 2,
            background: 'rgba(0,0,0,0.12)',
            margin: '0 auto 22px',
          }} />
        )}

        <div style={{
          width: 52, height: 52, borderRadius: radius.full,
          background: 'rgba(220,38,38,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 14px',
        }}>
          <AlertTriangle size={24} color={colors.red.DEFAULT} />
        </div>

        <h3 style={{
          margin: '0 0 8px',
          fontSize: 17,
          fontWeight: typography.weight.bold,
          color: typography.color.primary,
        }}>
          Apagar cliente?
        </h3>

        <p style={{
          margin: '0 0 6px',
          fontSize: typography.scale.base,
          color: typography.color.muted,
          lineHeight: 1.5,
        }}>
          Tem certeza que deseja apagar <strong>{name}</strong>?
        </p>

        <p style={{
          margin: '0 0 22px',
          fontSize: typography.scale.sm,
          color: typography.color.muted,
        }}>
          Os agendamentos serão mantidos, mas o vínculo com o cliente será removido.
        </p>

        <button
          onClick={onConfirm}
          disabled={deleting}
          style={{
            width: '100%', padding: '12px', marginBottom: 8,
            background: colors.red.gradient,
            color: '#fff',
            border: 'none',
            borderRadius: radius.sm,
            fontWeight: typography.weight.bold,
            fontSize: typography.scale.base,
            cursor: deleting ? 'not-allowed' : 'pointer',
            boxShadow: shadows.redMd,
            opacity: deleting ? 0.7 : 1,
          }}
        >
          {deleting ? 'Apagando...' : 'Sim, apagar cliente'}
        </button>

        <button
          onClick={onCancel}
          style={{
            width: '100%', padding: '11px',
            background: 'rgba(0,0,0,0.04)',
            border: `1px solid ${colors.gray.borderMd}`,
            borderRadius: radius.sm,
            fontSize: typography.scale.base,
            cursor: 'pointer',
            color: typography.color.muted,
          }}
        >
          Cancelar
        </button>
      </div>
    </>,
    document.body
  )
}
