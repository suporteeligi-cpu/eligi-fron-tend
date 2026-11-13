'use client'
// src/app/dashboard/clientes/page.tsx
// @eligi:clients-page-v2 — direcao B "Ficha" (nov/2026).
//
// Celular: lista; tocar abre /dashboard/clientes/[id].
// Computador (>= 1024px): lista a esquerda e a ficha a direita, na mesma tela.
// A decisao "abre aqui ou navega" acontece no CLIQUE (matchMedia), nunca no
// render: o layout e todo por @media.

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Upload, Search, X, ListChecks } from 'lucide-react'

import api from '@/shared/lib/apiClient'
import { useIsMobile } from '@/hooks/useIsMobile'
import { appReceivesFiles, sendFileToApp } from '@/shared/utils/appFiles'
import type { ClientListItem, ClientListResponse, ClientsTab, LapsedGroup } from '@/features/clients/types'
import { CLIENTS_CSS } from '@/features/clients/styles'
import { LAPSED_CSS } from '@/features/clients/lapsedStyles' // @eligi:lapsed-page-import

import ClientsList        from './components/ClientsList'
import ImportClientsModal from './components/ImportClientsModal'
import ClientProfileView  from './[id]/components/ClientProfileView'
import LapsedChips, { type LapsedFilter } from './components/LapsedChips'
import LapsedWhatsSheet from './components/LapsedWhatsSheet'

const PAGE_SIZE = 30
const SPLIT_QUERY = '(min-width: 1024px)'

const TABS: { id: ClientsTab; label: string }[] = [
  { id: 'az',     label: 'A–Z' },
  { id: 'spent',  label: 'Mais gasto' },
  { id: 'recent', label: 'Recentes' },
  { id: 'lapsed', label: 'Sumidos' },
]

function paramsOf(tab: ClientsTab): { orderBy: string; order: 'asc' | 'desc'; segment?: 'lapsed' } {
  if (tab === 'spent')  return { orderBy: 'spent', order: 'desc' }
  if (tab === 'recent') return { orderBy: 'lastVisit', order: 'desc' }
  // Sumidos: quem mais gastou primeiro — e quem vale a ligacao.
  if (tab === 'lapsed') return { orderBy: 'spent', order: 'desc', segment: 'lapsed' }
  return { orderBy: 'name', order: 'asc' }
}

const EMPTY_TEXT: Record<ClientsTab, string> = {
  az:     'Comece adicionando seu primeiro cliente.',
  spent:  'Quando os clientes pagarem no caixa, o gasto aparece aqui.',
  recent: 'As visitas concluídas aparecem aqui.',
  lapsed: 'Ninguém sumido: todos voltaram dentro do ritmo de cada um.',
}

async function fetchPage(q: string, tab: ClientsTab, page: number, pro: LapsedFilter, signal?: AbortSignal): Promise<ClientListResponse> {
  const res = await api.get('/clients', {
    // @eligi:lapsed-page-fetch — filtro por profissional so na aba Sumidos
    params: { search: q || undefined, page, limit: PAGE_SIZE, ...paramsOf(tab), professionalId: tab === 'lapsed' && pro ? pro : undefined },
    signal,
  })
  return (res.data?.data ?? res.data) as ClientListResponse
}

