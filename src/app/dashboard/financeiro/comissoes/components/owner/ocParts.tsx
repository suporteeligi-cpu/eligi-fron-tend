'use client'
// src/app/dashboard/financeiro/comissoes/components/owner/ocParts.tsx
// @eligi:ocf-parts — pecas e contas puras da tela do dono.

import type { PayoutSettings, PendingProfessionalSplit } from '@/features/payouts/types'
import { dayKeySP, monthLabel, rangeLabel } from '../my/mcFormat'

export interface OcPerson {
  id: string
  name: string
  avatarUrl: string | null
  closedTotal: number; closedService: number; closedProduct: number; closedCount: number
  openTotal: number; openService: number; openProduct: number; openCount: number
}

/** Back antigo nao manda open*: cai no "current" (andamento + fila), que era o que existia. */
export function toPerson(p: PendingProfessionalSplit): OcPerson {
  const openService = p.openServiceTotal ?? p.currentServiceTotal
  const openProduct = p.openProductTotal ?? p.currentProductTotal
  return {
    id: p.professional.id,
    name: p.professional.name,
    avatarUrl: p.professional.avatarUrl,
    closedTotal: p.closedTotal, closedService: p.closedServiceTotal, closedProduct: p.closedProductTotal, closedCount: p.closedCount,
    openTotal: p.openTotal ?? openService + openProduct,
    openService, openProduct,
    openCount: p.openCount ?? p.currentCount,
  }
}

function isPhoto(u?: string | null) {
  return !!u && (u.startsWith('http') || u.startsWith('data:') || u.startsWith('/'))
}

export function Avatar({ name, url, lg }: { name: string; url: string | null; lg?: boolean }) {
  const ini = name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'
  return (
    <span className={`oc-av${lg ? ' lg' : ''}`} aria-hidden>
      {isPhoto(url)
        ? <span style={{ display: 'block', width: '100%', height: '100%', backgroundImage: `url("${url}")`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        : ini}
    </span>
  )
}

const WD_PLURAL = ['domingos', 'segundas', 'terças', 'quartas', 'quintas', 'sextas', 'sábados']

/** "semanal, paga às quintas" | "quinzenal, paga às sextas" | "mensal, paga todo dia 5" */
export function freqText(s: PayoutSettings | null): string {
  if (!s || !s.id) return 'pagamentos ainda não configurados'
  if (s.frequency === 'MONTHLY') return `mensal, paga todo dia ${s.monthDay ?? 1}`
  const wd = s.weekday != null ? WD_PLURAL[s.weekday] : null
  const f = s.frequency === 'WEEKLY' ? 'semanal' : 'quinzenal'
  return wd ? `${f}, paga às ${wd}` : f
}

/** "SEMANA" | "QUINZENA" | "MÊS" */
export function kindWord(s: PayoutSettings | null): string {
  if (s?.frequency === 'BIWEEKLY') return 'quinzena'
  if (s?.frequency === 'MONTHLY') return 'mês'
  return 'semana'
}

/** "03–09 nov" ou "nov 2026" (mensal que comeca no dia 1) */
export function periodTxt(s: PayoutSettings | null, startIso: string, endIso: string): string {
  const a = dayKeySP(startIso)
  const b = dayKeySP(endIso)
  if (s?.frequency === 'MONTHLY' && a.endsWith('-01') && a.slice(0, 7) === b.slice(0, 7)) return monthLabel(a.slice(0, 7))
  return rangeLabel(a, b)
}
