'use client'
// src/features/vacations/VacationSheet.tsx
// @eligi:vac-fe-sheet — folha "Ferias de <nome>" (marcar ou mudar).
// Direcao A + o aviso da B + o atalho da C (decisao do Eli, 23/11/2026): a
// mesma folha abre da ficha (Equipe) e, na fatia 3, da agenda.
//
// - Primeiro dia com - / + e calendario do sistema; duracao em 7/10/15/30 dias
//   ou o ultimo dia escolhido do mesmo jeito.
// - Previa do back a cada mudanca (300 ms): clientes marcados TRAVAM o salvar
//   (lista com "Abrir" leva a agenda naquele dia) e quem mais esta fora so avisa.
// - O resultado da previa fica guardado com a chave das datas: resposta velha
//   nunca aparece para outra data, e nada e zerado dentro do efeito.
// Vai por portal no <body> (ancestral com transform prenderia o fixed).

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Check, Users, X } from 'lucide-react'
import { useAgendaStore } from '@/features/agenda/hooks/useAgendaStore'
import {
  DURATIONS,
  VACATION_MAX_DAYS,
  addDays,
  conflictWhen,
  daysInclusive,
  ddmm,
  errorBody,
  errorMessage,
  localDay,
  previewVacation,
  saveVacation,
  weekDdmm,
  weekday,
  type Vacation,
  type VacationConflict,
  type VacationPreview,
} from './api'
import { VAC_CSS } from './ui'

const noop = () => () => {}

type Props = {
  professionalId: string
  professionalName: string
  /** "Hoje" no fuso do negocio, vindo do back (pureza do React Compiler). */
  today: string
  /** Ferias existentes = modo editar. */
  editing?: Vacation | null
  onClose: () => void
  onSaved: (v: Vacation) => void
}

type PreviewState = { key: string; data: VacationPreview | null; failed: boolean }

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name
}

