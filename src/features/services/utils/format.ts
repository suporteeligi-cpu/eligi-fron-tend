// src/features/services/utils/format.ts
import { Service } from '../types'

export function formatDuration(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h > 0 && m > 0) return `${h}h ${m}min`
  if (h > 0)          return `${h}h`
  return `${m}min`
}

export function formatPrice(p: number | null | undefined): string {
  if (p == null) return '—'
  return `R$ ${p.toFixed(2).replace('.', ',')}`
}

/**
 * Agrupa serviços por categoria.
 * Prioridade: serviceCategory.name → category (texto legado) → 'Sem categoria'
 * Ordena grupos pela order da categoria estruturada, depois alfabético.
 */
export function groupByCategory(services: Service[]): Record<string, Service[]> {
  const acc: Record<string, Service[]> = {}
  const orderMap: Record<string, number> = {}

  for (const s of services) {
    const key   = s.serviceCategory?.name ?? s.category?.trim() ?? 'Sem categoria'
    const order = s.serviceCategory?.order ?? 999
    if (!acc[key]) { acc[key] = []; orderMap[key] = order }
    acc[key].push(s)
  }

  // Retorna ordenado pela order da categoria
  return Object.fromEntries(
    Object.entries(acc).sort(([a], [b]) => (orderMap[a] ?? 999) - (orderMap[b] ?? 999) || a.localeCompare(b))
  )
}
