'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // ===== Scroll behavior =====
  useEffect(() => {
    let lastScroll = window.scrollY;

    const onScroll = () => {
      const current = window.scrollY;

      setHidden(current > lastScroll && current > 120);
      setScrolled(current > 20);

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

  const logoSrc =
    theme === 'dark'
      ? '/images/globo-dark.png'
      : '/images/globo-light.png';

  return (
    <header
      className={`
        glass-navbar
        ${hidden ? 'navbar-hidden' : ''}
        ${scrolled ? 'navbar-scrolled' : ''}
      `}
    >
      <div className="nav-container">
        {/* Logo */}
        <Link href="/" className="nav-logo">
          <Image
            src={logoSrc}
            alt="ELIGI"
            width={60}
            height={40}
            priority
            className="logo-pulse"
          />
        </Link>

        {/* Desktop links */}
        <nav className="nav-links">
          <Link href="/barbearias">Barbearias</Link>
          <Link href="/saloes">Salões</Link>
          <Link href="/ads">Soluções</Link>
        </nav>

        {/* Actions */}
        <div className="nav-actions">
          <div className="auth-actions">
            <Link href="/login" className="nav-link subtle">
              Entrar
            </Link>

            <Link href="/register" className="btn btn-primary glass">
              Começar
            </Link>
          </div>

          <button
            onClick={toggleTheme}
            className="theme-toggle prominent"
            aria-label="Alternar tema"
          >
            <span className="theme-icon">
              {theme === 'dark' ? '☀︎' : '☾'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
