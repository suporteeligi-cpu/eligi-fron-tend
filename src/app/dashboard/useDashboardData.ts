'use client'

import { useEffect, useState } from 'react'
import { useDashboard } from './DashboardContext'
import { api } from '@/lib/api'

interface KPIData {
  revenue: number
  ticketAverage: number
  attendanceRate: number
  totalBookings: number
}

interface ChartPoint {
  label: string
  value: number
}

interface TopBarber {
  id: string
  name: string
  revenue: number
  bookings: number
}

export interface DashboardData {
  kpis: KPIData
  revenueChart: ChartPoint[]
  demandChart: ChartPoint[]
  topBarbers: TopBarber[]
}

export function useDashboardData() {
  const { period } = useDashboard()

  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)

        const response = await api.get<DashboardData>(
          `/dashboard/overview?period=${period}`
        )

        setData(response.data)
      } catch (error) {
        console.error('Erro ao buscar dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [period])

  return { data, loading }
}
