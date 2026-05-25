'use client'
// src/app/dashboard/equipe/page.tsx

import { useState, useEffect, useCallback } from 'react'
import { Search, X, Plus, UserCog, ChevronRight } from 'lucide-react'

import api from '@/shared/lib/apiClient'
import { colors, typography, transitions } from '@/shared/theme'
import { useDeviceMode } from '@/features/agenda/hooks/useDeviceMode'
import { Professional, ServiceItem } from '@/features/professionals/types'

import Avatar from './components/Avatar'
import AddProfessionalModal from './components/AddProfessionalModal'
import ProfessionalPanel from './components/ProfessionalPanel'

export default function EquipePage() {
  const mode = useDeviceMode()
  const isMobile = mode === 'mobile'

  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [allServices,   setAllServices]   = useState<ServiceItem[]>([])
  const [loading,       setLoading]       = useState(true)
  const [selected,      setSelected]      = useState<Professional | null>(null)
  const [showPanel,     setShowPanel]     = useState(false)
  const [showAdd,       setShowAdd]       = useState(false)
  const [q,             setQ]             = useState('')

  // ─── Fetch ──────────────────────────────────────────────────────────
  const fetchData = useCallback(async (signal?: AbortSignal) => {
    try {
      const [profRes, svcRes] = await Promise.all([
        api.get('/equipe',    { signal }),
        api.get('/services',  { signal }),
      ])
      if (signal?.aborted) return

      const profsData = profRes.data?.data ?? profRes.data
      const svcsData  = svcRes.data?.data  ?? svcRes.data

      const profsList: Professional[] = Array.isArray(profsData) ? profsData : profsData.professionals ?? []
      const svcsList:  ServiceItem[]  = Array.isArray(svcsData)  ? svcsData  : svcsData.services      ?? []

      setProfessionals(profsList)
      setAllServices(svcsList)

      // Auto-seleciona o primeiro só no desktop
      if (!isMobile && profsList.length > 0) {
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
  }, [isMobile])

  useEffect(() => {
    const ctrl = new AbortController()
    fetchData(ctrl.signal)
    return () => ctrl.abort()
  }, [fetchData])

  // ─── Handlers ───────────────────────────────────────────────────────
  function handleUpdated(updated: Professional) {
    setProfessionals(prev => prev.map(p => p.id === updated.id ? updated : p))
    setSelected(updated)
  }

  function handleDeleted(id: string) {
    setProfessionals(prev => {
      const next = prev.filter(p => p.id !== id)
      // Se o selecionado foi removido, pega o primeiro da nova lista
      setSelected(curr => {
        if (curr?.id !== id) return curr
        return next[0] ?? null
      })
      return next
    })
  }

  function handleCreated(prof: Professional) {
    setProfessionals(prev => [...prev, prof])
    setSelected(prof)
    setShowPanel(true)
  }

  function handleSelect(p: Professional) {
    setSelected(p)
    if (isMobile) setShowPanel(true)
  }

  // ─── Filtro ─────────────────────────────────────────────────────────
  const filtered = professionals.filter(p =>
    p.name.toLowerCase().includes(q.toLowerCase()) ||
    (p.role ?? '').toLowerCase().includes(q.toLowerCase())
  )
  const activeCount = professionals.filter(p => p.active).length

  return (
    <>
      <style>{`
        @keyframes eq-fade-up{ from{opacity:0; transform:translateY(12px)} to{opacity:1; transform:translateY(0)} }
        @keyframes eq-spin{ to{transform:rotate(360deg)} }
      `}</style>

      {showAdd && (
        <AddProfessionalModal
          isMobile={isMobile}
          onCreated={handleCreated}
          onClose={() => setShowAdd(false)}
        />
      )}

      <div style={{
        padding: isMobile ? '0 12px' : 0,
        animation: 'eq-fade-up 380ms cubic-bezier(0.22, 1, 0.36, 1) both',
        fontFamily: typography.fontFamily,
      }}>

        {/* ═══════════ HEADER ═══════════ */}
        <div style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          marginBottom: isMobile ? 14 : 20,
          gap: 12,
        }}>
          <div style={{ minWidth: 0 }}>
            <h2 style={{
              fontSize: isMobile ? 22 : typography.scale['2xl'],
              fontWeight: 700,
              letterSpacing: '-0.025em',
              color: typography.color.primary,
              margin: 0,
              lineHeight: 1.2,
            }}>
              Equipe
            </h2>
            {!isMobile && (
              <p style={{ fontSize: 14, color: typography.color.muted, margin: '4px 0 0' }}>
                {loading ? 'Carregando...' : `${activeCount} ativo${activeCount !== 1 ? 's' : ''}`}
              </p>
            )}
          </div>

          <button
            onClick={() => setShowAdd(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: isMobile ? '9px 14px' : '9px 18px',
              borderRadius: 12,
              border: 'none',
              background: colors.red.gradient,
              color: '#fff',
              fontSize: isMobile ? 13 : 13,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: `0 4px 14px ${colors.red.glow}`,
              letterSpacing: '.02em',
              flexShrink: 0,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Plus size={15} strokeWidth={2.5} />
            {isMobile ? 'Novo' : 'Adicionar'}
          </button>
        </div>

        {/* ═══════════ LAYOUT MOBILE: lista simples ═══════════ */}
        {isMobile ? (
          <>
            {/* Busca */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 12px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.85)',
              border: `1px solid ${colors.gray.borderMd}`,
              marginBottom: 12,
            }}>
              <Search size={14} color={colors.gray.dimText} strokeWidth={2} />
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Procurar profissional..."
                inputMode="search"
                style={{
                  flex: 1, border: 'none', outline: 'none',
                  fontSize: 14, background: 'transparent',
                  color: colors.gray[900],
                  fontFamily: typography.fontFamily,
                }}
              />
              {q && (
                <button
                  onClick={() => setQ('')}
                  aria-label="Limpar busca"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: 4, display: 'flex',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <X size={13} color={colors.gray.dimText} />
                </button>
              )}
            </div>

            {/* Lista */}
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  border: `3px solid ${colors.red.subtle}`,
                  borderTopColor: colors.red.DEFAULT,
                  animation: 'eq-spin 0.8s linear infinite',
                }} />
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState query={q} onCreate={() => setShowAdd(true)} />
            ) : (
              <div style={{
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(20px)',
                borderRadius: 16,
                border: `1px solid ${colors.gray.border}`,
                boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                overflow: 'hidden',
              }}>
                {filtered.map((p, idx) => (
                  <ProfRowMobile
                    key={p.id}
                    prof={p}
                    onClick={() => handleSelect(p)}
                    isLast={idx === filtered.length - 1}
                  />
                ))}
              </div>
            )}

            {/* Panel mobile (fullscreen overlay) */}
            {showPanel && selected && (
              <div style={{
                position: 'fixed',
                top: 'var(--navbar-h, 104px)',
                left: 0, right: 0,
                bottom: 'calc(var(--bottom-nav-h, 64px) + env(safe-area-inset-bottom))',
                background: '#fff',
                zIndex: 200,
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
              }}>
                <ProfessionalPanel
                  key={selected.id}
                  prof={selected}
                  allServices={allServices}
                  isMobile={true}
                  onClose={() => setShowPanel(false)}
                  onUpdated={handleUpdated}
                  onDeleted={handleDeleted}
                />
              </div>
            )}
          </>
        ) : (
          /* ═══════════ LAYOUT DESKTOP: sidebar + panel ═══════════ */
          <div style={{
            background: 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(20px) saturate(160%)',
            WebkitBackdropFilter: 'blur(20px) saturate(160%)',
            borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.60)',
            boxShadow: '0 2px 0 rgba(255,255,255,0.85) inset, 0 8px 28px rgba(0,0,0,0.06)',
            overflow: 'hidden',
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '280px 1fr',
              height: 'calc(100vh - 140px)',
            }}>
              {/* Sidebar */}
              <div style={{
                borderRight: `1px solid ${colors.gray.border}`,
                display: 'flex', flexDirection: 'column',
                background: 'rgba(255,255,255,0.80)',
                backdropFilter: 'blur(20px)',
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '14px 16px 10px',
                  borderBottom: `1px solid ${colors.gray.border}`,
                  flexShrink: 0,
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 12px',
                    borderRadius: 10,
                    background: colors.background.page,
                    border: `1px solid ${colors.gray.borderMd}`,
                  }}>
                    <Search size={13} color={colors.gray.dimText} strokeWidth={2} />
                    <input
                      value={q}
                      onChange={e => setQ(e.target.value)}
                      placeholder="Procurar profissional..."
                      style={{
                        flex: 1, border: 'none', outline: 'none',
                        fontSize: 13, background: 'transparent',
                        color: colors.gray[900],
                        fontFamily: typography.fontFamily,
                      }}
                    />
                    {q && (
                      <button
                        onClick={() => setQ('')}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          padding: 0, display: 'flex',
                        }}
                      >
                        <X size={12} color={colors.gray.dimText} />
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {loading ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: colors.gray.dimText, fontSize: 14 }}>
                      Carregando equipe...
                    </div>
                  ) : filtered.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                      <UserCog size={26} color={colors.gray.dimText} style={{ opacity: 0.25, marginBottom: 10 }} />
                      <div style={{ fontSize: 13, color: colors.gray.dimText }}>
                        {q ? <>Nenhum resultado para &ldquo;{q}&rdquo;</> : 'Nenhum profissional'}
                      </div>
                    </div>
                  ) : (
                    filtered.map(p => (
                      <ProfItemDesktop
                        key={p.id}
                        prof={p}
                        selected={selected?.id === p.id}
                        onClick={() => handleSelect(p)}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Panel */}
              <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {selected ? (
                  <ProfessionalPanel
                    key={selected.id}
                    prof={selected}
                    allServices={allServices}
                    isMobile={false}
                    onClose={() => { /* desktop: não fecha */ }}
                    onUpdated={handleUpdated}
                    onDeleted={handleDeleted}
                  />
                ) : (
                  <div style={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: 12,
                    color: colors.gray.dimText,
                    padding: 40,
                  }}>
                    <UserCog size={36} style={{ opacity: 0.18 }} />
                    <span style={{ fontSize: 14 }}>Selecione um profissional</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// ─── ProfItemDesktop (sidebar item) ───────────────────────────────
function ProfItemDesktop({ prof, selected, onClick }: {
  prof:     Professional
  selected: boolean
  onClick:  () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '13px 20px',
        border: 'none', textAlign: 'left', cursor: 'pointer',
        background: selected ? colors.red.subtle : 'transparent',
        borderLeft: selected ? `3px solid ${colors.red.DEFAULT}` : '3px solid transparent',
        borderBottom: `1px solid ${colors.gray.border}`,
        transition: `all ${transitions.fast}`,
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = colors.gray.hover }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent' }}
    >
      <Avatar name={prof.name} size={42} url={prof.avatarUrl} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 700,
          color: selected ? colors.red.DEFAULT : colors.gray[900],
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {prof.name}
        </div>
        <div style={{ fontSize: 12, color: colors.gray.dimText, marginTop: 1 }}>
          {prof.role ?? 'Profissional'}
        </div>
      </div>
      {!prof.active && (
        <span style={{
          fontSize: 10, fontWeight: 700,
          color: colors.gray.dimText,
          background: colors.background.page,
          border: `1px solid ${colors.gray.borderMd}`,
          borderRadius: 6, padding: '2px 6px',
          flexShrink: 0,
        }}>INATIVO</span>
      )}
      <ChevronRight
        size={15}
        color={selected ? colors.red.DEFAULT : colors.gray.dimText}
        strokeWidth={2}
      />
    </button>
  )
}

// ─── ProfRowMobile ────────────────────────────────────────────────
function ProfRowMobile({ prof, onClick, isLast }: {
  prof:    Professional
  onClick: () => void
  isLast:  boolean
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 14px',
        border: 'none',
        borderBottom: isLast ? 'none' : `1px solid ${colors.gray.border}`,
        background: 'transparent',
        cursor: 'pointer',
        textAlign: 'left',
        transition: `background ${transitions.fast}`,
        WebkitTapHighlightColor: 'transparent',
      }}
      onTouchStart={e => (e.currentTarget.style.background = colors.red.subtle)}
      onTouchEnd={e => (e.currentTarget.style.background = 'transparent')}
    >
      <Avatar name={prof.name} size={42} url={prof.avatarUrl} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 600,
          color: colors.gray[900],
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          letterSpacing: '-0.01em',
        }}>
          {prof.name}
        </div>
        <div style={{
          fontSize: 12, color: colors.gray.dimText,
          marginTop: 2,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span>{prof.role ?? 'Profissional'}</span>
          {!prof.active && (
            <span style={{
              fontSize: 9, fontWeight: 700,
              color: colors.gray.dimText,
              background: colors.background.page,
              border: `1px solid ${colors.gray.borderMd}`,
              borderRadius: 4,
              padding: '1px 5px',
              letterSpacing: '.04em',
            }}>
              INATIVO
            </span>
          )}
        </div>
      </div>
      <ChevronRight size={16} color={colors.gray.dimText} strokeWidth={2} />
    </button>
  )
}

// ─── EmptyState ───────────────────────────────────────────────────
function EmptyState({ query, onCreate }: { query: string; onCreate: () => void }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '40px 24px',
      background: 'rgba(255,255,255,0.85)',
      borderRadius: 16,
      border: `1px solid ${colors.gray.border}`,
    }}>
      <UserCog size={36} color={colors.gray.dimText} style={{ opacity: 0.3, marginBottom: 12 }} />
      <div style={{ fontSize: 15, fontWeight: 600, color: typography.color.primary, marginBottom: 4 }}>
        {query ? 'Nenhum profissional encontrado' : 'Nenhum profissional ainda'}
      </div>
      <div style={{ fontSize: 13, color: colors.gray.dimText, marginBottom: 18 }}>
        {query ? `Tente outro termo de busca.` : 'Comece adicionando seu primeiro profissional.'}
      </div>
      {!query && (
        <button
          onClick={onCreate}
          style={{
            padding: '10px 20px',
            borderRadius: 10,
            background: colors.red.gradient,
            color: '#fff', border: 'none',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 14,
            boxShadow: `0 3px 10px ${colors.red.glow}`,
          }}
        >
          + Adicionar profissional
        </button>
      )}
    </div>
  )
}
