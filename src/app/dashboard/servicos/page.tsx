'use client'
// src/app/dashboard/servicos/page.tsx
// @eligi:servicos-chips
// Serviços — casca com filtro por CHIPS de categoria.
//
// Antes: accordion por categoria, e a page escolhia entre ServicesListMobile e
// ServicesListDesktop por device mode (49 usos de `isMobile` no modulo). Agora
// e uma lista so, e o layout responde a @media.
//
// O accordion virou chip de filtro: um toque troca a lista inteira, sem abrir e
// fechar secao para caçar um servico.
//
// Os chips seguem a ORDEM DAS CATEGORIAS definida no gerenciador — que so
// passou a valer depois da fatia 1 do back (o `orderBy` usava o campo legado
// `category`, texto livre, e ignorava o arrasto).

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, Search, X, Tag, Scissors } from 'lucide-react'

import api from '@/shared/lib/apiClient'
import { colors, typography } from '@/shared/theme'
import { Service, ServiceCategory } from '@/features/services/types'

import ServicesList    from './components/ServicesList'
import ServiceModal    from './components/ServiceModal'
import DeleteModal     from './components/DeleteModal'
import CategoryManager from './components/CategoryManager'
import Toast           from './components/Toast'

const TAP = 44

/** Chave do filtro: 'all' ou o id da categoria; 'none' = sem categoria. */
type Filter = string

