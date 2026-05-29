// src/features/sales/types.ts

export type SaleStatus    = 'OPEN' | 'CONFIRMED' | 'CANCELED'
export type SaleItemType  = 'SERVICE' | 'PRODUCT' | 'PACKAGE'
export type PaymentMethod = 'CASH' | 'PIX' | 'CREDIT' | 'DEBIT' | 'TRANSFER' | 'OTHER'
export type CommissionType = 'PERCENT' | 'FIXED'

// ─── PACOTES ──────────────────────────────────────────────────────────────
export type ValidityType      = 'NEVER' | 'DAYS' | 'MONTHS' | 'END_OF_MONTH' | 'END_OF_YEAR'
export type PackageCardStatus = 'ACTIVE' | 'DEPLETED' | 'EXPIRED' | 'CANCELED'

export interface SaleItem {
  id:                string
  type:              SaleItemType
  serviceId?:        string | null
  productId?:        string | null
  packageId?:        string | null

  name:              string
  unitPrice:         number
  quantity:          number
  total:             number

  professionalId?:   string | null
  commissionType?:   CommissionType | null
  commissionValue?:  number | null
  commissionAmount?: number | null

  // ⭐ Item está sendo pago via cartão de pacote
  appliedPackageCardId?: string | null
  appliedPackageUseId?:  string | null
  appliedPackageCard?: {
    id:          string
    cardNumber:  string
    packageName: string
    status:      PackageCardStatus
  } | null

  createdAt:         string

  product?: {
    id:         string
    name:       string
    trackStock: boolean
    stock:      number
    imageUrl?:  string | null
    color?:     string | null
    sku?:       string | null
  } | null
  service?: {
    id:       string
    name:     string
    duration: number
    color?:   string | null
  } | null
  package?: {
    id:    string
    name:  string
    color: string | null
    validityType?:  ValidityType
    validityValue?: number | null
  } | null
  professional?: {
    id:        string
    name:      string
    avatarUrl?: string | null
  } | null
}

export interface SalePayment {
  id:        string
  method:    PaymentMethod
  amount:    number
  reference?: string | null
  createdAt: string
}

export interface CreditNote {
  id:          string
  reason:      string
  amount:      number
  refundStock: boolean
  createdAt:   string
}

export interface Sale {
  id:           string
  businessId:   string
  clientId?:    string | null
  clientName?:  string | null
  clientPhone?: string | null
  status:       SaleStatus
  subtotal:     number
  discount:     number
  total:        number
  notes?:       string | null
  bookingId?:   string | null
  createdById?: string | null
  createdAt:    string
  updatedAt:    string
  confirmedAt?: string | null
  canceledAt?:  string | null
  items:       SaleItem[]
  payments:    SalePayment[]
  creditNotes: CreditNote[]
  client?: {
    id:    string
    name:  string
    phone: string
  } | null
  // ⭐ Cartões gerados por essa venda (snapshot)
  packageCards?: Array<{
    id:          string
    cardNumber:  string
    packageName: string
    status:      PackageCardStatus
    totalPrice:  number
  }>
}

export interface SalesSummary {
  salesCount:      number
  grossTotal:      number
  creditTotal:     number
  netTotal:        number
  commissionTotal: number
  serviceTotal:    number
  productTotal:    number
  byMethod:        Partial<Record<PaymentMethod, number>>
}

export interface CatalogService {
  id:       string
  name:     string
  duration: number
  price:    number | null
  color?:   string | null
  category?: string | null
  active?:  boolean
}

export interface CatalogProduct {
  id:         string
  name:       string
  category?:  string | null
  color?:     string | null
  imageUrl?:  string | null
  price:      number
  sku?:       string | null
  active?:    boolean
  trackStock?: boolean
  stock?:     number
}

// ⭐ NOVO: pacote no catálogo do caixa
export interface CatalogPackage {
  id:                 string
  name:               string
  description:        string | null
  price:              number
  color:              string | null
  imageUrl:           string | null
  active:             boolean
  validityType:       ValidityType
  validityValue:      number | null
  earnsCommission:    boolean
  lockProfessionalId: string | null
  items: Array<{
    serviceId: string
    quantity:  number
    unitPrice: number
    service?:  {
      id:       string
      name:     string
      duration: number
      price:    number | null
      color:    string | null
    }
  }>
}

// ⭐ NOVO: cartão (instância) leve pra modal "Usar pacote"
export interface PackageCardLite {
  id:          string
  cardNumber:  string
  packageName: string
  validUntil:  string | null
  status:      PackageCardStatus
  package?: {
    id:    string
    name:  string
    color: string | null
    lockProfessionalId?: string | null
  }
  balances: Array<{
    id:          string
    serviceId:   string
    serviceName: string
    initialQty:  number
    usedQty:     number
    unitPrice:   number
    service?: {
      id:    string
      name:  string
      color: string | null
    }
  }>
}

export interface ProfLite {
  id:        string
  name:      string
  avatarUrl?: string | null
}

export interface ClientLite {
  id:    string
  name:  string
  phone: string
}

export interface PaymentLineInput {
  method:    PaymentMethod
  amount:    number
  reference?: string
}
