'use client'
// src/app/dashboard/financeiro/comissoes/components/owner/TeamCompare.tsx
// @eligi:tcf-view — aba Comparar da tela de comissoes do dono e do gerente
// (GET /payouts/team-compare). Direcao B "Ficha" + visao Equipe da C (nov/2026).
//
// Pessoa: um profissional em foco, comparado com ele mesmo no mes B, com a media
// da equipe ou com outro profissional, indicador por indicador.
// Equipe: matriz indicador x profissional; a cor mostra quem vai melhor e o melhor
// leva estrela (nunca so cor). Tocar numa celula abre a pessoa.

import { useEffect, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, FileDown, Star, Users } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { canShareFiles, fetchPdf, saveBlob, shareBlob } from '@/features/fiscal/download' // @eligi:tcf-pdf-import
import { MONTHS, monthKeySP, monthLabel, shiftMonth } from '../my/mcFormat'
import { Money } from '../my/mcParts'
import { Avatar } from './ocParts'
import { delta, firstName, fmtMetric, isBest, metricValue, strength, verdict, weeks, type Delta } from './tcFormat'
import type { TcMetric, TcProfessional, TcStats, TcVs, TeamCompareResponse } from './tcTypes'

type Res = { key: string; data?: TeamCompareResponse; error?: string }
type View = 'pessoa' | 'equipe'

function errorMessage(e: unknown): string {
  const r = (e as { response?: { data?: { message?: string; error?: string } } })?.response?.data
  return r?.message ?? r?.error ?? 'Não deu para carregar agora. Confira a internet e tente de novo.'
}

function DeltaChip({ d }: { d: Delta | null }) {
  if (!d) return <span className="tc-dl eq">—</span>
  const cls = d.good == null ? 'eq' : d.good ? 'up' : 'dn'
  const arrow = d.good == null ? '' : d.text.startsWith('−') ? '▼ ' : '▲ '
  return <span className={`tc-dl ${cls}`}>{arrow}{d.text.replace(/^[+−]/, '')}</span>
}

function MonthPicker({ value, other, min, max, onPick, onClose }: {
  value: string; other: string; min: string | null; max: string
  onPick: (m: string) => void; onClose: () => void
}) {
  const [year, setYear] = useState(Number(value.slice(0, 4)))
  const minYear = min ? Number(min.slice(0, 4)) : Number(max.slice(0, 4)) - 10
  const maxYear = Number(max.slice(0, 4))

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="mcw-pick" role="dialog" aria-label="Escolher mês">
      <div className="mc-row" style={{ justifyContent: 'space-between' }}>
        <button className="mcw-ib" aria-label="Ano anterior" disabled={year <= minYear} onClick={() => setYear(y => y - 1)}><ChevronLeft size={18} /></button>
        <span className="mc-num" style={{ fontSize: 18, fontWeight: 600 }}>{year}</span>
        <button className="mcw-ib" aria-label="Próximo ano" disabled={year >= maxYear} onClick={() => setYear(y => y + 1)}><ChevronRight size={18} /></button>
      </div>
      <div className="mcw-mgrid">
        {MONTHS.map((m, i) => {
          const key = `${year}-${String(i + 1).padStart(2, '0')}`
          const off = key > max || (min != null && key < min) || key === other
          return <button key={key} aria-pressed={key === value} disabled={off} onClick={() => onPick(key)}>{m}</button>
        })}
      </div>
      <div className="mc-fnt" style={{ fontSize: 12, marginTop: 8 }}>
        {min ? `As comissões começam em ${monthLabel(min)}.` : 'Ainda não há comissão registrada.'}
      </div>
    </div>
  )
}

const WEEK_LABELS = ['1–7', '8–14', '15–21', '22–28', '29–31']

