// src/features/memberships/types.ts

export type ValidityType = 'NEVER' | 'DAYS' | 'MONTHS' | 'END_OF_MONTH' | 'END_OF_YEAR'
export type MembershipCardStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELED'

export interface MServiceLite {
  id:       string
  name:     string
  color:    string | null
  duration: number
  price:    number | null
}

export interface ProfLite { id: string; name: string }

export interface MembershipPlanService {
  id?:        string
  serviceId:  string
  service?:   MServiceLite
}

export interface MembershipPlan {
  id:                 string
  businessId:         string
  name:               string
  description:        string | null
  price:              number
  taxRate:            number | null
  validityType:       ValidityType
  validityValue:      number | null
  recurring:          boolean
  allServices:        boolean
  active:             boolean
  lockProfessionalId: string | null
  earnsCommission:    boolean
  color:              string | null
  imageUrl:           string | null
  createdAt:          string
  updatedAt:          string
  services:           MembershipPlanService[]
  lockProfessional?:  ProfLite | null
  _count?:            { cards: number }
}

export interface MembershipUse {
  id:             string
  cardId:         string
  serviceId:      string
  saleItemId:     string | null
  bookingId:      string | null
  professionalId: string | null
  usedById:       string | null
  notes:          string | null
  createdAt:      string
  service?:       { id: string; name: string } | null
  professional?:  { id: string; name: string } | null
  usedBy?:        { id: string; name: string } | null
}

export interface MembershipCard {
  id:          string
  businessId:  string
  planId:      string
  clientId:    string
  cardNumber:  string
  planName:    string
  totalPrice:  number
  recurring:   boolean
  validFrom:   string
  validUntil:  string | null
  status:      MembershipCardStatus
  saleId:      string | null
  saleItemId:  string | null
  createdAt:   string
  updatedAt:   string
  client?:     { id: string; name: string; phone: string | null }
  plan?:       {
    id: string; name: string; color: string | null
    lockProfessionalId?: string | null
    allServices?: boolean
    services?: MembershipPlanService[]
  }
  uses?:       MembershipUse[]
  _count?:     { uses: number }
}

export interface MembershipCardsListResponse {
  cards: MembershipCard[]
  pagination: { total: number; page: number; pages: number; limit: number }
}
