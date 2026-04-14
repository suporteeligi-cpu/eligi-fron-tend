import axios from 'axios'

const baseURL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://api.eligi.com.br' // 🔥 força produção correta

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Usuário não autenticado (401)')
    }

    return Promise.reject(error)
  }
)

export default api