function WeekChart({ focus, base, focusName, refName }: { focus: number[]; base: number[]; focusName: string; refName: string }) {
  const fa = weeks(focus)
  const fb = weeks(base)
  const n = Math.max(fa.length, fb.length)
  const max = Math.max(1, ...fa, ...fb)
  const any = fa.some(v => v > 0) || fb.some(v => v > 0)
  return (
    <section className="mc-card tc-box">
      <div className="mc-row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
        <span className="mc-eyebrow">Comissão por semana</span>
        <span className="tc-lg"><span><i />{focusName}</span><span><i className="r" />{refName}</span></span>
      </div>
      {!any ? (
        <div className="mc-fnt" style={{ fontSize: 13, padding: '36px 0', textAlign: 'center' }}>Sem comissão nos dois períodos.</div>
      ) : (
        <>
          <div className="tc-wk" role="img" aria-label={`Comissão por semana. ${focusName}: ${fa.map(v => `R$ ${Math.round(v)}`).join(', ')}. ${refName}: ${fb.map(v => `R$ ${Math.round(v)}`).join(', ')}.`}>
            {Array.from({ length: n }, (_, i) => (
              <div key={i} aria-hidden>
                <b className="r" style={{ height: `${((fb[i] ?? 0) / max) * 100}%` }} />
                <b style={{ height: `${((fa[i] ?? 0) / max) * 100}%` }} />
              </div>
            ))}
          </div>
          <div className="tc-wx" aria-hidden>{Array.from({ length: n }, (_, i) => <span key={i}>{WEEK_LABELS[i]}</span>)}</div>
        </>
      )}
    </section>
  )
}

