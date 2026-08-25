'use client'
// src/app/dashboard/equipe/components/TeamList.tsx
// @eligi:team-list
// Lista de profissionais da aba "Profissionais".
//
// Substitui o ProfSidebar, que mostrava so nome e cargo. Todo o resto ja vinha
// do back (PROF_SELECT traz services, comissao, showInCalendar, availableOnline,
// active, user) e era jogado fora. Agora cada linha diz o estado da pessoa sem
// precisar entrar nela.
//
// Layout responde a LARGURA (@media), nunca a device mode: useDeviceMode
// classifica tipo de ponteiro, e foi o que cortava a tela de horarios em
// janela estreita de desktop.

import { Search, X, UserCog, Scissors, Percent, Globe, CalendarOff } from 'lucide-react'
import { colors, typography } from '@/shared/theme'
import { Professional } from '@/features/professionals/types'
import { fmtCommission } from '@/features/professionals/utils/format'
import Avatar from './Avatar'

interface Props {
  professionals: Professional[]
  selected:      Professional | null
  query:         string
  loading:       boolean
  onQueryChange: (q: string) => void
  onSelect:      (p: Professional) => void
}

/** Alvo minimo de toque. */
const TAP = 44

interface Chip {
  key:   string
  label: string
  tone:  'neutral' | 'ok' | 'warn' | 'purple'
  Icon?: React.ComponentType<{ size?: number; strokeWidth?: number }>
}

const TONES = {
  neutral: { bg: 'rgba(17,17,20,0.05)',  fg: '#4b4b52' },
  ok:      { bg: 'rgba(16,185,129,0.10)', fg: '#0f6e56' },
  warn:    { bg: 'rgba(220,38,38,0.08)',  fg: colors.red.DEFAULT },
  purple:  { bg: 'rgba(124,58,237,0.10)', fg: '#6D28D9' },
} as const

function chipsFor(p: Professional): Chip[] {
  const chips: Chip[] = []

  if (!p.active) {
    chips.push({ key: 'off', label: 'Inativo', tone: 'warn' })
  }

  if (p.showInCalendar === false) {
    chips.push({ key: 'cal', label: 'fora da agenda', tone: 'warn', Icon: CalendarOff })
  }

  const svc = p.services?.length ?? 0
  if (svc > 0) {
    chips.push({
      key:   'svc',
      label: `${svc} ${svc === 1 ? 'serviço' : 'serviços'}`,
      tone:  'neutral',
      Icon:  Scissors,
    })
  } else {
    chips.push({ key: 'nosvc', label: 'sem serviço', tone: 'warn', Icon: Scissors })
  }

  const com = fmtCommission(p.commissionType, p.commissionValue)
  if (com) {
    chips.push({ key: 'com', label: com, tone: 'neutral', Icon: Percent })
  }

  if (p.availableOnline) {
    chips.push({ key: 'on', label: 'online', tone: 'purple', Icon: Globe })
  }

  return chips
}

