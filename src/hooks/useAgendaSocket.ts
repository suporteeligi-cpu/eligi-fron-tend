'use client'

import { useEffect } from 'react'
import { io, Socket } from 'socket.io-client'
import dayjs from 'dayjs'

/* =========================================
   TYPES (BACKEND - REALTIME)
========================================= */

export type BookingRealtime = {
  id: string
  professionalId: string | null
  clientName: string
  serviceName: string
  start: string // "HH:mm"
  end: string   // "HH:mm"
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELED'
}

/* =========================================
   TYPES (FRONT - LEGADO)
========================================= */

export type BookingLegacy = {
  id: string
  professionalId: string
  clientName: string

  date: string
  time: string
  duration: number

  service: {
    name: string
  }

  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELED'
}

/* =========================================
   ADAPTER (🔥 CENTRALIZADO)
========================================= */

function adaptBooking(booking: BookingRealtime): BookingLegacy {
  return {
    id: booking.id,
    professionalId: booking.professionalId ?? '',
    clientName: booking.clientName,

    date: dayjs().format('YYYY-MM-DD'),
    time: booking.start,

    duration: dayjs(`1970-01-01 ${booking.end}`).diff(
      dayjs(`1970-01-01 ${booking.start}`),
      'minute'
    ),

    service: {
      name: booking.serviceName
    },

    status: booking.status
  }
}

/* =========================================
   HANDLERS
========================================= */

type SocketHandlers = {
  businessId: string
  onCreate: (booking: BookingLegacy) => void
  onUpdate?: (booking: BookingLegacy) => void
  onCancel: (bookingId: string) => void
}

/* =========================================
   HOOK
========================================= */

export function useAgendaSocket({
  businessId,
  onCreate,
  onUpdate,
  onCancel
}: SocketHandlers) {
  useEffect(() => {
    if (!businessId) return

    const socket: Socket = io(process.env.NEXT_PUBLIC_API_URL!, {
      withCredentials: true,
      transports: ['websocket']
    })

    /* =========================================
       JOIN ROOM
    ========================================= */

    socket.emit('join:business', businessId)

    /* =========================================
       EVENTS
    ========================================= */

    socket.on('booking:created', (booking: BookingRealtime) => {
      onCreate(adaptBooking(booking))
    })

    socket.on('booking:updated', (booking: BookingRealtime) => {
      if (onUpdate) {
        onUpdate(adaptBooking(booking))
      }
    })

    socket.on('booking:canceled', (payload: { id: string }) => {
      onCancel(payload.id)
    })

    /* =========================================
       DEBUG
    ========================================= */

    socket.on('connect', () => {
      console.log('🟢 Socket conectado:', socket.id)
    })

    socket.on('disconnect', () => {
      console.log('🔴 Socket desconectado')
    })

    /* =========================================
       CLEANUP
    ========================================= */

    return () => {
      socket.disconnect()
    }
  }, [businessId, onCreate, onUpdate, onCancel])
}