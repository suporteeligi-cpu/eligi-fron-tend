'use client'

import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

export type SocketBooking = {
  id:             string
  professionalId: string
  clientName:     string
  start:          string
  end:            string
  serviceName:    string
  status:         'CONFIRMED' | 'COMPLETED' | 'CANCELED'
}

interface SocketHandlers {
  businessId: string
  onCreate:   (booking: SocketBooking) => void
  onUpdate?:  (booking: SocketBooking) => void
  onCancel:   (bookingId: string) => void
}

export function useAgendaSocket({
  businessId,
  onCreate,
  onUpdate,
  onCancel,
}: SocketHandlers) {
  // Stable refs — avoids re-registering listeners on every render
  const onCreateRef = useRef(onCreate)
  const onUpdateRef = useRef(onUpdate)
  const onCancelRef = useRef(onCancel)

  useEffect(() => {
    onCreateRef.current = onCreate
    onUpdateRef.current = onUpdate
    onCancelRef.current = onCancel
  })

  useEffect(() => {
    if (!businessId) return

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

    const socket: Socket = io(apiUrl, {
      withCredentials:      true,
      transports:           ['polling'],  // Railway proxy — no WebSocket upgrade
      upgrade:        false,
      forceNew:             true,
      reconnection:         true,
      reconnectionAttempts: 10,
      reconnectionDelay:    1000,
      reconnectionDelayMax: 5000,
      timeout:              10000,
    })

    socket.on('connect', () => {
      socket.emit('join:business', businessId)
    })

    socket.on('connect_error', err => {
      console.warn('[AgendaSocket] connect_error:', err.message)
    })

    socket.on('reconnect', () => {
      socket.emit('join:business', businessId)
    })

    socket.on('booking:created', (b: SocketBooking) => { onCreateRef.current(b) })
    socket.on('booking:updated', (b: SocketBooking) => { onUpdateRef.current?.(b) })
    socket.on('booking:canceled', ({ id }: { id: string }) => { onCancelRef.current(id) })

    // Keep-alive ping every 25s
    const ping = setInterval(() => {
      if (socket.connected) socket.emit('ping')
    }, 25_000)

    return () => {
      clearInterval(ping)
      socket.emit('leave:business', businessId)
      socket.disconnect()
    }
  }, [businessId])
}