// src/app/termos-plano/page.tsx
import { PLAN_TERMS_SECTIONS, PLAN_TERMS_VERSION } from '@/lib/planTerms'

export const metadata = {
  title: 'Termos de Planos e Assinatura — Eligi',
}

export default function TermosPlanoPage() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px', lineHeight: 1.7 }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 8px', color: '#18181b' }}>
        Termos de Planos e Assinatura
      </h1>
      <p style={{ color: '#71717a', fontSize: 13, margin: '0 0 32px' }}>
        Versão {PLAN_TERMS_VERSION} · Eligi
      </p>
      {PLAN_TERMS_SECTIONS.map((s) => (
        <section key={s.n} style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 6px', color: '#18181b' }}>
            {s.n}. {s.title}
          </h2>
          <p style={{ color: '#3f3f46', fontSize: 15, margin: 0 }}>{s.body}</p>
        </section>
      ))}
    </main>
  )
}
