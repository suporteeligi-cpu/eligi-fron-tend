'use client'

import axios, { AxiosError } from 'axios'

interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
  }
}

interface ApiSuccessResponse<T> {
  success: true
  data: T
}

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  validateStatus: status => status >= 200 && status < 300
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
    config.url?.includes('/auth/forgot-password') ||
    config.url?.includes('/auth/reset-password')

  if (token && token !== 'undefined' && !isAuthRoute) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

/* ======================================================
   RESPONSE INTERCEPTOR
====================================================== */

api.interceptors.response.use(
  response => {
    // 🔍 Se backend retornou success:false
    if (response.data?.success === false) {
      return Promise.reject(response.data)
    }

    return response
  },

  (error: AxiosError<ApiErrorResponse>) => {
    const status = error.response?.status

    if (status === 401) {
      localStorage.removeItem('accessToken')
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
