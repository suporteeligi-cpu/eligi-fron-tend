'use client'
// src/features/stock/components/LowStockBellButton.tsx
//
// Componente drop-in pro AppNavbar.
// Mostra um sino com badge contando produtos em alerta.
// Click abre popover com lista resumida + link pra /estoque.
//
// Uso:
//   import LowStockBellButton from '@/features/stock/components/LowStockBellButton'
//
//   // dentro do AppNavbar:
//   <LowStockBellButton />

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Package, AlertTriangle, XCircle } from 'lucide-react'
import { colors, typography } from '@/shared/theme'
import { useLowStockAlerts } from '../hooks/useLowStockAlerts'

export default function LowStockBellButton() {
  const router = useRouter()
  const { alerts, count } = useLowStockAlerts()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  // Fecha popover ao clicar fora
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function handleGoStock(productId?: string) {
    setOpen(false)
    router.push(productId ? `/dashboard/estoque?product=${productId}` : '/dashboard/estoque')
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Alertas de estoque"
        style={{
          position: 'relative',
          width: 36, height: 36,
          borderRadius: '50%',
          border: 'none',
          background: count > 0
            ? 'rgba(220,38,38,0.08)'
            : 'rgba(255,255,255,0.6)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: count > 0 ? colors.red.DEFAULT : colors.gray[700],
          transition: 'background 0.18s ease, color 0.18s ease',
          fontFamily: typography.fontFamily,
        }}
      >
        <Bell size={16} strokeWidth={2} />
        {count > 0 && (
          <span style={{
            position: 'absolute',
            top: 2, right: 2,
            minWidth: 16, height: 16,
            padding: '0 4px',
            borderRadius: 8,
            background: colors.red.DEFAULT,
            color: '#fff',
            fontSize: 9,
            fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
            animation: count > 0 ? 'lsb-pulse 2s ease-in-out infinite' : undefined,
          }}>
            <style>{`
              @keyframes lsb-pulse {
                0%, 100% { transform: scale(1); }
                50%       { transform: scale(1.12); }
              }
            `}</style>
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          width: 320,
          maxHeight: 400,
          background: 'rgba(255,255,255,0.98)',
          backdropFilter: 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: 'blur(20px) saturate(160%)',
          border: '1px solid rgba(255,255,255,0.6)',
          borderRadius: 14,
          boxShadow: '0 12px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
          overflow: 'hidden',
          zIndex: 11999,
          display: 'flex', flexDirection: 'column',
          fontFamily: typography.fontFamily,
          animation: 'lsb-pop-in 0.18s cubic-bezier(0.34, 1.4, 0.64, 1)',
        }}>
          <style>{`
            @keyframes lsb-pop-in {
              from { opacity: 0; transform: translateY(-4px) scale(0.97); }
              to   { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>

          {/* Header */}
          <div style={{
            padding: '12px 14px',
            borderBottom: `1px solid ${colors.gray.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(255,255,255,0.5)',
          }}>
            <div style={{
              fontSize: 13, fontWeight: 700,
              color: colors.gray[900],
            }}>
              Alertas de estoque
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700,
              padding: '2px 7px',
              borderRadius: 5,
              background: count > 0 ? 'rgba(220,38,38,0.10)' : colors.gray.hover,
              color:      count > 0 ? colors.red.DEFAULT    : colors.gray.dimText,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {count}
            </span>
          </div>

          {/* Lista */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {alerts.length === 0 ? (
              <div style={{
                padding: '32px 18px',
                textAlign: 'center',
                color: colors.gray.dimText,
                fontSize: 12,
              }}>
                <Package size={24} style={{ opacity: 0.3, marginBottom: 8 }} />
                <div>Nenhum produto em alerta 🎉</div>
              </div>
            ) : (
              alerts.slice(0, 10).map((a, i) => {
                const isOut = a.stock <= 0
                return (
                  <button
                    key={a.id}
                    onClick={() => handleGoStock(a.id)}
                    style={{
                      width: '100%',
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      borderBottom: i === Math.min(alerts.length, 10) - 1
                        ? 'none'
                        : `1px solid ${colors.gray.border}`,
                      transition: 'background 0.12s ease',
                      fontFamily: 'inherit',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = colors.gray.hover)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: a.imageUrl ? '#fff' : (a.color ?? colors.red.DEFAULT),
                      overflow: 'hidden',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {a.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Package size={14} color="#fff" strokeWidth={2} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 12, fontWeight: 600,
                        color: colors.gray[900],
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>{a.name}</div>
                      <div style={{
                        fontSize: 10,
                        color: isOut ? '#991b1b' : '#b45309',
                        fontWeight: 600,
                        marginTop: 1,
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                        {isOut
                          ? <><XCircle size={9} strokeWidth={2.5} />Esgotado</>
                          : <><AlertTriangle size={9} strokeWidth={2.5} />{a.stock} restante{a.stock !== 1 ? 's' : ''}</>
                        }
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Footer */}
          {alerts.length > 0 && (
            <button
              onClick={() => handleGoStock()}
              style={{
                padding: '10px 14px',
                background: 'rgba(255,255,255,0.5)',
                border: 'none',
                borderTop: `1px solid ${colors.gray.border}`,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 700,
                color: colors.red.DEFAULT,
                textAlign: 'center',
                letterSpacing: '.02em',
                fontFamily: 'inherit',
              }}
            >
              Ver estoque completo →
            </button>
          )}
        </div>
      )}
    </div>
  )
}
