'use client'
// src/app/dashboard/clientes/components/ClientsList.tsx
// @eligi:clients-list-v2 — direcao B "Ficha". Uma lista so, celular e
// computador. Toque abre o cliente; segurar (420ms) ou "Selecionar" entra no
// modo de selecao para exportar.

import { useRef, type TouchEvent as ReactTouchEvent } from 'react'
import { Check, MessageCircle } from 'lucide-react'

import EligiClubIcon from '@/app/components/navigation/EligiClubIcon'
import type { ClientListItem, ClientsTab } from '@/features/clients/types'
import { fmtMoneyShort, fmtShortDate, plural } from '@/features/clients/utils/format'
import { firstName } from '@/shared/utils/whatsapp'

interface Props {
  clients:         ClientListItem[]
  tab:             ClientsTab
  activeId:        string | null
  selectedIds:     Set<string>
  selectionActive: boolean
  onOpen:          (id: string) => void
  onToggle:        (id: string) => void
  /** aba Sumidos: abre a mensagem pronta do WhatsApp (so com telefone visivel) */
  onWhats?:        (c: ClientListItem) => void // @eligi:lapsed-list-prop
}

function initialOf(name: string): string {
  const ch = name.trim().charAt(0).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase()
  return /[A-Z]/.test(ch) ? ch : '#'
}

function metaOf(c: ClientListItem, tab: ClientsTab): { text: string; warn: boolean } {
  if (c.visits === 0) return { text: 'SEM VISITAS', warn: false }
  const visits = plural(c.visits, 'VISITA', 'VISITAS')
  if (tab === 'lapsed' && c.daysSinceLastVisit !== null) {
    // @eligi:lapsed-list-meta — o ritmo do cliente explica por que ele conta como sumido
    const tail = c.rhythmDays ? `VINHA A CADA ${c.rhythmDays}` : visits
    return { text: `HÁ ${c.daysSinceLastVisit} DIAS · ${tail}`, warn: true }
  }
  return { text: c.lastVisit ? `${visits} · ${fmtShortDate(c.lastVisit)}` : visits, warn: false }
}

/** "6 de 7 com Jefferson" / "escolheu Jefferson 5 vezes"; null = sem preferencia */
function fidOf(c: ClientListItem): { text: string; gone: boolean } | null {
  const p = c.topPro
  if (!p) return null
  const nome = firstName(p.name)
  const text = p.chose >= 2 && p.chose === p.visits
    ? `escolheu ${nome} ${p.chose} vezes`
    : `${p.visits} de ${c.visits} com ${nome}`
  return { text: p.active ? text : `${text} · saiu`, gone: !p.active }
}

export default function ClientsList({ clients, tab, activeId, selectedIds, selectionActive, onOpen, onToggle, onWhats }: Props) {
  // Segurar para selecionar (so toque). Guardado em ref: nao vira render.
  const lp = useRef<{ timer: ReturnType<typeof setTimeout> | null; x: number; y: number; fired: boolean }>({
    timer: null, x: 0, y: 0, fired: false,
  })

  const onTouchStart = (e: ReactTouchEvent<HTMLButtonElement>, id: string) => {
    const s = lp.current
    s.x = e.touches[0].clientX
    s.y = e.touches[0].clientY
    s.fired = false
    s.timer = setTimeout(() => {
      s.fired = true
      s.timer = null
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(30)
      onToggle(id)
    }, 420)
  }
  const onTouchMove = (e: ReactTouchEvent<HTMLButtonElement>) => {
    const s = lp.current
    const dx = Math.abs(e.touches[0].clientX - s.x)
    const dy = Math.abs(e.touches[0].clientY - s.y)
    if ((dx > 8 || dy > 8) && s.timer) { clearTimeout(s.timer); s.timer = null }
  }
  const onTouchEnd = () => {
    const s = lp.current
    if (s.timer) { clearTimeout(s.timer); s.timer = null }
  }
  const onClick = (id: string) => {
    const s = lp.current
    if (s.fired) { s.fired = false; return }
    if (selectionActive) { onToggle(id); return }
    onOpen(id)
  }

  return (
    <div className="cl-rows" role="list">
      {clients.map((c, i) => {
        // Letra do A-Z: compara com o anterior, sem acumulador (React Compiler).
        const letter = tab === 'az' ? initialOf(c.name) : ''
        const showLetter = tab === 'az' && (i === 0 || initialOf(clients[i - 1].name) !== letter)
        const meta = metaOf(c, tab)
        const fid = tab === 'lapsed' ? fidOf(c) : null
        const sel = selectedIds.has(c.id)
        const cls = `cl-row${activeId === c.id && !selectionActive ? ' is-on' : ''}${sel ? ' is-sel' : ''}`
        return (
          <div key={c.id} role="listitem" className={tab === 'lapsed' ? 'cl-li' : undefined}>
            {showLetter && <div className="cl-letter cl-m" aria-hidden="true">{letter}</div>}
            <button
              type="button"
              className={cls}
              aria-current={activeId === c.id ? 'true' : undefined}
              aria-pressed={selectionActive ? sel : undefined}
              onClick={() => onClick(c.id)}
              onTouchStart={e => onTouchStart(e, c.id)}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              onTouchCancel={onTouchEnd}
              onContextMenu={e => { if (selectionActive || lp.current.fired) e.preventDefault() }}
            >
              {selectionActive && (
                <span className={`cl-check${sel ? ' is-on' : ''}`} aria-hidden="true">
                  {sel && <Check size={14} strokeWidth={3} />}
                </span>
              )}
              <span className="cl-row-main">
                <span className="cl-row-name">
                  <span className="cl-ellipsis">{c.name}</span>
                  {c.hasClub && <EligiClubIcon size={15} color="#111114" aria-label="Membro do clube" />}
                </span>
                <span className={`cl-row-meta cl-m cl-n${meta.warn ? ' is-warn' : ''}`}>{meta.text}</span>
                {fid && <span className={`cl-fid${fid.gone ? ' is-gone' : ''}`}>{fid.text}</span>}
              </span>
              <span className={`cl-row-money cl-d cl-n${c.spent > 0 ? '' : ' is-zero'}`}>
                {c.spentEstimated ? '~' : ''}{fmtMoneyShort(c.spent)}
              </span>
            </button>
            {tab === 'lapsed' && onWhats && c.phone && !selectionActive && (
              <button type="button" className="cl-wa" aria-label={`Chamar ${c.name} no WhatsApp`} onClick={() => onWhats(c)}>
                <MessageCircle size={20} aria-hidden="true" />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
