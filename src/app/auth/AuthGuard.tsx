'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: Props) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      router.replace('/');
    }
  }, [router]);

  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('accessToken')
      : null;

  if (!token) {
    return null;
  }

  return <>{children}</>;
}
