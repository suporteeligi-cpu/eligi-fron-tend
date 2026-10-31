// src/app/dashboard/financeiro/components/FinanceBackLink.tsx
// @eligi:fin-back-link — volta das telas do Financeiro para o menu do Financeiro.
//
// Componente so de apresentacao: quem decide se ele aparece e a tela que o usa.
// O menu do Financeiro e so do dono (routeAccess); recepcao e gerente abrem
// Vendas/Comissoes direto pelo menu lateral e nao podem voltar para ele, senao
// caem na tela "Acesso negado". Por isso Vendas e Comissoes checam
// canAccessRoute(role, '/dashboard/financeiro') antes de renderizar.
//
// Alvo de toque de 44px (o "<- Financeiro" antigo era texto de 11px sem area).
// Texto com classe propria: o globals.css pinta `main span` de cinza.

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function FinanceBackLink() {
  return (
    <>
      <style>{CSS}</style>
      <Link href="/dashboard/financeiro" className="fin-back" aria-label="Voltar para o Financeiro">
        <ChevronLeft size={18} aria-hidden="true" />
        <span className="fin-back-l">Financeiro</span>
      </Link>
    </>
  )
}

const CSS = `
.fin-back{display:inline-flex;align-items:center;gap:2px;min-height:44px;padding:0 12px 0 4px;margin:0 0 2px -8px;border-radius:12px;color:#4b4b52;text-decoration:none;font-family:var(--font-sans);font-size:14.5px;font-weight:600;-webkit-tap-highlight-color:transparent}
.fin-back .fin-back-l{color:#4b4b52}
.fin-back:hover{background:#ececf0}
.fin-back:hover .fin-back-l,.fin-back:hover{color:#111114}
.fin-back:active{background:#e4e4e9}
`
