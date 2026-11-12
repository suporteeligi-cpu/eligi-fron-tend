'use client'
// src/app/dashboard/financeiro/comissoes/page.tsx
// @eligi:ocf-page — Comissoes: o profissional ve a propria tela (direcao D,
// MyCommissionsView); dono e gerente veem a fila de pagamentos (direcao
// "A + pessoa da C", OwnerCommissionsView). Nada de regra aqui.

import { useAuth } from '@/hooks/useAuth'
import MyCommissionsView from './components/MyCommissionsView'
import OwnerCommissionsView from './components/owner/OwnerCommissionsView'

const STAFF_ROLES = ['STAFF', 'BASIC_STAFF', 'RECEPTIONIST']

export default function ComissoesPage() {
  const { user } = useAuth()
  if (!user) return null
  return STAFF_ROLES.includes(user.role) ? <MyCommissionsView /> : <OwnerCommissionsView />
}
