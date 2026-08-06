import type { Metadata } from 'next'
import LegalPageShell from '@/shared/legal/LegalPageShell'

export const metadata: Metadata = {
  title: 'Termos de Uso | Eligi',
  description: 'Termos de Uso da plataforma Eligi.',
}

export default function Page() {
  return <LegalPageShell kind="termos" />
}
