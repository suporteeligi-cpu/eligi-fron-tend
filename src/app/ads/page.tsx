import HeroSection from '@/app/components/hero/HeroSection';
import FinalCTA from '@/app/components/sections/FinalCTA';

export const metadata = {
  title: 'Sistema para barbearias e salões',
  description:
    'Sistema profissional com agenda online, pagamentos e métricas em tempo real.'
};

export default function AdsPage() {
  return (
    <>
      <HeroSection variant="ads" />
      <FinalCTA />
    </>
  );
}
