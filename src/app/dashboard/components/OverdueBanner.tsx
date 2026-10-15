'use client'
// src/app/dashboard/components/OverdueBanner.tsx
// @eligi:odue-banner — faixa "mensalidade em aberto" no topo da Visao geral (direcao A).
//
// Aparece so em PAST_DUE_GRACE: a renovacao venceu e o acesso continua ate o
// fim da tolerancia (3 dias uteis). Bloqueado ja tem o overlay do BillingGuard.
// So o dono: /billing/access resolve pelo dono e devolve ACTIVE para o resto.
// Some sozinha quando o pagamento compensa (rechecagem ao voltar para a aba).
// Fixa: sem botao de fechar (decisao do Eli).
//
// O link e a fatura VENCIDA mais antiga (overdue.invoiceUrl do
// /billing/subscription), nunca a do mes seguinte. Sem link (Asaas fora),
// o botao leva para a tela de assinatura.

import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'

import api from '@/shared/lib/apiClient'
import { colors, typography, inkLight } from '@/shared/theme'

const DISPLAY_FONT = `'Space Grotesk', ${typography.fontFamily}`
const TZ = 'America/Sao_Paulo'
const RECHECK_MS = 60_000

interface AccessState { status: string; graceEndsAt?: string }
interface SubscriptionView {
  value: number | null
  currentPeriodEnd: string | null
  overdue: { dueDate: string | null; invoiceUrl: string } | null
}
interface Banner {
  value:      number | null
  dueLabel:   string | null
  untilLabel: string
  lastDay:    boolean
  href:       string
  external:   boolean
}

function dayKeySP(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: TZ })
}
function ddmmFromKey(key: string): string {
  return `${key.slice(8, 10)}/${key.slice(5, 7)}`
}
function untilLabelOf(iso: string): string {
  const d = new Date(iso)
  const wd = d.toLocaleDateString('pt-BR', { timeZone: TZ, weekday: 'long' }).split('-')[0]
  return `${wd}, ${ddmmFromKey(dayKeySP(d))}`
}
function fmtBRL(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function OverdueBanner() {
  const [banner, setBanner] = useState<Banner | null>(null)
  const [lastCheck, setLastCheck] = useState(0)

  const check = useCallback(async () => {
    try {
      const acc = await api.get<{ data: AccessState }>('/billing/access')
      const st = acc.data?.data
      if (!st || st.status !== 'PAST_DUE_GRACE' || !st.graceEndsAt) {
        setBanner(null)
        return
      }
      const sub = await api.get<{ data: SubscriptionView }>('/billing/subscription')
      const s = sub.data?.data
      const now = new Date()
      const due = s?.overdue?.dueDate
        ? ddmmFromKey(s.overdue.dueDate)
        : s?.currentPeriodEnd ? ddmmFromKey(dayKeySP(new Date(s.currentPeriodEnd))) : null
      const invoice = s?.overdue?.invoiceUrl ?? null
      setBanner({
        value:      s?.value ?? null,
        dueLabel:   due,
        untilLabel: untilLabelOf(st.graceEndsAt),
        lastDay:    dayKeySP(now) === dayKeySP(new Date(st.graceEndsAt)),
        href:       invoice ?? '/dashboard/configuracoes/assinatura',
        external:   Boolean(invoice),
      })
    } catch {
      // falha de rede: mantem o que ja estava na tela; a proxima rechecagem tenta de novo
    } finally {
      setLastCheck(Date.now())
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => { void check() }, 0)
    return () => clearTimeout(t)
  }, [check])

  // Pagou em outra aba (fatura do Asaas) e voltou: rechecagem, no maximo 1x/min.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      if (Date.now() - lastCheck < RECHECK_MS) return
      void check()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [check, lastCheck])

  if (!banner) return null

  const title = banner.lastDay
    ? 'Último dia de acesso'
    : banner.value != null
      ? `Mensalidade de ${fmtBRL(banner.value)} em aberto`
      : 'Mensalidade em aberto'

  const body = banner.lastDay
    ? `A mensalidade${banner.dueLabel ? ` venceu em ${banner.dueLabel} e` : ''} ainda não compensou. Amanhã o painel fica bloqueado até o pagamento cair. Se você já pagou, é só aguardar.`
    : `${banner.dueLabel ? `Venceu em ${banner.dueLabel}. ` : ''}Se você já pagou, aguarde a compensação. Seu acesso continua até ${banner.untilLabel}.`

  return (
    <div
      role="status"
      className="eligi-odue"
      style={{
        display:      'flex',
        alignItems:   'center',
        flexWrap:     'wrap',
        gap:          12,
        padding:      '12px 14px',
        marginBottom: 16,
        borderRadius: 16,
        background:   inkLight.warn.bg,
        border:       `1px solid ${inkLight.warn.border}`,
        fontFamily:   typography.fontFamily,
      }}
    >
      <style>{`
        .eligi-odue-cta:focus-visible { outline: 2px solid ${colors.red.DEFAULT}; outline-offset: 2px; }
        @media (max-width: 520px) { .eligi-odue-cta { width: 100%; justify-content: center; } }
      `}</style>
      <div
        aria-hidden="true"
        style={{
          width: 38, height: 38, borderRadius: 11, flexShrink: 0,
          display: 'grid', placeItems: 'center',
          background: 'rgba(245,158,11,0.18)', color: inkLight.warn.text,
        }}
      >
        <AlertTriangle size={19} strokeWidth={2.2} />
      </div>
      <div style={{ flex: '1 1 220px', minWidth: 0 }}>
        <div style={{
          fontFamily: DISPLAY_FONT, fontSize: 15, fontWeight: 600,
          color: inkLight.warn.text, letterSpacing: '-.01em',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {title}
        </div>
        <div style={{
          fontSize: 13, lineHeight: 1.45, color: inkLight.label, marginTop: 2,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {body}
        </div>
      </div>
      <a
        className="eligi-odue-cta"
        href={banner.href}
        {...(banner.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        style={{
          display: 'inline-flex', alignItems: 'center', minHeight: 44,
          padding: '0 16px', borderRadius: 12,
          background: colors.red.DEFAULT, color: '#fff',
          fontSize: 14, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap',
        }}
      >
        Pagar a fatura
      </a>
    </div>
  )
}
