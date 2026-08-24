'use client'
// src/features/dashboard/hooks/useDashboardRealtime.ts
// @eligi:dashboard-realtime
// Mantem a Visao geral em dia sem F5.
//
// Substitui o antigo src/app/dashboard/useDashboardSocket.ts, que escutava
// 'dashboard:update' — evento que NENHUM ponto do back-end emite. O hook
// conectava, consumia bateria e conexao, e esperava para sempre. Aqui as
// assinaturas sao os eventos que o servidor de fato emite hoje:
//   bookings.service / bookings.controller / payments.service /
//   public.booking.controller / public.mybookings.controller / sales.service
//
// Estrategia (decisao A): o evento NAO carrega KPI. Ele so avisa que algo
// mudou; a pagina refaz GET /dashboard/overview. Receita nao pode ter dois
// donos — recalcular no front duplicaria regra de negocio que vive no back.
//
// Limite conhecido: venda de produto puro (sem bookingId) nao emite evento
// nenhum no back hoje, entao esse caso ainda depende de recarregar a pagina.

import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

/** Eventos verificados no back-end (grep de io.to(...).emit). */
const REFRESH_EVENTS = [
  'booking:created',
  'booking:updated',
  'booking:canceled',
] as const

/**
 * Uma rajada de eventos (confirmar venda dispara varios) vira um unico
 * refetch. Trailing: espera a poeira baixar antes de perguntar ao servidor.
 */
const DEBOUNCE_MS = 700

export function useDashboardRealtime(
  businessId: string | undefined,
  onRefresh:  () => void,
): void {
  // Callback em ref: trocar a funcao nao pode derrubar e recriar a conexao.
  const onRefreshRef = useRef(onRefresh)
  useEffect(() => {
    onRefreshRef.current = onRefresh
  })

  useEffect(() => {
    if (!businessId) return

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

    const socket: Socket = io(apiUrl, {
      withCredentials:      true,
      transports:           ['polling'], // Railway nao faz upgrade para WebSocket
      upgrade:              false,
      forceNew:             true,
      reconnection:         true,
      reconnectionAttempts: 8,
      reconnectionDelay:    1500,
      reconnectionDelayMax: 6000,
      timeout:              10000,
    })

    let timer: ReturnType<typeof setTimeout> | null = null
    let connectedOnce = false

    const scheduleRefresh = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        timer = null
        onRefreshRef.current()
      }, DEBOUNCE_MS)
    }

    const handleConnect = () => {
      socket.emit('join:business', businessId)
      // Toda reconexao passa por 'connect'. Nao uso socket.on('reconnect'):
      // no socket.io-client v4 esse evento vive no manager (socket.io), nao
      // no socket — assinar aqui seria um handler que nunca dispara.
      if (connectedOnce) scheduleRefresh()
      connectedOnce = true
    }

    socket.on('connect', handleConnect)
    for (const event of REFRESH_EVENTS) {
      socket.on(event, scheduleRefresh)
    }
    socket.on('connect_error', (err: Error) => {
      console.warn('[DashboardRealtime] connect_error:', err.message)
    })

    return () => {
      if (timer) clearTimeout(timer)
      socket.off('connect', handleConnect)
      for (const event of REFRESH_EVENTS) {
        socket.off(event, scheduleRefresh)
      }
      if (socket.connected) socket.emit('leave:business', businessId)
      socket.disconnect()
    }
  }, [businessId])
}
