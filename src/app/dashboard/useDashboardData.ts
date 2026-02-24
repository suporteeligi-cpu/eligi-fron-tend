'use client'

import { useEffect, useState } from 'react'
import { useDashboard } from './DashboardContext'
import { api } from '@/lib/api'

interface DashboardData {
  kpis: {
    revenue: number
    revenueGrowth: number
    ticketAverage: number
    attendanceRate: number
    totalBookings: number
  }
  revenueChart: { label: string; value: number }[]
  demandChart: { label: string; value: number }[]
  topBarbers: { name: string; total: number }[]
  todaySchedule: {
    time: string
    client: string
    service: string
    professional: string
  }[]
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
