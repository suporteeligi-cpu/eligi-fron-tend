'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import styles from './HeroSection.module.css'

type Theme = 'light' | 'dark'

const readThemeFromDOM = (): Theme => {
  if (typeof document === 'undefined') return 'light'
  return (
    (document.documentElement.getAttribute('data-theme') as Theme) ??
    'light'
  )
}

export default function HeroSection() {
  const [theme, setTheme] = useState<Theme>(readThemeFromDOM)

  useEffect(() => {
    if (typeof document === 'undefined') return

    const root = document.documentElement

    const observer = new MutationObserver(() => {
      const nextTheme = readThemeFromDOM()

      // evita render desnecessário
      setTheme(prev => (prev === nextTheme ? prev : nextTheme))
    })

    observer.observe(root, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

    return () => observer.disconnect()
  }, [])

  return (
    <section className={styles.hero}>
      <div className={styles.background} />

      <div className={styles.container}>
        <div className={styles.content}>
          <Image
            src={
              theme === 'dark'
                ? '/images/logo.branco.png'
                : '/images/logo.png'
            }
            alt="ELIGI"
            width={150}
            height={150}
            priority
          />

          <h1 className={styles.title}>
            Gestão inteligente para o
            <span className={styles.highlight}>
              {' '}
              seu negócio e sua equipe.
            </span>
          </h1>

          <p className={styles.subtitle}>
            Agendamentos, profissionais, pagamentos, crescimento e controle —
            tudo em uma plataforma simples, rápida e elegante.
          </p>

          <div className={styles.actions}>
            <Link href="/register" className={styles.primary}>
              Criar conta
            </Link>
            <Link href="/login" className={styles.secondary}>
              Entrar
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
