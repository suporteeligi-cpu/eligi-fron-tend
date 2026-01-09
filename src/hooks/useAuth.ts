'use client';

type AuthUser = {
  id: string;
};

type UseAuthResult = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
};

export function useAuth(): UseAuthResult {
  if (typeof window === 'undefined') {
    return {
      user: null,
      isAuthenticated: false,
      loading: true,
    };
  }

  const token = localStorage.getItem('accessToken');

  if (!token) {
    return {
      user: null,
      isAuthenticated: false,
      loading: false,
    };
  }

  // Auth baseada apenas na existência do token
  // (futuro: substituir por /me)
  return {
    user: { id: 'me' },
    isAuthenticated: true,
    loading: false,
  };
}
