'use client'
// src/app/dashboard/equipe/components/FuncionariosTab.tsx

import { useState } from 'react'
import { UserCog } from 'lucide-react'
import { colors, typography } from '@/shared/theme'
import { Professional, ServiceItem } from '@/features/professionals/types'

import ProfSidebar      from './ProfSidebar'
import ProfDetailHeader from './ProfDetailHeader'
import ServicesReadOnly from './ServicesReadOnly'
import ProfEditModal    from './ProfEditModal'
import ConfirmModal     from './ConfirmModal'

interface Props {
  professionals: Professional[]
  allServices:   ServiceItem[]
  selected:      Professional | null
  query:         string
  loading:       boolean
  isMobile:      boolean
  showMobilePanel: boolean
  onQueryChange:   (q: string) => void
  onSelect:        (p: Professional) => void
  onUpdated:       (p: Professional) => void
  onDeleted:       (id: string) => void
  onMobileBack:    () => void
  onMobileOpen:    () => void
  onDelete:        (id: string) => Promise<void>
}

export default function FuncionariosTab({
  professionals, allServices, selected, query, loading,
  isMobile, showMobilePanel,
  onQueryChange, onSelect, onUpdated, onDeleted,
  onMobileBack, onMobileOpen, onDelete,
}: Props) {
  const [editing,    setEditing]    = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const [deleting,   setDeleting]   = useState(false)

  async function handleDelete() {
    if (!selected) return
    try {
      setDeleting(true)
      await onDelete(selected.id)
      onDeleted(selected.id)
      setConfirmDel(false)
    } catch {
      // silencioso
    } finally {
      setDeleting(false)
    }
  }

  function handleSelect(p: Professional) {
    onSelect(p)
    if (isMobile) onMobileOpen()
  }

  const profServices = (selected?.services ?? []).map(ps => ps.service)

  // ─── MOBILE ──────────────────────────────────────────────────────
  if (isMobile) {
    if (showMobilePanel && selected) {
      return (
        <>
          {editing && (
            <ProfEditModal
              prof={selected}
              allServices={allServices}
              isMobile={isMobile}
              onSaved={onUpdated}
              onClose={() => setEditing(false)}
            />
          )}
          {confirmDel && (
            <ConfirmModal
              title="Apagar profissional?"
              body="Será apagado permanentemente. Agendamentos existentes ficam no histórico (sem vínculo)."
              confirmLabel="Sim, apagar"
              onConfirm={handleDelete}
              onCancel={() => setConfirmDel(false)}
              confirming={deleting}
              isMobile={isMobile}
            />
          )}
          <div style={{
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(20px)',
            borderRadius: 12,
            overflow: 'hidden',
            border: `1px solid ${colors.gray.border}`,
          }}>
            <ProfDetailHeader
              prof={selected}
              isMobile
              onEdit={() => setEditing(true)}
              onDelete={() => setConfirmDel(true)}
              onBack={onMobileBack}
            />
            <div style={{ padding: '12px 16px 20px' }}>
              <ServicesReadOnly services={profServices} isMobile />
            </div>
          </div>
        </>
      )
    }

    // Mobile: lista
    return (
      <div style={{
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(20px)',
        borderRadius: 12,
        overflow: 'hidden',
        border: `1px solid ${colors.gray.border}`,
      }}>
        <ProfSidebar
          professionals={professionals}
          selected={null}
          query={query}
          onQueryChange={onQueryChange}
          onSelect={handleSelect}
          loading={loading}
        />
      </div>
    )
  }

  // ─── DESKTOP ─────────────────────────────────────────────────────
  return (
    <>
      {editing && selected && (
        <ProfEditModal
          prof={selected}
          allServices={allServices}
          isMobile={false}
          onSaved={onUpdated}
          onClose={() => setEditing(false)}
        />
      )}
      {confirmDel && selected && (
        <ConfirmModal
          title="Apagar profissional?"
          body="Será apagado permanentemente. Agendamentos existentes ficam no histórico (sem vínculo)."
          confirmLabel="Sim, apagar"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDel(false)}
          confirming={deleting}
          isMobile={false}
        />
      )}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '220px 1fr',
        height: '100%',
      }}>
        <ProfSidebar
          professionals={professionals}
          selected={selected}
          query={query}
          onQueryChange={onQueryChange}
          onSelect={handleSelect}
          loading={loading}
        />

        <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {selected ? (
            <>
              <ProfDetailHeader
                prof={selected}
                isMobile={false}
                onEdit={() => setEditing(true)}
                onDelete={() => setConfirmDel(true)}
              />
              <div style={{
                flex: 1, overflowY: 'auto',
                padding: '16px 20px',
              }}>
                <ServicesReadOnly services={profServices} isMobile={false} />
              </div>
            </>
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </>
  )
}

function EmptyState() {
  return (
    <div style={{
      flex: 1,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 10,
      color: colors.gray.dimText,
      padding: 40,
      fontFamily: typography.fontFamily,
    }}>
      <UserCog size={32} style={{ opacity: 0.18 }} />
      <span style={{ fontSize: 13 }}>Selecione um profissional</span>
    </div>
  )
}
