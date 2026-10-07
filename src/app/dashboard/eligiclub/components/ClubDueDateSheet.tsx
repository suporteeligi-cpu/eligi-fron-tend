'use client'
// src/app/dashboard/eligiclub/components/ClubDueDateSheet.tsx
//
// @eligi:club-due-date-sheet
// Folha para mudar o dia do vencimento de um membro MANUAL (direcao C do
// prototipo de 07/10/2026): ajuste de um em um + atalhos "dia 5", "dia 10"...
// pensados no dia em que o cliente recebe.
//
// A regra de verdade mora no back (checkDueDateChange). Aqui so desenhamos a
// janela pra nao oferecer data que o back vai recusar: 15 dias antes ou
// depois do vencimento atual, a partir de amanha.

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Loader2, Minus, Plus, AlertCircle } from 'lucide-react'

import api from '@/shared/lib/apiClient'
import { colors, typography, inkLight } from '@/shared/theme'

/** Espelha DUE_DATE_MAX_SHIFT_DAYS do back. Mudou la, muda aqui. */
const MAX_SHIFT_DAYS = 15
const DAY_MS = 86_400_000
const BRT_MS = 3 * 60 * 60 * 1000
const ATALHOS = [5, 10, 15, 20, 25, 30]
const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

// @eligi:club-due-date-hoje
// Date.now() nao pode rodar no render (React Compiler purity). Roda uma vez no
// carregamento do modulo. Aba aberta na virada do dia so erra o limite por um
// dia, e o back recusa com mensagem clara.
const HOJE = new Date(Date.now() - BRT_MS).toISOString().slice(0, 10)

const toUtc = (ymd: string) => {
  const [y, m, d] = ymd.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}
const fromUtc = (ms: number) => new Date(ms).toISOString().slice(0, 10)
const addDays = (ymd: string, n: number) => fromUtc(toUtc(ymd) + n * DAY_MS)
const ddmm = (ymd: string) => `${ymd.slice(8, 10)}/${ymd.slice(5, 7)}`
const ddmmyyyy = (ymd: string) => `${ddmm(ymd)}/${ymd.slice(0, 4)}`
const diaSemana = (ymd: string) => DIAS[new Date(toUtc(ymd)).getUTCDay()]
const ymdSP = (iso: string) => new Date(new Date(iso).getTime() - BRT_MS).toISOString().slice(0, 10)

/** Mesmo dia no mes seguinte, com ajuste de fim de mes (31/01 -> 28/02). */
function proximoMes(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const ultimo = new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
  return fromUtc(Date.UTC(y, m, Math.min(d, ultimo)))
}

interface Props {
  subId: string
  currentPeriodEnd: string
  isMobile: boolean
  onSaved: (data: unknown) => void
  onClose: () => void
}

