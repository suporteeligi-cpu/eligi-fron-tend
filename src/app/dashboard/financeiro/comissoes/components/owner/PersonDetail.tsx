'use client'
// src/app/dashboard/financeiro/comissoes/components/owner/PersonDetail.tsx
// @eligi:ocf-person — detalhe de UMA pessoa no pagamento da semana ("pessoa da C").
// No computador fica na coluna da direita; no celular abre numa folha (PersonSheet).
// Os itens vem de /payouts/commissions/items, que e so do dono: para o gerente o
// 403 vira aviso e os valores do resumo continuam aparecendo.

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import type { CommissionItemDetail } from '@/features/payouts/types'
import { MC_CSS } from '../my/mcStyles'
import { MoneyFlat } from '../my/mcParts'
import { brl, dayKeySP } from '../my/mcFormat'
import { OC_CSS } from './ocStyles'
import { Avatar, type OcPerson } from './ocParts'

const PREVIEW = 6

type ItemsState =
  | { key: string; status: 'ok'; items: CommissionItemDetail[] }
  | { key: string; status: 'forbidden' | 'error' }

function baseText(it: CommissionItemDetail): string {
  const si = it.saleItem
  if (si.commissionType === 'FIXED') return 'valor fixo'
  if (si.commissionType === 'PERCENT' && si.commissionValue && si.commissionValue > 0) {
    // Base real da comissao (servico coberto por pacote usa o preco cheio).
    const base = (it.amount * 100) / si.commissionValue
    const pct = Number.isInteger(si.commissionValue) ? String(si.commissionValue) : si.commissionValue.toLocaleString('pt-BR')
    return `base R$ ${brl(base)} · ${pct}%`
  }
  return it.type === 'PRODUCT' ? 'produto' : 'serviço'
}

function fetchItems(professionalId: string, from: string, to: string): Promise<CommissionItemDetail[]> {
  return api.get('/payouts/commissions/items', {
    params: { professionalId, payoutStatus: 'pending', dateFrom: from, dateTo: to, limit: 500 },
  }).then(res => {
    const raw = res.data?.data ?? res.data ?? []
    return Array.isArray(raw) ? (raw as CommissionItemDetail[]) : []
  })
}

interface Props {
  person:   OcPerson
  from:     string | null   // ISO, inicio do periodo mostrado
  to:       string | null
  rangeTxt: string        // "semana 03–09 nov"
  status:   'closed' | 'open'
  openTotal: number
  canAct:   boolean   // so o dono gera e marca como pago
}

export default function PersonDetail({ person, from, to, rangeTxt, status, openTotal, canAct }: Props) {
  const key = `${person.id}|${from ?? ''}|${to ?? ''}`
  const [state, setState] = useState<ItemsState | null>(null)
  const [showAll, setShowAll] = useState<string | null>(null)

  useEffect(() => {
    if (!from || !to) return
    let alive = true
    fetchItems(person.id, from, to)
      .then(items => { if (alive) setState({ key, status: 'ok', items }) })
      .catch((e: unknown) => {
        const st = (e as { response?: { status?: number } })?.response?.status
        if (alive) setState({ key, status: st === 403 ? 'forbidden' : 'error' })
      })
    return () => { alive = false }
  }, [key, person.id, from, to])

  const cur = state && state.key === key ? state : null
  const items = cur?.status === 'ok' ? cur.items : []
  const expanded = showAll === key
  const visible = expanded ? items : items.slice(0, PREVIEW)
  const count = status === 'closed' ? person.closedCount : person.openCount

  return (
    <div className="oc-det">
      <div className="oc-det-h">
        <Avatar name={person.name} url={person.avatarUrl} lg />
        <div className="mc-min0" style={{ flex: 1 }}>
          <div className="nm mc-ell">{person.name}</div>
          <div className="sm">{rangeTxt} · {count} {count === 1 ? 'item' : 'itens'}</div>
        </div>
        <span className={`oc-pill ${status === 'closed' ? 'run' : 'wait'}`}>{status === 'closed' ? 'Aguardando gerar' : 'Em andamento'}</span>
      </div>

      <div className="oc-boxes">
        <div className="oc-box main">
          <div className="l">{status === 'closed' ? 'Fechado' : 'Até agora'}</div>
          <div className="v"><MoneyFlat v={status === 'closed' ? person.closedTotal : person.openTotal} /></div>
        </div>
        <div className="oc-box">
          <div className="l">Serviços</div>
          <div className="v"><MoneyFlat v={status === 'closed' ? person.closedService : person.openService} /></div>
        </div>
        <div className="oc-box">
          <div className="l">Produtos</div>
          <div className="v"><MoneyFlat v={status === 'closed' ? person.closedProduct : person.openProduct} /></div>
        </div>
      </div>

      <div className="oc-ith">
        <span className="mc-eyebrow">Itens · base, % e comissão</span>
        {status === 'closed' && openTotal > 0 && <span className="mc-fnt" style={{ fontSize: 12 }}>semana atual <MoneyFlat v={openTotal} /></span>}
      </div>

      {!from || !to || cur?.status === 'forbidden' ? (
        <div className="oc-info">Só o dono vê os itens de cada pessoa. Os valores acima já são os do pagamento.</div>
      ) : cur?.status === 'error' ? (
        <div className="oc-info">Não deu para carregar os itens agora. Feche e abra de novo.</div>
      ) : !cur ? (
        <div aria-busy="true">
          {[0, 1, 2].map(i => <div key={i} className="mc-sk" style={{ height: 40, margin: '10px 0' }} />)}
        </div>
      ) : items.length === 0 ? (
        <div className="oc-info">Nenhum item neste período.</div>
      ) : (
        <>
          <div>
            {visible.map(it => {
              const k = dayKeySP(it.earnedAt)
              return (
                <div key={it.id} className="oc-it">
                  <span className="d mc-mono">{k.slice(8, 10)}/{k.slice(5, 7)}</span>
                  <div className="mc-min0">
                    <div className="nm mc-ell">{it.saleItem.name}</div>
                    <div className="why mc-ell">{baseText(it)}</div>
                  </div>
                  <span className="v"><MoneyFlat v={it.amount} /></span>
                </div>
              )
            })}
          </div>
          {items.length > PREVIEW && !expanded && (
            <button className="oc-more" onClick={() => setShowAll(key)}>Ver os {items.length} itens</button>
          )}
        </>
      )}

      {status === 'closed' && canAct && (
        <div className="oc-info">Depois de gerar, o pagamento aparece em A pagar com o botão &quot;Marcar como pago&quot;.</div>
      )}
    </div>
  )
}

const noop = () => () => {}

/** Folha do celular: de 104px ate a barra inferior, por portal no <body>. */
export function PersonSheet({ onClose, children, title }: { onClose: () => void; children: React.ReactNode; title: string }) {
  const mounted = useSyncExternalStore(noop, () => true, () => false)
  const closeRef = useRef<HTMLButtonElement>(null)

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

  if (!mounted) return null
  return createPortal(
    <div className="mcw">
      <style>{MC_CSS + OC_CSS}</style>
      <div className="mcw-scrim" onClick={onClose} aria-hidden />
      <div className="mcw-sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="mcw-h">
          <div className="mc-min0" style={{ flex: 1 }}>
            <h2 className="mcw-t mc-ell">{title}</h2>
          </div>
          <button ref={closeRef} className="mcw-ib" aria-label="Fechar" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="mcw-body">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
