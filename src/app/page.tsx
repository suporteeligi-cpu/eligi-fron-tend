'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

import Navbar from './components/navbar/Navbar'
import Footer from './components/footer/Footer'
import Hero from './components/hero/HeroSection'
import FloatingWhatsApp from './components/ui/FloatingWhatsApp'
import AgendaSection from './components/sections/AgendaSection'
import MetricsStrip from './components/sections/MetricsStrip'
import Statistics from './components/sections/StatisticsSection'
import DashboardPreview from './components/sections/DashboardPreview'
import ProfessionalsSection from './components/sections/ProfessionalsSection'
import Ecosystem from './components/sections/Ecosystem'
import PricingSection from './components/sections/PricingSection'
import FAQSection from './components/sections/FAQSection'
import FinalCTA from './components/sections/FinalCTA'
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
        <Hero />
        <AgendaSection />
        <MetricsStrip />
        <Statistics />
        <Ecosystem />
        <ProfessionalsSection />
        <DashboardPreview />
        <PricingSection />
        <FAQSection />
        <FinalCTA />
        <FloatingWhatsApp />
      </main>
      <Footer />
    </div>
  )
}
