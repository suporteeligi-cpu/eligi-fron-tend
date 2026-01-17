'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [hidden, setHidden] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // ===== Scroll behavior =====
  useEffect(() => {
    let lastScroll = window.scrollY;

    const onScroll = () => {
      const current = window.scrollY;
      setHidden(current > lastScroll && current > 120);
      lastScroll = current;
    };

    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ===== Theme handling =====
  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initial = saved ?? 'dark';

    document.documentElement.setAttribute('data-theme', initial);
    setTheme(initial);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    setTheme(next);
  };

  return (
    <header className={`glass-navbar ${hidden ? 'navbar-hidden' : ''}`}>
      <div className="nav-container">
        {/* Logo */}
        <Link href="/" className="nav-logo">
          ELIGI
        </Link>

        {/* Desktop links */}
        <nav className="nav-links">
          <Link href="/barbearias">Barbearias</Link>
          <Link href="/saloes">Salões</Link>
          <Link href="/ads">Soluções</Link>
        </nav>

        {/* Actions */}
        <div className="nav-actions">
          <button
            onClick={toggleTheme}
            className="theme-toggle"
            aria-label="Alternar tema"
          >
            {theme === 'dark' ? '☀︎' : '☾'}
          </button>

          <Link href="/login" className="nav-link">
            Entrar
          </Link>

          <Link href="/register" className="btn btn-primary">
            Começar
          </Link>
        </div>
      </div>
    </header>
  );
}
