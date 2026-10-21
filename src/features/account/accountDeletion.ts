// src/features/account/accountDeletion.ts
// @eligi:account-deletion-api
// Exclusao de conta pedida pelo proprio usuario (Apple 5.1.1(v) e Google Play).
// Servidor: back-end, src/modules/account (rotas /auth/account/deletion).
import api from '@/shared/lib/apiClient'

export type DeletionKind = 'OWNER' | 'STAFF' | 'USER'

export interface DeletionStatus {
  kind: DeletionKind
  pending: { id: string; requestedAt: string; scheduledFor: string; canCancel: boolean } | null
  blockedReason: 'CLUB_ACCOUNT' | 'MULTIPLE_BUSINESSES' | null
}

export interface DeletionResult {
  kind: DeletionKind
  status: 'SCHEDULED' | 'COMPLETED'
  scheduledFor: string | null
}

/** Palavra que a pessoa digita. Espelha DELETION_CONFIRM_WORD do back. */
export const CONFIRM_WORD = 'EXCLUIR'

/** Dias ate apagar de vez. Espelha DELETION_GRACE_DAYS do back (so para o texto). */
export const GRACE_DAYS = 7

/** WhatsApp do suporte do Eligi (o mesmo do site). */
export const SUPPORT_WHATSAPP = 'https://wa.me/5511918579495'

export function supportLink(text: string): string {
  return `${SUPPORT_WHATSAPP}?text=${encodeURIComponent(text)}`
}

export function isConfirmWord(text: string): boolean {
  return text.trim().toUpperCase() === CONFIRM_WORD
}

/** "28/10/2026" em Sao Paulo. */
export function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

/** Dias inteiros que faltam (arredonda para cima; nunca negativo). */
export function daysLeft(iso: string, nowMs: number): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - nowMs) / 86_400_000))
}

/** Mensagem do servidor, ou a padrao. */
export function errorMessage(e: unknown, fallback: string): string {
  const data = (e as { response?: { data?: { message?: unknown; error?: unknown } } })?.response?.data
  const msg = typeof data?.message === 'string' ? data.message : typeof data?.error === 'string' ? data.error : null
  return msg ?? fallback
}

export async function fetchDeletionStatus(): Promise<DeletionStatus> {
  const res = await api.get<DeletionStatus>('/auth/account/deletion')
  return res.data
}

export async function requestAccountDeletion(): Promise<DeletionResult> {
  const res = await api.post<DeletionResult>('/auth/account/deletion', { confirm: CONFIRM_WORD })
  return res.data
}

export async function cancelAccountDeletion(): Promise<void> {
  await api.delete('/auth/account/deletion')
}

/** A sessao ja foi derrubada no servidor: volta ao login sem ricochete do middleware. */
export function goToLogin(): void {
  window.location.href = '/login?reauth=1'
}
