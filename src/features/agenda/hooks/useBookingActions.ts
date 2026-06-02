'use client'
// src/features/agenda/hooks/useBookingActions.ts

import { useCallback, useState } from 'react'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import api from '@/shared/lib/apiClient'
import { AgendaBooking } from '../types'
import { useAgendaStore } from './useAgendaStore'
import { isBookingConflict } from '../utils/api-error'

dayjs.extend(utc)
dayjs.extend(timezone)

export interface PendingAction {
  type:         'move' | 'resize' | 'conflict'
  title:        string
  confirmLabel: string
  onConfirm:    () => void
}

interface ApiBookingResponse {
  professionalId?: string
  clientName:      string
  service?:        { name?: string; color?: string }
  startAt:         string
  endAt:           string
  status:          AgendaBooking['status']
  isPaid?:         boolean
}

function mapBookingResponse(b: ApiBookingResponse, bookingId: string, fallbackProfId: string): AgendaBooking {
  return {
    id:             bookingId,
    professionalId: b.professionalId ?? fallbackProfId,
    clientName:     b.clientName,
    serviceName:    b.service?.name  ?? '',
    serviceColor:   b.service?.color ?? undefined,
    start:          dayjs(b.startAt).tz('America/Sao_Paulo').format('HH:mm'),
    end:            dayjs(b.endAt).tz('America/Sao_Paulo').format('HH:mm'),
    status:         b.status,
    isPaid:         b.isPaid,
  }
}

/**
 * Hook que encapsula reschedule + resize com tratamento de conflito.
 * Use selectedDate vindo do componente (não busca do store pra permitir override).
 */
export function useBookingActions(selectedDate: Date) {
  const updateBooking = useAgendaStore(s => s.updateBooking)
  const [savingId,      setSavingId]      = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)

  const dateStr = dayjs(selectedDate).format('YYYY-MM-DD')

  const doReschedule = useCallback(async (
    bookingId:      string,
    newTime:        string,
    professionalId: string,
    allowOverlap:   boolean,
  ): Promise<void> => {
    const startAt = dayjs.tz(`${dateStr} ${newTime}`, 'America/Sao_Paulo').toISOString()
    try {
      setSavingId(bookingId)
      const res = await api.patch(`/bookings/${bookingId}/reschedule`, { startAt, professionalId, allowOverlap })
      const data = (res.data?.data ?? res.data) as ApiBookingResponse | undefined
      if (data) updateBooking(dateStr, mapBookingResponse(data, bookingId, professionalId))
    } catch (err) {
      if (isBookingConflict(err)) {
        setPendingAction({
          type:         'conflict',
          title:        'Já existe um agendamento\nnesse horário. Confirma mesmo assim?',
          confirmLabel: 'Confirmar sobreposição',
          onConfirm: () => {
            setPendingAction(null)
            doReschedule(bookingId, newTime, professionalId, true)
          },
        })
      }
    } finally {
      setSavingId(null)
    }
  }, [dateStr, updateBooking])

  const doResize = useCallback(async (
    bookingId: string,
    booking:   AgendaBooking,
    newEnd:    string,
  ): Promise<void> => {
    const startAt = dayjs.tz(`${dateStr} ${booking.start}`, 'America/Sao_Paulo').toISOString()
    const endAt   = dayjs.tz(`${dateStr} ${newEnd}`,        'America/Sao_Paulo').toISOString()
    try {
      setSavingId(bookingId)
      const res  = await api.patch(`/bookings/${bookingId}/resize`, { startAt, endAt })
      const data = (res.data?.data ?? res.data) as ApiBookingResponse | undefined
      if (data) updateBooking(dateStr, mapBookingResponse(data, bookingId, booking.professionalId))
    } catch (err) {
      if (isBookingConflict(err)) {
        setPendingAction({
          type:         'conflict',
          title:        'Existe um conflito nesse horário.\nDeseja confirmar mesmo assim?',
          confirmLabel: 'Confirmar sobreposição',
          onConfirm: () => {
            setPendingAction(null)
            doResize(bookingId, booking, newEnd)
          },
        })
      }
    } finally {
      setSavingId(null)
    }
  }, [dateStr, updateBooking])

  return {
    savingId,
    pendingAction,
    setPendingAction,
    doReschedule,
    doResize,
  }
}
