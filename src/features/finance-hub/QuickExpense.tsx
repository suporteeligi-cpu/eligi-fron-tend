'use client'
// src/features/finance-hub/QuickExpense.tsx
// @eligi:fin-hub-quick — "Nova despesa" direto do painel do Financeiro.
// Reusa o ExpenseModal da tela de Despesas (mesmo formulario, mesmas regras).
// So monta quando o dono toca no botao: as categorias proprias so sao buscadas
// nessa hora, nao a cada abertura do painel.

import ExpenseModal from '@/features/expenses/components/ExpenseModal'
import { useExpenseCategories } from '@/features/expenses/hooks/useExpenseCategories'
import type { CreateExpensePayload, CustomCategoryInput } from '@/features/expenses/types'

interface Props {
  onSave:  (payload: CreateExpensePayload) => Promise<void>
  onClose: () => void
}

export default function QuickExpense({ onSave, onClose }: Props) {
  const cats = useExpenseCategories()

  async function handleCreateCategory(input: CustomCategoryInput) {
    return cats.create(input)
  }

  return (
    <ExpenseModal
      expense={null}
      categories={cats.items}
      onCreateCategory={handleCreateCategory}
      onSave={onSave}
      // despesa nova nunca entra no fluxo de editar recorrencia (so existe para edicao)
      onSaveRecurring={async () => {}}
      onClose={onClose}
    />
  )
}
