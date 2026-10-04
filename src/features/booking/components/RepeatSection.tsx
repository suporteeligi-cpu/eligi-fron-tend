'use client'
// src/features/booking/components/RepeatSection.tsx
// @eligi:series-repeat-section
//
// "Repetir" do painel de agendamento. CONTROLADO PURO, como o LunchCard:
// sem fetch, sem save. Quem decide o que fazer com o valor e o
// SideCheckoutPanel, que abre a previa de datas antes de gravar.
//
// Limites espelham o back (bookings.series.rules.ts): intervalo 1-4 semanas,
// 2 a 26 vezes, ate 183 dias. O back revalida; aqui so evita o erro obvio.

import { Repeat, Minus, Plus } from 'lucide-react'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { colors, radius, transitions, typography } from '@/shared/theme'

export type RepeatEndMode = 'count' | 'until'

export interface RepeatValue {
  enabled:       boolean
  intervalWeeks: 1 | 2 | 3 | 4
  endMode:       RepeatEndMode
  count:         number
  untilDate:     string // YYYY-MM-DD; '' = nao escolhida
}

export const REPEAT_OFF: RepeatValue = {
  enabled: false, intervalWeeks: 1, endMode: 'count', count: 4, untilDate: '',
}

export const SERIES_MIN = 2
export const SERIES_MAX = 26
export const SERIES_MAX_DAYS = 183

const INTERVALS: { n: RepeatValue['intervalWeeks']; label: string }[] = [
  { n: 1, label: 'Toda semana' },
  { n: 2, label: 'A cada 2 semanas' },
  { n: 3, label: 'A cada 3 semanas' },
  { n: 4, label: 'A cada 4 semanas' },
]

/** Mensagem do que falta, ou null quando o valor ja pode virar previa. */
export function repeatProblem(v: RepeatValue, firstDate: string): string | null {
  if (!v.enabled) return null
  if (v.endMode === 'count') {
    if (v.count < SERIES_MIN || v.count > SERIES_MAX) return `Escolha de ${SERIES_MIN} a ${SERIES_MAX} vezes.`
    return null
  }
  if (!v.untilDate) return 'Escolha até quando repetir.'
  const first = dayjs(firstDate)
  const until = dayjs(v.untilDate)
  if (!until.isAfter(first, 'day')) return 'A data final precisa ser depois da primeira.'
  if (until.diff(first, 'day') < v.intervalWeeks * 7) return 'Até essa data não cabe uma segunda vez.'
  return null
}

/** "toda segunda", "todo sabado", "a cada 2 semanas, na segunda" */
export function repeatPhrase(intervalWeeks: number, firstDate: string, startTime: string): string {
  const d = dayjs(firstDate).locale('pt-br').format('dddd').replace('-feira', '')
  const masc = d === 'sábado' || d === 'domingo'
  if (intervalWeeks === 1) return `${masc ? 'Todo' : 'Toda'} ${d}, às ${startTime}`
  return `A cada ${intervalWeeks} semanas, ${masc ? 'no' : 'na'} ${d}, às ${startTime}`
}

/** Quantas vezes a serie vai ter (estimativa local, o back e a fonte). */
export function repeatCount(v: RepeatValue, firstDate: string): number {
  if (v.endMode === 'count') return v.count
  if (!v.untilDate) return 0
  const days = dayjs(v.untilDate).diff(dayjs(firstDate), 'day')
  return days < 0 ? 0 : Math.floor(days / (v.intervalWeeks * 7)) + 1
}

interface Props {
  value:      RepeatValue
  onChange:   (v: RepeatValue) => void
  firstDate:  string        // YYYY-MM-DD da primeira ocorrencia
  startTime:  string        // HH:mm
  /** Motivo para nao permitir repetir agora (ex.: mais de um servico). */
  blockedReason?: string | null
}

