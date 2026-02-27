'use client'

import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

export function useSocketStatus(token: string | null) {
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!token) return

    const socket = io(process.env.NEXT_PUBLIC_API_URL!, {
      auth: { token }
    })

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    return () => {
      socket.disconnect()
    }
  }, [token])

  return connected
}