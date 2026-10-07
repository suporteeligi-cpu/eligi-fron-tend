'use client'
// src/app/dashboard/eligiclub/components/ClubAnticipationCard.tsx
// @eligi:club-ant-card
//
// Card "Quando o cartão cai na sua conta" (aba Financeiro, so o dono).
// Direcao A dos mockups de out/2026: tres opcoes com o valor que fica pro
// estabelecimento e o recibo completo da escolhida logo abaixo.
//
// Fonte dos numeros: GET /club-subscriptions/asaas/anticipation, que devolve a
// situacao no Asaas e uma SIMULACAO REAL numa cobranca do proprio lojista.
// Nada de numero inventado: sem cobranca elegivel, a tela mostra so a taxa.
// Medio fica "em breve" ate a fatia da rotina diaria.

import { useState, useEffect, useCallback, type CSSProperties } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'

import api from '@/shared/lib/apiClient'
import { colors, typography, inkLight } from '@/shared/theme'

type Choice = 'rapido' | 'normal'

interface Sample {
  paymentValue: number
  cardFee: number
  cardNetValue: number
  anticipationFee: number
  anticipationNetValue: number
  anticipationDays: number
  monthlyRatePct: number | null
}
interface Overview {
  available: boolean
  reason: 'NOT_CONNECTED' | 'NOT_APPROVED' | 'ISENTO' | 'ASAAS_UNAVAILABLE' | null
  enabled: boolean | null
  limit: { total: number; available: number } | null
  sample: Sample | null
  updatedAt: string | null
  updatedByName: string | null
}

