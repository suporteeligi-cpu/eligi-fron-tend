'use client'

import DashboardHeader from '@/app/components/dashboard/DashboardHeader'
import DashboardKPIs from '@/app/components/dashboard/DashboardKPIs'
import RevenueLineChart from '@/app/components/dashboard/RevenueLineChart'
import WeeklyDemandChart from '@/app/components/dashboard/WeeklyDemandChart'
import TodaySchedule from '@/app/components/dashboard/TodaySchedule'
import TopBarbers from '@/app/components/dashboard/TopBarbers'

export default function DashboardPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <DashboardHeader />
      <DashboardKPIs />

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <RevenueLineChart />
        <WeeklyDemandChart />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <TodaySchedule />
        <TopBarbers />
      </div>
    </div>
  )
}