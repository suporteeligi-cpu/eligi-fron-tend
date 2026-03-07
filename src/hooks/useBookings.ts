import { useEffect, useState } from 'react'
import api from '@/lib/apiClient'
import { Booking } from '@/types/booking'

export function useBookings(date: string) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [date])

  async function load() {
    try {
      setLoading(true)

      const res = await api.get('/bookings', {
        params: { date }
      })

      setBookings(res.data)
    } finally {
      setLoading(false)
    }
  }

  return { bookings, loading, reload: load }
}
