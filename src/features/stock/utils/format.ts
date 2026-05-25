// src/features/stock/utils/format.ts

import { StockMovementType, StockStatus } from '../types'

/** Determina status do produto baseado em stock + stockAlert */
export function getStockStatus(
  trackStock: boolean,
  stock: number,
  stockAlert: number | null | undefined,
): StockStatus {
  if (!trackStock) return 'untracked'
  if (stock <= 0) return 'out'
  if (stockAlert != null && stock <= stockAlert) return 'low'
  return 'ok'
}

/** Cores associadas a cada status (segue a paleta eligi) */
export const STATUS_COLOR_MAP: Record<StockStatus, {
  bg: string
  fg: string
  border: string
  label: string
}> = {
  ok:        { bg: 'rgba(22,163,74,0.10)',  fg: '#15803d', border: 'rgba(22,163,74,0.25)', label: 'Em estoque' },
  low:       { bg: 'rgba(245,158,11,0.12)', fg: '#b45309', border: 'rgba(245,158,11,0.30)', label: 'Estoque baixo' },
  out:       { bg: 'rgba(220,38,38,0.10)',  fg: '#991b1b', border: 'rgba(220,38,38,0.25)', label: 'Esgotado' },
  untracked: { bg: 'rgba(0,0,0,0.04)',      fg: '#6b7280', border: 'rgba(0,0,0,0.08)',     label: 'Não controla' },
}

/** Texto do tipo de movimentação */
export const MOVEMENT_TYPE_LABEL: Record<StockMovementType, string> = {
  IN:     'Entrada',
  OUT:    'Saída',
  ADJUST: 'Ajuste',
  LOSS:   'Perda',
}

/** Cor do badge do tipo de movimentação */
export const MOVEMENT_TYPE_COLOR: Record<StockMovementType, {
  bg: string
  fg: string
}> = {
  IN:     { bg: 'rgba(22,163,74,0.10)',  fg: '#15803d' },
  OUT:    { bg: 'rgba(220,38,38,0.10)',  fg: '#991b1b' },
  ADJUST: { bg: 'rgba(59,130,246,0.10)', fg: '#1d4ed8' },
  LOSS:   { bg: 'rgba(245,158,11,0.12)', fg: '#b45309' },
}

/** Quantos itens "movimentaram" (positivo ou negativo conforme tipo) */
export function movementDelta(type: StockMovementType, quantity: number, stockBefore: number): number {
  switch (type) {
    case 'IN':    return  quantity
    case 'OUT':   return -quantity
    case 'LOSS':  return -quantity
    case 'ADJUST': {
      // ADJUST trata quantity como NOVO saldo absoluto
      return quantity - stockBefore
    }
  }
}

/** Formata número com sinal + separador (+50, -3) */
export function formatDelta(delta: number): string {
  const sign = delta > 0 ? '+' : ''
  return `${sign}${delta}`
}

/** Data relativa estilo "há 2h", "ontem", "há 3 dias" */
export function formatRelative(isoDate: string): string {
  const date = new Date(isoDate)
  const now  = new Date()
  const diffMs = now.getTime() - date.getTime()
  const minutes = Math.floor(diffMs / 60_000)
  const hours   = Math.floor(diffMs / 3_600_000)
  const days    = Math.floor(diffMs / 86_400_000)

  if (minutes < 1) return 'agora'
  if (minutes < 60) return `há ${minutes}min`
  if (hours < 24)   return `há ${hours}h`
  if (days === 1)   return 'ontem'
  if (days < 7)     return `há ${days} dias`
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

/** Valor em BRL (compatível com format.ts dos produtos) */
export function formatBRL(value: number | null | undefined): string {
  if (value == null) return ''
  return `R$ ${value.toFixed(2).replace('.', ',')}`
}
