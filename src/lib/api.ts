'use client'

import axios from 'axios'

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json'
  },

  // 🔒 REGRA DE OURO:
  // Qualquer status >= 400 é ERRO de verdade
  validateStatus: status => status >= 200 && status < 300
})

/* ===============================
   REQUEST INTERCEPTOR
   - Injeta token APENAS quando válido
   - Nunca envia "Bearer undefined"
================================ */
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

/* ===============================
   RESPONSE INTERCEPTOR
   - Remove token inválido
   - Impede loop silencioso
================================ */
api.interceptors.response.use(
  response => response,

  error => {
    const status = error?.response?.status

    if (status === 401) {
      // 🔥 Sessão inválida → limpa imediatamente
      localStorage.removeItem('accessToken')
    }

    return Promise.reject(error)
  }
)
