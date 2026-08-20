'use client'
// src/app/dashboard/components/OnboardingChecklistCard.tsx
// @eligi:checklist-v2-card
// Card "Configure seu negocio" — fixo no topo do dashboard.
//
// v2:
//  - dois grupos: essential (conta no %) e recommended (nao conta)
//  - itens concluidos colapsam atras de um toggle (card curto no mobile)
//  - aos 100% dos essenciais NAO some: vira um chip discreto que continua
//    cobrando o que ainda for recomendado, e reabre sozinho se algo regredir
//    (profissional novo sem foto, servico sem preco, assinatura vencida)
//  - falha de rede tem estado visivel + "tentar novamente" (antes o card
//    simplesmente sumia e erro 500 era indistinguivel de checklist completo)
//  - linha clicavel acessivel por teclado (role/tabIndex/Enter/Espaco)
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  Circle,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ListChecks,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { colors, typography } from '@/shared/theme'

type ChecklistGroup = 'essential' | 'recommended'

interface ChecklistItem {
  key: string
  label: string
  done: boolean
  href: string
  group: ChecklistGroup
  hint?: string
  meta?: {
    trialDaysLeft?: number
    missing?: number
    current?: number
    target?: number
  }
}

interface ChecklistData {
  progress: number
  done: number
  total: number
  complete: boolean
  items: ChecklistItem[]
}

const GREEN = '#16a34a'
const AMBER_BG = 'rgba(234,179,8,0.14)'
const AMBER_FG = '#a16207'

const cardShell: React.CSSProperties = {
  background: '#fff',
  border: `0.5px solid ${colors.gray.borderMd}`,
  borderLeft: `2.5px solid ${colors.red.DEFAULT}`,
  borderRadius: 14,
  boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.07)',
  padding: '18px 22px',
  fontFamily: typography.fontFamily,
  marginBottom: 16,
  animation: 'fadeUp 0.4s ease both',
}

const badgeBase: React.CSSProperties = {
  fontSize: 11,
  padding: '3px 9px',
  borderRadius: 8,
  whiteSpace: 'nowrap',
  flexShrink: 0,
}

const toggleBase: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  background: 'none',
  border: 'none',
  padding: '6px 6px',
  cursor: 'pointer',
  fontFamily: typography.fontFamily,
  fontSize: 12,
  color: typography.color.muted,
}

/** Badge do lado direito da linha — so aparece quando agrega informacao. */
function ItemBadge({ item }: { item: ChecklistItem }) {
  if (item.done) return null

  const trial = item.meta?.trialDaysLeft
  if (typeof trial === 'number' && trial > 0) {
    return (
      <span style={{ ...badgeBase, background: AMBER_BG, color: AMBER_FG }}>
        {trial} {trial === 1 ? 'dia' : 'dias'} de trial
      </span>
    )
  }

  const missing = item.meta?.missing
  if (typeof missing === 'number' && missing > 0) {
    return (
      <span
        style={{
          ...badgeBase,
          background: 'rgba(220,38,38,0.10)',
          color: colors.red.DEFAULT,
        }}
      >
        {missing} sem foto
      </span>
    )
  }

  const current = item.meta?.current
  const target = item.meta?.target
  if (typeof current === 'number' && typeof target === 'number') {
    return (
      <span
        style={{ ...badgeBase, background: 'rgba(0,0,0,0.05)', color: typography.color.muted }}
      >
        {current} de {target}
      </span>
    )
  }

  return null
}

function ChecklistRow({
  item,
  onGo,
}: {
  item: ChecklistItem
  onGo: (href: string) => void
}) {
  const clickable = !item.done

  const activate = () => {
    if (clickable) onGo(item.href)
  }

  return (
    <div
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={clickable ? item.label : undefined}
      onClick={activate}
      onKeyDown={(e) => {
        if (!clickable) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          activate()
        }
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 6px',
        borderRadius: 8,
        cursor: clickable ? 'pointer' : 'default',
        transition: 'background 0.15s',
        outline: 'none',
      }}
      onMouseEnter={(e) => {
        if (clickable) (e.currentTarget as HTMLDivElement).style.background = 'rgba(0,0,0,0.03)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.background = 'transparent'
      }}
      onFocus={(e) => {
        if (clickable) (e.currentTarget as HTMLDivElement).style.background = 'rgba(0,0,0,0.05)'
      }}
      onBlur={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.background = 'transparent'
      }}
    >
      {item.done ? (
        <CheckCircle2 size={20} color={GREEN} style={{ flexShrink: 0 }} />
      ) : (
        <Circle size={20} color="rgba(0,0,0,0.25)" style={{ flexShrink: 0 }} />
      )}

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span
          style={{
            fontSize: 14,
            color: item.done ? typography.color.muted : typography.color.primary,
          }}
        >
          {item.label}
        </span>
        {!item.done && item.hint && (
          <span style={{ fontSize: 11.5, color: typography.color.muted, lineHeight: 1.35 }}>
            {item.hint}
          </span>
        )}
      </div>

      <ItemBadge item={item} />

      {clickable && <ChevronRight size={18} color="rgba(0,0,0,0.3)" style={{ flexShrink: 0 }} />}
    </div>
  )
}

