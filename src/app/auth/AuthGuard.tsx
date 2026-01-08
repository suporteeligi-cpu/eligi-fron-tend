'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      router.replace('/login');
      return;
    }

    // 🔐 Aqui futuramente entra:
    // - refresh token
    // - validação de sessão
    // - roles / permissions
    setAuthorized(true);
  }, [router]);

  // ⏳ Loading silencioso (evita flicker)
  if (authorized === null) {
    return null;
  }

  return <>{children}</>;
}
