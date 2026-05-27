// src/features/agenda/types/index.ts

export type AgendaProfessional = {
  id:        string
  name:      string
  avatarUrl?: string   // base64, color:gradient ou url
}

export type BookingStatus = 'CONFIRMED' | 'COMPLETED' | 'CANCELED' | 'NO_SHOW'

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