// src/app/dashboard/financeiro/comissoes/components/owner/tcTypes.ts
// @eligi:tcf-types — resposta de GET /payouts/team-compare (comparativos da equipe).
// Espelha TeamCompareResponse do back (payouts.team-compare.ts).

export type TcMetricKey =
  | 'commission' | 'revenue' | 'attendances' | 'ticket' | 'newClients'
  | 'loyalPct' | 'chose' | 'noShowPct' | 'occupancyPct' | 'revenueProduct' | 'clubFichas'

export interface TcMetric {
  key:    TcMetricKey
  label:  string
  kind:   'money' | 'count' | 'pct'
  better: 'up' | 'down'
}

export interface TcStats {
  commission: number
  commissionService: number
  commissionProduct: number
  revenue: number
  revenueService: number
  revenueProduct: number
  sales: number
  ticket: number
  attendances: number
  servicesDone: number
  coveredServices: number
  clients: number
  newClients: number
  loyalClients: number
  loyalPct: number | null
  chose: number
  noShows: number
  noShowPct: number | null
  cancels: number
  bookedMinutes: number
  availableMinutes: number
  occupancyPct: number | null
  clubFichas: number
  dailyCommission: number[]
  topServices: Array<{ name: string; count: number; revenue: number }>
}

export interface TcWindowInfo {
  month: string
  label: string
  start: string
  end: string
  partial: boolean
  current: boolean
  days: number
}

export interface TcProfessional {
  id: string
  name: string
  avatarUrl: string | null
  active: boolean
  a: TcStats
  b: TcStats
  rank: Partial<Record<TcMetricKey, number>>
}

export interface TeamCompareResponse {
  mode: 'auto' | 'full'
  currentMonth: string
  firstMonth: string | null
  cutDay: number | null
  a: TcWindowInfo
  b: TcWindowInfo
  metrics: TcMetric[]
  professionals: TcProfessional[]
  team: { a: TcStats; b: TcStats; size: number }
}

/** Com quem a ficha compara o profissional */
export type TcVs = 'self' | 'team' | 'other'
