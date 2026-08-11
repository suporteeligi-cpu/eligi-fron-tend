// src/features/fiscal/components/ReceiptPreviewModal.tsx
'use client'

import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { X, Download, Share2, ExternalLink, FileText } from 'lucide-react'
import { ink, tone, body, brl } from '../ui'
import { fetchPdf, saveBlob, canShareFiles, shareBlob } from '../download'
import type { NfseEmission } from '../types'
import { apiErrorMessage } from '../utils'

const overlay: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.45)',
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
  boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
  width: 720,
  maxWidth: '100%',
  height: 'min(88vh, 940px)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}
const btn: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  background: '#fff',
  border: `0.5px solid ${ink.hair2}`,
  color: ink.strong,
  fontSize: 12.5,
  fontWeight: 500,
  padding: '9px 15px',
  borderRadius: 10,
  cursor: 'pointer',
  fontFamily: 'inherit',
  letterSpacing: '-0.01em',
}
const btnDark: CSSProperties = { ...btn, background: ink.strong, color: '#fff', border: 'none' }

export default function ReceiptPreviewModal({
  emission,
  onClose,
}: {
  emission: NfseEmission
  onClose: () => void
}) {
  const [blob, setBlob] = useState<Blob | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sharing, setSharing] = useState(false)

  const filename = `Comprovante-NFSe-${emission.nfseNumber ?? emission.id}.pdf`

  useEffect(() => {
    let alive = true
    let created: string | null = null

    async function run() {
      try {
        const b = await fetchPdf(`/fiscal/emissions/${emission.id}/receipt.pdf`)
        if (!alive) return
        created = URL.createObjectURL(b)
        setBlob(b)
        setUrl(created)
      } catch (err: unknown) {
        if (alive) setError(apiErrorMessage(err))
      }
    }

    void run()
    return () => {
      alive = false
      // ⚠️ revogar no unmount: blob de PDF fica na memória até a aba fechar
      if (created) URL.revokeObjectURL(created)
    }
  }, [emission.id])

  const share = () => {
    if (!blob || sharing) return
    setSharing(true)
    shareBlob(blob, filename, `NFS-e nº ${emission.nfseNumber ?? ''}`)
      .catch(() => {
        /* usuário cancelou o menu nativo — não é erro */
      })
      .finally(() => setSharing(false))
  }

  if (typeof document === 'undefined') return null

  const podeCompartilhar = blob != null && canShareFiles(blob, filename)

  return createPortal(
    <div style={overlay} onClick={onClose}>
      <div style={sheet} onClick={(e) => e.stopPropagation()}>
        {/* header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '18px 22px',
            borderBottom: `0.5px solid ${ink.hair}`,
            gap: 14,
            flexShrink: 0,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.025em', color: ink.strong }}>
              NFS-e nº {emission.nfseNumber ?? '—'}
            </div>
            <div
              style={{
                ...body,
                fontSize: 12.5,
                marginTop: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {emission.tomadorNome ?? 'Consumidor não identificado'} · {brl(emission.valorServicos)}
            </div>
          </div>
          <button
            onClick={onClose}
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
              flexShrink: 0,
            }}
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>

        {/* preview */}
        <div style={{ flex: 1, background: 'rgba(0,0,0,0.04)', minHeight: 0, position: 'relative' }}>
          {error && (
            <div style={{ padding: 40, textAlign: 'center', fontSize: 13, color: tone.red }}>{error}</div>
          )}
          {!error && !url && (
            <div style={{ padding: 40, textAlign: 'center', ...body, fontSize: 13 }}>Gerando comprovante…</div>
          )}
          {url && (
            <>
              <iframe
                src={`${url}#toolbar=0&navpanes=0`}
                title="Comprovante"
                style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
              />
              {/* ⚠️ Safari iOS não renderiza PDF em iframe — a saída fica sempre visível */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: 11.5,
                  color: ink.faint,
                  background: 'rgba(255,255,255,0.94)',
                  padding: '6px 12px',
                  borderRadius: 99,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <FileText size={12} strokeWidth={1.8} />
                Não apareceu?
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: tone.red, fontWeight: 500, textDecoration: 'none' }}
                >
                  abrir em nova aba
                </a>
              </div>
            </>
          )}
        </div>

        {/* ações */}
        <div
          style={{
            display: 'flex',
            gap: 9,
            padding: '16px 22px',
            borderTop: `0.5px solid ${ink.hair}`,
            flexShrink: 0,
            flexWrap: 'wrap',
          }}
        >
          {podeCompartilhar && (
            <button style={btnDark} onClick={share} disabled={sharing}>
              <Share2 size={14} strokeWidth={1.8} />
              {sharing ? 'Abrindo…' : 'Compartilhar'}
            </button>
          )}
          <button style={podeCompartilhar ? btn : btnDark} onClick={() => blob && saveBlob(blob, filename)} disabled={!blob}>
            <Download size={14} strokeWidth={1.8} />
            Baixar PDF
          </button>
          {url && (
            <a href={url} target="_blank" rel="noopener noreferrer" style={{ ...btn, textDecoration: 'none' }}>
              <ExternalLink size={14} strokeWidth={1.8} />
              Abrir
            </a>
          )}
          <span style={{ ...body, fontSize: 11.5, marginLeft: 'auto', alignSelf: 'center' }}>
            Não substitui o XML da nota
          </span>
        </div>
      </div>
    </div>,
    document.body,
  )
}