export default function TeamList({
  professionals, selected, query, loading, onQueryChange, onSelect,
}: Props) {
  return (
    <div style={{ fontFamily: typography.fontFamily, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <style>{`
        .eq-row{ transition: background 140ms ease; }
        @media (hover:hover){ .eq-row:hover{ background: rgba(255,255,255,0.75) !important; } }
        @media (prefers-reduced-motion: reduce){ .eq-row{ transition:none } }
      `}</style>

      {/* busca */}
      <div style={{
        display:      'flex',
        alignItems:   'center',
        gap:          9,
        minHeight:    TAP,
        padding:      '0 14px',
        borderRadius: 999,
        background:   'rgba(255,255,255,0.75)',
        border:       '1px solid rgba(17,17,20,0.07)',
        marginBottom: 10,
        flexShrink:   0,
      }}>
        <Search size={16} color={colors.gray.dimText} strokeWidth={2} />
        <input
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          placeholder="Buscar profissional…"
          style={{
            flex:       1,
            minWidth:   0,
            border:     'none',
            outline:    'none',
            background: 'transparent',
            fontSize:   15, // 16px-ish evita o zoom automatico do iOS ao focar
            color:      colors.gray[900],
            fontFamily: 'inherit',
          }}
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange('')}
            aria-label="Limpar busca"
            style={{
              width:                   32,
              height:                  32,
              flexShrink:              0,
              display:                 'grid',
              placeItems:              'center',
              border:                  'none',
              borderRadius:            10,
              background:              'rgba(17,17,20,0.05)',
              color:                   colors.gray.dimText,
              cursor:                  'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <X size={15} strokeWidth={2.4} />
          </button>
        )}
      </div>

      {/* lista */}
      <div style={{
        background:     'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(16px)',
        border:         '1px solid rgba(17,17,20,0.07)',
        borderRadius:   22,
        boxShadow:      '0 4px 20px rgba(17,17,20,0.05)',
        overflow:       'hidden',
        flex:           1,
        minHeight:      0,
      }}>
        {loading ? (
          <div style={{ padding: '44px 16px', textAlign: 'center', color: colors.gray.dimText, fontSize: 13 }}>
            Carregando…
          </div>
        ) : professionals.length === 0 ? (
          <div style={{ padding: '44px 16px', textAlign: 'center' }}>
            <UserCog size={26} color={colors.gray.dimText} style={{ opacity: 0.25, marginBottom: 10 }} />
            <div style={{ fontSize: 13, color: colors.gray.dimText }}>
              {query ? `Nada para "${query}"` : 'Nenhum profissional cadastrado'}
            </div>
          </div>
        ) : (
          <div style={{ overflowY: 'auto', maxHeight: '100%' }}>
            {professionals.map((p, idx) => {
              const isSelected = selected?.id === p.id
              const chips = chipsFor(p)

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelect(p)}
                  className="eq-row"
                  style={{
                    width:                   '100%',
                    display:                 'flex',
                    alignItems:              'center',
                    gap:                     12,
                    padding:                 '12px 14px',
                    minHeight:               72,
                    border:                  'none',
                    borderTop:               idx === 0 ? 'none' : '1px solid rgba(17,17,20,0.06)',
                    background:              isSelected ? 'rgba(255,255,255,0.95)' : 'transparent',
                    textAlign:               'left',
                    cursor:                  'pointer',
                    fontFamily:              'inherit',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <Avatar name={p.name} size={44} url={p.avatarUrl} />

                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{
                      display:      'block',
                      fontSize:     15,
                      fontWeight:   700,
                      color:        isSelected ? colors.red.DEFAULT : colors.gray[900],
                      letterSpacing: '-0.01em',
                      overflow:     'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace:   'nowrap',
                    }}>
                      {p.name}
                    </span>

                    <span style={{
                      display:      'block',
                      fontSize:     12,
                      color:        colors.gray.dimText,
                      marginTop:    1,
                      overflow:     'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace:   'nowrap',
                    }}>
                      {p.role ?? 'Profissional'}
                    </span>

                    <span style={{
                      display:   'flex',
                      flexWrap:  'wrap',
                      gap:       5,
                      marginTop: 6,
                    }}>
                      {chips.map(c => {
                        const tone = TONES[c.tone]
                        const Icon = c.Icon
                        return (
                          <span
                            key={c.key}
                            style={{
                              display:      'inline-flex',
                              alignItems:   'center',
                              gap:          4,
                              fontSize:     11,
                              fontWeight:   700,
                              borderRadius: 999,
                              padding:      '3px 8px',
                              background:   tone.bg,
                              color:        tone.fg,
                              whiteSpace:   'nowrap',
                            }}
                          >
                            {Icon ? <Icon size={11} strokeWidth={2.2} /> : null}
                            {c.label}
                          </span>
                        )
                      })}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
