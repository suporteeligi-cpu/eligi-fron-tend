// src/features/professionals/constants/commissionCategories.ts
//
// Categorias de comissão estilo Booksy.
// Habilitadas: services (Fase 1), products (Fase 2)
// Bloqueadas: packages, giftcards, subscriptions

export type CommissionCategoryId =
  | 'services'
  | 'products'
  | 'packages'
  | 'giftcards'
  | 'subscriptions'

export interface CommissionCategoryDef {
  id:        CommissionCategoryId
  label:     string
  icon:      string
  locked:    boolean
  phaseLabel?: string
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
    phaseLabel:  'Fase 3',
    description: 'Comissão por pacote vendido',
  },
  {
    id:          'giftcards',
    label:       'Cartões presente',
    icon:        'CreditCard',
    locked:      true,
    phaseLabel:  'Fase 4',
    description: 'Comissão por cartão presente vendido',
  },
  {
    id:          'subscriptions',
    label:       'Assinaturas',
    icon:        'Repeat',
    locked:      true,
    phaseLabel:  'Fase 5',
    description: 'Comissão por assinatura vendida',
  },
]

export function getCategoryById(id: CommissionCategoryId): CommissionCategoryDef {
  const found = COMMISSION_CATEGORIES.find(c => c.id === id)
  if (!found) throw new Error(`Category not found: ${id}`)
  return found
}
