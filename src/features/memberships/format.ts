// src/features/memberships/format.ts
// Reaproveita os helpers de pacotes; adiciona o que é específico de assinatura.

export {
  fmtBRL, fmtDate, fmtDateTime, VALIDITY_OPTIONS, describeValidity, formatCardNumber,
} from '@/features/packages/utils/format'

import { MembershipCardStatus } from './types'

export const M_STATUS_LABEL: Record<MembershipCardStatus, string> = {
  ACTIVE:   'Ativa',
  EXPIRED:  'Expirada',
  CANCELED: 'Cancelada',
}

export const M_STATUS_COLOR: Record<MembershipCardStatus, { fg: string; bg: string }> = {
  ACTIVE:   { fg: '#15803d', bg: 'rgba(22,163,74,0.10)' },
  EXPIRED:  { fg: '#b45309', bg: 'rgba(245,158,11,0.12)' },
  CANCELED: { fg: '#991b1b', bg: 'rgba(220,38,38,0.10)' },
}
