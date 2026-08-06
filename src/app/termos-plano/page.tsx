import type { Metadata } from 'next'
import LegalPageShell from '@/shared/legal/LegalPageShell'

export const metadata: Metadata = {
  title: 'Termos de Planos e Assinatura | Eligi',
  description: 'Planos, cobrança, teste, cancelamento e reembolso do Eligi.',
}

export default function Page() {
  return <LegalPageShell kind="termos-plano" />
}
