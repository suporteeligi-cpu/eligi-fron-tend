'use client'

import axios from 'axios'

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
        await api.post('/auth/refresh')
        return api(originalRequest)
      } catch {
        // Refresh falhou — redireciona para login
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
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