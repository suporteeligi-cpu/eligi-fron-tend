// src/app/barbearias/page.tsx
import Navbar from '@/app/components/navbar/Navbar'
import Footer from '@/app/components/footer/Footer'
import BarbeariasShowcase from '@/app/components/sections/BarbeariasShowcase'

export const metadata = {
  title: 'Eligi para barbearias — agenda, caixa e link de agendamento',
  description:
    'Agenda online, link de agendamento, caixa, comissões e relatórios para barbearias. Conheça a Gil Barber, barbearia parceira.',
}

export default function BarbeariasPage() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 76 }}>
        <BarbeariasShowcase />
      </main>
      <Footer />
    </>
  )
}
