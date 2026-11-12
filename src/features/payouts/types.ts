// src/features/payouts/types.ts

export type PayoutFrequency = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'
export type PayoutStatus    = 'PENDING' | 'PAID' | 'CANCELED'
export type PayoutMethod    = 'PIX' | 'CASH' | 'TRANSFER' | 'OTHER'
export type CommissionType  = 'SERVICE' | 'PRODUCT'

export interface PayoutSettings {
  id:               string | null
  businessId:       string
  frequency:        PayoutFrequency
  weekday:          number | null
  periodStartDay:   number | null   // dia de início do período (0=Dom…6=Sáb)
  periodAnchor?:    string | null   // @eligi:payout-anchor-type — quinzenal: "YYYY-MM-DD" em que uma quinzena começa
  monthDay:         number | null
  includeServices:  boolean
  includeProducts:  boolean
  enabled:          boolean
}

export interface PendingProfessional {
  professional: {
    id:        string
    name:      string
    avatarUrl: string | null
  }
  serviceTotal:    number
  productTotal:    number
  serviceCount:    number
  productCount:    number
  total:           number
  itemsCount:      number
  oldestEarnedAt:  string | null
}

export interface ClosedPeriodInfo {
  start:        string
  end:          string
  scheduledFor: string
}

export interface PendingProfessionalSplit {
  professional: {
    id:        string
    name:      string
    avatarUrl: string | null
  }
  closedTotal:         number
  closedServiceTotal:  number
  closedProductTotal:  number
  closedCount:         number
  currentTotal:        number
  currentServiceTotal: number
  currentProductTotal: number
  currentCount:        number
  // @eligi:ocf-types — tela do dono (nov/2026). Opcionais: back antigo nao manda.
  openTotal?:          number   // so a semana em andamento
  openServiceTotal?:   number
  openProductTotal?:   number
  openCount?:          number
  total:               number
  itemsCount:          number
  oldestEarnedAt:      string | null
}

export interface PendingSummaryResponse {
  closedPeriod:  ClosedPeriodInfo | null
  professionals: PendingProfessionalSplit[]
  currentPeriod?: ClosedPeriodInfo | null  // periodo em andamento @eligi:ocf-types2
  queuedTotal?:   number                   // semanas encerradas esperando o proximo Gerar
  queuedCount?:   number
}

export interface PayoutListItem {
  id:              string
  businessId:      string
  professionalId:  string
  periodStart:     string
  periodEnd:       string
  scheduledFor:    string
  totalAmount:     number
  serviceAmount:   number
  productAmount:   number
  itemsCount:      number
  status:          PayoutStatus
  paidAt:          string | null
  paidVia:         PayoutMethod | null
  paidNote:        string | null
  paidById:        string | null
  canceledAt:      string | null
  createdAt:       string
  updatedAt:       string
  professional: {
    id:        string
    name:      string
    avatarUrl: string | null
  }
}

export interface CommissionItemDetail {
  id:              string
  amount:          number
  type:            CommissionType
  earnedAt:        string
  saleItem: {
    id:    string
    name:  string
    type:  CommissionType
    total: number
    unitPrice?:       number // @eligi:ocf-types3
    quantity?:        number
    commissionType?:  'PERCENT' | 'FIXED' | null
    commissionValue?: number | null
    sale: {
      id:          string
      clientName?: string | null // @eligi:ocf-types4
      confirmedAt: string | null
    }
  }
}

export interface PayoutDetail extends PayoutListItem {
  items: CommissionItemDetail[]
}
