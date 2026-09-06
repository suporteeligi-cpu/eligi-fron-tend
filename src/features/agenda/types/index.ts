// src/features/agenda/types/index.ts

export type AgendaProfessional = {
  id:        string
  name:      string
  avatarUrl?: string   // base64, color:gradient ou url
  workingHours?: { open: boolean; startTime: string; endTime: string } | null   // horário do prof no dia; null/ausente = segue o estabelecimento
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
  isPaid?:        boolean  // tem venda CONFIRMED ligada (checkout completo)
  fromOnline?:             boolean  // veio do link público (selo 🚀)
  professionalPreference?: boolean  // cliente escolheu o profissional
  hasProducts?:            boolean  // escolheu produto na vitrine do link
  hasClub?:                boolean  // cliente tem EligiClub ativo (selo globo) (selo ❤️)
}

export type AgendaBlock = {
  id:             string
  professionalId: string
  date:           string   // "YYYY-MM-DD"
  startTime:      string   // "HH:mm"
  endTime:        string   // "HH:mm"
  reason:         string | null
  // @eligi:lunch-agenda-kind
  // OPCIONAL: ausente = BLOCK. O back manda desde a fatia 4a, mas manter
  // opcional evita quebrar qualquer AgendaBlock montado a mao no repo.
  // 'LUNCH' tem id sintetico (lunch:<prof>:<data>) e NAO e linha de tabela —
  // nunca mande esse id para PUT/DELETE /blocks.
  kind?:          'BLOCK' | 'LUNCH'
}