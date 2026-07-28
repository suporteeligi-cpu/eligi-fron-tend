import { glassCard } from '@/shared/theme'
// src/features/reports/constants.ts

import type { TabDef } from './types'
import { Rocket, Globe } from 'lucide-react'

/** Vermelho eligi — trocar por token do theme.ts se preferir centralizar */
export const ACCENT = '#dc2626'
export const ACCENT_GRADIENT = 'linear-gradient(135deg,#dc2626,#b91c1c)'

/** Verde vibrante do gráfico de receita. Manter igual ao sparkline do dashboard. */
export const GREEN = '#10B981'

/** Roxo do canal online (link). Manter igual ao KPI do dashboard. */
export const ONLINE = '#7C3AED'
export const ONLINE_HI = '#6D28D9'

/** Estilo glass reaproveitado nos cards (Direção B). */
// fonte única em @/shared/theme (promovido quando o módulo fiscal
// passou a usar o mesmo card). Mantido o nome por compatibilidade.
export const GLASS_CARD: React.CSSProperties = glassCard

export const TABS: TabDef[] = [
  { id: 'painel', label: 'Painel' },
  { id: 'agendamentos', label: 'Agendamentos' },
  { id: 'clientes', label: 'Clientes' },
  { id: 'receita', label: 'Receita' },
  { id: 'fluxo-de-caixa', label: 'Fluxo de caixa' },
  { id: 'estoque', label: 'Estoque' },
  { id: 'equipe', label: 'Equipe' },
  { id: 'marketing', label: 'Link online', icon: Rocket },
  { id: 'club', label: 'Clube', icon: Globe },
]

export const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
