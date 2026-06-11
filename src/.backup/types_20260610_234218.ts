// src/features/professionals/types.ts

export type CommissionType = 'PERCENT' | 'FIXED'

export interface ProfessionalService {
  service: {
    id:       string
    name:     string
    duration: number
    price?:   number | null
    color?:   string | null
  }
}

export interface CommissionOverride {
  serviceId:        string
  commissionType:   CommissionType
  commissionValue:  number
}

export interface ProductCommissionOverride {
  productId:        string
  commissionType:   CommissionType
  commissionValue:  number
}

export interface Professional {
  id:               string
  name:             string
  phone?:           string | null
  email?:           string | null
  role?:            string | null
  description?:     string | null
  avatarUrl?:       string | null
  showInCalendar?:  boolean
  availableOnline?: boolean
  active:           boolean

  // Comissão de serviços (Fase 1)
  commissionType?:  CommissionType | null
  commissionValue?: number | null

  // Comissão de produtos (Fase 2)
  commissionProductType?:  CommissionType | null
  commissionProductValue?: number | null

  services?:                    ProfessionalService[]
  commissionOverrides?:         CommissionOverride[]
  productCommissionOverrides?:  ProductCommissionOverride[]
}

export interface ServiceItem {
  id:       string
  name:     string
  duration: number
  price?:   number | null
  color?:   string | null
  category?: string | null
}

export interface ProductLite {
  id:        string
  name:      string
  category?: string | null
  color?:    string | null
  imageUrl?: string | null
  price:     number
}

export interface HourSlot {
  weekday:   number
  open:      boolean
  startTime: string
  endTime:   string
}
