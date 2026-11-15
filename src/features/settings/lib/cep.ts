// src/features/settings/lib/cep.ts
// @eligi:cep-lookup — busca de CEP (ViaCEP) com tempo limite.
//
// ViaCEP responde 200 com { erro: true } quando o CEP nao existe: isso vira
// `null` (nao achou), e falha de rede/tempo vira excecao (servico fora).
// O onboarding tem a mesma busca inline; aqui fica a versao reutilizavel.

export interface CepResult {
  cep: string // so digitos
  street: string
  district: string
  city: string
  state: string
}

const TIMEOUT_MS = 6000

export function cepDigits(v: string): string {
  return v.replace(/\D/g, '').slice(0, 8)
}

/** "07400000" -> "07400-000" (mascara enquanto digita). */
export function formatCep(v: string): string {
  const d = cepDigits(v)
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
}

export async function lookupCep(cep: string, signal?: AbortSignal): Promise<CepResult | null> {
  const d = cepDigits(cep)
  if (d.length !== 8) return null
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  const onAbort = () => ctrl.abort()
  signal?.addEventListener('abort', onAbort)
  try {
    const res = await fetch(`https://viacep.com.br/ws/${d}/json/`, { signal: ctrl.signal, headers: { Accept: 'application/json' } })
    if (!res.ok) throw new Error(`viacep_${res.status}`)
    const j = (await res.json()) as Record<string, unknown>
    if (j.erro) return null
    const s = (k: string) => (typeof j[k] === 'string' ? (j[k] as string) : '')
    return { cep: d, street: s('logradouro'), district: s('bairro'), city: s('localidade'), state: s('uf').toUpperCase() }
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onAbort)
  }
}