export default function ClientesPage() {
  const router = useRouter()
  const narrow = useIsMobile(1024)

  const [clients,   setClients]   = useState<ClientListItem[]>([])
  const [total,     setTotal]     = useState(0)
  const [totalAll,  setTotalAll]  = useState<number | null>(null)
  const [page,      setPage]      = useState(1)
  const [pages,     setPages]     = useState(1)
  const [search,    setSearch]    = useState('')
  const [tab,       setTab]       = useState<ClientsTab>('az')
  const [loading,   setLoading]   = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [failed,    setFailed]    = useState(false)
  const [activeId,  setActiveId]  = useState<string | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [selecting, setSelecting] = useState(false)
  const [selected,  setSelected]  = useState<Set<string>>(() => new Set<string>())
  const [reloadKey, setReloadKey] = useState(0)
  const [proFilter, setProFilter] = useState<LapsedFilter>(null)
  const [groups,    setGroups]    = useState<LapsedGroup[] | null>(null)
  const [risk,      setRisk]      = useState(0)
  const [whats,     setWhats]     = useState<ClientListItem | null>(null)

  // Busca da 1a pagina: debounce de 350ms na digitacao; troca de aba e
  // recarga chegam pelo mesmo caminho. setState so depois do await.
  useEffect(() => {
    const ctrl = new AbortController()
    const t = setTimeout(() => {
      setLoading(true)
      fetchPage(search, tab, 1, proFilter, ctrl.signal)
        .then(data => {
          if (ctrl.signal.aborted) return
          setClients(data.clients ?? [])
          setGroups(data.lapsedGroups ?? null)
          setRisk(data.lapsedRisk ?? 0)
          setTotal(data.total ?? 0)
          setTotalAll(data.stats?.totalClients ?? data.total ?? 0)
          setPage(1)
          setPages(data.pages ?? 1)
          setFailed(false)
        })
        .catch(() => { if (!ctrl.signal.aborted) { setClients([]); setFailed(true) } })
        .finally(() => { if (!ctrl.signal.aborted) setLoading(false) })
    }, search ? 350 : 0)
    return () => { clearTimeout(t); ctrl.abort() }
  }, [search, tab, reloadKey, proFilter])

  // "Carregar mais" le a busca e a aba atuais pelo ref, sem refazer o efeito.
  const queryRef = useRef({ search, tab, proFilter })
  useEffect(() => { queryRef.current = { search, tab, proFilter } }, [search, tab, proFilter])

  const loadMore = useCallback(() => {
    const next = page + 1
    setLoadingMore(true)
    fetchPage(queryRef.current.search, queryRef.current.tab, next, queryRef.current.proFilter)
      .then(data => {
        setClients(prev => {
          const seen = new Set(prev.map(c => c.id))
          return [...prev, ...(data.clients ?? []).filter(c => !seen.has(c.id))]
        })
        setPage(next)
        setPages(data.pages ?? next)
      })
      .catch(() => { /* o botao continua la para tentar de novo */ })
      .finally(() => setLoadingMore(false))
  }, [page])

  const changeTab = (t: ClientsTab) => {
    if (t === tab) return
    setTab(t)
    setProFilter(null)
    setGroups(null)
    setSelected(new Set<string>())
  }

  const openClient = useCallback((id: string) => {
    if (typeof window !== 'undefined' && window.matchMedia(SPLIT_QUERY).matches) {
      setActiveId(id)
      return
    }
    router.push(`/dashboard/clientes/${id}`)
  }, [router])

  // Abre o primeiro da lista na ficha quando nada foi escolhido (so computador).
  const shownId = activeId ?? (!narrow && clients.length > 0 ? clients[0].id : null)

  const selectionActive = selecting || selected.size > 0

  const toggleSelect = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const closeSelection = () => { setSelecting(false); setSelected(new Set<string>()) }
  const allSelected = clients.length > 0 && selected.size === clients.length
  const toggleAll = () => setSelected(allSelected ? new Set<string>() : new Set(clients.map(c => c.id)))

  const exportCsv = () => {
    const rows = clients.filter(c => selected.has(c.id))
    if (rows.length === 0) return
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`
    const csv = '﻿' + ['Nome,Telefone', ...rows.map(c => `${esc(c.name)},${esc(c.phone ?? '')}`)].join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const nome = `clientes-${new Date().toISOString().slice(0, 10)}.csv`
    // @eligi:app-files-clientes — no app vai para o menu de salvar/compartilhar.
    if (appReceivesFiles()) {
      void sendFileToApp(blob, nome, 'share')
      return
    }
    const url = URL.createObjectURL(blob)
    const a   = document.createElement('a')
    a.href     = url
    a.download = nome
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  // Ficha mudou nome ou foi apagada: a linha da lista acompanha.
  const onProfileChanged = useCallback((id: string, patch: Partial<ClientListItem>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c))
  }, [])
  const onProfileDeleted = useCallback((id: string) => {
    setClients(prev => prev.filter(c => c.id !== id))
    setTotal(t => Math.max(0, t - 1))
    setTotalAll(t => (t === null ? t : Math.max(0, t - 1)))
    setActiveId(null)
  }, [])

  return (
    <div className="cl-page">
      <style>{CLIENTS_CSS + LAPSED_CSS}</style>

      {showImport && (
        <ImportClientsModal
          isMobile={narrow}
          onClose={() => setShowImport(false)}
          onDone={() => setReloadKey(k => k + 1)}
        />
      )}

      <div className="cl-split">
        <section className="cl-list" aria-label="Lista de clientes">
          <div className="cl-head">
            <h1 className="cl-h1 cl-d">
              Clientes
              {totalAll !== null && <span className="cl-count cl-n">{totalAll.toLocaleString('pt-BR')}</span>}
            </h1>
            <div className="cl-head-actions">
              {clients.length > 0 && !selectionActive && (
                <button type="button" className="cl-icon-btn" onClick={() => setSelecting(true)} aria-label="Selecionar clientes para exportar" title="Selecionar para exportar">
                  <ListChecks size={17} strokeWidth={1.8} />
                </button>
              )}
              <button type="button" className="cl-icon-btn" onClick={() => setShowImport(true)} aria-label="Importar clientes" title="Importar clientes">
                <Upload size={17} strokeWidth={1.8} />
              </button>
              <button type="button" className="cl-btn-new" onClick={() => router.push('/dashboard/clientes/novo')}>
                <Plus size={17} strokeWidth={2.4} />
                <span>Novo</span>
              </button>
            </div>
          </div>

          <div className="cl-tools">
            <label className="cl-search">
              <Search size={17} strokeWidth={1.8} aria-hidden="true" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nome ou telefone"
                aria-label="Buscar cliente"
                inputMode="search"
                enterKeyHint="search"
              />
              {search && (
                <button type="button" className="cl-clear" onClick={() => setSearch('')} aria-label="Limpar busca">
                  <X size={16} />
                </button>
              )}
            </label>

            <div className="cl-tabs" role="tablist" aria-label="Ordenar clientes">
              {TABS.map(t => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  className={`cl-tab${tab === t.id ? ' is-on' : ''}`}
                  onClick={() => changeTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {tab === 'lapsed' && groups && groups.length > 0 && (
            <LapsedChips groups={groups} risk={risk} value={proFilter} onChange={setProFilter} />
          )}

          {loading ? (
            <div className="cl-rows" aria-busy="true" aria-label="Carregando clientes">
              {[0, 1, 2, 3, 4, 5].map(i => (
                <div key={i} className="cl-skel"><i style={{ width: `${46 + (i % 3) * 12}%` }} /><i style={{ width: '28%' }} /></div>
              ))}
            </div>
          ) : failed ? (
            <div className="cl-state" role="alert">
              <div className="cl-state-title">Não foi possível carregar os clientes</div>
              <div className="cl-state-text">Verifique a conexão e tente de novo.</div>
              <button type="button" className="cl-btn-out" onClick={() => setReloadKey(k => k + 1)}>Tentar de novo</button>
            </div>
          ) : clients.length === 0 ? (
            <div className="cl-state">
              <div className="cl-state-title">{search ? 'Nenhum cliente encontrado' : tab === 'lapsed' ? 'Nenhum cliente sumido' : 'Nenhum cliente ainda'}</div>
              <div className="cl-state-text">{search ? `Sem resultados para "${search}".` : EMPTY_TEXT[tab]}</div>
            </div>
          ) : (
            <>
              <ClientsList
                clients={clients}
                tab={tab}
                activeId={narrow ? null : shownId}
                selectedIds={selected}
                selectionActive={selectionActive}
                onOpen={openClient}
                onToggle={toggleSelect}
                onWhats={setWhats}
              />
              {page < pages && (
                <div className="cl-more">
                  <button type="button" className="cl-btn-out" onClick={loadMore} disabled={loadingMore}>
                    {loadingMore ? 'Carregando…' : `Carregar mais (${clients.length} de ${total})`}
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        <section className="cl-detail" aria-label="Ficha do cliente">
          <div className="cl-detail-in">
            {!narrow && shownId ? (
              <ClientProfileView
                key={shownId}
                id={shownId}
                embedded
                onChanged={onProfileChanged}
                onDeleted={onProfileDeleted}
              />
            ) : (
              !loading && (
                <div className="cl-state" style={{ paddingTop: 120 }}>
                  <div className="cl-state-title">Escolha um cliente</div>
                  <div className="cl-state-text">A ficha aparece aqui, com o gasto, o histórico e os dados.</div>
                </div>
              )
            )}
          </div>
        </section>
      </div>

      {whats && <LapsedWhatsSheet client={whats} onClose={() => setWhats(null)} />}

      {selectionActive && (
        <div className="cl-selbar-wrap">
          <div className="cl-selbar" role="region" aria-label="Clientes selecionados">
            <span className="cl-n" style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}>
              {selected.size} selecionado{selected.size !== 1 ? 's' : ''}
            </span>
            <span style={{ flex: 1 }} />
            <button type="button" className="is-soft" onClick={toggleAll}>{allSelected ? 'Limpar' : 'Todos'}</button>
            <button type="button" className="is-solid" onClick={exportCsv} disabled={selected.size === 0}>Exportar CSV</button>
            <button type="button" className="is-soft" onClick={closeSelection} aria-label="Sair da seleção" style={{ width: 40, padding: 0 }}>
              <X size={17} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
