'use client';

import { useReveal } from '@/hooks/useReveal';

import HeroSection from '../components/hero/HeroSection';
import Ecosystem from '../components/sections/Ecosystem';
import DashboardPreview from '../components/sections/DashboardPreview';
import Philosophy from '../components/sections/Philosophy';
import FinalCTA from '../components/sections/FinalCTA';

export default function HomePage() {
  useReveal();

  return (
    <>
      <HeroSection />

      <div className="reveal">
        <Ecosystem />
      </div>

      <div className="reveal reveal-delay-1">
        <DashboardPreview />
      </div>

      <div className="reveal reveal-delay-2">
        <Philosophy />
      </div>

      <div className="reveal reveal-delay-3">
        <FinalCTA />
      </div>
    </>
  );
}
