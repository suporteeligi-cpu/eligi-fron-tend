export type AgendaProfessional = {
  id: string
  name: string
}

export type BookingStatus =
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELED'

export type AgendaBooking = {
  id: string
  professionalId: string | null
  clientName: string
  serviceName: string
  start: string  // "HH:mm"
  end: string    // "HH:mm"
  status: BookingStatus
}

export type AgendaDay = {
  businessId: string   // CORRIGIDO: obrigatório
  date: string
  professionals: {
    id: string
    name: string
  }[]
  bookings: {
    id: string
    date: string
    time: string
    duration: number
    clientName: string
    professionalId: string
    service?: {
      name: string
      duration?: number
    }
    status?: string
  }[]
}