// src/features/fiscal/components/EmissionsList.tsx
'use client'

import { useState } from 'react'
import api from '@/shared/lib/apiClient'
import { glassCard, inkLight, radius } from '@/shared/theme'
import type { InkTone } from '@/shared/theme'
import { useEmissions } from '../hooks/useEmissions'
import type { NfseEmission, NfseStatus } from '../types'
import { apiErrorMessage } from '../utils'
import { downloadFile, openPdf } from '../download'

const CHIP: Record<NfseStatus, { label: string; tone: InkTone }> = {
  PENDING: { label: 'NA FILA', tone: inkLight.warn },
  PROCESSING: { label: 'EMITINDO…', tone: inkLight.warn },
  AUTHORIZED: { label: 'AUTORIZADA', tone: inkLight.ok },
  REJECTED: { label: 'REJEITADA', tone: inkLight.bad },
  CANCELED: { label: 'CANCELADA', tone: inkLight.neutral },
}

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function sameMonth(iso: string, ref: Date): boolean {
  const d = new Date(iso)
  return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear()
}

export default function EmissionsList({ monthRef }: { monthRef: Date }) {
  const { emissions, loading, error, refetch } = useEmissions()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const ofMonth = emissions.filter((e) => sameMonth(e.createdAt, monthRef))
  const authorized = ofMonth.filter((e) => e.status === 'AUTHORIZED')
  const rejected = ofMonth.filter((e) => e.status === 'REJECTED')
  const totalValue = authorized.reduce((s, e) => s + e.valorServicos, 0)

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

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 14 }}>
        <Kpi label="Notas no mês" value={String(authorized.length)} />
        <Kpi label="Valor emitido" value={brl(totalValue)} />
        <Kpi
          label="Rejeitadas"
          value={String(rejected.length)}
          color={rejected.length > 0 ? inkLight.warn.text : undefined}
          sub={rejected.length > 0 ? 'precisam de ação' : undefined}
        />
      </div>

      <div style={{ ...glassCard, overflow: 'hidden' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '15px 18px',
            borderBottom: '0.5px solid rgba(0,0,0,0.08)',
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 600, color: inkLight.strong }}>Notas emitidas</span>
          <button
            onClick={refetch}
            style={{
              background: 'transparent',
              border: '1px solid rgba(0,0,0,0.11)',
              color: inkLight.label,
              fontSize: 11.5,
              fontFamily: 'inherit',
              padding: '6px 12px',
              borderRadius: radius.sm,
              cursor: 'pointer',
            }}
          >
            Atualizar
          </button>
        </div>

        {loading && (
          <div style={{ padding: '32px 18px', textAlign: 'center', color: inkLight.faint, fontSize: 13.5 }}>
            Carregando…
          </div>
        )}

        {!loading && error && (
          <div style={{ padding: '22px 18px', color: inkLight.bad.text, fontSize: 13 }}>{error}</div>
        )}

        {!loading && !error && emissions.length === 0 && (
          <div style={{ padding: '36px 18px', textAlign: 'center', fontSize: 13.5, lineHeight: 1.6, color: inkLight.label }}>
            Nenhuma nota emitida ainda.
            <br />
            <span style={{ fontSize: 12.5, color: inkLight.faint }}>
              Ao fechar uma venda no caixa, ligue o switch &quot;Emitir NFS-e&quot;.
            </span>
          </div>
        )}

        {!loading &&
          !error &&
          emissions.map((e) => {
            const chip = CHIP[e.status]
            return (
              <div
                key={e.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 10,
                  flexWrap: 'wrap',
                  padding: '13px 18px',
                  borderBottom: '0.5px solid rgba(0,0,0,0.05)',
                }}
              >
                <div style={{ minWidth: 200, flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: inkLight.strong }}>
                    {e.nfseNumber ? `NFS-e nº ${e.nfseNumber} · ` : ''}
                    {e.tomadorNome ?? 'Cliente não identificado'}
                  </div>
                  <div style={{ fontSize: 12, color: inkLight.faint, marginTop: 2 }}>
                    {e.discriminacao} · {e.tomadorCpf ?? 'sem CPF'} ·{' '}
                    {new Date(e.createdAt).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {e.status === 'REJECTED' && e.errorMessage ? ` · ${e.errorMessage}` : ''}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: inkLight.strong }}>{brl(e.valorServicos)}</span>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      letterSpacing: 0.3,
                      padding: '4px 10px',
                      borderRadius: radius.full,
                      color: chip.tone.text,
                      background: chip.tone.bg,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {chip.label}
                  </span>
                  {e.status === 'AUTHORIZED' && (
                    <>
                      <button
                        onClick={() => {
                          setActionError(null)
                          openPdf(`/fiscal/emissions/${e.id}/receipt.pdf`).catch((err: unknown) =>
                            setActionError(apiErrorMessage(err)),
                          )
                        }}
                        style={{
                          background: 'transparent',
                          border: '1px solid rgba(0,0,0,0.11)',
                          color: inkLight.label,
                          fontSize: 11.5,
                          fontFamily: 'inherit',
                          padding: '6px 11px',
                          borderRadius: radius.sm,
                          cursor: 'pointer',
                        }}
                      >
                        PDF
                      </button>
                      <button
                        onClick={() => {
                          setActionError(null)
                          downloadFile(
                            `/fiscal/emissions/${e.id}/xml`,
                            `NFSe-${e.nfseNumber ?? e.id}.xml`,
                          ).catch((err: unknown) => setActionError(apiErrorMessage(err)))
                        }}
                        style={{
                          background: 'transparent',
                          border: '1px solid rgba(0,0,0,0.11)',
                          color: inkLight.label,
                          fontSize: 11.5,
                          fontFamily: 'inherit',
                          padding: '6px 11px',
                          borderRadius: radius.sm,
                          cursor: 'pointer',
                        }}
                      >
                        XML
                      </button>
                    </>
                  )}
                  {e.status === 'REJECTED' && (
                    <button
                      onClick={() => retry(e)}
                      disabled={busyId === e.id}
                      style={{
                        background: 'transparent',
                        border: `1px solid ${inkLight.bad.border}`,
                        color: inkLight.bad.text,
                        fontSize: 11.5,
                        fontFamily: 'inherit',
                        padding: '6px 11px',
                        borderRadius: radius.sm,
                        cursor: busyId === e.id ? 'wait' : 'pointer',
                      }}
                    >
                      {busyId === e.id ? '…' : 'Reemitir'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}

        {actionError && (
          <div style={{ padding: '12px 18px', color: inkLight.bad.text, fontSize: 12.5 }}>{actionError}</div>
        )}
      </div>
    </div>
  )
}

function Kpi({ label, value, color, sub }: { label: string; value: string; color?: string; sub?: string }) {
  return (
    <div style={{ ...glassCard, padding: '16px 18px' }}>
      <div style={{ fontSize: 12, color: inkLight.label, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 600, lineHeight: 1.1, color: color ?? inkLight.strong }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: color ?? inkLight.faint, marginTop: 4 }}>{sub}</div>}
    </div>
  )
}
