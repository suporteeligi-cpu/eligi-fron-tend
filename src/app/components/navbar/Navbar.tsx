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
  Menu,
  X,
} from 'lucide-react'
import styles from './Navbar.module.css'

export default function Navbar() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof document === 'undefined') return 'light'
    return (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') ?? 'light'
  })

  const [scrolled,    setScrolled]    = useState(false)
  const [menuOpen,    setMenuOpen]    = useState(false)
  const [authLoading, setAuthLoading] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    const html = document.documentElement

    // Sync both systems: data-theme (landing) + class dark (dashboard tokens)
    html.setAttribute('data-theme', next)
    if (next === 'dark') {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
      localStorage.removeItem('eligi-theme')
    }
    setTheme(next)
  }

  function handleAuthClick() {
    setAuthLoading(true)
  }

  const globeSrc = theme === 'dark' ? '/images/globe-dark.png' : '/images/globe-light.png'

  return (
    <header className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.pill}>
        <span className={styles.sheen} aria-hidden />

        {/* Marca */}
        <Link href="/" className={styles.brand} aria-label="eligi — início">
          <Image
            src={globeSrc}
            alt="eligi"
            width={56}
            height={56}
            priority
            className={styles.globe}
          />
          <span className={styles.wordmark}>eligi</span>
        </Link>

        {/* Nav central */}
        <nav className={styles.nav}>
          <Link href="/barbearias"><Scissors size={17} />Barbearias</Link>
          <Link href="/saloes"><Store size={17} />Salões</Link>
          <Link href="/ads"><Megaphone size={17} />Anúncios</Link>
        </nav>

        {/* Ações */}
        <div className={styles.actions}>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Alternar tema"
            className={styles.themeToggle}
            disabled={authLoading}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <Link
            href="/login"
            className={`${styles.login} ${authLoading ? styles.loading : ''}`}
            onClick={handleAuthClick}
          >
            Entrar
          </Link>

          <Link
            href="/register"
            className={`${styles.cta} ${authLoading ? styles.loading : ''}`}
            onClick={handleAuthClick}
          >
            Criar conta
          </Link>

          <button
            type="button"
            className={styles.menuToggle}
            onClick={() => setMenuOpen(v => !v)}
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuOpen}
            disabled={authLoading}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Menu mobile — folha de vidro */}
      <div className={`${styles.sheet} ${menuOpen ? styles.sheetOpen : ''}`}>
        <Link href="/barbearias" onClick={() => setMenuOpen(false)}><Scissors size={18} />Barbearias</Link>
        <Link href="/saloes"     onClick={() => setMenuOpen(false)}><Store    size={18} />Salões</Link>
        <Link href="/ads"        onClick={() => setMenuOpen(false)}><Megaphone size={18} />Anúncios</Link>

        <div className={styles.sheetDivider} />

        <Link
          href="/login"
          className={authLoading ? styles.loading : ''}
          onClick={() => { setMenuOpen(false); handleAuthClick() }}
        >
          <LogIn size={18} />Entrar
        </Link>

        <Link
          href="/register"
          className={`${styles.sheetCta} ${authLoading ? styles.loading : ''}`}
          onClick={() => { setMenuOpen(false); handleAuthClick() }}
        >
          Criar conta
        </Link>
      </div>
    </header>
  )
}
