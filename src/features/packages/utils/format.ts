// src/features/packages/utils/format.ts
import { ValidityType, PackageCardStatus, PackageCard } from '../types'

export function fmtBRL(v: number): string {
  return `R$ ${v.toFixed(2).replace('.', ',')}`
}

export function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

export function fmtDateTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export const VALIDITY_OPTIONS: Array<{ value: ValidityType; label: string; needsValue: boolean }> = [
  { value: 'NEVER',        label: 'Nunca expira',        needsValue: false },
  { value: 'DAYS',         label: 'X dias',              needsValue: true  },
  { value: 'MONTHS',       label: 'X meses',             needsValue: true  },
  { value: 'END_OF_MONTH', label: 'Até o fim do mês',    needsValue: false },
  { value: 'END_OF_YEAR',  label: 'Até o fim do ano',    needsValue: false },
]

export function describeValidity(type: ValidityType, value: number | null | undefined): string {
  switch (type) {
    case 'NEVER':         return 'Nunca expira'
    case 'DAYS':          return `${value ?? 0} dias`
    case 'MONTHS':        return `${value ?? 0} ${value === 1 ? 'mês' : 'meses'}`
    case 'END_OF_MONTH':  return 'Até o fim do mês'
    case 'END_OF_YEAR':   return 'Até o fim do ano'
    default:              return '—'
  }
}

export const STATUS_LABEL: Record<PackageCardStatus, string> = {
  ACTIVE:   'Ativo',
  DEPLETED: 'Utilizado',
  EXPIRED:  'Expirado',
  CANCELED: 'Cancelado',
}

export const STATUS_COLOR: Record<PackageCardStatus, { fg: string; bg: string }> = {
  ACTIVE:   { fg: '#15803d', bg: 'rgba(22,163,74,0.10)' },
  DEPLETED: { fg: '#475569', bg: 'rgba(0,0,0,0.06)' },
  EXPIRED:  { fg: '#b45309', bg: 'rgba(245,158,11,0.12)' },
  CANCELED: { fg: '#991b1b', bg: 'rgba(220,38,38,0.10)' },
}

export function getCardBalance(card: PackageCard): { used: number; total: number } {
  if (!card.balances || card.balances.length === 0) return { used: 0, total: 0 }
  const used  = card.balances.reduce((s, b) => s + b.usedQty, 0)
  const total = card.balances.reduce((s, b) => s + b.initialQty, 0)
  return { used, total }
}

/** Formata número do cartão com prefixo # */
export function formatCardNumber(num: string): string {
  return `#${num}`
}

/** Calcula soma total dos itens (sem desconto) e o "preço normal" pra mostrar saving */
export function calcItemsSum(items: Array<{ quantity: number; unitPrice: number }>): number {
  return items.reduce((s, it) => s + it.quantity * it.unitPrice, 0)
}
