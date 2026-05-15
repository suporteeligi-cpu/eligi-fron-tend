import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'

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
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

/* =========================================
   REFRESH LOGIC
========================================= */

let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: unknown) => void
  reject: (reason?: unknown) => void
}> = []

function processQueue(error: unknown) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve()
    }
  })
  failedQueue = []
}

/* =========================================
   RESPONSE INTERCEPTOR
========================================= */

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Só tenta refresh em 401, e nunca nas próprias rotas de auth
    const isAuthRoute = originalRequest?.url?.includes('/auth/refresh') ||
                        originalRequest?.url?.includes('/auth/login') ||
                        originalRequest?.url?.includes('/auth/register')

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        // Enfileira requisições que chegaram enquanto o refresh está em andamento
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(() => api(originalRequest))
          .catch(err => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        await axios.post(
          `${baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        )

        processQueue(null)
        return api(originalRequest)

      } catch (refreshError) {
        processQueue(refreshError)

        // Refresh falhou — redireciona pro login
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }

        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api