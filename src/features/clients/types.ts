// src/features/clients/types.ts

export interface ClientListItem {
  id:            string
  name:          string
  phone:         string
  createdAt:     string
  totalBookings: number
  completed:     number
  canceled:      number
  totalRevenue:  number
  lastVisit:     string | null
  lastStatus:    string | null
}
