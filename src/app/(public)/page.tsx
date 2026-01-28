'use client'

import Navbar from '../components/navbar/Navbar'
import Footer from '../components/footer/Footer'

import Hero from '../components/hero/HeroSection'
import AgendaSection from '../components/sections/AgendaSection'
import Statistics from '../components/sections/StatisticsSection'
import DashboardPreview from '../components/sections/DashboardPreview'
import ProfessionalsSection from '../components/sections/ProfessionalsSection'
import Philosophy from '../components/sections/Philosophy'
import Ecosystem from '../components/sections/Ecosystem'

import styles from './Home.module.css'

export default function HomePage() {
  return (
    <div className={styles.root}>
      <Navbar />

      <main className={styles.main}>
        <Hero />
        <AgendaSection />
        <Statistics />
        <ProfessionalsSection />
        <Philosophy />
        <DashboardPreview />
        <Ecosystem />
      </main>

      <Footer />
    </div>
  )
}
