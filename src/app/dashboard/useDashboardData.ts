'use client'

import { useEffect, useState, useCallback } from 'react'
import { useDashboard } from './DashboardContext'
import { api }          from '@/lib/api'
import { useDashboardSocket } from './useDashboardSocket'
import { useAuth }      from '@/hooks/useAuth'

export interface DashboardData {
  kpis: {
    revenue:        number
    revenueGrowth:  number
    ticketAverage:  number
    attendanceRate: number
    totalBookings:  number
  }
  revenueChart:   { label: string; value: number }[]
  demandChart:    { label: string; value: number }[]
  topBarbers:     { name: string; total: number }[]
  todaySchedule:  { time: string; client: string; service: string; professional: string }[]
}

export function useDashboardData() {
  const { period }     = useDashboard()
  const { user }       = useAuth()
  const businessId     = user?.businessId

  const [data,    setData]    = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!businessId) return
    try {
      setLoading(true)
      const res = await api.get<DashboardData>(`/dashboard/overview?period=${period}`)
      setData(res.data)
    } catch (err) {
      console.error('[useDashboardData] Erro:', err)
    } finally {
      setLoading(false)
    }
  }, [period, businessId])

  useEffect(() => {
    if (businessId) fetchData()
  }, [fetchData, businessId])

  // Real-time updates via socket
  useDashboardSocket(businessId ?? undefined, fetchData)

  return { data, loading }
}