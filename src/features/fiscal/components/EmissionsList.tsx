// src/features/fiscal/components/EmissionsList.tsx
'use client'

import { useState } from 'react'
import type { CSSProperties } from 'react'
import api from '@/shared/lib/apiClient'
import { useEmissions } from '../hooks/useEmissions'
import type { NfseEmission, NfseStatus } from '../types'
import { apiErrorMessage } from '../utils'

const card: CSSProperties = {
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 18,
  backdropFilter: 'blur(24px)',
  overflow: 'hidden',
}

const CHIP: Record<NfseStatus, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'NA FILA', color: '#fbbf24', bg: 'rgba(245,158,11,0.13)' },
  PROCESSING: { label: 'EMITINDO…', color: '#fbbf24', bg: 'rgba(245,158,11,0.13)' },
  AUTHORIZED: { label: 'AUTORIZADA', color: '#4ade80', bg: 'rgba(0,184,12,0.13)' },
  REJECTED: { label: 'REJEITADA', color: '#f87171', bg: 'rgba(220,38,38,0.13)' },
  CANCELED: { label: 'CANCELADA', color: '#a1a1aa', bg: 'rgba(113,113,122,0.15)' },
}

function brl(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

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
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 14 }}>
        <Kpi label="Notas no mês" value={String(authorized.length)} />
        <Kpi label="Valor emitido" value={brl(totalValue)} />
        <Kpi
          label="Rejeitadas"
          value={String(rejected.length)}
          color={rejected.length > 0 ? '#fbbf24' : undefined}
          hint={rejected.length > 0 ? 'precisam de ação' : undefined}
        />
      </div>

      <div style={card}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.09)',
          }}
        >
          <b style={{ fontSize: 15 }}>Notas emitidas</b>
          <button
            onClick={refetch}
            style={{
              background: 'none',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.6)',
              fontSize: 11.5,
              padding: '6px 12px',
              borderRadius: 9,
              cursor: 'pointer',
            }}
          >
            Atualizar
          </button>
        </div>

        {loading && (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: 13.5 }}>
            Carregando…
          </div>
        )}

        {!loading && error && (
          <div style={{ padding: '24px 20px', color: '#fca5a5', fontSize: 13 }}>{error}</div>
        )}

        {!loading && !error && emissions.length === 0 && (
          <div style={{ padding: '36px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: 13.5, lineHeight: 1.6 }}>
            Nenhuma nota emitida ainda.
            <br />
            <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.35)' }}>
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
                  padding: '14px 20px',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div style={{ minWidth: 200, flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>
                    {e.nfseNumber ? `NFS-e nº ${e.nfseNumber} · ` : ''}
                    {e.tomadorNome ?? 'Cliente não identificado'}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                    {e.discriminacao} · {e.tomadorCpf ?? 'sem CPF'} ·{' '}
                    {new Date(e.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    {e.status === 'REJECTED' && e.errorMessage ? ` · ${e.errorMessage}` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{brl(e.valorServicos)}</span>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      letterSpacing: 0.4,
                      padding: '4px 10px',
                      borderRadius: 99,
                      color: chip.color,
                      background: chip.bg,
                      border: `1px solid ${chip.color}44`,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {chip.label}
                  </span>
                  {e.status === 'REJECTED' && (
                    <button
                      onClick={() => retry(e)}
                      disabled={busyId === e.id}
                      style={{
                        background: 'none',
                        border: '1px solid rgba(220,38,38,0.4)',
                        color: '#f87171',
                        fontSize: 11.5,
                        padding: '6px 11px',
                        borderRadius: 9,
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
          <div style={{ padding: '12px 20px', color: '#fca5a5', fontSize: 12.5 }}>{actionError}</div>
        )}
      </div>
    </div>
  )
}

function Kpi({ label, value, color, hint }: { label: string; value: string; color?: string; hint?: string }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.045)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 16,
        padding: 18,
        backdropFilter: 'blur(24px)',
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
        {label}
      </div>
      <div style={{ fontSize: 23, fontWeight: 800, letterSpacing: '-0.5px', marginTop: 8, color: color ?? '#f4f4f5' }}>
        {value}
      </div>
      {hint && <div style={{ fontSize: 11, color: color ?? 'rgba(255,255,255,0.4)', marginTop: 5 }}>{hint}</div>}
    </div>
  )
}
