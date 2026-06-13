// src/features/reports/constants.ts

import type { TabDef } from './types'

/** Vermelho eligi — trocar por token do theme.ts se preferir centralizar */
export const ACCENT = '#dc2626'
export const ACCENT_GRADIENT = 'linear-gradient(135deg,#dc2626,#b91c1c)'

/** Estilo glass reaproveitado nos cards (Direção B). */
export const GLASS_CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(20px) saturate(160%)',
  WebkitBackdropFilter: 'blur(20px) saturate(160%)',
  border: '0.5px solid rgba(0,0,0,0.08)',
  borderRadius: 16,
  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
}

export const TABS: TabDef[] = [
  { id: 'painel', label: 'Painel' },
  { id: 'agendamentos', label: 'Agendamentos' },
  { id: 'clientes', label: 'Clientes' },
  { id: 'receita', label: 'Receita' },
  { id: 'fluxo-de-caixa', label: 'Fluxo de caixa' },
  { id: 'estoque', label: 'Estoque' },
  { id: 'equipe', label: 'Equipe' },
  { id: 'marketing', label: 'Marketing' },
]

export const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
