'use client'

import { useEffect } from 'react'
import { io, Socket } from 'socket.io-client'

/* =========================================
   TYPES (🔥 PADRÃO FINAL)
========================================= */

export type Booking = {
  id: string
  professionalId: string
  clientName: string

  start: string // "HH:mm"
  end: string   // "HH:mm"

  serviceName: string

  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELED'
}

/* =========================================
   HANDLERS
========================================= */

type SocketHandlers = {
  businessId: string
  onCreate: (booking: Booking) => void
  onUpdate?: (booking: Booking) => void
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
       EVENTS (🔥 DIRETO DO BACKEND)
    ========================================= */

    socket.on('booking:created', (booking: Booking) => {
      onCreate(booking)
    })

    socket.on('booking:updated', (booking: Booking) => {
      if (onUpdate) {
        onUpdate(booking)
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