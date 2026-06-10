// src/features/services/types.ts

export interface ServiceCategory {
  id:        string
  name:      string
  color:     string | null
  order:     number
  _count?:   { services: number }
}

export interface Service {
  id:              string
  name:            string
  duration:        number
  price:           number | null
  description:     string | null
  category:        string | null      // legado — texto livre
  categoryId:      string | null      // novo — FK para ServiceCategory
  color:           string | null
  active:          boolean
  serviceCategory: ServiceCategory | null
}
