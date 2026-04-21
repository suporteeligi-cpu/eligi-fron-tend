'use client'

import { useEffect } from 'react'
import { io, Socket } from 'socket.io-client'

export function useAgendaSocket(
  businessId: string | null,
  onUpdate: () => void
) {
  useEffect(() => {
    if (!businessId) return

    const socket: Socket = io(
      process.env.NEXT_PUBLIC_API_URL!,
      {
        withCredentials: true,
        transports: ['websocket']
      }
    )

    // 🔥 entra na sala do negócio
    socket.emit('join:business', businessId)

    // 🔥 escuta eventos do backend
    socket.on('dashboard:update', (payload) => {
      console.log('Realtime recebido:', payload)

      if (
        payload.type === 'booking_created' ||
        payload.type === 'booking_canceled'
      ) {
        onUpdate()
      }
    })

    return () => {
      socket.disconnect()
    }
  }, [businessId, onUpdate])
}
