'use client'
// src/app/dashboard/financeiro/comissoes/components/owner/OwnerCommissionsView.tsx
// @eligi:ocf-view — Comissoes do dono e do gerente, direcao "A + pessoa da C" (nov/2026).
//
// Topo: quanto falta pagar a equipe. "A pagar" e uma fila do que pede acao:
//   1. a semana fechada (uma linha por pessoa + botao Gerar)
//   2. pagamentos gerados esperando "Marcar como pago"
//   3. partes do pote do clube sem baixa
// e, por fim, a semana em andamento (so informa). Tocar numa pessoa abre os
// itens dela: coluna da direita no computador, folha no celular.
//
// Botao Gerar: verde quando ha periodo fechado; grafite com cadeado e a data em
// que libera quando so ha a semana em andamento; some quando nao ha nada.
// Gerente: ve tudo, mas so o dono gera, marca como pago e da baixa (rotas ownerOnly).

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, Lock, Settings2, WifiOff } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { useAuth } from '@/hooks/useAuth'
import { useDeviceMode } from '@/features/agenda/hooks/useDeviceMode'
import { canAccessRoute } from '@/app/components/navigation/routeAccess'
import type { PayoutListItem, PayoutSettings, PendingSummaryResponse } from '@/features/payouts/types'
import FinanceBackLink from '../../../components/FinanceBackLink'
import PayoutSettingsModal from '../PayoutSettingsModal'
import MarkAsPaidModal from '../MarkAsPaidModal'
import PayoutsHistoryTab from '../PayoutsHistoryTab'
import ClubPaySheet from '../ClubPaySheet'
import {
  ProfChips, PeriodPicker, DEFAULT_PERIOD, periodRange, periodText, TypeChips,
  type FilterProf, type PeriodFilter, type TypeFilter,
} from '../CommissionFilters'
import { MC_CSS } from '../my/mcStyles'
import { Money, MoneyFlat } from '../my/mcParts'
import { addDaysKey, dayKeySP, periodTrack, shortDate, weekdayDate, weekdayOfKey } from '../my/mcFormat'
import ClubCommissionsTab, { clubPeriodLabel, type ClubCommItem, type ClubCommOwner, type ClubCommPeriod } from './ClubTab'
import PersonDetail, { PersonSheet } from './PersonDetail'
import { Avatar, freqText, kindWord, periodTxt, toPerson, type OcPerson } from './ocParts'
import { OC_CSS } from './ocStyles'

type Seg = 'pay' | 'paid' | 'club'
const WD_FULL = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
const EMPTY: PendingSummaryResponse = { closedPeriod: null, professionals: [] }

interface Loaded {
  summary:  PendingSummaryResponse
  settings: PayoutSettings | null
  payouts:  PayoutListItem[]
  club:     ClubCommOwner | null
  loadedAt: number
}

function dataOf<T>(r: PromiseSettledResult<{ data?: { data?: unknown } }>): T | null {
  return r.status === 'fulfilled' ? ((r.value.data?.data ?? null) as T | null) : null
}

async function loadAll(isOwner: boolean): Promise<Loaded> {
  const [sum, set, pay, club] = await Promise.allSettled([
    api.get('/payouts/commissions/pending-summary'),
    api.get('/payouts/settings'),
    isOwner ? api.get('/payouts', { params: { status: 'PENDING', limit: 100 } }) : Promise.resolve({ data: { data: [] } }),
    api.get('/club-settlements/commissions'),
  ])
  if (sum.status === 'rejected') throw sum.reason
  const s = dataOf<PendingSummaryResponse>(sum)
  const summary: PendingSummaryResponse = s && !Array.isArray(s)
    ? { ...EMPTY, ...s, professionals: Array.isArray(s.professionals) ? s.professionals : [] }
    : EMPTY
  const payouts = dataOf<PayoutListItem[]>(pay)
  const c = dataOf<ClubCommOwner>(club)
  return {
    summary,
    settings: dataOf<PayoutSettings>(set),
    payouts: Array.isArray(payouts) ? payouts : [],
    club: c && c.scope === 'owner' && Array.isArray(c.periods) ? c : null,
    loadedAt: Date.now(),
  }
}

