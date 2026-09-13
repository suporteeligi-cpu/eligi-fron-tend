'use client'
// src/app/dashboard/eligiclub/components/ClubSettleConfirmModal.tsx
//
// Confirmacao do fechamento do pote.
//
// Existe porque o botao "Fechar periodo" era destrutivo e disparava direto,
// enquanto a propria tela prometia "nada e gravado ate confirmar". Um dono
// fechou setembro no dia 12 achando que veria uma confirmacao.
//
// Tres regras de desenho:
//   1. A consequencia vem ANTES do clique: valor, quem recebe, que vira
//      despesa no financeiro, e o que fica de fora se o mes ainda corre.
//   2. O botao de escape e o PADRAO (visual primario). O destrutivo e o
//      secundario, em vermelho. Quem esta com pressa acerta por inercia.
//   3. Nada de window.confirm: alvo de 44px, Escape fecha, clique no scrim
//      fecha, e o texto cabe na tela do celular.

import { useEffect } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { colors, typography, transitions } from '@/shared/theme'

interface ConfirmItem {
  professionalId: string
  professionalName: string
  fichas: number
  amount: number
}

interface ConfirmPreview {
  poolTotal: number
  totalFichas: number
  items: ConfirmItem[]
  pendingCredit?: number
  pendingCount?: number
}

const fmtBRL = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const MESES = [
  'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

function mesDoPeriodo(periodKey: string): string {
  const idx = Number(periodKey.slice(5, 7)) - 1
  return MESES[idx] ?? periodKey
}

export default function ClubSettleConfirmModal({
  preview, periodKey, isCurrent, closing, onCancel, onConfirm,
}: {
  preview: ConfirmPreview | null
  periodKey: string
  isCurrent: boolean
  closing: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  // Escape fecha. Listener no documento, limpo no unmount - sem setState aqui.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  if (!preview) return null

  const mes = mesDoPeriodo(periodKey)
  const items = preview.items ?? []
  const pendente = preview.pendingCredit ?? 0
  const pendentes = preview.pendingCount ?? 0

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 11000, display: 'flex',
        alignItems: 'flex-end', justifyContent: 'center',
        background: 'rgba(17,17,20,0.42)', backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
      }}>
      <div
        role="dialog"
        aria-modal="true"
        style={{
          width: '100%', maxWidth: 520, background: '#fff',
          borderRadius: '20px 20px 0 0',
          padding: '22px 20px calc(22px + env(safe-area-inset-bottom))',
          fontFamily: typography.fontFamily,
          animation: 'club-fade-up 240ms cubic-bezier(.22,1,.36,1) both',
          maxHeight: '88vh', overflowY: 'auto',
        }}>
        <h3 style={{ margin: '0 0 6px', fontSize: 19, fontWeight: 780, letterSpacing: '-0.015em', color: colors.gray[900] }}>
          Fechar o pote de {mes}?
        </h3>
        <p style={{ margin: '0 0 18px', fontSize: 13.5, color: typography.color.muted, lineHeight: 1.5 }}>
          {fmtBRL(preview.poolTotal)} vao para {items.length} profissional{items.length !== 1 ? 'is' : ''} e viram
          despesa de comissao no seu financeiro.
        </p>

        <div>
          {items.map((it, i) => (
            <div key={it.professionalId}
              style={{
                display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12,
                padding: '10px 0',
                borderTop: i === 0 ? 'none' : `1px solid ${colors.gray.border}`,
              }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 650, color: colors.gray[900] }}>{it.professionalName}</div>
                <div style={{ fontSize: 12, color: colors.gray.dimText, marginTop: 1 }}>
                  {it.fichas} ficha{it.fichas !== 1 ? 's' : ''}
                </div>
              </div>
              <div style={{ fontSize: 15.5, fontWeight: 800, color: colors.gray[900], fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                {fmtBRL(it.amount)}
              </div>
            </div>
          ))}
        </div>

        {pendente > 0 && (
          <div style={{ marginTop: 14, padding: '13px 14px', borderRadius: 12, background: 'rgba(245,158,11,0.09)', border: '1px solid rgba(245,158,11,0.28)' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <AlertTriangle size={15} color="#B45309" strokeWidth={2.2} style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 12.5, color: '#7A4F00', lineHeight: 1.5 }}>
                <b style={{ display: 'block', marginBottom: 2, color: '#7A4F00' }}>
                  {fmtBRL(pendente)} ainda nao caiu na sua conta
                </b>
                {pendentes} pagamento{pendentes !== 1 ? 's' : ''} no cartao com liberacao futura. Fechar agora
                significa pagar a equipe antes de o dinheiro entrar.
              </div>
            </div>
          </div>
        )}

        {isCurrent && (
          <div style={{ marginTop: 10, padding: '13px 14px', borderRadius: 12, background: 'rgba(245,158,11,0.09)', border: '1px solid rgba(245,158,11,0.28)' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <AlertTriangle size={15} color="#B45309" strokeWidth={2.2} style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 12.5, color: '#7A4F00', lineHeight: 1.5 }}>
                <b style={{ display: 'block', marginBottom: 2, color: '#7A4F00' }}>
                  {mes.charAt(0).toUpperCase() + mes.slice(1)} ainda nao terminou
                </b>
                Os atendimentos daqui ate o fim do mes nao entram em pote nenhum. Um mes so pode ser
                fechado uma vez.
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
          <button onClick={onCancel} disabled={closing}
            style={{
              width: '100%', minHeight: 50, borderRadius: 13,
              border: `1px solid ${colors.gray.borderMd}`, background: '#fff',
              color: colors.gray[900], fontFamily: 'inherit', fontSize: 15.5, fontWeight: 650,
              cursor: closing ? 'not-allowed' : 'pointer', transition: `all ${transitions.fast}`,
              WebkitTapHighlightColor: 'transparent',
            }}>
            {isCurrent ? 'Esperar o fim do mes' : 'Voltar'}
          </button>
          <button onClick={onConfirm} disabled={closing}
            style={{
              width: '100%', minHeight: 50, borderRadius: 13, border: 'none',
              background: colors.red.gradient, color: '#fff',
              fontFamily: 'inherit', fontSize: 15.5, fontWeight: 720,
              cursor: closing ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: closing ? 0.75 : 1, boxShadow: `0 6px 18px ${colors.red.glow}`,
              WebkitTapHighlightColor: 'transparent',
            }}>
            {closing && <Loader2 size={16} style={{ animation: 'club-spin .8s linear infinite' }} />}
            {closing ? 'Fechando...' : isCurrent ? 'Fechar mesmo assim' : 'Fechar periodo'}
          </button>
        </div>
      </div>
    </div>
  )
}
