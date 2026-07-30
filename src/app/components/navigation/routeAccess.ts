// src/app/components/navigation/routeAccess.ts
//
// FONTE ÚNICA DE VERDADE de autorização de rota por cargo.
// (navigation.config = o que o cargo VÊ no menu; aqui = onde o cargo PODE entrar.)
// Consumido por middleware.ts (server/edge) E dashboard/layout.tsx (client) — sem divergência.
//
// Só importa o *tipo* Role (apagado em runtime) → zero dependência de lucide-react
// no bundle do middleware/edge.

import type { Role } from './navigation.config'

const FULL_ACCESS = '*' as const

/** Prefixos que cada cargo pode acessar. '*' = acesso total (superadmin). */
export const ROUTE_ACCESS_BY_ROLE: Record<Role, readonly string[]> = {
  BUSINESS_OWNER: [FULL_ACCESS],
  MANAGER: [
    '/dashboard',
    '/dashboard/agenda',
    '/dashboard/clientes',
    '/dashboard/servicos',
    '/dashboard/pacotes',
    '/dashboard/equipe',
    '/dashboard/estoque',
    '/dashboard/caixa',
    '/dashboard/configuracoes/aparencia',
  ],
  RECEPTIONIST: [
    '/dashboard/agenda',
    '/dashboard/clientes',
    '/dashboard/servicos',
    '/dashboard/pacotes',
    '/dashboard/estoque',
    '/dashboard/caixa',
    '/dashboard/financeiro/vendas',
    '/dashboard/financeiro/comissoes',
    '/dashboard/configuracoes/aparencia',
    // NÃO inclui '/dashboard/financeiro' (índice) — barrado de propósito (decisão jul/2026).
  ],
  STAFF: [
    '/dashboard/agenda',
    '/dashboard/caixa',
    '/dashboard/financeiro/comissoes',
    '/dashboard/configuracoes/aparencia',
  ],
  BASIC_STAFF: [
    '/dashboard/agenda',
    '/dashboard/financeiro/comissoes',
    '/dashboard/caixa',
    '/dashboard/configuracoes/aparencia',
  ],
  PROFESSIONAL: [
    '/dashboard',
    '/dashboard/agenda',
  ],
  AFFILIATE: [
    '/dashboard',
  ],
}

/** Rotas transversais liberadas para QUALQUER cargo logado (evita loop de redirect). */
export const ALWAYS_ALLOWED: readonly string[] = [
  '/dashboard/acesso-negado',
]

/** Landing amigável e destino da tela de negação. */
export const FALLBACK_ROUTE = '/dashboard/agenda'
export const DENIED_ROUTE = '/dashboard/acesso-negado'

/** Match por SEGMENTO — nunca startsWith cru (evita /agenda casar /agendamentos). */
function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(prefix + '/')
}

/** True se o cargo pode acessar a rota. Cargo desconhecido = fail-closed. */
export function canAccessRoute(role: string | undefined, pathname: string): boolean {
  if (!role) return false
  const allowed = ROUTE_ACCESS_BY_ROLE[role as Role]
  if (!allowed) return false

  if (ALWAYS_ALLOWED.some((p) => matchesPrefix(pathname, p))) return true
  if (allowed.includes(FULL_ACCESS)) return true
  return allowed.some((p) => matchesPrefix(pathname, p))
}

/**
 * Resolve o redirect por falta de acesso, ou null se pode entrar.
 * - Cargo desconhecido/ausente → null (não redireciona: o backend é a fronteira real
 *   e o error boundary cobre qualquer 403 que escape; evita travar sessão com cookie vazio).
 * - '/dashboard' raiz proibido → agenda (é landing, não violação).
 * - Qualquer outra rota proibida → tela "Acesso negado" com a origem no query.
 */
export function resolveAccessRedirect(role: string | undefined, pathname: string): string | null {
  if (!role || !ROUTE_ACCESS_BY_ROLE[role as Role]) return null
  if (canAccessRoute(role, pathname)) return null
  if (pathname === '/dashboard') return FALLBACK_ROUTE
  return `${DENIED_ROUTE}?from=${encodeURIComponent(pathname)}`
}
