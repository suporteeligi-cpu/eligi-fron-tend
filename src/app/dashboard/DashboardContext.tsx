'use client'

import { createContext, useContext, useState, useMemo } from 'react'

export type Period = 'today' | '7d' | '30d'

interface DashboardContextType {
  period:    Period
  setPeriod: (p: Period) => void
}

const DashboardContext = createContext<DashboardContextType | null>(null)

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [period, setPeriod] = useState<Period>('7d')

  const value = useMemo(() => ({ period, setPeriod }), [period])

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const ctx = useContext(DashboardContext)
  if (!ctx) throw new Error('useDashboard must be used inside DashboardProvider')
  return ctx
}