'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import AuthSheet from '../auth/authsheet'
import styles from './login.module.css'

export default function LoginPage() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // simula carregamento inicial (ex: session check)
    const timer = setTimeout(() => {
      setOpen(true)
    }, 600)

    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      <AuthSheet open={open} onClose={() => setOpen(false)} />

      <main className={styles.root}>
        <div className={styles.glass}>
          <div className={styles.logoWrapper}>
            <Image
              src='/images/globo-eligi.png'
              alt='ELIGI'
              width={96}
              height={70}
              priority
              className={styles.logo}
            />
          </div>

          <div className={styles.spinner} />
        </div>
      </main>
    </>
  )
}
