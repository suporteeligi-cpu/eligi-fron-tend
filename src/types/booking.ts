export interface Booking {
  id: string
  date: string
  time: string
  duration: number

  clientName: string

  service: {
    id: string
    name: string
    duration: number
    color?: string
  }

  professional: {
    id: string
    name: string
  }
}