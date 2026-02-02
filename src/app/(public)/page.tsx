'use client'

import Navbar from '../components/navbar/Navbar'
import Footer from '../components/footer/Footer'

import Hero from '../components/hero/HeroSection'
import FloatingWhatsApp from '../components/ui/FloatingWhatsApp'

import AgendaSection from '../components/sections/AgendaSection'
import MetricsStrip from '../components/sections/MetricsStrip'
import Statistics from '../components/sections/StatisticsSection'
import DashboardPreview from '../components/sections/DashboardPreview'
import ProfessionalsSection from '../components/sections/ProfessionalsSection'
import Philosophy from '../components/sections/Philosophy'
import Ecosystem from '../components/sections/Ecosystem'
import PricingSection from '../components/sections/PricingSection'
import FAQSection from '../components/sections/FAQSection'
import FinalCTA from '../components/sections/FinalCTA'

import styles from './Home.module.css'

export default function HomePage() {
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
        <Philosophy />
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
