// src/features/services/utils/format.ts
// @eligi:service-money-intl

/** Ex.: 90 -> "1h 30min" */
export function formatDuration(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h > 0 && m > 0) return `${h}h ${m}min`
  if (h > 0)          return `${h}h`
  return `${m}min`
}

// Separador de milhar via Intl. O `toFixed(2).replace('.', ',')` anterior
// produzia "R$ 1200,00" — e desde a fatia 2 o preco aparece em destaque na
// lista, onde o numero sem ponto faz o olho tropecar.
// Escopo desta correcao: SO o modulo de servicos. As outras copias de
// formatacao de dinheiro espalhadas pelo repo sao refactor proprio.
const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatPrice(p: number | null | undefined): string {
  if (p == null) return '—'
  return BRL.format(p)
}
