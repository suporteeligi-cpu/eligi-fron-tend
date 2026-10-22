// src/features/expenses/types.ts
// @eligi:expcat-front-types — categorias proprias do dono (out/2026).

export type ExpenseCategory = 'OPERACIONAL' | 'MARKETING' | 'COMISSAO' | 'ESTOQUE' | 'TAXA_CARTAO' | 'OUTROS'
export type ExpenseOrigin   = 'MANUAL' | 'RECURRING' | 'RECURRING_SKIPPED' | 'AUTO_COMISSAO' | 'AUTO_ESTOQUE' | 'AUTO_CLUBE' | 'AUTO_TAXA_CARTAO'

/** Categoria criada pelo dono, como vem dentro da despesa. */
export interface ExpenseCustomCategoryRef {
  id:         string
  name:       string
  color:      string
  icon:       string
  archivedAt: string | null
}

export interface Expense {
  id:               string
  businessId:       string
  date:             string        // ISO string
  amount:           number
  description:      string
  category:         ExpenseCategory
  customCategoryId: string | null
  customCategory:   ExpenseCustomCategoryRef | null
  origin:           ExpenseOrigin
  professionalId:   string | null
  productId:        string | null
  saleId:           string | null
  isRecurring:      boolean
  recurrenceId:     string | null
  competence:       string | null
  recurringDay:     number | null
  createdAt:        string
  updatedAt:        string
}

export interface ExpenseKPIs {
  total:      number
  fixed:      number
  variable:   number
  byCategory: Record<string, number>
  /** 'custom:<id>' para categoria propria, o enum para as do Eligi. */
  byKey:      Record<string, number>
}

export interface ExpensesResponse {
  expenses: Expense[]
  kpis:     ExpenseKPIs
}

export interface CreateExpensePayload {
  date:             string      // ISO
  amount:           number
  description:      string
  category:         ExpenseCategory
  customCategoryId: string | null
  isRecurring:      boolean
  recurringDay:     number | null
}

export type UpdateExpensePayload = Partial<CreateExpensePayload>

// @eligi:exprec-front-types — editar despesa fixa (PATCH /expenses/:id/recurring)
export type RecurringScope = 'THIS' | 'FORWARD'

export interface EditRecurringPayload {
  scope:             RecurringScope
  amount?:           number
  description?:      string
  category?:         ExpenseCategory
  customCategoryId?: string | null
  recurringDay?:     number
}

/** Categoria propria como vem de GET /expenses/categories. */
export interface CustomCategory {
  id:        string
  name:      string
  color:     string
  icon:      string
  archived:  boolean
  usage:     { expenses: number; recurrences: number }
  canDelete: boolean
}

export interface CustomCategoryInput {
  name:  string
  color: string
  icon:  string
}
