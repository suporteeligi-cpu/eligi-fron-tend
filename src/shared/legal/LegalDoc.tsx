// src/shared/legal/LegalDoc.tsx
'use client'

import { TERMOS, TERMOS_PLANO, PRIVACIDADE } from './legalContent'
import type { LegalBlock, LegalKind } from './legalContent'

const DOCS = { 'termos': TERMOS, 'privacidade': PRIVACIDADE, 'termos-plano': TERMOS_PLANO }

function Block({ b }: { b: LegalBlock }) {
  if (b.kind === 'h') {
    return (
      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f0f14', margin: '22px 0 6px', letterSpacing: '-0.01em' }}>
        {b.text}
      </h3>
    )
  }
  if (b.kind === 'p') {
    return <p style={{ fontSize: 13.5, lineHeight: 1.65, color: 'rgba(0,0,0,0.7)', margin: '0 0 8px' }}>{b.text}</p>
  }
  if (b.kind === 'ul') {
    return (
      <ul style={{ margin: '0 0 8px', paddingLeft: 18 }}>
        {b.items.map((it, i) => (
          <li key={i} style={{ fontSize: 13.5, lineHeight: 1.6, color: 'rgba(0,0,0,0.7)', marginBottom: 4 }}>{it}</li>
        ))}
      </ul>
    )
  }
  if (b.kind === 'note') {
    return (
      <div style={{ fontSize: 12.5, lineHeight: 1.55, color: 'rgba(0,0,0,0.55)', background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 10, padding: '10px 12px', margin: '6px 0 8px' }}>
        {b.text}
      </div>
    )
  }
  return null
}

export default function LegalDoc({ kind }: { kind: LegalKind }) {
  const doc = DOCS[kind]
  return (
    <div style={{ fontFamily: '-apple-system,"SF Pro Display",system-ui,sans-serif' }}>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: '-0.025em', color: '#0f0f14' }}>{doc.title}</h2>
      <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)', margin: '4px 0 16px' }}>Atualizado em {doc.updated}</div>
      <p style={{ fontSize: 13.5, lineHeight: 1.65, color: 'rgba(0,0,0,0.7)', margin: '0 0 8px' }}>{doc.intro}</p>
      {doc.blocks.map((b, i) => <Block key={i} b={b} />)}
    </div>
  )
}
