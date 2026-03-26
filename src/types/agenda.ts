export type AgendaProfessional = {
  id: string
  name: string
}

export type AgendaBooking = {
  id: string
  professionalId: string | null
  clientName: string
  serviceName: string
  start: string
  end: string
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELED'
}

export type AgendaDay = {
  date: string
  professionals: AgendaProfessional[]
  bookings: AgendaBooking[]
}