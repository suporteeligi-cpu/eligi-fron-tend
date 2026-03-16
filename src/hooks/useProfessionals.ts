import { useEffect, useState } from 'react'
import api from '@/lib/apiClient'

export interface Professional {
  id: string
  name: string
}

export function useProfessionals() {
  const [professionals, setProfessionals] = useState<Professional[]>([])

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/professionals')
        setProfessionals(res.data)
      } catch {
        console.error('Erro ao carregar profissionais')
      }
    }

    load()
  }, [])

  return professionals
}