import { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Calendar,
  Users,
  UserCog,
  Settings,
  PackageOpen,
  DollarSign,
  CreditCard,
  Coins,
  BarChart3,
  ReceiptText,
  Sparkles,
  Banknote,
} from 'lucide-react' // @eligi:sb-icons — Servicos e Caixa com icones proprios; sem tesoura (segmento-neutro)
import EligiClubIcon from './EligiClubIcon'

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
  /** @eligi:sb-match — prefixo que mantem o item aceso nas sub-paginas (padrao: o proprio path) */
  match?:  string
  /** rotulo curto da barra inferior do celular */
  short?:  string
}

export const navigationByRole: Record<Role, NavItemType[]> = {
  BUSINESS_OWNER: [
    { label: 'Dashboard',     path: '/dashboard',               icon: LayoutDashboard, section: 'principal', short: 'Início'  },
    { label: 'Agenda',        path: '/dashboard/agenda',        icon: Calendar,        section: 'principal'  },
    { label: 'Clientes',      path: '/dashboard/clientes',      icon: Users,           section: 'principal'  },
    { label: 'Serviços',      path: '/dashboard/servicos',      icon: Sparkles,        section: 'principal'  },
    { label: 'Pacotes',       path: '/dashboard/pacotes',       icon: CreditCard,      section: 'principal'  },
    { label: 'EligiClub',     path: '/dashboard/eligiclub',     icon: EligiClubIcon,   section: 'principal'  },
    { label: 'Equipe',        path: '/dashboard/equipe',        icon: UserCog,         section: 'principal'  },
    { label: 'Estoque',       path: '/dashboard/estoque',       icon: PackageOpen,     section: 'principal'  },
    { label: 'Caixa',         path: '/dashboard/caixa',         icon: Banknote,     section: 'financeiro' },
    { label: 'Financeiro',    path: '/dashboard/financeiro',    icon: DollarSign,      section: 'financeiro' },
    { label: 'Relatórios',    path: '/dashboard/relatorios',    icon: BarChart3,       section: 'financeiro' },
    { label: 'Notas Fiscais', path: '/dashboard/notas-fiscais', icon: ReceiptText,     section: 'financeiro' },
    { label: 'Configurações', path: '/dashboard/configuracoes', icon: Settings,        section: 'gestao'     },
  ],
  MANAGER: [
    { label: 'Dashboard', path: '/dashboard',          icon: LayoutDashboard, section: 'principal', short: 'Início'  },
    { label: 'Agenda',    path: '/dashboard/agenda',   icon: Calendar,        section: 'principal'  },
    { label: 'Clientes',  path: '/dashboard/clientes', icon: Users,           section: 'principal'  },
    { label: 'Serviços',  path: '/dashboard/servicos', icon: Sparkles,        section: 'principal'  },
    { label: 'Pacotes',   path: '/dashboard/pacotes',  icon: CreditCard,      section: 'principal'  },
    { label: 'Equipe',    path: '/dashboard/equipe',   icon: UserCog,         section: 'principal'  },
    { label: 'Estoque',   path: '/dashboard/estoque',  icon: PackageOpen,     section: 'principal'  },
    { label: 'Caixa',     path: '/dashboard/caixa',    icon: Banknote,     section: 'financeiro' },
    { label: 'Configurações', path: '/dashboard/configuracoes/aparencia', icon: Settings, section: 'gestao', match: '/dashboard/configuracoes' },
  ],
  RECEPTIONIST: [
    { label: 'Agenda',    path: '/dashboard/agenda',            icon: Calendar,    section: 'principal'  },
    { label: 'Clientes',  path: '/dashboard/clientes',          icon: Users,       section: 'principal'  },
    { label: 'Serviços',  path: '/dashboard/servicos',          icon: Sparkles,    section: 'principal'  },
    { label: 'Pacotes',   path: '/dashboard/pacotes',           icon: CreditCard,  section: 'principal'  },
    { label: 'EligiClub', path: '/dashboard/eligiclub',         icon: EligiClubIcon, section: 'principal'  }, // @eligi:club-papeis-front
    { label: 'Estoque',   path: '/dashboard/estoque',           icon: PackageOpen, section: 'principal'  },
    { label: 'Caixa',     path: '/dashboard/caixa',             icon: Banknote, section: 'financeiro' },
    { label: 'Vendas',    path: '/dashboard/financeiro/vendas', icon: DollarSign,  section: 'financeiro' },
    { label: 'Comissões', path: '/dashboard/financeiro/comissoes', icon: Coins,    section: 'financeiro' },
    { label: 'Configurações', path: '/dashboard/configuracoes/aparencia', icon: Settings, section: 'gestao', match: '/dashboard/configuracoes' },
  ],
  STAFF: [
    { label: 'Agenda',    path: '/dashboard/agenda',   icon: Calendar,    section: 'principal'  },
    { label: 'Caixa',     path: '/dashboard/caixa',    icon: Banknote, section: 'financeiro' },
    { label: 'Comissões', path: '/dashboard/financeiro/comissoes', icon: Coins, section: 'financeiro' },
    { label: 'Configurações', path: '/dashboard/configuracoes/aparencia', icon: Settings, section: 'gestao', match: '/dashboard/configuracoes' },
  ],
  BASIC_STAFF: [
    { label: 'Agenda',    path: '/dashboard/agenda',   icon: Calendar, section: 'principal'  },
    { label: 'Comissões', path: '/dashboard/financeiro/comissoes', icon: Coins, section: 'financeiro' },
    { label: 'Configurações', path: '/dashboard/configuracoes/aparencia', icon: Settings, section: 'gestao', match: '/dashboard/configuracoes' },
  ],
  PROFESSIONAL: [
    { label: 'Dashboard', path: '/dashboard',        icon: LayoutDashboard, section: 'principal', short: 'Início' },
    { label: 'Agenda',    path: '/dashboard/agenda', icon: Calendar,        section: 'principal' },
  ],
  AFFILIATE: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, section: 'principal', short: 'Início' },
  ],
}

