// src/app/dashboard/financeiro/comissoes/components/my/mcTypes.ts
// @eligi:mc-d-types — contratos de GET /payouts/my-commissions,
// /payouts/my-commissions/compare e /club-settlements/commissions (escopo staff).

export type MyPeriod = 'week' | 'last_week' | 'month'

export interface CommissionItem {
  id:            string
  name:          string
  type:          string
  clientName:    string
  time:          string
  amount:        number
  baseAmount:    number
  pct:           number
  discountShare?: number | null
}

export interface CommissionDay {
  date:         string
  label:        string
  serviceCount: number
  productCount: number
  total:        number
  items:        CommissionItem[]
}

export interface PaidPayout {
  id:          string
  periodStart: string
  periodEnd:   string
  totalAmount: number
  paidAt:      string | null
  paidVia:     string | null
}

export interface MyCommissions {
  periodKind:      'week' | 'fortnight' | 'month'
  periodLabel:     string
  periodStart:     string
  periodEnd:       string
  paymentDate:     string | null
  serviceTotal:    number
  productTotal:    number
  total:           number
  previousTotal?:  number
  previousStart?:  string
  previousEnd?:    string
  previousPartial?: boolean
  serviceCount:    number
  productCount:    number
  days:            CommissionDay[]
  paidPayouts:     PaidPayout[]
}

export interface MonthSummary {
  month:        string
  label:        string
  start:        string
  end:          string
  partial:      boolean
  current:      boolean
  total:        number
  serviceTotal: number
  productTotal: number
  sales:        number
  items:        number
  avgPerSale:   number
  bestDay:      { date: string; total: number } | null
  daily:        number[]
  byService:    Array<{ name: string; type: string; total: number; count: number }>
}

export type CompareMode = 'auto' | 'full'

export interface CompareResponse {
  mode:         CompareMode
  currentMonth: string
  firstMonth:   string | null
  cutDay:       number | null
  a:            MonthSummary
  b:            MonthSummary
}

export interface ClubStaffPeriod {
  periodKey:     string
  poolTotal:     number
  totalFichas:   number
  settledAt:     string
  myFichas:      number
  myPct:         number
  myAmount:      number
  myItemPaidAt?: string | null
}

export interface ClubStaffResp {
  scope:       'staff'
  totalAmount: number
  totalFichas: number
  periods:     ClubStaffPeriod[]
}

export type ModKey = 'extrato' | 'servicos' | 'dias' | 'comparar' | 'recebi' | 'clube'

export const MODS: Array<{ key: ModKey; label: string }> = [
  { key: 'extrato',  label: 'Extrato' },
  { key: 'servicos', label: 'Serviços' },
  { key: 'dias',     label: 'Dias' },
  { key: 'comparar', label: 'Comparar' },
  { key: 'recebi',   label: 'Já recebi' },
  { key: 'clube',    label: 'Clube' },
]
