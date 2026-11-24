'use client'
// src/features/vacations/VacationQuickSheet.tsx
// @eligi:vac-fe-quick — atalho da agenda (direcao C): tocar no profissional ja
// escolhido abre esta folha curta. So aparece depois que o GET /vacations
// responde; 403 (cargo sem acesso) fecha sem mostrar nada: o front nao repete
// a lista de cargos.

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { Palmtree, X } from 'lucide-react'
import VacationSheet from './VacationSheet'
import { VAC_CSS } from './ui'
import { errorBody, errorMessage, fetchVacations, rangeLabel, weekDdmm, type Vacation, type VacationList } from './api'

const noop = () => () => {}

type Props = {
  professionalId: string
  professionalName: string
  onClose: () => void
  /** Ferias salvas: a agenda recarrega o dia. */
  onChanged: () => void
}

type State =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ok'; data: VacationList }

export default function VacationQuickSheet({ professionalId, professionalName, onClose, onChanged }: Props) {
  const mounted = useSyncExternalStore(noop, () => true, () => false)
  const [state, setState] = useState<State>({ kind: 'loading' })
  const [reload, setReload] = useState(0)
  const [sheet, setSheet] = useState<{ editing: Vacation | null } | null>(null)
  const closeRef = useRef(onClose)
  useEffect(() => { closeRef.current = onClose })

  useEffect(() => {
    let vivo = true
    fetchVacations(professionalId)
      .then((data) => { if (vivo) setState({ kind: 'ok', data }) })
      .catch((e) => {
        if (!vivo) return
        if (errorBody(e).status === 403) { closeRef.current(); return }
        console.error('[ferias] atalho', e)
        setState({ kind: 'error', message: errorMessage(e, 'Não foi possível carregar as férias.') })
      })
    return () => { vivo = false }
  }, [professionalId, reload])

  useEffect(() => {
    if (sheet) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeRef.current() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [sheet])

  if (!mounted || state.kind === 'loading') return null

  if (sheet && state.kind === 'ok') {
    return (
      <VacationSheet
        professionalId={professionalId}
        professionalName={professionalName}
        today={state.data.today}
        editing={sheet.editing}
        onClose={() => setSheet(null)}
        onSaved={() => { onChanged(); onClose() }}
      />
    )
  }

  const next = state.kind === 'ok' ? state.data.upcoming[0] ?? null : null
  const today = state.kind === 'ok' ? state.data.today : ''
  const now = !!next && next.startDate <= today

  return createPortal(
    <>
      <style>{VAC_CSS}</style>
      <div className="vac-drop" onClick={onClose} aria-hidden="true" />
      <div className="vac-sheet small" role="dialog" aria-modal="true" aria-labelledby="vac-q-title">
        <div className="vac-head">
          <h2 id="vac-q-title" style={{ fontSize: 20 }}>{professionalName}</h2>
          <button type="button" className="vac-x" onClick={onClose} aria-label="Fechar">
            <X size={20} strokeWidth={2.2} />
          </button>
        </div>

        {state.kind === 'error' && (
          <>
            <div className="vac-alert bad">{state.message}</div>
            <button type="button" className="vac-btn" onClick={() => { setState({ kind: 'loading' }); setReload((n) => n + 1) }}>
              Tentar de novo
            </button>
          </>
        )}

        {state.kind === 'ok' && (
          <>
            <div className="vac-sum">
              {next ? (
                <>
                  <b>{now ? 'De férias agora' : 'Próximas férias'}:</b> {rangeLabel(next.startDate, next.endDate, today)} · volta {weekDdmm(next.returnDate)}
                </>
              ) : (
                <>Nenhuma férias marcada.</>
              )}
            </div>
            <button type="button" className="vac-main" onClick={() => setSheet({ editing: next })} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Palmtree size={18} strokeWidth={2.2} aria-hidden="true" />
              {next ? 'Mudar estas férias' : 'Colocar de férias'}
            </button>
            {next && (
              <button type="button" className="vac-btn" onClick={() => setSheet({ editing: null })}>
                Marcar outras férias
              </button>
            )}
            <span className="vac-note">Nesses dias ninguém marca pelo link. No painel dá para encaixar, com confirmação.</span>
          </>
        )}
      </div>
    </>,
    document.body,
  )
}
