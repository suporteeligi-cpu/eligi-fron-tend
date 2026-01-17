'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [hidden, setHidden] = useState(false);
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    function onScroll() {
      const currentScrollY = window.scrollY;

      // esconder ao rolar para baixo
      if (currentScrollY > lastScrollY && currentScrollY > 120) {
        setHidden(true);
      } else {
        setHidden(false);
      }

      // solidificar após sair do hero
      setSolid(currentScrollY > 80);

      lastScrollY = currentScrollY;
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={[
        'glass-navbar',
        hidden ? 'navbar-hidden' : '',
        solid ? 'navbar-solid' : ''
      ].join(' ')}
    >
      <div className="nav-container">
        <div className="nav-logo">ELIGI</div>

        <nav className="nav-links">
          <Link href="#produto">Produto</Link>
          <Link href="#solucoes">Soluções</Link>
          <Link href="#como-funciona">Como funciona</Link>
          <Link href="#precos">Preços</Link>
        </nav>

        <div className="nav-actions">
          <Link href="/login">Entrar</Link>
          <Link href="/register" className="btn btn-primary">
            Começar agora
          </Link>
        </div>
      </div>
    </header>
  );
}
