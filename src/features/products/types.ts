// src/features/products/types.ts

export interface Product {
  id:          string
  name:        string
  description?: string | null
  category?:    string | null
  color?:       string | null
  imageUrl?:    string | null

  price:        number
  cost?:        number | null

  sku?:         string | null
  barcode?:     string | null

  active:       boolean

  // Estoque (Fase 2.3)
  trackStock?:  boolean
  stock?:       number
  stockAlert?:  number | null

  createdAt?:   string
  updatedAt?:   string
}

export interface ProductFormData {
  name:         string
  description?: string
  category?:    string
  color?:       string
  imageUrl?:    string | null
  price:        number
  cost?:        number | null
  sku?:         string
  barcode?:     string
  trackStock?:  boolean
  stock?:       number
  stockAlert?:  number | null
}
