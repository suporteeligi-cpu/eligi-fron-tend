'use client'
// src/hooks/useAgendaSocket.ts  (e re-exportado de src/features/agenda/hooks/useAgendaSocket.ts)

import { useEffect, useRef } from 'react'
import { io, Socket }        from 'socket.io-client'
import { AgendaBooking }     from '@/features/agenda/types'

export type SocketBooking = AgendaBooking

interface SocketHandlers {
  businessId: string
  onCreate:   (booking: SocketBooking) => void
  onUpdate?:  (booking: SocketBooking) => void
  onCancel:   (bookingId: string) => void
}

export function useAgendaSocket({ businessId, onCreate, onUpdate, onCancel }: SocketHandlers) {
  // Refs estáveis para evitar re-registro de listeners a cada render
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
      transports:           ['polling'],   // Railway: sem WebSocket upgrade
      upgrade:              false,
      forceNew:             true,
      reconnection:         true,
      reconnectionAttempts: 10,
      reconnectionDelay:    1000,
      reconnectionDelayMax: 5000,
      timeout:              10000,
    })

    socket.on('connect', () => {
      console.log('[AgendaSocket] connected, joining business:', businessId)
      socket.emit('join:business', businessId)
    })

    socket.on('connect_error', (err) => {
      console.warn('[AgendaSocket] connect_error:', err.message)
    })

    socket.on('reconnect', () => {
      socket.emit('join:business', businessId)
    })

    socket.on('booking:created',  (b: SocketBooking)        => onCreateRef.current(b))
    socket.on('booking:updated',  (b: SocketBooking)        => onUpdateRef.current?.(b))
    socket.on('booking:canceled', ({ id }: { id: string }) => onCancelRef.current(id))

    // Keep-alive ping para Railway (polling tem timeout longo)
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