function Services({ focus, base, refName }: { focus: TcStats; base: TcStats; refName: string }) {
  const max = Math.max(1, ...focus.topServices.map(s => s.count))
  const refCount = new Map(base.topServices.map(s => [s.name, s.count]))
  return (
    <section className="mc-card tc-box">
      <span className="mc-eyebrow">Serviços que mais fez</span>
      {focus.topServices.length === 0 ? (
        <div className="mc-fnt" style={{ fontSize: 13, padding: '28px 0', textAlign: 'center' }}>Nenhum serviço no período.</div>
      ) : (
        <div style={{ marginTop: 6 }}>
          {focus.topServices.map(s => (
            <div key={s.name} className="tc-sv">
              <span className="nm mc-ell">{s.name}</span>
              <span className="n mc-num">{s.count}{refCount.has(s.name) ? <span className="mc-fnt"> · {refName} {refCount.get(s.name)}</span> : null}</span>
              <span className="bar" aria-hidden><i style={{ width: `${(s.count / max) * 100}%` }} /></span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function Rows({ metrics, focus, base, focusLabel, refLabel }: {
  metrics: TcMetric[]; focus: TcStats; base: TcStats; focusLabel: string; refLabel: string
}) {
  return (
    <section className="mc-card tc-rows" aria-label="Indicadores">
      <div className="tc-rh"><span>Indicador</span><span>{focusLabel}</span><span>{refLabel}</span></div>
      {metrics.map(m => {
        const v = metricValue(focus, m)
        const r = metricValue(base, m)
        const top = m.kind === 'pct' ? 100 : Math.max(v ?? 0, r ?? 0, 0.0001)
        return (
          <div key={m.key} className="tc-row">
            <span className="lb">{m.label}</span>
            <span className="bars" aria-hidden>
              <i><b style={{ width: `${((v ?? 0) / top) * 100}%` }} /></i>
              <i className="r"><b style={{ width: `${((r ?? 0) / top) * 100}%` }} /></i>
            </span>
            <span className="vs">
              <span className="v1 mc-num">{fmtMetric(v, m)}</span>
              <span className="v2 mc-num">{fmtMetric(r, m)}</span>
            </span>
            <span className="dl"><DeltaChip d={delta(v, r, m)} /></span>
          </div>
        )
      })}
    </section>
  )
}

function PdfButton({ data, pro }: { data: TeamCompareResponse; pro: TcProfessional }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  async function run() {
    setBusy(true)
    setErr(null)
    const name = `comparativo-${firstName(pro.name).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}-${data.a.month}.pdf`
    try {
      const q = new URLSearchParams({ a: data.a.month, b: data.b.month, mode: data.mode }).toString()
      const blob = await fetchPdf(`/payouts/team-compare/${encodeURIComponent(pro.id)}/pdf?${q}`)
      if (canShareFiles(blob, name)) {
        try { await shareBlob(blob, name, `Comparativo de ${firstName(pro.name)}`) } catch (e) {
          if ((e as { name?: string })?.name !== 'AbortError') saveBlob(blob, name)
        }
      } else {
        saveBlob(blob, name)
      }
    } catch (e) {
      setErr(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <span className="tc-pdf">
      <button className="mc-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }} onClick={run} disabled={busy}>
        <FileDown size={17} aria-hidden /><span>{busy ? 'Gerando…' : 'PDF para o profissional'}</span>
      </button>
      {err && <span role="status" style={{ fontSize: 12, color: '#a32d2d' }}>{err}</span>}
    </span>
  )
}

function Ficha({ data, pro, vs, setVs, other, setOtherId, sorted, canPdf }: {
  canPdf: boolean
  data: TeamCompareResponse
  pro: TcProfessional
  vs: TcVs
  setVs: (v: TcVs) => void
  other: TcProfessional | null
  setOtherId: (id: string) => void
  sorted: TcProfessional[]
}) {
  const fname = firstName(pro.name)
  const refStats: TcStats = vs === 'self' ? pro.b : vs === 'team' ? data.team.a : (other ?? pro).a
  const refName = vs === 'self' ? data.b.label : vs === 'team' ? 'Média da equipe' : other ? firstName(other.name) : '—'
  const focusName = vs === 'self' ? data.a.label : fname
  const v = verdict(pro.a, refStats, data.metrics)
  const commissionMetric = data.metrics.find(m => m.key === 'commission') ?? data.metrics[0]
  const cd = delta(pro.a.commission, refStats.commission, commissionMetric)
  const rankC = pro.rank.commission
  const rankB = vs === 'self'
    ? 1 + data.professionals.filter(p => p.b.commission > pro.b.commission).length
    : null
  const others = sorted.filter(p => p.id !== pro.id)
  const periodTxt = `${data.a.label}${data.a.partial && data.cutDay ? ` até dia ${data.cutDay}` : data.a.current ? ' até agora' : ''}`

  return (
    <div className="tc-main">
      <div className="tc-head">
        <Avatar name={pro.name} url={pro.avatarUrl} lg />
        <div className="mc-min0" style={{ flex: 1 }}>
          <div className="nm mc-ell">{pro.name}{!pro.active && <span className="mc-fnt" style={{ fontSize: 13, fontWeight: 500 }}> · saiu da equipe</span>}</div>
          <div className="sm">{periodTxt} <span className="mc-fnt">comparado com</span> {vs === 'self' ? data.b.label : refName}</div>
        </div>
        {canPdf && <PdfButton data={data} pro={pro} />}
      </div>
      {canPdf && <p className="tc-foot" style={{ marginTop: -4 }}>O PDF mostra só {fname} e a média da equipe, comparando {data.a.label} com {data.b.label}. Os colegas não aparecem.</p>}

      <div className="tc-chips" role="group" aria-label="Comparar com">
        <button className="mcw-pchip" aria-pressed={vs === 'self'} onClick={() => setVs('self')}>{fname} em {data.b.label}</button>
        <button className="mcw-pchip" aria-pressed={vs === 'team'} onClick={() => setVs('team')}>Média da equipe</button>
        {others.length > 0 && <button className="mcw-pchip" aria-pressed={vs === 'other'} onClick={() => setVs('other')}>Outro profissional</button>}
      </div>
      {vs === 'other' && others.length > 0 && (
        <div className="tc-chips" role="group" aria-label="Comparar com quem">
          {others.map(o => (
            <button key={o.id} className="mcw-pchip" aria-pressed={other?.id === o.id} onClick={() => setOtherId(o.id)}>{o.name}</button>
          ))}
        </div>
      )}

      <div className="tc-cards">
        <section className="mc-card tc-card">
          <span className="mc-eyebrow">Comissão</span>
          <div className="big"><Money v={pro.a.commission} /></div>
          <div className="sm"><DeltaChip d={cd} /> vs {refName}</div>
        </section>
        <section className="mc-card tc-card">
          <span className="mc-eyebrow">Posição na equipe</span>
          <div className="big mc-num">{rankC ? `${rankC}º` : '—'} <span className="mc-fnt" style={{ fontSize: 15 }}>de {data.professionals.length}</span></div>
          <div className="sm">
            {rankC && rankB && vs === 'self'
              ? rankB > rankC ? `subiu ${rankB - rankC} ${rankB - rankC === 1 ? 'posição' : 'posições'}` : rankB < rankC ? `caiu ${rankC - rankB} ${rankC - rankB === 1 ? 'posição' : 'posições'}` : 'mesma posição'
              : 'em comissão'}
          </div>
        </section>
        <section className="mc-card tc-card wide">
          <span className="mc-eyebrow">Resumo</span>
          <div className="tc-say">
            {v.compared === 0 ? 'Sem movimento para comparar.' : (
              <>Melhor em <b>{v.improved} de {v.compared}</b> indicadores.{v.worst && <> Para olhar: <span className="bad">{v.worst.label.toLowerCase()}</span>.</>}</>
            )}
          </div>
        </section>
      </div>

      <Rows metrics={data.metrics} focus={pro.a} base={refStats} focusLabel={focusName} refLabel={refName} />

      <div className="tc-two">
        <WeekChart focus={pro.a.dailyCommission} base={refStats.dailyCommission} focusName={focusName} refName={refName} />
        <Services focus={pro.a} base={refStats} refName={vs === 'self' ? data.b.label : refName} />
      </div>

      <p className="tc-foot">
        Clientes que voltaram: dos clientes atendidos no mês, quantos ele já tinha atendido antes.
        Ocupação: horário agendado sobre o horário dele (ou da loja), sem a pausa fixa; bloqueios não entram.
        Faturamento: o que foi cobrado nas vendas dele (serviço do clube ou pacote entra pelo valor cobrado).
      </p>
    </div>
  )
}

function Matrix({ data, sorted, byVar, onOpen }: {
  data: TeamCompareResponse; sorted: TcProfessional[]; byVar: boolean; onOpen: (id: string) => void
}) {
  return (
    <>
      <section className="mc-card tc-mx">
        <table>
          <thead>
            <tr>
              <th scope="col">Indicador</th>
              {sorted.map(p => (
                <th key={p.id} scope="col"><Avatar name={p.name} url={p.avatarUrl} /><span className="mc-ell" style={{ display: 'block', maxWidth: 110, marginLeft: 'auto' }}>{firstName(p.name)}</span></th>
              ))}
              <th scope="col">Média</th>
            </tr>
          </thead>
          <tbody>
            {data.metrics.map(m => {
              const all = sorted.map(p => metricValue(p.a, m))
              return (
                <tr key={m.key}>
                  <td>{m.label}</td>
                  {sorted.map(p => {
                    const v = metricValue(p.a, m)
                    if (byVar) {
                      return (
                        <td key={p.id}>
                          <button className="tc-cell" style={{ width: '100%', border: 0, background: 'transparent' }} onClick={() => onOpen(p.id)} aria-label={`${p.name}, ${m.label}`}>
                            <DeltaChip d={delta(v, metricValue(p.b, m), m)} />
                          </button>
                        </td>
                      )
                    }
                    const s = strength(v, all, m)
                    const alpha = v == null ? 0.04 : 0.06 + 0.79 * s * s * s
                    const best = isBest(v, all, m)
                    return (
                      <td key={p.id}>
                        <button
                          className={`tc-cell${alpha > 0.6 ? ' dk' : ''}`}
                          style={{ width: '100%', border: 0, background: `rgba(15,110,86,${alpha.toFixed(2)})` }}
                          onClick={() => onOpen(p.id)}
                          aria-label={`${p.name}, ${m.label}: ${fmtMetric(v, m)}${best ? ', melhor da equipe' : ''}`}
                        >
                          <span>{fmtMetric(v, m)}</span>{best && <Star size={13} fill="currentColor" aria-hidden />}
                        </button>
                      </td>
                    )
                  })}
                  <td className="avg mc-num">
                    {byVar
                      ? <DeltaChip d={delta(metricValue(data.team.a, m), metricValue(data.team.b, m), m)} />
                      : fmtMetric(metricValue(data.team.a, m), m)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>
      <div className="tc-mxm">
        {data.metrics.map(m => {
          const all = sorted.map(p => metricValue(p.a, m))
          const order = [...sorted].sort((x, y) => strength(metricValue(y.a, m), all, m) - strength(metricValue(x.a, m), all, m))
          return (
            <section key={m.key} className="mc-card tc-mc">
              <div className="mc-row" style={{ justifyContent: 'space-between' }}>
                <span className="mc-eyebrow">{m.label}</span>
                <span className="mc-fnt" style={{ fontSize: 12 }}>média {fmtMetric(metricValue(data.team.a, m), m)}</span>
              </div>
              {order.map(p => {
                const v = metricValue(p.a, m)
                const best = isBest(v, all, m)
                return (
                  <button key={p.id} className="tc-mr" style={{ width: '100%', border: 0, background: 'none', textAlign: 'left', minHeight: 44 }} onClick={() => onOpen(p.id)}>
                    <Avatar name={p.name} url={p.avatarUrl} />
                    <span className="mc-min0">
                      <span className="nm mc-ell" style={{ display: 'block' }}>{p.name}{best ? ' ★' : ''}</span>
                      <span className="bar" style={{ display: 'block' }} aria-hidden><i className={best ? 'best' : ''} style={{ width: `${strength(v, all, m) * 100}%` }} /></span>
                    </span>
                    <span className="v">{byVar ? <DeltaChip d={delta(v, metricValue(p.b, m), m)} /> : fmtMetric(v, m)}</span>
                  </button>
                )
              })}
            </section>
          )
        })}
      </div>
      <div className="tc-mxl">
        <span>{byVar ? `Variação de cada um contra ${data.b.label}` : 'Verde mais forte = melhor no indicador'}</span>
        {!byVar && <span>★ melhor da equipe</span>}
        <span>Toque para abrir a pessoa</span>
      </div>
    </>
  )
}

export default function TeamCompare({ loadedAt, isOwner }: { loadedAt: number; isOwner: boolean }) {
  const cur0 = monthKeySP(loadedAt)
  const [a, setA] = useState(cur0)
  const [b, setB] = useState(shiftMonth(cur0, -1))
  const [mode, setMode] = useState<'auto' | 'full'>('auto')
  const [pick, setPick] = useState<'a' | 'b' | null>(null)
  const [res, setRes] = useState<Res | null>(null)
  const [retry, setRetry] = useState(0)
  const [view, setView] = useState<View>('pessoa')
  const [selId, setSelId] = useState<string | null>(null)
  const [vs, setVs] = useState<TcVs>('self')
  const [otherId, setOtherId] = useState<string | null>(null)
  const [byVar, setByVar] = useState(false)

  const key = `${a}|${b}|${mode}|${retry}`
  useEffect(() => {
    let alive = true
    api.get('/payouts/team-compare', { params: { a, b, mode } })
      .then(r => { if (alive) setRes({ key, data: (r.data?.data ?? null) as TeamCompareResponse }) })
      .catch(e => { if (alive) setRes({ key, error: errorMessage(e) }) })
    return () => { alive = false }
  }, [key, a, b, mode])

  const last = res?.data
  const cur = last?.currentMonth ?? cur0
  const first = last?.firstMonth ?? null
  const loading = res?.key !== key
  const data = loading ? null : res?.data ?? null
  const error = loading ? null : res?.error ?? null
  const hasCurrent = a === cur || b === cur

  function apply(na: string, nb: string) { setA(na); setB(nb); setPick(null) }
  const shortcuts: Array<{ label: string; a: string; b: string }> = [
    { label: 'Este × mês passado', a: cur, b: shiftMonth(cur, -1) },
    { label: 'Mês passado × retrasado', a: shiftMonth(cur, -1), b: shiftMonth(cur, -2) },
    { label: `Este × ${MONTHS[Number(cur.slice(5)) - 1]} ${Number(cur.slice(0, 4)) - 1}`, a: cur, b: shiftMonth(cur, -12) },
  ]

  const sorted = data ? [...data.professionals].sort((x, y) => y.a.commission - x.a.commission || x.name.localeCompare(y.name)) : []
  const pro = sorted.find(p => p.id === selId) ?? sorted[0] ?? null
  const other = pro ? (sorted.find(p => p.id === otherId && p.id !== pro.id) ?? sorted.find(p => p.id !== pro.id) ?? null) : null

  function openPro(id: string) { setSelId(id); setView('pessoa') }

  return (
    <div>
      <div className="tc-bar">
        <div className="mcw-cmpw">
          <div className="mcw-cmpsel">
            <button className="mcw-msel" aria-haspopup="dialog" aria-expanded={pick === 'a'} onClick={() => setPick(p => (p === 'a' ? null : 'a'))}>
              <span className="mcw-sw b" />
              <span className="mc-min0"><span className="mc-eyebrow">Mês</span><b>{monthLabel(a)}</b></span>
              <ChevronDown size={16} aria-hidden />
            </button>
            <span className="mcw-vs" aria-hidden>×</span>
            <button className="mcw-msel" aria-haspopup="dialog" aria-expanded={pick === 'b'} onClick={() => setPick(p => (p === 'b' ? null : 'b'))}>
              <span className="mcw-sw a" />
              <span className="mc-min0"><span className="mc-eyebrow">Contra</span><b>{monthLabel(b)}</b></span>
              <ChevronDown size={16} aria-hidden />
            </button>
          </div>
          {pick && (
            <MonthPicker
              key={pick}
              value={pick === 'a' ? a : b}
              other={pick === 'a' ? b : a}
              min={first}
              max={cur}
              onPick={m => (pick === 'a' ? apply(m, b) : apply(a, m))}
              onClose={() => setPick(null)}
            />
          )}
        </div>
        <div className="tc-view" role="group" aria-label="Como ver">
          <button aria-pressed={view === 'pessoa'} onClick={() => setView('pessoa')}>Por pessoa</button>
          <button aria-pressed={view === 'equipe'} onClick={() => setView('equipe')}>Equipe</button>
        </div>
      </div>

      <div className="tc-chips" style={{ marginBottom: 6 }}>
        {shortcuts.map(s => (
          <button key={s.label} className="mcw-pchip" aria-pressed={s.a === a && s.b === b} onClick={() => apply(s.a, s.b)}>{s.label}</button>
        ))}
        {hasCurrent && (
          <>
            <button className="mcw-pchip" aria-pressed={mode === 'auto'} onClick={() => setMode('auto')}>Até o mesmo dia{data?.cutDay ? ` (dia ${data.cutDay})` : ''}</button>
            <button className="mcw-pchip" aria-pressed={mode === 'full'} onClick={() => setMode('full')}>Mês inteiro</button>
          </>
        )}
        {view === 'equipe' && (
          <>
            <button className="mcw-pchip" aria-pressed={!byVar} onClick={() => setByVar(false)}>Valor</button>
            <button className="mcw-pchip" aria-pressed={byVar} onClick={() => setByVar(true)}>Variação</button>
          </>
        )}
      </div>

      {error && (
        <section className="mc-card mc-state" style={{ marginTop: 8 }}>
          <h3>Não deu para comparar</h3>
          <p>{error}</p>
          <button className="mc-btn" style={{ marginTop: 16 }} onClick={() => setRetry(n => n + 1)}><span>Tentar de novo</span></button>
        </section>
      )}

      {!error && !data && (
        <div aria-busy="true" aria-label="Carregando" style={{ display: 'grid', gap: 12, marginTop: 8 }}>
          <div className="mc-sk" style={{ width: 240, height: 28 }} />
          <div className="mc-sk" style={{ width: '100%', height: 110, borderRadius: 16 }} />
          <div className="mc-sk" style={{ width: '100%', height: 320, borderRadius: 16 }} />
        </div>
      )}

      {data && sorted.length === 0 && (
        <section className="mc-card mc-state" style={{ marginTop: 8 }}>
          <div className="ico"><Users size={24} aria-hidden /></div>
          <h3>Ninguém para comparar ainda</h3>
          <p>Quando a equipe tiver atendimentos em {data.a.label} ou {data.b.label}, os números aparecem aqui.</p>
        </section>
      )}

      {data && pro && view === 'pessoa' && (
        <>
          <div className="tc-pchips" role="group" aria-label="Profissional">
            {sorted.map(p => (
              <button key={p.id} className="tc-pchip" aria-pressed={p.id === pro.id} onClick={() => setSelId(p.id)}>
                <Avatar name={p.name} url={p.avatarUrl} /><span>{firstName(p.name)}</span>
              </button>
            ))}
          </div>
          <div className="tc-split">
            <section className="mc-card tc-list" aria-label="Equipe">
              <div className="mc-eyebrow" style={{ padding: '6px 8px 8px' }}>Equipe · {data.a.label}</div>
              {sorted.map(p => {
                const cm = data.metrics.find(m => m.key === 'commission') ?? data.metrics[0]
                return (
                  <button key={p.id} className="tc-pro" aria-current={p.id === pro.id} onClick={() => setSelId(p.id)}>
                    <Avatar name={p.name} url={p.avatarUrl} />
                    <span className="mc-min0">
                      <span className="nm mc-ell" style={{ display: 'block' }}>{p.name}</span>
                      <span className="sm mc-num" style={{ display: 'block' }}>{fmtMetric(p.a.commission, cm)}</span>
                    </span>
                    <DeltaChip d={delta(p.a.commission, p.b.commission, cm)} />
                  </button>
                )
              })}
            </section>
            <Ficha
              data={data}
              pro={pro}
              vs={vs}
              setVs={setVs}
              other={other}
              setOtherId={setOtherId}
              sorted={sorted}
              canPdf={isOwner}
            />
          </div>
        </>
      )}

      {data && sorted.length > 0 && view === 'equipe' && (
        <Matrix data={data} sorted={sorted} byVar={byVar} onOpen={openPro} />
      )}
    </div>
  )
}
