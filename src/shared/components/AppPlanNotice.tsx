'use client'
// src/shared/components/AppPlanNotice.tsx
// @eligi:app-plan-notice
// Aviso neutro no lugar de contratar/pagar o plano dentro do app (ver
// useEligiApp.ts). Sem preco, sem link de pagamento e sem mandar para o site.
// `support` mostra o botao do WhatsApp do suporte (so onde a pessoa ficaria
// sem saida, como o painel bloqueado).

import { Info, MessageCircle } from 'lucide-react'
import { glassCard, inkLight } from '@/shared/theme'
import { supportLink } from '@/features/account/accountDeletion'

const INK = '#111114'

export default function AppPlanNotice({
  title, text, support, supportText, bare,
}: {
  title: string
  text: string
  support?: boolean
  supportText?: string
  /** Sem cartao em volta (quando ja esta dentro de um modal). */
  bare?: boolean
}) {
  const body = (
    <>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', textAlign: 'left' }}>
        <span
          aria-hidden="true"
          style={{
            width: 36, height: 36, flexShrink: 0, borderRadius: 11,
            display: 'grid', placeItems: 'center',
            background: inkLight.neutral.bg, color: inkLight.neutral.text,
          }}
        >
          <Info size={18} strokeWidth={2.2} />
        </span>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: inkLight.strong, letterSpacing: '-.01em' }}>{title}</p>
          <p style={{ margin: '4px 0 0', fontSize: 13.5, lineHeight: 1.55, color: inkLight.label }}>{text}</p>
        </div>
      </div>
      {support && (
        <a
          href={supportLink(supportText ?? 'Olá! Preciso de ajuda com minha conta no Eligi.')}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            marginTop: 16, width: '100%', minHeight: 48, borderRadius: 14, background: INK, color: '#fff',
            fontSize: 15, fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, textDecoration: 'none', boxSizing: 'border-box',
          }}
        >
          <MessageCircle size={18} /> Falar com o suporte
        </a>
      )}
    </>
  )
  if (bare) return body
  return <div style={{ ...glassCard, padding: 18 }}>{body}</div>
}
