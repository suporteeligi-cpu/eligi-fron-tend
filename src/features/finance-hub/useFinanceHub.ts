'use client'
// src/features/finance-hub/useFinanceHub.ts
// @eligi:fin-hub-hook — dados do painel /dashboard/financeiro (out/2026).
//
// So le endpoints que ja existem, todos do dono e filtrados pelo negocio no back:
//   resultado   GET /reports/fluxo-caixa?period=YYYY-MM   (raias.consolidado)
//   vendas      GET /sales/report (summary do mes)
//   a pagar     GET /payouts/commissions/pending-summary + GET /payouts?status=PENDING
//   pago no mes GET /payouts?status=PAID&dateField=paid
// Despesas ficam com o useExpenses da propria feature (a tela de Despesas usa o mesmo).
//
// Cada bloco falha sozinho: erro em um nao apaga os outros. Resultado vira estado
// so no callback da promise (React Compiler: nada de setState sincrono no efeito).
// Ao recarregar o mesmo mes os numeros antigos ficam na tela ate os novos chegarem.

import { useCallback, useEffect, useState } from 'react'
import dayjs from 'dayjs'
import api from '@/shared/lib/apiClient'
import type { FluxoCaixaData } from '@/features/reports/types'
import type { SalesReportResponse } from '@/features/sales-report/types'
import type { PayoutListItem, PendingSummaryResponse } from '@/features/payouts/types'

export interface HubResult {
  entradas: number
  saidas:   number
  saldo:    number
  margem:   number
  parcial:  boolean
}

export interface HubSales {
  gross:  number
  count:  number
  ticket: number
}

export interface HubToPay {
  total: number
  profs: number
}

export interface HubPaid {
  total: number
  count: number
}

export interface FinanceHubData {
  /** null = nao carregou (o bloco mostra o erro, nunca um zero falso). */
  result: HubResult | null
  sales:  HubSales | null
  toPay:  HubToPay | null
  paid:   HubPaid | null
}

const LIST_LIMIT = 200

function pickResult(d: FluxoCaixaData): HubResult {
  const c = d.raias?.consolidado
  if (c) {
    return { entradas: c.entradas, saidas: c.saidas, saldo: c.saldo, margem: c.margem, parcial: d.raias.parcial }
  }
  // back antigo sem raias: os campos legados tem a mesma conta da raia operacional
  return { entradas: d.kpis.entradas, saidas: d.kpis.saidas, saldo: d.kpis.saldo, margem: d.kpis.margem, parcial: false }
}

function value<T>(r: PromiseSettledResult<T>): T | null {
  return r.status === 'fulfilled' ? r.value : null
}

async function fetchHub(month: string): Promise<FinanceHubData> {
  const start = dayjs(`${month}-01`)
  const end   = start.endOf('month')

  const [fluxo, sales, pendingSummary, pendingPayouts, paidPayouts] = await Promise.allSettled([
    api.get<FluxoCaixaData>('/reports/fluxo-caixa', { params: { period: month } })
      .then(r => pickResult(r.data)),
    api.get<{ data: SalesReportResponse }>('/sales/report', {
      params: { dateFrom: start.format('YYYY-MM-DD'), dateTo: end.format('YYYY-MM-DD'), page: 1 },
    }).then(r => r.data.data.summary),
    api.get<{ data: PendingSummaryResponse }>('/payouts/commissions/pending-summary')
      .then(r => r.data.data),
    api.get<{ data: PayoutListItem[] }>('/payouts', { params: { status: 'PENDING', limit: LIST_LIMIT } })
      .then(r => r.data.data),
    api.get<{ data: PayoutListItem[] }>('/payouts', {
      params: {
        status:    'PAID',
        dateField: 'paid',
        dateFrom:  start.startOf('day').toISOString(),
        dateTo:    end.toISOString(),
        limit:     LIST_LIMIT,
      },
    }).then(r => r.data.data),
  ])

  const s = value(sales)

  // A pagar = pagamentos ja gerados e nao pagos + periodo encerrado ainda nao gerado.
  // As duas fontes nao se sobrepoem (comissao do periodo encerrado ainda nao tem payout).
  const summary = value(pendingSummary)
  const pending = value(pendingPayouts)
  let toPay: HubToPay | null = null
  if (summary && Array.isArray(summary.professionals) && Array.isArray(pending)) {
    const profs = new Set<string>()
    let total = 0
    for (const p of pending) {
      total += p.totalAmount
      profs.add(p.professionalId)
    }
    for (const p of summary.professionals) {
      if (p.closedTotal > 0) {
        total += p.closedTotal
        profs.add(p.professional.id)
      }
    }
    toPay = { total: Math.round(total * 100) / 100, profs: profs.size }
  }

  const paidList = value(paidPayouts)
  const paid: HubPaid | null = Array.isArray(paidList)
    ? { total: Math.round(paidList.reduce((acc, p) => acc + p.totalAmount, 0) * 100) / 100, count: paidList.length }
    : null

  return {
    result: value(fluxo),
    sales:  s ? { gross: s.grossTotal, count: s.confirmedCount, ticket: s.ticketAverage } : null,
    toPay,
    paid,
  }
}

export function useFinanceHub(month: string) {
  const [state, setState] = useState<{ month: string; data: FinanceHubData } | null>(null)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let alive = true
    void fetchHub(month).then(data => {
      if (alive) setState({ month, data })
    })
    return () => { alive = false }
  }, [month, nonce])

  const refetch = useCallback(() => setNonce(n => n + 1), [])

  const ready = state !== null && state.month === month
  return {
    data:    ready ? state.data : null,
    loading: !ready,
    refetch,
  }
}
