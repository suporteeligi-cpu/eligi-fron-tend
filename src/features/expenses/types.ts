// src/features/expenses/types.ts

export type ExpenseCategory = 'OPERACIONAL' | 'MARKETING' | 'COMISSAO' | 'ESTOQUE' | 'OUTROS'
export type ExpenseOrigin   = 'MANUAL' | 'AUTO_COMISSAO' | 'AUTO_ESTOQUE'

export interface Expense {
  id:             string
  businessId:     string
  date:           string        // ISO string
  amount:         number
  description:    string
  category:       ExpenseCategory
  origin:         ExpenseOrigin
  professionalId: string | null
  productId:      string | null
  saleId:         string | null
  isRecurring:    boolean
  recurringDay:   number | null
  createdAt:      string
  updatedAt:      string
}

export interface ExpenseKPIs {
  total:      number
  fixed:      number
  variable:   number
  byCategory: Record<string, number>
}

export interface ExpensesResponse {
  expenses: Expense[]
  kpis:     ExpenseKPIs
}

export interface CreateExpensePayload {
  date:         string      // ISO
  amount:       number
  description:  string
  category:     ExpenseCategory
  isRecurring:  boolean
  recurringDay: number | null
}

export type UpdateExpensePayload = Partial<CreateExpensePayload>

// ── Metadados visuais por categoria ────────────────────────────────────────

export interface CategoryMeta {
  label:      string
  color:      string     // hex — bg do badge
  textColor:  string     // hex — texto do badge
  dotColor:   string     // hex — dot na lista
  iconName:   string     // nome do ícone Lucide
}

export const CATEGORY_META: Record<ExpenseCategory, CategoryMeta> = {
  OPERACIONAL: {
    label:     'Operacional',
    color:     'rgba(8,145,178,0.15)',
    textColor: '#0891b2',
    dotColor:  '#0891b2',
    iconName:  'Wrench',
  },
  MARKETING: {
    label:     'Marketing',
    color:     'rgba(124,58,237,0.15)',
    textColor: '#7c3aed',
    dotColor:  '#7c3aed',
    iconName:  'Megaphone',
  },
  COMISSAO: {
    label:     'Comissão',
    color:     'rgba(220,38,38,0.12)',
    textColor: '#dc2626',
    dotColor:  '#dc2626',
    iconName:  'Users',
  },
  ESTOQUE: {
    label:     'Estoque',
    color:     'rgba(217,119,6,0.15)',
    textColor: '#d97706',
    dotColor:  '#d97706',
    iconName:  'Package',
  },
  OUTROS: {
    label:     'Outros',
    color:     'rgba(100,116,139,0.15)',
    textColor: '#64748b',
    dotColor:  '#94a3b8',
    iconName:  'MoreHorizontal',
  },
}

export const CATEGORY_OPTIONS: { value: ExpenseCategory; label: string }[] = [
  { value: 'OPERACIONAL', label: 'Operacional' },
  { value: 'MARKETING',   label: 'Marketing'   },
  { value: 'COMISSAO',    label: 'Comissão'    },
  { value: 'ESTOQUE',     label: 'Estoque'     },
  { value: 'OUTROS',      label: 'Outros'      },
]
