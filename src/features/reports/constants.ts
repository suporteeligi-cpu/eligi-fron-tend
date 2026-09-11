import { glassCard } from '@/shared/theme'
// src/features/reports/constants.ts

import type { TabDef } from './types'
import {
  LayoutGrid, CalendarDays, Users, Wallet, ArrowLeftRight,
  Package, Briefcase, Rocket, Globe,
} from 'lucide-react'

/** Vermelho eligi — trocar por token do theme.ts se preferir centralizar */
export const ACCENT = '#dc2626'
export const ACCENT_GRADIENT = 'linear-gradient(135deg,#dc2626,#b91c1c)'

/** Verde vibrante do gráfico de receita. Manter igual ao sparkline do dashboard. */
export const GREEN = '#10B981'

/** Roxo do canal online (link). Manter igual ao KPI do dashboard. */
export const ONLINE = '#7C3AED'
export const ONLINE_HI = '#6D28D9'

// @eligi:club-tokens
/** Chapa escura do EligiClub nos relatorios (mesma do ClubReportPanel e da agenda). */
export const CLUB_INK = '#0E0E12'
export const CLUB_PAPER = '#F4F2EC'
export const CLUB_PAPER_MUTED = 'rgba(244,242,236,0.6)'
export const CLUB_LINE = 'rgba(244,242,236,0.12)'
/** Verde e vermelho legiveis sobre a chapa escura. */
export const CLUB_OK = '#7fe0bd'
export const CLUB_BAD = '#fca5a5'

/** Estilo glass reaproveitado nos cards (Direção B). */
// fonte única em @/shared/theme (promovido quando o módulo fiscal
// passou a usar o mesmo card). Mantido o nome por compatibilidade.
export const GLASS_CARD: React.CSSProperties = glassCard

// [rpt-mobile-leva1] ícones segment-neutral (Eligi atende barbearia, salão, clínica…)
export const TABS: TabDef[] = [
  { id: 'painel',         label: 'Painel',         shortLabel: 'Painel',   hint: 'visão geral',         icon: LayoutGrid },
  { id: 'agendamentos',   label: 'Agendamentos',   shortLabel: 'Agenda',   hint: 'confirmados, faltas', icon: CalendarDays },
  { id: 'clientes',       label: 'Clientes',       shortLabel: 'Clientes', hint: 'novos, recorrentes',  icon: Users },
  { id: 'receita',        label: 'Receita',        shortLabel: 'Receita',  hint: 'vendas, ticket',      icon: Wallet },
  { id: 'fluxo-de-caixa', label: 'Fluxo de caixa', shortLabel: 'Caixa',    hint: 'entradas, saídas',    icon: ArrowLeftRight },
  { id: 'estoque',        label: 'Estoque',        shortLabel: 'Estoque',  hint: 'giro, mínimo',        icon: Package },
  { id: 'equipe',         label: 'Equipe',         shortLabel: 'Equipe',   hint: 'receita, ocupação',   icon: Briefcase },
  { id: 'marketing',      label: 'Link online',    shortLabel: 'Link',     hint: 'canal online',        icon: Rocket },
  { id: 'club',           label: 'Clube',          shortLabel: 'Clube',    hint: 'membros, MRR',        icon: Globe },
]

/** breakpoint único do módulo (mesmo valor do CSS .rpt-kpis) */
export const MOBILE_BP = 640

export const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
