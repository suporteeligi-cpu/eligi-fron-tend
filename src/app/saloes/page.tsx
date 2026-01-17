import HeroSection from '@/app/components/hero/HeroSection';
import Ecosystem from '@/app/components/sections/Ecosystem';
import DashboardPreview from '@/app/components/sections/DashboardPreview';
import FinalCTA from '@/app/components/sections/FinalCTA';

export const metadata = {
  title: 'Sistema para salões de beleza',
  description:
    'Agenda inteligente, equipe organizada e gestão completa para salões e clínicas de estética.'
};

export default function SaloesPage() {
  return (
    <>
      <HeroSection variant="salao" />
      <Ecosystem />
      <DashboardPreview />
      <FinalCTA />
    </>
  );
}