export default function VacationSheet({ professionalId, professionalName, today, editing, onClose, onSaved }: Props) {
  const mounted = useSyncExternalStore(noop, () => true, () => false)
  const router = useRouter()
  const [start, setStart] = useState(() => editing?.startDate ?? addDays(today, 1))
  const [end, setEnd] = useState(() => editing?.endDate ?? addDays(editing?.startDate ?? addDays(today, 1), 14))
  const [preview, setPreview] = useState<PreviewState | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  useEffect(() => { closeRef.current = onClose })

  const name = firstName(professionalName)
  const days = daysInclusive(start, end)
  const key = `${start}|${end}|${retry}`
  const current = preview && preview.key === key ? preview : null
  const loading = current === null
  const data = current?.data ?? null
  const conflicts: VacationConflict[] = data?.conflicts ?? []
  const blocked = !data || Boolean(data.error) || conflicts.length > 0

  // Foco, Esc e rolagem travada enquanto a folha esta aberta.
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    ref.current?.querySelector<HTMLButtonElement>('[data-vac-first]')?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeRef.current() }
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      prev?.focus()
    }
  }, [])

  // Previa: so pede depois de 300 ms sem mudar as datas.
  useEffect(() => {
    let vivo = true
    const t = setTimeout(() => {
      previewVacation({ professionalId, startDate: start, endDate: end, excludeId: editing?.id })
        .then((d) => { if (vivo) setPreview({ key, data: d, failed: false }) })
        .catch((e) => {
          console.error('[ferias] previa', e)
          if (vivo) setPreview({ key, data: null, failed: true })
        })
    }, 300)
    return () => { vivo = false; clearTimeout(t) }
  }, [key, professionalId, start, end, editing?.id])

  function moveStart(delta: number) {
    const ns = addDays(start, delta)
    setStart(ns)
    setEnd(addDays(ns, days - 1)) // mantem a duracao
    setSaveError(null)
  }
  function pickStart(v: string) {
    if (!v) return
    setStart(v)
    setEnd(addDays(v, days - 1))
    setSaveError(null)
  }
  function pickDuration(n: number) {
    setEnd(addDays(start, n - 1))
    setSaveError(null)
  }
  function moveEnd(delta: number) {
    const ne = addDays(end, delta)
    if (ne < start) return
    setEnd(ne)
    setSaveError(null)
  }
  function pickEnd(v: string) {
    if (!v || v < start) return
    setEnd(v)
    setSaveError(null)
  }

  function openOnAgenda(c: VacationConflict) {
    useAgendaStore.getState().setSelectedDate(new Date(`${localDay(c.startAt)}T12:00:00`))
    onClose()
    router.push('/dashboard/agenda')
  }

  async function save() {
    if (saving || blocked) return
    setSaving(true)
    setSaveError(null)
    try {
      const v = await saveVacation({ professionalId, startDate: start, endDate: end }, editing?.id ?? null)
      onSaved(v)
    } catch (e) {
      const { status, body } = errorBody(e)
      if (status === 409 && body.code === 'VAC_HAS_BOOKINGS' && Array.isArray(body.conflicts) && data) {
        // alguem marcou entre a previa e o salvar: a lista aparece na hora
        setPreview({ key, data: { ...data, conflicts: body.conflicts }, failed: false })
      } else {
        setSaveError(errorMessage(e, 'Não foi possível salvar as férias. Tente de novo.'))
      }
    } finally {
      setSaving(false)
    }
  }

  if (!mounted) return null

  const presetActive = (n: number) => days === n
  const startMin = editing && editing.startDate < today ? editing.startDate : today

  return createPortal(
    <>
      <style>{VAC_CSS}</style>
      <div className="vac-drop" onClick={onClose} aria-hidden="true" />
      <div className="vac-sheet" role="dialog" aria-modal="true" aria-labelledby="vac-title" ref={ref}>
        <div className="vac-head">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 id="vac-title">Férias de {name}</h2>
            <span className="vac-sub">Nesses dias ninguém marca com {name} pelo link.</span>
          </div>
          <button type="button" className="vac-x" onClick={onClose} aria-label="Fechar">
            <X size={20} strokeWidth={2.2} />
          </button>
        </div>

        <div className="vac-field">
          <span>Primeiro dia fora</span>
          <div className="vac-step">
            <button type="button" data-vac-first onClick={() => moveStart(-1)} disabled={start <= startMin} aria-label="Um dia antes">−</button>
            <label>
              <b>{weekDdmm(start)}</b>
              <small>{weekday(start)}</small>
              <input type="date" value={start} min={startMin} onChange={(e) => pickStart(e.target.value)} aria-label="Escolher o primeiro dia" />
            </label>
            <button type="button" onClick={() => moveStart(1)} aria-label="Um dia depois">+</button>
          </div>
        </div>

        <div className="vac-field">
          <span>Quantos dias</span>
          <div className="vac-chips">
            {DURATIONS.map((n) => (
              <button key={n} type="button" className="vac-chip" aria-pressed={presetActive(n)} onClick={() => pickDuration(n)}>
                <b>{n}</b>
                <small>dias</small>
              </button>
            ))}
          </div>
        </div>

        <div className="vac-field">
          <span>Último dia fora</span>
          <div className="vac-step">
            <button type="button" onClick={() => moveEnd(-1)} disabled={end <= start} aria-label="Um dia a menos">−</button>
            <label>
              <b>{weekDdmm(end)}</b>
              <small>{days} {days === 1 ? 'dia' : 'dias'} · volta {weekDdmm(addDays(end, 1))}</small>
              <input type="date" value={end} min={start} onChange={(e) => pickEnd(e.target.value)} aria-label="Escolher o último dia" />
            </label>
            <button type="button" onClick={() => moveEnd(1)} disabled={days >= VACATION_MAX_DAYS} aria-label="Um dia a mais">+</button>
          </div>
        </div>

        <div aria-live="polite" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading && <div className="vac-alert info">Conferindo a agenda de {name}…</div>}

          {current?.failed && (
            <div className="vac-alert bad">
              <AlertTriangle size={18} strokeWidth={2.2} aria-hidden="true" />
              <span style={{ flex: 1 }}>Não foi possível conferir a agenda.</span>
              <button type="button" className="vac-btn" style={{ flex: 'none', minHeight: 36, padding: '0 12px' }} onClick={() => setRetry((n) => n + 1)}>
                Tentar de novo
              </button>
            </div>
          )}

          {data?.error && (
            <div className="vac-alert bad">
              <AlertTriangle size={18} strokeWidth={2.2} aria-hidden="true" />
              <span>{data.message}</span>
            </div>
          )}

          {data && !data.error && conflicts.length > 0 && (
            <div className="vac-alert warn" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <AlertTriangle size={18} strokeWidth={2.2} color="#b45309" aria-hidden="true" />
                <span>
                  <b>{conflicts.length === 1 ? '1 cliente marcado' : `${conflicts.length} clientes marcados`}</b> com {name} nesses dias. Remarque ou cancele cada um para salvar.
                </span>
              </div>
              <div className="vac-list">
                {conflicts.map((c) => (
                  <button key={c.bookingId} type="button" onClick={() => openOnAgenda(c)}>
                    <span style={{ minWidth: 0 }}>
                      <b>{c.clientName}</b>
                      <small>
                        {conflictWhen(c.startAt)} · {c.serviceName}
                        {c.extraServices > 0 ? ` e mais ${c.extraServices}` : ''}
                      </small>
                    </span>
                    <em>Abrir</em>
                  </button>
                ))}
              </div>
            </div>
          )}

          {data && !data.error && conflicts.length === 0 && (
            <div className="vac-alert ok">
              <Check size={18} strokeWidth={2.4} aria-hidden="true" />
              <span><b>Nenhum cliente marcado</b> com {name} nesses dias.</span>
            </div>
          )}

          {data && !data.error && data.overlaps.length > 0 && (
            <div className="vac-alert info">
              <Users size={18} strokeWidth={2.2} aria-hidden="true" />
              <span>
                {data.overlaps.map((o, i) => (
                  <span key={o.professionalId}>
                    {i > 0 ? ' · ' : ''}
                    <b>{firstName(o.professionalName)}</b> também está fora de {ddmm(o.shared.startDate)} a {ddmm(o.shared.endDate)}
                  </span>
                ))}
                .
              </span>
            </div>
          )}

          {saveError && (
            <div className="vac-alert bad" role="alert">
              <AlertTriangle size={18} strokeWidth={2.2} aria-hidden="true" />
              <span>{saveError}</span>
            </div>
          )}
        </div>

        <div className="vac-foot">
          <button type="button" className="vac-main" onClick={save} disabled={blocked || saving}>
            {saving ? 'Salvando…' : editing ? 'Salvar mudanças' : 'Salvar férias'}
          </button>
          {data && !data.error && conflicts.length > 0 && (
            <small>Falta resolver {conflicts.length === 1 ? '1 horário' : `${conflicts.length} horários`}.</small>
          )}
        </div>
      </div>
    </>,
    document.body,
  )
}
