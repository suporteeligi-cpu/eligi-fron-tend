'use client'
// src/hooks/useAgenda.ts

import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
import { AgendaBooking, AgendaProfessional } from '@/features/agenda/types'

// ─── Tipos do payload bruto da API ───────────────────────────────────────────
interface ApiBooking {
  id:             string
  professionalId: string
  clientName:     string
  serviceName?:   string
  serviceColor?:  string | null   // ← vem do backend
  service?: {
    name?:  string
    color?: string | null         // ← também pode vir aninhado
  }
  start:     string   // "HH:mm"
  end:       string   // "HH:mm"
  status?:   string
  isPaid?:   boolean
  fromOnline?:             boolean   // ← veio do link público (🚀)
  professionalPreference?: boolean   // ← cliente escolheu o profissional (❤️)
  // legado
  time?:     string
  duration?: number
}

interface AgendaPayload {
  businessId:    string
  date:          string
  professionals: AgendaProfessional[]
  bookings:      ApiBooking[]
}

interface ApiResponse {
  success?: boolean
  data?:    AgendaPayload
}

// ─── Adaptador ───────────────────────────────────────────────────────────────
function adaptBooking(b: ApiBooking): AgendaBooking {
  const validStatuses = ['CONFIRMED', 'COMPLETED', 'CANCELED', 'NO_SHOW'] as const
  type BS = typeof validStatuses[number]

  const status: BS = validStatuses.includes(b.status as BS)
    ? (b.status as BS)
    : 'CONFIRMED'

  const start = b.start || b.time || '08:00'
  const end   = b.end   || '08:30'

  // Cor: pode vir diretamente como serviceColor ou dentro de service.color
  const serviceColor = b.serviceColor ?? b.service?.color ?? null

  return {
    id:             b.id,
    professionalId: b.professionalId,
    clientName:     b.clientName,
    serviceName:    b.serviceName || b.service?.name || 'Serviço',
    serviceColor:   serviceColor ?? undefined,
    start,
    end,
    status,
    isPaid:                 b.isPaid ?? false,
    fromOnline:             b.fromOnline ?? false,
    professionalPreference: b.professionalPreference ?? false,
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export interface AgendaData {
  businessId:    string
  date:          string
  professionals: AgendaProfessional[]
  bookings:      AgendaBooking[]
}

export function useAgenda(date: string) {
  const [data,    setData]    = useState<AgendaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const res     = await api.get<ApiResponse>('/agenda/day', { params: { date } })
      const payload = res.data?.data ?? (res.data as unknown as AgendaPayload)

      setData({
        businessId:    payload.businessId ?? '',
        date:          payload.date,
        professionals: payload.professionals ?? [],
        bookings:      (payload.bookings ?? []).map(adaptBooking),
      })
    } catch (err) {
      console.error('[useAgenda] Erro:', err)
      setError('Não foi possível carregar a agenda.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => { fetchData() }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}
