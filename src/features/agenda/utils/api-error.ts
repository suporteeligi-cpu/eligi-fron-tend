// src/features/agenda/utils/api-error.ts
// Extrai status e código de erro de respostas axios sem usar `as any`.

interface ApiErrorShape {
  response?: {
    status?: number
    data?:   { code?: string; error?: string; message?: string }
  }
  message?: string
}

export function getApiError(err: unknown): { status?: number; code?: string; message?: string } {
  if (typeof err !== 'object' || err === null) return {}
  const e = err as ApiErrorShape
  return {
    status:  e.response?.status,
    code:    e.response?.data?.code,
    message: e.response?.data?.error ?? e.response?.data?.message ?? e.message,
  }
}

/** True quando a API retorna conflito de horário (409 ou code BOOKING_CONFLICT) */
export function isBookingConflict(err: unknown): boolean {
  const { status, code } = getApiError(err)
  return status === 409 || code === 'BOOKING_CONFLICT'
}
