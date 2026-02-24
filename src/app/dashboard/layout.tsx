'use client'

import { ReactNode } from 'react'
import AppNavbar from '@/app/components/navigation/AppNavbar'
import Sidebar from '@/app/components/navigation/Sidebar'
import CommandPalette from '@/app/components/search/CommandPalette'
import { DashboardProvider } from '@/app/dashboard/DashboardContext'

export default function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <DashboardProvider>
      <div style={rootStyle}>
        <AppNavbar />
        <div style={bodyStyle}>
          <Sidebar />
          <main style={contentStyle}>
            {children}
          </main>
        </div>
        <CommandPalette />
      </div>
    </DashboardProvider>
  )
}

const rootStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: '#f5f6f8',
}

const bodyStyle: React.CSSProperties = {
  display: 'flex',
  marginTop: '90px',
}

const contentStyle: React.CSSProperties = {
  flex: 1,
  padding: '32px',
}
