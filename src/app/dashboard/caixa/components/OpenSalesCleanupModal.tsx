'use client'
// src/app/dashboard/caixa/components/OpenSalesCleanupModal.tsx
//
// Modal mostrado quando o usuário tem múltiplas Sales OPEN no banco (testes anteriores).
// Permite cancelar todas de uma vez ou manter uma e cancelar as outras.

import { createPortal } from 'react-dom'
import { AlertTriangle, X, Trash2, Check } from 'lucide-react'
import { colors, typography } from '@/shared/theme'
import { Sale } from '@/features/sales/types'

interface Props {
  sales:       Sale[]
  isMobile:    boolean
  onCancelAll: () => void
  onKeepOne:   (saleId: string) => void
  onClose:     () => void
}

function fmtCurrency(v: number) {
  return v.toFixed(2).replace('.', ',')
}

export default function OpenSalesCleanupModal({
  sales, isMobile, onCancelAll, onKeepOne, onClose,
}: Props) {
  if (typeof document === 'undefined') return null

  const content = (
    <>
      <style>{`
        @keyframes cleanup-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes cleanup-up   { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes cleanup-in   { from { opacity: 0; transform: translate(-50%, -50%) scale(0.93) } to { opacity: 1; transform: translate(-50%, -50%) scale(1) } }
        .cleanup-item:hover { background: rgba(0,0,0,0.03) !important }
      `}</style>

      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(8px)',
          zIndex: 11998,
          animation: 'cleanup-fade 0.2s ease',
        }}
      />

      <div style={{
        position: 'fixed',
        ...(isMobile
          ? {
              left: 0, right: 0, bottom: 0,
              maxHeight: '85dvh',
              borderRadius: '24px 24px 0 0',
              animation: 'cleanup-up 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
            }
          : {
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 480, maxWidth: '92vw',
              maxHeight: '85vh',
              borderRadius: 24,
              animation: 'cleanup-in 0.24s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }
        ),
        background: '#fff',
        boxShadow: '0 32px 80px rgba(0,0,0,0.24)',
        zIndex: 11999,
        display: 'flex', flexDirection: 'column' as const,
        overflow: 'hidden',
        fontFamily: typography.fontFamily,
      }}>

        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: `1px solid ${colors.gray.border}`,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'rgba(245, 158, 11, 0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <AlertTriangle size={20} color="#f59e0b" strokeWidth={2}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{
                margin: 0,
                fontSize: 17,
                fontWeight: 800,
                color: '#0f0f14',
                letterSpacing: '-0.02em',
                lineHeight: 1.3,
              }}>
                {sales.length} vendas em aberto
              </h2>
              <p style={{
                margin: '4px 0 0',
                fontSize: 13,
                color: colors.gray.dimText,
                lineHeight: 1.5,
              }}>
                Você só pode ter 1 venda em aberto por vez. Escolha qual manter ou cancele todas.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              border: `1px solid ${colors.gray.borderMd}`,
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
            aria-label="Fechar"
          >
            <X size={14} color={colors.gray[700]} strokeWidth={2.5}/>
          </button>
        </div>

        {/* Lista de vendas */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 0',
        }}>
          {sales.map((sale, idx) => (
            <div
              key={sale.id}
              className="cleanup-item"
              style={{
                padding: '14px 24px',
                borderBottom: idx < sales.length - 1 ? `1px solid ${colors.gray.border}` : 'none',
                display: 'flex', alignItems: 'center', gap: 12,
                transition: 'background 0.15s',
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: colors.red.subtle,
                color: colors.red.DEFAULT,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700,
                flexShrink: 0,
              }}>
                #{sale.id.slice(-4).toUpperCase()}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#0f0f14',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {sale.clientName || 'Sem cliente'}
                </div>
                <div style={{
                  fontSize: 12,
                  color: colors.gray.dimText,
                  marginTop: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <span>{sale.items?.length ?? 0} item(s)</span>
                  <span style={{ opacity: 0.5 }}>•</span>
                  <span style={{ fontWeight: 600, color: '#0f0f14' }}>
                    R$ {fmtCurrency(sale.total ?? 0)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => onKeepOne(sale.id)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 10,
                  border: `1.5px solid ${colors.red.DEFAULT}`,
                  background: 'transparent',
                  color: colors.red.DEFAULT,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontFamily: 'inherit',
                  letterSpacing: '.04em',
                  textTransform: 'uppercase' as const,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = colors.red.DEFAULT
                  e.currentTarget.style.color = '#fff'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = colors.red.DEFAULT
                }}
              >
                <Check size={12} strokeWidth={3}/>
                Manter esta
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: isMobile
            ? '16px 24px max(20px, env(safe-area-inset-bottom))'
            : '16px 24px 20px',
          borderTop: `1px solid ${colors.gray.border}`,
          background: '#fafafa',
          flexShrink: 0,
        }}>
          <button
            onClick={onCancelAll}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 14,
              border: 'none',
              background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              letterSpacing: '.06em',
              textTransform: 'uppercase' as const,
              boxShadow: '0 6px 20px rgba(220, 38, 38, 0.3)',
              fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'transform 0.15s',
            }}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
            onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <Trash2 size={14} strokeWidth={2.5}/>
            Cancelar TODAS
          </button>
        </div>
      </div>
    </>
  )

  return createPortal(content, document.body)
}
