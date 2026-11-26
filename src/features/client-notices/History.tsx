'use client'
// src/features/client-notices/History.tsx
// @eligi:cnot-history — enviadas e agendadas de um tipo, com cancelar e tirar a faixa.

import { Megaphone } from 'lucide-react'
import { dataHora, diaMes, exemplo } from './rules'
import type { Kind, Promo } from './types'

type Props = {
  kind: Kind
  items: Promo[]
  pinnedId: string | null
  onCancel: (p: Promo) => void
  onUnpin: (p: Promo) => void
}

export default function History({ kind, items, pinnedId, onCancel, onUnpin }: Props) {
  const lista = items.filter((p) => (p.kind ?? 'PROMO') === kind)
  const aviso = kind === 'AVISO'
  return (
    <section className="cpm-hist" aria-label="Enviados e agendados">
      <div className="cpm-cap">{aviso ? 'Avisos enviados e agendados' : 'Enviadas e agendadas'}</div>
      <div className="cpm-list">
        {lista.length === 0 && (
          <div className="cpm-empty">
            <Megaphone size={16} aria-hidden style={{ verticalAlign: -3, marginRight: 6 }} />
            {aviso ? 'Nenhum aviso ainda.' : 'Nenhuma promoção ainda.'}
          </div>
        )}
        {lista.map((p) => {
          const naFaixa = p.id === pinnedId
          const podeTirar = !!p.pinUntil && (naFaixa || p.status === 'SCHEDULED')
          return (
            <div key={p.id} className="cpm-li">
              <div className="t">
                <b>{exemplo(p.title)}</b>
                <small>
                  {aviso ? 'Todos os clientes' : p.audienceName} · {dataHora(p.sentAt ?? p.sendAt)}
                  {p.pinUntil && p.status !== 'CANCELED' && !naFaixa ? ` · faixa até ${diaMes(p.pinUntil)}` : ''}
                </small>
              </div>
              {naFaixa && p.pinUntil && <span className="cpm-st pin">No link até {diaMes(p.pinUntil)}</span>}
              {p.status === 'SENT' && <span className="cpm-st sent">{aviso ? 'Enviado' : 'Enviada'} para {p.recipients ?? 0}</span>}
              {(p.status === 'SCHEDULED' || p.status === 'SENDING') && <span className="cpm-st sched">{p.status === 'SENDING' ? 'Saindo' : aviso ? 'Agendado' : 'Agendada'}</span>}
              {p.status === 'CANCELED' && <span className="cpm-st">{aviso ? 'Cancelado' : 'Cancelada'}</span>}
              {podeTirar && <button type="button" className="cpm-btn sec" onClick={() => onUnpin(p)}>Tirar do link</button>}
              {p.status === 'SCHEDULED' && <button type="button" className="cpm-btn sec" onClick={() => onCancel(p)}>Cancelar</button>}
            </div>
          )
        })}
      </div>
      <p className="cpm-note">Contamos quantos receberam. O celular não informa quem leu.</p>
    </section>
  )
}
