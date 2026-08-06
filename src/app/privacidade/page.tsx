import type { Metadata } from 'next'
import LegalPageShell from '@/shared/legal/LegalPageShell'

export const metadata: Metadata = {
  title: 'Política de Privacidade | Eligi',
  description: 'Como o Eligi trata dados pessoais (LGPD).',
}

export default function Page() {
  return <LegalPageShell kind="privacidade" />
}
