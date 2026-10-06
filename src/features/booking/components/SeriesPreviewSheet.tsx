'use client'
// src/features/booking/components/SeriesPreviewSheet.tsx
// @eligi:series-preview-sheet
//
// Previa da serie, data a data, ANTES de gravar. Contrato do back
// (bookings.series.service.ts):
//   POST /bookings/series/preview -> { occurrences: [{ index, date, status, conflict, warnings }] }
//   POST /bookings/series         -> cria tudo ou nada (skipIndexes, overlapIndexes, idempotencyKey)
//
// Regras de tela:
//   - data em CONFLITO exige decisao (pular ou sobrepor) antes de salvar;
//   - data LIVRE pode ser pulada com um toque;
//   - avisos (folga, fora do expediente, almoco, bloqueio) so informam: o
//     painel nunca barrou agendamento manual por eles (Decisao B).
//   - 409 SERIES_CONFLICT = alguem ocupou uma data entre a previa e o salvar:
//     recarrega a previa e pede a decisao so das datas novas.

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2, AlertTriangle, Check, Repeat, Coffee, Moon, Clock, Ban } from 'lucide-react'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import api from '@/shared/lib/apiClient'
import { colors, inkLight, radius, shadows, transitions, typography } from '@/shared/theme'

type Warning = 'DAY_OFF' | 'OUTSIDE_HOURS' | 'LUNCH' | 'BLOCKED'

interface Occurrence {
  index:    number
  date:     string
  startAt:  string
  endAt:    string
  status:   'FREE' | 'CONFLICT'
  conflict: { bookingId: string; clientName: string; start: string; end: string } | null
  warnings: Warning[]
}

interface Preview {
  intervalWeeks: number
  startTime:     string
  durationMin:   number
  occurrences:   Occurrence[]
  keptCount?:    number  // @eligi:series-move-sps-kept — so no modo 'move': datas pagas que ficam
}

export interface SeriesCreated {
  seriesId: string
  created:  { id: string; seriesIndex: number; startAt: string }[]
  skipped:  number[]
}

type Decision = 'skip' | 'overlap'

const WARN: Record<Warning, { label: string; Icon: typeof Coffee }> = {
  DAY_OFF:       { label: 'Folga',             Icon: Moon },
  OUTSIDE_HOURS: { label: 'Fora do expediente', Icon: Clock },
  LUNCH:         { label: 'Almoço',            Icon: Coffee },
  BLOCKED:       { label: 'Bloqueado',         Icon: Ban },
}

interface ApiError {
  response?: { status?: number; data?: { code?: string; error?: string | { message?: string }; details?: { indexes?: number[] } | null } }
}

function errorText(e: ApiError, fallback: string): string {
  const err = e.response?.data?.error
  if (typeof err === 'string') return err
  if (err && typeof err.message === 'string') return err.message
  return fallback
}

interface Props {
  /** JSON do pedido (servico, profissional, cliente, inicio, regra). String
   *  para o efeito depender de um primitivo, nao de um objeto recriado. */
  requestJson: string
  isMobile:    boolean
  onClose:     () => void
  onDone?:     (r: SeriesCreated) => void
  // @eligi:series-move-sps-props — a mesma previa serve "mudar este e os proximos"
  mode?:        'create' | 'move'
  previewPath?: string
  confirmPath?: string
  onMoved?:     () => void
}

