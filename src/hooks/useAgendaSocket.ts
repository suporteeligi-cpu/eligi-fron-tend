'use client'

import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

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

export function useAgendaSocket({
  businessId,
  onCreate,
  onUpdate,
  onCancel,
}: SocketHandlers) {
  const socketRef = useRef<Socket | null>(null)

  // Refs estáveis para os handlers — evita re-registrar listeners
  const onCreateRef = useRef(onCreate)
  const onUpdateRef = useRef(onUpdate)
  const onCancelRef = useRef(onCancel)

  // Atualiza as refs a cada render sem recriar o socket
  useEffect(() => {
    onCreateRef.current = onCreate
    onUpdateRef.current = onUpdate
    onCancelRef.current = onCancel
  })

  useEffect(() => {
    if (!businessId) return

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

    const socket: Socket = io(apiUrl, {
      withCredentials: true,
      transports: ['polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
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

    // Handlers delegam para as refs — sempre chamam a versão mais recente
    socket.on('booking:created', (booking: SocketBooking) => {
      onCreateRef.current(booking)
    })

    socket.on('booking:updated', (booking: SocketBooking) => {
      onUpdateRef.current?.(booking)
    })

    socket.on('booking:canceled', (payload: { id: string }) => {
      onCancelRef.current(payload.id)
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
  }, [businessId]) // ← só reconecta se businessId mudar
}