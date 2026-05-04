import { BookingStatus, Professional } from '@/shared/types'

export interface AgendaBooking {
  id: string
  clientName: string
  serviceName: string
  professionalId: string
  status: BookingStatus
  start: string
  end: string
}

// type alias em vez de interface vazia — evita erro @typescript-eslint/no-empty-object-type
export type AgendaProfessional = Professional
