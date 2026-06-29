'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

import Navbar from './components/navbar/Navbar'
import Footer from './components/footer/Footer'
import FloatingWhatsApp from './components/ui/FloatingWhatsApp'

import HeroSection from './components/hero/HeroSection'
import GuaranteeStrip from './components/sections/home/GuaranteeStrip'
import WhyChange from './components/sections/home/WhyChange'
import Pillars from './components/sections/home/Pillars'
import OnlineLink from './components/sections/home/OnlineLink'
import Reports from './components/sections/home/Reports'
import Pricing from './components/sections/home/Pricing'
import Faq from './components/sections/home/Faq'
import Video from './components/sections/home/Video'
import ClosingCta from './components/sections/home/ClosingCta'

import styles from './(public)/Home.module.css'

export default function RootPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard')
    }
  }, [user, loading, router])

  // Enquanto verifica auth, não renderiza nada (evita flash da landing)
  if (loading) return null
  // Já logado — não exibe a landing enquanto o replace acontece
  if (user) return null

  return (
    <div className={styles.root}>
      <Navbar />
      <main className={styles.main}>
        <HeroSection />
        <GuaranteeStrip />
        <WhyChange />
        <Pillars />
        <OnlineLink />
        <Reports />
        <Pricing />
        <Faq />
        <Video />
        <ClosingCta />
        <FloatingWhatsApp />
      </main>
      <Footer />
    </div>
  )
}
