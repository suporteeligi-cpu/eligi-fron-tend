'use client'
// src/app/dashboard/page.tsx
// @eligi:cockpit-v1
// @eligi:cockpit-v1-1-breakpoints
// @eligi:priorities-mounted
// @eligi:charts-native
// @eligi:online-card-paired
// @eligi:realtime-on
// Visao geral — direcao "Cockpit" (fatia 1).
//
// O que esta fatia entrega:
//   - saudacao contextual (sem nome: a AppNavbar ja mostra "Ola, <nome>")
//   - ticker horizontal de KPIs no lugar do hero + side card + strip de 3
//   - glassCard / inkLight do theme.ts no lugar do token CARD local
//   - fim do EmptySlot ("EM BREVE")
//
// O que NAO muda aqui (fatias seguintes):

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Loader2,
  Banknote,
  CalendarDays,
  CalendarClock,
  Receipt,
  UserCheck,
  UserX,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'
import AccessDenied from '@/app/components/AccessDenied'
import api from '@/shared/lib/apiClient'
import { colors, typography, radius, shadows, glassCard, inkLight } from '@/shared/theme'
import { useDeviceMode } from '@/features/agenda/hooks/useDeviceMode'
import {
  DashboardOverview,
  DashboardPeriod,
  DashboardKPIs,
} from '@/features/dashboard/types'
import { useDashboardRealtime } from '@/features/dashboard/hooks/useDashboardRealtime'
import {
  fmtBRL,
  fmtBRLCompact,
  fmtGrowth,
  fmtPercent,
  todayFull,
  periodLabel,
  periodCompareLabel,
} from '@/features/dashboard/utils/format'

import RevenueSparkline        from './components/RevenueSparkline'
import TopProfessionalsCard    from './components/TopProfessionalsCard'
import TodayScheduleCard       from './components/TodayScheduleCard'
import PrioritiesCard          from './components/PrioritiesCard'
import PeriodSelector          from './components/PeriodSelector'
import OnlineChannelCard      from './components/OnlineChannelCard'

// ─── tokens locais ─────────────────────────────────────────────────────────

/** Face display: numeros e titulos. Ja carregada no globals.css. */
const DISPLAY_FONT = `'Space Grotesk', ${typography.fontFamily}`

const PAGE_MAX_WIDTH = 1100
const MOBILE_GUTTER  = 12

// ─── helpers ───────────────────────────────────────────────────────────────

