// src/features/fiscal/components/RelatorioModal.tsx
'use client'

import { useState } from 'react'
import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { X, FileSpreadsheet, FileText, Download } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { ink, tone, label, body } from '../ui'
import { saveBlob } from '../download'
import { apiErrorMessage } from '../utils'

const overlay: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.42)',
  backdropFilter: 'blur(6px)',
  WebkitBackdropFilter: 'blur(6px)',
  zIndex: 9998,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20,
}
const sheet: CSSProperties = {
  background: '#fff',
  borderRadius: 22,
  boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
  width: 480,
  maxWidth: '100%',
  maxHeight: '90vh',
  overflowY: 'auto',
  padding: '26px 28px 24px',
}
const input: CSSProperties = {
  width: '100%',
  background: '#fff',
  border: `0.5px solid ${ink.hair2}`,
  borderRadius: 10,
  padding: '11px 13px',
  color: ink.strong,
  fontSize: 13.5,
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
}

type Tipo = 'notas' | 'faturamento'
type Formato = 'pdf' | 'csv'

const OPCOES: Array<{ tipo: Tipo; titulo: string; desc: string }> = [
  {
    tipo: 'faturamento',
    titulo: 'Faturamento',
    desc: 'Todas as vendas confirmadas — serviços, produtos e pacotes, com ou sem nota. É o que o contador usa na apuração.',
  },
  {
    tipo: 'notas',
    titulo: 'Notas fiscais',
    desc: 'Somente as NFS-e emitidas pelo Eligi, para conferência. Não representa a receita total.',
  },
]

/** Primeiro e último dia do mês corrente, em AAAA-MM-DD. */
function mesCorrente(): { de: string; ate: string } {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const p = (n: number) => String(n).padStart(2, '0')
  return {
    de: `${y}-${p(m + 1)}-01`,
    ate: `${y}-${p(m + 1)}-${p(new Date(y, m + 1, 0).getDate())}`,
  }
}

export default function RelatorioModal({ onClose }: { onClose: () => void }) {
  const inicial = mesCorrente()
  const [tipo, setTipo] = useState<Tipo>('faturamento')
  const [de, setDe] = useState(inicial.de)
  const [ate, setAte] = useState(inicial.ate)
  const [busy, setBusy] = useState<Formato | null>(null)
  const [error, setError] = useState<string | null>(null)

  const baixar = (formato: Formato) => {
    if (busy) return
    setBusy(formato)
    setError(null)
    api
      .get<Blob>('/fiscal/relatorio', {
        params: { tipo, formato, de, ate },
        responseType: 'blob',
      })
      .then((res) => {
        const ext = formato === 'csv' ? 'csv' : 'pdf'
        saveBlob(res.data, `${tipo}-${de}_a_${ate}.${ext}`)
        onClose()
      })
      .catch((err: unknown) => setError(apiErrorMessage(err)))
      .finally(() => setBusy(null))
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <div style={overlay} onClick={busy ? undefined : onClose}>
      <div style={sheet} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.025em', color: ink.strong }}>
            Exportar relatório
          </span>
          <button
            onClick={onClose}
            disabled={Boolean(busy)}
            style={{
              width: 30,
              height: 30,
              borderRadius: 9,
              border: 'none',
              background: 'rgba(0,0,0,0.04)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: ink.mid,
            }}
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>

        {/* tipo — a diferença entre os dois precisa estar na tela */}
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 9 }}>
          {OPCOES.map((o) => {
            const on = tipo === o.tipo
            return (
              <button
                key={o.tipo}
                onClick={() => setTipo(o.tipo)}
                style={{
                  textAlign: 'left',
                  border: `1px solid ${on ? ink.strong : ink.hair2}`,
                  background: on ? 'rgba(0,0,0,0.02)' : '#fff',
                  borderRadius: 13,
                  padding: '14px 16px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'border-color .16s, background .16s',
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.015em', color: ink.strong }}>
                  {o.titulo}
                </div>
                <div style={{ ...body, fontSize: 12, marginTop: 3 }}>{o.desc}</div>
              </button>
            )
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 18 }}>
          <div>
            <div style={label}>De</div>
            <input type="date" style={{ ...input, marginTop: 7 }} value={de} onChange={(e) => setDe(e.target.value)} />
          </div>
          <div>
            <div style={label}>Até</div>
            <input type="date" style={{ ...input, marginTop: 7 }} value={ate} onChange={(e) => setAte(e.target.value)} />
          </div>
        </div>

        {error && <div style={{ fontSize: 12.5, color: tone.red, marginTop: 14, lineHeight: 1.5 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <button
            onClick={() => baixar('pdf')}
            disabled={Boolean(busy)}
            style={{
              flex: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              background: ink.strong,
              border: 'none',
              color: '#fff',
              fontSize: 13,
              fontWeight: 500,
              padding: 12,
              borderRadius: 11,
              cursor: busy ? 'wait' : 'pointer',
              fontFamily: 'inherit',
              opacity: busy === 'pdf' ? 0.6 : 1,
            }}
          >
            <FileText size={14} strokeWidth={1.8} />
            {busy === 'pdf' ? 'Gerando…' : 'PDF'}
          </button>
          <button
            onClick={() => baixar('csv')}
            disabled={Boolean(busy)}
            style={{
              flex: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              background: '#fff',
              border: `0.5px solid ${ink.hair2}`,
              color: ink.strong,
              fontSize: 13,
              fontWeight: 500,
              padding: 12,
              borderRadius: 11,
              cursor: busy ? 'wait' : 'pointer',
              fontFamily: 'inherit',
              opacity: busy === 'csv' ? 0.6 : 1,
            }}
          >
            <FileSpreadsheet size={14} strokeWidth={1.8} />
            {busy === 'csv' ? 'Gerando…' : 'Planilha'}
          </button>
        </div>

        <div style={{ ...body, fontSize: 11.5, marginTop: 14, display: 'flex', gap: 7, alignItems: 'flex-start' }}>
          <Download size={12} strokeWidth={1.9} style={{ marginTop: 2, flexShrink: 0, color: ink.faint }} />
          <span style={{ color: ink.faint, lineHeight: 1.45 }}>
            A planilha abre no Excel e no Google Sheets. Cada arquivo indica no cabeçalho o que contém.
          </span>
        </div>
      </div>
    </div>,
    document.body,
  )
}
