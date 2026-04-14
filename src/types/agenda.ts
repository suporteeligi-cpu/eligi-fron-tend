export type AgendaProfessional = {
  id: string
  name: string
}

/* =========================================
   STATUS (TIPO CENTRAL)
========================================= */

export type BookingStatus =
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELED'

/* =========================================
   BOOKING
========================================= */

export type AgendaBooking = {
  id: string
  professionalId: string | null
  clientName: string
  serviceName: string
  start: string
  end: string
  status: BookingStatus
}

/* =========================================
   DAY
========================================= */

export type AgendaDay = {
  date: string
  professionals: AgendaProfessional[]
  bookings: AgendaBooking[]
}