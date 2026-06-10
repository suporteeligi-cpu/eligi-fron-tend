// src/features/services/types.ts

export interface Service {
  id:          string
  name:        string
  duration:    number
  price:       number | null
  description: string | null
  category:    string | null
  color:       string | null
  active:      boolean
}
