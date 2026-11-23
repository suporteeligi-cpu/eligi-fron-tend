'use client'
// src/features/vacations/VacationsPane.tsx
// @eligi:vac-fe-pane — aba "Ferias" da ficha do profissional (Equipe).
// Proximas ferias em destaque (dias, volta, Editar, Cancelar com confirmacao),
// "Ja tirou" e "Marcar ferias". O "hoje" vem do back (pureza do React Compiler).

import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import VacationSheet from './VacationSheet'
import { VAC_CSS } from './ui'
import {
  deleteVacation,
  errorBody,
  errorMessage,
  fetchVacations,
  rangeLabel,
  weekDdmm,
  type Vacation,
  type VacationList,
} from './api'

type Props = { professionalId: string; professionalName: string }

type State =
  | { kind: 'loading' }
  | { kind: 'error'; message: string; forbidden: boolean }
  | { kind: 'ok'; data: VacationList }

function firstName(n: string) {
  return n.trim().split(/\s+/)[0] || n
}

export default function VacationsPane({ professionalId, professionalName }: Props) {
  const [state, setState] = useState<State>({ kind: 'loading' })
  const [reload, setReload] = useState(0)
  const [sheet, setSheet] = useState<{ editing: Vacation | null } | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    let vivo = true
    fetchVacations(professionalId)
      .then((data) => { if (vivo) setState({ kind: 'ok', data }) })
      .catch((e) => {
        console.error('[ferias] listar', e)
        if (vivo) setState({
          kind: 'error',
          forbidden: errorBody(e).status === 403,
          message: errorMessage(e, 'Não foi possível carregar as férias.'),
        })
      })
    return () => { vivo = false }
  }, [professionalId, reload])

  function refresh() {
    setState({ kind: 'loading' })
    setReload((n) => n + 1)
  }

  async function cancel(id: string) {
    if (busy) return
    setBusy(true)
    setActionError(null)
    try {
      await deleteVacation(id)
      setConfirmId(null)
      refresh()
    } catch (e) {
      setActionError(errorMessage(e, 'Não foi possível cancelar as férias. Tente de novo.'))
    } finally {
      setBusy(false)
    }
  }

  const name = firstName(professionalName)

  return (
    <div className="vac-root" style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 10 }}>
      <style>{VAC_CSS}</style>

      {state.kind === 'loading' && <div className="vac-skel" aria-label="Carregando férias" />}

      {state.kind === 'error' && (
        <div className="vac-card">
          <div className="vac-empty">
            <b>{state.forbidden ? 'Sem acesso às férias' : 'Não carregou'}</b>
            <span>{state.message}</span>
          </div>
          {!state.forbidden && (
            <button type="button" className="vac-btn" onClick={refresh}>Tentar de novo</button>
          )}
        </div>
      )}

      {state.kind === 'ok' && (() => {
        const { today, upcoming, past } = state.data
        const next = upcoming[0] ?? null
        const later = upcoming.slice(1)
        const now = next && next.startDate <= today
        return (
          <>
            {next ? (
              <div className="vac-card">
                <span className="vac-eyebrow">{now ? 'De férias agora' : 'Próximas férias'}</span>
                <div className="vac-big">{rangeLabel(next.startDate, next.endDate, today)}</div>
                <span className="vac-sub">
                  {next.days} {next.days === 1 ? 'dia' : 'dias'} · volta {weekDdmm(next.returnDate)}
                </span>
                <div className="vac-stripe" aria-hidden="true" />
                <span className="vac-note">Ninguém marca com {name} pelo link nesses dias. No painel dá para encaixar, com confirmação.</span>

                {confirmId === next.id ? (
                  <div className="vac-alert bad" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                    <span>Cancelar estas férias? {name} volta a aparecer no link nesses dias.</span>
                    <div className="vac-row2">
                      <button type="button" className="vac-btn" onClick={() => setConfirmId(null)} disabled={busy}>Voltar</button>
                      <button type="button" className="vac-btn danger" onClick={() => cancel(next.id)} disabled={busy}>
                        {busy ? 'Cancelando…' : 'Cancelar férias'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="vac-row2">
                    <button type="button" className="vac-btn" onClick={() => setSheet({ editing: next })}>Editar</button>
                    <button type="button" className="vac-btn danger" onClick={() => { setActionError(null); setConfirmId(next.id) }}>Cancelar</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="vac-card">
                <div className="vac-empty">
                  <b>Nenhuma férias marcada</b>
                  <span>Marque os dias em que {name} não atende. O link para de oferecer horário com {name} nesse período.</span>
                </div>
              </div>
            )}

            {later.map((v) => (
              <div key={v.id} className="vac-card" style={{ padding: '12px 16px' }}>
                <div className="vac-past" style={{ padding: 0 }}>
                  <span><b>{rangeLabel(v.startDate, v.endDate, today)}</b></span>
                  <span>{v.days} dias</span>
                </div>
                <div className="vac-row2">
                  <button type="button" className="vac-btn" onClick={() => setSheet({ editing: v })}>Editar</button>
                  {confirmId === v.id ? (
                    <button type="button" className="vac-btn danger" onClick={() => cancel(v.id)} disabled={busy}>
                      {busy ? 'Cancelando…' : 'Confirmar'}
                    </button>
                  ) : (
                    <button type="button" className="vac-btn danger" onClick={() => { setActionError(null); setConfirmId(v.id) }}>Cancelar</button>
                  )}
                </div>
              </div>
            ))}

            {actionError && (
              <div className="vac-alert bad" role="alert">
                <AlertTriangle size={18} strokeWidth={2.2} aria-hidden="true" />
                <span>{actionError}</span>
              </div>
            )}

            <button type="button" className="vac-main" onClick={() => setSheet({ editing: null })}>
              Marcar férias
            </button>

            {past.length > 0 && (
              <div className="vac-card">
                <span className="vac-eyebrow">Já tirou</span>
                {past.map((v) => (
                  <div key={v.id} className="vac-past">
                    <span>{rangeLabel(v.startDate, v.endDate, today)}</span>
                    <span>{v.days} {v.days === 1 ? 'dia' : 'dias'}</span>
                  </div>
                ))}
              </div>
            )}

            {sheet && (
              <VacationSheet
                professionalId={professionalId}
                professionalName={professionalName}
                today={today}
                editing={sheet.editing}
                onClose={() => setSheet(null)}
                onSaved={() => { setSheet(null); refresh() }}
              />
            )}
          </>
        )
      })()}
    </div>
  )
}
