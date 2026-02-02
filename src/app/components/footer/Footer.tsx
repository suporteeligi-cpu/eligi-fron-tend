// src/app/components/footer/Footer.tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.brand}>
          <Image
            src="/images/globo-light.png"
            alt="ELIGI"
            width={36}
            height={28}
          />
          <span className={styles.brandName}>ELIGI</span>
          <p className={styles.tagline}>
            Plataforma inteligente para barbearias e salões.
          </p>
        </div>

        <nav className={styles.links}>
          <div className={styles.col}>
            <span className={styles.colTitle}>Produto</span>
            <Link href="/">Visão geral</Link>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/ads">Anúncios</Link>
          </div>

          <div className={styles.col}>
            <span className={styles.colTitle}>Negócios</span>
            <Link href="/barbearias">Barbearias</Link>
            <Link href="/saloes">Salões</Link>
          </div>

          <div className={styles.col}>
            <span className={styles.colTitle}>Conta</span>
            <Link href="/login">Entrar</Link>
            <Link href="/register">Criar conta</Link>
          </div>
        </nav>
      </div>

      <div className={styles.bottom}>
        <span>© {new Date().getFullYear()} ELIGI. Todos os direitos reservados.</span>
      </div>
    </footer>
  )
}
