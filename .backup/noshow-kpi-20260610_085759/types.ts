// src/features/dashboard/types.ts

export type DashboardPeriod = 'today' | '7d' | '30d'

export interface OnlineBookingsKPI {
  today:       number
  todayPct:    number        // % dos agendamentos de hoje
  month:       number
  monthGrowth: number | null // null = sem base anterior
}

export interface DashboardKPIs {
  revenue:          number
  revenueGrowth:    number | null
  ticketAverage:    number
  attendanceRate:   number
  totalBookings:    number
  tomorrowBookings: number
  onlineBookings:   OnlineBookingsKPI
}

export interface RevenueChartPoint {
  label: string
  value: number
}

export interface TopProfessional {
  professionalId: string
  name:           string
  avatarUrl:      string | null
  revenue:        number
  itemsCount:     number
}

export interface TodayScheduleItem {
  id:             string
  time:           string
  client:         string
  service:        string
  serviceColor:   string | null
  professional:   string | null
  professionalId: string | null
  status:         'CONFIRMED' | 'COMPLETED' | 'CANCELED' | 'NO_SHOW'
  isPast:         boolean
  isOnline:       boolean
}

export interface DashboardAlerts {
  pendingCommissions: {
    total:         number
    professionals: number
    href:          string
  }
  lowStock: {
    count: number
    items: Array<{ id: string; name: string; stock: number }>
    href:  string
  }
  unassignedBookings: {
    count: number
    href:  string
  }
}

export interface DashboardOverview {
  period:           DashboardPeriod
  kpis:             DashboardKPIs
  revenueChart:     RevenueChartPoint[]
  topProfessionals: TopProfessional[]
  todaySchedule:    TodayScheduleItem[]
  alerts:           DashboardAlerts
}
