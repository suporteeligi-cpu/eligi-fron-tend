'use client'
// src/hooks/useSocketStatus.ts
// CORRIGIDO: usa polling-only para Railway (sem WebSocket upgrade)

import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

export function useSocketStatus(token: string | null) {
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!token) return

    const socket = io(process.env.NEXT_PUBLIC_API_URL!, {
      auth:       { token },
      transports: ['polling'],  // Railway: sem WebSocket upgrade
      upgrade:    false,
    })

    socket.on('connect',    () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    return () => { socket.disconnect() }
  }, [token])

  return connected
}