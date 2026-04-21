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
  businessId: string
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