// src/features/anamnesis/components/RecordsList.tsx
// @eligi:anamnese-front-lista
// Busca + filtros + lista de fichas preenchidas. Sem telefone na lista
// (decisao do Eli) e sem contagem de alertas: o selo so diz que existe.
// Quem nao ve conteudo (recepcao) ve a lista sem o selo e nao abre a ficha.
'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, ChevronRight, ClipboardList, Lock, Search, X } from 'lucide-react'
import { useRecords } from '../hooks/useRecords'
import { fmtDate } from '../format'
import type { RecordFilter, RecordListItem } from '../types'
import RecordSheet from './RecordSheet'

interface Props {
  contentAccess: boolean
  canErase: boolean
  /** Modulo desligado: some quando nao ha ficha antiga para mostrar. */
  hideWhenEmpty?: boolean
}

const FILTERS: { key: RecordFilter; label: string; content?: boolean }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'alert', label: 'Com alerta', content: true },
  { key: 'expired', label: 'Vencidas' },
]

export default function RecordsList({ contentAccess, canErase, hideWhenEmpty }: Props) {
  const [text, setText] = useState('')
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<RecordFilter>('all')
  const [open, setOpen] = useState<RecordListItem | null>(null)

  // Busca no servidor depois de uma pausa na digitacao.
  useEffect(() => {
    const t = setTimeout(() => setQ(text.trim()), 350)
    return () => clearTimeout(t)
  }, [text])

  const { loading, items, error, hasMore, loadingMore, moreError, loadMore, removeItem, reload } = useRecords(filter, q)
  const searching = q !== '' || filter !== 'all'

  if (hideWhenEmpty && !loading && !error && items.length === 0 && !searching) return null

  const filters = FILTERS.filter((f) => !f.content || contentAccess)

  return (
    <section className="an-list" aria-label="Fichas preenchidas">
      <div className="an-tools">
        <label className="an-search">
          <Search size={17} aria-hidden />
          <input
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Buscar cliente"
            aria-label="Buscar cliente pelo nome"
            maxLength={80}
          />
          {text && (
            <button type="button" className="an-search-x" onClick={() => setText('')} aria-label="Limpar busca">
              <X size={16} />
            </button>
          )}
        </label>
        <div className="an-chips" role="group" aria-label="Filtrar fichas">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              className={`an-chip${filter === f.key ? ' is-on' : ''}`}
              aria-pressed={filter === f.key}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {!contentAccess && (
        <p className="an-note">
          <Lock size={14} aria-hidden />
          <span>Você vê quem preencheu e a validade. As respostas ficam com o dono, o gerente e quem atende o cliente.</span>
        </p>
      )}

      {loading && (
        <div className="an-rows" aria-busy="true">
          {[0, 1, 2].map((i) => <div key={i} className="an-skel" style={{ height: 68, borderRadius: 0 }} />)}
        </div>
      )}

      {!loading && error && (
        <div className="an-state" role="alert">
          <p className="an-state-t">{error}</p>
          <button type="button" className="an-btn-ghost" onClick={reload}>Tentar de novo</button>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="an-state">
          <ClipboardList size={26} color="#8a8a93" aria-hidden />
          {searching ? (
            <>
              <p className="an-state-t">Nenhuma ficha encontrada.</p>
              <p className="an-state-s">Confira o nome ou troque o filtro.</p>
            </>
          ) : (
            <>
              <p className="an-state-t">Nenhuma ficha preenchida ainda.</p>
              <p className="an-state-s">As fichas que seus clientes preencherem aparecem aqui.</p>
            </>
          )}
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <>
          <div className="an-rows">
            <div className="an-thead" aria-hidden>
              <span>Cliente</span><span>Ficha</span><span>Situação</span><span>Preenchida</span><span />
            </div>
            {items.map((it) => (
              <Row key={it.id} item={it} clickable={contentAccess} onOpen={() => setOpen(it)} />
            ))}
          </div>
          {hasMore && (
            <div className="an-more">
              {moreError && <p className="an-state-s" role="alert">{moreError}</p>}
              <button type="button" className="an-btn-ghost" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? 'Carregando…' : 'Carregar mais'}
              </button>
            </div>
          )}
        </>
      )}

      <p className="an-foot">
        <Lock size={13} aria-hidden />
        <span>Cada abertura de ficha fica registrada. Respostas de saúde não aparecem em relatórios.</span>
      </p>

      {open && (
        <RecordSheet
          recordId={open.id}
          clientName={open.client.name}
          canErase={canErase}
          onClose={() => setOpen(null)}
          onErased={removeItem}
        />
      )}
    </section>
  )
}

function Row({ item, clickable, onOpen }: { item: RecordListItem; clickable: boolean; onOpen: () => void }) {
  const expired = item.status === 'EXPIRED'
  const body = (
    <>
      <span className="an-c-name">{item.client.name}</span>
      <span className="an-c-tpl">{item.templateName}</span>
      <span className="an-c-st">
        <span className={`an-pill ${expired ? 'is-warn' : 'is-ok'}`}>{expired ? 'Vencida' : 'Válida'}</span>
        {item.hasAlert && (
          <span className="an-pill is-bad"><AlertTriangle size={12} aria-hidden />Alerta</span>
        )}
      </span>
      <span className="an-c-date">
        <span className="an-c-d1">{fmtDate(item.completedAt)}</span>
        <span className="an-c-d2">{expired ? 'venceu' : 'válida até'} {fmtDate(item.expiresAt)}</span>
      </span>
      <span className="an-c-go">{clickable ? <ChevronRight size={18} aria-hidden /> : null}</span>
    </>
  )
  if (!clickable) return <div className="an-row">{body}</div>
  return (
    <button type="button" className="an-row is-btn" onClick={onOpen} aria-label={`Abrir ficha de ${item.client.name}`}>
      {body}
    </button>
  )
}
