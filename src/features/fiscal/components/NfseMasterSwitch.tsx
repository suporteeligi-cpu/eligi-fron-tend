// src/features/fiscal/components/NfseMasterSwitch.tsx
'use client'

import { useState } from 'react'
import { Power, ShieldCheck, TriangleAlert } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { colors, glassCard, inkLight, radius } from '@/shared/theme'
import type { NfseEmissionState } from '../types'
import { apiErrorMessage } from '../utils'

interface Props {
  state: NfseEmissionState
  onChanged: () => void
}

export default function NfseMasterSwitch({ state, onChanged }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const real = state.ambienteProducao

  const toggle = () => {
    if (busy) return
    const proximo = !state.ativa

    if (proximo) {
      const aviso = real
        ? 'Ativar a emissão automática de notas fiscais?\n\n' +
          '• Toda venda com serviço fechada no caixa vai gerar uma NFS-e VÁLIDA, ' +
          'por qualquer pessoa da sua equipe.\n' +
          '• Nota emitida por engano só se cancela junto à prefeitura, com processo ' +
          'e concordância do cliente.\n\n' +
          'Você é o responsável por esta ativação. Confirma?'
        : 'Ativar a emissão automática de notas?\n\n' +
          'Toda venda com serviço vai gerar nota. (Sua conta ainda está em modo de teste — ' +
          'as notas não têm validade fiscal.)'
      if (!window.confirm(aviso)) return
    } else {
      if (
        !window.confirm(
          'Desativar a emissão de notas fiscais?\n\n' +
            'Nenhuma venda vai gerar nota até você ativar de novo. ' +
            'Lembre que a emissão pode ser obrigatória no seu município.',
        )
      )
        return
    }

    setBusy(true)
    setError(null)
    api
      .put('/fiscal/emission-state', { ativa: proximo })
      .then(() => onChanged())
      .catch((err: unknown) => setError(apiErrorMessage(err)))
      .finally(() => setBusy(false))
  }

  const tone = state.ativa ? inkLight.ok : inkLight.neutral

  return (
    <div
      style={{
        ...glassCard,
        padding: 20,
        marginBottom: 14,
        border: `1px solid ${state.ativa ? inkLight.ok.border : 'rgba(0,0,0,0.08)'}`,
        background: state.ativa ? inkLight.ok.bg : 'rgba(255,255,255,0.72)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 13,
            background: state.ativa ? colors.red.gradient : 'rgba(0,0,0,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Power size={20} color={state.ativa ? '#fff' : inkLight.faint} />
        </div>

        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: inkLight.strong }}>
            {state.ativa ? 'Emissão automática ligada' : 'Emissão automática desligada'}
          </div>
          <div style={{ fontSize: 12.5, color: inkLight.label, lineHeight: 1.5, marginTop: 2 }}>
            {state.ativa
              ? 'Toda venda com serviço fechada no caixa gera uma nota — por qualquer pessoa da equipe.'
              : 'Nenhuma venda gera nota enquanto estiver desligado.'}
          </div>
        </div>

        <button
          onClick={toggle}
          disabled={busy}
          style={{
            background: state.ativa ? 'transparent' : colors.red.gradient,
            border: state.ativa ? `1px solid ${colors.gray.borderMd}` : 'none',
            color: state.ativa ? inkLight.strong : '#fff',
            fontSize: 13.5,
            fontWeight: 700,
            fontFamily: 'inherit',
            padding: '11px 22px',
            borderRadius: radius.md,
            cursor: busy ? 'wait' : 'pointer',
            opacity: busy ? 0.6 : 1,
            whiteSpace: 'nowrap',
          }}
        >
          {busy ? '…' : state.ativa ? 'Desligar' : 'Ligar emissão'}
        </button>
      </div>

      {/* ambiente: o lojista precisa saber se a nota vale ou é teste */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          marginTop: 12,
          fontSize: 11.5,
          color: real ? inkLight.ok.text : inkLight.warn.text,
        }}
      >
        {real ? <ShieldCheck size={13} /> : <TriangleAlert size={13} />}
        {real
          ? 'As notas emitidas têm validade fiscal e ficam registradas na Receita.'
          : 'Modo de teste: as notas geradas não têm validade fiscal.'}
      </div>

      {state.ativa && state.ativadaEm && (
        <div style={{ fontSize: 11, color: inkLight.faint, marginTop: 4 }}>
          Ligada em {new Date(state.ativadaEm).toLocaleString('pt-BR')}
        </div>
      )}

      {error && (
        <div style={{ fontSize: 12.5, color: inkLight.bad.text, marginTop: 10 }}>{error}</div>
      )}

      <div style={{ fontSize: 11, color: tone.text, marginTop: 8, opacity: 0 }} aria-hidden />
    </div>
  )
}