export default function OnboardingChecklistCard() {
  const router = useRouter()
  const [data, setData] = useState<ChecklistData | null>(null)
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [showDone, setShowDone] = useState(false)
  const [showExtras, setShowExtras] = useState(false)

  const load = useCallback(() => {
    // @eligi:checklist-v2-fix-effect
    // Nenhum setState sincrono antes da promise: load() e chamado no corpo
    // do useEffect e o React Compiler acusa cascading render (regra
    // react-hooks/set-state-in-effect). O .then abaixo ja limpa o erro.
    api
      .get<ChecklistData>('/onboarding/checklist')
      .then((res) => {
        setData(res.data)
        setFailed(false)
      })
      .catch(() => {
        setData(null)
        setFailed(true)
      })
      .finally(() => {
        setLoaded(true)
      })
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const goTo = useCallback(
    (href: string) => {
      router.push(href)
    },
    [router],
  )

  // primeira carga: nada na tela (evita salto de layout)
  if (!loaded) return null

  // falha de rede: estado visivel, nunca silencio
  if (failed || !data) {
    return (
      <div style={{ ...cardShell, borderLeft: '2.5px solid rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={18} color={typography.color.muted} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 13, color: typography.color.muted }}>
            Nao foi possivel carregar o seu checklist de configuracao.
          </span>
          <button
            type="button"
            onClick={load}
            style={{
              ...toggleBase,
              color: colors.red.DEFAULT,
              fontWeight: typography.weight.bold,
            }}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  const essential = data.items.filter((i) => i.group === 'essential')
  const extras = data.items.filter((i) => i.group === 'recommended')
  const pendingEssential = essential.filter((i) => !i.done)
  const doneEssential = essential.filter((i) => i.done)
  const pendingExtras = extras.filter((i) => !i.done)

  // tudo feito, inclusive as sugestoes: o card sai de cena
  if (data.complete && pendingExtras.length === 0) return null

  // essenciais 100%: chip discreto que ainda oferece as sugestoes
  if (data.complete) {
    return (
      <div style={{ ...cardShell, borderLeft: `2.5px solid ${GREEN}`, padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle2 size={18} color={GREEN} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 13, color: typography.color.primary }}>
            Configuracao essencial concluida
          </span>
          <button
            type="button"
            onClick={() => setShowExtras((v) => !v)}
            style={toggleBase}
            aria-expanded={showExtras}
          >
            <Sparkles size={14} />
            {pendingExtras.length} {pendingExtras.length === 1 ? 'sugestao' : 'sugestoes'}
            {showExtras ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {showExtras && (
          <div style={{ marginTop: 6 }}>
            {pendingExtras.map((item) => (
              <ChecklistRow key={item.key} item={item} onGo={goTo} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={cardShell}>
      {/* header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <ListChecks size={20} color={colors.red.DEFAULT} style={{ flexShrink: 0 }} />
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span
              style={{
                fontSize: 15,
                fontWeight: typography.weight.bold,
                color: typography.color.primary,
              }}
            >
              Configure seu negocio
            </span>
            <span style={{ fontSize: 12, color: typography.color.muted }}>
              {data.done} de {data.total} concluidos
            </span>
          </div>
        </div>
        <span
          style={{
            fontSize: 17,
            fontWeight: typography.weight.bold,
            color: colors.red.DEFAULT,
            flexShrink: 0,
          }}
        >
          {data.progress}%
        </span>
      </div>

      {/* barra de progresso */}
      <div
        style={{
          marginTop: 12,
          height: 6,
          width: '100%',
          background: 'rgba(0,0,0,0.06)',
          borderRadius: 999,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${data.progress}%`,
            background: colors.red.DEFAULT,
            borderRadius: 999,
            transition: 'width 0.4s ease',
          }}
        />
      </div>

      {/* pendentes */}
      <div style={{ marginTop: 10 }}>
        {pendingEssential.map((item) => (
          <ChecklistRow key={item.key} item={item} onGo={goTo} />
        ))}
      </div>

      {/* concluidos — colapsados por padrao pra nao esticar o card */}
      {doneEssential.length > 0 && (
        <div style={{ marginTop: 2 }}>
          <button
            type="button"
            onClick={() => setShowDone((v) => !v)}
            style={toggleBase}
            aria-expanded={showDone}
          >
            <CheckCircle2 size={14} color={GREEN} />
            {doneEssential.length} {doneEssential.length === 1 ? 'concluido' : 'concluidos'}
            {showDone ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showDone && (
            <div>
              {doneEssential.map((item) => (
                <ChecklistRow key={item.key} item={item} onGo={goTo} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* recomendados — nao contam no progresso */}
      {pendingExtras.length > 0 && (
        <div style={{ marginTop: 6, borderTop: '0.5px solid rgba(0,0,0,0.07)', paddingTop: 4 }}>
          <button
            type="button"
            onClick={() => setShowExtras((v) => !v)}
            style={toggleBase}
            aria-expanded={showExtras}
          >
            <Sparkles size={14} />
            Recomendado ({pendingExtras.length}) — nao conta no progresso
            {showExtras ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showExtras && (
            <div>
              {pendingExtras.map((item) => (
                <ChecklistRow key={item.key} item={item} onGo={goTo} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
