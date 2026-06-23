// src/app/saloes/page.tsx
import Navbar from '@/app/components/navbar/Navbar'
import Footer from '@/app/components/footer/Footer'
import SaloesShowcase from '@/app/components/sections/SaloesShowcase'

export const metadata = {
  title: 'Eligi para salões — agenda, pacotes, assinaturas e caixa',
  description:
    'Agenda online, link de agendamento, pacotes, assinaturas de cliente, caixa, comissões e relatórios para salões de beleza, estética e manicure.',
}

export default function SaloesPage() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 76 }}>
        <SaloesShowcase />
      </main>
      <Footer />
    </>
  )
}
