'use client'
// src/app/dashboard/equipe/page.tsx
// @eligi:equipe-two-tabs
// @eligi:equipe-revoke-local
// Equipe — casca com DUAS abas: Profissionais e Acessos.
//
// Antes eram quatro (FUNCIONÁRIOS / HORÁRIOS / COMISSÕES / ACESSOS), e elas
// mentiam sobre o escopo: "Funcionários" era uma lista, mas "Horários" e
// "Comissões" mostravam UMA pessoa, com um "Voltar" escondido dentro do card.
// Eram dois niveis de navegacao disputando a mesma tela — e em 380px a quarta
// aba encostava na borda.
//
// Agora: horarios e comissoes sao abas INTERNAS do detalhe da pessoa
// (ProfessionalDetail). "Acessos" continua no topo porque e legitimamente uma
// lista global — convites, papeis, revogacao — e nao cabe dentro de uma ficha.
//
// Mestre-detalhe por LARGURA, nao por device mode: lista e detalhe sao sempre
// renderizados e o @media decide se aparecem lado a lado (>=900px) ou um de
// cada vez. useDeviceMode classifica tipo de ponteiro, e era o que cortava a
// tela em janela estreita de desktop.

import { useState, useEffect, useCallback } from 'react'
import { Plus, UserCog } from 'lucide-react'

import api from '@/shared/lib/apiClient'
import { colors, typography } from '@/shared/theme'
import { Professional, ServiceItem } from '@/features/professionals/types'

import AddProfessionalModal from './components/AddProfessionalModal'
import AcessosTab           from './components/AcessosTab'
import TeamList             from './components/TeamList'
import ProfessionalDetail   from './components/ProfessionalDetail'

type TabId = 'profissionais' | 'acessos'

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'profissionais', label: 'Profissionais' },
  { id: 'acessos',       label: 'Acessos' },
]

const TAP = 44

