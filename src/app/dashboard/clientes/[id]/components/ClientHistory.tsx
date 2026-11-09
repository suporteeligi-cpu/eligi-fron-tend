'use client'
// src/app/dashboard/clientes/[id]/components/ClientHistory.tsx
// @eligi:clients-history-v2 — uma linha por atendimento, com o valor COBRADO
// naquele dia. A mudanca de preco aparece como marca ambar entre as visitas:
// "Corte: R$ 75 -> R$ 80. Visitas antigas mantem R$ 75."

import type { HistoryVisit, PriceChange, CoveredBy } from '@/features/clients/types'
import { fmtMoney2, fmtMoneyShort, fmtShortDate, yearOf } from '@/features/clients/utils/format'

interface Props {
  history:      HistoryVisit[]
  historyTotal: number
  priceChanges: PriceChange[]
}

type Entry =
  | { kind: 'visit'; at: string; visit: HistoryVisit }
  | { kind: 'price'; at: string; change: PriceChange }

const COVERED: Record<Exclude<CoveredBy, null>, string> = {
  CLUB: 'Clube',
  PACKAGE: 'Pacote',
  MEMBERSHIP: 'Assinatura',
}

// "Agora" lido uma vez, no carregamento do modulo: Date.now() no render viola
// a pureza do React Compiler. So decide o rotulo "Agendado".
const NOW = Date.now()

function n0(v: number): string {
  return Number.isInteger(v) ? String(v) : fmtMoney2(v)
}

function describe(v: HistoryVisit): { title: string; sub: string; tag: string | null; tagWarn: boolean; off: boolean } {
  const names = v.services.map(s => s.serviceName).filter(Boolean)
  const extras = v.extras.map(e => (e.quantity > 1 ? `${e.quantity}× ${e.name}` : e.name))
  const title = [names.join(' + '), ...extras].filter(Boolean).join(' · ') || 'Atendimento'

  const pros = [...new Set(v.services.map(s => s.professionalName).filter((p): p is string => !!p))]
  const parts: string[] = []
  if (pros.length) parts.push(`com ${pros.map(p => p.split(' ')[0]).join(' e ')}`)
  const charged = v.services.map(s => s.charged).filter((c): c is number => c !== null)
  if (charged.length + v.extras.length > 1 && v.status === 'COMPLETED') {
    parts.push([...charged, ...v.extras.map(e => e.total)].map(n0).join(' + '))
  }

  const covered = [...new Set(v.services.map(s => s.coveredBy).filter((c): c is Exclude<CoveredBy, null> => c !== null))]
  let tag: string | null = null
  let tagWarn = false
  let off = false
  if (v.status === 'CANCELED') { tag = 'Cancelado'; off = true }
  else if (v.status === 'NO_SHOW') { tag = 'Faltou'; off = true; tagWarn = true }
  else if (v.status === 'CONFIRMED') tag = new Date(v.startAt).getTime() > NOW ? 'Agendado' : 'Sem venda'
  else if (v.estimated) { tag = 'Estimado'; tagWarn = true }
  else if (covered.length) tag = covered.map(c => COVERED[c]).join(' + ')

  return { title, sub: parts.join(' · '), tag, tagWarn, off }
}

export default function ClientHistory({ history, historyTotal, priceChanges }: Props) {
  if (history.length === 0) {
    return (
      <div className="cl-state">
        <div className="cl-state-title">Nenhum atendimento ainda</div>
        <div className="cl-state-text">As visitas deste cliente aparecem aqui, com o valor cobrado em cada uma.</div>
      </div>
    )
  }

  // So as mudancas de preco dentro do periodo mostrado.
  const oldest = history[history.length - 1].startAt
  const entries: Entry[] = [
    ...history.map(v => ({ kind: 'visit' as const, at: v.startAt, visit: v })),
    ...priceChanges.filter(c => c.at >= oldest).map(c => ({ kind: 'price' as const, at: c.at, change: c })),
  ].sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : a.kind === 'price' ? -1 : 1))

  const thisYear = yearOf(new Date(NOW).toISOString())

  return (
    <div className="cl-hist">
      {entries.map((e, i) => {
        const y = yearOf(e.at)
        const showYear = y !== thisYear && (i === 0 || yearOf(entries[i - 1].at) !== y)

        if (e.kind === 'price') {
          const c = e.change
          return (
            <div key={`p-${c.serviceId}-${c.at}`}>
              {showYear && <div className="cl-year cl-m">{y}</div>}
              <div className="cl-price">
                <span className="cl-visit-date cl-m cl-n">{fmtShortDate(c.at)}</span>
                <span className="cl-price-text">
                  Preço do {c.serviceName}: <span className="cl-n">{fmtMoneyShort(c.from)} → {fmtMoneyShort(c.to)}</span>.
                  {' '}Visitas antigas mantêm {fmtMoneyShort(c.from)}.
                </span>
              </div>
            </div>
          )
        }

        const v = e.visit
        const d = describe(v)
        return (
          <div key={v.key}>
            {showYear && <div className="cl-year cl-m">{y}</div>}
            <div className={`cl-visit${d.off ? ' is-off' : ''}`}>
              <span className="cl-visit-date cl-m cl-n">{fmtShortDate(v.startAt)}</span>
              <span className="cl-visit-main">
                <span className="cl-visit-title">{d.title}</span>
                {(d.sub || d.tag) && (
                  <span className="cl-visit-sub cl-n">
                    {d.sub}
                    {d.sub && d.tag ? ' ' : ''}
                    {d.tag && <span className={`cl-pill${d.tagWarn ? ' is-warn' : ''}`}>{d.tag}</span>}
                  </span>
                )}
              </span>
              <span className="cl-visit-money cl-d cl-n">
                {v.total === null ? '—' : fmtMoney2(v.total)}
              </span>
            </div>
          </div>
        )
      })}
      {historyTotal > history.length && (
        <div className="cl-lock">Mostrando os {history.length} atendimentos mais recentes de {historyTotal}.</div>
      )}
    </div>
  )
}
