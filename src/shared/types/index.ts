// Tipos globais compartilhados entre features

export type BookingStatus = 'CONFIRMED' | 'COMPLETED' | 'CANCELED'

export interface Professional {
  id: string
  name: string
}

export interface Service {
  id: string
  name: string
  duration: number
  price?: number
}
