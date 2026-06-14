'use client'
// src/app/dashboard/caixa/components/CartItemRow.tsx
//
// Item do carrinho. Cobertura (R$0) por PACOTE (verde + Layers) ou ASSINATURA (verde + Ticket).
// "Coberto" desabilita qty/prof e zera o preço. Cada cobertura tem seu próprio badge + remover.

import { Minus, Plus, Trash2, Scissors, Package, Users, Layers, Ticket, XCircle } from 'lucide-react'
import { colors, typography, transitions } from '@/shared/theme'
import { SaleItem, ProfLite } from '@/features/sales/types'
import { formatBRL } from '@/features/sales/utils/format'
import ProfPicker from './ProfPicker'

interface Props {
  item:           SaleItem
  professionals:  ProfLite[]
  globalProfId:   string | null
  isMobile:       boolean
  onChangeQty:    (newQty: number) => void
  onChangeProf:   (profId: string | null) => void
  onRemove:       () => void
  onRemovePackage?: () => void        // remove só o pacote aplicado
  onRemoveMembership?: () => void     // ⭐ remove só a assinatura aplicada
  suggestion?:    { cardNumber: string; packageName: string; remaining: number } | null
  onUsePackage?:  () => void
  disabled?:      boolean
}

export default function CartItemRow({
  item, professionals, globalProfId, isMobile,
  onChangeQty, onChangeProf, onRemove, onRemovePackage, onRemoveMembership,
  suggestion, onUsePackage, disabled,
}: Props) {
  const Icon =
    item.type === 'PRODUCT'    ? Package :
    item.type === 'PACKAGE'    ? Layers  :
    item.type === 'MEMBERSHIP' ? Ticket  :
                                 Scissors

  const color = item.product?.color
             ?? item.service?.color
             ?? item.package?.color
             ?? colors.red.DEFAULT

  const isOverride = item.professionalId != null &&
                     globalProfId != null &&
                     item.professionalId !== globalProfId

  // Coberturas (R$0)
  const hasPackageApplied    = item.appliedPackageCardId != null
  const hasMembershipApplied = item.appliedMembershipCardId != null
  const isCovered            = hasPackageApplied || hasMembershipApplied

  return (
    <div style={{
      padding: '12px 14px',
      background: isCovered
        ? 'linear-gradient(135deg, rgba(22,163,74,0.05), rgba(22,163,74,0.10))'
        : '#fff',
      borderRadius: 11,
      border: `1px solid ${isCovered ? 'rgba(22,163,74,0.30)' : colors.gray.border}`,
      fontFamily: typography.fontFamily,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {/* Thumb */}
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: item.product?.imageUrl ? '#fff' : color,
          overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {item.product?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.product.imageUrl}
              alt={item.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Icon size={16} color="#fff" strokeWidth={2} />
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 700,
            color: colors.gray[900],
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            {item.name}
            {item.type === 'PACKAGE' && (
              <span style={{
                fontSize: 8, fontWeight: 800,
                color: '#fff',
                background: colors.red.DEFAULT,
                padding: '1px 5px',
                borderRadius: 4,
                letterSpacing: '.04em',
                flexShrink: 0,
              }}>PACOTE</span>
            )}
            {item.type === 'MEMBERSHIP' && (
              <span style={{
                fontSize: 8, fontWeight: 800,
                color: '#fff',
                background: '#6366f1',
                padding: '1px 5px',
                borderRadius: 4,
                letterSpacing: '.04em',
                flexShrink: 0,
              }}>ASSINATURA</span>
            )}
          </div>
          <div style={{
            fontSize: 11,
            color: colors.gray.dimText,
            marginTop: 1,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span>
              {isCovered
                ? <span style={{ textDecoration: 'line-through' }}>{formatBRL(item.unitPrice || 0)}</span>
                : formatBRL(item.unitPrice)
              }
              {item.quantity > 1 && ` × ${item.quantity}`}
            </span>
          </div>
        </div>

        {/* Total + remove */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'flex-end', gap: 4,
          flexShrink: 0,
        }}>
          <div style={{
            fontSize: 14, fontWeight: 700,
            color: isCovered ? '#15803d' : colors.gray[900],
            fontVariantNumeric: 'tabular-nums',
          }}>
            {isCovered ? 'R$ 0,00' : formatBRL(item.total)}
          </div>
          <button
            onClick={onRemove}
            disabled={disabled}
            aria-label="Remover"
            style={{
              width: 24, height: 24, borderRadius: 6,
              border: `1px solid ${colors.gray.borderMd}`,
              background: 'transparent',
              cursor: disabled ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: colors.gray.dimText,
              transition: `all ${transitions.fast}`,
              opacity: disabled ? 0.4 : 1,
              WebkitTapHighlightColor: 'transparent',
            }}
            onMouseEnter={e => {
              if (disabled) return
              e.currentTarget.style.borderColor = colors.red.DEFAULT
              e.currentTarget.style.color = colors.red.DEFAULT
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = colors.gray.borderMd
              e.currentTarget.style.color = colors.gray.dimText
            }}
          >
            <Trash2 size={11} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Badge "pago via pacote" + remover só o pacote */}
      {hasPackageApplied && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '7px 10px',
          background: 'rgba(22,163,74,0.10)',
          border: '1px solid rgba(22,163,74,0.25)',
          borderRadius: 8,
        }}>
          <Layers size={12} color="#15803d" strokeWidth={2.4} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 10, fontWeight: 800,
              color: '#15803d',
              letterSpacing: '.04em', textTransform: 'uppercase',
            }}>
              Pago via pacote
            </div>
            {item.appliedPackageCard && (
              <div style={{
                fontSize: 10, color: colors.gray[700],
                fontVariantNumeric: 'tabular-nums',
              }}>
                #{item.appliedPackageCard.cardNumber} · {item.appliedPackageCard.packageName}
              </div>
            )}
          </div>
          {onRemovePackage && (
            <button
              onClick={onRemovePackage}
              disabled={disabled}
              aria-label="Remover pacote"
              title="Remover aplicação do pacote (item volta ao preço normal)"
              style={{
                background: 'none', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
                padding: 3, display: 'flex',
                color: '#15803d',
                opacity: disabled ? 0.4 : 1,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <XCircle size={14} strokeWidth={2.2} />
            </button>
          )}
        </div>
      )}

      {/* ⭐ Badge "coberto por assinatura" + remover só a assinatura */}
      {hasMembershipApplied && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '7px 10px',
          background: 'rgba(99,102,241,0.10)',
          border: '1px solid rgba(99,102,241,0.25)',
          borderRadius: 8,
        }}>
          <Ticket size={12} color="#4f46e5" strokeWidth={2.4} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 10, fontWeight: 800,
              color: '#4f46e5',
              letterSpacing: '.04em', textTransform: 'uppercase',
            }}>
              Coberto por assinatura
            </div>
            {item.appliedMembershipCard && (
              <div style={{
                fontSize: 10, color: colors.gray[700],
                fontVariantNumeric: 'tabular-nums',
              }}>
                #{item.appliedMembershipCard.cardNumber} · {item.appliedMembershipCard.planName}
              </div>
            )}
          </div>
          {onRemoveMembership && (
            <button
              onClick={onRemoveMembership}
              disabled={disabled}
              aria-label="Remover assinatura"
              title="Remover aplicação da assinatura (item volta ao preço normal)"
              style={{
                background: 'none', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
                padding: 3, display: 'flex',
                color: '#4f46e5',
                opacity: disabled ? 0.4 : 1,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <XCircle size={14} strokeWidth={2.2} />
            </button>
          )}
        </div>
      )}

      {/* Badge "pacote disponível" — clica pra aplicar via modal */}
      {!isCovered && suggestion && onUsePackage && (
        <button
          onClick={onUsePackage}
          disabled={disabled}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 10px',
            background: 'rgba(220,38,38,0.05)',
            border: '1px dashed rgba(220,38,38,0.35)',
            borderRadius: 8,
            cursor: disabled ? 'not-allowed' : 'pointer',
            textAlign: 'left',
            width: '100%',
            fontFamily: typography.fontFamily,
            opacity: disabled ? 0.5 : 1,
            transition: `all ${transitions.fast}`,
            WebkitTapHighlightColor: 'transparent',
          }}
          onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = 'rgba(220,38,38,0.10)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.05)' }}
        >
          <Layers size={12} color={colors.red.DEFAULT} strokeWidth={2.4} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 10, fontWeight: 800,
              color: colors.red.DEFAULT,
              letterSpacing: '.04em', textTransform: 'uppercase',
            }}>
              Pacote disponível
            </div>
            <div style={{ fontSize: 10, color: colors.gray[700] }}>
              #{suggestion.cardNumber} · {suggestion.remaining} restante(s) — toque para aplicar
            </div>
          </div>
        </button>
      )}

      {/* Linha inferior: qty + prof */}
      <div style={{
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        paddingTop: 8,
        borderTop: `1px dashed ${colors.gray.border}`,
        flexDirection: isMobile ? 'column' : 'row',
      }}>
        {/* Qty stepper */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          background: colors.background.page,
          border: `1px solid ${colors.gray.borderMd}`,
          borderRadius: 8,
          padding: 2,
          flexShrink: 0,
          width: isMobile ? '100%' : 'auto',
          justifyContent: isMobile ? 'center' : 'flex-start',
        }}>
          <button
            onClick={() => item.quantity > 1 && onChangeQty(item.quantity - 1)}
            disabled={disabled || item.quantity <= 1 || isCovered}
            aria-label="Diminuir"
            style={{
              width: 26, height: 26, borderRadius: 6,
              border: 'none', background: 'transparent',
              cursor: (disabled || item.quantity <= 1 || isCovered) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: (disabled || item.quantity <= 1 || isCovered) ? 0.3 : 1,
              color: colors.gray[700],
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Minus size={11} strokeWidth={2.5} />
          </button>
          <span style={{
            minWidth: 28, textAlign: 'center',
            fontSize: 13, fontWeight: 700,
            color: colors.gray[900],
            fontVariantNumeric: 'tabular-nums',
          }}>{item.quantity}</span>
          <button
            onClick={() => onChangeQty(item.quantity + 1)}
            disabled={disabled || isCovered}
            aria-label="Aumentar"
            style={{
              width: 26, height: 26, borderRadius: 6,
              border: 'none', background: 'transparent',
              cursor: (disabled || isCovered) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: (disabled || isCovered) ? 0.3 : 1,
              color: colors.gray[700],
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Plus size={11} strokeWidth={2.5} />
          </button>
        </div>

        {/* Prof picker */}
        <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
          <ProfPicker
            professionals={professionals}
            value={item.professionalId ?? null}
            onChange={onChangeProf}
            label="Profissional do item"
            disabled={disabled || isCovered}
            compact
          />
        </div>

        {isOverride && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 7px',
            background: 'rgba(245,158,11,0.10)',
            border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: 6,
            fontSize: 9, fontWeight: 700,
            color: '#b45309',
            letterSpacing: '.04em', textTransform: 'uppercase',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}>
            <Users size={9} strokeWidth={2.5} />
            Override
          </div>
        )}
      </div>
    </div>
  )
}
