// src/app/components/navbar/Navbar.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import styles from './Navbar.module.css'

export default function Navbar() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme') as 'light' | 'dark'
    setTheme(current || 'light')

    const onScroll = () => {
      setScrolled(window.scrollY > 12)
    }

    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', next)
    setTheme(next)
  }

  return (
    <header className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.container}>
        <Link href="/" className={styles.brand}>
          <Image
            src={theme === 'dark' ? '/images/globo-dark.png' : '/images/globo-light.png'}
            alt="ELIGI"
            width={36}
            height={36}
            priority
          />
          <span className={styles.brandName}>ELIGI</span>
        </Link>

        <nav className={styles.nav}>
          <Link href="/barbearias">Barbearias</Link>
          <Link href="/saloes">Salões</Link>
          <Link href="/ads">Anúncios</Link>
        </nav>

        <div className={styles.actions}>
          <button
            onClick={toggleTheme}
            aria-label="Alternar tema"
            className={styles.themeToggle}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          <Link href="/login" className={styles.login}>Entrar</Link>
          <Link href="/register" className={styles.cta}>Criar conta</Link>
        </div>
      </div>
    </header>
  )
}
