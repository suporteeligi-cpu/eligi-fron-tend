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
  serviceColor?:  string
  start:          string   // "HH:mm"
  end:            string   // "HH:mm"
  status:         BookingStatus
}

export type AgendaBlock = {
  id:             string
  professionalId: string
  date:           string   // "YYYY-MM-DD"
  startTime:      string   // "HH:mm"
  endTime:        string   // "HH:mm"
  reason:         string | null
}