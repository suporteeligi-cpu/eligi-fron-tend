'use client'

import { useEffect } from 'react'
import { io, Socket } from 'socket.io-client'

export function useDashboardSocket(
  token: string | undefined,
  onUpdate: () => void
) {
  useEffect(() => {
    if (!token) return

    const socket: Socket = io('http://localhost:3333', {
      auth: {
        token
      }
    })

    socket.on('connect', () => {
      console.log('Socket connected')
    })

    socket.on('dashboard:update', () => {
      onUpdate()
    })

    return () => {
      socket.disconnect()
    }
  }, [token, onUpdate])
}