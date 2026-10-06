'use client'
// src/features/booking/components/SeriesAdjustMenu.tsx
// @eligi:series-adjust-menu
//
// Menu "ajustar a recorrencia", no mesmo formato do menu do almoco
// (LunchExceptionMenu): bottom sheet no celular, cartao no desktop.
//
//   variant 'edit' — abre ao tocar em ADICIONAR / EDITAR SERVICO de uma
//                    ocorrencia: pergunta SEMPRE "so neste dia ou os proximos".
//   variant 'full' — abre pelo botao Ajustar da faixa da serie: tudo.
//
// "Mudar este e os proximos" troca dia, horario e profissional desta data e
// das seguintes (mesma diferenca de dias). Antes de gravar, a mesma previa
// data a data da criacao (SeriesPreviewSheet, modo 'move'). Servico, cliente
// e frequencia nao mudam por aqui: trocar servico de todas as datas e outra
// decisao (comissao/preco), fica para uma fatia propria.

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays, Repeat, SkipForward, StopCircle, Ban, X } from 'lucide-react'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { colors, typography, radius, shadows, transitions, glass } from '@/shared/theme'
import SeriesPreviewSheet from './SeriesPreviewSheet'

dayjs.extend(utc)
dayjs.extend(timezone)

const TZ = 'America/Sao_Paulo'
const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/
const YMD = /^\d{4}-\d{2}-\d{2}$/

interface Prof { id: string; name: string }

interface Props {
  variant:        'edit' | 'full'
  seriesId:       string
  bookingId:      string
  /** Inicio/fim atuais desta ocorrencia (ISO). */
  startAt:        string
  endAt:          string
  professionalId: string
  professionals:  Prof[]
  isMobile:       boolean
  onClose:        () => void
  /** Editor normal do agendamento (grupo): so esta data. */
  onEditOnlyThis: () => void
  onSkipThis:     () => void
  onStopRepeat:   () => void
  onCancelFromHere: () => void
  /** Remarcacao em lote gravada. */
  onMoved:        () => void
}

type Modo = 'menu' | 'proximos'

function rotuloData(ymd: string): string {
  return dayjs.tz(`${ymd} 12:00`, TZ).locale('pt-br').format('ddd, DD [de] MMM')
}

