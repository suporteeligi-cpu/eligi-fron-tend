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
}