export default function EquipePage() {
  const [tab,           setTab]           = useState<TabId>('profissionais')
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [allServices,   setAllServices]   = useState<ServiceItem[]>([])
  const [loading,       setLoading]       = useState(true)
  const [selected,      setSelected]      = useState<Professional | null>(null)
  const [query,         setQuery]         = useState('')
  const [showAdd,       setShowAdd]       = useState(false)

  /**
   * So governa a tela estreita: acima de 900px lista e detalhe convivem e este
   * estado e ignorado pelo CSS.
   */
  const [detailOpen, setDetailOpen] = useState(false)

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    try {
      const [profRes, svcRes] = await Promise.all([
        api.get('/equipe',   { signal }),
        api.get('/services', { signal }),
      ])
      if (signal?.aborted) return

      const profsData = profRes.data?.data ?? profRes.data
      const svcsData  = svcRes.data?.data  ?? svcRes.data

      const profsList: Professional[] = Array.isArray(profsData) ? profsData : profsData.professionals ?? []
      const svcsList:  ServiceItem[]  = Array.isArray(svcsData)  ? svcsData  : svcsData.services      ?? []

      setProfessionals(profsList)
      setAllServices(svcsList)

      // Pre-seleciona sempre: na tela larga o detalhe ja nasce preenchido, e na
      // estreita o detailOpen mantem a lista na frente.
      if (profsList.length > 0) {
        setSelected(prev => prev ?? profsList[0])
      }
    } catch {
      if (!signal?.aborted) {
        setProfessionals([])
        setAllServices([])
      }
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const ctrl = new AbortController()
    fetchData(ctrl.signal)
    return () => ctrl.abort()
  }, [fetchData])

  function handleUpdated(updated: Professional) {
    setProfessionals(prev => prev.map(p => (p.id === updated.id ? updated : p)))
    setSelected(prev => (prev?.id === updated.id ? updated : prev))
  }

  function handleDeleted(id: string) {
    setProfessionals(prev => {
      const next = prev.filter(p => p.id !== id)
      setSelected(curr => (curr?.id !== id ? curr : next[0] ?? null))
      return next
    })
    setDetailOpen(false)
  }

  function handleCreated(prof: Professional) {
    setProfessionals(prev => [...prev, prof])
    setSelected(prof)
    setShowAdd(false)
    setDetailOpen(true)
  }

  /**
   * Revogar acesso limpa o vinculo com a conta, mas o profissional continua
   * cadastrado. Antes o AcessosTab dava window.location.reload() so para
   * atualizar esse campo — recarregava a aplicacao inteira.
   */
  function handleRevoked(profId: string) {
    setProfessionals(prev => prev.map(p =>
      p.id === profId ? { ...p, userId: null, user: null } : p,
    ))
    setSelected(prev => (prev?.id === profId ? { ...prev, userId: null, user: null } : prev))
  }

  async function handleDelete(id: string) {
    await api.delete(`/equipe/${id}`)
  }

  function handleSelect(p: Professional) {
    setSelected(p)
    setDetailOpen(true)
  }

  const activeCount = professionals.filter(p => p.active).length
  const withAccess  = professionals.filter(p => p.userId).length

  const filtered = professionals.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    (p.role ?? '').toLowerCase().includes(query.toLowerCase()),
  )

  const subtitle = loading
    ? 'Carregando…'
    : `${activeCount} ${activeCount === 1 ? 'profissional ativo' : 'profissionais ativos'}`
      + ` · ${withAccess} com acesso`

  return (
    <>
      <style>{`
        @keyframes eq-fade-up{ from{opacity:0; transform:translateY(8px)} to{opacity:1; transform:translateY(0)} }
        @keyframes eq-spin{ to{transform:rotate(360deg)} }

        .eq-page{ max-width:1180px; padding:0; }
        .eq-split{ display:grid; grid-template-columns:minmax(0,1fr); gap:14px; align-items:start; }

        /* Largura suficiente: lista e detalhe lado a lado, sem "Voltar". */
        @media (min-width: 900px){
          .eq-split{ grid-template-columns:minmax(0,340px) minmax(0,1fr); }
        }

        /* Tela estreita: um de cada vez, escolhido pelo estado detailOpen. */
        @media (max-width: 899px){
          .eq-page{ padding:0 12px; }
          .eq-mode-detail .eq-list{ display:none; }
          .eq-mode-list   .eq-detail{ display:none; }
        }

        @media (prefers-reduced-motion: reduce){ .eq-page{ animation:none !important; } }
      `}</style>

      {showAdd && (
        <AddProfessionalModal
          isMobile={false}
          onCreated={handleCreated}
          onClose={() => setShowAdd(false)}
        />
      )}

      <div
        className="eq-page"
        style={{
          animation:  'eq-fade-up 380ms cubic-bezier(0.22, 1, 0.36, 1) both',
          fontFamily: typography.fontFamily,
        }}
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
              Equipe
            </h1>
            <p style={{
              margin:     '4px 0 0',
              fontSize:   13,
              color:      colors.gray.dimText,
              lineHeight: 1.4,
            }}>
              {subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAdd(true)}
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

        {/* duas abas — cabem folgado ate em 320px */}
        <div style={{
          display:      'flex',
          gap:          4,
          padding:      4,
          borderRadius: 999,
          background:   'rgba(17,17,20,0.05)',
          marginBottom: 14,
        }}>
          {TABS.map(t => {
            const active = tab === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-pressed={active}
                style={{
                  flex:                    1,
                  minHeight:               TAP - 8,
                  border:                  'none',
                  borderRadius:            999,
                  background:              active ? '#fff' : 'transparent',
                  boxShadow:               active ? '0 2px 8px rgba(17,17,20,0.10)' : 'none',
                  color:                   active ? colors.gray[900] : colors.gray.dimText,
                  fontSize:                13.5,
                  fontWeight:              700,
                  fontFamily:              'inherit',
                  cursor:                  'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {t.label}
              </button>
            )
          })}
        </div>

        {tab === 'acessos' ? (
          <AcessosTab
            professionals={professionals}
            loading={loading}
            onRevoked={handleRevoked}
          />
        ) : (
          <div className={`eq-split ${detailOpen ? 'eq-mode-detail' : 'eq-mode-list'}`}>
            <div className="eq-list" style={{ minWidth: 0 }}>
              <TeamList
                professionals={filtered}
                selected={selected}
                query={query}
                loading={loading}
                onQueryChange={setQuery}
                onSelect={handleSelect}
              />
            </div>

            <div className="eq-detail" style={{ minWidth: 0 }}>
              {selected ? (
                <ProfessionalDetail
                  key={selected.id}
                  prof={selected}
                  allServices={allServices}
                  onBack={() => setDetailOpen(false)}
                  onUpdated={handleUpdated}
                  onDeleted={handleDeleted}
                  onDelete={handleDelete}
                />
              ) : (
                <div style={{
                  display:        'flex',
                  flexDirection:  'column',
                  alignItems:     'center',
                  justifyContent: 'center',
                  gap:            10,
                  padding:        '56px 24px',
                  borderRadius:   24,
                  background:     'rgba(255,255,255,0.6)',
                  border:         '1px solid rgba(17,17,20,0.07)',
                  color:          colors.gray.dimText,
                }}>
                  <UserCog size={30} style={{ opacity: 0.2 }} />
                  <span style={{ fontSize: 13 }}>
                    {loading ? 'Carregando…' : 'Selecione um profissional'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
