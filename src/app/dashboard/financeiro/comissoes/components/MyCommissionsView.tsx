'use client'
// src/app/dashboard/financeiro/comissoes/components/MyCommissionsView.tsx
// @eligi:mc-d-view — tela do profissional (STAFF / BASIC_STAFF / RECEPTIONIST),
// direcao D "Central" (nov/2026): o valor a receber e seis modulos que abrem
// numa janela com abas (Extrato, Servicos, Dias, Comparar, Ja recebi, Clube).
// Somente leitura. Layout por @media (mcStyles.ts), nunca por isMobile.

import { useCallback, useEffect, useRef, useState } from 'react'
import { CalendarDays, TrendingDown, TrendingUp, UserRound, WifiOff } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { MC_CSS } from './my/mcStyles'
import { Money, MoneyFlat, ModIcon } from './my/mcParts'
import { WEEKDAYS, dayKeySP, pctDelta, periodTrack, rangeLabel, weekdayDate, weekdayOfKey } from './my/mcFormat'
import { MODS, type ClubStaffResp, type ModKey, type MyCommissions, type MyPeriod } from './my/mcTypes'
import CommissionWindow from './my/CommissionWindow'
import { ModDias, ModExtrato, ModRecebi, ModServicos } from './my/ModPeriod'
import { ModComparar } from './my/ModComparar'
import { ModClube, clubUnpaid } from './my/ModClube'

type Status = 'loading' | 'ok' | 'error' | 'noprof'

const MONTH_FULL = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

function isNoProfessional(e: unknown): boolean {
  const r = (e as { response?: { status?: number; data?: { code?: string } } })?.response
  return r?.status === 404 && (r.data?.code === 'PROFESSIONAL_NOT_FOUND' || r.data?.code === undefined)
}

function segLabels(fortnight: boolean): Array<[MyPeriod, string, string]> {
  return fortnight
    ? [['week', 'Esta quinzena', 'Atual'], ['last_week', 'Quinzena passada', 'Anterior'], ['month', 'Este mês', 'Mês']]
    : [['week', 'Esta semana', 'Atual'], ['last_week', 'Semana passada', 'Anterior'], ['month', 'Este mês', 'Mês']]
}

function Seg({ period, fortnight, onChange }: { period: MyPeriod; fortnight: boolean; onChange: (p: MyPeriod) => void }) {
  return (
    <div className="mc-seg" role="tablist" aria-label="Período">
      {segLabels(fortnight).map(([p, long, short]) => (
        <button key={p} role="tab" aria-selected={p === period} onClick={() => onChange(p)}>
          <span className="l">{long}</span><span className="s">{short}</span>
        </button>
      ))}
    </div>
  )
}

function Hero({ data, loadedAt }: { data: MyCommissions; loadedAt: number }) {
  const t = periodTrack(data.periodStart, data.periodEnd, loadedAt)
  const month = data.periodKind === 'month' || (t.n >= 28 && t.startKey.endsWith('-01'))
  const what = month ? MONTH_FULL[Number(t.startKey.slice(5, 7)) - 1] : rangeLabel(t.startKey, t.endKey)
  const delta = data.previousTotal ? pctDelta(data.previousTotal, data.total) : null
  const prevLabel = data.previousStart && data.previousEnd ? rangeLabel(dayKeySP(data.previousStart), dayKeySP(data.previousEnd)) : 'anterior'
  const atend = data.serviceCount + data.productCount

  let caption: string
  if (t.left == null && t.todayIdx >= t.n) caption = `Fechou ${weekdayDate(t.endKey)}`
  else if (t.left == null) caption = `Começa ${weekdayDate(t.startKey)}`
  else if (month) caption = `Dia ${t.todayIdx + 1} de ${t.n} · ${t.left === 0 ? 'último dia do mês' : `o mês fecha em ${t.left} dia${t.left !== 1 ? 's' : ''}`}`
  else caption = `Fecha ${weekdayDate(t.endKey)} · ${t.left === 0 ? 'último dia' : `faltam ${t.left} dia${t.left !== 1 ? 's' : ''}`}`

  return (
    <section className="mc-card mc-hero" aria-label="Resumo do período">
      <div className="mc-hero-h">
        <span className="mc-eyebrow">A receber · {what}</span>
        {delta != null && (
          <span className={`mc-chip ${delta >= 0 ? 'ok' : 'neu'}`} title={data.previousPartial ? 'Comparado com o mesmo ponto do período anterior' : 'Comparado com o período anterior inteiro'}>
            {delta >= 0 ? <TrendingUp size={12} aria-hidden /> : <TrendingDown size={12} aria-hidden />}
            {delta >= 0 ? '+' : ''}{delta}% vs {prevLabel}
          </span>
        )}
      </div>
      <div className="mc-big"><Money v={data.total} /></div>
      <div className="mc-meta">
        {data.paymentDate && <span className="mc-chip warn"><CalendarDays size={12} aria-hidden />Pagamento {data.paymentDate}</span>}
        <span className="mc-chip neu">{atend} atendimento{atend !== 1 ? 's' : ''}</span>
      </div>
      <div className="mc-track" style={{ gridTemplateColumns: `repeat(${t.n}, minmax(0,1fr))` }} aria-hidden>
        {Array.from({ length: t.n }, (_, k) => (
          <i key={k} className={k < t.todayIdx ? 'p' : k === t.todayIdx ? 't' : ''} />
        ))}
      </div>
      <div className="mc-cap">{caption}</div>
    </section>
  )
}

