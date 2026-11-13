'use client'
// src/app/dashboard/clientes/components/LapsedWhatsSheet.tsx
// @eligi:lapsed-wa — chamar um cliente sumido pelo WhatsApp com a mensagem
// pronta (nov/2026). Quem envia e a pessoa (wa.me), sem custo e sem webhook.
// Cliente de quem saiu da equipe: escolhe quem vai atender e o texto ja
// apresenta essa pessoa. Folha por portal: de 104px ate a barra inferior no
// celular; centralizada na area de conteudo no computador.

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { MessageCircle, X } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import type { ClientListItem } from '@/features/clients/types'
import { LAPSED_CSS } from '@/features/clients/lapsedStyles'
import { lapsedMessage } from '@/features/clients/lapsedMessage'
import { firstName, waLink } from '@/shared/utils/whatsapp'

const noop = () => () => {}

interface TeamPro { id: string; name: string }

function fetchTeam(): Promise<TeamPro[]> {
  return api.get('/equipe').then(res => {
    const raw = res.data?.data ?? res.data ?? []
    const list: unknown[] = Array.isArray(raw) ? raw : []
    return list
      .filter((p): p is { id: string; name: string; active?: boolean } =>
        typeof p === 'object' && p !== null
        && typeof (p as { id?: unknown }).id === 'string'
        && typeof (p as { name?: unknown }).name === 'string')
      .filter(p => p.active !== false)
      .map(p => ({ id: p.id, name: p.name }))
  })
}

export default function LapsedWhatsSheet({ client, onClose }: { client: ClientListItem; onClose: () => void }) {
  const mounted = useSyncExternalStore(noop, () => true, () => false)
  const closeRef = useRef<HTMLButtonElement>(null)
  const pro = client.topPro ?? null
  const gone = pro != null && !pro.active
  const [team, setTeam] = useState<TeamPro[]>([])
  // null = "qualquer um da equipe"; undefined = ainda nao escolhido (primeiro da lista)
  const [pick, setPick] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    if (!gone) return
    let alive = true
    fetchTeam()
      .then(t => { if (alive) setTeam(t) })
      .catch(() => { if (alive) setTeam([]) })
    return () => { alive = false }
  }, [gone])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => { document.body.style.overflow = prev }
  }, [])

  const chosenId = pick === undefined ? team[0]?.id ?? null : pick
  const replacement = gone ? team.find(t => t.id === chosenId)?.name ?? null : null
  const text = lapsedMessage({ clientName: client.name, pro: pro ? { name: pro.name, active: pro.active } : null, replacement })
  const days = client.daysSinceLastVisit

  const sub = [
    pro ? `${pro.visits} de ${client.visits} com ${firstName(pro.name)}${gone ? ' (saiu)' : ''}` : 'sem profissional preferido',
    days != null ? `há ${days} dias` : null,
  ].filter(Boolean).join(' · ')

  if (!mounted || !client.phone) return null
  return createPortal(
    <div className="clw">
      <style>{LAPSED_CSS}</style>
      <div className="clw-scrim" onClick={onClose} aria-hidden="true" />
      <div className="clw-sheet" role="dialog" aria-modal="true" aria-labelledby="clw-title">
        <div className="clw-h">
          <div style={{ minWidth: 0 }}>
            <h2 id="clw-title" className="clw-t">Chamar {firstName(client.name)}</h2>
            <div className="clw-s">{sub}</div>
          </div>
          <button ref={closeRef} type="button" className="clw-x" aria-label="Fechar" onClick={onClose}><X size={18} /></button>
        </div>

        {gone && (
          <div>
            <div className="clw-l">Quem vai atender</div>
            <div className="clw-pick" role="group" aria-label="Quem vai atender">
              {team.map(t => (
                <button key={t.id} type="button" className={`cl-chip${chosenId === t.id ? ' is-on' : ''}`} aria-pressed={chosenId === t.id} onClick={() => setPick(t.id)}>
                  {firstName(t.name)}
                </button>
              ))}
              <button type="button" className={`cl-chip${chosenId == null ? ' is-on' : ''}`} aria-pressed={chosenId == null} onClick={() => setPick(null)}>
                Qualquer um
              </button>
            </div>
          </div>
        )}

        <div>
          <div className="clw-l" style={{ marginBottom: 8 }}>Mensagem</div>
          <div className="clw-bub"><div className="clw-msg">{text}</div></div>
          <div className="clw-note" style={{ marginTop: 8 }}>Dá para editar no WhatsApp antes de enviar.</div>
        </div>

        <a className="clw-go" href={waLink(client.phone, text)} target="_blank" rel="noopener noreferrer" onClick={onClose}>
          <MessageCircle size={18} aria-hidden="true" /><span>Abrir WhatsApp</span>
        </a>
      </div>
    </div>,
    document.body,
  )
}
