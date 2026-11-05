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

// ── Quem paga o desconto (@eligi:dcm-utils, nov/2026) ──────────────────────
// Mesma regra do back (sale-discount-commission.rules.ts). Aqui so serve para
// a pergunta mostrar os numeros; quem decide a comissao e o back no fechamento.

export type DiscountPayer = 'ESTABLISHMENT' | 'SPLIT'

export function discountPayerLabel(mode: DiscountPayer): string {
  return mode === 'SPLIT' ? 'Desconto dividido com a comissão' : 'Loja paga o desconto'
}

export function discountPayerShort(mode: DiscountPayer): string {
  return mode === 'SPLIT' ? 'dividido' : 'loja paga'
}

/** Divide o desconto entre os itens pelo valor de cada um (centavo que sobra vai no maior). */
export function splitDiscountByItems(
  items: ReadonlyArray<{ id: string; total: number }>,
  discount: number,
): Map<string, number> {
  const out = new Map<string, number>()
  const pos = items.filter(it => it.total > 0)
  const sum = round2(pos.reduce((s, it) => s + it.total, 0))
  const d = round2(Math.min(Math.max(0, discount), sum))
  if (pos.length === 0 || d <= 0) return out
  let given = 0
  for (const it of pos) {
    const share = round2(Math.min(it.total, (d * it.total) / sum))
    out.set(it.id, share)
    given = round2(given + share)
  }
  let rest = round2(d - given)
  for (const it of [...pos].sort((a, b) => b.total - a.total)) {
    if (Math.abs(rest) < 0.005) break
    const cur = out.get(it.id) ?? 0
    const next = round2(Math.min(it.total, Math.max(0, cur + rest)))
    rest = round2(rest - (next - cur))
    out.set(it.id, next)
  }
  return out
}

interface CommissionableItem {
  id: string
  type: string
  total: number
  professionalId?: string | null
}

/** Itens que geram comissao e entram na pergunta (servico/produto com profissional e valor). */
export function commissionedItems<T extends CommissionableItem>(items: ReadonlyArray<T>): T[] {
  return items.filter(it => !!it.professionalId && it.total > 0 && (it.type === 'SERVICE' || it.type === 'PRODUCT'))
}

/** Base da comissao nos dois jeitos: preco cheio x valor com o desconto dividido. */
export function commissionBases(
  items: ReadonlyArray<CommissionableItem>,
  discount: number,
): { full: number; split: number } {
  const shares = splitDiscountByItems(items, discount)
  let full = 0
  let split = 0
  for (const it of commissionedItems(items)) {
    full = round2(full + it.total)
    split = round2(split + Math.max(0, it.total - (shares.get(it.id) ?? 0)))
  }
  return { full, split }
}
