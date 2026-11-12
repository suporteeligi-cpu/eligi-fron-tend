// src/app/dashboard/financeiro/comissoes/components/my/ModPeriod.tsx
// @eligi:mc-d-mods — modulos que leem o periodo escolhido na tela inicial:
// Extrato (por dia), Servicos (onde rende), Dias (grafico) e Ja recebi.
'use client'

import { useState } from 'react'
import { CircleCheck } from 'lucide-react'
import { methodLabel, fmtPayoutPeriod } from '@/features/payouts/utils/format'
import { brl, dayKeySP, daysBetweenKeys, addDaysKey, weekdayOfKey, WEEKDAYS, shortDate } from './mcFormat'
import { MoneyFlat } from './mcParts'
import type { MyCommissions, CommissionDay, CommissionItem } from './mcTypes'

function Empty({ title, text }: { title: string; text: string }) {
  return <div className="mcw-card mcw-empty"><b>{title}</b>{text}</div>
}

function dayChipLabel(d: CommissionDay): string {
  if (d.label.startsWith('Hoje')) return 'Hoje'
  if (d.label.startsWith('Ontem')) return 'Ontem'
  return `${WEEKDAYS[weekdayOfKey(d.date)]} ${d.date.slice(8)}`
}

function Line({ i }: { i: CommissionItem }) {
  return (
    <div className="mcw-line">
      <span className="tm mc-mono">{i.time}</span>
      <div className="mc-min0">
        <div className="nm mc-ell">{i.name}</div>
        <div className="why mc-ell">
          {i.type !== 'SERVICE' && <><span className="mcw-tag">Produto</span> · </>}
          {i.clientName}
          {i.discountShare ? ` · desconto dividido −R$ ${brl(i.discountShare)}` : ''}
        </div>
      </div>
      <span className="v">
        <span className="mc-num">{brl(i.amount)}</span>
        {i.pct > 0 && <span className="calc">{i.pct}% de {brl(i.baseAmount)}</span>}
      </span>
    </div>
  )
}

export function ModExtrato({ data }: { data: MyCommissions }) {
  const [sel, setSel] = useState<string | null>(null)
  if (data.days.length === 0) {
    return <Empty title="Nada neste período ainda" text="Cada atendimento pago no caixa entra aqui na hora, com o valor e a conta de como chegamos nele." />
  }
  const day = data.days.find(d => d.date === sel) ?? data.days[0]
  return (
    <>
      <div className="mcw-chips" role="tablist" aria-label="Dia">
        {data.days.map(d => (
          <button key={d.date} role="tab" aria-selected={d.date === day.date} className="mcw-dchip" onClick={() => setSel(d.date)}>
            <span>{dayChipLabel(d)}</span>
            <b className="mc-num">{brl(d.total)}</b>
          </button>
        ))}
      </div>
      <div className="mcw-card">
        {day.items.map(i => <Line key={i.id} i={i} />)}
      </div>
      <div className="mcw-sum">
        <span className="mc-mut">
          {day.serviceCount} serviço{day.serviceCount !== 1 ? 's' : ''}
          {day.productCount > 0 && ` · ${day.productCount} produto${day.productCount !== 1 ? 's' : ''}`}
        </span>
        <MoneyFlat v={day.total} />
      </div>
    </>
  )
}

export function ModServicos({ data }: { data: MyCommissions }) {
  const m = new Map<string, { v: number; c: number; product: boolean }>()
  for (const d of data.days) for (const i of d.items) {
    const e = m.get(i.name) ?? { v: 0, c: 0, product: i.type !== 'SERVICE' }
    e.v += i.amount; e.c += 1
    m.set(i.name, e)
  }
  const list = [...m].sort((a, b) => b[1].v - a[1].v)
  if (list.length === 0) return <Empty title="Nada neste período ainda" text="Quando houver atendimentos, você vê aqui o que mais rende para você." />
  const max = list[0][1].v || 1
  return (
    <div className="mcw-card">
      {list.map(([name, e]) => (
        <div key={name} className="mcw-svc">
          <span className="mc-row mc-min0" style={{ gap: 6 }}>
            {e.product && <span className="mcw-tag" style={{ flexShrink: 0 }}>Produto</span>}
            <span className="mc-ell mc-min0" style={{ fontSize: 14, fontWeight: 500 }}>{name}</span>
            <span className="mc-fnt" style={{ fontSize: 13, flexShrink: 0 }}>×{e.c}</span>
          </span>
          <MoneyFlat v={e.v} />
          <div className="bar"><i style={{ width: `${Math.max(2, Math.round(e.v / max * 100))}%` }} /></div>
        </div>
      ))}
    </div>
  )
}

