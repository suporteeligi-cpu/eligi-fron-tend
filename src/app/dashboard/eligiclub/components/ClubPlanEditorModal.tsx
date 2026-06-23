'use client'
// src/app/dashboard/eligiclub/components/ClubPlanEditorModal.tsx
//
// Editor de plano do EligiClub — espelha a cromática do PackageEditorModal
// (portal, overlay blur, sheet no mobile, picker de serviço, ToggleRow, footer fixo).
// Plano de clube cobre serviços (serviceIds, mín. 1), tem mensalidade,
// repasse à equipe (staffSharePct) e cor. Sem qty/preço por item — clube é
// cobertura ilimitada, não pacote de créditos.

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, Plus, Trash2, Loader2, Scissors, AlertCircle } from 'lucide-react'

import api from '@/shared/lib/apiClient'
import { colors, typography, transitions, radius } from '@/shared/theme'

// ── tipos (espelham o back / page.tsx) ──────────────────────────────────────
interface SvcLite { id: string; name: string; color: string | null; duration: number; price: number | null }
interface PlanServiceRef {
  serviceId: string
  service: { id: string; name: string; duration: number; price: number; color: string | null }
}
interface ClubPlan {
  id: string
  name: string
  description: string | null
  price: number
  staffSharePct: number
  active: boolean
  color: string | null
  services: PlanServiceRef[]
  _count?: { subscriptions: number }
}

const PALETTE = ['#E11D2A', '#EA580C', '#D97706', '#16A34A', '#0891B2', '#2563EB', '#7C3AED', '#DB2777', '#64748B']
const fmtBRL = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface Props {
  plan:     ClubPlan | null   // null = criando
  isMobile: boolean
  onSaved:  (plan: ClubPlan) => void
  onClose:  () => void
}

