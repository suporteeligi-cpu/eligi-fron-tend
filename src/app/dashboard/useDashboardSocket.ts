'use client'

import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

export function useDashboardSocket(
  businessId: string | undefined,
  onUpdate:   () => void,
) {
  // Keep onUpdate stable via ref — avoids reconnecting when callback changes
  const onUpdateRef = useRef(onUpdate)
  useEffect(() => { onUpdateRef.current = onUpdate })

  useEffect(() => {
    if (!businessId) return

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

    const socket: Socket = io(apiUrl, {
      withCredentials:      true,
      transports:           ['polling'],   // Railway proxy limitation
      upgrade:              false,
      forceNew:             true,
      reconnection:         true,
      reconnectionAttempts: 8,
      reconnectionDelay:    1500,
      reconnectionDelayMax: 6000,
      timeout:              10000,
    })

    socket.on('connect', () => {
      socket.emit('join:business', businessId)
    })

    socket.on('dashboard:update', () => {
      onUpdateRef.current()
    })

    socket.on('connect_error', err => {
      console.warn('[DashboardSocket] connect_error:', err.message)
    })

    return () => {
      socket.emit('leave:business', businessId)
      socket.disconnect()
    }
  }, [businessId])
}