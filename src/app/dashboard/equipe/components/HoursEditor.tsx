'use client'
// src/app/dashboard/equipe/components/HoursEditor.tsx
// @eligi:hours-editor-v2
// Editor de horario de trabalho — reescrito para o polegar.
//
// Props inalteradas ({ slots, onChange }): HoursPanel e HorariosTab nao mudam,
// e o auto-save com debounce que ja funciona continua igual.
//
// O que muda:
//   - fim do <select> nativo. No iOS ele vira roda de rolagem, no Android vira
//     menu: visual diferente em cada um e alvo pequeno nos dois. Agora cada
//     horario e um botao de 44px que abre uma folha com a grade de horarios.
//   - "copiar para a semana" e jornadas prontas: configurar 7 dias sai de ~14
//     toques de precisao para 3.
//   - nada corta: o dia usa nome curto, a linha nao estoura a largura e o
//     layout responde a @media, nunca a device mode.
//
// Dois bugs corrigidos aqui:
//   1. update() usava slots.map, que so altera o que JA existe no array. Como
//      ProfessionalAvailability nao tem coluna `open`, dia de folga nao tem
//      linha no banco e nao vem no slots — logo, ativar um dia de folga era um
//      clique que morria em silencio. Agora update() faz upsert.
//   2. o <select> de fim filtrava por `t > startTime`. Ao mover o inicio para
//      depois do fim, o value sumia das opcoes e o campo ficava EM BRANCO.
//      Agora mover o inicio empurra o fim junto, sem estado invalido possivel.

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Copy, X, Check, AlertTriangle } from 'lucide-react'

import { colors, typography } from '@/shared/theme'
import { HourSlot } from '@/features/professionals/types'
import { generateTimeOptions } from '@/features/professionals/utils/format'

interface Props {
  slots:    HourSlot[]
  onChange: (slots: HourSlot[]) => void
}

/** Curto na linha (cabe em tela estreita), completo no aria-label. */
const DAYS_SHORT = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const DAYS_FULL  = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

/** Ordem brasileira: segunda primeiro, domingo por ultimo. */
const ORDER = [1, 2, 3, 4, 5, 6, 0]

const TIME_OPTS  = generateTimeOptions()
const DEFAULT_IN = '09:00'
const DEFAULT_OUT = '18:00'

/** Alvo minimo de toque. Abaixo disso o polegar erra. */
const TAP = 44

interface Preset {
  label: string
  apply: (weekday: number) => { open: boolean; startTime: string; endTime: string }
}

const PRESETS: Preset[] = [
  {
    label: 'Comercial 9h–18h',
    apply: wd => ({ open: wd >= 1 && wd <= 5, startTime: '09:00', endTime: '18:00' }),
  },
  {
    label: 'Seg a sáb 9h–19h',
    apply: wd => ({ open: wd !== 0, startTime: '09:00', endTime: '19:00' }),
  },
  {
    label: 'Sábado meio período',
    apply: wd => (wd === 6
      ? { open: true, startTime: '09:00', endTime: '13:00' }
      : { open: false, startTime: DEFAULT_IN, endTime: DEFAULT_OUT }),
  },
]

// ─── helpers ───────────────────────────────────────────────────────────────

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':')
  return Number(h) * 60 + Number(m)
}

/** Proximo horario da grade depois de `from`. Nunca devolve indefinido. */
function nextAfter(from: string): string {
  const found = TIME_OPTS.find(t => toMinutes(t) > toMinutes(from))
  return found ?? TIME_OPTS[TIME_OPTS.length - 1]
}

function fmtTotal(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return `${h}h`
  return `${h}h${String(m).padStart(2, '0')}`
}

// ─── folha de horario ──────────────────────────────────────────────────────

