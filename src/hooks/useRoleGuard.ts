'use client'
// src/hooks/useRoleGuard.ts
// Hook que verifica se o user tem o role mínimo necessário

import { useAuth } from '@/hooks/useAuth'
import { Role } from '@/types/auth.types'

// Hierarquia de roles (maior índice = mais permissões)
const ROLE_HIERARCHY: Role[] = [
  'BASIC_STAFF',
  'STAFF',
  'RECEPTIONIST',
  'MANAGER',
  'BUSINESS_OWNER',
]

export function useRoleGuard(requiredRoles: Role[]): {
  allowed:  boolean
  loading:  boolean
  userRole: Role | undefined
} {
  const { user, loading } = useAuth()

  if (loading) return { allowed: false, loading: true, userRole: undefined }
  if (!user)   return { allowed: false, loading: false, userRole: undefined }

  const allowed = requiredRoles.includes(user.role as Role)
  return { allowed, loading: false, userRole: user.role as Role }
}

// Roles que têm acesso ao dashboard principal
export const STAFF_ROLES: Role[] = ['MANAGER', 'RECEPTIONIST', 'STAFF', 'BASIC_STAFF']
export const OWNER_ROLES:  Role[] = ['BUSINESS_OWNER']
export const ALL_ROLES:    Role[] = [...OWNER_ROLES, ...STAFF_ROLES]
