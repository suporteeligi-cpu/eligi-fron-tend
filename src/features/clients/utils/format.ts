// src/features/clients/utils/format.ts

import { colors } from '@/shared/theme'

const AVATAR_COLORS = [
  colors.red.gradient,
  'linear-gradient(135deg, #475569, #334155)',
  'linear-gradient(135deg, #7c3aed, #6d28d9)',
  'linear-gradient(135deg, #0891b2, #0e7490)',
  'linear-gradient(135deg, #059669, #047857)',
  'linear-gradient(135deg, #d97706, #b45309)',
] as const

/** Gera gradiente de avatar baseado no primeiro caractere do nome (estável) */
export function avatarColor(name: string): string {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

/** Iniciais (até 2 primeiras letras do nome em caixa alta) */
export function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

/** Formata telefone brasileiro: "11999998888" → "(11) 99999-8888" */
export function formatPhone(p: string): string {
  const d = p.replace(/\D/g, '')
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return p
}

/** Mascara progressivamente enquanto digita (para inputs) */
export function maskPhone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return `(${d}`
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

/** Formata receita em BRL. Retorna "—" se for 0 ou null */
export function fmtRevenue(v: number | null | undefined): string {
  if (!v || v === 0) return '—'
  return `R$ ${v.toFixed(2).replace('.', ',')}`
}
