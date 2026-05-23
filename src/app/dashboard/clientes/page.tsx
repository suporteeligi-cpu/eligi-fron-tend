'use client'
// src/app/dashboard/clientes/page.tsx

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'

import api from '@/shared/lib/apiClient'
import { colors, typography, radius, shadows, glass } from '@/shared/theme'
import { useDeviceMode } from '@/features/agenda/hooks/useDeviceMode'
import { ClientListItem } from '@/features/clients/types'

import ClientsHeader        from './components/ClientsHeader'
import ClientsStatsBar      from './components/ClientsStatsBar'
import ClientsSearchBar     from './components/ClientsSearchBar'
import ClientsTableDesktop  from './components/ClientsTableDesktop'
import ClientsListMobile    from './components/ClientsListMobile'

export default function ClientesPage() {
  const router = useRouter()
  const mode   = useDeviceMode()
  const isMobile = mode === 'mobile'

  const [clients,  setClients]  = useState<ClientListItem[]>([])
  const [total,    setTotal]    = useState(0)
  const [totalAll, setTotalAll] = useState(0)
  const [page,     setPage]     = useState(1)
  const [pages,    setPages]    = useState(1)
  const [search,   setSearch]   = useState('')
  const [sort,     setSort]     = useState('createdAt:desc')
  const [loading,  setLoading]  = useState(true)

  const fetchClients = useCallback(async (q: string, p: number, s: string, signal?: AbortSignal) => {
    try {
      setLoading(true)
      const [orderBy, order] = s.split(':')
      const res = await api.get('/clients', {
        params: { search: q || undefined, page: p, limit: 30, orderBy, order },
        signal,
      })
      if (signal?.aborted) return
      const data = res.data?.data ?? res.data
      setClients(data.clients ?? [])
      setTotal(data.total ?? 0)
      setTotalAll(data.stats?.totalClients ?? data.total ?? 0)
      setPage(data.page ?? 1)
      setPages(data.pages ?? 1)
    } catch {
      if (!signal?.aborted) setClients([])
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])

  // Debounce de search/sort
  useEffect(() => {
    const ctrl = new AbortController()
    const t = setTimeout(() => {
      setPage(1)
      fetchClients(search, 1, sort, ctrl.signal)
    }, 350)
    return () => {
      clearTimeout(t)
      ctrl.abort()
    }
  }, [search, sort, fetchClients])

  // Refs pra search/sort serem lidas dentro do useEffect de paginação
  // sem causar refetch quando elas mudam (debounce já cuida disso)
  const searchRef = useRef(search)
  const sortRef   = useRef(sort)
  useEffect(() => { searchRef.current = search }, [search])
  useEffect(() => { sortRef.current   = sort   }, [sort])

  // Refetch ao mudar página (sem debounce, lê search/sort dos refs)
  useEffect(() => {
    if (page === 1) return  // já carregou pelo debounce acima
    const ctrl = new AbortController()
    fetchClients(searchRef.current, page, sortRef.current, ctrl.signal)
    return () => ctrl.abort()
  }, [page, fetchClients])

  // Métricas agregadas da página atual
  const { revenuePage, completedPage, canceledPage } = useMemo(() => ({
    revenuePage:   clients.reduce((s, c) => s + c.totalRevenue, 0),
    completedPage: clients.reduce((s, c) => s + c.completed,    0),
    canceledPage:  clients.reduce((s, c) => s + c.canceled,     0),
  }), [clients])

  return (
    <>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .pg-btn{
          padding:7px 14px;
          border-radius:${radius.sm}px;
          border:1px solid ${colors.gray.borderMd};
          background:${colors.background.surface};
          font-size:${typography.scale.sm}px;
          font-weight:${typography.weight.semibold};
          cursor:pointer;
          color:${colors.gray[700]};
          transition:all 0.15s ease;
        }
        .pg-btn:hover:not(:disabled){
          border-color:${colors.red.borderHover};
          color:${colors.red.DEFAULT};
        }
        .pg-btn:disabled{ opacity:0.35; cursor:not-allowed }
      `}</style>

      <div style={{
        maxWidth: 900,
        padding: isMobile ? '0 12px' : 0,
        animation: 'fadeUp 0.3s ease',
        fontFamily: typography.fontFamily,
      }}>

        <ClientsHeader totalClients={totalAll} isMobile={isMobile} />

        <ClientsStatsBar
          totalClients={totalAll}
          completedPage={completedPage}
          canceledPage={canceledPage}
          revenuePage={revenuePage}
          isMobile={isMobile}
        />

        <ClientsSearchBar
          search={search}
          setSearch={setSearch}
          sort={sort}
          setSort={setSort}
          isMobile={isMobile}
        />

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              border: `3px solid ${colors.red.subtle}`,
              borderTopColor: colors.red.DEFAULT,
              animation: 'spin 0.8s linear infinite',
            }} />
          </div>
        ) : clients.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: isMobile ? '40px 24px' : '56px 32px',
            background: glass.surface.default.background,
            backdropFilter: glass.surface.default.backdropFilter,
            borderRadius: radius.xl,
            border: `1px solid ${colors.gray.border}`,
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
            <div style={{ fontSize: 16, fontWeight: typography.weight.semibold, color: typography.color.primary, marginBottom: 6 }}>
              {search ? 'Nenhum cliente encontrado' : 'Nenhum cliente ainda'}
            </div>
            <div style={{ fontSize: typography.scale.base, color: typography.color.muted, marginBottom: 20 }}>
              {search ? `Sem resultados para "${search}"` : 'Comece adicionando seu primeiro cliente.'}
            </div>
            {!search && (
              <button
                onClick={() => router.push('/dashboard/clientes/novo')}
                style={{
                  padding: '10px 20px',
                  borderRadius: radius.sm,
                  background: colors.red.gradient,
                  color: '#fff', border: 'none',
                  fontWeight: typography.weight.semibold,
                  cursor: 'pointer',
                  fontSize: typography.scale.base,
                  boxShadow: shadows.redSm,
                }}
              >
                + Novo cliente
              </button>
            )}
          </div>
        ) : (
          <>
            {isMobile
              ? <ClientsListMobile clients={clients} />
              : <ClientsTableDesktop clients={clients} />
            }

            {/* Paginação */}
            {pages > 1 && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginTop: 16,
                padding: isMobile ? '0' : '0 4px',
                gap: 8, flexWrap: 'wrap',
              }}>
                <span style={{
                  fontSize: typography.scale.sm,
                  color: typography.color.muted,
                }}>
                  {isMobile
                    ? `${(page - 1) * 30 + 1}–${Math.min(page * 30, total)} de ${total}`
                    : `Mostrando ${(page - 1) * 30 + 1}–${Math.min(page * 30, total)} de ${total}`
                  }
                </span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <button className="pg-btn" disabled={page <= 1}     onClick={() => setPage(p => p - 1)}>← Anterior</button>
                  <span style={{ padding: '7px 12px', fontSize: typography.scale.sm, color: typography.color.muted }}>
                    {page} / {pages}
                  </span>
                  <button className="pg-btn" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Próxima →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
