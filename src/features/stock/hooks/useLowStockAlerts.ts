'use client'
// src/features/stock/hooks/useLowStockAlerts.ts
//
// Hook reutilizável para qualquer componente que precise saber quantos
// produtos estão em alerta (estoque baixo ou esgotado).
//
// Uso no AppNavbar:
//
//   const { count, alerts } = useLowStockAlerts()
//   const showBadge = count > 0
//
// Faz polling a cada 60s automaticamente.

import { useState, useEffect, useRef } from 'react'
import api from '@/shared/lib/apiClient'
import { LowStockProduct } from '../types'

const POLL_INTERVAL_MS = 60_000  // 1 min

export function useLowStockAlerts() {
  const [alerts,  setAlerts]  = useState<LowStockProduct[]>([])
  const [loading, setLoading] = useState(true)
  const isMountedRef = useRef(false)

  useEffect(() => {
    let cancelled = false

    async function fetchAlerts() {
      try {
        const res = await api.get('/products/stock/alerts')
        if (cancelled) return
        const data = res.data?.data ?? res.data
        setAlerts(Array.isArray(data) ? data : [])
      } catch {
        // Silencioso — endpoint pode não existir em deploys antigos
        if (!cancelled) setAlerts([])
      } finally {
        if (!cancelled && !isMountedRef.current) {
          isMountedRef.current = true
          setLoading(false)
        }
      }
    }

    // Fetch inicial
    fetchAlerts()

    // Polling
    const interval = setInterval(fetchAlerts, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  return {
    alerts,
    count:    alerts.length,
    loading,
  }
}
