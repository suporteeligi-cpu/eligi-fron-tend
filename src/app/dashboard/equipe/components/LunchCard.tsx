'use client'
// src/app/dashboard/equipe/components/LunchCard.tsx
// @eligi:lunch-card
// Pausa fixa do profissional, na aba Horarios.
//
// CONTROLADO PURO, como o HoursEditor: sem fetch, sem save, sem estado de
// servidor. Quem busca e grava e o HoursPanel — assim existe um unico
// indicador de "Salvando" na tela, em vez de dois piscando fora de sincronia.
//
// `workingWeekdays` vem do painel, que ja tem os horarios de trabalho em
// estado. Dia sem expediente aparece apagado: nao existe almoco em dia de
// folga, e mostrar o botao ativo seria mentira.

import { useMemo } from 'react'
import { colors, typography } from '@/shared/theme'

export type LunchRule = {
  startTime: string
  endTime: string
  weekdays: number[]
  active: boolean
}

interface Props {
  value:           LunchRule | null
  onChange:        (next: LunchRule | null) => void
  workingWeekdays: number[]
  profName:        string
}

const DIAS = [
  { n: 0, curto: 'D', longo: 'domingo' },
  { n: 1, curto: 'S', longo: 'segunda' },
  { n: 2, curto: 'T', longo: 'terca' },
  { n: 3, curto: 'Q', longo: 'quarta' },
  { n: 4, curto: 'Q', longo: 'quinta' },
  { n: 5, curto: 'S', longo: 'sexta' },
  { n: 6, curto: 'S', longo: 'sabado' },
]

const PADRAO: LunchRule = {
  startTime: '12:00',
  endTime:   '13:00',
  weekdays:  [],
  active:    true,
}

const TAP = 44

function paraMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

function duracaoLegivel(inicio: string, fim: string): string {
  const min = paraMinutos(fim) - paraMinutos(inicio)
  if (min <= 0) return ''
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h && m) return `${h}h${String(m).padStart(2, '0')}`
  if (h) return `${h}h`
  return `${m}min`
}

