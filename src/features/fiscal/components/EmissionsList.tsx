// src/features/fiscal/components/EmissionsList.tsx
'use client'

import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { FileText, Download, RotateCw, ExternalLink } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { useEmissions } from '../hooks/useEmissions'
import type { NfseEmission, NfseStatus } from '../types'
import { apiErrorMessage } from '../utils'
import { downloadFile, openPdf } from '../download'
import { card, ink, tone, h2, body, numeric, brl } from '../ui'

const DOT: Record<NfseStatus, { color: string; text: string }> = {
  PENDING: { color: tone.amber, text: 'na fila' },
  PROCESSING: { color: tone.amber, text: 'emitindo' },
  AUTHORIZED: { color: tone.green, text: 'autorizada' },
  REJECTED: { color: tone.red, text: 'rejeitada' },
  CANCELED: { color: ink.faint, text: 'cancelada' },
}

const seg: CSSProperties = {
  display: 'flex',
  background: 'rgba(0,0,0,0.045)',
  borderRadius: 9,
  padding: 2.5,
}
const segBtn = (on: boolean): CSSProperties => ({
  border: 'none',
  background: on ? '#fff' : 'transparent',
  color: on ? ink.strong : ink.mid,
  padding: '6px 14px',
  borderRadius: 7,
  fontSize: 12.5,
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'inherit',
  letterSpacing: '-0.01em',
  boxShadow: on ? '0 1px 2px rgba(0,0,0,.06)' : 'none',
})
const iconBtn: CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 8,
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  color: ink.faint,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

type Filter = 'all' | 'authorized' | 'rejected'

function initials(name: string | null): string {
  if (!name) return '—'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

export default function EmissionsList() {
  const { emissions, loading, error, refetch } = useEmissions()
  const [filter, setFilter] = useState<Filter>('all')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [hover, setHover] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const rows = useMemo(() => {
    if (filter === 'authorized') return emissions.filter((e) => e.status === 'AUTHORIZED')
    if (filter === 'rejected') return emissions.filter((e) => e.status === 'REJECTED')
    return emissions
  }, [emissions, filter])

  const total = useMemo(
    () => rows.filter((e) => e.status === 'AUTHORIZED').reduce((s, e) => s + e.valorServicos, 0),
    [rows],
  )

  const retry = (e: NfseEmission) => {
    if (busyId) return
    setBusyId(e.id)
    setActionError(null)
    api
      .post(`/fiscal/sales/${e.saleId}/emit`)
      .then(() => refetch())
      .catch((err: unknown) => setActionError(apiErrorMessage(err)))
      .finally(() => setBusyId(null))
  }

  const act = (fn: Promise<void>) => {
    setActionError(null)
    fn.catch((err: unknown) => setActionError(apiErrorMessage(err)))
  }

  return (
    <div style={{ ...card, overflow: 'hidden' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '22px 28px 18px',
          gap: 14,
          flexWrap: 'wrap',
        }}
      >
        <span style={h2}>Notas emitidas</span>
        <div style={seg}>
          <button style={segBtn(filter === 'all')} onClick={() => setFilter('all')}>
            Todas
          </button>
          <button style={segBtn(filter === 'authorized')} onClick={() => setFilter('authorized')}>
            Autorizadas
          </button>
          <button style={segBtn(filter === 'rejected')} onClick={() => setFilter('rejected')}>
            Rejeitadas
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ padding: '36px 28px', textAlign: 'center', ...body, fontSize: 13 }}>Carregando…</div>
      )}

      {!loading && error && (
        <div style={{ padding: '26px 28px', fontSize: 13, color: tone.red }}>{error}</div>
      )}

      {!loading && !error && rows.length === 0 && (
        <div style={{ padding: '44px 28px', textAlign: 'center' }}>
          <div style={{ ...body, fontSize: 13.5, color: ink.strong }}>Nenhuma nota neste filtro.</div>
          <div style={{ ...body, fontSize: 12.5, marginTop: 4 }}>
            As notas aparecem aqui assim que uma venda com serviço é fechada no caixa.
          </div>
        </div>
      )}

      {!loading &&
        !error &&
        rows.map((e) => {
          const dot = DOT[e.status]
          const on = hover === e.id
          const done = e.status === 'AUTHORIZED'
          return (
            <div
              key={e.id}
              onMouseEnter={() => setHover(e.id)}
              onMouseLeave={() => setHover(null)}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0,1fr) auto',
                gap: 20,
                padding: '16px 28px',
                borderTop: `0.5px solid ${ink.hair}`,
                alignItems: 'center',
                background: on ? 'rgba(0,0,0,0.012)' : 'transparent',
                transition: 'background .16s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: 'rgba(0,0,0,0.045)',
                    color: ink.mid,
                    fontSize: 11,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {initials(e.tomadorNome)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.015em', color: ink.strong }}>
                    {e.tomadorNome ?? 'Consumidor não identificado'}
                  </div>
                  <div
                    style={{
                      fontSize: 12.5,
                      color: ink.faint,
                      marginTop: 2,
                      letterSpacing: '-0.005em',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {e.nfseNumber ? `nº ${e.nfseNumber} · ` : ''}
                    {e.discriminacao}
                    {e.status === 'REJECTED' && e.errorMessage ? ` · ${e.errorMessage}` : ''}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ display: 'flex', gap: 2, opacity: on ? 1 : 0, transition: 'opacity .18s' }}>
                  {done && (
                    <>
                      <button
                        style={iconBtn}
                        title="Comprovante"
                        onClick={() => act(openPdf(`/fiscal/emissions/${e.id}/receipt.pdf`))}
                      >
                        <FileText size={14} strokeWidth={1.8} />
                      </button>
                      <button
                        style={iconBtn}
                        title="Baixar XML"
                        onClick={() =>
                          act(
                            downloadFile(
                              `/fiscal/emissions/${e.id}/xml`,
                              `NFSe-${e.nfseNumber ?? e.id}.xml`,
                            ),
                          )
                        }
                      >
                        <Download size={14} strokeWidth={1.8} />
                      </button>
                    </>
                  )}
                  {e.status === 'REJECTED' && (
                    <button
                      style={{ ...iconBtn, color: tone.red }}
                      title="Reemitir"
                      disabled={busyId === e.id}
                      onClick={() => retry(e)}
                    >
                      <RotateCw size={14} strokeWidth={1.8} />
                    </button>
                  )}
                  {done && e.chaveAcesso && (
                    <button style={iconBtn} title="Consultar no Portal Nacional">
                      <ExternalLink size={14} strokeWidth={1.8} />
                    </button>
                  )}
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 15.5, fontWeight: 600, ...numeric, color: ink.strong }}>
                    {brl(e.valorServicos)}
                  </div>
                  <div style={{ fontSize: 11, color: ink.faint, marginTop: 2 }}>
                    {new Date(e.createdAt).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                <span
                  title={dot.text}
                  style={{ width: 6, height: 6, borderRadius: '50%', background: dot.color, flexShrink: 0 }}
                />
              </div>
            </div>
          )
        })}

      {actionError && (
        <div style={{ padding: '12px 28px', fontSize: 12.5, color: tone.red }}>{actionError}</div>
      )}

      {!loading && !error && rows.length > 0 && (
        <div
          style={{
            padding: '16px 28px',
            borderTop: `0.5px solid ${ink.hair}`,
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 12,
            color: ink.faint,
          }}
        >
          <span>
            {rows.length} {rows.length === 1 ? 'nota' : 'notas'}
          </span>
          <span style={numeric}>{brl(total)}</span>
        </div>
      )}
    </div>
  )
}
