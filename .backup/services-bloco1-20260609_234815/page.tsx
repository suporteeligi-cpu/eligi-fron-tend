'use client'
// src/app/dashboard/servicos/page.tsx

import { useState, useEffect, useCallback, useMemo } from 'react'

import api from '@/shared/lib/apiClient'
import { colors, typography, radius, glass } from '@/shared/theme'
import { useDeviceMode } from '@/features/agenda/hooks/useDeviceMode'
import { Service } from '@/features/services/types'

import ServicesHeader       from './components/ServicesHeader'
import ServicesSearchBar    from './components/ServicesSearchBar'
import ServicesListDesktop  from './components/ServicesListDesktop'
import ServicesListMobile   from './components/ServicesListMobile'
import ServiceModal         from './components/ServiceModal'
import DeleteModal          from './components/DeleteModal'
import Toast                from './components/Toast'

export default function ServicosPage() {
  const mode     = useDeviceMode()
  const isMobile = mode === 'mobile'

  const [services, setServices] = useState<Service[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')

  // Modal: 'create' | Service (editar) | null
  const [modal,     setModal]     = useState<'create' | Service | null>(null)
  const [deleting,  setDeleting]  = useState<Service | null>(null)
  const [removing,  setRemoving]  = useState(false)

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2800)
  }

  // ─── Fetch ────────────────────────────────────────────────────────────
  const fetchServices = useCallback(async (signal?: AbortSignal) => {
    try {
      const res  = await api.get('/services', { signal })
      if (signal?.aborted) return
      const data = res.data?.data ?? res.data
      setServices(Array.isArray(data) ? data : [])
    } catch {
      if (!signal?.aborted) showToast('Erro ao carregar serviços', 'error')
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const ctrl = new AbortController()
    fetchServices(ctrl.signal)
    return () => ctrl.abort()
  }, [fetchServices])

  // ─── Handlers ─────────────────────────────────────────────────────────
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
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = saved
        return next
      }
      return [...prev, saved]
    })
    showToast(isNew ? 'Serviço criado!' : 'Serviço atualizado!', 'success')
  }

  // ─── Filtro + categorias derivadas ────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return services
    return services.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.category ?? '').toLowerCase().includes(q)
    )
  }, [services, search])

  const categories = useMemo(() =>
    [...new Set(
      services
        .map(s => s.category?.trim())
        .filter((c): c is string => !!c)
    )],
    [services]
  )

  const editingService = modal && modal !== 'create' ? modal : null

  return (
    <>
      <style>{`
        @keyframes fadeUp{ from{opacity:0; transform:translateY(10px)} to{opacity:1; transform:translateY(0)} }
        @keyframes spin{ to{ transform:rotate(360deg) } }
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} />}

      {(modal === 'create' || editingService) && (
        <ServiceModal
          service={editingService}
          categories={categories}
          isMobile={isMobile}
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
          isMobile={isMobile}
        />
      )}

      <div style={{
        maxWidth: 760,
        padding: isMobile ? '0 12px' : 0,
        animation: 'fadeUp 0.3s ease',
        fontFamily: typography.fontFamily,
      }}>

        <ServicesHeader
          totalServices={services.length}
          isMobile={isMobile}
          onCreate={() => setModal('create')}
        />

        <ServicesSearchBar
          search={search}
          setSearch={setSearch}
          isMobile={isMobile}
        />

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              border: `3px solid ${colors.red.subtle}`,
              borderTopColor: colors.red.DEFAULT,
              animation: 'spin 0.8s linear infinite',
            }} />
          </div>
        )}

        {/* Empty / lista */}
        {!loading && (
          filtered.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: isMobile ? '40px 24px' : '64px 32px',
              background: glass.surface.default.background,
              backdropFilter: glass.surface.default.backdropFilter,
              borderRadius: radius.xl,
              border: `1px solid ${colors.gray.border}`,
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✂️</div>
              <div style={{
                fontSize: 16,
                fontWeight: typography.weight.semibold,
                color: typography.color.primary,
                marginBottom: 6,
              }}>
                {search ? 'Nenhum serviço encontrado' : 'Nenhum serviço cadastrado'}
              </div>
              <div style={{
                fontSize: typography.scale.base,
                color: typography.color.muted,
                marginBottom: 20,
              }}>
                {search ? 'Tente outro termo de busca.' : 'Crie seu primeiro serviço para começar.'}
              </div>
              {!search && (
                <button
                  onClick={() => setModal('create')}
                  style={{
                    padding: '10px 20px',
                    borderRadius: radius.sm,
                    background: colors.red.gradient,
                    color: '#fff', border: 'none',
                    fontWeight: typography.weight.semibold,
                    cursor: 'pointer',
                    fontSize: typography.scale.base,
                  }}
                >
                  + Criar serviço
                </button>
              )}
            </div>
          ) : (
            isMobile ? (
              <ServicesListMobile
                services={filtered}
                onEdit={s => setModal(s)}
                onDelete={s => setDeleting(s)}
              />
            ) : (
              <ServicesListDesktop
                services={filtered}
                onEdit={s => setModal(s)}
                onDelete={s => setDeleting(s)}
              />
            )
          )
        )}
      </div>
    </>
  )
}
