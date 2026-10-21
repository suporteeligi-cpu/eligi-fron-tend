// src/features/expenses/categories.ts
// @eligi:expcat-front-meta — rotulo, cor e icone de toda categoria de despesa.
//
// Paleta e icones ESPELHAM o back (src/modules/expenses/expenses.categories.rules.ts):
// o back recusa cor ou icone fora da lista. Mudou la, muda aqui.
// Nenhuma cor de categoria e vermelha: vermelho e acao, nao categoria.
import {
  Car, Coffee, CreditCard, Droplet, FileText, GraduationCap, Home, Landmark,
  Megaphone, MoreHorizontal, Package, PenTool, Shield, Sparkles, Tag, Users,
  Wifi, Wrench, Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { CustomCategory, Expense, ExpenseCategory } from './types'

export const CATEGORY_PALETTE = [
  '#2f6fd6', '#0f9e8e', '#4d9a2a', '#d98a1c', '#c2571a',
  '#d9488f', '#6d5bd0', '#3d8fb0', '#8a6a4a', '#5c6570',
] as const

export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  'home': Home,
  'zap': Zap,
  'droplet': Droplet,
  'wifi': Wifi,
  'file-text': FileText,
  'sparkles': Sparkles,
  'car': Car,
  'coffee': Coffee,
  'graduation-cap': GraduationCap,
  'landmark': Landmark,
  'shield': Shield,
  'pen-tool': PenTool,
  'megaphone': Megaphone,
  'package': Package,
  'users': Users,
  'credit-card': CreditCard,
  'tag': Tag,
  'more-horizontal': MoreHorizontal,
}

export const CATEGORY_ICON_NAMES = Object.keys(CATEGORY_ICON_MAP)

export const CATEGORY_NAME_MAX = 24
export const CATEGORY_MAX_ACTIVE = 30

interface BaseMeta {
  label: string
  color: string
  Icon:  LucideIcon
  /** lancada pelo sistema quando a despesa automatica esta ligada */
  auto:  boolean
  /** aparece na escolha ao lancar despesa a mao */
  manual: boolean
}

export const BASE_CATEGORIES: Record<ExpenseCategory, BaseMeta> = {
  OPERACIONAL: { label: 'Operacional',    color: '#2f6fd6', Icon: Wrench,         auto: false, manual: true  },
  MARKETING:   { label: 'Marketing',      color: '#d9488f', Icon: Megaphone,      auto: false, manual: true  },
  COMISSAO:    { label: 'Comissão',       color: '#6d5bd0', Icon: Users,          auto: true,  manual: true  },
  ESTOQUE:     { label: 'Estoque',        color: '#d98a1c', Icon: Package,        auto: true,  manual: true  },
  TAXA_CARTAO: { label: 'Taxa de cartão', color: '#0f9e8e', Icon: CreditCard,     auto: true,  manual: false },
  OUTROS:      { label: 'Outros',         color: '#8a8a93', Icon: MoreHorizontal, auto: false, manual: true  },
}

export const BASE_ORDER: ExpenseCategory[] = ['OPERACIONAL', 'MARKETING', 'COMISSAO', 'ESTOQUE', 'TAXA_CARTAO', 'OUTROS']

/** O que a tela precisa para desenhar uma categoria. */
export interface CategoryView {
  key:   string            // 'custom:<id>' ou o enum
  label: string
  color: string
  Icon:  LucideIcon
  base:  boolean
  auto:  boolean
}

export function iconFor(name: string): LucideIcon {
  return CATEGORY_ICON_MAP[name] ?? Tag
}

export function baseView(cat: ExpenseCategory): CategoryView {
  const m = BASE_CATEGORIES[cat]
  return { key: cat, label: m.label, color: m.color, Icon: m.Icon, base: true, auto: m.auto }
}

export function customView(c: { id: string; name: string; color: string; icon: string }): CategoryView {
  return { key: `custom:${c.id}`, label: c.name, color: c.color, Icon: iconFor(c.icon), base: false, auto: false }
}

/** Categoria que a despesa mostra: a propria quando existe, senao a do Eligi. */
export function expenseView(e: Pick<Expense, 'category' | 'customCategory'>): CategoryView {
  return e.customCategory ? customView(e.customCategory) : baseView(e.category)
}

export function expenseKey(e: Pick<Expense, 'category' | 'customCategoryId'>): string {
  return e.customCategoryId ? `custom:${e.customCategoryId}` : e.category
}

/** Fundo suave de um tom, para o quadrado do icone. */
export function tint(hex: string, alpha: number): string {
  const n = parseInt(hex.replace('#', ''), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`
}

/** Chave sem acento e sem caixa, igual a do back (categoryNameKey). */
export function nameKey(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

const BASE_KEYS = new Set(Object.values(BASE_CATEGORIES).map((m) => nameKey(m.label)))

/** Problema do nome, com o mesmo texto que o back devolveria. null = ok. */
export function nameProblem(raw: string, existing: CustomCategory[], exceptId?: string): string | null {
  const clean = raw.replace(/\s+/g, ' ').trim()
  if (clean.length < 2) return 'Dê um nome com pelo menos 2 letras.'
  if (clean.length > CATEGORY_NAME_MAX) return `Use no máximo ${CATEGORY_NAME_MAX} caracteres.`
  const key = nameKey(clean)
  if (BASE_KEYS.has(key)) return 'Essa categoria já existe no Eligi. Escolha outro nome.'
  const clash = existing.find((c) => c.id !== exceptId && nameKey(c.name) === key)
  if (clash) return clash.archived
    ? 'Você já tem uma categoria arquivada com esse nome. Restaure ela em Categorias.'
    : 'Já existe uma categoria com esse nome.'
  return null
}
