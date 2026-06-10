// src/features/expenses/components/CategoryBadge.tsx
'use client'

import {
  Wrench, Megaphone, Users, Package, MoreHorizontal,
} from 'lucide-react'
import type { ExpenseCategory } from '../types'
import { CATEGORY_META } from '../types'

const ICON_MAP = {
  Wrench, Megaphone, Users, Package, MoreHorizontal,
} as Record<string, React.ComponentType<{ size?: number; color?: string }>>

interface Props {
  category: ExpenseCategory
  size?: 'sm' | 'md'
}

export default function CategoryBadge({ category, size = 'md' }: Props) {
  const meta = CATEGORY_META[category]
  const Icon = ICON_MAP[meta.iconName] ?? MoreHorizontal

  const pad   = size === 'sm' ? '2px 8px'  : '3px 10px'
  const fs    = size === 'sm' ? 11          : 12
  const iconS = size === 'sm' ? 11          : 12

  return (
    <span style={{
      display:        'inline-flex',
      alignItems:     'center',
      gap:            5,
      padding:        pad,
      borderRadius:   20,
      background:     meta.color,
      color:          meta.textColor,
      fontSize:       fs,
      fontWeight:     600,
      whiteSpace:     'nowrap',
      letterSpacing:  '0.01em',
    }}>
      <Icon size={iconS} color={meta.textColor} />
      {meta.label}
    </span>
  )
}
