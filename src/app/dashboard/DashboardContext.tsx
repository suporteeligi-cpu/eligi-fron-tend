'use client'

import { createContext, useContext, useState } from 'react'

type Period = 'today' | '7d' | '30d'

interface DashboardContextType {
  period: Period
  setPeriod: (p: Period) => void
}

const DashboardContext = createContext<DashboardContextType | null>(null)

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [period, setPeriod] = useState<Period>('7d')

  return (
    <DashboardContext.Provider value={{ period, setPeriod }}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const context = useContext(DashboardContext)
  if (!context) {
    throw new Error('useDashboard must be used inside DashboardProvider')
  }
  return context
}
