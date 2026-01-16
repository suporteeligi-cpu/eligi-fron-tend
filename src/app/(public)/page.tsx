import HeroSection from '../components/hero/HeroSection';
import Ecosystem from '../components/sections/Ecosystem';
import DashboardPreview from '../components/sections/DashboardPreview';
import Philosophy from '../components/sections/Philosophy';
import FinalCTA from '../components/sections/FinalCTA';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <Ecosystem />
      <DashboardPreview />
      <Philosophy />
      <FinalCTA />
    </>
  );
}
