'use client'

import { useState } from 'react'
import AuthSheet from '../auth/authsheet'
import styles from './login.module.css'

export default function LoginPage() {
  const [open, setOpen] = useState(true)

  return (
    <>
      {/* AUTH SHEET */}
      <AuthSheet open={open} onClose={() => setOpen(false)} />

      {/* HERO / LANDING */}
      <main className={styles.root}>
        <section className={styles.hero}>
          <div className={styles.glassCard}>
            <h1 className={styles.logo}>ELIGI</h1>

            <p className={styles.subtitle}>
              Gestão inteligente para negócios modernos.
            </p>

            <button
              className={styles.cta}
              onClick={() => setOpen(true)}
            >
              Entrar ou criar conta
            </button>
          </div>
        </section>
      </main>
    </>
  )
}
