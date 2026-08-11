// src/features/fiscal/components/SubstituirModal.tsx
'use client'

import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { X, RefreshCcw, TriangleAlert } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { ink, tone, label, body, brl } from '../ui'
import type { NfseEmission, MotivoSubstituicao } from '../types'
import { apiErrorMessage } from '../utils'

const overlay: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.42)',
  backdropFilter: 'blur(6px)',
  WebkitBackdropFilter: 'blur(6px)',
  zIndex: 9999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20,
}
const sheet: CSSProperties = {
  background: '#fff',
  borderRadius: 22,
  boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
  width: 460,
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
  letterSpacing: '-0.01em',
}

export default function SubstituirModal({
  emission,
  onClose,
  onDone,
}: {
  emission: NfseEmission
  onClose: () => void
  onDone: () => void
}) {
  const [motivos, setMotivos] = useState<MotivoSubstituicao[]>([])
  const [codigo, setCodigo] = useState('99')
  const [descricao, setDescricao] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    async function run() {
      try {
        const res = await api.get<MotivoSubstituicao[]>('/fiscal/motivos-substituicao')
        if (alive) setMotivos(res.data)
      } catch {
        /* sem lista: o select fica só com Outros */
      }
    }
    void run()
    return () => {
      alive = false
    }
  }, [])

  const submit = () => {
    if (busy) return
    if (codigo === '99' && !descricao.trim()) {
      setError('Descreva o motivo da substituição.')
      return
    }
    setBusy(true)
    setError(null)
    api
      .post(`/fiscal/emissions/${emission.id}/substituir`, {
        codigoMotivo: codigo,
        descricaoMotivo: descricao.trim() || null,
      })
      .then(() => onDone())
      .catch((err: unknown) => setError(apiErrorMessage(err)))
      .finally(() => setBusy(false))
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <div style={overlay} onClick={busy ? undefined : onClose}>
      <div style={sheet} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <RefreshCcw size={17} color={tone.red} strokeWidth={1.8} />
            <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.025em', color: ink.strong }}>
              Substituir nota
            </span>
          </div>
          <button
            onClick={onClose}
            disabled={busy}
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

        <div
          style={{
            marginTop: 18,
            padding: '13px 15px',
            background: 'rgba(0,0,0,0.025)',
            borderRadius: 12,
            fontSize: 13,
          }}
        >
          <div style={{ fontWeight: 600, color: ink.strong, letterSpacing: '-0.015em' }}>
            NFS-e nº {emission.nfseNumber ?? '—'} · {brl(emission.valorServicos)}
          </div>
          <div style={{ ...body, fontSize: 12.5, marginTop: 2 }}>
            {emission.tomadorNome ?? 'Consumidor não identificado'} · {emission.discriminacao}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 16 }}>
          <TriangleAlert size={14} color={tone.amber} strokeWidth={1.9} style={{ marginTop: 2, flexShrink: 0 }} />
          <span style={{ fontSize: 12.5, color: ink.mid, lineHeight: 1.5 }}>
            Uma nota nova será emitida com os dados <b style={{ color: ink.strong }}>atuais da venda</b>, e esta deixa de
            valer. Se algum dado estiver errado, corrija a venda antes de substituir.
          </span>
        </div>

        <div style={{ marginTop: 20 }}>
          <div style={label}>Justificativa</div>
          <select style={{ ...input, marginTop: 7 }} value={codigo} onChange={(e) => setCodigo(e.target.value)}>
            {motivos.length === 0 && <option value="99">Outros</option>}
            {motivos.map((m) => (
              <option key={m.codigo} value={m.codigo}>
                {m.codigo} — {m.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginTop: 14 }}>
          <div style={label}>Descrição {codigo === '99' ? '' : '(opcional)'}</div>
          <textarea
            style={{ ...input, marginTop: 7, minHeight: 74, resize: 'vertical', lineHeight: 1.5 }}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Ex: CPF do cliente informado depois da emissão"
            maxLength={255}
          />
        </div>

        {error && <div style={{ fontSize: 12.5, color: tone.red, marginTop: 12, lineHeight: 1.5 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <button
            onClick={onClose}
            disabled={busy}
            style={{
              flex: 1,
              background: '#fff',
              border: `0.5px solid ${ink.hair2}`,
              color: ink.strong,
              fontSize: 13,
              fontWeight: 500,
              padding: 12,
              borderRadius: 11,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={busy}
            style={{
              flex: 2,
              background: ink.strong,
              border: 'none',
              color: '#fff',
              fontSize: 13,
              fontWeight: 500,
              padding: 12,
              borderRadius: 11,
              cursor: busy ? 'wait' : 'pointer',
              fontFamily: 'inherit',
              opacity: busy ? 0.6 : 1,
            }}
          >
            {busy ? 'Enviando…' : 'Substituir nota'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
