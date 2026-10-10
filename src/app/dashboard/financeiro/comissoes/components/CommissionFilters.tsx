'use client'
// src/app/dashboard/financeiro/comissoes/components/CommissionFilters.tsx
// @eligi:comm-filtro-componentes — filtro por profissional (faixa de chips) e
// por periodo (mes ou ano) do modulo de Comissoes. Direcao A, out/2026.
//
// O periodo e contado no horario de Sao Paulo (UTC-3 fixo, sem horario de
// verao): sem isso, um pagamento da noite do dia 31 cairia no mes seguinte.

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { colors, typography } from '@/shared/theme'

export interface FilterProf { id: string; name: string; avatarUrl: string | null }

export type PeriodFilter =
  | { kind: 'month'; year: number; month: number } // month 1..12
  | { kind: 'year'; year: number }

const BRT_OFFSET_H = 3
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

// "Hoje" em Sao Paulo, avaliado no carregamento do modulo (fora do render, pela
// pureza do React Compiler). Uma aba aberta na virada do mes so ve o mes novo
// depois de recarregar: aceitavel para um filtro.
const NOW_SP = new Date(Date.now() - BRT_OFFSET_H * 3600_000)
const CURRENT_YEAR = NOW_SP.getUTCFullYear()
const CURRENT_MONTH = NOW_SP.getUTCMonth() + 1

export const DEFAULT_PERIOD: PeriodFilter = { kind: 'year', year: CURRENT_YEAR }

/** Inicio e fim (inclusivo) do periodo, em ISO, com o corte de dia de Sao Paulo. */
export function periodRange(p: PeriodFilter): { dateFrom: string; dateTo: string } {
  const startMonth = p.kind === 'month' ? p.month - 1 : 0
  const endMonth = p.kind === 'month' ? p.month : 12
  const from = Date.UTC(p.year, startMonth, 1, BRT_OFFSET_H)
  const to = Date.UTC(p.year, endMonth, 1, BRT_OFFSET_H) - 1
  return { dateFrom: new Date(from).toISOString(), dateTo: new Date(to).toISOString() }
}

/** O periodKey do clube ("2026-09") pertence ao periodo escolhido? */
export function periodKeyMatches(p: PeriodFilter, periodKey: string): boolean {
  const [y, m] = periodKey.split('-').map(Number)
  if (y !== p.year) return false
  return p.kind === 'year' || m === p.month
}

export function periodLabel(p: PeriodFilter): string {
  return p.kind === 'month' ? `${MONTHS[p.month - 1]} ${p.year}` : `Ano ${p.year}`
}

/** Para frases: "outubro de 2026" ou "2026". */
export function periodText(p: PeriodFilter): string {
  return p.kind === 'month' ? `${MONTHS[p.month - 1].toLowerCase()} de ${p.year}` : String(p.year)
}

function shift(p: PeriodFilter, delta: number): PeriodFilter {
  if (p.kind === 'year') return { kind: 'year', year: p.year + delta }
  const idx = p.year * 12 + (p.month - 1) + delta
  return { kind: 'month', year: Math.floor(idx / 12), month: (idx % 12) + 1 }
}

function isAtPresent(p: PeriodFilter): boolean {
  return p.kind === 'year' ? p.year >= CURRENT_YEAR : p.year * 12 + p.month >= CURRENT_YEAR * 12 + CURRENT_MONTH
}

const AVATAR_COLORS: [string, string][] = [['#F87171', '#DC2626'], ['#60A5FA', '#2563EB'], ['#34D399', '#059669'], ['#FBBF24', '#D97706'], ['#A78BFA', '#7C3AED']]
function avatarColors(seed: string): [string, string] {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}
function isPhoto(u: string | null): u is string {
  return !!u && (u.startsWith('http') || u.startsWith('data:') || u.startsWith('/'))
}

