// src/app/dashboard/financeiro/comissoes/components/my/ModComparar.tsx
// @eligi:mc-d-compare — voce contra voce mesmo, mes a mes
// (GET /payouts/my-commissions/compare). Qualquer mes do historico contra
// qualquer outro; com o mes atual, o outro e cortado no mesmo ponto (auto)
// ou vale inteiro (full). Mes A = base (tracejado), mes B = comparado.
'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { MONTHS, brl, monthKeySP, monthLabel, pctDelta, shiftMonth, shortDate, WEEKDAYS, weekdayOfKey } from './mcFormat'
import { MoneyFlat } from './mcParts'
import type { CompareMode, CompareResponse, MonthSummary } from './mcTypes'

type Res = { key: string; data?: CompareResponse; error?: string }

function errorMessage(e: unknown): string {
  const r = (e as { response?: { data?: { message?: string; error?: string } } })?.response?.data
  return r?.message ?? r?.error ?? 'Não deu para carregar agora. Confira a internet e tente de novo.'
}

function Delta({ a, b }: { a: number; b: number }) {
  const p = pctDelta(a, b)
  if (p == null) return <span className="mcw-dlt mc-fnt">—</span>
  return <span className={`mcw-dlt ${p >= 0 ? 'up' : 'dn'}`}>{p >= 0 ? '+' : ''}{p}%</span>
}

function bestLabel(m: MonthSummary) {
  if (!m.bestDay) return null
  return `${WEEKDAYS[weekdayOfKey(m.bestDay.date)]}, ${shortDate(m.bestDay.date)}`
}

const W = 300
const H = 90

function Chart({ a, b }: { a: MonthSummary; b: MonthSummary }) {
  const max = Math.max(a.daily[a.daily.length - 1] ?? 0, b.daily[b.daily.length - 1] ?? 0, ...a.daily, ...b.daily)
  if (!max) return <div className="mc-fnt" style={{ fontSize: 13, padding: '24px 0', textAlign: 'center' }}>Sem comissão nos dois meses.</div>
  const path = (c: number[]) => c.map((v, i) => `${i ? 'L' : 'M'}${(i / 30 * W).toFixed(1)},${(H - v / max * H).toFixed(1)}`).join('')
  return (
    <>
      <svg role="img" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: 120, marginTop: 8, display: 'block' }}
        aria-label={`Comissão acumulada dia a dia: ${a.label} ${a.partial ? 'até o corte' : 'no mês'} R$ ${brl(a.total)}, ${b.label} R$ ${brl(b.total)}`}>
        <line x1="0" y1={H} x2={W} y2={H} stroke="#e5e5ea" vectorEffect="non-scaling-stroke" />
        {a.daily.length > 0 && <path d={path(a.daily)} fill="none" stroke="#9a9aa3" strokeWidth="2" strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />}
        {b.daily.length > 0 && <path d={path(b.daily)} fill="none" stroke="#111114" strokeWidth="2.4" vectorEffect="non-scaling-stroke" />}
      </svg>
      <div className="mc-row mc-fnt" style={{ justifyContent: 'space-between', marginTop: 4, fontSize: 12 }} aria-hidden>
        <span>dia 1</span><span>10</span><span>20</span><span>31</span>
      </div>
    </>
  )
}

function Picker({ value, other, min, max, onPick, onClose }: {
  value: string; other: string; min: string | null; max: string
  onPick: (m: string) => void; onClose: () => void
}) {
  const [year, setYear] = useState(Number(value.slice(0, 4)))
  const minYear = min ? Number(min.slice(0, 4)) : Number(max.slice(0, 4)) - 10
  const maxYear = Number(max.slice(0, 4))

  useEffect(() => {
    // Esc fecha so o seletor (a janela escuta depois, sem captura)
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      onClose()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
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
          return (
            <button key={key} aria-pressed={key === value} disabled={off} onClick={() => onPick(key)}>{m}</button>
          )
        })}
      </div>
      <div className="mc-fnt" style={{ fontSize: 12, marginTop: 8 }}>
        {min ? `Seu histórico começa em ${monthLabel(min)}.` : 'Você ainda não tem comissão registrada.'}
      </div>
    </div>
  )
}

