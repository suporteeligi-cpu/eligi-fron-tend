import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios'

/* =========================================
   BASE URL
========================================= */

const baseURL: string =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://api.eligi.com.br'

/* =========================================
   API INSTANCE
========================================= */

export const api: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true, // 🔥 ESSENCIAL (COOKIE)
  headers: {
    'Content-Type': 'application/json'
  }
})

/* =========================================
   RESPONSE INTERCEPTOR
========================================= */

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      console.warn('⚠️ Usuário não autenticado (401)')
    }

    return Promise.reject(error)
  }
)

export default api