export default function SeriesPreviewSheet({
  requestJson, isMobile, onClose, onDone,
  mode = 'create', previewPath = '/bookings/series/preview', confirmPath = '/bookings/series', onMoved,
}: Props) {
  const isMove = mode === 'move'
  const semPermissao = isMove
    ? 'Só o dono ou o gerente pode mudar a série.'
    : 'Só o dono ou o gerente pode criar agendamento recorrente.'
  const [preview,   setPreview]   = useState<Preview | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [decisions, setDecisions] = useState<Record<number, Decision>>({})
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [notice,    setNotice]    = useState<string | null>(null)
  const [reload,    setReload]    = useState(0)
  // Chave de idempotencia da TENTATIVA: duplo clique ou rede caindo depois do
  // servidor gravar nao criam duas series. Zera quando o pedido muda.
  const keyRef = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false
    api.post(previewPath, JSON.parse(requestJson)) // @eligi:series-move-sps-fetch
      .then(res => {
        if (cancelled) return
        const data = (res.data?.data ?? res.data) as Preview
        setPreview(data)
        setLoadError(null)
      })
      .catch((e: ApiError) => {
        if (cancelled) return
        setLoadError(e.response?.status === 403
          ? semPermissao // @eligi:series-move-sps-403load
          : errorText(e, 'Não foi possível montar a prévia das datas.'))
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [requestJson, reload, previewPath, semPermissao]) // @eligi:series-move-sps-deps

  const occ = preview?.occurrences ?? []
  const conflicts = occ.filter(o => o.status === 'CONFLICT')
  const undecided = conflicts.filter(o => !decisions[o.index])
  const toCreate  = occ.filter(o => decisions[o.index] !== 'skip')
  const canSave   = !loading && !saving && !!preview && undecided.length === 0 && toCreate.length > 0

  function decide(index: number, d: Decision | null) {
    keyRef.current = null
    setDecisions(prev => {
      const next = { ...prev }
      if (d) next[index] = d
      else delete next[index]
      return next
    })
  }

  function toggleFree(index: number) {
    decide(index, decisions[index] === 'skip' ? null : 'skip')
  }

  async function handleConfirm() {
    if (!canSave) return
    if (!keyRef.current) {
      keyRef.current = globalThis.crypto?.randomUUID?.() ?? `srs_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`
    }
    const skipIndexes    = Object.entries(decisions).filter(([, d]) => d === 'skip').map(([i]) => Number(i))
    const overlapIndexes = Object.entries(decisions).filter(([, d]) => d === 'overlap').map(([i]) => Number(i))
    setSaving(true)
    setError(null)
    setNotice(null)
    try {
      // @eligi:series-move-sps-confirm — remarcar nao leva chave: repetir o
      // mesmo pedido da diferenca de 0 dias no back, ou seja, nao muda nada.
      if (isMove) {
        await api.post(confirmPath, { ...JSON.parse(requestJson), skipIndexes, overlapIndexes })
        onMoved?.()
        return
      }
      const res = await api.post(confirmPath, {
        ...JSON.parse(requestJson),
        skipIndexes,
        overlapIndexes,
        idempotencyKey: keyRef.current,
      })
      onDone?.((res.data?.data ?? res.data) as SeriesCreated) // @eligi:series-move-sps-ondone
    } catch (err) {
      const e = err as ApiError
      const code = e.response?.data?.code
      if (code === 'SERIES_CONFLICT') {
        // Alguem ocupou data(s) agora ha pouco. Nada foi gravado: recarrega a
        // previa e limpa so a decisao das datas que mudaram.
        const idx = e.response?.data?.details?.indexes ?? []
        setDecisions(prev => {
          const next = { ...prev }
          for (const i of idx) delete next[i]
          return next
        })
        keyRef.current = null
        setNotice(idx.length === 1
          ? 'Uma data foi ocupada agora há pouco. Escolha o que fazer com ela.'
          : 'Algumas datas foram ocupadas agora há pouco. Escolha o que fazer com elas.')
        setLoading(true)
        setReload(n => n + 1)
      } else if (e.response?.status === 403) {
        setError(semPermissao) // @eligi:series-move-sps-403save
      } else {
        setError(errorText(e, 'Não foi possível salvar a série. Nada foi gravado.'))
      }
      setSaving(false)
    }
  }

  const sheet: React.CSSProperties = isMobile ? {
    position: 'fixed', left: 0, right: 0, bottom: 0, maxHeight: '92dvh',
    borderRadius: `${radius['2xl']}px ${radius['2xl']}px 0 0`,
    animation: 'sps-up 0.28s cubic-bezier(0.34,1.2,0.64,1)',
  } : {
    position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
    width: 480, maxWidth: '92vw', maxHeight: '86vh', borderRadius: radius['3xl'],
    animation: 'sps-in 0.22s cubic-bezier(0.34,1.56,0.64,1)',
  }

  const content = (
    <>
      <style>{`
        @keyframes sps-up{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes sps-in{from{opacity:0;transform:translate(-50%,-50%) scale(0.95)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
        @keyframes sps-spin{to{transform:rotate(360deg)}}
        @media (prefers-reduced-motion:reduce){.sps-sheet{animation:none !important}}
        .sps-row{display:flex;align-items:flex-start;gap:12px;padding:12px 18px;border-bottom:1px solid ${colors.gray.border}}
        .sps-row.skip{opacity:.5}
        .sps-chk{width:26px;height:26px;border-radius:8px;border:1.5px solid ${colors.gray.borderMd};background:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer;margin-top:1px}
        .sps-chk[aria-checked="true"]{background:${colors.red.gradient};border-color:transparent}
        .sps-seg{display:flex;gap:6px;margin-top:8px}
        .sps-seg button{flex:1;min-height:40px;padding:6px 8px;border-radius:${radius.sm}px;border:1px solid ${colors.gray.borderMd};background:#fff;font-size:13.5px;font-weight:600;color:${colors.gray[700]};cursor:pointer;font-family:${typography.fontFamily};transition:all ${transitions.fast}}
        .sps-seg button[aria-pressed="true"]{background:${colors.gray[900]};color:#fff;border-color:transparent}
        .sps-chk:focus-visible,.sps-seg button:focus-visible,.sps-btn:focus-visible{outline:2px solid ${colors.red.DEFAULT};outline-offset:2px}
        .sps-btn{flex:2;min-height:50px;border-radius:${radius.sm}px;border:none;font-size:14px;font-weight:700;letter-spacing:.04em;cursor:pointer;font-family:${typography.fontFamily};color:#fff;background:${colors.red.gradient};box-shadow:${shadows.redMd}}
        .sps-btn:disabled{background:rgba(0,0,0,0.06);color:rgba(0,0,0,0.3);box-shadow:none;cursor:not-allowed}
        .sps-back{flex:1;min-height:50px;border-radius:${radius.sm}px;border:1px solid ${colors.gray.borderMd};background:transparent;font-size:13px;font-weight:600;color:${colors.gray[700]};cursor:pointer;font-family:${typography.fontFamily}}
      `}</style>

      <div onClick={saving ? undefined : onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.28)', backdropFilter: 'blur(8px)', zIndex: 10998 }} />
      <div
        className="sps-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sps-title"
        style={{
          ...sheet, background: 'rgba(255,255,255,0.99)', boxShadow: shadows.lg, zIndex: 10999,
          display: 'flex', flexDirection: 'column', fontFamily: typography.fontFamily, overflow: 'hidden',
          paddingBottom: isMobile ? 'env(safe-area-inset-bottom)' : 0,
        }}
      >
        {isMobile && <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 2px', flexShrink: 0 }}><div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.12)' }} /></div>}

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '16px 18px 12px', borderBottom: `1px solid ${colors.gray.border}`, flexShrink: 0 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: colors.red.subtle, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Repeat size={19} color={colors.red.DEFAULT} strokeWidth={2.2} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 id="sps-title" style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', color: colors.gray[900], fontFamily: typography.fontFamilyDisplay }}>
              {isMove ? 'Confira as mudanças' : 'Confira as datas'}{/* @eligi:series-move-sps-title */}
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: 13, color: colors.gray[700] }}>
              {preview
                ? `${toCreate.length} de ${occ.length} ${occ.length === 1 ? 'data' : 'datas'} · ${preview.startTime} · ${preview.durationMin} min`
                : 'Montando as datas...'}
            </p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Fechar"
            style={{ width: 32, height: 32, borderRadius: 10, border: `1px solid ${colors.gray.borderMd}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <X size={15} color={colors.gray[700]} strokeWidth={2.5} />
          </button>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {(notice || error || (undecided.length > 0 && !loading)) && (
            <div style={{ padding: '12px 18px 0' }}>
              {notice && <Banner tone="warn" text={notice} />}
              {error && <Banner tone="bad" text={error} />}
              {!notice && !error && undecided.length > 0 && (
                <Banner tone="warn" text={undecided.length === 1
                  ? `1 data já tem agendamento nesse horário. Escolha ${isMove ? 'manter como está' : 'pular'} ou sobrepor.` /* @eligi:series-move-sps-banner */
                  : `${undecided.length} datas já têm agendamento nesse horário. Escolha ${isMove ? 'manter como está' : 'pular'} ou sobrepor em cada uma.`} />
              )}
            </div>
          )}

          {isMove && !loading && (preview?.keptCount ?? 0) > 0 && ( /* @eligi:series-move-sps-paidinfo */
            <div style={{ padding: '12px 18px 0' }}>
              <Banner tone="warn" text={(preview?.keptCount ?? 0) === 1
                ? '1 data já paga fica como está.'
                : `${preview?.keptCount ?? 0} datas já pagas ficam como estão.`} />
            </div>
          )}
          {loading ? (
            <div style={{ padding: 48, display: 'flex', justifyContent: 'center' }}>
              <Loader2 size={26} color={colors.red.DEFAULT} style={{ animation: 'sps-spin 0.8s linear infinite' }} />
            </div>
          ) : loadError ? (
            <div style={{ padding: '32px 24px', textAlign: 'center' }}>
              <AlertTriangle size={30} color={inkLight.bad.text} style={{ marginBottom: 10 }} />
              <p style={{ margin: 0, fontSize: 15, color: colors.gray[900], lineHeight: 1.5 }}>{loadError}</p>
            </div>
          ) : (
            <div role="list" style={{ marginTop: 6 }}>
              {occ.map((o, pos) => { /* @eligi:series-move-sps-pos */
                const d = decisions[o.index]
                const skipped = d === 'skip'
                const dt = dayjs(o.date).locale('pt-br')
                return (
                  <div key={o.index} role="listitem" className={`sps-row${skipped ? ' skip' : ''}`}>
                    {o.status === 'FREE' ? (
                      <button type="button" className="sps-chk" role="checkbox" aria-checked={!skipped}
                        aria-label={`${isMove ? (skipped ? 'Mudar' : 'Manter') : (skipped ? 'Incluir' : 'Pular')} ${dt.format('DD/MM')}` /* @eligi:series-move-sps-aria */}
                        onClick={() => toggleFree(o.index)}>
                        {!skipped && <Check size={15} color="#fff" strokeWidth={3} />}
                      </button>
                    ) : (
                      <span aria-hidden style={{ width: 26, height: 26, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: inkLight.warn.bg, flexShrink: 0, marginTop: 1 }}>
                        <AlertTriangle size={14} color={inkLight.warn.text} strokeWidth={2.4} />
                      </span>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <span style={{ fontSize: 15.5, fontWeight: 700, color: colors.gray[900], letterSpacing: '-0.01em', textTransform: 'capitalize' }}>
                          {dt.format('ddd, DD [de] MMM')}
                        </span>
                        {pos === 0 /* @eligi:series-move-sps-first */ && <span style={{ fontSize: 12, fontWeight: 700, color: colors.gray[700] }}>esta</span>}
                      </div>
                      {o.conflict && (
                        <div style={{ fontSize: 13, color: inkLight.warn.text, marginTop: 2 }}>
                          Já tem {o.conflict.clientName} das {o.conflict.start} às {o.conflict.end}
                        </div>
                      )}
                      {o.warnings.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                          {o.warnings.map(w => {
                            const { label, Icon } = WARN[w]
                            return (
                              <span key={w} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, padding: '3px 8px', borderRadius: 7, background: inkLight.neutral.bg, color: inkLight.neutral.text, border: `1px solid ${inkLight.neutral.border}` }}>
                                <Icon size={12} strokeWidth={2.2} />{label}
                              </span>
                            )
                          })}
                        </div>
                      )}
                      {o.status === 'CONFLICT' && (
                        <div className="sps-seg">
                          <button type="button" aria-pressed={d === 'skip'} onClick={() => decide(o.index, 'skip')}>{isMove ? 'Manter como está' : 'Pular esta data' /* @eligi:series-move-sps-keep */}</button>
                          <button type="button" aria-pressed={d === 'overlap'} onClick={() => decide(o.index, 'overlap')}>Sobrepor</button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, padding: '12px 18px 16px', borderTop: `1px solid ${colors.gray.border}`, flexShrink: 0 }}>
          <button type="button" className="sps-back" onClick={onClose} disabled={saving}>VOLTAR</button>
          <button type="button" className="sps-btn" onClick={handleConfirm} disabled={!canSave}>
            {saving ? 'SALVANDO...' /* @eligi:series-move-sps-btn */ : toCreate.length > 0 ? `${isMove ? 'MUDAR' : 'AGENDAR'} ${toCreate.length} ${toCreate.length === 1 ? 'DATA' : 'DATAS'}` : 'NENHUMA DATA'}
          </button>
        </div>
      </div>
    </>
  )

  if (typeof document === 'undefined') return null
  return createPortal(content, document.body)
}

function Banner({ tone, text }: { tone: 'warn' | 'bad'; text: string }) {
  const t = tone === 'warn' ? inkLight.warn : inkLight.bad
  return (
    <div role="alert" style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 12px', borderRadius: radius.sm, background: t.bg, border: `1px solid ${t.border}`, color: t.text, fontSize: 13.5, lineHeight: 1.45, marginBottom: 8 }}>
      <AlertTriangle size={15} strokeWidth={2.2} style={{ flexShrink: 0, marginTop: 1 }} />
      <span>{text}</span>
    </div>
  )
}
