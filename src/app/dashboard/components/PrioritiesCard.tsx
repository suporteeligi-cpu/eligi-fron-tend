'use client'
// src/app/dashboard/components/PrioritiesCard.tsx
// @eligi:priorities-v1
// @eligi:priorities-fiscal
// Fila "Precisa de voce" — substitui AlertsCard + OnboardingChecklistCard.
//
// Cada linha e uma pendencia acionavel, com trilho de cor a esquerda e um
// botao que diz exatamente o que acontece ao clicar (Pagar / Repor / Atribuir).
//
// O checklist de configuracao entra como uma linha expansivel: o percentual
// vira trilho fino na propria linha e os itens pendentes abrem inline,
// reaproveitando ChecklistRow (a11y por teclado preservada).
//
// Preservado do card antigo: estado de falha com "tentar novamente", grupo
// "recomendado" que nao conta no progresso, e o sumico total quando nao ha
// nada pendente.

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  DollarSign,
  Package,
  UserPlus,
  FileWarning,
  ListChecks,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'

import { colors, typography, radius, shadows, glassCard, inkLight } from '@/shared/theme'
import { DashboardAlerts, DashboardFiscal } from '@/features/dashboard/types'
import { fmtBRL } from '@/features/dashboard/utils/format'
import {
  useOnboardingChecklist,
  ChecklistItem,
} from '@/features/dashboard/hooks/useOnboardingChecklist'
import ChecklistRow from './ChecklistRow'

// ─── tokens ────────────────────────────────────────────────────────────────

const DISPLAY_FONT = `'Space Grotesk', ${typography.fontFamily}`

/** Trilho de cor por tipo de pendencia. Dinheiro roxo, estoque ambar,
 *  agenda azul, configuracao vermelho (a cor da marca puxa o onboarding). */
const RAIL = {
  money:     { rail: 'linear-gradient(180deg,#7C3AED,#5b21b6)', bg: 'rgba(124,58,237,0.10)', fg: '#6D28D9' },
  stock:     { rail: 'linear-gradient(180deg,#f59e0b,#b45309)', bg: inkLight.warn.bg,        fg: inkLight.warn.text },
  agenda:    { rail: 'linear-gradient(180deg,#3b82f6,#2563eb)', bg: inkLight.info.bg,        fg: inkLight.info.text },
  setup:     { rail: colors.red.gradient,                       bg: 'rgba(220,38,38,0.09)',  fg: colors.red.DEFAULT },
  fiscal:    { rail: 'linear-gradient(180deg,#0d9488,#0f766e)', bg: 'rgba(13,148,136,0.10)', fg: '#0f766e' },
} as const

type RailTone = typeof RAIL[keyof typeof RAIL]

type IconComponent = React.ComponentType<{
  size?:        number
  color?:       string
  strokeWidth?: number
}>

// ─── linha de prioridade ───────────────────────────────────────────────────

