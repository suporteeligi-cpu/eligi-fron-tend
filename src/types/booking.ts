export type Booking = {
  id: string
  clientName: string
  clientPhone: string
  clientEmail?: string
  date: string
  time: string
  status: 'CONFIRMED' | 'CANCELED'
  service: {
    id: string
    name: string
    duration: number
  }
  professional?: {
    id: string
    name: string
  }
}