export function ModComparar({ loadedAt }: { loadedAt: number }) {
  const cur0 = monthKeySP(loadedAt)
  const [a, setA] = useState(shiftMonth(cur0, -1))
  const [b, setB] = useState(cur0)
  const [mode, setMode] = useState<CompareMode>('auto')
  const [pick, setPick] = useState<'a' | 'b' | null>(null)
  const [res, setRes] = useState<Res | null>(null)
  const [retry, setRetry] = useState(0)

  const key = `${a}|${b}|${mode}|${retry}`
  useEffect(() => {
    let alive = true
    api.get('/payouts/my-commissions/compare', { params: { a, b, mode } })
      .then(r => { if (alive) setRes({ key, data: (r.data?.data ?? null) as CompareResponse }) })
      .catch(e => { if (alive) setRes({ key, error: errorMessage(e) }) })
    return () => { alive = false }
  }, [key, a, b, mode])

  // limites vem da ultima resposta (o servidor sabe o "agora" no fuso do salao)
  const last = res?.data
  const cur = last?.currentMonth ?? cur0
  const first = last?.firstMonth ?? null
  const loading = res?.key !== key
  const data = loading ? null : res?.data ?? null
  const error = loading ? null : res?.error ?? null
  const hasCurrent = a === cur || b === cur

  function apply(na: string, nb: string) { setA(na); setB(nb); setPick(null) }
  const shortcuts: Array<{ label: string; a: string; b: string }> = [
    { label: 'Este × mês passado', a: shiftMonth(cur, -1), b: cur },
    { label: `Este × ${MONTHS[Number(cur.slice(5)) - 1]} ${Number(cur.slice(0, 4)) - 1}`, a: shiftMonth(cur, -12), b: cur },
    { label: 'Mês passado × retrasado', a: shiftMonth(cur, -2), b: shiftMonth(cur, -1) },
  ]

  return (
    <>
      <div className="mcw-cmpw">
        <div className="mcw-cmpsel">
          <button className="mcw-msel" aria-haspopup="dialog" aria-expanded={pick === 'a'} onClick={() => setPick(p => (p === 'a' ? null : 'a'))}>
            <span className="mcw-sw a" />
            <span className="mc-min0"><span className="mc-eyebrow">Mês A · base</span><b>{monthLabel(a)}</b></span>
            <ChevronDown size={16} aria-hidden />
          </button>
          <span className="mcw-vs" aria-hidden>×</span>
          <button className="mcw-msel" aria-haspopup="dialog" aria-expanded={pick === 'b'} onClick={() => setPick(p => (p === 'b' ? null : 'b'))}>
            <span className="mcw-sw b" />
            <span className="mc-min0"><span className="mc-eyebrow">Mês B</span><b>{monthLabel(b)}</b></span>
            <ChevronDown size={16} aria-hidden />
          </button>
        </div>
        {pick && (
          <Picker
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

      <div className="mcw-chips" style={{ margin: '10px 0 2px' }}>
        {shortcuts.map(s => (
          <button key={s.label} className="mcw-pchip" aria-pressed={s.a === a && s.b === b} onClick={() => apply(s.a, s.b)}>{s.label}</button>
        ))}
      </div>

      {hasCurrent && (
        <div className="mcw-chips" role="group" aria-label="Como comparar o mês atual" style={{ margin: '4px 0 2px' }}>
          <button className="mcw-pchip" aria-pressed={mode === 'auto'} onClick={() => setMode('auto')}>
            Até o mesmo dia{data?.cutDay ? ` (dia ${data.cutDay})` : ''}
          </button>
          <button className="mcw-pchip" aria-pressed={mode === 'full'} onClick={() => setMode('full')}>Mês inteiro</button>
        </div>
      )}

      {error && (
        <div className="mcw-card mcw-empty" style={{ marginTop: 8 }}>
          <b>Não deu para comparar</b>{error}
          <div style={{ marginTop: 14 }}><button className="mc-btn" onClick={() => setRetry(n => n + 1)}><span>Tentar de novo</span></button></div>
        </div>
      )}

      {!error && !data && (
        <div className="mcw-card" style={{ padding: 16, marginTop: 8 }} aria-busy="true">
          <div className="mc-sk" style={{ width: '40%', height: 12 }} />
          <div className="mc-sk" style={{ width: '100%', height: 110, marginTop: 12 }} />
        </div>
      )}

      {data && (
        <>
          <div className="mcw-card" style={{ padding: '14px 16px', marginTop: 8 }}>
            <div className="mc-row" style={{ justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 6 }}>
              <span className="mc-eyebrow">Acumulado no mês</span>
              <span className="mc-fnt" style={{ fontSize: 12 }}>
                <span className="mcw-lg a" />{data.a.label} <span className="mcw-lg" />{data.b.label}
              </span>
            </div>
            <Chart a={data.a} b={data.b} />
            {data.cutDay != null && (
              <div className="mc-fnt" style={{ fontSize: 12, marginTop: 8 }}>
                Os dois meses contam até o dia {data.cutDay}, no mesmo horário de agora.
              </div>
            )}
            {data.cutDay == null && hasCurrent && (
              <div className="mc-fnt" style={{ fontSize: 12, marginTop: 8 }}>
                {monthLabel(cur)} ainda está em andamento.
              </div>
            )}
          </div>

          <div className="mcw-card mcw-ctab">
            <div className="ch"><span /><span>{data.a.label}</span><span>{data.b.label}</span><span>B×A</span></div>
            <div className="cr"><span className="mc-mut" style={{ fontSize: 13 }}>Total</span><span><MoneyFlat v={data.a.total} /></span><span><MoneyFlat v={data.b.total} /></span><span><Delta a={data.a.total} b={data.b.total} /></span></div>
            <div className="cr"><span className="mc-mut" style={{ fontSize: 13 }}>Atendimentos</span><span className="mc-num">{data.a.sales}</span><span className="mc-num">{data.b.sales}</span><span><Delta a={data.a.sales} b={data.b.sales} /></span></div>
            <div className="cr"><span className="mc-mut" style={{ fontSize: 13 }}>Por atendimento</span><span><MoneyFlat v={data.a.avgPerSale} /></span><span><MoneyFlat v={data.b.avgPerSale} /></span><span><Delta a={data.a.avgPerSale} b={data.b.avgPerSale} /></span></div>
            <div className="cr"><span className="mc-mut" style={{ fontSize: 13 }}>Serviços</span><span><MoneyFlat v={data.a.serviceTotal} /></span><span><MoneyFlat v={data.b.serviceTotal} /></span><span><Delta a={data.a.serviceTotal} b={data.b.serviceTotal} /></span></div>
            <div className="cr"><span className="mc-mut" style={{ fontSize: 13 }}>Produtos</span><span><MoneyFlat v={data.a.productTotal} /></span><span><MoneyFlat v={data.b.productTotal} /></span><span><Delta a={data.a.productTotal} b={data.b.productTotal} /></span></div>
            <div className="cr">
              <span className="mc-mut" style={{ fontSize: 13 }}>Melhor dia</span>
              <span>{data.a.bestDay ? <><MoneyFlat v={data.a.bestDay.total} /><div className="mc-fnt" style={{ fontSize: 12 }}>{bestLabel(data.a)}</div></> : '—'}</span>
              <span>{data.b.bestDay ? <><MoneyFlat v={data.b.bestDay.total} /><div className="mc-fnt" style={{ fontSize: 12 }}>{bestLabel(data.b)}</div></> : '—'}</span>
              <span />
            </div>
          </div>
        </>
      )}
    </>
  )
}
