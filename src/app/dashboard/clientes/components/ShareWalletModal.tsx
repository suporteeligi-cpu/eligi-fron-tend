'use client'
// src/app/dashboard/clientes/components/ShareWalletModal.tsx

import { useEffect, useState } from 'react'
import { Check, Copy, RefreshCw, X } from 'lucide-react'

import api from '@/shared/lib/apiClient'
import { colors, typography, radius, transitions } from '@/shared/theme'

/* =========================================
   Compartilhar o Cartao do Assinante.

   O codigo NAO existe em lugar nenhum depois desta tela — o banco so
   guarda o hash. Por isso ele aparece grande e copiavel, e a tela
   avisa que gerar de novo invalida o anterior.

   Regenerar NAO desloga quem ja reivindicou (cobre "cliente trocou de
   celular" sem derrubar o acesso atual).

   Duas cores literais aqui, ambas de proposito:
   - WA_GREEN: cor de marca do WhatsApp, ja literal no resto do repo.
   - CARD_ACCENT: identidade do cartao do assinante; nao existe na
     paleta do dashboard (que e vermelha). Se um dia virar token, e
     uma constante so pra trocar.
========================================= */

const WA_GREEN = '#1ebe5a'
const CARD_ACCENT = '#7c3aed'
const CARD_ACCENT_SOFT = 'rgba(124,58,237,0.07)'
const CARD_ACCENT_BORDER = 'rgba(124,58,237,0.22)'

interface ShareData {
  url: string
  code: string
  expiresAt: string
  claimed: boolean
  clientName: string | null
  phone: string | null
  whatsappUrl: string | null
  whatsappText: string
}

interface Props {
  clientId: string
  clientName?: string | null
  onClose: () => void
}

function expiryLabel(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(d)
}