export default function ClubPlanEditorModal({ plan, isMobile, onSaved, onClose }: Props) {
  const isEditing = plan != null

  const [name,        setName]        = useState(plan?.name ?? '')
  const [description, setDescription] = useState(plan?.description ?? '')
  const [priceStr,    setPriceStr]    = useState(plan ? String(plan.price) : '')
  const [pctStr,      setPctStr]      = useState(plan ? String(plan.staffSharePct) : '50')
  const [color,       setColor]       = useState<string>(plan?.color ?? PALETTE[0])
  const [active,      setActive]      = useState(plan?.active ?? true)
  const [serviceIds,  setServiceIds]  = useState<string[]>(() => plan?.services.map(s => s.serviceId) ?? [])

  // serviços: semeia com os do plano (edição mostra nomes na hora) e o fetch repõe a lista completa
  const [services, setServices] = useState<SvcLite[]>(() =>
    plan?.services.map(s => ({
      id: s.service.id, name: s.service.name, color: s.service.color,
      duration: s.service.duration, price: s.service.price,
    })) ?? [],
  )
  const [showAddService, setShowAddService] = useState(false)

  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    let cancelled = false
    api.get('/services').then(res => {
      if (cancelled) return
      const data = res.data?.data ?? res.data
      const list: SvcLite[] = (Array.isArray(data) ? data : data.services ?? [])
        .map((s: { id: string; name: string; color?: string | null; duration: number; price?: number | null }) => ({
          id: s.id, name: s.name, color: s.color ?? null, duration: s.duration, price: s.price ?? null,
        }))
      setServices(list)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  function handleClose() {
    setMounted(false)
    setTimeout(onClose, 200)
  }

  function addService(id: string) {
    setServiceIds(prev => prev.includes(id) ? prev : [...prev, id])
    setShowAddService(false)
  }
  function removeService(id: string) {
    setServiceIds(prev => prev.filter(s => s !== id))
  }

  const priceNum = parseFloat(priceStr.replace(',', '.')) || 0
  const pctNum   = parseFloat(pctStr.replace(',', '.')) || 0

  const submit = useCallback(async () => {
    setError(null)
    if (!name.trim())             { setError('Nome obrigatório'); return }
    if (priceNum <= 0)            { setError('Mensalidade deve ser maior que zero'); return }
    if (pctNum < 0 || pctNum > 100) { setError('Repasse deve estar entre 0 e 100'); return }
    if (serviceIds.length === 0)  { setError('Selecione pelo menos 1 serviço'); return }

    setSaving(true)
    try {
      const body = {
        name: name.trim(),
        description: description.trim() || undefined,
        price: priceNum,
        staffSharePct: pctNum,
        color,
        serviceIds,
      }
      const res = isEditing
        ? await api.patch(`/club/${plan!.id}`, body)
        : await api.post('/club', body)

      const data = res.data?.data ?? res.data
      onSaved(data)
      handleClose()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'Erro ao salvar')
      setSaving(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, description, priceNum, pctNum, color, serviceIds, isEditing])

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 700, color: colors.gray.dimText,
    textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6,
  }
  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', padding: isMobile ? '11px 13px' : '10px 13px',
    borderRadius: 9, fontSize: 13, border: `1px solid ${colors.gray.borderMd}`, outline: 'none',
    fontFamily: typography.fontFamily, color: colors.gray[900], background: '#fff',
  }

  const selectedServices = serviceIds
    .map(id => services.find(s => s.id === id))
    .filter((s): s is SvcLite => s != null)
  const availableServices = services.filter(s => !serviceIds.includes(s.id))

  const content = (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)',
        zIndex: 9998, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
        opacity: mounted ? 1 : 0, transition: 'opacity 0.2s ease', fontFamily: typography.fontFamily,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', width: isMobile ? '100%' : 640, maxWidth: '100%',
          maxHeight: isMobile ? '94vh' : '90vh', borderRadius: isMobile ? '20px 20px 0 0' : radius.lg,
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          transform: mounted ? 'translateY(0)' : isMobile ? 'translateY(100%)' : 'scale(0.97)',
          transition: `transform 0.25s ${transitions.spring ?? 'cubic-bezier(0.34,1.56,0.64,1)'}`,
          boxShadow: '0 -8px 40px rgba(0,0,0,0.20)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${colors.gray.border}`, flexShrink: 0 }}>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, marginRight: 10, display: 'flex', WebkitTapHighlightColor: 'transparent' }}>
            <X size={20} color={colors.gray[700]} strokeWidth={2} />
          </button>
          <h2 style={{ flex: 1, margin: 0, fontSize: 17, fontWeight: 700, color: colors.gray[900], letterSpacing: '-0.01em' }}>
            {isEditing ? name || 'Editar plano' : 'Novo plano de clube'}
          </h2>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: isMobile ? 16 : 22 }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 16 : 22 }}>
            {/* COLUNA 1 — dados */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Nome do plano *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Clube Barba &amp; Cabelo" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Descrição</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Acesso ilimitado aos serviços do clube" rows={3} style={{ ...inputStyle, resize: 'vertical', minHeight: 70 }} />
              </div>

              <div>
                <label style={labelStyle}>Mensalidade *</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: colors.gray.dimText, fontWeight: 600 }}>R$</span>
                  <input value={priceStr} onChange={e => setPriceStr(e.target.value.replace(/[^\d,.]/g, ''))} placeholder="99,90" inputMode="decimal" style={{ ...inputStyle, paddingLeft: 36, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700 }} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Repasse à equipe (%) *</label>
                <div style={{ position: 'relative' }}>
                  <input value={pctStr} onChange={e => setPctStr(e.target.value.replace(/[^\d,.]/g, ''))} placeholder="50" inputMode="decimal" style={{ ...inputStyle, paddingRight: 30, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700 }} />
                  <span style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: colors.gray.dimText, fontWeight: 600 }}>%</span>
                </div>
                <div style={{ fontSize: 10, marginTop: 5, color: colors.gray.dimText, lineHeight: 1.5 }}>
                  Do valor arrecadado, <b style={{ color: colors.red.DEFAULT }}>{pctNum}%</b> vai pro pote da equipe e <b style={{ color: colors.gray[700] }}>{Math.max(0, 100 - pctNum)}%</b> fica com a casa.
                </div>
              </div>

              <div>
                <label style={labelStyle}>Cor</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {PALETTE.map(c => (
                    <button key={c} type="button" onClick={() => setColor(c)} aria-label={c} style={{
                      width: 28, height: 28, borderRadius: 8, background: c, cursor: 'pointer',
                      border: color === c ? '2px solid #fff' : '2px solid transparent',
                      boxShadow: color === c ? `0 0 0 2px ${c}` : '0 1px 3px rgba(0,0,0,0.15)',
                      WebkitTapHighlightColor: 'transparent', flexShrink: 0,
                    }} />
                  ))}
                </div>
              </div>

              <ToggleRow label="Ativo" desc="Plano disponível para assinar" value={active} onChange={setActive} />
            </div>

            {/* COLUNA 2 — serviços cobertos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Serviços cobertos ({serviceIds.length})</label>
                {availableServices.length > 0 && (
                  <button onClick={() => setShowAddService(s => !s)} style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 8,
                    border: `1px solid ${colors.gray.borderMd}`, background: '#fff', cursor: 'pointer',
                    fontSize: 11, fontWeight: 700, color: colors.red.DEFAULT, fontFamily: 'inherit', WebkitTapHighlightColor: 'transparent',
                  }}>
                    <Plus size={12} strokeWidth={2.4} />Adicionar
                  </button>
                )}
              </div>

              {/* Picker */}
              {showAddService && availableServices.length > 0 && (
                <div style={{ background: colors.background.page, borderRadius: 10, border: `1px solid ${colors.gray.border}`, padding: 6, maxHeight: 200, overflowY: 'auto' }}>
                  {availableServices.map(s => (
                    <button key={s.id} onClick={() => addService(s.id)} style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                      background: 'transparent', border: 'none', borderRadius: 7, cursor: 'pointer', textAlign: 'left',
                      fontFamily: 'inherit', WebkitTapHighlightColor: 'transparent',
                    }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fff')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ width: 3, height: 18, borderRadius: 2, background: s.color ?? colors.red.DEFAULT }} />
                      <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: colors.gray[900] }}>{s.name}</span>
                      <span style={{ fontSize: 11, color: colors.gray.dimText, fontVariantNumeric: 'tabular-nums' }}>{s.price != null ? fmtBRL(s.price) : '—'}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Lista de selecionados */}
              {serviceIds.length === 0 ? (
                <div style={{ padding: '30px 16px', textAlign: 'center', background: colors.background.page, borderRadius: 11, border: `1px dashed ${colors.gray.borderMd}`, color: colors.gray.dimText }}>
                  <Scissors size={26} style={{ opacity: 0.3, marginBottom: 6 }} />
                  <div style={{ fontSize: 12, fontWeight: 600 }}>Nenhum serviço coberto</div>
                  <div style={{ fontSize: 10, marginTop: 4 }}>Clique em &ldquo;Adicionar&rdquo; pra incluir serviços no clube</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedServices.map(s => (
                    <div key={s.id} style={{ background: '#fff', border: `1px solid ${colors.gray.border}`, borderRadius: 11, padding: '11px 12px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 3, background: s.color ?? colors.red.DEFAULT }} />
                      <div style={{ flex: 1, minWidth: 0, paddingLeft: 6 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: colors.gray[900], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                        <div style={{ fontSize: 10.5, color: colors.gray.dimText, marginTop: 2 }}>{s.duration} min{s.price != null ? ` · ${fmtBRL(s.price)}` : ''}</div>
                      </div>
                      <button onClick={() => removeService(s.id)} aria-label="Remover" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', color: colors.gray.dimText, WebkitTapHighlightColor: 'transparent', flexShrink: 0 }}>
                        <Trash2 size={14} strokeWidth={2} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {error && (
            <div style={{ marginTop: 14, padding: '10px 12px', background: 'rgba(220,38,38,0.06)', border: `1px solid ${colors.red.border}`, borderRadius: 8, fontSize: 12, color: colors.red.DEFAULT, display: 'flex', alignItems: 'center', gap: 7 }}>
              <AlertCircle size={14} strokeWidth={2.4} />{error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ flexShrink: 0, padding: '14px 20px', paddingBottom: isMobile ? 'calc(14px + env(safe-area-inset-bottom))' : 14, borderTop: `1px solid ${colors.gray.border}`, background: '#fff', display: 'flex', gap: 10 }}>
          <button onClick={handleClose} style={{ padding: '12px 20px', borderRadius: 10, border: `1px solid ${colors.gray.borderMd}`, background: '#fff', fontSize: 13, fontWeight: 700, color: colors.gray[700], cursor: 'pointer', fontFamily: 'inherit', WebkitTapHighlightColor: 'transparent' }}>
            Cancelar
          </button>
          <button onClick={submit} disabled={saving} style={{ flex: 1, padding: '12px 20px', borderRadius: 10, border: 'none', background: saving ? colors.gray.borderMd : colors.red.gradient, color: '#fff', fontSize: 13, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontFamily: 'inherit', letterSpacing: '.03em', textTransform: 'uppercase', boxShadow: saving ? 'none' : `0 4px 14px ${colors.red.glow}`, WebkitTapHighlightColor: 'transparent' }}>
            {saving ? <><Loader2 size={14} style={{ animation: 'club-spin 0.8s linear infinite' }} />Salvando</> : 'Salvar'}
          </button>
        </div>
      </div>

      <style>{`@keyframes club-spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(content, document.body)
}

function ToggleRow({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} type="button" style={{
      display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px',
      background: value ? 'rgba(220,38,38,0.04)' : colors.background.page,
      border: `1px solid ${value ? colors.red.border : colors.gray.border}`, borderRadius: 10,
      cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', WebkitTapHighlightColor: 'transparent', width: '100%',
    }}>
      <div style={{ width: 36, height: 20, borderRadius: 10, background: value ? colors.red.DEFAULT : colors.gray.borderMd, position: 'relative', flexShrink: 0, marginTop: 1, transition: 'background 0.15s ease' }}>
        <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: value ? 'calc(100% - 18px)' : 2, transition: 'left 0.15s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: colors.gray[900] }}>{label}</div>
        <div style={{ fontSize: 10, color: colors.gray.dimText, marginTop: 2 }}>{desc}</div>
      </div>
    </button>
  )
}
