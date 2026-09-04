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
  // @eligi:pricemode-type
  // OPCIONAL de proposito: o back sempre envia (default FIXED), mas exigir o
  // campo quebraria qualquer objeto Service montado a mao no repo.
  priceMode?:      'FIXED' | 'FROM'
  // @eligi:svconline-type
  // Mesma razao do priceMode: OPCIONAL para nao quebrar objeto Service
  // montado a mao no repo. O back sempre envia (default true no schema).
  availableOnline?: boolean
  description:     string | null
  category:        string | null      // legado — texto livre
  categoryId:      string | null      // novo — FK para ServiceCategory
  color:           string | null
  active:          boolean
  serviceCategory: ServiceCategory | null

  // @eligi:service-prof-count
  // Quantos profissionais atendem o servico, vindo do _count do back.
  // Zero significa servico sem ninguem para executar — a lista avisa.
  _count?:         { professionals: number }
}
