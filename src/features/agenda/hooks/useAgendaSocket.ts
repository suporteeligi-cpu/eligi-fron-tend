'use client'
// src/hooks/useAgendaSocket.ts

import { useEffect, useRef } from 'react'
import { io, Socket }        from 'socket.io-client'
import { AgendaBooking, AgendaBlock } from '@/features/agenda/types'

export type SocketBooking = AgendaBooking

interface SocketHandlers {
  businessId:    string
  onCreate:      (booking: SocketBooking) => void
  onUpdate?:     (booking: SocketBooking) => void
  onCancel:      (bookingId: string) => void
  onBlockCreate?:(block: AgendaBlock) => void
  onBlockDelete?:(blockId: string) => void
}

export function useAgendaSocket({
  businessId, onCreate, onUpdate, onCancel, onBlockCreate, onBlockDelete,
}: SocketHandlers) {
  const onCreateRef      = useRef(onCreate)
  const onUpdateRef      = useRef(onUpdate)
  const onCancelRef      = useRef(onCancel)
  const onBlockCreateRef = useRef(onBlockCreate)
  const onBlockDeleteRef = useRef(onBlockDelete)

  useEffect(() => {
    onCreateRef.current      = onCreate
    onUpdateRef.current      = onUpdate
    onCancelRef.current      = onCancel
    onBlockCreateRef.current = onBlockCreate
    onBlockDeleteRef.current = onBlockDelete
  })

  useEffect(() => {
    if (!businessId) return

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

    const socket: Socket = io(apiUrl, {
      withCredentials:      true,
      transports:           ['polling'],
      upgrade:              false,
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

    socket.on('booking:created',  (b: SocketBooking)       => onCreateRef.current(b))
    socket.on('booking:updated',  (b: SocketBooking)       => onUpdateRef.current?.(b))
    socket.on('booking:canceled', ({ id }: { id: string }) => onCancelRef.current(id))

    socket.on('block:created', (b: AgendaBlock)      => onBlockCreateRef.current?.(b))
    socket.on('block:deleted', ({ id }: { id: string }) => onBlockDeleteRef.current?.(id))

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