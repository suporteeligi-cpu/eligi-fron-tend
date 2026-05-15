// src/features/agenda/types/index.ts

export type AgendaProfessional = {
  id:   string
  name: string
}

export type BookingStatus = 'CONFIRMED' | 'COMPLETED' | 'CANCELED'

export type AgendaBooking = {
  id:             string
  professionalId: string
  clientName:     string
  serviceName:    string
  serviceColor?:  string   // ← hex da cor do serviço, ex: "#4a94e8"
  start:          string   // "HH:mm"
  end:            string   // "HH:mm"
  status:         BookingStatus
}