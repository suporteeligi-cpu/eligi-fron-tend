import { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  UserCog,
  Settings,
  ShoppingBag,
  PackageOpen,
  DollarSign,
  CreditCard,
  Coins,
  BarChart3,
} from 'lucide-react'

export type Role =
  | 'BUSINESS_OWNER'
  | 'MANAGER'
  | 'RECEPTIONIST'
  | 'STAFF'
  | 'BASIC_STAFF'
  | 'PROFESSIONAL'
  | 'AFFILIATE'

export interface NavItemType {
  label:   string
  path:    string
  icon:    LucideIcon
  section: 'principal' | 'financeiro' | 'gestao' | 'admin'
}

export const navigationByRole: Record<Role, NavItemType[]> = {
  BUSINESS_OWNER: [
    { label: 'Dashboard',     path: '/dashboard',               icon: LayoutDashboard, section: 'principal'  },
    { label: 'Agenda',        path: '/dashboard/agenda',        icon: Calendar,        section: 'principal'  },
    { label: 'Clientes',      path: '/dashboard/clientes',      icon: Users,           section: 'principal'  },
    { label: 'Serviços',      path: '/dashboard/servicos',      icon: ShoppingBag,        section: 'principal'  },
    { label: 'Pacotes',       path: '/dashboard/pacotes',       icon: CreditCard,      section: 'principal'  },
    { label: 'Equipe',        path: '/dashboard/equipe',        icon: UserCog,         section: 'principal'  },
    { label: 'Estoque',       path: '/dashboard/estoque',       icon: PackageOpen,     section: 'principal'  },
    { label: 'Caixa',         path: '/dashboard/caixa',         icon: ShoppingBag,     section: 'financeiro' },
    { label: 'Financeiro',    path: '/dashboard/financeiro',    icon: DollarSign,      section: 'financeiro' },
    { label: 'Relatórios',    path: '/dashboard/relatorios',    icon: BarChart3,       section: 'financeiro' },
    { label: 'Configurações', path: '/dashboard/configuracoes', icon: Settings,        section: 'gestao'     },
  ],
  MANAGER: [
    { label: 'Dashboard', path: '/dashboard',          icon: LayoutDashboard, section: 'principal'  },
    { label: 'Agenda',    path: '/dashboard/agenda',   icon: Calendar,        section: 'principal'  },
    { label: 'Clientes',  path: '/dashboard/clientes', icon: Users,           section: 'principal'  },
    { label: 'Serviços',  path: '/dashboard/servicos', icon: Scissors,        section: 'principal'  },
    { label: 'Pacotes',   path: '/dashboard/pacotes',  icon: CreditCard,      section: 'principal'  },
    { label: 'Equipe',    path: '/dashboard/equipe',   icon: UserCog,         section: 'principal'  },
    { label: 'Estoque',   path: '/dashboard/estoque',  icon: PackageOpen,     section: 'principal'  },
    { label: 'Caixa',     path: '/dashboard/caixa',    icon: ShoppingBag,     section: 'financeiro' },
  ],
  RECEPTIONIST: [
    { label: 'Agenda',    path: '/dashboard/agenda',            icon: Calendar,    section: 'principal'  },
    { label: 'Clientes',  path: '/dashboard/clientes',          icon: Users,       section: 'principal'  },
    { label: 'Serviços',  path: '/dashboard/servicos',          icon: Scissors,    section: 'principal'  },
    { label: 'Pacotes',   path: '/dashboard/pacotes',           icon: CreditCard,  section: 'principal'  },
    { label: 'Estoque',   path: '/dashboard/estoque',           icon: PackageOpen, section: 'principal'  },
    { label: 'Caixa',     path: '/dashboard/caixa',             icon: ShoppingBag, section: 'financeiro' },
    { label: 'Vendas',    path: '/dashboard/financeiro/vendas', icon: DollarSign,  section: 'financeiro' },
    { label: 'Comissões', path: '/dashboard/financeiro/comissoes', icon: Coins,    section: 'financeiro' },
  ],
  STAFF: [
    { label: 'Agenda',    path: '/dashboard/agenda',   icon: Calendar,    section: 'principal'  },
    { label: 'Clientes',  path: '/dashboard/clientes', icon: Users,       section: 'principal'  },
    { label: 'Caixa',     path: '/dashboard/caixa',    icon: ShoppingBag, section: 'financeiro' },
    { label: 'Comissões', path: '/dashboard/financeiro/comissoes', icon: Coins, section: 'financeiro' },
  ],
  BASIC_STAFF: [
    { label: 'Agenda',    path: '/dashboard/agenda',   icon: Calendar, section: 'principal'  },
    { label: 'Comissões', path: '/dashboard/financeiro/comissoes', icon: Coins, section: 'financeiro' },
  ],
  PROFESSIONAL: [
    { label: 'Dashboard', path: '/dashboard',        icon: LayoutDashboard, section: 'principal' },
    { label: 'Agenda',    path: '/dashboard/agenda', icon: Calendar,        section: 'principal' },
  ],
  AFFILIATE: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, section: 'principal' },
  ],
}

export const DASHBOARD_ROLES: Role[] = [
  'BUSINESS_OWNER', 'MANAGER', 'RECEPTIONIST', 'STAFF', 'BASIC_STAFF', 'PROFESSIONAL', 'AFFILIATE',
]

export function getRoleLabel(role?: string): string {
  const labels: Record<string, string> = {
    BUSINESS_OWNER: 'Proprietário',
    MANAGER:        'Gerente',
    RECEPTIONIST:   'Recepcionista',
    STAFF:          'Funcionário',
    BASIC_STAFF:    'Func. básico',
    PROFESSIONAL:   'Profissional',
    AFFILIATE:      'Afiliado',
  }
  return labels[role ?? ''] ?? 'Usuário'
}