// @eligi:sb-mobile-tabs — abas fixas da barra do celular, por cargo (o resto vai no "Mais").
// Escolhidas pelo uso no balcao, nao pela ordem da lista.
export const mobileTabsByRole: Partial<Record<Role, string[]>> = {
  BUSINESS_OWNER: ['/dashboard', '/dashboard/agenda', '/dashboard/caixa', '/dashboard/clientes'],
  MANAGER:        ['/dashboard', '/dashboard/agenda', '/dashboard/caixa', '/dashboard/clientes'],
  RECEPTIONIST:   ['/dashboard/agenda', '/dashboard/caixa', '/dashboard/clientes', '/dashboard/eligiclub'],
  STAFF:          ['/dashboard/agenda', '/dashboard/caixa', '/dashboard/financeiro/comissoes'],
  BASIC_STAFF:    ['/dashboard/agenda', '/dashboard/financeiro/comissoes'],
}

/**
 * Item aceso para a rota atual: o de prefixo MAIS LONGO. Comissoes acende dentro
 * de /financeiro/comissoes (recepcao), Financeiro acende em /financeiro/vendas
 * (dono) e /dashboard so acende na propria pagina.
 */
export function activeNavPath(items: NavItemType[], pathname: string | null): string | null {
  if (!pathname) return null
  let best: { path: string; len: number } | null = null
  for (const it of items) {
    const bases = [it.path, it.match].filter((b): b is string => !!b)
    for (const b of bases) {
      const hit = pathname === b || (b !== '/dashboard' && pathname.startsWith(b + '/'))
      if (hit && (!best || b.length > best.len)) best = { path: it.path, len: b.length }
    }
  }
  return best?.path ?? null
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
