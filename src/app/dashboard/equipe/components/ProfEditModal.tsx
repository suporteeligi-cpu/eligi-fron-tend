'use client'
// src/app/dashboard/equipe/components/ProfEditModal.tsx

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Check, Save } from 'lucide-react'

import api from '@/shared/lib/apiClient'
import { colors, typography, transitions, radius, shadows } from '@/shared/theme'
import {
  Professional, ServiceItem,
} from '@/features/professionals/types'

import AvatarPicker from './AvatarPicker'
import ServicesPicker from './ServicesPicker'

interface Props {
  prof:        Professional
  allServices: ServiceItem[]
  isMobile:    boolean
  onSaved:     (p: Professional) => void
  onClose:     () => void
}

export default function ProfEditModal({
  prof, allServices, isMobile, onSaved, onClose,
}: Props) {
  const [name,            setName]            = useState(prof.name)
  const [phone,           setPhone]           = useState(prof.phone ?? '')
  const [email,           setEmail]           = useState(prof.email ?? '')
  const [role,            setRole]            = useState(prof.role  ?? '')
  const [description,     setDescription]     = useState(prof.description ?? '')
  const [showInCalendar,  setShowInCalendar]  = useState(prof.showInCalendar  ?? true)
  const [availableOnline, setAvailableOnline] = useState(prof.availableOnline ?? true)
  const [avatarUrl,       setAvatarUrl]       = useState<string | null>(prof.avatarUrl ?? null)
  const [selectedSvcs,    setSelectedSvcs]    = useState<string[]>(
    (prof.services ?? []).map(ps => ps.service.id)
  )
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState(false)

  async function handleSave() {
    if (!name.trim()) return
    try {
      setSaving(true)
      setError(false)
      const res = await api.patch(`/equipe/${prof.id}`, {
        name: name.trim(),
        phone: phone || null,
        email: email || null,
        role:  role  || null,
        description: description || null,
        avatarUrl: avatarUrl || null,
        showInCalendar, availableOnline,
        serviceIds: selectedSvcs,
      })
      const updated = res.data?.data ?? res.data
      onSaved(updated)
      onClose()
    } catch {
      setError(true)
    } finally {
      setSaving(false)
    }
  }

  if (typeof document === 'undefined') return null

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: isMobile ? '11px 13px' : '9px 12px',
    borderRadius: 9,
    fontSize: 13,
    border: `1px solid ${colors.gray.borderMd}`,
    outline: 'none',
    fontFamily: typography.fontFamily,
    color: colors.gray[900],
    background: colors.background.page,
    boxSizing: 'border-box',
    transition: `border-color ${transitions.fast}`,
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 11, fontWeight: 700,
    color: colors.gray.dimText,
    textTransform: 'uppercase',
    letterSpacing: '.07em',
    marginBottom: 5,
  }

  const canSubmit = !!name.trim() && !saving

  return createPortal(
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.30)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 10998,
          animation: 'eq-edit-fade 0.18s ease',
        }}
      />

      <div style={isMobile ? {
        position: 'fixed', bottom: 0, left: 0, right: 0,
        top: 'var(--navbar-h, 60px)',
        background: 'rgba(255,255,255,0.99)',
        borderRadius: '24px 24px 0 0',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
        zIndex: 10999,
        display: 'flex', flexDirection: 'column',
        fontFamily: typography.fontFamily,
        animation: 'eq-edit-up 0.30s cubic-bezier(0.34, 1.2, 0.64, 1)',
      } : {
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 460, maxWidth: '92vw',
        maxHeight: '88vh',
        background: 'rgba(255,255,255,0.99)',
        borderRadius: radius['2xl'],
        boxShadow: shadows.lg,
        zIndex: 10999,
        display: 'flex', flexDirection: 'column',
        fontFamily: typography.fontFamily,
        animation: 'eq-edit-in 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
        overflow: 'hidden',
      }}>
        <style>{`
          @keyframes eq-edit-fade { from { opacity:0 } to { opacity:1 } }
          @keyframes eq-edit-in   { from { opacity:0; transform: translate(-50%,-50%) scale(0.93) } to { opacity:1; transform: translate(-50%,-50%) scale(1) } }
          @keyframes eq-edit-up   { from { transform: translateY(100%) } to { transform: translateY(0) } }
        `}</style>

        {isMobile && (
          <div aria-hidden style={{
            width: 40, height: 4, borderRadius: 2,
            background: 'rgba(0,0,0,0.12)',
            margin: '12px auto 0',
            flexShrink: 0,
          }} />
        )}

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: `1px solid ${colors.gray.border}`,
          flexShrink: 0,
        }}>
          <h3 style={{
            margin: 0,
            fontSize: 17,
            fontWeight: 700,
            color: colors.gray[900],
            letterSpacing: '-0.02em',
          }}>
            Editar profissional
          </h3>
          <button
            onClick={onClose}
            aria-label="Fechar"
            style={{
              width: 30, height: 30, borderRadius: '50%',
              border: `1px solid ${colors.gray.borderMd}`,
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={14} color={colors.gray.dimText} />
          </button>
        </div>

        {/* Body */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: '16px 20px',
          display: 'flex', flexDirection: 'column', gap: 14,
          WebkitOverflowScrolling: 'touch',
        }}>
          {/* Avatar */}
          <AvatarPicker name={name} current={avatarUrl} onChange={setAvatarUrl} />

          {/* Nome */}
          <div>
            <label style={labelStyle}>Nome *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              style={inputStyle}
              placeholder="Nome completo"
            />
          </div>

          {/* Cargo */}
          <div>
            <label style={labelStyle}>Cargo</label>
            <input
              value={role}
              onChange={e => setRole(e.target.value)}
              style={inputStyle}
              placeholder="Ex: Barbeiro, Recepcionista"
            />
          </div>

          {/* Telefone + Email */}
          <div style={{ display: 'flex', gap: 10, flexDirection: isMobile ? 'column' : 'row' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Telefone</label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                style={inputStyle}
                placeholder="(11) 99999-9999"
                inputMode="tel"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>E-mail</label>
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={inputStyle}
                placeholder="email@exemplo.com"
                inputMode="email"
              />
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label style={labelStyle}>Descrição</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              placeholder="Descrição do profissional..."
              style={{ ...inputStyle, resize: 'none', minHeight: 60 }}
            />
          </div>

          {/* Switches */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Mostrar no calendário', sub: 'O profissional aparece na agenda', val: showInCalendar, set: setShowInCalendar },
              { label: 'Disponível para agendamentos online', sub: 'Clientes podem agendar pelo link público', val: availableOnline, set: setAvailableOnline },
            ].map(({ label, sub, val, set }) => (
              <button
                key={label}
                onClick={() => set(!val)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: 0, textAlign: 'left',
                  fontFamily: 'inherit',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: 6,
                  border: val ? 'none' : `1.5px solid ${colors.gray.borderMd}`,
                  background: val ? colors.red.DEFAULT : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginTop: 2,
                  boxShadow: val ? `0 2px 6px ${colors.red.glow}` : 'none',
                  transition: `all ${transitions.fast}`,
                }}>
                  {val && <Check size={12} color="#fff" strokeWidth={3} />}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: colors.gray[900] }}>{label}</div>
                  <div style={{ fontSize: 11, color: colors.gray.dimText, marginTop: 1 }}>{sub}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Serviços vinculados */}
          <div>
            <label style={labelStyle}>Serviços vinculados</label>
            <ServicesPicker
              selected={selectedSvcs}
              allServices={allServices}
              onChange={setSelectedSvcs}
            />
          </div>

          {error && (
            <div style={{
              padding: '10px 12px',
              borderRadius: 9,
              background: 'rgba(220,38,38,0.06)',
              border: `1px solid ${colors.red.border}`,
              fontSize: 12,
              color: colors.red.DEFAULT,
            }}>
              Erro ao salvar. Tente novamente.
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: isMobile
            ? '12px 20px max(20px, env(safe-area-inset-bottom))'
            : '14px 20px',
          display: 'flex', gap: 8,
          borderTop: `1px solid ${colors.gray.border}`,
          flexShrink: 0,
          background: 'rgba(255,255,255,0.95)',
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '12px',
              borderRadius: 10,
              border: `1px solid ${colors.gray.borderMd}`,
              background: 'transparent',
              fontSize: 13, cursor: 'pointer',
              color: colors.gray[700], fontWeight: 600,
              fontFamily: 'inherit',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!canSubmit}
            style={{
              flex: 2, padding: '12px',
              borderRadius: 10,
              border: 'none',
              background: !canSubmit ? colors.gray.borderMd : colors.red.gradient,
              color: !canSubmit ? colors.gray.dimText : '#fff',
              fontSize: 13,
              cursor: !canSubmit ? 'not-allowed' : 'pointer',
              fontWeight: 700,
              boxShadow: !canSubmit ? 'none' : `0 3px 10px ${colors.red.glow}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              fontFamily: 'inherit',
            }}
          >
            <Save size={13} strokeWidth={2.5} />
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </>,
    document.body
  )
}
