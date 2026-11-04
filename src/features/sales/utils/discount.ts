// src/features/sales/utils/discount.ts
// @eligi:caixa-discount-utils
//
// Regras do desconto no carrinho (puras, sem React).
// O back guarda o desconto SEMPRE em reais (Sale.discount); o "%" e so um jeito
// de digitar. O teto e o subtotal: o back recusa acima disso
// (DISCOUNT_ABOVE_SUBTOTAL), entao a tela avisa antes de mandar.

export type DiscountUnit = 'BRL' | 'PCT'

export function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** "10", "10,5", "1.234,50" -> numero. Vazio = 0. Lixo = NaN. */
export function parseMoneyInput(raw: string): number {
  const s = raw.trim()
  if (s === '') return 0
  const normalized = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s
  const n = Number(normalized)
  return Number.isFinite(n) ? n : Number.NaN
}

/** Valor em reais que o desconto digitado representa. */
export function discountToBRL(raw: number, unit: DiscountUnit, subtotal: number): number {
  if (!Number.isFinite(raw) || raw < 0) return Number.NaN
  if (unit === 'PCT') return round2((Math.max(0, subtotal) * Math.min(raw, 100)) / 100)
  return round2(raw)
}

export interface DiscountCheck {
  value: number            // reais a gravar
  error: string | null     // mensagem para a tela (null = pode gravar)
}

export function checkDiscount(raw: number, unit: DiscountUnit, subtotal: number): DiscountCheck {
  if (!Number.isFinite(raw) || raw < 0) {
    return { value: 0, error: 'Digite um desconto válido.' }
  }
  if (unit === 'PCT' && raw > 100) {
    return { value: 0, error: 'O desconto vai até 100%.' }
  }
  const value = discountToBRL(raw, unit, subtotal)
  if (value - subtotal > 0.005) {
    return { value, error: 'O desconto passou do subtotal da venda.' }
  }
  return { value, error: null }
}

/** "16,7%" do subtotal; vazio quando nao ha desconto ou subtotal. */
export function discountPercentLabel(discount: number, subtotal: number): string {
  if (discount <= 0 || subtotal <= 0) return ''
  const pct = Math.round((discount / subtotal) * 1000) / 10
  return `${String(pct).replace('.', ',')}%`
}

/** Texto do campo a partir do valor em reais ("10" ou "10,50"). */
export function brlToInput(v: number): string {
  if (!v) return ''
  return Number.isInteger(v) ? String(v) : v.toFixed(2).replace('.', ',')
}
