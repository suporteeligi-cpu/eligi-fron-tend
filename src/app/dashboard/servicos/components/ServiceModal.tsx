'use client'
// src/app/dashboard/servicos/components/ServiceModal.tsx

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

import api from '@/shared/lib/apiClient'
import { colors, typography, radius, shadows, glass } from '@/shared/theme'
import { Service } from '@/features/services/types'
import { DEFAULT_SERVICE_COLOR } from '@/features/services/constants/colorPalette'
import ColorPicker from './ColorPicker'

interface Props {
  service:    Service | null  // null = criar
  categories: string[]
  isMobile:   boolean
  onClose:    () => void
  onSaved:    (s: Service, isNew: boolean) => void
}

const HOUR_OPTIONS   = Array.from({ length: 13 }, (_, i) => i)
const MINUTE_OPTIONS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

export default function ServiceModal({ service, categories, isMobile, onClose, onSaved }: Props) {
  const isEdit = !!service

  const [name,        setName]        = useState(service?.name        ?? '')
  const [category,    setCategory]    = useState(service?.category    ?? '')
  const [duration,    setDuration]    = useState(service?.duration    ?? 30)
  const [price,       setPrice]       = useState<string>(service?.price != null ? String(service.price) : '')
  const [description, setDescription] = useState(service?.description ?? '')
  const [color,       setColor]       = useState<string>(service?.color ?? DEFAULT_SERVICE_COLOR)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  const durationH = Math.floor(duration / 60)
  const durationM = duration % 60

  function setDurationHM(h: number, m: number) {
    setDuration(h * 60 + m)
  }

  async function handleSave() {
    if (!name.trim())  { setError('Nome é obrigatório'); return }
    if (duration < 5)  { setError('Duração mínima é 5 minutos'); return }

    try {
      setSaving(true)
      setError(null)
      const payload = {
        name:        name.trim(),
        duration,
        price:       price !== '' ? Number(price) : undefined,
        description: description.trim() || undefined,
        category:    category.trim()    || undefined,
        color,
      }
      const res = isEdit
        ? await api.put(`/services/${service!.id}`, payload)
        : await api.post('/services', payload)

      const data = res.data?.data ?? res.data
      onSaved(data, !isEdit)
      onClose()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg ?? 'Erro ao salvar serviço')
    } finally {
      setSaving(false)
    }
  }

  if (typeof document === 'undefined') return null

  // ─── Styles compartilhados ──────────────────────────────────────────
  const labelStyle: React.CSSProperties = {
    fontSize: typography.scale.xs,
    fontWeight: typography.weight.bold,
    color: typography.color.muted,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    marginBottom: 6,
    display: 'block',
  }

  const fieldGapStyle: React.CSSProperties = {
    marginBottom: isMobile ? 18 : 16,
  }

  return createPortal(
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.30)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 9998,
          animation: 'svc-mod-fade 0.18s ease',
        }}
      />

      <div style={isMobile ? {
        position: 'fixed', bottom: 0, left: 0, right: 0,
        top: 60,  // deixa espaço pro top em telas grandes
        background: 'rgba(255,255,255,0.99)',
        borderRadius: '24px 24px 0 0',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
        zIndex: 9999,
        display: 'flex', flexDirection: 'column',
        fontFamily: typography.fontFamily,
        animation: 'svc-mod-up 0.30s cubic-bezier(0.34, 1.2, 0.64, 1)',
      } : {
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: 480, maxWidth: '94vw', maxHeight: '90vh',
        background: 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        borderRadius: radius['2xl'],
        border: `1px solid ${colors.gray.borderMd}`,
        boxShadow: shadows.lg,
        zIndex: 9999,
        display: 'flex', flexDirection: 'column',
        fontFamily: typography.fontFamily,
        animation: 'svc-mod-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
        <style>{`
          @keyframes svc-mod-fade { from { opacity:0 } to { opacity:1 } }
          @keyframes svc-mod-in   { from { opacity:0; transform: translate(-50%,-50%) scale(0.95) } to { opacity:1; transform: translate(-50%,-50%) scale(1) } }
          @keyframes svc-mod-up   { from { transform: translateY(100%) } to { transform: translateY(0) } }
          .svc-input{
            width: 100%;
            padding: ${isMobile ? '12px 14px' : '10px 14px'};
            border-radius: ${radius.md}px;
            border: 1px solid ${colors.gray.borderMd};
            background: ${colors.background.surface};
            color: ${typography.color.primary};
            font-size: ${typography.scale.base}px;
            outline: none;
            box-sizing: border-box;
            font-family: ${typography.fontFamily};
            transition: border-color 0.15s, box-shadow 0.15s;
          }
          .svc-input:focus{
            border-color: ${colors.red.borderHover};
            box-shadow: 0 0 0 3px ${colors.red.focusRing};
          }
          .svc-select{ appearance: none; cursor: pointer }
          .svc-handle{
            width: 40px; height: 4px; border-radius: 2px;
            background: rgba(0,0,0,0.12);
            margin: 12px auto 4px;
          }
        `}</style>

        {/* Handle mobile */}
        {isMobile && <div aria-hidden className="svc-handle" />}

        {/* Header */}
        <div style={{
          padding: isMobile ? '16px 20px 14px' : '20px 20px 16px',
          borderBottom: `1px solid ${colors.gray.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <h2 style={{
            margin: 0,
            fontSize: isMobile ? 19 : 17,
            fontWeight: typography.weight.bold,
            color: typography.color.primary,
            letterSpacing: '-0.3px',
          }}>
            {isEdit ? 'Editar serviço' : 'Novo serviço'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Fechar"
            style={{
              width: 32, height: 32, borderRadius: '50%',
              border: `1px solid ${colors.gray.borderMd}`,
              background: glass.surface.default.background,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <X size={15} color={colors.gray.dimText} />
          </button>
        </div>

        {/* Body */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: isMobile ? '20px' : '20px',
          WebkitOverflowScrolling: 'touch',
        }}>
          {error && (
            <div style={{
              marginBottom: 16,
              padding: '10px 14px',
              borderRadius: radius.sm,
              background: colors.red.subtle,
              border: `1px solid ${colors.red.border}`,
              color: '#b91c1c',
              fontSize: typography.scale.sm,
            }}>
              {error}
            </div>
          )}

          {/* Nome */}
          <div style={fieldGapStyle}>
            <label style={labelStyle}>Nome do serviço *</label>
            <input
              className="svc-input"
              placeholder="Ex: Corte Masculino"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus={!isEdit && !isMobile}
            />
          </div>

          {/* Cor */}
          <div style={fieldGapStyle}>
            <label style={labelStyle}>Cor</label>
            <ColorPicker selected={color} onSelect={setColor} />
          </div>

          {/* Categoria */}
          <div style={fieldGapStyle}>
            <label style={labelStyle}>Categoria</label>
            <input
              className="svc-input"
              placeholder="Ex: Cabelo e Barba"
              value={category}
              onChange={e => setCategory(e.target.value)}
              list="cat-suggestions"
            />
            <datalist id="cat-suggestions">
              {categories.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>

          {/* Duração */}
          <div style={fieldGapStyle}>
            <label style={labelStyle}>Duração *</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <select
                  className="svc-input svc-select"
                  value={durationH}
                  onChange={e => setDurationHM(Number(e.target.value), durationM)}
                >
                  {HOUR_OPTIONS.map(h => <option key={h} value={h}>{h}h</option>)}
                </select>
                <div style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)', pointerEvents: 'none',
                  fontSize: 10, color: colors.gray.dimText,
                }}>▾</div>
              </div>
              <div style={{ position: 'relative', flex: 1 }}>
                <select
                  className="svc-input svc-select"
                  value={durationM}
                  onChange={e => setDurationHM(durationH, Number(e.target.value))}
                >
                  {MINUTE_OPTIONS.map(m => <option key={m} value={m}>{m}min</option>)}
                </select>
                <div style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)', pointerEvents: 'none',
                  fontSize: 10, color: colors.gray.dimText,
                }}>▾</div>
              </div>
            </div>
          </div>

          {/* Preço */}
          <div style={fieldGapStyle}>
            <label style={labelStyle}>Preço (R$)</label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 14, top: '50%',
                transform: 'translateY(-50%)',
                fontSize: typography.scale.sm,
                color: colors.gray.dimText,
                fontWeight: typography.weight.medium,
              }}>R$</span>
              <input
                className="svc-input"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={price}
                onChange={e => setPrice(e.target.value)}
                style={{ paddingLeft: 40 }}
              />
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label style={labelStyle}>Descrição (opcional)</label>
            <textarea
              className="svc-input"
              placeholder="Descreva o serviço para seus clientes..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={isMobile ? 4 : 3}
              style={{ resize: 'vertical', lineHeight: 1.5 }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: isMobile ? '14px 20px max(20px, env(safe-area-inset-bottom))' : '14px 20px 20px',
          borderTop: `1px solid ${colors.gray.border}`,
          display: 'flex', gap: 8,
          flexShrink: 0,
          background: 'rgba(255,255,255,0.95)',
        }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1, padding: isMobile ? '14px' : '13px',
              background: saving ? 'rgba(220,38,38,0.25)' : colors.red.gradient,
              color: '#fff',
              border: 'none',
              borderRadius: radius.md,
              fontWeight: typography.weight.semibold,
              fontSize: isMobile ? 15 : 14,
              cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: saving ? 'none' : shadows.redMd,
              transition: 'all 0.2s',
            }}
          >
            {saving ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar serviço'}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: isMobile ? '14px 20px' : '13px 20px',
              background: 'rgba(0,0,0,0.05)',
              border: `1px solid ${colors.gray.borderMd}`,
              borderRadius: radius.md,
              fontSize: typography.scale.base,
              cursor: 'pointer',
              color: typography.color.muted,
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </>,
    document.body
  )
}
