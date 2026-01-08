'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import AuthSheet from '../auth/authsheet'
import styles from './login.module.css'

export default function LoginPage() {
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // simula checagem inicial (token / sessão / bootstrap)
    const timer = setTimeout(() => {
      setLoading(false)
      setOpen(true)
    }, 1600)

    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      <AuthSheet
        open={open}
        onClose={() => setOpen(false)}
      />

      {/* Splash só existe enquanto loading */}
      {loading && (
        <main className={styles.root}>
          <div className={styles.glass}>
            <div className={styles.logoWrapper}>
              <Image
                src="/images/globo-eligi.png"
                alt="ELIGI"
                width={96}
                height={70}
                priority
                className={styles.logoFlip}
              />
            </div>
          </div>
        </main>
      )}
    </>
  )
}
