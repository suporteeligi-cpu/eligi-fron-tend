import api from '@/lib/apiClient'
import { refreshSession } from '@/lib/refreshSession' // @eligi:authapi-import-refresh
import axios from 'axios'
import { AuthUser } from '@/types/auth.types'

/* =========================================
   TYPES
========================================= */

export interface ApiResponse<T> {
  success: boolean
  data: T
}

export type MeResponse = ApiResponse<AuthUser>

/* =========================================
   NORMALIZE ERROR
   O back manda { code, field, message } no corpo.
   Sem isto, o form recebe o AxiosError cru
   (code = 'ERR_BAD_REQUEST') -> cai no generico.
========================================= */

export interface AuthApiError {
  code: string
  field?: 'email' | 'password' | 'name'
  message?: string
}

function toAuthError(err: unknown): AuthApiError {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as Partial<AuthApiError> | undefined
    return {
      code:    data?.code ?? 'UNKNOWN',
      field:   data?.field,
      message: data?.message,
    }
  }
  return { code: 'UNKNOWN' }
}

/* =========================================
   LOGIN
========================================= */

export async function loginRequest(
  email: string,
  password: string
): Promise<void> {
  try {
    await api.post<void>('/auth/login', { email, password })
  } catch (err) {
    throw toAuthError(err)
  }
}

/* =========================================
   REGISTER
========================================= */

export async function registerRequest(
  name: string,
  email: string,
  password: string,
  role: 'BUSINESS_OWNER' | 'AFFILIATE'
): Promise<void> {
  try {
    await api.post<void>('/auth/register', {
      name,
      email,
      password,
      role
    })
  } catch (err) {
    throw toAuthError(err)
  }
}

/* =========================================
   GOOGLE LOGIN
========================================= */

export async function googleLoginRequest(
  idToken: string,
  mode: 'login' | 'register'
): Promise<void> {
  try {
    await api.post<void>('/auth/google', {
      idToken,
      mode
    })
  } catch (err) {
    throw toAuthError(err)
  }
}

/* =========================================
   GET ME
========================================= */

export async function getMe(): Promise<AuthUser> {
  const response = await api.get<MeResponse>('/auth/me')
  return response.data.data
}

/* =========================================
   LOGOUT
========================================= */

export async function logoutRequest(): Promise<void> {
  await api.post<void>('/auth/logout')
}

/* =========================================
   REFRESH  @eligi:auth-api-refresh
   Chamada direta pro /auth/refresh. Nao recursiona: o interceptor do
   apiClient tem /auth/refresh na lista isAuthRoute, entao um 401 aqui
   sobe cru em vez de disparar outro refresh.
   Resolve  = sessao viva no banco (a Session nao esta revogada).
   Rejeita  = sessao morta de verdade.

   SINGLE-FLIGHT obrigatorio: 16 arquivos montam o useAuth e cada um
   chama isto ao ver 401. Sem a promise compartilhada seriam 16 POSTs
   e 16 UPDATE na Session por expiracao de token, alem de 16 respostas
   Set-Cookie disputando a mesma gravacao no navegador.
========================================= */

export function refreshRequest(): Promise<void> {
  // @eligi:authapi-refresh-delega
  // O single-flight saiu daqui pro lib/refreshSession: precisa ser UM so
  // no app inteiro, senao o apiClient e o lib/api voltam a concorrer.
  return refreshSession()
}