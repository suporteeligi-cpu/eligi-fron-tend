// src/features/fiscal/utils.ts
// Extrai mensagem de erro dos dois contratos do back:
// fiscal → { error: string } · billing → { success, error: { message } }
export function apiErrorMessage(err: unknown): string {
  const e = err as { response?: { data?: { error?: string | { message?: string } } } }
  const raw = e.response?.data?.error
  if (typeof raw === 'string') return raw
  if (raw && typeof raw === 'object' && typeof raw.message === 'string') return raw.message
  return err instanceof Error ? err.message : 'Erro inesperado'
}

export function formatCnpj(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 14)
  if (d.length <= 2) return d
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}
