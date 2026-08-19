/* =========================================
   @eligi:raiox-api
   Chamada do POST /public/signup-express.

   Usa o apiClient (withCredentials) porque a resposta traz os cookies de
   sessao: sem credenciais o navegador descarta o Set-Cookie e o auto-login
   nao acontece — o usuario cairia no /login depois de preencher 7 telas.

   O errorHandler do back devolve { code, field, message } sem envelope, entao
   normalizamos aqui pro form saber onde pintar o erro.
========================================= */
import api from '@/lib/apiClient'
import axios from 'axios'

export interface SignupExpressPayload {
  name: string
  email: string
  password: string
  phone: string
  businessName: string
  segment: string
  teamSize: number
  weeklyAppointments: number
  avgTicket: number
  weeklyNoShows: number
  currentTool: string
  termsAccepted: true
  utm?: {
    source?: string
    medium?: string
    campaign?: string
    content?: string
    term?: string
  }
  fbclid?: string
  referrer?: string
  landingVariant: 'A' | 'B'
  /** Honeypot: sempre string vazia num humano. */
  website?: string
}

export interface SignupExpressResponse {
  ok: boolean
  accessToken: string
  slug: string
  estimatedMonthlyLoss: number
  redirectPath: string
}

export interface SignupExpressError {
  code: string
  field?: 'name' | 'email' | 'password' | 'phone' | 'businessName'
  message?: string
}

function toSignupError(err: unknown): SignupExpressError {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as Partial<SignupExpressError> | undefined
    return {
      code: data?.code ?? 'UNKNOWN',
      field: data?.field,
      message: data?.message,
    }
  }
  return { code: 'UNKNOWN' }
}

export async function signupExpressRequest(
  payload: SignupExpressPayload,
): Promise<SignupExpressResponse> {
  try {
    const response = await api.post<{ success: boolean; data: SignupExpressResponse }>(
      '/public/signup-express',
      payload,
    )
    return response.data.data
  } catch (err) {
    throw toSignupError(err)
  }
}

/** Mensagem amigavel por codigo. Erro nunca pede desculpa: diz o que fazer. */
export function mapSignupError(error: SignupExpressError): string {
  switch (error.code) {
    case 'EMAIL_ALREADY_EXISTS':
      return 'Esse e-mail já tem Eligi.'
    case 'EMAIL_DOMAIN_UNVERIFIABLE':
      return 'Domínio não encontrado. Confere o e-mail?'
    case 'INVALID_EMAIL':
      return 'E-mail inválido.'
    case 'WEAK_PASSWORD':
      return error.message ?? 'Senha fora das regras.'
    case 'TOO_MANY_ATTEMPTS':
      return 'Muitas tentativas. Aguarde alguns minutos e tente de novo.'
    case 'INVALID_INPUT':
      return error.message ?? 'Confere os dados e tenta de novo.'
    default:
      return 'Não foi possível criar sua conta agora. Tente de novo em instantes.'
  }
}
