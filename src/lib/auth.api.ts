import { api } from './api'

export async function loginRequest(email: string, password: string) {
  const { data } = await api.post('/auth/login', {
    email,
    password
  })

  return data as {
    accessToken: string
    refreshToken: string
  }
}

export async function registerRequest(
  name: string,
  email: string,
  password: string,
  role: 'BUSINESS_OWNER' | 'AFFILIATE'
) {
  const { data } = await api.post('/auth/register', {
    name,
    email,
    password,
    role
  })

  return data as {
    accessToken: string
    refreshToken: string
  }
}

export async function getMe() {
  const { data } = await api.get('/auth/me')

  return data as {
    id: string
    name: string
    email: string
    role: 'BUSINESS_OWNER' | 'AFFILIATE'
  }
}