function tileMeta(k: ModKey, data: MyCommissions, club: ClubStaffResp | null, clubStatus: 'loading' | 'ok' | 'error'): React.ReactNode {
  switch (k) {
    case 'extrato': {
      const n = data.serviceCount + data.productCount
      return `${n} ${n === 1 ? 'item' : 'itens'}`
    }
    case 'servicos': {
      const s = new Set<string>()
      data.days.forEach(d => d.items.forEach(i => s.add(i.name)))
      return s.size ? `${s.size} tipo${s.size !== 1 ? 's' : ''}` : '—'
    }
    case 'dias': {
      const best = data.days.reduce<MyCommissions['days'][number] | null>((a, d) => (!a || d.total > a.total ? d : a), null)
      return best ? `melhor: ${WEEKDAYS[weekdayOfKey(best.date)]} ${Number(best.date.slice(8))}` : '—'
    }
    case 'comparar': return 'mês × mês'
    case 'recebi': return data.paidPayouts[0] ? <MoneyFlat v={data.paidPayouts[0].totalAmount} /> : 'nenhum ainda'
    case 'clube': {
      if (clubStatus !== 'ok') return 'pote do clube'
      const unpaid = clubUnpaid(club)
      if (unpaid > 0) return <span className="mc-warn"><MoneyFlat v={unpaid} /><span className="mc-wide"> a receber</span></span>
      return club && club.periods.length ? <MoneyFlat v={club.totalAmount} /> : 'sem fichas ainda'
    }
  }
}

function Skeleton() {
  return (
    <div className="mc-grid" aria-busy="true" aria-label="Carregando">
      <section className="mc-card mc-hero">
        <div className="mc-sk" style={{ width: '45%', height: 12 }} />
        <div className="mc-sk" style={{ width: '65%', height: 44, margin: '14px 0' }} />
        <div className="mc-sk" style={{ width: '70%', height: 22 }} />
        <div className="mc-sk" style={{ width: '100%', height: 6, marginTop: 18 }} />
      </section>
      <div className="mc-tiles">
        {MODS.map(m => <div key={m.key} className="mc-tile"><div className="mc-sk" style={{ width: 34, height: 34 }} /><div className="mc-sk" style={{ width: '70%', height: 12, marginTop: 6 }} /></div>)}
      </div>
    </div>
  )
}

