'use client'

import axios from 'axios'
import { refreshSession } from '@/lib/refreshSession' // @eligi:libapi-import-refresh

interface ApiSuccessResponse<T> {
  success: true
  data: T
}

/* =========================================
   BASE URL — usa env var, fallback local
========================================= */
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333',
  withCredentials: true,
})

/* =========================================
   RESPONSE INTERCEPTOR
   Refresh automático via cookie quando 401
========================================= */
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config as typeof error.config & {
      _retry?: boolean
    }

    const status = error?.response?.status

    const isAuthRoute =
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/register') ||
      originalRequest.url?.includes('/auth/google') ||
      originalRequest.url?.includes('/auth/refresh')

    if (status === 401 && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true

      try {
        // @eligi:libapi-refresh-compartilhado
        // Este cliente nao tinha fila nenhuma: cada 401 abria um refresh
        // proprio, concorrendo com o do apiClient na mesma pagina.
        await refreshSession()
        return api(originalRequest)
      } catch {
        // @eligi:libapi-comentario-catch
        // Refresh falhou. Propaga o erro no formato que os 8 consumidores
        // deste cliente ja esperam; o redirect e responsabilidade do useAuth.
        // @eligi:libapi-sem-redirect
        // NAO redirecionar daqui. Quem decide que a sessao morreu e o
        // useAuth, que prova com /auth/refresh antes de mandar pro login.
        // Este catch cobre tambem onboarding e reset de senha, onde um
        // hard nav pro /login perde o que o lojista estava preenchendo.
        return Promise.reject(error.response?.data || error)
      }
    }

    return Promise.reject(error.response?.data || error)
  }
)

/* =========================================
   HELPER PADRÃO
========================================= */
export async function request<T>(
  promise: Promise<{ data: ApiSuccessResponse<T> }>
): Promise<T> {
  const response = await promise
  return response.data.data
}

export default api