/** Dia em que o periodo em andamento libera: o dia seguinte ao fim. "segunda, 17 nov" */
function releaseText(endIso: string): string {
  const k = addDaysKey(dayKeySP(endIso), 1)
  return `${WD_FULL[weekdayOfKey(k)]}, ${shortDate(k)}`
}

interface ClubPending { p: ClubCommPeriod; it: ClubCommItem }

export default function OwnerCommissionsView() {
  const { user } = useAuth()
  const router = useRouter()
  const isMobile = useDeviceMode() === 'mobile'
  const role = user?.role ?? null
  const isOwner = role === 'BUSINESS_OWNER'

  const [seg, setSeg] = useState<Seg>('pay')
  const [data, setData] = useState<Loaded | null>(null)
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')
  const [selId, setSelId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [paying, setPaying] = useState<PayoutListItem | null>(null)
  const [clubPaying, setClubPaying] = useState<ClubPending | null>(null)
  const [generating, setGenerating] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [refresh, setRefresh] = useState(0)
  const reqRef = useRef(0)

  // filtros de Pagos e Clube
  const [profs, setProfs] = useState<FilterProf[]>([])
  const [profFilter, setProfFilter] = useState<string | null>(null)
  const [period, setPeriod] = useState<PeriodFilter>(DEFAULT_PERIOD)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')

  const reload = useCallback(() => {
    if (!role) return
    const token = ++reqRef.current
    loadAll(isOwner)
      .then(d => { if (token === reqRef.current) { setData(d); setStatus('ok') } })
      .catch(() => { if (token === reqRef.current) setStatus('error') })
  }, [role, isOwner])

  useEffect(() => { reload() }, [reload])

  useEffect(() => {
    if (!role) return
    let alive = true
    api.get('/equipe')
      .then(res => {
        const raw = res.data?.data ?? res.data ?? []
        const list: unknown[] = Array.isArray(raw) ? raw : []
        const out = list
          .filter((p): p is { id: string; name: string; avatarUrl?: string | null; active?: boolean } =>
            typeof p === 'object' && p !== null && typeof (p as { id?: unknown }).id === 'string' && typeof (p as { name?: unknown }).name === 'string')
          .map(p => ({ id: p.id, name: p.name, avatarUrl: p.avatarUrl ?? null, active: p.active !== false }))
          .sort((a, b) => Number(b.active) - Number(a.active))
        if (alive) setProfs(out)
      })
      .catch(() => { if (alive) setProfs([]) })
    return () => { alive = false }
  }, [role])

  const generate = useCallback(() => {
    setGenerating(true)
    setMsg(null)
    api.post('/payouts/generate')
      .then(res => {
        const n = Number(res.data?.data?.generated ?? 0)
        setMsg(n > 0
          ? { ok: true, text: `${n} pagamento${n !== 1 ? 's' : ''} gerado${n !== 1 ? 's' : ''}. Agora é só marcar como pago quando pagar.` }
          : { ok: false, text: 'Nenhum pagamento foi gerado. Confira as configurações de pagamento.' })
        setSelId(null)
        reload()
      })
      .catch((e: unknown) => {
        const err = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
        setMsg({ ok: false, text: err ?? 'Não deu para gerar agora. Tente de novo.' })
      })
      .finally(() => setGenerating(false))
  }, [reload])

  const closeSheet = useCallback(() => setSheetOpen(false), [])

  function pickPerson(id: string) {
    setSelId(id)
    if (!window.matchMedia('(min-width: 1024px)').matches) setSheetOpen(true)
  }

  const fin = canAccessRoute(user?.role, '/dashboard/financeiro') ? <FinanceBackLink /> : null
  const css = <style>{MC_CSS + OC_CSS}</style>

  if (!role || status === 'loading' || (!data && status !== 'error')) {
    return (
      <div className="mc-page oc-page" aria-busy="true" aria-label="Carregando">
        {css}
        <div className="mc-sk" style={{ width: 160, height: 12, marginTop: 6 }} />
        <div className="mc-sk" style={{ width: 220, height: 44, margin: '14px 0' }} />
        <div className="mc-sk" style={{ width: '100%', height: 46, marginBottom: 14 }} />
        <div className="mc-sk" style={{ width: '100%', height: 260, borderRadius: 16 }} />
      </div>
    )
  }

  if (status === 'error' || !data) {
    return (
      <div className="mc-page oc-page">
        {css}
        {fin}
        <section className="mc-card mc-state">
          <div className="ico"><WifiOff size={24} aria-hidden /></div>
          <h3>Não deu para carregar as comissões</h3>
          <p>Confira a internet e tente de novo.</p>
          <button className="mc-btn" style={{ marginTop: 16 }} onClick={() => { setStatus('loading'); reload() }}>Tentar de novo</button>
        </section>
      </div>
    )
  }

  // ── Derivados ──────────────────────────────────────────────────────────────
  const { summary, settings, payouts, club, loadedAt } = data
  const configured = Boolean(settings?.id && settings.enabled)
  const people = summary.professionals.map(toPerson)
  const cp = summary.closedPeriod
  const cur = summary.currentPeriod ?? null
  const closedPeople = cp ? people.filter(p => p.closedTotal > 0) : []
  const closedSum = closedPeople.reduce((s, p) => s + p.closedTotal, 0)
  const openPeople = people.filter(p => p.openTotal > 0)
  const openSum = openPeople.reduce((s, p) => s + p.openTotal, 0)
  const queued = summary.queuedTotal ?? 0
  const payoutsSum = payouts.reduce((s, p) => s + p.totalAmount, 0)
  const clubPending: ClubPending[] = (club?.periods ?? []).flatMap(p => p.items.filter(it => !it.paidAt).map(it => ({ p, it })))
  const clubSum = clubPending.reduce((s, c) => s + c.it.amount, 0)
  const clubByProf = new Map<string, number>()
  clubPending.forEach(c => clubByProf.set(c.it.professionalId, (clubByProf.get(c.it.professionalId) ?? 0) + c.it.amount))
  const unconfiguredSum = configured ? 0 : summary.professionals.reduce((s, p) => s + p.total, 0)
  const total = configured ? closedSum + queued + payoutsSum + clubSum : unconfiguredSum + payoutsSum + clubSum

  const mode: 'closed' | 'locked' | 'none' = closedPeople.length > 0 ? 'closed' : cur && openPeople.length > 0 ? 'locked' : 'none'
  const list = mode === 'closed' ? closedPeople : mode === 'locked' ? openPeople : []
  const sel: OcPerson | null = list.find(p => p.id === selId) ?? list[0] ?? null
  const kind = kindWord(settings)
  const cardRange = mode === 'closed' && cp ? periodTxt(settings, cp.start, cp.end) : cur ? periodTxt(settings, cur.start, cur.end) : ''
  const detailFrom = mode === 'closed' && cp ? cp.start : cur?.start ?? null
  const detailTo = mode === 'closed' && cp ? cp.end : cur?.end ?? null
  const things = (mode === 'closed' || (!configured && unconfiguredSum > 0) ? 1 : 0) + payouts.length + clubPending.length

  // numeracao da fila: so conta o que aparece
  const nWeek = mode === 'closed' ? 1 : 0
  const nPayouts = nWeek + (payouts.length > 0 ? 1 : 0)
  const nClub = nPayouts + (clubPending.length > 0 ? 1 : 0)

  const detail = sel ? (
    <PersonDetail
      key={sel.id}
      person={sel}
      from={detailFrom}
      to={detailTo}
      rangeTxt={`${kind} ${cardRange}`}
      status={mode === 'closed' ? 'closed' : 'open'}
      openTotal={sel.openTotal}
      canAct={isOwner}
    />
  ) : null

  const segs: Array<[Seg, string]> = isOwner ? [['pay', 'A pagar'], ['paid', 'Pagos'], ['club', 'Clube']] : [['pay', 'A pagar'], ['club', 'Clube']]

  return (
    <div className="mc-page oc-page">
      {css}
      {fin}
      <h1 className="mc-h1" style={{ marginBottom: 6 }}>Comissões</h1>

      <header className="oc-head">
        <div className="mc-min0" style={{ flex: 1 }}>
          <span className="mc-eyebrow">A pagar à equipe</span>
          <div className="oc-big"><Money v={total} /></div>
          <div className="oc-sub">
            {things > 0 ? `${things} ${things === 1 ? 'coisa pede' : 'coisas pedem'} você · ` : 'Tudo em dia · '}
            {freqText(settings)}
          </div>
        </div>
        {isOwner && (
          <button className="oc-gear" aria-label="Configurar pagamentos" onClick={() => setShowSettings(true)}>
            <Settings2 size={20} aria-hidden />
          </button>
        )}
      </header>

      <div className={`mc-seg oc-seg${segs.length === 2 ? ' two' : ''}`} role="tablist" aria-label="Comissões">
        {segs.map(([k, label]) => (
          <button key={k} role="tab" aria-selected={seg === k} onClick={() => setSeg(k)}>{label}</button>
        ))}
      </div>

      {seg === 'pay' && (
        <div className="oc-split">
          <div className="oc-col">
            {!configured ? (
              <section className="mc-card oc-card">
                <span className="mc-eyebrow">Pagamentos</span>
                <h2 className="oc-title">Configure quando a equipe recebe</h2>
                <div className="oc-hint">
                  {unconfiguredSum > 0
                    ? <>Há <MoneyFlat v={unconfiguredSum} /> em comissões esperando. Escolha a frequência e o dia de pagamento para fechar os períodos.</>
                    : 'Escolha a frequência e o dia de pagamento para fechar os períodos.'}
                </div>
                {isOwner
                  ? <button className="oc-go lock" style={{ cursor: 'pointer' }} onClick={() => setShowSettings(true)}><Settings2 size={18} aria-hidden /><span>Configurar pagamentos</span></button>
                  : <div className="oc-note">Só o dono configura os pagamentos.</div>}
              </section>
            ) : (
              <section className="mc-card oc-card" aria-label={`${kind} ${cardRange}`}>
                {mode === 'none' ? (
                  <div className="oc-empty"><b>Nada para gerar agora</b>Quando a equipe fizer atendimentos, a {kind} aparece aqui.</div>
                ) : (
                  <>
                    <div className="oc-step">
                      <span className="mc-eyebrow">{mode === 'closed' ? `${nWeek} · ` : ''}{kind} {cardRange}</span>
                      <span className={`oc-pill ${mode === 'closed' ? 'done' : 'wait'}`}>{mode === 'closed' ? 'Fechada' : 'Em andamento'}</span>
                    </div>
                    <h2 className="oc-title">
                      {mode === 'closed' ? `Gerar os pagamentos da ${kind}` : <>Até agora: <MoneyFlat v={openSum} /></>}
                    </h2>
                    <div className="oc-hint">
                      Toque em alguém para ver os itens
                      {mode === 'closed' && cp ? ` · paga ${weekdayDate(dayKeySP(cp.scheduledFor))}` : ''}
                    </div>
                    <div className="oc-people">
                      {list.map(p => {
                        const clubV = clubByProf.get(p.id) ?? 0
                        const v = mode === 'closed' ? p.closedTotal : p.openTotal
                        return (
                          <button key={p.id} className="oc-person" aria-current={sel?.id === p.id} onClick={() => pickPerson(p.id)}>
                            <Avatar name={p.name} url={p.avatarUrl} />
                            <span className="mc-min0">
                              <span className="nm mc-ell" style={{ display: 'block' }}>{p.name}</span>
                              <span className="sm">
                                {clubV > 0 && <span className="oc-club">clube <MoneyFlat v={clubV} /></span>}
                                {mode === 'closed' && p.openTotal > 0 && <span>{kind} atual <MoneyFlat v={p.openTotal} /></span>}
                                {mode === 'locked' && <span>{p.openCount} {p.openCount === 1 ? 'item' : 'itens'}</span>}
                              </span>
                            </span>
                            <span className="v mc-num">R$ {v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            <ChevronRight size={16} aria-hidden />
                          </button>
                        )
                      })}
                    </div>
                    {mode === 'closed' && (
                      isOwner ? (
                        <button className="oc-go ok" onClick={generate} disabled={generating}>
                          <span>{generating ? 'Gerando…' : `Gerar ${closedPeople.length} pagamento${closedPeople.length !== 1 ? 's' : ''} · `}</span>
                          {!generating && <MoneyFlat v={closedSum} />}
                        </button>
                      ) : <div className="oc-note">Só o dono gera os pagamentos.</div>
                    )}
                    {mode === 'locked' && cur && (
                      <button className="oc-go lock" disabled aria-disabled="true">
                        <Lock size={17} aria-hidden /><span>Libera {releaseText(cur.end)}</span>
                      </button>
                    )}
                    {mode === 'closed' && queued > 0 && (
                      <div className="oc-note">Depois deste, ainda há <MoneyFlat v={queued} /> de períodos anteriores esperando: gere de novo para fechar.</div>
                    )}
                  </>
                )}
                {msg && <div className={`oc-msg ${msg.ok ? 'ok' : 'bad'}`} role="status">{msg.text}</div>}
              </section>
            )}

            {payouts.length > 0 && (
              <section className="mc-card oc-card">
                <div className="oc-step">
                  <span className="mc-eyebrow">{nPayouts} · Pagamentos gerados</span>
                  <span className="oc-pill run">{payouts.length} a pagar</span>
                </div>
                <h2 className="oc-title">Marcar como pago</h2>
                <div className="oc-hint">Toque na pessoa para ver o pagamento</div>
                <div>
                  {payouts.map(po => (
                    <div key={po.id} className="oc-line">
                      <button className="oc-who" aria-label={`Ver pagamento de ${po.professional.name}`} onClick={() => router.push(`/dashboard/financeiro/comissoes/${po.id}`)}>
                        <Avatar name={po.professional.name} url={po.professional.avatarUrl} />
                        <span className="mc-min0">
                          <span className="nm mc-ell" style={{ display: 'block' }}>{po.professional.name}</span>
                          <span className="sm mc-ell" style={{ display: 'block' }}>
                            {periodTxt(settings, po.periodStart, po.periodEnd)} · paga {weekdayDate(dayKeySP(po.scheduledFor))}
                          </span>
                        </span>
                      </button>
                      <span className="rt">
                        <span className="v"><MoneyFlat v={po.totalAmount} /></span>
                        <button className="oc-btn2" onClick={() => setPaying(po)}>Marcar como pago</button>
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {clubPending.length > 0 && (
              <section className="mc-card oc-card">
                <div className="oc-step">
                  <span className="mc-eyebrow">{nClub} · Clube</span>
                  <span className="oc-pill run">{clubPending.length} sem baixa</span>
                </div>
                <h2 className="oc-title">Dar baixa na parte do pote</h2>
                <div className="oc-hint">{isOwner ? 'Registre quando pagar a parte de cada um' : 'Só o dono dá baixa'}</div>
                <div>
                  {clubPending.map(c => (
                    <div key={c.it.itemId} className="oc-line">
                      <div className="oc-who">
                        <Avatar name={c.it.professionalName} url={c.it.professionalAvatar} />
                        <div className="mc-min0">
                          <div className="nm mc-ell">{c.it.professionalName}</div>
                          <div className="sm mc-ell">{clubPeriodLabel(c.p.periodKey).toLowerCase()} · {c.it.fichas} fichas</div>
                        </div>
                      </div>
                      <span className="rt">
                        <span className="v"><MoneyFlat v={c.it.amount} /></span>
                        {isOwner && <button className="oc-btn2" onClick={() => setClubPaying(c)}>Dar baixa</button>}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {configured && mode === 'closed' && cur && openSum > 0 && (() => {
              const t = periodTrack(cur.start, cur.end, loadedAt)
              return (
                <section className="mc-card oc-card" aria-label="Em andamento">
                  <div className="oc-step">
                    <span className="mc-eyebrow">Em andamento · {periodTxt(settings, cur.start, cur.end)}</span>
                    <span className="oc-pill wait">Libera {releaseText(cur.end)}</span>
                  </div>
                  <div className="oc-run">
                    <span className="v"><Money v={openSum} /></span>
                    <span className="mc-fnt" style={{ fontSize: 12, textAlign: 'right' }}>
                      não entra no pagamento de {cp ? WD_FULL[weekdayOfKey(dayKeySP(cp.scheduledFor))] : 'agora'}
                    </span>
                  </div>
                  <div className="mc-track" style={{ gridTemplateColumns: `repeat(${t.n}, minmax(0,1fr))` }} aria-hidden>
                    {Array.from({ length: t.n }, (_, k) => <i key={k} className={k < t.todayIdx ? 'p' : k === t.todayIdx ? 't' : ''} />)}
                  </div>
                </section>
              )
            })()}
          </div>

          <aside className="oc-side" aria-label="Detalhe da pessoa">
            {detail
              ? <section className="mc-card">{detail}</section>
              : <section className="mc-card oc-det"><div className="oc-empty"><b>Ninguém selecionado</b>Os itens de cada pessoa aparecem aqui.</div></section>}
          </aside>
        </div>
      )}

      {seg === 'paid' && isOwner && (
        <div>
          <div className="oc-filters">
            <ProfChips profs={profs} value={profFilter} onChange={setProfFilter} />
            <PeriodPicker value={period} onChange={setPeriod} />
            <TypeChips value={typeFilter} onChange={setTypeFilter} />
          </div>
          <PayoutsHistoryTab
            isMobile={isMobile}
            onOpenDetail={(id) => router.push(`/dashboard/financeiro/comissoes/${id}`)}
            refreshSignal={refresh}
            professionalId={profFilter}
            dateFrom={periodRange(period).dateFrom}
            dateTo={periodRange(period).dateTo}
            periodText={periodText(period)}
            typeFilter={typeFilter}
          />
        </div>
      )}

      {seg === 'club' && (
        <div>
          <div className="oc-filters">
            <ProfChips profs={profs} value={profFilter} onChange={setProfFilter} />
            <PeriodPicker value={period} onChange={setPeriod} />
          </div>
          <ClubCommissionsTab key={refresh} isMobile={isMobile} professionalId={profFilter} period={period} canPay={isOwner} />
        </div>
      )}

      {sheetOpen && detail && sel && (
        <PersonSheet title={`Pagamento da ${kind} ${cardRange}`} onClose={closeSheet}>{detail}</PersonSheet>
      )}

      {showSettings && (
        <PayoutSettingsModal
          settings={settings}
          isMobile={isMobile}
          onClose={() => setShowSettings(false)}
          onSaved={() => { setShowSettings(false); setRefresh(n => n + 1); reload() }}
        />
      )}
      {paying && (
        <MarkAsPaidModal
          payout={paying}
          isMobile={isMobile}
          onClose={() => setPaying(null)}
          onPaid={() => { setPaying(null); setRefresh(n => n + 1); reload() }}
        />
      )}
      {clubPaying && (
        <ClubPaySheet
          settlementId={clubPaying.p.settlementId}
          periodKey={clubPaying.p.periodKey}
          periodLabel={clubPeriodLabel(clubPaying.p.periodKey)}
          item={clubPaying.it}
          isMobile={isMobile}
          onClose={() => setClubPaying(null)}
          onDone={() => { setClubPaying(null); setRefresh(n => n + 1); reload() }}
        />
      )}
    </div>
  )
}
