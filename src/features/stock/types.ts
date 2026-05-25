// src/features/stock/types.ts

export type StockMovementType = 'IN' | 'OUT' | 'ADJUST' | 'LOSS'

export interface StockMovement {
  id:          string
  productId:   string
  type:        StockMovementType
  quantity:    number
  stockBefore: number
  stockAfter:  number
  reason?:     string | null
  reference?:  string | null
  unitCost?:   number | null
  createdAt:   string

  product?: {
    id:        string
    name:      string
    sku?:      string | null
    imageUrl?: string | null
    color?:    string | null
  }

  user?: {
    id:   string
    name: string
  } | null
}

export interface StockSummary {
  totalProducts:   number
  trackedProducts: number
  lowStock:        number
  outOfStock:      number
  totalValue:      number
}

export interface LowStockProduct {
  id:         string
  name:       string
  sku?:       string | null
  imageUrl?:  string | null
  color?:     string | null
  stock:      number
  stockAlert: number | null
}

export type StockStatus = 'ok' | 'low' | 'out' | 'untracked'

export interface MovementInput {
  type:        StockMovementType
  quantity:    number
  reason?:     string
  reference?:  string
  unitCost?:   number
}
