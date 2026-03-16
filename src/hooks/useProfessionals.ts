import { useEffect, useState } from 'react'
import api from '@/lib/apiClient'

export interface Professional {
  id: string
  name: string
}

export function useProfessionals() {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/barbers')
        setProfessionals(res.data)
      } catch {
        console.error('Erro ao carregar profissionais')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  return { professionals, loading }
}