function PriorityRow({
  tone,
  Icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  children,
  footer,
}: {
  tone:        RailTone
  Icon:        IconComponent
  title:       string
  subtitle:    string
  actionLabel: string
  onAction:    () => void
  children?:   React.ReactNode
  footer?:     React.ReactNode
}) {
  return (
    <div
      className="eligi-prio"
      style={{
        position:     'relative',
        overflow:     'hidden',
        background:   '#fff',
        border:       `0.5px solid ${colors.gray.border}`,
        borderRadius: radius.xl,
        boxShadow:    shadows.sm,
      }}
    >
      <span
        aria-hidden
        style={{
          position:     'absolute',
          left:         0,
          top:          0,
          bottom:       0,
          width:        4,
          background:   tone.rail,
          borderRadius: '0 4px 4px 0',
        }}
      />

      <div style={{
        display:    'flex',
        alignItems: 'center',
        gap:        12,
        padding:    '13px 14px 13px 18px',
      }}>
        <span style={{
          display:      'grid',
          placeItems:   'center',
          width:        40,
          height:       40,
          flexShrink:   0,
          borderRadius: radius.md,
          background:   tone.bg,
        }}>
          <Icon size={18} color={tone.fg} strokeWidth={2.1} />
        </span>

        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{
            fontFamily:         DISPLAY_FONT,
            fontSize:           14.5,
            fontWeight:         typography.weight.bold,
            color:              inkLight.strong,
            lineHeight:         1.25,
            letterSpacing:      '-.01em',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {title}
          </span>
          <span style={{
            fontSize:          12,
            color:             inkLight.label,
            lineHeight:        1.35,
            display:           '-webkit-box',
            WebkitLineClamp:   2,
            WebkitBoxOrient:   'vertical',
            overflow:          'hidden',
          }}>
            {subtitle}
          </span>
          {footer}
        </span>

        <button
          type="button"
          onClick={onAction}
          className="eligi-prio-btn"
          style={{
            flexShrink:              0,
            fontFamily:              'inherit',
            fontSize:                12.5,
            fontWeight:              typography.weight.bold,
            color:                   tone.fg,
            background:              tone.bg,
            border:                  'none',
            borderRadius:            radius.full,
            padding:                 '9px 14px',
            cursor:                  'pointer',
            whiteSpace:              'nowrap',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {actionLabel}
        </button>
      </div>

      {children}
    </div>
  )
}

// ─── card ──────────────────────────────────────────────────────────────────

export default function PrioritiesCard({
  alerts,
  fiscal,
}: {
  alerts: DashboardAlerts
  fiscal: DashboardFiscal | null
}) {
  const router = useRouter()
  const { data, failed, loaded, reload } = useOnboardingChecklist()
  const [openChecklist, setOpenChecklist] = useState(false)

  const goTo = useCallback((href: string) => { router.push(href) }, [router])

  const hasCommissions = alerts.pendingCommissions.total > 0
  const hasLowStock    = alerts.lowStock.count > 0
  const hasUnassigned  = alerts.unassignedBookings.count > 0
  // fiscal e null quando o estabelecimento nao emite NFS-e: a fila nem sabe
  // que essa linha existe.
  const hasRejected    = (fiscal?.rejected ?? 0) > 0

  // Checklist: pendencias essenciais e sugestoes.
  const essentialPending: ChecklistItem[] =
    data ? data.items.filter(i => i.group === 'essential' && !i.done) : []
  const extrasPending: ChecklistItem[] =
    data ? data.items.filter(i => i.group === 'recommended' && !i.done) : []

  const checklistPending = essentialPending.length + extrasPending.length
  const showChecklist    = loaded && (failed || checklistPending > 0)

  const alertCount =
    Number(hasCommissions) + Number(hasLowStock) + Number(hasUnassigned) + Number(hasRejected)
  const total      = alertCount + (showChecklist ? 1 : 0)

  // Enquanto o checklist ainda nao respondeu, nao pinta o "tudo em ordem" —
  // ele poderia aparecer e sumir um instante depois (salto de layout).
  if (total === 0 && !loaded) return null

  const plural = (n: number, s: string, p: string) => (n === 1 ? s : p)

  return (
    <div style={{
      ...glassCard,
      borderRadius: radius['2xl'],
      padding:      14,
      fontFamily:   typography.fontFamily,
    }}>
      <style>{`
        .eligi-prio { transition: box-shadow .18s ease, transform .18s cubic-bezier(0.34,1.56,0.64,1); }
        .eligi-prio-btn { transition: filter .15s ease; }
        @media (hover: hover) {
          .eligi-prio:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.08); }
          .eligi-prio-btn:hover { filter: brightness(0.94); }
        }
        @media (prefers-reduced-motion: reduce) {
          .eligi-prio, .eligi-prio-btn { transition: none; }
          .eligi-prio:hover { box-shadow: none; }
        }
      `}</style>

      {/* cabecalho */}
      <div style={{
        display:      'flex',
        alignItems:   'center',
        gap:          8,
        padding:      '2px 4px 12px',
      }}>
        <span style={{
          fontSize:      11,
          fontWeight:    typography.weight.bold,
          letterSpacing: '.13em',
          textTransform: 'uppercase',
          color:         inkLight.label,
        }}>
          {total === 0 ? 'Tudo em ordem' : 'Precisa de você'}
        </span>
        {total > 0 && (
          <span style={{
            fontSize:           11,
            fontWeight:         typography.weight.bold,
            color:              inkLight.strong,
            background:         'rgba(0,0,0,0.06)',
            borderRadius:       radius.full,
            padding:            '2px 8px',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {total}
          </span>
        )}
      </div>

      {total === 0 ? (
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          gap:            10,
          padding:        '22px 8px',
          color:          inkLight.ok.text,
          fontSize:       typography.scale.md,
        }}>
          <CheckCircle2 size={18} strokeWidth={2.2} />
          Nenhuma pendência no momento
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {hasCommissions && (
            <PriorityRow
              tone={RAIL.money}
              Icon={DollarSign}
              title={`${fmtBRL(alerts.pendingCommissions.total)} em comissões`}
              subtitle={`${alerts.pendingCommissions.professionals} ${plural(alerts.pendingCommissions.professionals, 'profissional aguardando', 'profissionais aguardando')} pagamento`}
              actionLabel="Pagar"
              onAction={() => goTo(alerts.pendingCommissions.href)}
            />
          )}

          {hasLowStock && (
            <PriorityRow
              tone={RAIL.stock}
              Icon={Package}
              title={`${alerts.lowStock.count} ${plural(alerts.lowStock.count, 'produto acabando', 'produtos acabando')}`}
              subtitle={
                alerts.lowStock.items.length > 0
                  ? alerts.lowStock.items.map(i => i.name).join(', ')
                  : 'Confira o estoque para não perder venda'
              }
              actionLabel="Repor"
              onAction={() => goTo(alerts.lowStock.href)}
            />
          )}

          {hasUnassigned && (
            <PriorityRow
              tone={RAIL.agenda}
              Icon={UserPlus}
              title={`${alerts.unassignedBookings.count} ${plural(alerts.unassignedBookings.count, 'agendamento sem profissional', 'agendamentos sem profissional')}`}
              subtitle="Defina quem vai atender para o cliente saber com quem falar"
              actionLabel="Atribuir"
              onAction={() => goTo(alerts.unassignedBookings.href)}
            />
          )}

          {hasRejected && fiscal ? (
            <PriorityRow
              tone={RAIL.fiscal}
              Icon={FileWarning}
              title={`${fiscal.rejected} ${plural(fiscal.rejected, 'nota rejeitada', 'notas rejeitadas')}`}
              subtitle="A prefeitura recusou a emissão. Sem correção o faturamento fica sem documento fiscal."
              actionLabel="Corrigir"
              onAction={() => goTo(fiscal.href)}
            />
          ) : null}

          {showChecklist && failed && (
            <PriorityRow
              tone={RAIL.setup}
              Icon={AlertCircle}
              title="Checklist indisponível"
              subtitle="Não foi possível carregar o seu checklist de configuração."
              actionLabel="Tentar de novo"
              onAction={reload}
            />
          )}

          {showChecklist && !failed && data && (
            <PriorityRow
              tone={RAIL.setup}
              Icon={ListChecks}
              title={`Configuração ${data.progress}%`}
              subtitle={
                essentialPending.length > 0
                  ? `${essentialPending.length} ${plural(essentialPending.length, 'passo restante', 'passos restantes')} para o negócio ficar pronto`
                  : `Essencial concluído · ${extrasPending.length} ${plural(extrasPending.length, 'sugestão', 'sugestões')} para melhorar`
              }
              actionLabel={openChecklist ? 'Fechar' : 'Ver'}
              onAction={() => setOpenChecklist(v => !v)}
              footer={
                <span
                  aria-hidden
                  style={{
                    display:      'block',
                    height:       4,
                    width:        '100%',
                    marginTop:    4,
                    background:   'rgba(0,0,0,0.07)',
                    borderRadius: radius.full,
                    overflow:     'hidden',
                  }}
                >
                  <span style={{
                    display:      'block',
                    height:       '100%',
                    width:        `${data.progress}%`,
                    background:   colors.red.DEFAULT,
                    borderRadius: radius.full,
                    transition:   'width 0.4s ease',
                  }} />
                </span>
              }
            >
              {openChecklist && (
                <div style={{
                  borderTop: '0.5px solid rgba(0,0,0,0.07)',
                  padding:   '4px 12px 10px 18px',
                }}>
                  {essentialPending.map(item => (
                    <ChecklistRow key={item.key} item={item} onGo={goTo} />
                  ))}

                  {extrasPending.length > 0 && (
                    <div style={{
                      marginTop:  essentialPending.length > 0 ? 6 : 0,
                      paddingTop: essentialPending.length > 0 ? 6 : 0,
                      borderTop:  essentialPending.length > 0
                        ? '0.5px solid rgba(0,0,0,0.07)'
                        : 'none',
                    }}>
                      <div style={{
                        display:    'flex',
                        alignItems: 'center',
                        gap:        6,
                        padding:    '4px 6px 2px',
                        fontSize:   11.5,
                        color:      inkLight.label,
                      }}>
                        <Sparkles size={13} />
                        Recomendado — não conta no progresso
                      </div>
                      {extrasPending.map(item => (
                        <ChecklistRow key={item.key} item={item} onGo={goTo} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </PriorityRow>
          )}

        </div>
      )}
    </div>
  )
}
