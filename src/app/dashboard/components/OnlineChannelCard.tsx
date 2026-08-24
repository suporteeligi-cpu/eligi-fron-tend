'use client'
// src/app/dashboard/components/OnlineChannelCard.tsx
// @eligi:online-channel-card
// Canal de agendamento online — o que antes era uma faixa fina (OnlineBanner)
// espremida entre os cards.
//
// Renomeado de proposito: "Banner" descrevia o formato antigo, nao o conteudo.
// Mesma disciplina que trocou TopBarbers por TopProfessionals.
//
// Sem botao de copiar link: a AppNavbar ja tem "Link de agendamento", e a
// montagem da URL publica hoje so existe em arquivos de backup dentro do src.
// Duplicar isso aqui criaria uma quarta copia da mesma logica.

import { Rocket, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { typography, radius, shadows, glassCard, inkLight } from '@/shared/theme'
import { OnlineBookingsKPI } from '@/features/dashboard/types'

const DISPLAY_FONT = `'Space Grotesk', ${typography.fontFamily}`

const PURPLE      = '#7C3AED'
const PURPLE_DEEP = '#6D28D9'
const PURPLE_BG   = 'rgba(124,58,237,0.10)'

interface Props {
  data: OnlineBookingsKPI
}

export default function OnlineChannelCard({ data }: Props) {
  const growth = data.monthGrowth

  const tone =
    growth == null ? inkLight.neutral :
    growth > 0     ? inkLight.ok      :
    growth < 0     ? inkLight.bad     :
    inkLight.neutral

  const Arrow =
    growth == null ? Minus :
    growth > 0     ? TrendingUp :
    growth < 0     ? TrendingDown :
    Minus

  const growthText =
    growth == null ? 'sem base anterior' :
    growth === 0   ? 'estável' :
    `${Math.abs(growth)}%`

  return (
    <div style={{
      ...glassCard,
      position:      'relative',
      overflow:      'hidden',
      borderRadius:  radius['2xl'],
      boxShadow:     shadows.sm,
      padding:       '16px 18px',
      fontFamily:    typography.fontFamily,
      display:       'flex',
      flexDirection: 'column',
      gap:           12,
    }}>
      {/* brilho roxo discreto, so pra separar este card dos demais */}
      <span
        aria-hidden
        style={{
          position:      'absolute',
          top:           -70,
          right:         -50,
          width:         190,
          height:        190,
          borderRadius:  '50%',
          background:    'radial-gradient(closest-side, rgba(124,58,237,0.12), transparent)',
          pointerEvents: 'none',
        }}
      />

      {/* cabecalho */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
        <span style={{
          display:      'grid',
          placeItems:   'center',
          width:        32,
          height:       32,
          flexShrink:   0,
          borderRadius: radius.sm,
          background:   PURPLE_BG,
        }}>
          <Rocket size={15} color={PURPLE} strokeWidth={2.2} />
        </span>

        <span style={{
          fontSize:      10.5,
          fontWeight:    typography.weight.bold,
          color:         inkLight.label,
          textTransform: 'uppercase',
          letterSpacing: '.12em',
        }}>
          Canal online · este mês
        </span>
      </div>

      {/* numero principal */}
      <div style={{
        display:    'flex',
        alignItems: 'baseline',
        gap:        10,
        flexWrap:   'wrap',
        position:   'relative',
      }}>
        <span style={{
          fontFamily:         DISPLAY_FONT,
          fontSize:           34,
          fontWeight:         typography.weight.bold,
          color:              PURPLE_DEEP,
          letterSpacing:      '-.03em',
          lineHeight:         1,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {data.month}
        </span>

        <span style={{
          fontSize: 13,
          color:    inkLight.label,
        }}>
          {data.month === 1 ? 'agendamento pelo link' : 'agendamentos pelo link'}
        </span>

        <span style={{
          display:      'inline-flex',
          alignItems:   'center',
          gap:          4,
          flexShrink:   0,
          fontSize:     11.5,
          fontWeight:   typography.weight.bold,
          color:        tone.text,
          background:   tone.bg,
          border:       `0.5px solid ${tone.border}`,
          borderRadius: radius.full,
          padding:      '4px 9px',
          lineHeight:   1,
        }}>
          <Arrow size={11} strokeWidth={2.4} />
          {growthText}
        </span>
      </div>

      {/* recorte de hoje */}
      <div style={{
        display:     'flex',
        alignItems:  'center',
        gap:         10,
        padding:     '10px 12px',
        borderRadius: radius.md,
        background:  PURPLE_BG,
        position:    'relative',
      }}>
        <span style={{
          fontFamily:         DISPLAY_FONT,
          fontSize:           18,
          fontWeight:         typography.weight.bold,
          color:              PURPLE_DEEP,
          lineHeight:         1,
          fontVariantNumeric: 'tabular-nums',
          flexShrink:         0,
        }}>
          {data.today}
        </span>
        <span style={{
          fontSize:   12,
          color:      PURPLE_DEEP,
          lineHeight: 1.35,
          minWidth:   0,
        }}>
          {data.today === 1 ? 'agendamento hoje' : 'agendamentos hoje'}
          {data.todayPct > 0 && ` · ${data.todayPct}% do dia`}
        </span>
      </div>

      <span style={{
        fontSize:   11.5,
        color:      inkLight.label,
        lineHeight: 1.4,
        position:   'relative',
      }}>
        {growth == null
          ? 'Primeiro mês com o link no ar — ainda sem comparação.'
          : growth < 0
            ? 'Abaixo do mês anterior. Compartilhe o link para recuperar.'
            : growth > 0
              ? 'Acima do mês anterior. O link está trazendo cliente.'
              : 'No mesmo ritmo do mês anterior.'}
      </span>
    </div>
  )
}
