// src/features/products/utils/format.ts

import { Product } from '../types'

/** Preço em BRL */
export function formatPrice(value: number | null | undefined): string {
  if (value == null) return ''
  return `R$ ${value.toFixed(2).replace('.', ',')}`
}

/** Calcula margem percentual (price - cost) / price * 100 */
export function calculateMargin(price: number, cost: number | null | undefined): number | null {
  if (cost == null || price === 0) return null
  return ((price - cost) / price) * 100
}

/** Agrupa produtos por categoria (com "Sem categoria" pros sem) */
export function groupByCategory(products: Product[]): Map<string, Product[]> {
  const groups = new Map<string, Product[]>()
  for (const p of products) {
    const cat = p.category?.trim() || 'Sem categoria'
    const arr = groups.get(cat) ?? []
    arr.push(p)
    groups.set(cat, arr)
  }
  // Ordena dentro de cada grupo
  for (const arr of groups.values()) {
    arr.sort((a, b) => a.name.localeCompare(b.name))
  }
  return groups
}

/** Coleta lista de categorias únicas (pra autocomplete) */
export function extractCategories(products: Product[]): string[] {
  const set = new Set<string>()
  for (const p of products) {
    const cat = p.category?.trim()
    if (cat) set.add(cat)
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b))
}
