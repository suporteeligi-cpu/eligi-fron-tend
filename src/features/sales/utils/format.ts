// src/features/sales/utils/format.ts

import { PaymentMethod } from '../types'
import { Banknote, Smartphone, CreditCard, ArrowLeftRight, Wallet } from 'lucide-react'

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH:     'Dinheiro',
  PIX:      'Pix',
  CREDIT:   'Crédito',
  DEBIT:    'Débito',
  TRANSFER: 'Transferência',
  OTHER:    'Outro',
}

export const PAYMENT_METHOD_ICON: Record<PaymentMethod, typeof Banknote> = {
  CASH:     Banknote,
  PIX:      Smartphone,
  CREDIT:   CreditCard,
  DEBIT:    CreditCard,
  TRANSFER: ArrowLeftRight,
  OTHER:    Wallet,
}

export const PAYMENT_METHOD_ORDER: PaymentMethod[] = [
  'CASH', 'PIX', 'CREDIT', 'DEBIT', 'TRANSFER', 'OTHER',
]

/** Formata valor em BRL */
export function formatBRL(value: number | null | undefined): string {
  if (value == null) return 'R$ 0,00'
  return `R$ ${value.toFixed(2).replace('.', ',')}`
}

/** Iniciais para avatar */
export function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase()
}

/** Data relativa simples */
export function formatRelativeTime(iso: string): string {
  const date = new Date(iso)
  const now  = new Date()
  const diffMs = now.getTime() - date.getTime()
  const minutes = Math.floor(diffMs / 60_000)
  const hours   = Math.floor(diffMs / 3_600_000)
  const days    = Math.floor(diffMs / 86_400_000)

  if (minutes < 1) return 'agora'
  if (minutes < 60) return `há ${minutes}min`
  if (hours < 24)   return `há ${hours}h`
  if (days === 1)   return 'ontem'
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

/** Hora local */
export function formatTimeOnly(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit',
  })
}

/** Data + hora */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

/** ID curto pra exibir (#A1B2C3) */
export function shortId(id: string): string {
  return id.slice(-6).toUpperCase()
}
