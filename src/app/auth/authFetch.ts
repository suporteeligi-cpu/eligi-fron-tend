const API_URL = process.env.NEXT_PUBLIC_API_URL!

let isRefreshing = false
let queue: (() => void)[] = []

function resolveQueue() {
  queue.forEach(cb => cb())
  queue = []
}

export async function authFetch(
  input: RequestInfo,
  init: RequestInit = {}
): Promise<Response> {
  const accessToken = localStorage.getItem('accessToken')

  const headers: HeadersInit = {
    ...(init.headers || {}),
    'Content-Type': 'application/json',
    ...(accessToken && {
      Authorization: `Bearer ${accessToken}`,
    }),
  }

  const response = await fetch(input, {
    ...init,
    headers,
  })

  if (response.status !== 401) {
    return response
  }

  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) {
    logout()
    throw new Error('Sessão expirada')
  }

  if (isRefreshing) {
    await new Promise<void>(resolve =>
      queue.push(resolve)
    )
  } else {
    isRefreshing = true

    try {
      const refreshRes = await fetch(
        `${API_URL}/auth/refresh`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        }
      )

      if (!refreshRes.ok) {
        throw new Error('Refresh inválido')
      }

      const tokens = await refreshRes.json()

      localStorage.setItem('accessToken', tokens.accessToken)
      localStorage.setItem('refreshToken', tokens.refreshToken)

      resolveQueue()
    } catch {
      logout()
      throw new Error('Sessão expirada')
    } finally {
      isRefreshing = false
    }
  }

  const newAccessToken =
    localStorage.getItem('accessToken')

  return fetch(input, {
    ...init,
    headers: {
      ...headers,
      Authorization: `Bearer ${newAccessToken}`,
    },
  })
}

function logout() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  window.location.href = '/'
}