function TimeSheet({
  title,
  subtitle,
  value,
  options,
  onPick,
  onClose,
}: {
  title:    string
  subtitle: string
  value:    string
  options:  string[]
  onPick:   (t: string) => void
  onClose:  () => void
}) {
  if (typeof document === 'undefined') return null

  return createPortal(
    <>
      <div
        onClick={onClose}
        style={{
          position:       'fixed',
          inset:          0,
          background:     'rgba(0,0,0,0.32)',
          backdropFilter: 'blur(6px)',
          zIndex:         900,
          animation:      'eq-fade-up 180ms ease both',
        }}
      />
      <div
        role="dialog"
        aria-label={title}
        style={{
          position:      'fixed',
          left:          0,
          right:         0,
          bottom:        0,
          zIndex:        901,
          maxHeight:     '72vh',
          display:       'flex',
          flexDirection: 'column',
          background:    '#fff',
          borderRadius:  '26px 26px 0 0',
          boxShadow:     '0 -8px 40px rgba(0,0,0,0.18)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          animation:     'eq-sheet-up 260ms cubic-bezier(0.22,1,0.36,1) both',
          fontFamily:    typography.fontFamily,
        }}
      >
        <div style={{
          width:        44,
          height:       5,
          borderRadius: 99,
          background:   'rgba(0,0,0,0.14)',
          margin:       '10px auto 4px',
          flexShrink:   0,
        }} />

        <div style={{
          display:    'flex',
          alignItems: 'center',
          gap:        12,
          padding:    '8px 18px 14px',
          flexShrink: 0,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize:      16,
              fontWeight:    700,
              color:         colors.gray[900],
              letterSpacing: '-.01em',
            }}>
              {title}
            </div>
            <div style={{ fontSize: 12.5, color: colors.gray.dimText, marginTop: 2 }}>
              {subtitle}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            style={{
              width:                   TAP,
              height:                  TAP,
              flexShrink:              0,
              display:                 'grid',
              placeItems:              'center',
              borderRadius:            14,
              border:                  'none',
              background:              'rgba(0,0,0,0.05)',
              color:                   colors.gray.dimText,
              cursor:                  'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <X size={19} strokeWidth={2.4} />
          </button>
        </div>

        <div style={{
          flex:                    1,
          overflowY:               'auto',
          WebkitOverflowScrolling: 'touch',
          padding:                 '0 14px 18px',
          display:                 'grid',
          gridTemplateColumns:     'repeat(auto-fill, minmax(84px, 1fr))',
          gap:                     8,
          alignContent:            'start',
        }}>
          {options.map(t => {
            const active = t === value
            return (
              <button
                key={t}
                type="button"
                onClick={() => onPick(t)}
                style={{
                  minHeight:               TAP,
                  borderRadius:            14,
                  border:                  active
                    ? `1.5px solid ${colors.red.DEFAULT}`
                    : '1px solid rgba(0,0,0,0.08)',
                  background:              active ? 'rgba(220,38,38,0.08)' : '#fff',
                  color:                   active ? colors.red.DEFAULT : colors.gray[900],
                  fontFamily:              "'Space Grotesk', " + typography.fontFamily,
                  fontSize:                15,
                  fontWeight:              700,
                  fontVariantNumeric:      'tabular-nums',
                  cursor:                  'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {t}
              </button>
            )
          })}
        </div>
      </div>
    </>,
    document.body,
  )
}

// ─── editor ────────────────────────────────────────────────────────────────

type Editing = { weekday: number; field: 'start' | 'end' }

export default function HoursEditor({ slots, onChange }: Props) {
  const [editing, setEditing] = useState<Editing | null>(null)
  const [copied, setCopied]   = useState(false)

  function slotOf(weekday: number): HourSlot {
    return slots.find(s => s.weekday === weekday)
        ?? { weekday, open: false, startTime: DEFAULT_IN, endTime: DEFAULT_OUT }
  }

  /**
   * Upsert, nao map. O map antigo ignorava dia que ainda nao existe no array —
   * e dia de folga nao existe no banco, entao ativar folga nao fazia nada.
   */
  function update(weekday: number, patch: Partial<HourSlot>) {
    const exists = slots.some(s => s.weekday === weekday)
    if (exists) {
      onChange(slots.map(s => (s.weekday === weekday ? { ...s, ...patch } : s)))
      return
    }
    onChange([...slots, { ...slotOf(weekday), ...patch }])
  }

  function setStart(weekday: number, value: string) {
    const slot = slotOf(weekday)
    // Invariante: fim sempre depois do inicio. Sem isso o campo de fim ficava
    // com um valor fora da lista de opcoes e aparecia em branco.
    const end = toMinutes(slot.endTime) > toMinutes(value) ? slot.endTime : nextAfter(value)
    update(weekday, { startTime: value, endTime: end })
  }

  function applyToWholeWeek() {
    const monday = slotOf(1)
    onChange(ORDER.map(wd => ({
      weekday:   wd,
      open:      monday.open,
      startTime: monday.startTime,
      endTime:   monday.endTime,
    })))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  function applyPreset(preset: Preset) {
    onChange(ORDER.map(wd => ({ weekday: wd, ...preset.apply(wd) })))
  }

  const openDays = ORDER.filter(wd => slotOf(wd).open)
  const weekMinutes = openDays.reduce((sum, wd) => {
    const s = slotOf(wd)
    return sum + Math.max(0, toMinutes(s.endTime) - toMinutes(s.startTime))
  }, 0)

  const editingSlot = editing ? slotOf(editing.weekday) : null

  return (
    <div style={{ fontFamily: typography.fontFamily }}>
      <style>{`
        @keyframes eq-sheet-up{ from{transform:translateY(100%)} to{transform:translateY(0)} }
        .eq-day{ display:flex; align-items:center; gap:12px; padding:10px 0; }
        .eq-day + .eq-day{ border-top:1px solid rgba(0,0,0,0.06); }
        .eq-quick{ display:flex; gap:8px; overflow-x:auto; padding-bottom:4px;
                   scrollbar-width:none; -ms-overflow-style:none; }
        .eq-quick::-webkit-scrollbar{ display:none; }
        @media (hover:hover){ .eq-tap:hover{ filter:brightness(0.96); } }
        @media (prefers-reduced-motion: reduce){
          .eq-sheet, .eq-tap{ animation:none !important; transition:none !important; }
        }
      `}</style>

      {/* atalhos: o caso comum resolvido em um toque */}
      <div className="eq-quick" style={{ marginBottom: 12 }}>
        <button
          type="button"
          onClick={applyToWholeWeek}
          className="eq-tap"
          style={{
            flexShrink:              0,
            minHeight:               TAP,
            display:                 'inline-flex',
            alignItems:              'center',
            gap:                     7,
            padding:                 '0 15px',
            borderRadius:            999,
            border:                  'none',
            background:              copied ? 'rgba(22,163,74,0.10)' : 'rgba(220,38,38,0.08)',
            color:                   copied ? '#15803d' : colors.red.DEFAULT,
            fontSize:                13,
            fontWeight:              700,
            fontFamily:              'inherit',
            cursor:                  'pointer',
            whiteSpace:              'nowrap',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {copied
            ? <><Check size={15} strokeWidth={2.6} /> Copiado para a semana</>
            : <><Copy size={15} strokeWidth={2.3} /> Copiar segunda para a semana</>}
        </button>

        {PRESETS.map(p => (
          <button
            key={p.label}
            type="button"
            onClick={() => applyPreset(p)}
            className="eq-tap"
            style={{
              flexShrink:              0,
              minHeight:               TAP,
              padding:                 '0 15px',
              borderRadius:            999,
              border:                  '1px solid rgba(0,0,0,0.08)',
              background:              '#fff',
              color:                   colors.gray[900],
              fontSize:                13,
              fontWeight:              600,
              fontFamily:              'inherit',
              cursor:                  'pointer',
              whiteSpace:              'nowrap',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* dias */}
      <div>
        {ORDER.map(wd => {
          const slot = slotOf(wd)
          return (
            <div key={wd} className="eq-day">
              <button
                type="button"
                onClick={() => update(wd, { open: !slot.open })}
                aria-pressed={slot.open}
                aria-label={`${slot.open ? 'Desativar' : 'Ativar'} ${DAYS_FULL[wd]}`}
                className="eq-tap"
                style={{
                  width:                   TAP,
                  height:                  TAP,
                  flexShrink:              0,
                  display:                 'grid',
                  placeItems:              'center',
                  border:                  'none',
                  background:              'transparent',
                  padding:                 0,
                  cursor:                  'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <span style={{
                  position:     'relative',
                  display:      'block',
                  width:        46,
                  height:       28,
                  borderRadius: 999,
                  background:   slot.open ? colors.red.DEFAULT : 'rgba(0,0,0,0.16)',
                  transition:   'background 160ms ease',
                }}>
                  <span style={{
                    position:     'absolute',
                    top:          3,
                    left:         slot.open ? 21 : 3,
                    width:        22,
                    height:       22,
                    borderRadius: '50%',
                    background:   '#fff',
                    boxShadow:    '0 1px 4px rgba(0,0,0,0.25)',
                    transition:   'left 160ms cubic-bezier(0.22,1,0.36,1)',
                  }} />
                </span>
              </button>

              <span style={{
                flex:         1,
                minWidth:     0,
                fontSize:     14.5,
                fontWeight:   slot.open ? 600 : 400,
                color:        slot.open ? colors.gray[900] : colors.gray.dimText,
                overflow:     'hidden',
                textOverflow: 'ellipsis',
                whiteSpace:   'nowrap',
              }}>
                {DAYS_SHORT[wd]}
              </span>

              {slot.open ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <TimeButton
                    value={slot.startTime}
                    label={`Início de ${DAYS_FULL[wd]}`}
                    onClick={() => setEditing({ weekday: wd, field: 'start' })}
                  />
                  <span style={{ fontSize: 13, color: colors.gray.dimText }}>–</span>
                  <TimeButton
                    value={slot.endTime}
                    label={`Fim de ${DAYS_FULL[wd]}`}
                    onClick={() => setEditing({ weekday: wd, field: 'end' })}
                  />
                </span>
              ) : (
                <span style={{
                  flexShrink: 0,
                  fontSize:   13.5,
                  color:      colors.gray.dimText,
                  fontStyle:  'italic',
                  paddingRight: 6,
                }}>
                  Folga
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* resumo / alerta */}
      {openDays.length === 0 ? (
        <div style={{
          display:      'flex',
          alignItems:   'flex-start',
          gap:          9,
          marginTop:    14,
          padding:      '11px 13px',
          borderRadius: 14,
          background:   'rgba(234,179,8,0.12)',
          color:        '#a16207',
          fontSize:     12.5,
          lineHeight:   1.45,
        }}>
          <AlertTriangle size={16} strokeWidth={2.2} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>Nenhum dia ativo — sem horário definido, este profissional não recebe agendamento.</span>
        </div>
      ) : (
        <div style={{
          marginTop:  14,
          fontSize:   12.5,
          color:      colors.gray.dimText,
        }}>
          {openDays.length} {openDays.length === 1 ? 'dia' : 'dias'} por semana
          {weekMinutes > 0 && (
            <> · <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtTotal(weekMinutes)}</span> de jornada</>
          )}
        </div>
      )}

      {editing && editingSlot && (
        <TimeSheet
          title={editing.field === 'start' ? 'Começa às' : 'Termina às'}
          subtitle={DAYS_FULL[editing.weekday]}
          value={editing.field === 'start' ? editingSlot.startTime : editingSlot.endTime}
          options={
            editing.field === 'start'
              ? TIME_OPTS
              : TIME_OPTS.filter(t => toMinutes(t) > toMinutes(editingSlot.startTime))
          }
          onPick={t => {
            if (editing.field === 'start') setStart(editing.weekday, t)
            else update(editing.weekday, { endTime: t })
            setEditing(null)
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function TimeButton({
  value, label, onClick,
}: {
  value:   string
  label:   string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${label}: ${value}`}
      className="eq-tap"
      style={{
        minHeight:               TAP,
        minWidth:                74,
        padding:                 '0 12px',
        borderRadius:            14,
        border:                  '1px solid rgba(0,0,0,0.09)',
        background:              '#fff',
        boxShadow:               '0 1px 4px rgba(0,0,0,0.05)',
        color:                   colors.gray[900],
        fontFamily:              "'Space Grotesk', " + typography.fontFamily,
        fontSize:                15,
        fontWeight:              700,
        fontVariantNumeric:      'tabular-nums',
        letterSpacing:           '-.01em',
        cursor:                  'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {value}
    </button>
  )
}
