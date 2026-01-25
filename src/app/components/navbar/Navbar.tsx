// src/app/components/navbar/Navbar.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  Scissors,
  Store,
  Megaphone,
  Sun,
  Moon,
  LogIn,
  Menu
} from 'lucide-react'
import styles from './Navbar.module.css'

export default function Navbar() {
  // 1️⃣ Tema inicializado corretamente (uma única vez)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof document === 'undefined') return 'light'

    return (
      (document.documentElement.getAttribute('data-theme') as
        | 'light'
        | 'dark') ?? 'light'
    )
  })

  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  // 2️⃣ useEffect apenas para scroll
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8)
    }

    onScroll()
    window.addEventListener('scroll', onScroll)

    return () => {
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', next)
    setTheme(next)
  }

  return (
    <header
      className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}
    >
      <div className={styles.container}>
        {/* Logo */}
        <Link href="/" className={styles.brand}>
          <Image
            src={
              theme === 'dark'
                ? '/images/globo-dark.png'
                : '/images/globo-light.png'
            }
            alt="Logo ELIGI"
            width={52}
            height={34}
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className={styles.nav}>
          <Link href="/barbearias">
            <Scissors size={18} />
            Barbearias
          </Link>

          <Link href="/saloes">
            <Store size={18} />
            Salões
          </Link>

          <Link href="/ads">
            <Megaphone size={18} />
            Anúncios
          </Link>
        </nav>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Alternar tema"
            className={styles.themeToggle}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <Link href="/login" className={styles.login}>
            <LogIn size={18} />
            Entrar
          </Link>

          <Link href="/register" className={styles.cta}>
            Criar conta
          </Link>

          {/* Mobile toggle */}
          <button
            type="button"
            className={styles.menuToggle}
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Abrir menu"
          >
            <Menu size={22} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`${styles.mobileMenu} ${
          menuOpen ? styles.mobileOpen : ''
        }`}
      >
        <Link href="/barbearias" onClick={() => setMenuOpen(false)}>
          <Scissors size={18} />
          Barbearias
        </Link>

        <Link href="/saloes" onClick={() => setMenuOpen(false)}>
          <Store size={18} />
          Salões
        </Link>

        <Link href="/ads" onClick={() => setMenuOpen(false)}>
          <Megaphone size={18} />
          Anúncios
        </Link>

        <div className={styles.mobileDivider} />

        <Link href="/login" onClick={() => setMenuOpen(false)}>
          <LogIn size={18} />
          Entrar
        </Link>

        <Link
          href="/register"
          className={styles.mobileCTA}
          onClick={() => setMenuOpen(false)}
        >
          Criar conta
        </Link>
      </div>
    </header>
  )
}
