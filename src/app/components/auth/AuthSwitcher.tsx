'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AuthSwitcher() {
  const pathname = usePathname();
  const isLogin = pathname === '/login';

  return (
    <div className="auth-switcher">
      <div
        className={`auth-switcher-indicator ${
          isLogin ? 'left' : 'right'
        }`}
      />

      <Link
        href="/login"
        className={`auth-switcher-btn ${isLogin ? 'active' : ''}`}
      >
        Entrar
      </Link>

      <Link
        href="/register"
        className={`auth-switcher-btn ${!isLogin ? 'active' : ''}`}
      >
        Criar conta
      </Link>
    </div>
  );
}
