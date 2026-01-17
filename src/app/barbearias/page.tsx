import HeroSection from '@/app/components/hero/HeroSection';
import Ecosystem from '@/app/components/sections/Ecosystem';
import DashboardPreview from '@/app/components/sections/DashboardPreview';
import FinalCTA from '@/app/components/sections/FinalCTA';

export const metadata = {
  title: 'Sistema para barbearias',
  description:
    'Sistema completo para barbearias com agenda, equipe, pagamentos e controle total do negócio.'
};

export default function BarbeariasPage() {
  return (
    <>
      <HeroSection variant="barbearia" />
      <Ecosystem />
      <DashboardPreview />
      <FinalCTA />
    </>
  );
}
