"use client"
// src/shared/legal/LegalPageShell.tsx
//
// Casca PUBLICA dos documentos legais (/termos, /privacidade, /termos-plano).
// Sem auth: o visitante — e o analista regulatorio do Asaas — precisa ler sem login.
// Reusa o LegalDoc (mesma fonte do modal do dashboard): texto unico, nunca diverge.
//
// O selo do Asaas aparece aqui por exigencia do playbook BaaS: os documentos legais
// sao um dos pontos de contato onde o prestador do servico financeiro deve estar
// identificado.

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import LegalDoc from './LegalDoc'
import type { LegalKind } from './legalContent'
import AsaasSeal, { AsaasSupportNote } from '@/shared/components/AsaasSeal'

const OTHERS: { kind: LegalKind; label: string; href: string }[] = [
  { kind: 'termos', label: 'Termos de Uso', href: '/termos' },
  { kind: 'privacidade', label: 'Política de Privacidade', href: '/privacidade' },
  { kind: 'termos-plano', label: 'Termos de Planos e Assinatura', href: '/termos-plano' },
]

export default function LegalPageShell({ kind }: { kind: LegalKind }) {
  return (
    <main style={{
      minHeight: '100vh', background: '#f5f5f7',
      padding: '32px 16px 56px',
      fontFamily: '-apple-system,"SF Pro Display",system-ui,sans-serif',
    }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <Link
          href="/"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            color: 'rgba(0,0,0,0.5)', fontSize: 13, textDecoration: 'none',
            marginBottom: 16, padding: '6px 0', minHeight: 40,
          }}
        >
          <ChevronLeft size={16} /> Voltar ao site
        </Link>

        <article style={{
          background: '#fff', borderRadius: 18, padding: '28px 24px',
          boxShadow: '0 1px 6px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.06)',
        }}>
          <LegalDoc kind={kind} />

          <div style={{ height: 1, background: 'rgba(0,0,0,0.07)', margin: '28px 0 18px' }} />

          <AsaasSeal variant="positivo" />
          <AsaasSupportNote />
        </article>

        <nav style={{
          display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center',
          marginTop: 22, fontSize: 12.5,
        }}>
          {OTHERS.filter(o => o.kind !== kind).map(o => (
            <Link key={o.href} href={o.href} style={{ color: 'rgba(0,0,0,0.5)', textDecoration: 'underline' }}>
              {o.label}
            </Link>
          ))}
        </nav>

        <div style={{
          textAlign: 'center', fontSize: 11.5, color: 'rgba(0,0,0,0.35)',
          marginTop: 20, lineHeight: 1.6,
        }}>
          ELIGI SISTEMAS EMPRESARIAIS LTDA · CNPJ 64.539.922/0001-54
        </div>
      </div>
    </main>
  )
}
