// src/features/sales-report/types.ts

export type SaleReportStatus = 'OPEN' | 'CONFIRMED' | 'CANCELED'
export type PaymentMethod = 'CASH' | 'PIX' | 'CREDIT' | 'DEBIT' | 'TRANSFER' | 'OTHER'

export interface SaleReportRow {
  id:            string
  confirmedAt:   string | null
  canceledAt:    string | null
  status:        SaleReportStatus
  clientName:    string | null
  clientPhone:   string | null
  subtotal:      number
  discount:      number
  total:         number
  creditTotal:   number
  netTotal:      number
  itemsCount:    number
  professionals: string[]
  methods:       PaymentMethod[]
  items: Array<{
    id:           string
    name:         string
    type:         'SERVICE' | 'PRODUCT'
    quantity:     number
    total:        number
    professional: string | null
  }>
}

export interface SalesReportSummary {
  grossTotal:     number
  creditsTotal:   number
  netTotal:       number
  confirmedCount: number
  canceledCount:  number
  ticketAverage:  number
}

export interface SalesReportResponse {
  rows: SaleReportRow[]
  pagination: {
    total: number
    page:  number
    pages: number
    limit: number
  }
  summary: SalesReportSummary
}

export interface SalesReportFilters {
  dateFrom?:       string
  dateTo?:         string
  status?:         SaleReportStatus
  professionalId?: string
  method?:         PaymentMethod
  clientSearch?:   string
  page?:           number
}

export interface ExportRow {
  data:          string
  status:        string
  cliente:       string
  itens:         string
  profissionais: string
  metodos:       string
  subtotal:      number
  desconto:      number
  total:         number
  notaCredito:   number
  liquido:       number
}