export default function MyCommissionsView() {
  const [period, setPeriod] = useState<MyPeriod>('week')
  const [data, setData] = useState<MyCommissions | null>(null)
  const [loadedAt, setLoadedAt] = useState(0)
  const [status, setStatus] = useState<Status>('loading')
  const [fortnight, setFortnight] = useState(false)
  const [mod, setMod] = useState<ModKey | null>(null)
  const [club, setClub] = useState<ClubStaffResp | null>(null)
  const [clubStatus, setClubStatus] = useState<'loading' | 'ok' | 'error'>('loading')

  const cacheRef = useRef<Partial<Record<MyPeriod, { d: MyCommissions; at: number }>>>({})
  const reqRef = useRef(0)
  const tilesRef = useRef<HTMLDivElement>(null)
  const openedFrom = useRef<ModKey | null>(null)

  const load = useCallback(async (p: MyPeriod) => {
    const token = ++reqRef.current
    const cached = cacheRef.current[p]
    if (cached) { setData(cached.d); setLoadedAt(cached.at); setStatus('ok') }
    try {
      const res = await api.get('/payouts/my-commissions', { params: { period: p } })
      if (token !== reqRef.current) return
      const d = (res.data?.data ?? null) as MyCommissions | null
      if (!d) { if (!cached) setStatus('error'); return }
      const at = Date.now()
      cacheRef.current[p] = { d, at }
      if (d.periodKind !== 'month') setFortnight(d.periodKind === 'fortnight')
      setData(d); setLoadedAt(at); setStatus('ok')
    } catch (e) {
      if (token !== reqRef.current) return
      if (isNoProfessional(e)) { setStatus('noprof'); return }
      if (!cached) setStatus('error')
    }
  }, [])

  useEffect(() => { void load(period) }, [load, period])

  useEffect(() => {
    let alive = true
    api.get('/club-settlements/commissions')
      .then(r => {
        if (!alive) return
        const d = r.data?.data
        setClub(d && d.scope === 'staff' ? (d as ClubStaffResp) : null)
        setClubStatus('ok')
      })
      .catch(() => { if (alive) setClubStatus('error') })
    return () => { alive = false }
  }, [])

  const closeWindow = useCallback(() => {
    const from = openedFrom.current
    setMod(null)
    if (from) requestAnimationFrame(() => tilesRef.current?.querySelector<HTMLButtonElement>(`[data-mod="${from}"]`)?.focus())
  }, [])

  function openMod(k: ModKey) { openedFrom.current = k; setMod(k) }
  function retry() { setStatus('loading'); void load(period) }

  if (status === 'noprof') {
    return (
      <div className="mc-page">
        <style>{MC_CSS}</style>
        <section className="mc-card mc-state">
          <div className="ico"><UserRound size={22} aria-hidden /></div>
          <h3>Seu acesso não recebe comissão</h3>
          <p>Comissão vem dos atendimentos. Se você também atende clientes, peça ao responsável para ligar seu usuário a um profissional em <b>Equipe</b>.</p>
        </section>
      </div>
    )
  }

  const subtitle = data ? data.periodLabel : ''
  const modSubtitle: Record<ModKey, string> = {
    extrato: subtitle, servicos: subtitle, dias: subtitle,
    comparar: 'Você contra você mesmo, mês a mês',
    recebi: 'Pagamentos fechados pelo estabelecimento',
    clube: 'Sua parte do pote do EligiClub',
  }

  return (
    <div className="mc-page">
      <style>{MC_CSS}</style>
      <div className="mc-top">
        <h1 className="mc-h1">Minhas comissões</h1>
        <Seg period={period} fortnight={fortnight} onChange={setPeriod} />
      </div>

      {status === 'loading' && !data && <Skeleton />}

      {status === 'error' && !data && (
        <section className="mc-card mc-state">
          <div className="ico"><WifiOff size={22} aria-hidden /></div>
          <h3>Não deu para carregar agora</h3>
          <p>Suas comissões estão guardadas. Confira a internet e tente de novo.</p>
          <button className="mc-btn" style={{ marginTop: 18 }} onClick={retry}><span>Tentar de novo</span></button>
        </section>
      )}

      {data && (
        <div className="mc-grid">
          <Hero data={data} loadedAt={loadedAt} />
          <div className="mc-tiles" ref={tilesRef}>
            {MODS.map(m => (
              <button key={m.key} data-mod={m.key} className="mc-tile" aria-haspopup="dialog" onClick={() => openMod(m.key)}>
                <span className="mc-ti"><ModIcon k={m.key} /></span>
                <span className="mc-tl1">{m.label}</span>
                <span className="mc-tl2">{tileMeta(m.key, data, club, clubStatus)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {data && mod && (
        <CommissionWindow mod={mod} subtitle={modSubtitle[mod]} onChange={setMod} onClose={closeWindow}>
          {mod === 'extrato' && <ModExtrato data={data} />}
          {mod === 'servicos' && <ModServicos data={data} />}
          {mod === 'dias' && <ModDias data={data} loadedAt={loadedAt} />}
          {mod === 'comparar' && <ModComparar loadedAt={loadedAt} />}
          {mod === 'recebi' && <ModRecebi data={data} />}
          {mod === 'clube' && <ModClube club={club} status={clubStatus} />}
        </CommissionWindow>
      )}
    </div>
  )
}