export default function RepeatSection({ value, onChange, firstDate, startTime, blockedReason }: Props) {
  const set = (patch: Partial<RepeatValue>) => onChange({ ...value, ...patch })
  const problem = repeatProblem(value, firstDate)
  const total = repeatCount(value, firstDate)
  const maxUntil = dayjs(firstDate).add(SERIES_MAX_DAYS, 'day').format('YYYY-MM-DD')
  const minUntil = dayjs(firstDate).add(1, 'day').format('YYYY-MM-DD')
  const on = value.enabled && !blockedReason

  return (
    <div style={{ marginTop: 18 }}>
      <style>{`
        .rp-sw{width:100%;display:flex;align-items:center;gap:12px;min-height:60px;padding:12px 14px;border-radius:${radius.md}px;border:1px solid ${colors.gray.borderMd};background:${colors.background.page};cursor:pointer;font-family:${typography.fontFamily};text-align:left;transition:border-color ${transitions.fast}}
        .rp-sw:hover:not(:disabled){border-color:${colors.red.borderHover}}
        .rp-sw:disabled{cursor:not-allowed;opacity:.6}
        .rp-sw:focus-visible,.rp-chip:focus-visible,.rp-step:focus-visible,.rp-date:focus-visible{outline:2px solid ${colors.red.DEFAULT};outline-offset:2px}
        .rp-track{width:42px;height:24px;border-radius:12px;background:rgba(0,0,0,0.16);position:relative;flex-shrink:0;transition:background ${transitions.fast}}
        .rp-sw[aria-pressed="true"] .rp-track{background:${colors.red.DEFAULT}}
        .rp-knob{position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.25);transition:transform ${transitions.spring}}
        .rp-sw[aria-pressed="true"] .rp-knob{transform:translateX(18px)}
        .rp-chips{display:grid;grid-template-columns:1fr 1fr;gap:8px}
        .rp-chip{min-height:44px;padding:8px 10px;border-radius:${radius.sm}px;border:1px solid ${colors.gray.borderMd};background:#fff;font-size:14px;font-weight:600;color:${colors.gray[700]};cursor:pointer;font-family:${typography.fontFamily};transition:all ${transitions.fast}}
        .rp-chip[aria-pressed="true"]{background:${colors.red.gradient};color:#fff;border-color:transparent;box-shadow:0 2px 8px ${colors.red.glow}}
        .rp-step{width:44px;height:44px;border-radius:${radius.sm}px;border:1px solid ${colors.gray.borderMd};background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer}
        .rp-step:disabled{opacity:.4;cursor:not-allowed}
        .rp-date{width:100%;min-height:44px;padding:0 12px;border-radius:${radius.sm}px;border:1px solid ${colors.gray.borderMd};background:#fff;font-size:16px;font-family:${typography.fontFamily};color:${colors.gray[900]};box-sizing:border-box}
      `}</style>

      <button
        type="button"
        className="rp-sw"
        aria-pressed={on}
        disabled={!!blockedReason}
        onClick={() => set({ enabled: !value.enabled })}
      >
        <Repeat size={18} color={on ? colors.red.DEFAULT : colors.gray.dimText} strokeWidth={2} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 15.5, fontWeight: 700, letterSpacing: '-0.01em', color: colors.gray[900] }}>
            Repetir
          </span>
          <span style={{ display: 'block', fontSize: 13, color: colors.gray.dimText, marginTop: 1 }}>
            {blockedReason
              ? blockedReason
              : on
                ? repeatPhrase(value.intervalWeeks, firstDate, startTime)
                : 'Cliente fixo: agenda as próximas vezes de uma só vez'}
          </span>
        </span>
        <span className="rp-track" aria-hidden><span className="rp-knob" /></span>
      </button>

      {on && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
          <div>
            <span className="cp-lbl">Frequência</span>
            <div className="rp-chips">
              {INTERVALS.map(it => (
                <button
                  key={it.n}
                  type="button"
                  className="rp-chip"
                  aria-pressed={value.intervalWeeks === it.n}
                  onClick={() => set({ intervalWeeks: it.n })}
                >
                  {it.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="cp-lbl">Até quando</span>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              <button type="button" className={`cp-seg-btn${value.endMode === 'count' ? ' sel' : ''}`} onClick={() => set({ endMode: 'count' })}>
                Número de vezes
              </button>
              <button type="button" className={`cp-seg-btn${value.endMode === 'until' ? ' sel' : ''}`} onClick={() => set({ endMode: 'until' })}>
                Até uma data
              </button>
            </div>

            {value.endMode === 'count' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button type="button" className="rp-step" aria-label="Menos uma vez"
                  disabled={value.count <= SERIES_MIN}
                  onClick={() => set({ count: Math.max(SERIES_MIN, value.count - 1) })}>
                  <Minus size={18} color={colors.gray[700]} />
                </button>
                <span style={{ minWidth: 90, textAlign: 'center', fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: colors.gray[900], fontFamily: typography.fontFamilyDisplay, fontVariantNumeric: 'tabular-nums' }}>
                  {value.count}<span style={{ fontSize: 14, fontWeight: 600, color: colors.gray.dimText, marginLeft: 6 }}>vezes</span>
                </span>
                <button type="button" className="rp-step" aria-label="Mais uma vez"
                  disabled={value.count >= SERIES_MAX}
                  onClick={() => set({ count: Math.min(SERIES_MAX, value.count + 1) })}>
                  <Plus size={18} color={colors.gray[700]} />
                </button>
              </div>
            ) : (
              <input
                type="date"
                className="rp-date"
                aria-label="Última data da série"
                value={value.untilDate}
                min={minUntil}
                max={maxUntil}
                onChange={e => set({ untilDate: e.target.value })}
              />
            )}
          </div>

          <p role={problem ? 'alert' : undefined} style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: problem ? colors.red.dark : colors.gray[700] }}>
            {problem ?? `${total} agendamentos, contando este. Na próxima tela você confere cada data antes de salvar.`}
          </p>
        </div>
      )}
    </div>
  )
}