export default function ServicosPage() {
  const [services,   setServices]   = useState<Service[]>([])
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [filter,     setFilter]     = useState<Filter>('all')
  const [showCats,   setShowCats]   = useState(false)

  const [modal,    setModal]    = useState<'create' | Service | null>(null)
  const [deleting, setDeleting] = useState<Service | null>(null)
  const [removing, setRemoving] = useState(false)
  const [toast,    setToast]    = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    window.setTimeout(() => setToast(null), 2800)
  }, [])

  const fetchAll = useCallback(async (signal?: AbortSignal) => {
    try {
      const [svcRes, catRes] = await Promise.all([
        api.get('/services',            { signal }),
        api.get('/services/categories', { signal }),
      ])
      if (signal?.aborted) return
      const svcData = svcRes.data?.data ?? svcRes.data
      const catData = catRes.data?.data ?? catRes.data
      setServices(Array.isArray(svcData) ? svcData : [])
      setCategories(Array.isArray(catData) ? catData : [])
    } catch {
      if (!signal?.aborted) showToast('Erro ao carregar serviços', 'error')
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    const ctrl = new AbortController()
    fetchAll(ctrl.signal)
    return () => ctrl.abort()
  }, [fetchAll])

  async function handleConfirmDelete() {
    if (!deleting) return
    try {
      setRemoving(true)
      await api.delete(`/services/${deleting.id}`)
      setServices(prev => prev.filter(s => s.id !== deleting.id))
      showToast(`"${deleting.name}" excluído`, 'success')
      setDeleting(null)
    } catch {
      showToast('Erro ao excluir serviço', 'error')
    } finally {
      setRemoving(false)
    }
  }

  function handleSaved(saved: Service, isNew: boolean) {
    setServices(prev => {
      const idx = prev.findIndex(s => s.id === saved.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next }
      return [...prev, saved]
    })
    showToast(isNew ? 'Serviço criado!' : 'Serviço atualizado!', 'success')
  }

  /** Ajuste rapido da lista: atualiza sem toast, para nao piscar a cada toque. */
  function handleQuickUpdate(saved: Service) {
    setServices(prev => prev.map(s => (s.id === saved.id ? { ...s, ...saved } : s)))
  }

  const catIdOf = (s: Service) => s.serviceCategory?.id ?? 'none'

  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of services) {
      const k = catIdOf(s)
      map.set(k, (map.get(k) ?? 0) + 1)
    }
    return map
  }, [services])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return services.filter(s => {
      if (filter !== 'all' && catIdOf(s) !== filter) return false
      if (!q) return true
      return s.name.toLowerCase().includes(q)
          || (s.serviceCategory?.name ?? s.category ?? '').toLowerCase().includes(q)
    })
  }, [services, search, filter])

  const noProfCount = services.filter(s => s._count?.professionals === 0).length
  const uncategorized = counts.get('none') ?? 0

  const subtitle = loading
    ? 'Carregando…'
    : `${services.length} ${services.length === 1 ? 'serviço' : 'serviços'}`
      + (noProfCount > 0
          ? ` · ${noProfCount} sem profissional`
          : ` · ${categories.length} ${categories.length === 1 ? 'categoria' : 'categorias'}`)

  const editingService = modal && modal !== 'create' ? modal : null

  return (
    <>
      <style>{`
        @keyframes fadeUp{ from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin{ to{ transform:rotate(360deg) } }

        .svc-page{ max-width:820px; padding:0; }
        @media (max-width: 899px){ .svc-page{ padding:0 12px; } }

        .svc-chips{ display:flex; gap:7px; overflow-x:auto; padding:2px 0 12px;
                    scrollbar-width:none; -ms-overflow-style:none; }
        .svc-chips::-webkit-scrollbar{ display:none; }
        @media (max-width: 899px){
          /* Sangra ate a borda: os chips sao roláveis e devem ir ate o fim da tela. */
          .svc-chips{ margin-left:-12px; margin-right:-12px; padding-left:12px; padding-right:12px; }
        }
        @media (prefers-reduced-motion: reduce){ .svc-page{ animation:none !important } }
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} />}

      {(modal === 'create' || editingService) && (
        <ServiceModal
          service={editingService}
          categories={categories}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}

      {deleting && (
        <DeleteModal
          service={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleting(null)}
          deleting={removing}
          isMobile={false}
        />
      )}

      <div
        className="svc-page"
        style={{ animation: 'fadeUp 0.3s ease', fontFamily: typography.fontFamily }}
      >
        {/* cabecalho */}
        <div style={{
          display:        'flex',
          alignItems:     'flex-start',
          justifyContent: 'space-between',
          gap:            12,
          marginBottom:   14,
        }}>
          <div style={{ minWidth: 0 }}>
            <h1 style={{
              margin:        0,
              fontFamily:    "'Space Grotesk', " + typography.fontFamily,
              fontSize:      'clamp(24px, 6vw, 30px)',
              fontWeight:    700,
              letterSpacing: '-0.025em',
              lineHeight:    1.1,
              color:         colors.gray[900],
            }}>
              Serviços
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: colors.gray.dimText }}>
              {subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setModal('create')}
            style={{
              flexShrink:              0,
              minHeight:               TAP,
              display:                 'inline-flex',
              alignItems:              'center',
              gap:                     6,
              padding:                 '0 18px',
              borderRadius:            999,
              border:                  'none',
              background:              colors.red.gradient,
              color:                   '#fff',
              fontSize:                13.5,
              fontWeight:              700,
              fontFamily:              'inherit',
              cursor:                  'pointer',
              boxShadow:               `0 4px 14px ${colors.red.glow}`,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Plus size={16} strokeWidth={2.6} />
            Novo
          </button>
        </div>

        {/* busca */}
        <div style={{
          display:      'flex',
          alignItems:   'center',
          gap:          9,
          minHeight:    46,
          padding:      '0 15px',
          borderRadius: 999,
          background:   'rgba(255,255,255,0.8)',
          border:       '1px solid rgba(17,17,20,0.07)',
          marginBottom: 10,
        }}>
          <Search size={16} color={colors.gray.dimText} strokeWidth={2} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Pesquisar serviços…"
            inputMode="search"
            style={{
              flex:       1,
              minWidth:   0,
              border:     'none',
              outline:    'none',
              background: 'transparent',
              // 16px evita o zoom automatico do iOS ao focar o campo
              fontSize:   16,
              color:      colors.gray[900],
              fontFamily: 'inherit',
            }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Limpar busca"
              style={{
                width: 32, height: 32, flexShrink: 0,
                display: 'grid', placeItems: 'center',
                border: 'none', borderRadius: 10,
                background: 'rgba(17,17,20,0.05)',
                color: colors.gray.dimText, cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <X size={15} strokeWidth={2.4} />
            </button>
          )}
        </div>

        {/* chips de categoria */}
        <div className="svc-chips">
          <Chip
            label="Todos"
            count={services.length}
            active={filter === 'all'}
            onClick={() => setFilter('all')}
          />
          {categories.map(c => (
            <Chip
              key={c.id}
              label={c.name}
              count={counts.get(c.id) ?? 0}
              color={c.color}
              active={filter === c.id}
              onClick={() => setFilter(c.id)}
            />
          ))}
          {uncategorized > 0 && (
            <Chip
              label="Sem categoria"
              count={uncategorized}
              active={filter === 'none'}
              onClick={() => setFilter('none')}
            />
          )}

          <button
            type="button"
            onClick={() => setShowCats(v => !v)}
            style={{
              flexShrink:              0,
              minHeight:               40,
              display:                 'inline-flex',
              alignItems:              'center',
              gap:                     6,
              padding:                 '0 14px',
              borderRadius:            999,
              border:                  `1px solid ${showCats ? colors.red.DEFAULT : 'rgba(17,17,20,0.09)'}`,
              background:              showCats ? 'rgba(220,38,38,0.07)' : 'rgba(255,255,255,0.8)',
              color:                   showCats ? colors.red.DEFAULT : colors.gray.dimText,
              fontSize:                13,
              fontWeight:              700,
              fontFamily:              'inherit',
              cursor:                  'pointer',
              whiteSpace:              'nowrap',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Tag size={14} strokeWidth={2.2} />
            Categorias
          </button>
        </div>

        {/* gerenciador de categorias */}
        {showCats && (
          <div style={{
            marginBottom:   14,
            padding:        '14px 16px',
            background:     'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(16px)',
            borderRadius:   20,
            border:         '1px solid rgba(17,17,20,0.07)',
            boxShadow:      '0 4px 20px rgba(17,17,20,0.05)',
          }}>
            <div style={{
              fontSize:      11,
              fontWeight:    700,
              letterSpacing: '.12em',
              textTransform: 'uppercase',
              color:         colors.gray.dimText,
              marginBottom:  10,
            }}>
              Categorias de serviço
            </div>
            <CategoryManager categories={categories} onChange={setCategories} />
          </div>
        )}

        {/* lista */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              border: `3px solid ${colors.red.subtle}`,
              borderTopColor: colors.red.DEFAULT,
              animation: 'spin 0.8s linear infinite',
            }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign:      'center',
            padding:        '44px 24px',
            background:     'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(16px)',
            borderRadius:   20,
            border:         '1px solid rgba(17,17,20,0.07)',
          }}>
            <Scissors size={30} color={colors.gray.dimText} style={{ opacity: 0.22, marginBottom: 12 }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: colors.gray[900], marginBottom: 6 }}>
              {search || filter !== 'all' ? 'Nenhum serviço aqui' : 'Nenhum serviço cadastrado'}
            </div>
            <div style={{ fontSize: 13, color: colors.gray.dimText, marginBottom: 18 }}>
              {search
                ? 'Tente outro termo de busca.'
                : filter !== 'all'
                  ? 'Essa categoria ainda está vazia.'
                  : 'Crie seu primeiro serviço para começar.'}
            </div>
            {!search && filter === 'all' && (
              <button
                type="button"
                onClick={() => setModal('create')}
                style={{
                  minHeight: TAP, padding: '0 20px', borderRadius: 999, border: 'none',
                  background: colors.red.gradient, color: '#fff',
                  fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Criar serviço
              </button>
            )}
          </div>
        ) : (
          <ServicesList
            services={filtered}
            onEdit={s => setModal(s)}
            onDelete={s => setDeleting(s)}
            onUpdated={handleQuickUpdate}
            onError={msg => showToast(msg, 'error')}
          />
        )}
      </div>
    </>
  )
}

function Chip({
  label, count, active, color, onClick,
}: {
  label:   string
  count:   number
  active:  boolean
  color?:  string | null
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        flexShrink:              0,
        minHeight:               40,
        display:                 'inline-flex',
        alignItems:              'center',
        gap:                     7,
        padding:                 '0 14px',
        borderRadius:            999,
        border:                  `1px solid ${active ? '#111114' : 'rgba(17,17,20,0.09)'}`,
        background:              active ? '#111114' : 'rgba(255,255,255,0.8)',
        color:                   active ? '#fff' : '#4b4b52',
        fontSize:                13,
        fontWeight:              600,
        fontFamily:              'inherit',
        cursor:                  'pointer',
        whiteSpace:              'nowrap',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {color && (
        <span
          aria-hidden
          style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }}
        />
      )}
      {label}
      <span style={{
        fontFamily:         "'Space Grotesk', sans-serif",
        fontSize:           12,
        fontWeight:         700,
        opacity:            active ? 0.75 : 0.55,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {count}
      </span>
    </button>
  )
}
