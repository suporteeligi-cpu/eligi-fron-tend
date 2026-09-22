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

/** Formata telefone brasileiro: "11999998888" → "(11) 99999-8888".
 *  Telefone é opcional no cadastro — null/undefined/'' retornam ''. */
export function formatPhone(p: string | null | undefined): string {
  if (!p) return ''
  const d = p.replace(/\D/g, '')
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return p
}

/** Mascara progressivamente enquanto digita (para inputs) */
// @eligi:birthday-mask
/** Mascara progressiva DD/MM/AAAA. O ano e OPCIONAL: "23/08" e entrada valida. */
export function maskBirthDate(v: string | null | undefined): string {
  const d = (v ?? '').replace(/\D/g, '').slice(0, 8)
  if (d.length <= 2) return d
  if (d.length <= 4) return d.slice(0, 2) + '/' + d.slice(2)
  return d.slice(0, 2) + '/' + d.slice(2, 4) + '/' + d.slice(4)
}

/** Espelha o formatBirth do back (shared/utils/birthday.ts) para o PUT, que
 *  devolve o registro cru (birthMonthDay/birthYear) e nao o birthLabel. */
export function formatBirthLabel(md: number | null | undefined, year: number | null | undefined): string | null {
  if (md === null || md === undefined || !Number.isInteger(md)) return null
  const month = Math.floor(md / 100)
  const day   = md % 100
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  const dd = String(day).padStart(2, '0')
  const mm = String(month).padStart(2, '0')
  return year ? `${dd}/${mm}/${year}` : `${dd}/${mm}`
}

export function maskPhone(v: string | null | undefined): string {
  const d = (v ?? '').replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return `(${d}`
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

/** Formata receita em BRL. Retorna "—" se for 0 ou null */
export function fmtRevenue(v: number | null | undefined): string {
  if (!v || v === 0) return '—'
  return `R$ ${v.toFixed(2).replace('.', ',')}`
}
