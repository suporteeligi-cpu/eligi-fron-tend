'use client'
// src/app/dashboard/caixa/components/CartItemRow.tsx
//
// Item do carrinho. Cobertura (R$0) por PACOTE (verde + Layers) ou ASSINATURA (verde + Ticket).
// "Coberto" desabilita qty/prof e zera o preço. Cada cobertura tem seu próprio badge + remover.

// @eligi:pricemode-cart-imports
import { useState } from 'react'
import { Minus, Plus, Trash2, Tag, Package, Layers, Ticket, XCircle, Pencil } from 'lucide-react'
import { colors, typography, transitions } from '@/shared/theme'
import { SaleItem, ProfLite } from '@/features/sales/types'
import { formatBRL } from '@/features/sales/utils/format'
import { C } from '../ui' // @eligi:caixa-item-ui
import ProfPicker from './ProfPicker'
import { useAuth } from '@/hooks/useAuth'

interface Props {
  item:           SaleItem
  professionals:  ProfLite[]
  isMobile:       boolean
  onChangeQty:    (newQty: number) => void
  onChangeProf:   (profId: string | null) => void
  /* @eligi:pricemode-cart-props — valor final de servico "a partir de" */
  onChangePrice?: (unitPrice: number) => void
  onRemove:       () => void
  onRemovePackage?: () => void        // remove só o pacote aplicado
  onRemoveMembership?: () => void     // ⭐ remove só a assinatura aplicada
  suggestion?:    { cardNumber: string; packageName: string; remaining: number } | null
  onUsePackage?:  () => void
  disabled?:      boolean
}

const TYPE_LABEL: Record<string, string> = {
  SERVICE: 'Serviço', PRODUCT: 'Produto', PACKAGE: 'Pacote', MEMBERSHIP: 'Assinatura',
}

