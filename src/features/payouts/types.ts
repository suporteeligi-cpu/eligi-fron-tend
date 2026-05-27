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
    sale: {
      id:          string
      clientName:  string | null
      confirmedAt: string | null
    }
  }
}

export interface PayoutDetail extends PayoutListItem {
  items: CommissionItemDetail[]
}
