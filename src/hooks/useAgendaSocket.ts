'use client'

import { useEffect } from 'react'
import { io, Socket } from 'socket.io-client'

type Booking = {
  id: string
  date: string
  time: string
  duration: number
  clientName: string
  professionalId: string
  service?: {
    name: string
    duration?: number
  }
  status?: string
}

type SocketHandlers = {
  businessId: string
  onCreate: (booking: Booking) => void
  onUpdate: (booking: Booking) => void
  onCancel: (booking: Booking) => void
}

export function useAgendaSocket({
  businessId,
  onCreate,
  onUpdate,
  onCancel
}: SocketHandlers) {
  useEffect(() => {
    // 🔥 sempre define socket como null inicialmente
    let socket: Socket | null = null

    if (businessId) {
      socket = io(process.env.NEXT_PUBLIC_API_URL!, {
        withCredentials: true,
        transports: ['websocket']
      })

      socket.emit('join:business', businessId)

      socket.on('dashboard:update', (payload) => {
        switch (payload.type) {
          case 'booking_created':
            onCreate(payload.booking)
            break
          case 'booking_updated':
            onUpdate(payload.booking)
            break
          case 'booking_canceled':
            onCancel(payload.booking)
            break
        }
      })
    }

    // 🔥 cleanup SEMPRE válido
    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [businessId, onCreate, onUpdate, onCancel])
}