function ProfAvatar({ p }: { p: FilterProf }) {
  const base: React.CSSProperties = {
    width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontSize: 12, fontWeight: 700,
  }
  if (isPhoto(p.avatarUrl)) {
    return <span aria-hidden style={{ ...base, backgroundImage: `url("${p.avatarUrl.replace(/"/g, '%22')}")`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
  }
  const [a, b] = avatarColors(p.id)
  return <span aria-hidden style={{ ...base, background: `linear-gradient(135deg,${a},${b})` }}>{(p.name || '?').slice(0, 1).toUpperCase()}</span>
}

function chipStyle(active: boolean, withAvatar: boolean): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0,
    minHeight: 44, padding: withAvatar ? '0 14px 0 6px' : '0 16px',
    borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
    fontSize: 13, fontWeight: 600,
    // Selecionado em tinta escura, nao em vermelho: a aba ativa logo abaixo ja e vermelha.
    background: active ? typography.color.primary : '#fff',
    color: active ? '#fff' : typography.color.primary,
    border: `1px solid ${active ? typography.color.primary : colors.gray.border}`,
    WebkitTapHighlightColor: 'transparent',
  }
}

/** Faixa de profissionais: "Todos" + um chip por profissional ativo. */
export function ProfChips({ profs, value, onChange }: {
  profs: FilterProf[]; value: string | null; onChange: (id: string | null) => void
}) {
  if (profs.length === 0) return null
  return (
    <div role="group" aria-label="Filtrar por profissional" style={{
      display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none',
      padding: '2px 0 4px', marginBottom: 12,
    }}>
      <button type="button" aria-pressed={value === null} onClick={() => onChange(null)} style={chipStyle(value === null, false)}>
        Todos
      </button>
      {profs.map((p) => (
        <button key={p.id} type="button" aria-pressed={value === p.id} onClick={() => onChange(value === p.id ? null : p.id)} style={chipStyle(value === p.id, true)}>
          <ProfAvatar p={p} />
          {p.name.split(' ')[0]}
        </button>
      ))}
    </div>
  )
}

/** Mes com setas, ou o ano todo. As setas andam de mes em mes ou de ano em ano. */
export function PeriodPicker({ value, onChange }: { value: PeriodFilter; onChange: (p: PeriodFilter) => void }) {
  const atPresent = isAtPresent(value)
  const arrow: React.CSSProperties = {
    minWidth: 44, minHeight: 44, border: 'none', background: 'transparent', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', color: typography.color.primary,
    fontFamily: 'inherit', borderRadius: 12,
  }
  const toggleTo: PeriodFilter = value.kind === 'year'
    ? { kind: 'month', year: value.year, month: value.year === CURRENT_YEAR ? CURRENT_MONTH : 12 }
    : { kind: 'year', year: value.year }
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14 }}>
      <div style={{
        flex: 1, minWidth: 0, display: 'flex', alignItems: 'center',
        background: '#fff', border: `1px solid ${colors.gray.border}`, borderRadius: 12,
      }}>
        <button type="button" aria-label={value.kind === 'year' ? 'Ano anterior' : 'Mês anterior'} onClick={() => onChange(shift(value, -1))} style={arrow}>
          <ChevronLeft size={18} />
        </button>
        <div aria-live="polite" style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 650, color: typography.color.primary, fontVariantNumeric: 'tabular-nums' }}>
          {periodLabel(value)}
        </div>
        <button type="button" aria-label={value.kind === 'year' ? 'Próximo ano' : 'Próximo mês'} disabled={atPresent} onClick={() => onChange(shift(value, 1))}
          style={{ ...arrow, cursor: atPresent ? 'default' : 'pointer', opacity: atPresent ? 0.3 : 1 }}>
          <ChevronRight size={18} />
        </button>
      </div>
      <button type="button" onClick={() => onChange(toggleTo)} style={{
        minHeight: 44, padding: '0 14px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
        fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
        background: '#fff', color: typography.color.primary, border: `1px solid ${colors.gray.border}`,
      }}>
        {value.kind === 'year' ? 'Por mês' : 'Ano todo'}
      </button>
    </div>
  )
}
