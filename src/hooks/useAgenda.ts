'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/apiClient'
import { AgendaDay } from '@/types/agenda'

export function useAgenda(date: string) {
  const [data, setData] = useState<AgendaDay | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)

      const res = await api.get('/agenda/day', {
        params: { date }
      })

      setData(res.data.data)
      setLoading(false)
    }

    load()
  }, [date])

  return { data, loading }
}