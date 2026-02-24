import { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  UserCog,
  CreditCard,
  Settings
} from 'lucide-react'

export type Role = 'BUSINESS_OWNER' | 'PROFESSIONAL' | 'AFFILIATE'

export interface NavItemType {
  label: string
  path: string
   icon: LucideIcon
  section: 'principal' | 'financeiro' | 'gestao' | 'admin'
}

export const navigationByRole: Record<Role, NavItemType[]> = {
  BUSINESS_OWNER: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, section: 'principal' },
    { label: 'Agenda', path: '/dashboard/agenda', icon: Calendar, section: 'principal' },
    { label: 'Clientes', path: '/dashboard/clientes', icon: Users, section: 'principal' },
    { label: 'Serviços', path: '/dashboard/servicos', icon: Scissors, section: 'principal' },
    { label: 'Equipe', path: '/dashboard/equipe', icon: UserCog, section: 'principal' },
    { label: 'Financeiro', path: '/dashboard/financeiro', icon: CreditCard, section: 'financeiro' },
    { label: 'Configurações', path: '/dashboard/configuracoes', icon: Settings, section: 'gestao' },
  ],

  PROFESSIONAL: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, section: 'principal' },
    { label: 'Agenda', path: '/dashboard/agenda', icon: Calendar, section: 'principal' },
  ],

  AFFILIATE: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, section: 'principal' },
  ],
}