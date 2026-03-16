export interface Booking {
  id: string

  serviceId: string
  professionalId?: string

  clientName: string
  clientPhone?: string
  clientEmail?: string

  date: string
  time: string

  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED'

  createdAt: string

  service?: {
    id: string
    name: string
    duration?: number
  }

  professional?: {
    id: string
    name: string
  }
}