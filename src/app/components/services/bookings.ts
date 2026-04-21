import api from '../../../lib/apiClient'

interface CreateBookingDTO {
  clientName: string
  serviceId: string
  professionalId: string
  date: string
  time: string
}

export async function createBooking(data: CreateBookingDTO) {
  const response = await api.post('/bookings/confirm', data)
  return response.data
}
