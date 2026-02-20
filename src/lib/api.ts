'use client'

import axios from 'axios'

interface ApiSuccessResponse<T> {
  success: true
  data: T
}

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

/* ======================================================
   REQUEST INTERCEPTOR
====================================================== */

api.interceptors.request.use(config => {
  if (typeof window === 'undefined') return config

  const token = localStorage.getItem('accessToken')

  const isAuthRoute =
    config.url?.includes('/auth/login') ||
    config.url?.includes('/auth/register') ||
    config.url?.includes('/auth/google') ||
    config.url?.includes('/auth/forgot-password') ||
    config.url?.includes('/auth/reset-password') ||
    config.url?.includes('/auth/refresh')

  if (token && token !== 'undefined' && !isAuthRoute) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

/* ======================================================
   RESPONSE INTERCEPTOR (REFRESH AUTOMÁTICO)
====================================================== */

api.interceptors.response.use(
  response => response,

  async error => {
    const originalRequest = error.config as typeof error.config & {
      _retry?: boolean
    }

    const status = error?.response?.status

    // 🚫 Não tenta refresh se for rota auth
    const isAuthRoute =
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/register') ||
      originalRequest.url?.includes('/auth/google') ||
      originalRequest.url?.includes('/auth/refresh')

    if (status === 401 && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true

      const refreshToken =
        localStorage.getItem('refreshToken')

      if (!refreshToken) {
        localStorage.removeItem('accessToken')
        return Promise.reject(error.response?.data || error)
      }

      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          { refreshToken }
        )

        const newAccessToken =
          response.data.data.accessToken

        localStorage.setItem(
          'accessToken',
          newAccessToken
        )

        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`

        return api(originalRequest)
      } catch {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
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