const NUM_FF = `'Space Grotesk', ${typography.fontFamily}`
const MEDIO_DIAS = 15
const RATE_FALLBACK = '1,25%'
// @eligi:club-ant-limite-const — abaixo disso o card avisa que o limite esta acabando
const LIMITE_ALERTA = 1000

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const pct = (n: number) => `${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
const fmtQuando = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' })

/** Quanto sobra e quanto custa em cada opcao, a partir da simulacao real. */
function contas(s: Sample) {
  const r2 = (n: number) => Math.round(n * 100) / 100
  const feeDia = s.anticipationDays > 0 ? s.anticipationFee / s.anticipationDays : 0
  const medioAnt = r2(feeDia * MEDIO_DIAS)
  const total = (fica: number) => (s.paymentValue > 0 ? ((s.paymentValue - fica) / s.paymentValue) * 100 : 0)
  return {
    rapido: { ant: s.anticipationFee, fica: s.anticipationNetValue, total: total(s.anticipationNetValue) },
    medio:  { ant: medioAnt, fica: r2(s.cardNetValue - medioAnt), total: total(s.cardNetValue - medioAnt) },
    normal: { ant: 0, fica: s.cardNetValue, total: total(s.cardNetValue) },
  }
}

const UNAVAILABLE_TXT: Record<string, string> = {
  NOT_CONNECTED: 'Ative a cobrança automática do clube para escolher quando o cartão cai.',
  NOT_APPROVED: 'Sua conta de pagamentos ainda está em análise. A escolha aparece aqui quando for aprovada.',
  ISENTO: 'Conta em modo teste: antecipação indisponível.',
  ASAAS_UNAVAILABLE: 'Não conseguimos falar com o Asaas agora. Tente de novo em alguns minutos.',
}

export default function ClubAnticipationCard() {
  const [data, setData] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [preview, setPreview] = useState<Choice | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const load = useCallback(async (force = false) => {
    try {
      const res = await api.get(`/club-subscriptions/asaas/anticipation${force ? '?force=1' : ''}`)
      setData((res.data?.data ?? null) as Overview | null)
      setLoadError(false)
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const atual: Choice = data?.enabled ? 'rapido' : 'normal'
  const mostrando: Choice = preview ?? atual
  const pendente = preview !== null && preview !== atual

  const confirmar = useCallback(async () => {
    if (!preview) return
    setSaving(true)
    setSaveError(null)
    try {
      const res = await api.put('/club-subscriptions/asaas/anticipation', { enabled: preview === 'rapido' })
      setData((res.data?.data ?? null) as Overview | null)
      setPreview(null)
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setSaveError(msg ?? 'Não foi possível alterar agora. Tente de novo.')
    } finally {
      setSaving(false)
    }
  }, [preview])

  const cancelar = useCallback(() => { setPreview(null); setSaveError(null) }, [])

  // ── estados ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={card} aria-busy="true">
        <div style={{ height: 18, width: '60%', borderRadius: 6, background: 'rgba(17,17,20,.06)' }} />
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ height: 62, borderRadius: 14, background: 'rgba(17,17,20,.04)' }} />
        ))}
      </div>
    )
  }
  if (loadError || !data) {
    return (
      <div style={card}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', color: inkLight.bad.text, fontSize: 13 }}>
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>Não foi possível carregar o recebimento do cartão.</span>
        </div>
        <button onClick={() => { setLoading(true); void load(true) }} style={btnGhost}>Tentar de novo</button>
      </div>
    )
  }
  if (!data.available) {
    return (
      <div style={card}>
        <b style={{ fontSize: 15 }}>Quando o cartão cai na sua conta</b>
        <p style={{ margin: 0, fontSize: 13, color: '#4b4b52', lineHeight: 1.5 }}>
          {UNAVAILABLE_TXT[data.reason ?? 'ASAAS_UNAVAILABLE']}
        </p>
        {data.reason === 'ASAAS_UNAVAILABLE' && (
          <button onClick={() => { setLoading(true); void load(true) }} style={btnGhost}>Tentar de novo</button>
        )}
      </div>
    )
  }

  const s = data.sample
  const c = s ? contas(s) : null
  const taxaMes = s?.monthlyRatePct != null ? pct(s.monthlyRatePct) : RATE_FALLBACK

  const opcoes: { key: Choice | 'medio'; titulo: string; quando: string; fica: string; foot: string; disabled?: boolean }[] = [
    { key: 'rapido', titulo: 'Rápido', quando: 'Em até 2 dias úteis',
      fica: c ? brl(c.rapido.fica) : `${taxaMes} ao mês`, foot: c ? 'ficam pra você' : 'de antecipação' },
    { key: 'medio', titulo: 'Médio', quando: `Em cerca de ${MEDIO_DIAS} dias`,
      fica: c ? `~${brl(c.medio.fica)}` : '—', foot: 'estimado', disabled: true },
    { key: 'normal', titulo: 'Normal', quando: 'Em cerca de 32 dias',
      fica: c ? brl(c.normal.fica) : 'sem taxa', foot: c ? 'sem custo extra' : 'de antecipação' },
  ]

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <b style={{ fontSize: 15 }}>Quando o cartão cai na sua conta</b>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600,
          padding: '4px 10px', borderRadius: 999,
          background: data.enabled ? inkLight.ok.bg : 'rgba(17,17,20,.05)',
          color: data.enabled ? inkLight.ok.text : '#4b4b52',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
          {data.enabled ? 'Rápido ligado' : 'Normal'}
        </span>
      </div>

      <div role="radiogroup" aria-label="Quando receber o cartão" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {opcoes.map((o) => {
          const on = !o.disabled && o.key === mostrando
          return (
            <button
              key={o.key}
              role="radio"
              aria-checked={on}
              disabled={o.disabled || saving}
              onClick={() => { if (o.key !== 'medio') { setPreview(o.key === atual ? null : o.key); setSaveError(null) } }}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%', textAlign: 'left',
                minHeight: 44, padding: 13, borderRadius: 14, fontFamily: 'inherit', color: '#111114',
                background: '#fff', cursor: o.disabled ? 'not-allowed' : 'pointer',
                border: `1.5px solid ${on ? '#111114' : 'rgba(17,17,20,.09)'}`,
                boxShadow: on ? '0 0 0 3px rgba(17,17,20,.06)' : 'none',
                opacity: o.disabled ? 0.55 : 1,
              }}
            >
              <span style={{
                width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                border: `1.5px solid ${on ? '#111114' : '#8a8a93'}`, display: 'grid', placeItems: 'center',
              }}>
                {on && <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#111114' }} />}
              </span>
              <span style={{ minWidth: 0 }}>
                <span style={{ fontWeight: 700, fontSize: 14.5 }}>
                  {o.titulo}
                  {o.disabled && (
                    <span style={{
                      marginLeft: 6, fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase',
                      color: inkLight.info.text, background: inkLight.info.bg, padding: '2px 7px', borderRadius: 6,
                    }}>em breve</span>
                  )}
                </span>
                <span style={{ display: 'block', fontSize: 12.5, color: '#4b4b52', marginTop: 2 }}>{o.quando}</span>
              </span>
              <span style={{ marginLeft: 'auto', textAlign: 'right', flexShrink: 0 }}>
                <span style={{ display: 'block', fontFamily: NUM_FF, fontVariantNumeric: 'tabular-nums', fontSize: 17, fontWeight: 700, letterSpacing: '-.02em' }}>
                  {o.fica}
                </span>
                <span style={{ display: 'block', fontSize: 12, color: '#8a8a93' }}>{o.foot}</span>
              </span>
            </button>
          )
        })}
      </div>

      {s && c && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <Linha rotulo="Cliente paga" valor={brl(s.paymentValue)} />
          <Linha rotulo="Taxa do cartão (Asaas)" valor={`− ${brl(s.cardFee)}`} />
          <Linha
            rotulo={mostrando === 'rapido' ? `Antecipação (${s.anticipationDays} dias)` : 'Antecipação'}
            valor={mostrando === 'rapido' ? `− ${brl(c.rapido.ant)}` : brl(0)}
          />
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10,
            borderTop: '1px dashed rgba(17,17,20,.12)', paddingTop: 9, marginTop: 2,
          }}>
            <span style={{ fontWeight: 600 }}>Fica pra você</span>
            <span style={{ fontFamily: NUM_FF, fontVariantNumeric: 'tabular-nums', fontSize: 20, fontWeight: 700, color: inkLight.ok.text }}>
              {brl(c[mostrando].fica)}
            </span>
          </div>
          <div style={{ fontSize: 11.5, color: '#8a8a93', textAlign: 'right' }}>
            desconto total {pct(c[mostrando].total)} · cai {mostrando === 'rapido' ? 'em até 2 dias úteis' : 'em cerca de 32 dias'}
          </div>
        </div>
      )}

      {pendente && (
        <div style={{
          border: '1px solid rgba(17,17,20,.08)', background: 'rgba(17,17,20,.03)', borderRadius: 13,
          padding: 13, display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <p style={{ margin: 0, fontSize: 13, color: '#4b4b52', lineHeight: 1.5 }}>
            {preview === 'rapido'
              ? (s && c
                ? `Ligar o Rápido? Cada mensalidade de ${brl(s.paymentValue)} no cartão cai em até 2 dias úteis, e o Asaas cobra cerca de ${brl(c.rapido.ant)} de antecipação. Você fica com ${brl(c.rapido.fica)}.`
                : `Ligar o Rápido? As mensalidades no cartão caem em até 2 dias úteis, com taxa de antecipação a partir de ${taxaMes} ao mês, proporcional aos dias.`)
              : 'Voltar ao Normal? As próximas mensalidades caem em cerca de 32 dias, sem taxa de antecipação.'}
          </p>
          {saveError && (
            <div style={{ display: 'flex', gap: 6, fontSize: 12.5, color: inkLight.bad.text }}>
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} /><span>{saveError}</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={cancelar} disabled={saving} style={{ ...btnGhost, flex: 1 }}>Cancelar</button>
            <button onClick={() => void confirmar()} disabled={saving} style={{ ...btnPrimary, flex: 1, opacity: saving ? 0.7 : 1 }}>
              {saving && <Loader2 size={15} style={{ animation: 'club-spin .9s linear infinite' }} />}
              {saving ? 'Salvando…' : preview === 'rapido' ? 'Ligar antecipação' : 'Voltar ao Normal'}
            </button>
          </div>
        </div>
      )}

      {/* @eligi:club-ant-limite-aviso */}
      {data.enabled && data.limit && data.limit.available < LIMITE_ALERTA && (
        <div style={{
          display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12.5, lineHeight: 1.5,
          color: inkLight.warn.text, background: inkLight.warn.bg, border: `1px solid ${inkLight.warn.border}`,
          borderRadius: 12, padding: '10px 12px',
        }}>
          <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>
            Restam {brl(data.limit.available)} de limite de antecipação no Asaas. Acima disso as mensalidades
            voltam a cair no prazo normal, em cerca de 32 dias.
          </span>
        </div>
      )}

      <p style={{ margin: 0, fontSize: 11.5, color: '#8a8a93', lineHeight: 1.5 }}>
        Vale para as próximas mensalidades pagas no cartão de crédito. Taxa de antecipação de {taxaMes} ao mês,
        proporcional aos dias.
        {/* @eligi:club-ant-limite-rodape — limite so aparece no aviso abaixo */}
        {data.updatedAt && <> Alterado {data.updatedByName ? `por ${data.updatedByName} ` : ''}em {fmtQuando(data.updatedAt)}.</>}
      </p>
    </div>
  )
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, fontSize: 13 }}>
      <span style={{ color: '#4b4b52' }}>{rotulo}</span>
      <span style={{ fontFamily: NUM_FF, fontVariantNumeric: 'tabular-nums', color: '#4b4b52' }}>{valor}</span>
    </div>
  )
}

const card: CSSProperties = {
  background: '#fff', border: '1px solid rgba(17,17,20,.07)', borderRadius: 16, padding: 16,
  display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12,
}
const btnGhost: CSSProperties = {
  minHeight: 44, borderRadius: 12, padding: '0 16px', fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
  border: '1px solid rgba(17,17,20,.1)', background: '#fff', color: '#111114', cursor: 'pointer',
}
const btnPrimary: CSSProperties = {
  minHeight: 44, borderRadius: 12, padding: '0 16px', fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
  border: 'none', background: colors.red.DEFAULT, color: '#fff', cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
}
