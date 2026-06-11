'use client'
// src/app/dashboard/equipe/page.tsx

import { useState, useEffect, useCallback } from 'react'
import { Plus } from 'lucide-react'

import api from '@/shared/lib/apiClient'
import { colors, typography, transitions } from '@/shared/theme'
import { useDeviceMode } from '@/features/agenda/hooks/useDeviceMode'
import { Professional, ServiceItem } from '@/features/professionals/types'

import AddProfessionalModal from './components/AddProfessionalModal'
import FuncionariosTab      from './components/FuncionariosTab'
import HorariosTab          from './components/HorariosTab'
import ComissoesTab         from './components/ComissoesTab'

type TabId = 'funcionarios' | 'horarios' | 'comissoes'
type MobileLevel = 'list' | 'categories' | 'editor'

export default function EquipePage() {
  const mode = useDeviceMode()
  const isMobile = mode === 'mobile'

  const [tab,           setTab]           = useState<TabId>('funcionarios')
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [allServices,   setAllServices]   = useState<ServiceItem[]>([])
  const [loading,       setLoading]       = useState(true)
  const [selected,      setSelected]      = useState<Professional | null>(null)
  const [query,         setQuery]         = useState('')
  const [showAdd,       setShowAdd]       = useState(false)

  // Mobile: estado de drill-down (compartilhado entre tabs)
  const [mobileShowDetail, setMobileShowDetail] = useState(false)
  const [comissoesMobileLevel, setComissoesMobileLevel] = useState<MobileLevel>('list')

  // ─── Fetch ──────────────────────────────────────────────────────
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

      // Auto-select primeiro só no desktop
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

  // ─── Handlers ───────────────────────────────────────────────────
  function handleUpdated(updated: Professional) {
    setProfessionals(prev => prev.map(p => p.id === updated.id ? updated : p))
    setSelected(prev => prev?.id === updated.id ? updated : prev)
  }

  function handleDeleted(id: string) {
    setProfessionals(prev => {
      const next = prev.filter(p => p.id !== id)
      setSelected(curr => {
        if (curr?.id !== id) return curr
        return next[0] ?? null
      })
      return next
    })
    if (isMobile) {
      setMobileShowDetail(false)
      setComissoesMobileLevel('list')
    }
  }

  function handleCreated(prof: Professional) {
    setProfessionals(prev => [...prev, prof])
    setSelected(prof)
    setShowAdd(false)
    if (isMobile) {
      setMobileShowDetail(true)
    }
  }

  async function handleDelete(id: string) {
    await api.delete(`/equipe/${id}`)
  }

  function handleTabChange(newTab: TabId) {
    setTab(newTab)
    // Quando troca de tab no mobile, sempre volta pra lista
    if (isMobile) {
      setMobileShowDetail(false)
      setComissoesMobileLevel('list')
    }
  }

  function handleSelectProf(p: Professional) {
    setSelected(p)
  }

  const activeCount = professionals.filter(p => p.active).length

  // Filtra profissionais
  const filtered = professionals.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    (p.role ?? '').toLowerCase().includes(query.toLowerCase())
  )

  // ─── Render tabs ────────────────────────────────────────────────
  const TABS: Array<{ id: TabId; label: string }> = [
    { id: 'funcionarios', label: 'Funcionários' },
    { id: 'horarios',     label: 'Horários' },
    { id: 'comissoes',    label: 'Comissões' },
  ]

  return (
    <>
      <style>{`
        @keyframes eq-fade-up{ from{opacity:0; transform:translateY(8px)} to{opacity:1; transform:translateY(0)} }
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
          marginBottom: isMobile ? 12 : 16,
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
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: `0 4px 14px ${colors.red.glow}`,
              letterSpacing: '.02em',
              flexShrink: 0,
              WebkitTapHighlightColor: 'transparent',
              fontFamily: 'inherit',
            }}
          >
            <Plus size={15} strokeWidth={2.5} />
            {isMobile ? 'Novo' : 'Adicionar'}
          </button>
        </div>

        {/* ═══════════ CONTAINER COM ABAS ═══════════ */}
        <div style={{
          background: isMobile ? 'transparent' : 'rgba(255,255,255,0.72)',
          backdropFilter: isMobile ? undefined : 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: isMobile ? undefined : 'blur(20px) saturate(160%)',
          borderRadius: isMobile ? 0 : 20,
          border: isMobile ? 'none' : '1px solid rgba(255,255,255,0.60)',
          boxShadow: isMobile ? 'none' : '0 2px 0 rgba(255,255,255,0.85) inset, 0 8px 28px rgba(0,0,0,0.06)',
          overflow: isMobile ? 'visible' : 'hidden',
        }}>

          {/* TABS NO TOPO */}
          <div style={{
            display: 'flex',
            gap: 0,
            padding: isMobile ? 0 : '0 20px',
            background: isMobile ? 'rgba(255,255,255,0.85)' : 'transparent',
            backdropFilter: isMobile ? 'blur(20px)' : undefined,
            borderRadius: isMobile ? 12 : 0,
            border: isMobile ? `1px solid ${colors.gray.border}` : 'none',
            borderBottom: !isMobile ? `1px solid ${colors.gray.border}` : `1px solid ${colors.gray.border}`,
            marginBottom: isMobile ? 12 : 0,
            overflow: 'hidden',
          }}>
            {TABS.map(t => {
              const isActive = tab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => handleTabChange(t.id)}
                  style={{
                    flex: isMobile ? 1 : '0 0 auto',
                    padding: isMobile ? '12px 4px' : '13px 20px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: isMobile ? 11 : 12,
                    fontWeight: 700,
                    fontFamily: 'inherit',
                    color: isActive ? colors.red.DEFAULT : colors.gray.dimText,
                    borderBottom: isActive
                      ? `2px solid ${colors.red.DEFAULT}`
                      : '2px solid transparent',
                    transition: `all ${transitions.fast}`,
                    letterSpacing: '.04em',
                    textTransform: 'uppercase',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {t.label}
                </button>
              )
            })}
          </div>

          {/* CONTEÚDO DA TAB */}
          <div style={{
            minHeight: isMobile ? 400 : 'calc(100vh - 220px)',
            height: isMobile ? 'auto' : 'calc(100vh - 220px)',
          }}>
            {tab === 'funcionarios' && (
              <FuncionariosTab
                professionals={filtered}
                allServices={allServices}
                selected={selected}
                query={query}
                loading={loading}
                isMobile={isMobile}
                showMobilePanel={mobileShowDetail}
                onQueryChange={setQuery}
                onSelect={handleSelectProf}
                onUpdated={handleUpdated}
                onDeleted={handleDeleted}
                onMobileBack={() => setMobileShowDetail(false)}
                onMobileOpen={() => setMobileShowDetail(true)}
                onDelete={handleDelete}
              />
            )}

            {tab === 'horarios' && (
              <HorariosTab
                professionals={filtered}
                selected={selected}
                query={query}
                loading={loading}
                isMobile={isMobile}
                showMobilePanel={mobileShowDetail}
                onQueryChange={setQuery}
                onSelect={handleSelectProf}
                onMobileBack={() => setMobileShowDetail(false)}
                onMobileOpen={() => setMobileShowDetail(true)}
              />
            )}

            {tab === 'comissoes' && (
              <ComissoesTab
                professionals={filtered}
                allServices={allServices}
                selected={selected}
                query={query}
                loading={loading}
                isMobile={isMobile}
                mobileLevel={comissoesMobileLevel}
                onQueryChange={setQuery}
                onSelect={handleSelectProf}
                onUpdated={handleUpdated}
                onMobileLevel={setComissoesMobileLevel}
              />
            )}
          </div>
        </div>
      </div>
    </>
  )
}
