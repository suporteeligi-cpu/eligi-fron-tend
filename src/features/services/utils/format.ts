// src/features/services/utils/format.ts

import { Service } from '../types'

/** Formata duração: 90 → "1h 30min", 60 → "1h", 30 → "30min" */
export function formatDuration(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h > 0 && m > 0) return `${h}h ${m}min`
  if (h > 0)          return `${h}h`
  return `${m}min`
}

/** Formata preço em BRL. Retorna "—" se null/undefined */
export function formatPrice(p: number | null | undefined): string {
  if (p == null) return '—'
  return `R$ ${p.toFixed(2).replace('.', ',')}`
}

/** Agrupa serviços por categoria. Sem categoria → "Sem categoria" */
export function groupByCategory(services: Service[]): Record<string, Service[]> {
  return services.reduce<Record<string, Service[]>>((acc, s) => {
    const key = s.category?.trim() || 'Sem categoria'
    if (!acc[key]) acc[key] = []
    acc[key].push(s)
    return acc
  }, {})
}
