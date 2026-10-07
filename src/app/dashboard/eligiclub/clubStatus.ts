// src/app/dashboard/eligiclub/clubStatus.ts
// @eligi:club-lapsed-helper
//
// Status EFETIVO de uma assinatura do clube, para EXIBICAO.
//
// Assinatura MANUAL (sem asaasSubscriptionId) nao tem cobranca no Asaas, entao o
// webhook PAYMENT_OVERDUE nunca chega e o status no banco fica ACTIVE para sempre.
// Aqui ela passa a ser mostrada como vencida quando currentPeriodEnd ja passou.
//
// Decisao do Eli (out/2026): vencido e SO EXIBICAO. O banco nao e alterado e o
// acesso aos servicos do clube continua. Sinal de "manual" e o FATO
// (asaasSubscriptionId nulo), nunca a string de billingType (tem 5 valores).
// Recorrente fica de fora de proposito: o Asaas e quem decide o atraso dela, e
// no dia do vencimento a cobranca do cartao ainda pode estar em processamento.

export type ClubSubStatus = 'PENDING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED'

interface ClubSubLike {
  status: ClubSubStatus
  asaasSubscriptionId?: string | null
  currentPeriodEnd: string | null
}

export function isManualSub(sub: Pick<ClubSubLike, 'asaasSubscriptionId'>): boolean {
  return !sub.asaasSubscriptionId
}

export function isManualLapsed(sub: ClubSubLike, now: Date = new Date()): boolean {
  if (sub.status !== 'ACTIVE' || !isManualSub(sub) || !sub.currentPeriodEnd) return false
  const end = new Date(sub.currentPeriodEnd)
  if (Number.isNaN(end.getTime())) return false
  return end.getTime() < now.getTime()
}

export function effectiveSubStatus(sub: ClubSubLike, now: Date = new Date()): ClubSubStatus {
  return isManualLapsed(sub, now) ? 'PAST_DUE' : sub.status
}