export function ModDias({ data, loadedAt }: { data: MyCommissions; loadedAt: number }) {
  const startKey = dayKeySP(data.periodStart)
  const endKey = dayKeySP(data.periodEnd)
  const n = Math.max(1, daysBetweenKeys(startKey, endKey) + 1)
  const todayKey = dayKeySP(loadedAt)
  const byKey = new Map(data.days.map(d => [d.date, d]))
  const worked = data.days.filter(d => d.total > 0)
  if (worked.length === 0) return <Empty title="Nada neste período ainda" text="O gráfico aparece quando o primeiro atendimento entrar." />
  const best = worked.reduce((a, d) => (d.total > a.total ? d : a), worked[0])
  const max = best.total || 1
  const gap = n > 14 ? 3 : n > 7 ? 5 : 8
  const keys = Array.from({ length: n }, (_, k) => addDaysKey(startKey, k))
  // rotulo: semana mostra todos; quinzena e mes mostram dia 1 e de 5 em 5
  const showLabel = (k: number) => n <= 7 || k === 0 || (k + 1) % 5 === 0
  const avg = worked.reduce((s, d) => s + d.total, 0) / worked.length
  return (
    <>
      <div className="mcw-card" style={{ padding: '14px 16px' }}>
        <div className="mcw-bars" style={{ ['--bg' as string]: `${gap}px` }} role="img"
          aria-label={`Comissão por dia. Melhor dia: ${shortDate(best.date)}, R$ ${brl(best.total)}.`}>
          {keys.map(k => {
            const d = byKey.get(k)
            const future = k > todayKey
            const h = d ? Math.max(4, Math.round(d.total / max * 100)) : 3
            return <div key={k}><div className={`b${future || !d ? ' f' : ''}${d && d.date !== best.date ? ' lo' : ''}`} style={{ height: `${h}%` }} /></div>
          })}
        </div>
        <div className="mcw-bx" style={{ ['--bg' as string]: `${gap}px` }} aria-hidden>
          {keys.map((k, idx) => (
            <span key={k}>{showLabel(idx) ? (n <= 7 ? WEEKDAYS[weekdayOfKey(k)] : String(Number(k.slice(8)))) : ''}</span>
          ))}
        </div>
      </div>
      <div className="mcw-kpis">
        <div className="mcw-kpi">
          <div className="mc-eyebrow">Melhor dia</div>
          <div className="v"><MoneyFlat v={best.total} /></div>
          <div className="h">{WEEKDAYS[weekdayOfKey(best.date)]}, {shortDate(best.date)}</div>
        </div>
        <div className="mcw-kpi">
          <div className="mc-eyebrow">Média por dia</div>
          <div className="v"><MoneyFlat v={avg} /></div>
          <div className="h">{worked.length} dia{worked.length !== 1 ? 's' : ''} com atendimento</div>
        </div>
      </div>
    </>
  )
}

function fmtDay(iso: string | null): string {
  if (!iso) return '—'
  const k = dayKeySP(iso)
  return `${k.slice(8)}/${k.slice(5, 7)}/${k.slice(0, 4)}`
}

export function ModRecebi({ data }: { data: MyCommissions }) {
  if (data.paidPayouts.length === 0) {
    return <Empty title="Nenhum pagamento ainda" text="Quando o estabelecimento fechar e pagar um período, ele aparece aqui." />
  }
  return (
    <>
      <div className="mcw-card">
        {data.paidPayouts.map(p => (
          <div key={p.id} className="mcw-paid">
            <span className="ck"><CircleCheck size={16} aria-hidden /></span>
            <div className="mc-min0" style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{fmtPayoutPeriod(p.periodStart, p.periodEnd)}</div>
              <div className="mc-fnt" style={{ fontSize: 12 }}>
                Pago em {fmtDay(p.paidAt)}
                {p.paidVia && ` · ${methodLabel(p.paidVia as Parameters<typeof methodLabel>[0])}`}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}><MoneyFlat v={p.totalAmount} /></div>
          </div>
        ))}
      </div>
      <div className="mc-fnt" style={{ fontSize: 12, padding: '10px 4px 0' }}>Últimos {data.paidPayouts.length} pagamentos fechados.</div>
    </>
  )
}
