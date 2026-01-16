'use client';

import Link from 'next/link';

export default function Navbar() {
  return (
    <header className="glass-navbar">
      <div className="nav-container">
        <div className="nav-logo">ELIGI</div>

        <nav className="nav-links">
          <Link href="#produto">Produto</Link>
          <Link href="#solucoes">Soluções</Link>
          <Link href="#como-funciona">Como funciona</Link>
          <Link href="#precos">Preços</Link>
        </nav>

        <div className="nav-actions">
          <Link href="/login" className="nav-login">Entrar</Link>
          <Link href="/register" className="nav-cta">Começar agora</Link>
        </div>
      </div>
    </header>
  );
}