export default function SeriesAdjustMenu(props: Props) {
  const {
    variant, seriesId, bookingId, startAt, endAt, professionalId, professionals, isMobile,
    onClose, onEditOnlyThis, onSkipThis, onStopRepeat, onCancelFromHere, onMoved,
  } = props

  const ini = dayjs(startAt).tz(TZ)
  const fimAtual = dayjs(endAt).tz(TZ)
  const [modo, setModo] = useState<Modo>('menu')
  const [data, setData] = useState(() => ini.format('YYYY-MM-DD'))
  const [inicio, setInicio] = useState(() => ini.format('HH:mm'))
  const [fim, setFim] = useState(() => fimAtual.format('HH:mm'))
  const [prof, setProf] = useState(professionalId)
  const [revisar, setRevisar] = useState<string | null>(null)

  const profs: Prof[] = professionals.some(p => p.id === professionalId)
    ? professionals
    : [{ id: professionalId, name: 'Profissional atual' }, ...professionals]

  const invalido = !YMD.test(data) || !HHMM.test(inicio) || !HHMM.test(fim) || inicio >= fim || !prof
  const novoInicio = invalido ? null : dayjs.tz(`${data} ${inicio}`, TZ)
  const noPassado = !!novoInicio && novoInicio.isBefore(dayjs())
  const igual = !!novoInicio
    && novoInicio.isSame(ini)
    && fim === fimAtual.format('HH:mm')
    && prof === professionalId

  function abrirPrevia() {
    if (invalido || noPassado || igual || !novoInicio) return
    setRevisar(JSON.stringify({
      fromBookingId:  bookingId,
      startAt:        novoInicio.toISOString(),
      endAt:          dayjs.tz(`${data} ${fim}`, TZ).toISOString(),
      professionalId: prof,
    }))
  }

  const sz = isMobile ? 22 : 15
  type Acao = { id: string; icon: React.ReactNode; label: string; sub: string; onClick: () => void; tone: 'accent' | 'neutral' | 'danger' }
  const acoes: Acao[] = [
    {
      id: 'dia', tone: 'accent',
      icon: <CalendarDays size={sz} color={colors.red.DEFAULT} strokeWidth={2} />,
      label: 'Mudar só neste dia',
      sub: `serviço, horário ou profissional de ${rotuloData(ini.format('YYYY-MM-DD'))}`,
      onClick: () => { onClose(); onEditOnlyThis() },
    },
    {
      id: 'proximos', tone: 'neutral',
      icon: <Repeat size={sz} color={colors.slate.DEFAULT} strokeWidth={2} />,
      label: 'Mudar este e os próximos',
      sub: 'dia, horário ou profissional da série',
      onClick: () => setModo('proximos'),
    },
  ]
  if (variant === 'full') {
    acoes.push(
      {
        id: 'pular', tone: 'neutral',
        icon: <SkipForward size={sz} color={colors.slate.DEFAULT} strokeWidth={2} />,
        label: 'Pular este dia',
        sub: 'só esta data sai; a série continua',
        onClick: () => { onClose(); onSkipThis() },
      },
      {
        id: 'parar', tone: 'neutral',
        icon: <StopCircle size={sz} color={colors.slate.DEFAULT} strokeWidth={2} />,
        label: 'Parar de repetir',
        sub: 'mantém este, cancela os próximos',
        onClick: () => { onClose(); onStopRepeat() },
      },
      {
        id: 'cancelar', tone: 'danger',
        icon: <Ban size={sz} color={colors.red.DEFAULT} strokeWidth={2} />,
        label: 'Cancelar este e os próximos',
        sub: 'este horário também sai',
        onClick: () => { onClose(); onCancelFromHere() },
      },
    )
  }

  const listaAcoes = (
    <div role="menu" style={{ padding: isMobile ? '0 16px 8px' : 0, display: 'flex', flexDirection: 'column', gap: isMobile ? 8 : 0 }}>
      {acoes.map((a, i) => {
        const accent = a.tone === 'accent'
        const cor = a.tone === 'neutral' ? colors.slate.dark : colors.red.dark
        return (
          <button
            key={a.id}
            type="button"
            role="menuitem"
            className="sam-item"
            onClick={a.onClick}
            style={isMobile ? {
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px', borderRadius: radius.lg,
              border: `1px solid ${accent ? colors.red.border : colors.slate.border}`,
              background: accent ? colors.red.subtle : colors.slate.subtle,
              cursor: 'pointer', textAlign: 'left', width: '100%',
              transition: `all ${transitions.fast}`, fontFamily: 'inherit',
            } : {
              width: '100%', display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px', border: 'none',
              borderBottom: i < acoes.length - 1 ? `1px solid ${colors.gray.border}` : 'none',
              background: 'transparent', cursor: 'pointer', textAlign: 'left',
              transition: `background ${transitions.fast}`, fontFamily: 'inherit',
            }}
          >
            <div style={{
              width: isMobile ? 44 : 30, height: isMobile ? 44 : 30, borderRadius: radius.md, flexShrink: 0,
              background: a.tone === 'neutral' ? 'rgba(71,85,105,0.1)' : 'rgba(220,38,38,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {a.icon}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: isMobile ? 15 : 14, fontWeight: typography.weight.bold, color: cor }}>{a.label}</div>
              <div style={{ fontSize: typography.scale.sm, color: colors.gray[700], marginTop: 2 }}>{a.sub}</div>
            </div>
          </button>
        )
      })}
    </div>
  )

  const aviso = invalido
    ? 'Confira a data e o horário: o fim precisa ser depois do início.'
    : noPassado
      ? 'O novo horário já passou.'
      : igual
        ? 'Mude o dia, o horário ou o profissional para revisar as datas.'
        : null

  const editor = (
    <div style={{ padding: isMobile ? '4px 20px 8px' : '14px 16px' }}>
      <p style={{ margin: '0 0 14px', fontSize: typography.scale.sm, color: colors.gray[700], lineHeight: 1.45 }}>
        Vale para {rotuloData(ini.format('YYYY-MM-DD'))} e as próximas datas da série. Se mudar o dia,
        todas andam junto. Datas já atendidas ou pagas não mudam.
      </p>

      <label className="sam-lbl" htmlFor="sam-data">Dia desta data</label>
      <input id="sam-data" type="date" value={data} onChange={e => setData(e.target.value)} style={campo} />

      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <div style={{ flex: 1 }}>
          <label className="sam-lbl" htmlFor="sam-ini">Início</label>
          <input id="sam-ini" type="time" value={inicio} onChange={e => setInicio(e.target.value)} style={campo} />
        </div>
        <div style={{ flex: 1 }}>
          <label className="sam-lbl" htmlFor="sam-fim">Fim</label>
          <input id="sam-fim" type="time" value={fim} onChange={e => setFim(e.target.value)} style={campo} />
        </div>
      </div>

      <label className="sam-lbl" htmlFor="sam-prof" style={{ marginTop: 12 }}>Profissional</label>
      <select id="sam-prof" value={prof} onChange={e => setProf(e.target.value)} style={campo}>
        {profs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>

      {aviso && (
        <p role="status" style={{ margin: '12px 0 0', fontSize: 13, color: invalido || noPassado ? colors.red.DEFAULT : colors.gray[700] }}>
          {aviso}
        </p>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button type="button" className="sam-btn" onClick={() => setModo('menu')} style={{ ...botao, flex: 1 }}>
          Voltar
        </button>
        <button
          type="button"
          className="sam-btn"
          onClick={abrirPrevia}
          disabled={!!aviso}
          style={{
            ...botao, flex: 2,
            background: aviso ? 'rgba(0,0,0,0.06)' : colors.red.DEFAULT,
            borderColor: aviso ? 'transparent' : colors.red.DEFAULT,
            color: aviso ? 'rgba(0,0,0,0.35)' : '#fff',
            fontWeight: typography.weight.bold,
            cursor: aviso ? 'not-allowed' : 'pointer',
          }}
        >
          Revisar datas
        </button>
      </div>
    </div>
  )

  const titulo = modo === 'menu'
    ? (variant === 'edit' ? 'Este agendamento se repete' : 'Ajustar recorrência')
    : 'Mudar este e os próximos'
  const subtitulo = `${ini.format('HH:mm')}–${fimAtual.format('HH:mm')} · ${rotuloData(ini.format('YYYY-MM-DD'))}`

  const estilos = (
    <style>{`
      @keyframes samUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
      @keyframes samIn{from{opacity:0;transform:translate(-50%,-50%) scale(0.96)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
      @media (prefers-reduced-motion:reduce){.sam-sheet{animation:none !important}}
      .sam-item:hover{background:${colors.slate.subtle} !important}
      .sam-item:focus-visible,.sam-btn:focus-visible,.sam-x:focus-visible{outline:2px solid ${colors.red.DEFAULT};outline-offset:2px}
      .sam-lbl{display:block;font-size:12.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:${colors.gray[700]};margin-bottom:6px}
    `}</style>
  )

  const cabecalho = (
    <div style={{ padding: isMobile ? '8px 20px 14px' : '14px 16px 12px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, borderBottom: isMobile ? 'none' : `1px solid ${colors.gray.border}` }}>
      <div style={{ minWidth: 0 }}>
        <div id="sam-title" style={{ fontSize: 16, fontWeight: typography.weight.bold, color: typography.color.primary, fontFamily: typography.fontFamilyDisplay }}>
          {titulo}
        </div>
        <div style={{ fontSize: typography.scale.sm, color: colors.gray[700], marginTop: 2, textTransform: 'capitalize' }}>
          {subtitulo}
        </div>
      </div>
      <button type="button" className="sam-x" onClick={onClose} aria-label="Fechar" style={{
        width: 32, height: 32, borderRadius: radius.full, flexShrink: 0,
        border: `1px solid ${colors.gray.borderMd}`, background: colors.background.surfaceLight,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <X size={14} color={colors.gray.dimText} />
      </button>
    </div>
  )

  const conteudo = modo === 'menu' ? listaAcoes : editor

  const caixa: React.CSSProperties = isMobile ? {
    position: 'fixed', left: 0, right: 0, bottom: 0, maxHeight: '90dvh', overflowY: 'auto',
    borderRadius: `${radius['2xl']}px ${radius['2xl']}px 0 0`,
    boxShadow: '0 -8px 40px rgba(0,0,0,0.15)',
    animation: 'samUp 0.28s cubic-bezier(0.34,1.2,0.64,1)',
    paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
  } : {
    position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
    width: 360, maxWidth: '92vw', maxHeight: '86vh', overflowY: 'auto',
    borderRadius: radius.lg, border: `1px solid ${colors.gray.borderMd}`, boxShadow: shadows.lg,
    animation: 'samIn 0.16s ease',
  }

  if (typeof document === 'undefined') return null
  return createPortal(
    <>
      {estilos}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(6px)', zIndex: 10990 }} />
      <div
        className="sam-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sam-title"
        style={{
          ...caixa, zIndex: 10991, fontFamily: typography.fontFamily,
          background: glass.surface.modal.background,
          backdropFilter: glass.surface.modal.backdropFilter,
          WebkitBackdropFilter: glass.surface.modal.backdropFilter,
        }}
      >
        {isMobile && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.12)' }} />
          </div>
        )}
        {cabecalho}
        {conteudo}
      </div>

      {revisar && (
        <SeriesPreviewSheet
          mode="move"
          requestJson={revisar}
          previewPath={`/bookings/series/${seriesId}/move/preview`}
          confirmPath={`/bookings/series/${seriesId}/move`}
          isMobile={isMobile}
          onClose={() => setRevisar(null)}
          onMoved={() => { setRevisar(null); onMoved() }}
        />
      )}
    </>,
    document.body,
  )
}

const campo: React.CSSProperties = {
  // 16px evita o zoom automatico do Safari iOS ao focar o campo.
  fontSize: 16,
  fontVariantNumeric: 'tabular-nums',
  fontWeight: 600,
  fontFamily: 'inherit',
  height: 46,
  width: '100%',
  boxSizing: 'border-box',
  padding: '0 12px',
  borderRadius: 10,
  border: `1.5px solid ${colors.gray.borderMd}`,
  background: colors.background.surface,
  color: colors.gray[900],
}

const botao: React.CSSProperties = {
  fontFamily: 'inherit',
  fontSize: 14,
  fontWeight: typography.weight.semibold,
  minHeight: 48,
  padding: '0 16px',
  borderRadius: 10,
  border: `1px solid ${colors.gray.borderMd}`,
  background: colors.background.surface,
  color: colors.gray[900],
  cursor: 'pointer',
}
