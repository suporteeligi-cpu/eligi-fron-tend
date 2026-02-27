import { api, request } from './api'
import { AuthUser } from '@/types/auth.types'

/* =========================================
   TYPES
========================================= */

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
}

export type MeResponse = ApiResponse<AuthUser>

/* =========================================
   LOGIN
========================================= */

export async function loginRequest(
  email: string,
  password: string
): Promise<AuthTokens> {
  return request<AuthTokens>(
    api.post('/auth/login', { email, password })
  )
}

/* =========================================
   REGISTER
========================================= */

export async function registerRequest(
  name: string,
  email: string,
  password: string,
  role: 'BUSINESS_OWNER' | 'AFFILIATE'
): Promise<AuthTokens> {
  return request<AuthTokens>(
    api.post('/auth/register', {
      name,
      email,
      password,
      role
    })
  )
}

/* =========================================
   GOOGLE (UNIFICADO)
========================================= */

export async function googleLoginRequest(
  idToken: string,
  mode: 'login' | 'register'
): Promise<AuthTokens> {
  return request<AuthTokens>(
    api.post('/auth/google', {
      idToken,
      mode
    })
  )
}

/* =========================================
   ME
========================================= */

export async function getMe(): Promise<MeResponse> {
  const response = await api.get<MeResponse>('/auth/me')
  return response.data
}

/* =========================================
   LOGOUT
========================================= */

export async function logoutRequest(): Promise<void> {
  await api.post('/auth/logout')
}