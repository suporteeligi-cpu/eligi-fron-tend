// src/features/professionals/constants/commissionCategories.ts
//
// Categorias de comissão estilo Booksy.
// Hoje só "services" está habilitado. Conforme novas features forem entrando
// (produtos, pacotes, gift cards, assinaturas), basta mudar `locked: false`
// e implementar o editor correspondente.

export type CommissionCategoryId =
  | 'services'
  | 'products'
  | 'packages'
  | 'giftcards'
  | 'subscriptions'

export interface CommissionCategoryDef {
  id:        CommissionCategoryId
  label:     string
  icon:      string   // nome do ícone Lucide (carregado lazy onde precisar)
  locked:    boolean
  phaseLabel?: string  // "Fase 2", etc — só quando locked
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
    locked:      true,
    phaseLabel:  'Fase 2',
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