export default function CartItemRow({
  item, professionals, isMobile,
  onChangeQty, onChangeProf, onChangePrice, onRemove, onRemovePackage, onRemoveMembership,
  suggestion, onUsePackage, disabled,
}: Props) {
  const { user } = useAuth()
  const isCheckoutOnly = user?.role === 'STAFF' || user?.role === 'BASIC_STAFF'

  const Icon =
    item.type === 'PRODUCT'    ? Package :
    item.type === 'PACKAGE'    ? Layers  :
    item.type === 'MEMBERSHIP' ? Ticket  :
                                 Tag

  const color = item.product?.color
             ?? item.service?.color
             ?? item.package?.color
             ?? C.ink3 // @eligi:caixa-item-dot

  // Coberturas (R$0)
  const hasPackageApplied    = item.appliedPackageCardId != null
  const hasMembershipApplied = item.appliedMembershipCardId != null
  const isCovered            = hasPackageApplied || hasMembershipApplied

  // @eligi:pricemode-cart-state
  // `priceOverridden` significa "alguem digitou este valor" — ver updateItem no
  // back. Por isso cobrar exatamente o piso tambem conta como valor definido.
  const isFromPrice  = item.type === 'SERVICE' && item.service?.priceMode === 'FROM'
  const priceDefined = item.priceOverridden === true
  const needsPrice   = isFromPrice && !priceDefined && !isCovered
  const canEditPrice = isFromPrice && !isCovered && !isCheckoutOnly && !disabled

  const [priceDraft, setPriceDraft] = useState<string>(
    () => (item.unitPrice > 0 ? String(item.unitPrice) : ''),
  )

  function commitPrice() {
    if (!onChangePrice) return
    const parsed = Number(priceDraft.replace(',', '.'))
    // Valor invalido volta ao que o servidor tem — nunca envia lixo.
    if (!(parsed > 0)) {
      setPriceDraft(item.unitPrice > 0 ? String(item.unitPrice) : '')
      return
    }
    // Sem mudanca E ja definido = nada a fazer. Se ainda NAO foi definido, envia
    // mesmo com valor igual: e assim que o piso vira uma escolha explicita.
    if (priceDefined && Math.abs(parsed - item.unitPrice) < 0.005) return
    onChangePrice(parsed)
  }

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
          width: isMobile ? 6 : 32, height: isMobile ? 'auto' : 32, alignSelf: isMobile ? 'stretch' : 'auto',
          minHeight: isMobile ? 36 : undefined, borderRadius: isMobile ? 3 : 8,
          background: item.product?.imageUrl && !isMobile ? '#fff' : color,
          overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {isMobile ? null : item.product?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.product.imageUrl}
              alt={item.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Icon size={15} color="#fff" strokeWidth={2} />
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* @eligi:caixa-item-v2-name - nome inteiro, quebra linha em vez de cortar */}
          <div style={{
            fontSize: isMobile ? 15 : 13.5, fontWeight: 700, lineHeight: 1.25,
            color: C.ink, overflowWrap: 'anywhere',
            display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
          }}>
            {item.name}
            {item.type === 'PACKAGE' && (
              <span style={{
                fontSize: 8, fontWeight: 800,
                color: '#fff',
                background: C.ink, // @eligi:caixa-item-pkg-badge
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
            fontSize: isMobile ? 12 : 11,
            color: C.ink3,
            marginTop: 2,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ color: C.ink3 }}>{TYPE_LABEL[item.type] ?? 'Item'} · </span>
            <span style={{ color: C.ink3, fontVariantNumeric: 'tabular-nums' }}>
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
            fontFamily: C.display, fontSize: isMobile ? 17 : 14.5, fontWeight: 700,
            color: isCovered ? C.okInk : C.ink, whiteSpace: 'nowrap',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {isCovered ? 'R$ 0,00' : formatBRL(item.total)}
          </div>
          {!isMobile && (
          <button
            onClick={onRemove}
            disabled={disabled}
            aria-label="Remover"
            style={{
              width: 26, height: 26, borderRadius: 7,
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
            <Trash2 size={12} strokeWidth={2} />
          </button>
          )}
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
            background: C.sunken, // @eligi:caixa-item-sg-bg
            border: `1px dashed ${C.line2}`,
            borderRadius: 8,
            cursor: disabled ? 'not-allowed' : 'pointer',
            textAlign: 'left',
            width: '100%',
            fontFamily: typography.fontFamily,
            opacity: disabled ? 0.5 : 1,
            transition: `all ${transitions.fast}`,
            WebkitTapHighlightColor: 'transparent',
          }}
          onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = 'rgba(17,17,20,0.06)' /* @eligi:caixa-item-sg-hover */ }}
          onMouseLeave={e => { e.currentTarget.style.background = C.sunken }}
        >
          <Layers size={12} color={C.ink} strokeWidth={2.4} /* @eligi:caixa-item-sg-ink */ />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 10, fontWeight: 800,
              color: C.ink,
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

      {/* @eligi:pricemode-cart-ui — valor final de servico "a partir de" */}
      {isFromPrice && !isCovered && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '7px 10px',
          background: needsPrice ? 'rgba(220,38,38,0.05)' : colors.background.page,
          border: needsPrice
            ? '1px dashed rgba(220,38,38,0.35)'
            : `1px solid ${colors.gray.border}`,
          borderRadius: 8,
        }}>
          <Pencil
            size={12}
            color={needsPrice ? colors.red.DEFAULT : colors.gray.dimText}
            strokeWidth={2.4}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 10, fontWeight: 800,
              color: needsPrice ? colors.red.DEFAULT : colors.gray.dimText,
              letterSpacing: '.04em', textTransform: 'uppercase',
            }}>
              {needsPrice ? 'Defina o valor cobrado' : 'Valor definido'}
            </div>
            <div style={{ fontSize: 10, color: colors.gray[700] }}>
              {isCheckoutOnly
                ? 'Só um responsável pode alterar este valor'
                : `A partir de ${formatBRL(item.catalogUnitPrice ?? item.unitPrice)}`}
            </div>
          </div>
          <div style={{ position: 'relative', width: 104, flexShrink: 0 }}>
            <span style={{
              position: 'absolute', left: 8, top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 11, fontWeight: 600,
              color: colors.gray.dimText,
              pointerEvents: 'none',
            }}>R$</span>
            <input
              type="text"
              inputMode="decimal"
              value={priceDraft}
              disabled={!canEditPrice}
              onChange={e => setPriceDraft(e.target.value.replace(/[^\d,.]/g, ''))}
              onBlur={commitPrice}
              placeholder="0,00"
              aria-label="Valor cobrado"
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '7px 8px 7px 28px',
                borderRadius: 7,
                border: `1px solid ${needsPrice ? colors.red.DEFAULT : colors.gray.borderMd}`,
                fontSize: 12, fontWeight: 700,
                textAlign: 'right',
                outline: 'none',
                fontVariantNumeric: 'tabular-nums',
                fontFamily: 'inherit',
                background: canEditPrice ? '#fff' : colors.background.page,
                color: canEditPrice ? colors.gray[900] : colors.gray.dimText,
                cursor: canEditPrice ? 'text' : 'not-allowed',
                opacity: canEditPrice ? 1 : 0.55,
                WebkitTapHighlightColor: 'transparent',
              }}
            />
          </div>
        </div>
      )}

      {/* Linha inferior: qty + prof */}
      <div style={{
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        paddingTop: 8,
        borderTop: `1px dashed ${colors.gray.border}`,
        flexDirection: 'row', // @eligi:caixa-item-v2-row - qty + profissional numa linha so
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
        }}>
          <button
            onClick={() => item.quantity > 1 && onChangeQty(item.quantity - 1)}
            disabled={disabled || item.quantity <= 1 || isCovered}
            aria-label="Diminuir"
            style={{
              width: isMobile ? 36 : 26, height: isMobile ? 36 : 26, borderRadius: 6,
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
              width: isMobile ? 36 : 26, height: isMobile ? 36 : 26, borderRadius: 6,
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
        <div style={{ flex: 1, minWidth: 0 }}>
          <ProfPicker
            professionals={professionals}
            value={item.professionalId ?? null}
            onChange={onChangeProf}
            label="Profissional do item"
            disabled={disabled || (isCovered && !!item.professionalId) /* @eligi:svc-prof-covered */}
            allowNone={!isCheckoutOnly}
            compact
          />
        </div>

        {isMobile && ( /* @eligi:caixa-item-v2-trash - no celular a lixeira vai na linha de baixo */
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            aria-label={`Remover ${item.name}`}
            style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              border: `1px solid ${colors.gray.borderMd}`, background: '#fff',
              cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.ink3,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Trash2 size={15} strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  )
}
