import { useEffect, useState } from 'react'
import api from '@/lib/apiClient'

export interface Professional {
  id: string
  name: string
}

export function useProfessionals() {
  const [professionals, setProfessionals] = useState<Professional[]>([])

  useEffect(() => {
    async function fetchProfessionals() {
      try {
        const res = await api.get('/barbers')
        setProfessionals(res.data)
      } catch {
        console.error('Erro ao carregar profissionais')
      }
    }

    fetchProfessionals()
  }, [])

  return { professionals }
}