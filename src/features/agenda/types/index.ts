import { BookingStatus, Professional } from '@/shared/types'

export type { BookingStatus }  // ← re-exporta para quem importar de '../types'

export interface AgendaBooking {
  id: string
  clientName: string
  serviceName: string
  professionalId: string
  status: BookingStatus
  start: string
  end: string
}

export type AgendaProfessional = Professional