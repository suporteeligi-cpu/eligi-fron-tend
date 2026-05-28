// src/features/packages/types.ts

export type ValidityType = 'NEVER' | 'DAYS' | 'MONTHS' | 'END_OF_MONTH' | 'END_OF_YEAR'
export type PackageCardStatus = 'ACTIVE' | 'DEPLETED' | 'EXPIRED' | 'CANCELED'

export interface PackageService {
  id:       string
  name:     string
  color:    string | null
  duration: number
  price:    number | null
}

export interface ProfLite {
  id:   string
  name: string
}

// ─── TEMPLATE ────────────────────────────────────────────────────────────
export interface PackageItem {
  id?:        string
  serviceId:  string
  quantity:   number
  unitPrice:  number
  service?:   PackageService
}

export interface ServicePackage {
  id:                 string
  businessId:         string
  name:               string
  description:        string | null
  price:              number
  taxRate:            number | null
  validityType:       ValidityType
  validityValue:      number | null
  active:             boolean
  lockProfessionalId: string | null
  earnsCommission:    boolean
  color:              string | null
  imageUrl:           string | null
  createdAt:          string
  updatedAt:          string
  items:              PackageItem[]
  lockProfessional?:  ProfLite | null
  _count?:            { cards: number }
}

// ─── CARTÃO ───────────────────────────────────────────────────────────────
export interface PackageCardBalance {
  id:          string
  cardId:      string
  serviceId:   string
  serviceName: string
  initialQty:  number
  usedQty:     number
  unitPrice:   number
  service?:    PackageService
}

export interface PackageUse {
  id:             string
  cardId:         string
  serviceId:      string
  saleItemId:     string | null
  bookingId:      string | null
  professionalId: string | null
  usedById:       string | null
  unitPrice:      number
  notes:          string | null
  createdAt:      string
  service?:       { id: string; name: string } | null
  professional?:  { id: string; name: string } | null
  usedBy?:        { id: string; name: string } | null
}

export interface PackageCard {
  id:          string
  businessId:  string
  packageId:   string
  clientId:    string
  cardNumber:  string
  packageName: string
  totalPrice:  number
  validFrom:   string
  validUntil:  string | null
  status:      PackageCardStatus
  saleId:      string | null
  saleItemId:  string | null
  createdAt:   string
  updatedAt:   string
  client?:     { id: string; name: string; phone: string | null }
  package?:    { id: string; name: string; color: string | null; lockProfessionalId?: string | null }
  balances?:   PackageCardBalance[]
  uses?:       PackageUse[]
}

export interface CardsListResponse {
  cards: PackageCard[]
  pagination: {
    total: number
    page:  number
    pages: number
    limit: number
  }
}
