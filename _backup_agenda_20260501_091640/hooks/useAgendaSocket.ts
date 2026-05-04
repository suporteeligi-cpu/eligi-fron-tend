'use client'

import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

/* =========================================
   TYPES
========================================= */

export type SocketBooking = {
  id: string
  professionalId: string
  clientName: string
  start: string
  end: string
  serviceName: string
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELED'
}

type SocketHandlers = {
  businessId: string
  onCreate: (booking: SocketBooking) => void
  onUpdate?: (booking: SocketBooking) => void
  onCancel: (bookingId: string) => void
}

/* =========================================
   HOOK
   — polling apenas (fix Railway proxy)
   — reconexão automática com backoff
   — socket reutilizado via ref (evita múltiplas conexões)
========================================= */

export function useAgendaSocket({
  businessId,
  onCreate,
  onUpdate,
  onCancel
}: SocketHandlers) {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!businessId) return

    if (socketRef.current?.connected) {
      socketRef.current.emit('join:business', businessId)
      return
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

    const socket: Socket = io(apiUrl, {
      withCredentials: true,
      // CORRIGIDO: polling apenas — Railway não suporta upgrade WebSocket
      // via proxy sem configuração adicional. Polling é estável e suficiente.
      transports: ['polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('[Socket] Conectado:', socket.id)
      socket.emit('join:business', businessId)
    })

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Erro de conexão:', err.message)
    })

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Desconectado:', reason)
    })

    socket.on('reconnect', (attempt) => {
      console.log('[Socket] Reconectado após', attempt, 'tentativas')
      socket.emit('join:business', businessId)
    })

    socket.on('booking:created', (booking: SocketBooking) => {
      onCreate(booking)
    })

    socket.on('booking:updated', (booking: SocketBooking) => {
      onUpdate?.(booking)
    })

    socket.on('booking:canceled', (payload: { id: string }) => {
      onCancel(payload.id)
    })

    const pingInterval = setInterval(() => {
      if (socket.connected) socket.emit('ping')
    }, 25000)

    return () => {
      clearInterval(pingInterval)
      socket.emit('leave:business', businessId)
      socket.disconnect()
      socketRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId])

  useEffect(() => {
    const socket = socketRef.current
    if (!socket) return

    const handleCreated = (booking: SocketBooking) => onCreate(booking)
    const handleUpdated = (booking: SocketBooking) => onUpdate?.(booking)
    const handleCanceled = (payload: { id: string }) => onCancel(payload.id)

    socket.off('booking:created').on('booking:created', handleCreated)
    socket.off('booking:updated').on('booking:updated', handleUpdated)
    socket.off('booking:canceled').on('booking:canceled', handleCanceled)
  }, [onCreate, onUpdate, onCancel])
}