export default function ShareWalletModal({ clientId, clientName, onClose }: Props) {
  const [data, setData] = useState<ShareData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)

  useEffect(() => {
    let alive = true

    async function run() {
      try {
        const res = await api.post<{ success: boolean; data: ShareData }>(
          `/clients/${clientId}/wallet/share`,
        )
        if (alive) {
          setData(res.data.data)
          setError(null)
        }
      } catch {
        if (alive) setError('Nao foi possivel gerar o cartao agora.')
      } finally {
        if (alive) setLoading(false)
      }
    }

    void run()
    return () => { alive = false }
  }, [clientId])

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [onClose])

  const regenerate = () => {
    setLoading(true)
    setError(null)
    api
      .post<{ success: boolean; data: ShareData }>(`/clients/${clientId}/wallet/share`)
      .then(res => { setData(res.data.data) })
      .catch(() => { setError('Nao foi possivel gerar um codigo novo.') })
      .finally(() => { setLoading(false) })
  }

  const copy = (value: string, which: 'code' | 'link') => {
    void navigator.clipboard
      .writeText(value)
      .then(() => {
        setCopied(which)
        window.setTimeout(() => setCopied(null), 1600)
      })
      .catch(() => undefined)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Compartilhar cartao do assinante"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 11000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(15,23,42,0.55)',
        padding: 16,
        fontFamily: typography.fontFamily,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 420,
          maxHeight: '90dvh',
          overflowY: 'auto',
          background: '#fff',
          borderRadius: 20,
          padding: 22,
          boxShadow: '0 24px 60px -12px rgba(15,23,42,0.35)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: typography.scale.lg,
              fontWeight: typography.weight.bold,
              letterSpacing: '-0.02em',
              color: typography.color.primary,
            }}>
              Cartao do assinante
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: typography.scale.sm, color: typography.color.muted }}>
              {clientName ?? data?.clientName ?? 'Cliente'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            style={{
              display: 'grid',
              placeItems: 'center',
              width: 32,
              height: 32,
              borderRadius: radius.sm,
              border: `1px solid ${colors.gray.borderMd}`,
              background: 'transparent',
              color: colors.gray.dimText,
              cursor: 'pointer',
              transition: transitions.fast,
            }}
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {loading && (
          <p style={{ padding: '32px 0', textAlign: 'center', fontSize: typography.scale.sm, color: typography.color.muted }}>
            Gerando...
          </p>
        )}

        {error && !loading && (
          <div style={{ padding: '24px 0', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: typography.scale.sm, color: colors.red.DEFAULT }}>{error}</p>
            <button
              type="button"
              onClick={regenerate}
              style={{
                marginTop: 14,
                padding: '10px 16px',
                borderRadius: radius.sm,
                border: `1px solid ${colors.gray.borderMd}`,
                background: 'transparent',
                fontSize: typography.scale.base,
                color: typography.color.primary,
                cursor: 'pointer',
                transition: transitions.fast,
              }}
            >
              Tentar de novo
            </button>
          </div>
        )}

        {data && !loading && (
          <>
            <div style={{
              marginTop: 18,
              padding: 18,
              textAlign: 'center',
              borderRadius: 16,
              background: CARD_ACCENT_SOFT,
              border: `1px solid ${CARD_ACCENT_BORDER}`,
            }}>
              <p style={{
                margin: 0,
                fontSize: typography.scale.xs,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: CARD_ACCENT,
                fontWeight: typography.weight.semibold,
              }}>
                Codigo de acesso
              </p>
              <p style={{
                margin: '8px 0 0',
                fontSize: 34,
                fontWeight: typography.weight.bold,
                letterSpacing: '0.16em',
                color: typography.color.primary,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {data.code}
              </p>
              <button
                type="button"
                onClick={() => copy(data.code, 'code')}
                style={{
                  marginTop: 10,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  border: 0,
                  background: 'transparent',
                  color: CARD_ACCENT,
                  fontSize: typography.scale.sm,
                  fontWeight: typography.weight.semibold,
                  cursor: 'pointer',
                }}
              >
                {copied === 'code' ? <Check size={14} /> : <Copy size={14} />}
                {copied === 'code' ? 'Copiado' : 'Copiar codigo'}
              </button>
            </div>

            <p style={{ margin: '12px 0 0', fontSize: typography.scale.xs, color: typography.color.muted, lineHeight: 1.55 }}>
              O cliente confirma com os <strong style={{ color: typography.color.primary }}>4 ultimos numeros do telefone</strong>
              {data.phone ? ` (${data.phone.replace(/\D/g, '').slice(-4)})` : ''}. Vale ate {expiryLabel(data.expiresAt)} e so e pedido na primeira vez.
            </p>

            <div style={{
              marginTop: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '11px 13px',
              borderRadius: radius.sm,
              border: `1px solid ${colors.gray.borderMd}`,
            }}>
              <span style={{
                flex: 1,
                minWidth: 0,
                fontSize: typography.scale.xs,
                color: typography.color.muted,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {data.url}
              </span>
              <button
                type="button"
                onClick={() => copy(data.url, 'link')}
                aria-label="Copiar link"
                style={{ display: 'grid', placeItems: 'center', border: 0, background: 'transparent', color: CARD_ACCENT, cursor: 'pointer' }}
              >
                {copied === 'link' ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>

            {data.whatsappUrl ? (
              <a
                href={data.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  marginTop: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '14px 16px',
                  borderRadius: radius.sm,
                  background: WA_GREEN,
                  color: '#fff',
                  fontSize: typography.scale.base,
                  fontWeight: typography.weight.semibold,
                  textDecoration: 'none',
                }}
              >
                Enviar pelo WhatsApp
              </a>
            ) : (
              <p style={{ marginTop: 16, textAlign: 'center', fontSize: typography.scale.sm, color: colors.red.DEFAULT }}>
                Este cliente nao tem telefone cadastrado. Copie o link e o codigo para enviar.
              </p>
            )}

            <button
              type="button"
              onClick={regenerate}
              style={{
                marginTop: 10,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
                padding: '12px 16px',
                borderRadius: radius.sm,
                border: `1px solid ${colors.gray.borderMd}`,
                background: 'transparent',
                fontSize: typography.scale.sm,
                color: typography.color.muted,
                cursor: 'pointer',
                transition: transitions.fast,
              }}
            >
              <RefreshCw size={14} />
              Gerar codigo novo
            </button>

            <p style={{ margin: '10px 0 0', textAlign: 'center', fontSize: typography.scale.xs, color: typography.color.muted, lineHeight: 1.5 }}>
              Gerar um codigo novo invalida o anterior. Quem ja abriu o cartao continua com acesso.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
