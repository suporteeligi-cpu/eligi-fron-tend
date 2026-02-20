import { api, request } from './api'

/* =========================================
   TYPES
========================================= */

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface MeResponse {
  id: string
  name: string
  email: string
  role: 'BUSINESS_OWNER' | 'AFFILIATE'
}

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
  return request<MeResponse>(
    api.get('/auth/me')
  )
}