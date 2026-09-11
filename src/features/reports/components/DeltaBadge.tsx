// src/features/reports/components/DeltaBadge.tsx
//
// Selo de variacao mensal para os relatorios. Diferente dos DeltaPill locais dos
// paineis antigos, aceita pct = null (sem base de comparacao no mes anterior):
// com movimento no mes atual mostra "novo"; sem movimento nao mostra nada.
// tone="dark" e para a chapa escura do EligiClub.
import { ArrowDown, ArrowUp } from 'lucide-react'
import { inkLight } from '@/shared/theme'
import { CLUB_BAD, CLUB_OK, CLUB_PAPER } from '../constants'

type Tone = 'light' | 'dark'

interface Palette {
  up: { color: string; bg: string }
  down: { color: string; bg: string }
  novo: { color: string; bg: string }
}

const PALETTES: Record<Tone, Palette> = {
  light: {
    up:   { color: inkLight.ok.text, bg: inkLight.ok.bg },
    down: { color: inkLight.bad.text, bg: inkLight.bad.bg },
    novo: { color: inkLight.ok.text, bg: inkLight.ok.bg },
  },
  dark: {
    up:   { color: CLUB_OK, bg: 'rgba(127,224,189,0.12)' },
    down: { color: CLUB_BAD, bg: 'rgba(252,165,165,0.14)' },
    novo: { color: CLUB_PAPER, bg: 'rgba(244,242,236,0.14)' },
  },
}

const BASE: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600,
  borderRadius: 8, padding: '2px 7px', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums',
}

export default function DeltaBadge({ pct, hasValue, tone = 'light' }: {
  pct: number | null
  /** Houve movimento no mes atual (decide se "novo" aparece quando pct = null). */
  hasValue: boolean
  tone?: Tone
}) {
  const palette = PALETTES[tone]
  if (pct === null) {
    if (!hasValue) return null
    return <span style={{ ...BASE, color: palette.novo.color, background: palette.novo.bg }}>novo</span>
  }
  const up = pct >= 0
  const Icon = up ? ArrowUp : ArrowDown
  const colors = up ? palette.up : palette.down
  return (
    <span
      style={{ ...BASE, color: colors.color, background: colors.bg }}
      aria-label={`${up ? 'Subiu' : 'Caiu'} ${Math.abs(pct)}% em relação ao mês anterior`}
    >
      <Icon size={11} aria-hidden="true" /> {Math.abs(pct)}%
    </span>
  )
}
