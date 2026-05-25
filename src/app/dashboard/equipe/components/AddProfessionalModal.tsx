'use client'
// src/app/dashboard/equipe/components/AddProfessionalModal.tsx

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Mail, User } from 'lucide-react'

import api from '@/shared/lib/apiClient'
import { colors, typography, shadows } from '@/shared/theme'
import { Professional } from '@/features/professionals/types'

interface Props {
  isMobile:  boolean
  onCreated: (p: Professional) => void
  onClose:   () => void
}

export default function AddProfessionalModal({ isMobile, onCreated, onClose }: Props) {
  const [name,   setName]   = useState('')
  const [phone,  setPhone]  = useState('')
  const [email,  setEmail]  = useState('')
  const [role,   setRole]   = useState('')
  const [saving, setSaving] = useState<'' | 'saving' | 'error'>('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Foca input ao abrir (não-mobile evita teclado pular automático)
  useEffect(() => {
    if (isMobile) return
    const t = setTimeout(() => inputRef.current?.focus(), 80)
    return () => clearTimeout(t)
  }, [isMobile])

  async function handleCreate() {
    if (!name.trim()) return
    try {
      setSaving('saving')
      const res = await api.post('/equipe', {
        name: name.trim(),
        phone: phone || null,
        email: email || null,
        role:  role  || null,
      })
      const p = res.data?.data ?? res.data
      onCreated(p)
      onClose()
    } catch {
      setSaving('error')
    }
  }

  if (typeof document === 'undefined') return null

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: isMobile ? '12px 14px' : '10px 12px',
    borderRadius: 9,
    fontSize: 13,
    border: `1px solid ${colors.gray.borderMd}`,
    outline: 'none',
    fontFamily: typography.fontFamily,
    color: colors.gray[900],
    background: colors.background.page,
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 11,
    fontWeight: 700,
    color: colors.gray.dimText,
    textTransform: 'uppercase',
    letterSpacing: '.07em',
    marginBottom: 5,
  }

  const canSubmit = !!name.trim() && saving !== 'saving'

  return createPortal(
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.28)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 10998,
          animation: 'eq-add-fade 0.18s ease',
        }}
      />

      <div style={isMobile ? {
        position: 'fixed', bottom: 0, left: 0, right: 0,
        top: 60,
        background: 'rgba(255,255,255,0.99)',
        borderRadius: '24px 24px 0 0',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
        zIndex: 10999,
        display: 'flex', flexDirection: 'column',
        fontFamily: typography.fontFamily,
        animation: 'eq-add-up 0.30s cubic-bezier(0.34, 1.2, 0.64, 1)',
      } : {
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: 400, maxWidth: '92vw',
        background: 'rgba(255,255,255,0.99)',
        borderRadius: 22,
        boxShadow: shadows.lg,
        zIndex: 10999,
        fontFamily: typography.fontFamily,
        animation: 'eq-add-in 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
        overflow: 'hidden',
      }}>
        <style>{`
          @keyframes eq-add-fade { from { opacity:0 } to { opacity:1 } }
          @keyframes eq-add-in   { from { opacity:0; transform: translate(-50%,-50%) scale(0.93) } to { opacity:1; transform: translate(-50%,-50%) scale(1) } }
          @keyframes eq-add-up   { from { transform: translateY(100%) } to { transform: translateY(0) } }
        `}</style>

        {isMobile && (
          <div aria-hidden style={{
            width: 40, height: 4, borderRadius: 2,
            background: 'rgba(0,0,0,0.12)',
            margin: '12px auto 4px',
          }} />
        )}

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: isMobile ? '14px 20px' : '18px 20px 14px',
          borderBottom: `1px solid ${colors.gray.border}`,
          flexShrink: 0,
        }}>
          <h3 style={{
            margin: 0,
            fontSize: isMobile ? 18 : 16,
            fontWeight: 700,
            color: colors.gray[900],
          }}>
            Adicionar profissional
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
          padding: '16px 20px',
          display: 'flex', flexDirection: 'column', gap: 12,
          flex: isMobile ? 1 : undefined,
          overflowY: isMobile ? 'auto' : undefined,
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: colors.background.page,
              border: `2px dashed ${colors.gray.borderMd}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <User size={24} color={colors.gray.dimText} strokeWidth={1.5} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Nome *</label>
            <input
              ref={inputRef}
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && canSubmit && handleCreate()}
              placeholder="Nome completo"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Cargo</label>
            <input
              value={role}
              onChange={e => setRole(e.target.value)}
              placeholder="Ex: Barbeiro"
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, flexDirection: isMobile ? 'column' : 'row' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Telefone</label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                inputMode="tel"
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>E-mail</label>
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
                inputMode="email"
                style={inputStyle}
              />
            </div>
          </div>

          {email && (
            <div style={{
              padding: '10px 12px', borderRadius: 9,
              background: 'rgba(59,130,246,0.06)',
              border: '1px solid rgba(59,130,246,0.15)',
              fontSize: 12, color: '#1d4ed8',
              display: 'flex', alignItems: 'center', gap: 7,
            }}>
              <Mail size={13} strokeWidth={2} />
              Um convite de primeiro acesso será enviado para este e-mail.
            </div>
          )}

          {saving === 'error' && (
            <div style={{
              fontSize: 12,
              color: colors.red.DEFAULT,
              padding: '8px 12px',
              borderRadius: 9,
              background: 'rgba(220,38,38,0.06)',
              border: `1px solid ${colors.red.border}`,
            }}>
              Erro ao criar. Tente novamente.
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: isMobile
            ? '12px 20px max(20px, env(safe-area-inset-bottom))'
            : '0 20px 20px',
          display: 'flex', gap: 8,
          borderTop: isMobile ? `1px solid ${colors.gray.border}` : 'none',
          flexShrink: 0,
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
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
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
            }}
          >
            {saving === 'saving' ? 'Criando...' : 'Adicionar profissional'}
          </button>
        </div>
      </div>
    </>,
    document.body
  )
}
