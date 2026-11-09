// src/features/clients/types.ts
// @eligi:clients-types-v2 — contrato do GET /clients e GET /clients/:id
// depois do back 8ab8d85 (gasto pelo valor cobrado em cada visita).

export interface ClientListItem {
  id:                 string
  name:               string
  /** null quando o cargo nao ve contato (STAFF/BASIC_STAFF) */
  phone:              string | null
  email:              string | null
  cpf:                string | null
  birthLabel?:        string | null
  createdAt:          string
  totalBookings:      number
  /** visitas = atendimentos concluidos; grupo conta 1 */
  visits:             number
  completed:          number
  canceled:           number
  /** gasto: vendas confirmadas (liquido) + mensalidades do clube */
  spent:              number
  totalRevenue:       number
  spentEstimated:     boolean
  lastVisit:          string | null
  daysSinceLastVisit: number | null
  lapsed:             boolean
  hasClub:            boolean
}

export interface ClientListResponse {
  clients: ClientListItem[]
  total:   number
  page:    number
  pages:   number
  stats?:  { totalClients: number; lapsedDays: number }
}

/** Aba da lista. Cada uma vira orderBy/segment no GET /clients. */
export type ClientsTab = 'az' | 'spent' | 'recent' | 'lapsed'

export type CoveredBy = 'CLUB' | 'PACKAGE' | 'MEMBERSHIP' | null

export interface SpendBreakdown {
  services:  number
  products:  number
  packages:  number
  club:      number
  estimated: number
  /** desconto do caixa + nota de credito; sempre >= 0 */
  discounts: number
  total:     number
}

export interface ClientMetrics {
  totalBookings:      number
  completed:          number
  canceled:           number
  confirmed:          number
  noShows:            number
  totalRevenue:       number
  lastVisit:          string | null
  favoriteService:    string | null
  avgMonthly:         number
  visits:             number
  firstVisit:         string | null
  daysSinceLastVisit: number | null
  lapsed:             boolean
  ticketAverage:      number
  frequencyDays:      number | null
  nextExpectedAt:     string | null
  spend:              SpendBreakdown
  estimatedVisits:    number
}

export interface HistoryLine {
  bookingId:        string
  serviceName:      string
  serviceColor:     string | null
  professionalName: string | null
  /** valor cobrado naquela visita; null = ainda nao houve venda */
  charged:          number | null
  tablePrice:       number | null
  coveredBy:        CoveredBy
  estimated:        boolean
}

export interface HistoryExtra {
  type:      'PRODUCT' | 'PACKAGE' | 'MEMBERSHIP' | 'SERVICE'
  name:      string
  quantity:  number
  total:     number
  coveredBy: CoveredBy
}

export interface HistoryVisit {
  key:       string
  startAt:   string
  endAt:     string
  status:    'CONFIRMED' | 'COMPLETED' | 'CANCELED' | 'NO_SHOW'
  services:  HistoryLine[]
  extras:    HistoryExtra[]
  total:     number | null
  paid:      boolean
  estimated: boolean
}

export interface PriceChange {
  serviceId:   string
  serviceName: string
  from:        number
  to:          number
  at:          string
}

export interface ClubInfo {
  planName:         string
  planColor:        string | null
  status:           string
  value:            number | null
  startedAt:        string
  currentPeriodEnd: string | null
  fichas:           number
}

export interface ClientProfile {
  id:            string
  name:          string
  phone:         string | null
  email:         string | null
  cpf:           string | null
  /** havia contato, mas o cargo nao pode ve-lo */
  contactMasked?: boolean
  birthLabel:    string | null
  createdAt:     string
  metrics:       ClientMetrics
  history:       HistoryVisit[]
  historyTotal:  number
  priceChanges:  PriceChange[]
  club:          ClubInfo | null
}
