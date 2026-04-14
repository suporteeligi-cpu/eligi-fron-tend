'use client'

import axios from 'axios'

interface ApiSuccessResponse<T> {
  success: true
  data: T
}

export const api = axios.create({
  baseURL: 'http://back-end-eligi-production.up.railway.app',
  withCredentials: true,
})


/* ======================================================
   RESPONSE INTERCEPTOR (refresh automático via cookie)
====================================================== */

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
        // 🔥 Agora não enviamos token nenhum
        await api.post('/auth/refresh')

        return api(originalRequest)
      } catch {
        return Promise.reject(error.response?.data || error)
      }
    }

    return Promise.reject(error.response?.data || error)
  }
)

/* ======================================================
   HELPER PADRÃO
====================================================== */

export async function request<T>(
  promise: Promise<{ data: ApiSuccessResponse<T> }>
): Promise<T> {
  const response = await promise
  return response.data.data
}