import type { Metadata } from 'next'

import Navbar from '../components/navbar/Navbar'
import Footer from '../components/footer/Footer'
import HeroSection from '../components/hero/HeroSection'
import GuaranteeStrip from '../components/sections/home/GuaranteeStrip'
import WhyChange from '../components/sections/home/WhyChange'
import Pillars from '../components/sections/home/Pillars'
import OnlineLink from '../components/sections/home/OnlineLink'
import Reports from '../components/sections/home/Reports'
import Pricing from '../components/sections/home/Pricing'
import Faq from '../components/sections/home/Faq'
import Video from '../components/sections/home/Video'
import ClosingCta from '../components/sections/home/ClosingCta'
import styles from '../(public)/Home.module.css'

// rota de PREVIEW — fora do índice de busca
export const metadata: Metadata = { robots: { index: false, follow: false } }

export default function HomeNovaPreview() {
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
      </main>
      <Footer />
    </div>
  )
}
