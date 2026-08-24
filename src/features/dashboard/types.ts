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
  noShowCount:      number
  noShowRate:       number
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
  fiscal:           DashboardFiscal | null
}

// @eligi:fiscal-block
// Recorte fiscal da Visao geral. Vem null quando o estabelecimento nao tem a
// emissao de NFS-e ligada — nesse caso a pill do ticker e a linha de
// prioridade simplesmente nao existem.
export interface DashboardFiscal {
  monthAuthorized: number
  monthValue:      number
  rejected:        number
  processing:      number
  href:            string
}