export default function ClubDueDateSheet({ subId, currentPeriodEnd, isMobile, onSaved, onClose }: Props) {
  const atual = ymdSP(currentPeriodEnd)
  const amanha = addDays(HOJE, 1)
  const menor = addDays(atual, -MAX_SHIFT_DAYS) > amanha ? addDays(atual, -MAX_SHIFT_DAYS) : amanha
  const maior = addDays(atual, MAX_SHIFT_DAYS)
  const cabe = (ymd: string) => ymd >= menor && ymd <= maior

  const [sel, setSel] = useState(atual)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /** Data com o dia n mais proxima do vencimento atual, dentro da janela. */
  function atalho(n: number): string | null {
    const [y, m] = atual.split('-').map(Number)
    let melhor: string | null = null
    for (const desloc of [-1, 0, 1]) {
      const ms = Date.UTC(y, m - 1 + desloc, n)
      const ymd = fromUtc(ms)
      if (Number(ymd.slice(8, 10)) !== n) continue // mes sem esse dia (ex.: 30/02)
      if (!cabe(ymd)) continue
      if (!melhor || Math.abs(toUtc(ymd) - toUtc(atual)) < Math.abs(toUtc(melhor) - toUtc(atual))) melhor = ymd
    }
    return melhor
  }

  const antes = addDays(sel, -1)
  const depois = addDays(sel, 1)
  const mudou = sel !== atual
  const diff = Math.round((toUtc(sel) - toUtc(atual)) / DAY_MS)

  async function salvar() {
    if (!mudou || saving) return
    setError(null)
    setSaving(true)
    try {
      const res = await api.patch(`/club-subscriptions/${subId}/due-date`, { dueDate: sel })
      onSaved(res.data?.data ?? res.data)
      onClose()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string; message?: string } } }
      setError(e.response?.data?.error ?? e.response?.data?.message ?? 'Não foi possível alterar o vencimento.')
    } finally {
      setSaving(false)
    }
  }

  const passo: React.CSSProperties = {
    width: 52, height: 52, borderRadius: 14, border: `1px solid ${colors.gray.borderMd}`, background: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: colors.gray[900],
    flexShrink: 0,
  }
  const passoOff: React.CSSProperties = { ...passo, opacity: 0.35, cursor: 'not-allowed' }

  const content = (
    <div
      onClick={() => { if (!saving) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.38)',
        display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
        fontFamily: typography.fontFamily,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="club-due-title"
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', width: isMobile ? '100%' : 420, maxWidth: '100%',
          borderRadius: isMobile ? '20px 20px 0 0' : 18, boxShadow: '0 -8px 40px rgba(0,0,0,0.20)',
          padding: isMobile ? '10px 16px calc(18px + env(safe-area-inset-bottom))' : '20px 22px 20px',
          display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '92vh', overflowY: 'auto',
        }}
      >
        {isMobile && <div style={{ width: 38, height: 4, borderRadius: 4, background: 'rgba(0,0,0,0.15)', margin: '0 auto' }} />}
        <div>
          <h3 id="club-due-title" style={{ margin: 0, fontSize: 17, fontWeight: 700, color: colors.gray[900], letterSpacing: '-0.01em' }}>
            Mudar dia do vencimento
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 12.5, color: colors.gray[500] }}>
            Vale a partir do próximo vencimento. O dia escolhido fica fixo nos meses seguintes.
          </p>
        </div>

        {/* ajuste de um em um */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button type="button" aria-label="Um dia antes" disabled={!cabe(antes)} onClick={() => setSel(antes)} style={cabe(antes) ? passo : passoOff}>
            <Minus size={20} strokeWidth={2.2} />
          </button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 34, fontWeight: 700, color: colors.gray[900], letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
              {ddmm(sel)}
            </div>
            <div style={{ fontSize: 12, color: colors.gray[500], marginTop: 6 }}>
              {diaSemana(sel)}, {ddmmyyyy(sel)}{mudou ? '' : ' · vencimento atual'}
            </div>
          </div>
          <button type="button" aria-label="Um dia depois" disabled={!cabe(depois)} onClick={() => setSel(depois)} style={cabe(depois) ? passo : passoOff}>
            <Plus size={20} strokeWidth={2.2} />
          </button>
        </div>

        {/* atalhos pelo dia em que o cliente recebe */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: colors.gray[500], textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>
            Dia que o cliente recebe
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {ATALHOS.map(n => {
              const ymd = atalho(n)
              const ativo = !!ymd && ymd === sel
              return (
                <button
                  key={n}
                  type="button"
                  disabled={!ymd}
                  onClick={() => { if (ymd) setSel(ymd) }}
                  style={{
                    minHeight: 40, padding: '8px 13px', borderRadius: 999, fontSize: 13, fontWeight: 600,
                    fontFamily: typography.fontFamily, cursor: ymd ? 'pointer' : 'not-allowed', opacity: ymd ? 1 : 0.35,
                    border: `1px solid ${ativo ? colors.gray[900] : colors.gray.borderMd}`,
                    background: ativo ? colors.gray[900] : '#fff', color: ativo ? '#fff' : colors.gray[900],
                  }}
                >
                  dia {n}{ymd ? ` · ${ddmm(ymd).slice(3)}` : ''}
                </button>
              )
            })}
          </div>
          <div style={{ fontSize: 11.5, color: colors.gray[500], marginTop: 8 }}>
            Dá para escolher de {ddmm(menor)} a {ddmm(maior)}.
          </div>
        </div>

        {/* o que vai acontecer */}
        <div style={{ borderRadius: 12, background: 'rgba(0,0,0,0.035)', padding: '11px 12px', display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, color: colors.gray[700] }}>
          {mudou ? (
            <>
              <span>Próximo vencimento: <b style={{ color: colors.gray[900] }}>{ddmmyyyy(atual)}</b> → <b style={{ color: colors.gray[900] }}>{ddmmyyyy(sel)}</b></span>
              <span>Depois: <b style={{ color: colors.gray[900] }}>{ddmm(proximoMes(sel))}</b>, <b style={{ color: colors.gray[900] }}>{ddmm(proximoMes(proximoMes(sel)))}</b>…</span>
              <span style={{ color: diff > 0 ? inkLight.warn.text : colors.gray[700] }}>
                {diff > 0
                  ? `O cliente ganha ${diff} dia${diff > 1 ? 's' : ''} neste ciclo.`
                  : `O cliente perde ${-diff} dia${diff < -1 ? 's' : ''} neste ciclo.`}
              </span>
            </>
          ) : (
            <span>Escolha a nova data. Hoje vence <b style={{ color: colors.gray[900] }}>{ddmmyyyy(atual)}</b>.</span>
          )}
        </div>

        {error && (
          <div role="alert" style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12.5, color: inkLight.bad.text, background: inkLight.bad.bg, borderRadius: 10, padding: '9px 11px' }}>
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{error}</span>
          </div>
        )}

        <button
          type="button"
          onClick={salvar}
          disabled={!mudou || saving}
          style={{
            minHeight: 50, borderRadius: 14, border: 'none', fontSize: 15, fontWeight: 700, fontFamily: typography.fontFamily,
            background: !mudou || saving ? 'rgba(0,0,0,0.10)' : colors.red.DEFAULT,
            color: !mudou || saving ? colors.gray[500] : '#fff',
            cursor: !mudou || saving ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {saving && <Loader2 size={16} style={{ animation: 'club-spin 0.8s linear infinite' }} />}
          {saving ? 'Salvando…' : 'Salvar novo vencimento'}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          style={{ minHeight: 40, border: 'none', background: 'transparent', color: colors.gray[700], fontSize: 13, fontWeight: 600, fontFamily: typography.fontFamily, cursor: 'pointer' }}
        >
          Cancelar
        </button>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
