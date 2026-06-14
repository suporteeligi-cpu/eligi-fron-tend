'use client'
// src/app/dashboard/pacotes/components/MembershipEditorModal.tsx

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  X, Loader2, AlertCircle, ChevronDown, ShoppingBag, RefreshCw,
} from 'lucide-react'

import api from '@/shared/lib/apiClient'
import { colors, typography, transitions, radius } from '@/shared/theme'
import { MembershipPlan, MServiceLite, ProfLite, ValidityType } from '@/features/memberships/types'
import { VALIDITY_OPTIONS } from '@/features/memberships/format'

interface Props {
  membership_: MembershipPlan | null   // null = criando
  isMobile:    boolean
  onSaved:     (m: MembershipPlan) => void
  onClose:     () => void
}

export default function MembershipEditorModal({ membership_, isMobile, onSaved, onClose }: Props) {
  const isEditing = membership_ != null

  const [name,             setName]             = useState(membership_?.name ?? '')
  const [description,      setDescription]      = useState(membership_?.description ?? '')
  const [priceStr,         setPriceStr]         = useState(membership_ ? String(membership_.price) : '')
  const [taxRateStr,       setTaxRateStr]       = useState(membership_?.taxRate != null ? String(membership_.taxRate) : '')
  const [validityType,     setValidityType]     = useState<ValidityType>(membership_?.validityType ?? 'DAYS')
  const [validityValueStr, setValidityValueStr] = useState(membership_?.validityValue != null ? String(membership_.validityValue) : '30')
  const [recurring,        setRecurring]        = useState(membership_?.recurring ?? false)
  const [allServices,      setAllServices]      = useState(membership_?.allServices ?? true)
  const [selectedIds,      setSelectedIds]      = useState<string[]>(() => membership_?.services?.map(s => s.serviceId) ?? [])
  const [active,           setActive]           = useState(membership_?.active ?? true)
  const [lockProfId,       setLockProfId]       = useState<string | null>(membership_?.lockProfessionalId ?? null)
  const [earnsCommission,  setEarnsCommission]  = useState(membership_?.earnsCommission ?? false)

  const [services,      setServices]      = useState<MServiceLite[]>([])
  const [professionals, setProfessionals] = useState<ProfLite[]>([])

  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    let cancelled = false

    api.get('/services').then(res => {
      if (cancelled) return
      const d = res.data?.data ?? res.data
      const list: MServiceLite[] = (Array.isArray(d) ? d : d.services ?? [])
        .map((s: { id: string; name: string; color?: string | null; duration: number; price?: number | null }) => ({
          id: s.id, name: s.name, color: s.color ?? null, duration: s.duration, price: s.price ?? null,
        }))
      setServices(list)
    }).catch(() => {})

    // Profissionais: tenta /equipe, cai pra /professionals (nome varia por instalação)
    ;(async () => {
      for (const ep of ['/equipe', '/professionals']) {
        try {
          const res = await api.get(ep)
          const d = res.data?.data ?? res.data
          const raw = Array.isArray(d) ? d : (d.professionals ?? d.team ?? [])
          const list: ProfLite[] = raw
            .filter((p: { id?: string; active?: boolean }) => p.id != null && p.active !== false)
            .map((p: { id: string; name: string }) => ({ id: p.id, name: p.name }))
          if (!cancelled && list.length) { setProfessionals(list); break }
        } catch { /* tenta o próximo endpoint */ }
      }
    })()

    return () => { cancelled = true }
  }, [])

  function handleClose() {
    setMounted(false)
    setTimeout(onClose, 200)
  }

  function toggleService(id: string) {
    setAllServices(false)
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function selectAllServices() {
    setAllServices(true)
    setSelectedIds([])
  }

  const needsValue = VALIDITY_OPTIONS.find(o => o.value === validityType)?.needsValue ?? false
  const priceNum = parseFloat(priceStr.replace(',', '.')) || 0

  const submit = useCallback(async () => {
    setError(null)
    if (!name.trim())  { setError('Nome obrigatório'); return }
    if (priceNum <= 0) { setError('Preço deve ser maior que zero'); return }
    if (needsValue) {
      const v = parseInt(validityValueStr, 10)
      if (isNaN(v) || v <= 0) { setError('Valor de validade inválido'); return }
    }
    if (!allServices && selectedIds.length === 0) {
      setError('Selecione ao menos um serviço ou marque "Todos os serviços"'); return
    }

    setSaving(true)
    try {
      const body = {
        name:               name.trim(),
        description:        description.trim() || undefined,
        price:              priceNum,
        taxRate:            taxRateStr ? parseFloat(taxRateStr.replace(',', '.')) : null,
        validityType,
        validityValue:      needsValue ? parseInt(validityValueStr, 10) : null,
        recurring,
        allServices,
        serviceIds:         allServices ? undefined : selectedIds,
        active,
        lockProfessionalId: lockProfId,
        earnsCommission,
      }
      const res = isEditing
        ? await api.patch(`/memberships/${membership_!.id}`, body)
        : await api.post('/memberships', body)
      const data = res.data?.data ?? res.data
      onSaved(data)
      handleClose()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'Erro ao salvar')
      setSaving(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, description, priceNum, taxRateStr, validityType, validityValueStr, needsValue, recurring, allServices, selectedIds, active, lockProfId, earnsCommission, isEditing])

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 700,
    color: colors.gray.dimText, textTransform: 'uppercase',
    letterSpacing: '.07em', marginBottom: 6,
  }
  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: isMobile ? '11px 13px' : '10px 13px',
    borderRadius: 9, fontSize: 13,
    border: `1px solid ${colors.gray.borderMd}`,
    outline: 'none', fontFamily: typography.fontFamily,
    color: colors.gray[900], background: '#fff',
  }

  const content = (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)',
        zIndex: 9998, display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
        opacity: mounted ? 1 : 0, transition: 'opacity 0.2s ease',
        fontFamily: typography.fontFamily,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', width: isMobile ? '100%' : 720, maxWidth: '100%',
          maxHeight: isMobile ? '94vh' : '90vh',
          borderRadius: isMobile ? '20px 20px 0 0' : radius.lg,
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          transform: mounted ? 'translateY(0)' : isMobile ? 'translateY(100%)' : 'scale(0.97)',
          transition: `transform 0.25s ${transitions.spring ?? 'cubic-bezier(0.34,1.56,0.64,1)'}`,
          boxShadow: '0 -8px 40px rgba(0,0,0,0.20)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center',
          padding: '16px 20px', borderBottom: `1px solid ${colors.gray.border}`, flexShrink: 0,
        }}>
          <button
            onClick={handleClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, marginRight: 10, display: 'flex', WebkitTapHighlightColor: 'transparent' }}
          >
            <X size={20} color={colors.gray[700]} strokeWidth={2} />
          </button>
          <h2 style={{ flex: 1, margin: 0, fontSize: 17, fontWeight: 700, color: colors.gray[900], letterSpacing: '-0.01em' }}>
            {isEditing ? name || 'Editar assinatura' : 'Nova assinatura'}
          </h2>
          <span style={{
            fontSize: 10, fontWeight: 700, color: '#15803d',
            background: 'rgba(22,163,74,0.10)', padding: '3px 9px', borderRadius: 999,
            textTransform: 'uppercase', letterSpacing: '.05em',
          }}>
            Ilimitada
          </span>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: isMobile ? 16 : 22 }}>
          {/* Cobrança */}
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Cobrança</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <BillingCard
                icon={<ShoppingBag size={16} strokeWidth={2} />}
                title="Compra única"
                desc="Expira no fim da validade"
                selected={!recurring}
                onClick={() => setRecurring(false)}
              />
              <BillingCard
                icon={<RefreshCw size={16} strokeWidth={2} />}
                title="Recorrente"
                desc="Renova no caixa ao vencer"
                selected={recurring}
                onClick={() => setRecurring(true)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 16 : 22 }}>
            {/* COLUNA 1 — dados */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Nome da assinatura *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Plano mensal" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Descrição</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Visitas ilimitadas dentro do período"
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 70 }}
                />
              </div>

              <div>
                <label style={labelStyle}>Preço de venda *</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: colors.gray.dimText, fontWeight: 600 }}>R$</span>
                  <input
                    value={priceStr}
                    onChange={e => setPriceStr(e.target.value.replace(/[^\d,.]/g, ''))}
                    placeholder="99,90" inputMode="decimal"
                    style={{ ...inputStyle, paddingLeft: 36, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Duração *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <select
                      value={validityType}
                      onChange={e => setValidityType(e.target.value as ValidityType)}
                      style={{ ...inputStyle, appearance: 'none', paddingRight: 32, cursor: 'pointer' }}
                    >
                      {VALIDITY_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} color={colors.gray.dimText} style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  </div>
                  {needsValue && (
                    <input
                      value={validityValueStr}
                      onChange={e => setValidityValueStr(e.target.value.replace(/\D/g, ''))}
                      placeholder="30" inputMode="numeric"
                      style={{ ...inputStyle, width: 90, textAlign: 'center', fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}
                    />
                  )}
                </div>
              </div>

              <div>
                <label style={labelStyle}>Taxa de imposto (%)</label>
                <input
                  value={taxRateStr}
                  onChange={e => setTaxRateStr(e.target.value.replace(/[^\d,.]/g, ''))}
                  placeholder="Opcional" inputMode="decimal" style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Profissional vinculado (opcional)</label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={lockProfId ?? ''}
                    onChange={e => setLockProfId(e.target.value || null)}
                    style={{ ...inputStyle, appearance: 'none', paddingRight: 32, cursor: 'pointer' }}
                  >
                    <option value="">Qualquer profissional</option>
                    {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <ChevronDown size={14} color={colors.gray.dimText} style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>
              </div>
            </div>

            {/* COLUNA 2 — cobertura + toggles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Serviços cobertos</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  <Chip label="Todos os serviços" active={allServices} onClick={selectAllServices} />
                  {services.map(s => (
                    <Chip
                      key={s.id}
                      label={s.name}
                      dot={s.color ?? undefined}
                      active={!allServices && selectedIds.includes(s.id)}
                      onClick={() => toggleService(s.id)}
                    />
                  ))}
                </div>
                <div style={{ fontSize: 10, color: colors.gray.dimText, marginTop: 8 }}>
                  {allServices
                    ? 'Vale para todos os serviços do negócio (ilimitado no período).'
                    : `${selectedIds.length} serviço${selectedIds.length !== 1 ? 's' : ''} selecionado${selectedIds.length !== 1 ? 's' : ''}.`}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                <ToggleRow label="Ativa" desc="Aparece na venda" value={active} onChange={setActive} />
                <ToggleRow label="Gera comissão" desc="Profissional recebe sobre o uso" value={earnsCommission} onChange={setEarnsCommission} />
              </div>
            </div>
          </div>

          {error && (
            <div style={{
              marginTop: 14, padding: '10px 12px',
              background: 'rgba(220,38,38,0.06)', border: `1px solid ${colors.red.border}`,
              borderRadius: 8, fontSize: 12, color: colors.red.DEFAULT,
              display: 'flex', alignItems: 'center', gap: 7,
            }}>
              <AlertCircle size={14} strokeWidth={2.4} />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          flexShrink: 0, padding: '14px 20px',
          paddingBottom: isMobile ? 'calc(14px + env(safe-area-inset-bottom))' : 14,
          borderTop: `1px solid ${colors.gray.border}`, background: '#fff',
          display: 'flex', gap: 10,
        }}>
          <button
            onClick={handleClose}
            style={{ padding: '12px 20px', borderRadius: 10, border: `1px solid ${colors.gray.borderMd}`, background: '#fff', fontSize: 13, fontWeight: 700, color: colors.gray[700], cursor: 'pointer', fontFamily: 'inherit', WebkitTapHighlightColor: 'transparent' }}
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={saving}
            style={{
              flex: 1, padding: '12px 20px', borderRadius: 10, border: 'none',
              background: saving ? colors.gray.borderMd : colors.red.gradient, color: '#fff',
              fontSize: 13, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              fontFamily: 'inherit', letterSpacing: '.03em', textTransform: 'uppercase',
              boxShadow: saving ? 'none' : `0 4px 14px ${colors.red.glow}`, WebkitTapHighlightColor: 'transparent',
            }}
          >
            {saving ? <><Loader2 size={14} style={{ animation: 'pkg-spin 0.8s linear infinite' }} />Salvando</> : 'Salvar'}
          </button>
        </div>
      </div>

      <style>{`@keyframes pkg-spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(content, document.body)
}

function BillingCard({
  icon, title, desc, selected, onClick,
}: {
  icon: React.ReactNode; title: string; desc: string; selected: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '11px 13px', borderRadius: 11,
        border: `${selected ? 2 : 1}px solid ${selected ? colors.red.DEFAULT : colors.gray.border}`,
        background: selected ? 'rgba(220,38,38,0.04)' : '#fff',
        cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span style={{ color: selected ? colors.red.DEFAULT : colors.gray.dimText, display: 'flex', flexShrink: 0 }}>{icon}</span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: colors.gray[900] }}>{title}</span>
        <span style={{ display: 'block', fontSize: 10, color: colors.gray.dimText, marginTop: 1 }}>{desc}</span>
      </span>
    </button>
  )
}

function Chip({
  label, active, dot, onClick,
}: {
  label: string; active: boolean; dot?: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '6px 11px', borderRadius: 999,
        border: `1px solid ${active ? 'transparent' : colors.gray.borderMd}`,
        background: active ? colors.red.gradient : '#fff',
        color: active ? '#fff' : colors.gray[700],
        fontSize: 12, fontWeight: 600, cursor: 'pointer',
        fontFamily: 'inherit', WebkitTapHighlightColor: 'transparent',
      }}
    >
      {dot && <span style={{ width: 7, height: 7, borderRadius: '50%', background: active ? '#fff' : dot, flexShrink: 0 }} />}
      {label}
    </button>
  )
}

function ToggleRow({
  label, desc, value, onChange,
}: {
  label: string; desc: string; value: boolean; onChange: (v: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      type="button"
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px',
        background: value ? 'rgba(220,38,38,0.04)' : colors.background.page,
        border: `1px solid ${value ? colors.red.border : colors.gray.border}`,
        borderRadius: 10, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
        WebkitTapHighlightColor: 'transparent', width: '100%',
      }}
    >
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
