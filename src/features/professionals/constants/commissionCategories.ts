// src/features/professionals/constants/commissionCategories.ts
// @eligi:no-internal-phases
//
// Categorias de comissao. Habilitadas: services, products.
//
// As travadas NAO expoem mais numero de fase interna ("Fase 3", "Fase 4",
// "Fase 5"). O lojista nao deve ler o roadmap de engenharia dentro do produto,
// e um numero sem contexto so gera a pergunta "e quando e a fase 3?".
// Onde havia phaseLabel, agora ha uma frase que descreve o beneficio.

export type CommissionCategoryId =
  | 'services'
  | 'products'
  | 'packages'
  | 'giftcards'
  | 'subscriptions'

export interface CommissionCategoryDef {
  id:          CommissionCategoryId
  label:       string
  icon:        string
  locked:      boolean
  /** Texto voltado ao lojista quando a categoria ainda nao existe. */
  lockedHint?: string
  description: string
}

export const COMMISSION_CATEGORIES: CommissionCategoryDef[] = [
  {
    id:          'services',
    label:       'Serviços',
    icon:        'Scissors',
    locked:      false,
    description: 'Comissão por serviço prestado',
  },
  {
    id:          'products',
    label:       'Produtos',
    icon:        'Package',
    locked:      false,
    description: 'Comissão por produto vendido',
  },
  {
    id:          'packages',
    label:       'Pacotes',
    icon:        'Gift',
    locked:      true,
    lockedHint:  'Em breve',
    description: 'Comissão por pacote vendido',
  },
  {
    id:          'giftcards',
    label:       'Cartões presente',
    icon:        'CreditCard',
    locked:      true,
    lockedHint:  'Em breve',
    description: 'Comissão por cartão presente vendido',
  },
  {
    id:          'subscriptions',
    label:       'Assinaturas',
    icon:        'Repeat',
    locked:      true,
    lockedHint:  'Em breve',
    description: 'Comissão por assinatura vendida',
  },
]

export function getCategoryById(id: CommissionCategoryId): CommissionCategoryDef {
  const found = COMMISSION_CATEGORIES.find(c => c.id === id)
  if (!found) throw new Error(`Category not found: ${id}`)
  return found
}