export default function LunchCard({ value, onChange, workingWeekdays, profName }: Props) {
  const ligado = value !== null && value.active

  const diasUteis = useMemo(() => new Set(workingWeekdays), [workingWeekdays])

  // Ligar pela primeira vez ja marca os dias em que a pessoa trabalha: quase
  // sempre e o que se quer, e evita salvar uma regra sem nenhum dia (que o
  // back recusa com 400).
  function alternar() {
    if (ligado) {
      onChange(value ? { ...value, active: false } : null)
      return
    }
    const base = value ?? PADRAO
    const dias = base.weekdays.length ? base.weekdays : [...workingWeekdays].sort((a, b) => a - b)
    onChange({ ...base, weekdays: dias, active: true })
  }

  function alterar(campo: 'startTime' | 'endTime', hhmm: string) {
    if (!value) return
    onChange({ ...value, [campo]: hhmm })
  }

  function alternarDia(n: number) {
    if (!value) return
    const tem = value.weekdays.includes(n)
    const dias = tem ? value.weekdays.filter((d) => d !== n) : [...value.weekdays, n]
    onChange({ ...value, weekdays: dias.sort((a, b) => a - b) })
  }

  const inicio = value?.startTime ?? PADRAO.startTime
  const fim    = value?.endTime   ?? PADRAO.endTime
  const dur    = duracaoLegivel(inicio, fim)
  const invalido = ligado && paraMinutos(inicio) >= paraMinutos(fim)
  const semDia   = ligado && (value?.weekdays.length ?? 0) === 0
  const primeiroNome = profName.split(' ')[0]

  return (
    <div style={{ marginTop: 18, fontFamily: typography.fontFamily }}>
      <style>{`
        .lc-time{
          font-size:16px;               /* 16px evita o zoom automatico do Safari iOS */
          font-variant-numeric:tabular-nums;
          font-weight:700;
          padding:0 12px; height:${TAP}px; width:112px;
          border-radius:10px; border:1.5px solid ${colors.gray.borderMd};
          background:${colors.background.surface}; color:${colors.gray[900]};
          font-family:inherit;
        }
        .lc-time:focus{ outline:none; border-color:${colors.red.DEFAULT}; box-shadow:0 0 0 3px rgba(220,38,38,.12) }
        .lc-time:disabled{ opacity:.45 }
        .lc-dia{
          width:${TAP}px; height:${TAP}px; border-radius:50%;
          border:1.5px solid ${colors.gray.borderMd}; background:${colors.background.surface};
          font-family:inherit; font-size:13px; font-weight:600; color:${colors.gray.dimText};
          cursor:pointer; transition:background .15s,border-color .15s,color .15s;
          -webkit-tap-highlight-color:transparent;
        }
        .lc-dia[data-on="1"]{ background:${colors.gray[900]}; border-color:${colors.gray[900]}; color:#fff }
        .lc-dia:disabled{ opacity:.3; cursor:not-allowed }
        .lc-sw{
          display:flex; align-items:center; gap:12px; width:100%; text-align:left;
          padding:12px 14px; min-height:${TAP}px; border-radius:12px;
          border:1.5px solid ${colors.gray.borderMd}; background:${colors.background.surface};
          cursor:pointer; font-family:inherit; transition:border-color .15s,background .15s;
          -webkit-tap-highlight-color:transparent;
        }
        .lc-sw[data-on="1"]{ border-color:${colors.red.DEFAULT}; background:rgba(220,38,38,.05) }
        .lc-track{ width:40px; height:22px; border-radius:11px; flex:0 0 40px; position:relative;
          background:${colors.gray.borderMd}; transition:background .15s }
        .lc-sw[data-on="1"] .lc-track{ background:${colors.red.DEFAULT} }
        .lc-knob{ position:absolute; top:2px; left:2px; width:18px; height:18px; border-radius:50%;
          background:#fff; box-shadow:0 1px 4px rgba(0,0,0,.2); transition:left .15s }
        .lc-sw[data-on="1"] .lc-knob{ left:20px }
        @media (prefers-reduced-motion:reduce){ .lc-track,.lc-knob,.lc-dia,.lc-sw{ transition:none } }
      `}</style>

      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        marginBottom: 12, gap: 12,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            margin: 0, fontSize: 15, fontWeight: 700,
            color: colors.gray[900], letterSpacing: '-0.01em',
          }}>
            Horário de almoço
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: colors.gray.dimText, lineHeight: 1.4 }}>
            Some do link de agendamento. Continua na agenda e no caixa.
          </p>
        </div>
        {ligado && dur && (
          <span style={{
            fontSize: 13, fontWeight: 700, color: colors.gray[900],
            fontVariantNumeric: 'tabular-nums', flexShrink: 0, paddingTop: 2,
          }}>
            {inicio}–{fim}
          </span>
        )}
      </div>

      <button type="button" className="lc-sw" data-on={ligado ? '1' : '0'}
        aria-pressed={ligado} onClick={alternar}>
        <span className="lc-track" aria-hidden><span className="lc-knob" /></span>
        <span style={{
          fontSize: 13.5, fontWeight: 600,
          color: ligado ? colors.red.DEFAULT : colors.gray[900],
        }}>
          {ligado
            ? `${primeiroNome} tem pausa para almoço`
            : `${primeiroNome} não tem pausa definida`}
        </span>
      </button>

      {ligado && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
            <input className="lc-time" type="time" value={inicio} aria-label="Início do almoço"
              onChange={(e) => alterar('startTime', e.target.value)} />
            <span style={{ fontSize: 13, color: colors.gray.dimText }}>até</span>
            <input className="lc-time" type="time" value={fim} aria-label="Fim do almoço"
              onChange={(e) => alterar('endTime', e.target.value)} />
            {dur && (
              <span style={{
                fontSize: 12.5, color: colors.gray.dimText, marginLeft: 'auto',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {dur}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            {DIAS.map((d) => {
              const trabalha = diasUteis.has(d.n)
              const marcado = value?.weekdays.includes(d.n) ?? false
              return (
                <button key={d.n} type="button" className="lc-dia"
                  data-on={marcado && trabalha ? '1' : '0'}
                  disabled={!trabalha}
                  aria-pressed={marcado && trabalha}
                  aria-label={`${d.longo}${trabalha ? '' : ' (sem expediente)'}`}
                  title={trabalha ? d.longo : `${primeiroNome} não trabalha ${d.longo}`}
                  onClick={() => alternarDia(d.n)}>
                  {d.curto}
                </button>
              )
            })}
          </div>

          {invalido && (
            <p style={{ margin: '12px 0 0', fontSize: 12.5, color: colors.red.DEFAULT, lineHeight: 1.45 }}>
              O almoço precisa terminar depois de começar.
            </p>
          )}
          {!invalido && semDia && (
            <p style={{ margin: '12px 0 0', fontSize: 12.5, color: colors.red.DEFAULT, lineHeight: 1.45 }}>
              Escolha ao menos um dia para a pausa valer.
            </p>
          )}
          {!invalido && !semDia && (
            <p style={{ margin: '12px 0 0', fontSize: 12, color: colors.gray.dimText, lineHeight: 1.45 }}>
              Dias apagados são folga de {primeiroNome} — não existe almoço em dia sem expediente.
            </p>
          )}
        </>
      )}
    </div>
  )
}