/** Saudacao por faixa horaria. Sem nome: a AppNavbar ja identifica o usuario. */
function greetingFor(hour: number): string {
  if (hour < 5)  return 'Boa madrugada'
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

function plural(n: number, singular: string, pluralWord: string): string {
  return n === 1 ? singular : pluralWord
}

/**
 * Resumo em linguagem natural. So afirma o que o payload garante —
 * nada de comparacao com historico que a API nao devolve.
 */
function buildSummary(kpis: DashboardKPIs, period: DashboardPeriod): string {
  const bookings = kpis.totalBookings
  const tomorrow = kpis.tomorrowBookings

  if (period === 'today') {
    const head = bookings === 0
      ? 'Nenhum atendimento registrado hoje'
      : `${bookings} ${plural(bookings, 'atendimento', 'atendimentos')} hoje`
    const tail = tomorrow > 0
      ? `, ${tomorrow} ${plural(tomorrow, 'agendado', 'agendados')} para amanhã`
      : ''
    return `${head}${tail}.`
  }

  const head = bookings === 0
    ? 'Nenhum atendimento no período'
    : `${bookings} ${plural(bookings, 'atendimento', 'atendimentos')} no período`
  return `${head}, ticket médio de ${fmtBRL(kpis.ticketAverage)}.`
}

// ─── ticker ────────────────────────────────────────────────────────────────

type IconComponent = React.ComponentType<{
  size?:       number
  color?:      string
  strokeWidth?: number
}>

interface TickerDelta {
  text:     string
  positive: boolean | null
  hint:     string
}

interface TickerItem {
  key:    string
  Icon:   IconComponent
  tint:   string
  value:  string
  label:  string
  delta?: TickerDelta
}

function buildTicker(
  kpis:     DashboardKPIs,
  period:   DashboardPeriod,
  isMobile: boolean,
): TickerItem[] {
  const money = (v: number) => (isMobile ? fmtBRLCompact(v) : fmtBRL(v))
  const growth = fmtGrowth(kpis.revenueGrowth)

  const items: TickerItem[] = [
    {
      key:   'revenue',
      Icon:  Banknote,
      tint:  inkLight.ok.text,
      value: money(kpis.revenue),
      label: periodLabel(period).toLowerCase(),
      delta: {
        text:     growth.text,
        positive: growth.positive,
        hint:     periodCompareLabel(period),
      },
    },
    {
      key:   'bookings',
      Icon:  CalendarDays,
      tint:  inkLight.info.text,
      value: String(kpis.totalBookings),
      label: plural(kpis.totalBookings, 'atendimento', 'atendimentos'),
    },
  ]

  if (kpis.tomorrowBookings > 0) {
    items.push({
      key:   'tomorrow',
      Icon:  CalendarClock,
      tint:  inkLight.info.text,
      value: String(kpis.tomorrowBookings),
      label: 'amanhã',
    })
  }

  items.push(
    {
      key:   'ticket',
      Icon:  Receipt,
      tint:  inkLight.neutral.text,
      value: money(kpis.ticketAverage),
      label: 'ticket médio',
    },
    {
      key:   'attendance',
      Icon:  UserCheck,
      tint:  inkLight.ok.text,
      value: fmtPercent(kpis.attendanceRate),
      label: 'presença',
    },
    {
      key:   'noshow',
      Icon:  UserX,
      tint:  kpis.noShowCount === 0 ? inkLight.neutral.text : inkLight.warn.text,
      value: kpis.noShowCount === 0 ? '—' : String(kpis.noShowCount),
      label: kpis.noShowCount === 0
        ? 'sem faltas'
        : `${plural(kpis.noShowCount, 'falta', 'faltas')} · ${fmtPercent(kpis.noShowRate)}`,
    },
  )

  return items
}

function DeltaChip({ delta }: { delta: TickerDelta }) {
  const tone =
    delta.positive === true  ? inkLight.ok :
    delta.positive === false ? inkLight.bad :
    inkLight.neutral

  const Arrow =
    delta.positive === true  ? TrendingUp :
    delta.positive === false ? TrendingDown :
    Minus

  return (
    <span
      title={delta.hint}
      style={{
        display:      'inline-flex',
        alignItems:   'center',
        gap:          3,
        flexShrink:   0,
        fontSize:     11,
        fontWeight:   typography.weight.bold,
        color:        tone.text,
        background:   tone.bg,
        border:       `0.5px solid ${tone.border}`,
        borderRadius: radius.full,
        padding:      '3px 7px',
        lineHeight:   1,
      }}
    >
      <Arrow size={11} strokeWidth={2.4} />
      {delta.text}
    </span>
  )
}

function TickerPill({ item }: { item: TickerItem }) {
  const { Icon } = item

  return (
    <div
      className="eligi-pill"
      style={{
        ...glassCard,
        borderRadius:  radius.full,
        boxShadow:     shadows.sm,
        display:       'flex',
        alignItems:    'center',
        gap:           10,
        padding:       '10px 14px',
        flex:          '0 0 auto',
        scrollSnapAlign: 'start',
        whiteSpace:    'nowrap',
      }}
    >
      <span
        style={{
          display:        'grid',
          placeItems:     'center',
          width:          28,
          height:         28,
          flexShrink:     0,
          borderRadius:   radius.sm,
          background:     'var(--surface-2, rgba(0,0,0,0.04))',
        }}
      >
        <Icon size={14} color={item.tint} strokeWidth={2.2} />
      </span>

      <span style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
        <span
          style={{
            fontFamily:         DISPLAY_FONT,
            fontSize:           17,
            fontWeight:         typography.weight.bold,
            color:              inkLight.strong,
            lineHeight:         1.05,
            letterSpacing:      '-.02em',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {item.value}
        </span>
        <span style={{ fontSize: 11, color: inkLight.label, lineHeight: 1.2 }}>
          {item.label}
        </span>
      </span>

      {item.delta ? <DeltaChip delta={item.delta} /> : null}
    </div>
  )
}

// ─── pagina principal ──────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user: authUser } = useAuth()

  const mode     = useDeviceMode()
  const isMobile = mode === 'mobile'
  const router   = useRouter()

  const [period, setPeriod]   = useState<DashboardPeriod>('today')
  const [data, setData]       = useState<DashboardOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  // Faixa horaria congelada na montagem: evita a saudacao trocar sozinha
  // no meio da sessao e mantem o render estavel pro React Compiler.
  const [greeting] = useState(() => greetingFor(new Date().getHours()))

  const fetchData = useCallback(async (p: DashboardPeriod) => {
    try {
      setError(null)
      const res = await api.get('/dashboard/overview', { params: { period: p } })
      setData(res.data)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e.response?.data?.message ?? 'Erro ao carregar dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData(period) }, [fetchData, period])

  // Realtime: o servidor avisa que algo mudou, a pagina repergunta.
  // O periodo entra na dependencia via useCallback para o refetch nao
  // recarregar sempre o periodo da primeira renderizacao.
  const refreshCurrent = useCallback(() => { fetchData(period) }, [fetchData, period])
  // `?? undefined` cobre o caso de businessId ser `string | null` no AuthUser:
  // o hook aceita `string | undefined` e `null` nao seria atribuivel.
  useDashboardRealtime(authUser?.businessId ?? undefined, refreshCurrent)

  // Guard: funcionários não vêem o dashboard geral (dentro do JSX para não violar regra de hooks)
  // BASIC_STAFF e RECEPTIONIST: nunca veem o dashboard — redirect silencioso
  const agendaOnlyRoles = ['BASIC_STAFF', 'RECEPTIONIST']
  if (authUser && agendaOnlyRoles.includes(authUser.role)) {
    router.replace('/dashboard/agenda')
    return null
  }
  const staffRoles = ['MANAGER', 'STAFF']
  const isStaff = Boolean(authUser && staffRoles.includes(authUser.role))

  return (
    <>
      <style>{`
        @keyframes fadeUp   { from { opacity:0;transform:translateY(8px) } to { opacity:1;transform:translateY(0) } }
        @keyframes pos-spin { to   { transform:rotate(360deg) } }
        .eligi-page { max-width: ${PAGE_MAX_WIDTH}px; padding: 0; }
        .eligi-duo  { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; }
        /* Duas colunas so quando ha largura real pra elas. O device mode
           (ponteiro) nao serve pra decidir layout: janela estreita de desktop
           e laptop hibrido caiam em 2 colunas e cortavam o texto. */
        @media (min-width: 900px) {
          .eligi-duo { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 899px) {
          .eligi-page  { padding: 0 ${MOBILE_GUTTER}px; }
          .eligi-bleed { margin-left: -${MOBILE_GUTTER}px; margin-right: -${MOBILE_GUTTER}px;
                         padding-left: ${MOBILE_GUTTER}px; padding-right: ${MOBILE_GUTTER}px; }
        }
        .eligi-ticker { scrollbar-width: none; -ms-overflow-style: none; }
        .eligi-ticker::-webkit-scrollbar { display: none; }
        .eligi-pill { transition: transform .18s cubic-bezier(0.34,1.56,0.64,1), box-shadow .18s ease; }
        @media (hover: hover) {
          .eligi-pill:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,0,0,0.09); }
        }
        @media (prefers-reduced-motion: reduce) {
          .eligi-pill { transition: none; }
          .eligi-pill:hover { transform: none; }
        }
      `}</style>

      {isStaff && (
        <AccessDenied message="A visão geral do dashboard é exclusiva para proprietários. Use o menu lateral para navegar." />
      )}

      {!isStaff && <div className="eligi-page" style={{
        animation:  'fadeUp 0.3s ease',
        fontFamily: typography.fontFamily,
      }}>
        {/* ── Header ── */}
        <div style={{
          display:        'flex',
          alignItems:     'flex-start',
          justifyContent: 'space-between',
          gap:            12,
          marginBottom:   18,
        }}>
          <div style={{ minWidth: 0 }}>
            <h1 style={{
              fontFamily:    DISPLAY_FONT,
              fontSize:      'clamp(24px, 6vw, 30px)',
              fontWeight:    typography.weight.bold,
              color:         inkLight.strong,
              margin:        0,
              letterSpacing: '-.025em',
              lineHeight:    1.1,
            }}>
              {greeting}
            </h1>
            <p style={{
              fontSize:      13,
              color:         inkLight.label,
              marginTop:     4,
              marginBottom:  0,
              lineHeight:    1.45,
            }}>
              {data ? buildSummary(data.kpis, period) : todayFull()}
            </p>
          </div>
          <PeriodSelector value={period} onChange={setPeriod} />
        </div>

        {/* ── Loading ── */}
        {loading || !data ? (
          <div style={{
            display:        'flex',
            justifyContent: 'center',
            alignItems:     'center',
            padding:        80,
          }}>
            <Loader2 size={28} style={{
              animation: 'pos-spin 0.8s linear infinite',
              color:     colors.red.DEFAULT,
            }} />
          </div>
        ) : error ? (
          <div style={{
            padding:      '16px 20px',
            background:   'rgba(220,38,38,0.06)',
            border:       `1px solid ${colors.red.border}`,
            borderRadius: radius.md,
            color:        colors.red.DEFAULT,
            fontSize:     typography.scale.sm,
            textAlign:    'center',
          }}>
            {error}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* ── Ticker de KPIs ── */}
            <div
              className="eligi-ticker eligi-bleed"
              style={{
                display:         'flex',
                gap:             8,
                overflowX:       'auto',
                scrollSnapType:  'x proximity',
                WebkitOverflowScrolling: 'touch',
                paddingBottom:   2,
              }}
            >
              {buildTicker(data.kpis, period, isMobile).map(item => (
                <TickerPill key={item.key} item={item} />
              ))}
            </div>

            {/* ── Prioridades ── */}
            <PrioritiesCard alerts={data.alerts} />

            {/* ── Receita + Top profissionais ── */}
            <div className="eligi-duo">
              <RevenueSparkline data={data.revenueChart} period={period} />
              <TopProfessionalsCard professionals={data.topProfessionals} />
            </div>

            {/* ── Agenda de hoje + canal online ── */}
            <div className="eligi-duo">
              <TodayScheduleCard
                items={data.todaySchedule}
                tomorrowCount={data.kpis.tomorrowBookings}
              />
              <OnlineChannelCard data={data.kpis.onlineBookings} />
            </div>

          </div>
        )}
      </div>}
    </>
  )
}
