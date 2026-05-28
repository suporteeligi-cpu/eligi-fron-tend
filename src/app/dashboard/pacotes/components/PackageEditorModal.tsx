'use client'
// src/app/dashboard/pacotes/components/PackageEditorModal.tsx

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  X, Plus, Trash2, Loader2, Package as PackageIcon, ChevronDown, AlertCircle,
} from 'lucide-react'

import api from '@/shared/lib/apiClient'
import { colors, typography, transitions, radius } from '@/shared/theme'
import {
  ServicePackage, PackageService, ProfLite, ValidityType,
} from '@/features/packages/types'
import { fmtBRL, VALIDITY_OPTIONS, calcItemsSum } from '@/features/packages/utils/format'

interface Props {
  package_:    ServicePackage | null   // null = criando
  isMobile:    boolean
  onSaved:     (pkg: ServicePackage) => void
  onClose:     () => void
}

interface ItemDraft {
  serviceId: string
  quantity:  number
  unitPrice: number
}

export default function PackageEditorModal({ package_, isMobile, onSaved, onClose }: Props) {
  const isEditing = package_ != null

  // Form
  const [name,            setName]            = useState(package_?.name ?? '')
  const [description,     setDescription]     = useState(package_?.description ?? '')
  const [priceStr,        setPriceStr]        = useState(package_ ? String(package_.price) : '')
  const [taxRateStr,      setTaxRateStr]      = useState(package_?.taxRate != null ? String(package_.taxRate) : '')
  const [validityType,    setValidityType]    = useState<ValidityType>(package_?.validityType ?? 'DAYS')
  const [validityValueStr, setValidityValueStr] = useState(package_?.validityValue != null ? String(package_.validityValue) : '30')
  const [active,          setActive]          = useState(package_?.active ?? true)
  const [lockProfId,      setLockProfId]      = useState<string | null>(package_?.lockProfessionalId ?? null)
  const [earnsCommission, setEarnsCommission] = useState(package_?.earnsCommission ?? false)
  const [items, setItems] = useState<ItemDraft[]>(() =>
    package_?.items.map(i => ({
      serviceId: i.serviceId,
      quantity:  i.quantity,
      unitPrice: i.unitPrice,
    })) ?? [],
  )

  const [services, setServices] = useState<PackageService[]>([])
  const [professionals, setProfessionals] = useState<ProfLite[]>([])
  const [showAddService, setShowAddService] = useState(false)

  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10)
    return () => clearTimeout(t)
  }, [])

  // Fetch services + profissionais
  useEffect(() => {
    let cancelled = false
    Promise.all([
      api.get('/services'),
      api.get('/equipe'),
    ]).then(([svcRes, profRes]) => {
      if (cancelled) return
      const svcData = svcRes.data?.data ?? svcRes.data
      const profData = profRes.data?.data ?? profRes.data

      const svcList: PackageService[] = (Array.isArray(svcData) ? svcData : svcData.services ?? [])
        .map((s: { id: string; name: string; color?: string | null; duration: number; price?: number | null }) => ({
          id: s.id, name: s.name, color: s.color ?? null,
          duration: s.duration, price: s.price ?? null,
        }))
      setServices(svcList)

      const profList: ProfLite[] = (Array.isArray(profData) ? profData : [])
        .filter((p: { id?: string; active?: boolean }) => p.id != null && p.active !== false)
        .map((p: { id: string; name: string }) => ({ id: p.id, name: p.name }))
      setProfessionals(profList)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  function handleClose() {
    setMounted(false)
    setTimeout(onClose, 200)
  }

  function addItem(serviceId: string) {
    const svc = services.find(s => s.id === serviceId)
    if (!svc) return
    // Não duplica
    if (items.some(it => it.serviceId === serviceId)) {
      setShowAddService(false)
      return
    }
    setItems(prev => [...prev, {
      serviceId,
      quantity:  1,
      unitPrice: svc.price ?? 0,
    }])
    setShowAddService(false)
  }

  function updateItem(idx: number, patch: Partial<ItemDraft>) {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it))
  }

  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  const needsValue = VALIDITY_OPTIONS.find(o => o.value === validityType)?.needsValue ?? false
  const itemsSum = calcItemsSum(items)
  const priceNum = parseFloat(priceStr.replace(',', '.')) || 0
  const saving_amount = itemsSum - priceNum

  const submit = useCallback(async () => {
    setError(null)
    if (!name.trim()) { setError('Nome obrigatório'); return }
    if (priceNum <= 0) { setError('Preço deve ser maior que zero'); return }
    if (items.length === 0) { setError('Adicione pelo menos 1 serviço'); return }
    if (needsValue) {
      const v = parseInt(validityValueStr, 10)
      if (isNaN(v) || v <= 0) { setError('Valor de validade inválido'); return }
    }

    setSaving(true)
    try {
      const body = {
        name: name.trim(),
        description: description.trim() || undefined,
        price: priceNum,
        taxRate: taxRateStr ? parseFloat(taxRateStr.replace(',', '.')) : null,
        validityType,
        validityValue: needsValue ? parseInt(validityValueStr, 10) : null,
        active,
        lockProfessionalId: lockProfId,
        earnsCommission,
        items: items.map(it => ({
          serviceId: it.serviceId,
          quantity:  it.quantity,
          unitPrice: it.unitPrice,
        })),
      }

      const res = isEditing
        ? await api.patch(`/packages/${package_!.id}`, body)
        : await api.post('/packages', body)

      const data = res.data?.data ?? res.data
      onSaved(data)
      handleClose()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'Erro ao salvar')
      setSaving(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, description, priceNum, taxRateStr, validityType, validityValueStr, needsValue, active, lockProfId, earnsCommission, items, isEditing])

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 11, fontWeight: 700,
    color: colors.gray.dimText,
    textTransform: 'uppercase',
    letterSpacing: '.07em',
    marginBottom: 6,
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: isMobile ? '11px 13px' : '10px 13px',
    borderRadius: 9,
    fontSize: 13,
    border: `1px solid ${colors.gray.borderMd}`,
    outline: 'none',
    fontFamily: typography.fontFamily,
    color: colors.gray[900],
    background: '#fff',
  }

  const availableServices = services.filter(s => !items.some(it => it.serviceId === s.id))

  const content = (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(3px)',
        zIndex: 9998,
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        opacity: mounted ? 1 : 0,
        transition: 'opacity 0.2s ease',
        fontFamily: typography.fontFamily,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          width: isMobile ? '100%' : 720,
          maxWidth: '100%',
          maxHeight: isMobile ? '94vh' : '90vh',
          borderRadius: isMobile ? '20px 20px 0 0' : radius.lg,
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          transform: mounted
            ? 'translateY(0)'
            : isMobile ? 'translateY(100%)' : 'scale(0.97)',
          transition: `transform 0.25s ${transitions.spring ?? 'cubic-bezier(0.34,1.56,0.64,1)'}`,
          boxShadow: '0 -8px 40px rgba(0,0,0,0.20)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center',
          padding: '16px 20px',
          borderBottom: `1px solid ${colors.gray.border}`,
          flexShrink: 0,
        }}>
          <button
            onClick={handleClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 6, marginRight: 10, display: 'flex',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <X size={20} color={colors.gray[700]} strokeWidth={2} />
          </button>
          <h2 style={{
            flex: 1,
            margin: 0,
            fontSize: 17,
            fontWeight: 700,
            color: colors.gray[900],
            letterSpacing: '-0.01em',
          }}>
            {isEditing ? name || 'Editar pacote' : 'Novo pacote'}
          </h2>
        </div>

        {/* Body 2 colunas no desktop, 1 no mobile */}
        <div style={{
          flex: 1, overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: isMobile ? 16 : 22,
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: isMobile ? 16 : 22,
          }}>
            {/* COLUNA 1: Dados básicos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Nome do pacote *</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Pacote Misto"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Descrição</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Pacote válido por 30 dias após a data de compra"
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 70 }}
                />
              </div>

              <div>
                <label style={labelStyle}>Preço de venda *</label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
                    fontSize: 12, color: colors.gray.dimText, fontWeight: 600,
                  }}>R$</span>
                  <input
                    value={priceStr}
                    onChange={e => setPriceStr(e.target.value.replace(/[^\d,.]/g, ''))}
                    placeholder="310,00"
                    inputMode="decimal"
                    style={{ ...inputStyle, paddingLeft: 36, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}
                  />
                </div>
                {itemsSum > 0 && priceNum > 0 && (
                  <div style={{
                    fontSize: 10, marginTop: 5,
                    color: saving_amount > 0 ? '#15803d' : colors.gray.dimText,
                  }}>
                    Soma dos itens: {fmtBRL(itemsSum)}
                    {saving_amount > 0 && ` · Cliente economiza ${fmtBRL(saving_amount)}`}
                  </div>
                )}
              </div>

              {/* Validade */}
              <div>
                <label style={labelStyle}>Validade *</label>
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
                    <ChevronDown size={14} color={colors.gray.dimText} style={{
                      position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                    }} />
                  </div>
                  {needsValue && (
                    <input
                      value={validityValueStr}
                      onChange={e => setValidityValueStr(e.target.value.replace(/\D/g, ''))}
                      placeholder="30"
                      inputMode="numeric"
                      style={{ ...inputStyle, width: 90, textAlign: 'center', fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}
                    />
                  )}
                </div>
              </div>

              {/* Taxa */}
              <div>
                <label style={labelStyle}>Taxa de imposto (%)</label>
                <input
                  value={taxRateStr}
                  onChange={e => setTaxRateStr(e.target.value.replace(/[^\d,.]/g, ''))}
                  placeholder="Opcional"
                  inputMode="decimal"
                  style={inputStyle}
                />
              </div>

              {/* Profissional travado */}
              <div>
                <label style={labelStyle}>Profissional vinculado (opcional)</label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={lockProfId ?? ''}
                    onChange={e => setLockProfId(e.target.value || null)}
                    style={{ ...inputStyle, appearance: 'none', paddingRight: 32, cursor: 'pointer' }}
                  >
                    <option value="">Qualquer profissional</option>
                    {professionals.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} color={colors.gray.dimText} style={{
                    position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                  }} />
                </div>
              </div>

              {/* Toggles */}
              <ToggleRow
                label="Ativo"
                desc="Pacote aparece na venda"
                value={active}
                onChange={setActive}
              />
              <ToggleRow
                label="Gera comissão"
                desc="Profissional recebe comissão sobre o uso"
                value={earnsCommission}
                onChange={setEarnsCommission}
              />
            </div>

            {/* COLUNA 2: Itens */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>
                  Serviços inclusos ({items.length})
                </label>
                {availableServices.length > 0 && (
                  <button
                    onClick={() => setShowAddService(s => !s)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '6px 11px',
                      borderRadius: 8,
                      border: `1px solid ${colors.gray.borderMd}`,
                      background: '#fff',
                      cursor: 'pointer',
                      fontSize: 11,
                      fontWeight: 700,
                      color: colors.red.DEFAULT,
                      fontFamily: 'inherit',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <Plus size={12} strokeWidth={2.4} />
                    Adicionar
                  </button>
                )}
              </div>

              {/* Picker de serviço */}
              {showAddService && availableServices.length > 0 && (
                <div style={{
                  background: colors.background.page,
                  borderRadius: 10,
                  border: `1px solid ${colors.gray.border}`,
                  padding: 6,
                  maxHeight: 200,
                  overflowY: 'auto',
                }}>
                  {availableServices.map(s => (
                    <button
                      key={s.id}
                      onClick={() => addItem(s.id)}
                      style={{
                        width: '100%',
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '8px 10px',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: 7,
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: 'inherit',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fff')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{
                        width: 3, height: 18, borderRadius: 2,
                        background: s.color ?? colors.red.DEFAULT,
                      }} />
                      <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: colors.gray[900] }}>
                        {s.name}
                      </span>
                      <span style={{
                        fontSize: 11, color: colors.gray.dimText,
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        {s.price != null ? fmtBRL(s.price) : '—'}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Lista de itens */}
              {items.length === 0 ? (
                <div style={{
                  padding: '30px 16px',
                  textAlign: 'center',
                  background: colors.background.page,
                  borderRadius: 11,
                  border: `1px dashed ${colors.gray.borderMd}`,
                  color: colors.gray.dimText,
                }}>
                  <PackageIcon size={26} style={{ opacity: 0.3, marginBottom: 6 }} />
                  <div style={{ fontSize: 12, fontWeight: 600 }}>Nenhum serviço incluso</div>
                  <div style={{ fontSize: 10, marginTop: 4 }}>
                    Clique em &ldquo;Adicionar&rdquo; pra incluir serviços
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {items.map((it, idx) => {
                    const svc = services.find(s => s.id === it.serviceId)
                    return (
                      <div key={`${it.serviceId}_${idx}`} style={{
                        background: '#fff',
                        border: `1px solid ${colors.gray.border}`,
                        borderRadius: 11,
                        padding: '10px 12px',
                        position: 'relative',
                        overflow: 'hidden',
                      }}>
                        {/* Barra cor lateral */}
                        <div style={{
                          position: 'absolute', top: 0, left: 0, bottom: 0,
                          width: 3, background: svc?.color ?? colors.red.DEFAULT,
                        }} />

                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          marginBottom: 8, paddingLeft: 6,
                        }}>
                          <div style={{
                            fontSize: 13, fontWeight: 700, color: colors.gray[900],
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            flex: 1, minWidth: 0,
                          }}>
                            {svc?.name ?? '—'}
                          </div>
                          <button
                            onClick={() => removeItem(idx)}
                            aria-label="Remover"
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              padding: 4, display: 'flex',
                              color: colors.gray.dimText,
                              WebkitTapHighlightColor: 'transparent',
                            }}
                          >
                            <Trash2 size={14} strokeWidth={2} />
                          </button>
                        </div>

                        <div style={{
                          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
                          paddingLeft: 6,
                        }}>
                          <div>
                            <div style={{ fontSize: 9, fontWeight: 700, color: colors.gray.dimText, marginBottom: 3, textTransform: 'uppercase' }}>
                              Quantidade
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <button
                                onClick={() => updateItem(idx, { quantity: Math.max(1, it.quantity - 1) })}
                                style={qtyBtnStyle}
                              >−</button>
                              <span style={{
                                flex: 1, textAlign: 'center',
                                fontSize: 15, fontWeight: 700,
                                fontVariantNumeric: 'tabular-nums',
                                color: colors.gray[900],
                              }}>{it.quantity}</span>
                              <button
                                onClick={() => updateItem(idx, { quantity: it.quantity + 1 })}
                                style={qtyBtnStyle}
                              >+</button>
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 9, fontWeight: 700, color: colors.gray.dimText, marginBottom: 3, textTransform: 'uppercase' }}>
                              Preço c/ desconto
                            </div>
                            <div style={{ position: 'relative' }}>
                              <span style={{
                                position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                                fontSize: 10, color: colors.gray.dimText, fontWeight: 600,
                              }}>R$</span>
                              <input
                                value={String(it.unitPrice)}
                                onChange={e => {
                                  const v = parseFloat(e.target.value.replace(',', '.')) || 0
                                  updateItem(idx, { unitPrice: v })
                                }}
                                inputMode="decimal"
                                style={{
                                  width: '100%', boxSizing: 'border-box',
                                  padding: '6px 8px 6px 26px',
                                  fontSize: 13, fontWeight: 700,
                                  border: `1px solid ${colors.gray.borderMd}`,
                                  borderRadius: 7,
                                  outline: 'none',
                                  textAlign: 'right',
                                  fontVariantNumeric: 'tabular-nums',
                                  fontFamily: 'inherit',
                                }}
                              />
                            </div>
                            {svc?.price != null && svc.price !== it.unitPrice && (
                              <div style={{
                                fontSize: 9, color: colors.gray.dimText, marginTop: 2,
                                textAlign: 'right',
                                textDecoration: 'line-through',
                              }}>
                                normal: {fmtBRL(svc.price)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {error && (
            <div style={{
              marginTop: 14,
              padding: '10px 12px',
              background: 'rgba(220,38,38,0.06)',
              border: `1px solid ${colors.red.border}`,
              borderRadius: 8,
              fontSize: 12,
              color: colors.red.DEFAULT,
              display: 'flex', alignItems: 'center', gap: 7,
            }}>
              <AlertCircle size={14} strokeWidth={2.4} />
              {error}
            </div>
          )}
        </div>

        {/* Footer fixo */}
        <div style={{
          flexShrink: 0,
          padding: '14px 20px',
          paddingBottom: isMobile ? 'calc(14px + env(safe-area-inset-bottom))' : 14,
          borderTop: `1px solid ${colors.gray.border}`,
          background: '#fff',
          display: 'flex', gap: 10,
        }}>
          <button
            onClick={handleClose}
            style={{
              padding: '12px 20px',
              borderRadius: 10,
              border: `1px solid ${colors.gray.borderMd}`,
              background: '#fff',
              fontSize: 13,
              fontWeight: 700,
              color: colors.gray[700],
              cursor: 'pointer',
              fontFamily: 'inherit',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={saving}
            style={{
              flex: 1,
              padding: '12px 20px',
              borderRadius: 10,
              border: 'none',
              background: saving ? colors.gray.borderMd : colors.red.gradient,
              color: '#fff',
              fontSize: 13,
              fontWeight: 800,
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              fontFamily: 'inherit',
              letterSpacing: '.03em',
              textTransform: 'uppercase',
              boxShadow: saving ? 'none' : `0 4px 14px ${colors.red.glow}`,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {saving
              ? <><Loader2 size={14} style={{ animation: 'pkg-spin 0.8s linear infinite' }} />Salvando</>
              : 'Salvar'
            }
          </button>
        </div>
      </div>

      <style>{`@keyframes pkg-spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(content, document.body)
}

const qtyBtnStyle: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 7,
  border: `1px solid ${colors.gray.borderMd}`,
  background: '#fff',
  cursor: 'pointer',
  fontSize: 16, fontWeight: 700,
  color: colors.gray[700],
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: 'inherit',
  flexShrink: 0,
  WebkitTapHighlightColor: 'transparent',
}

function ToggleRow({
  label, desc, value, onChange,
}: {
  label:  string
  desc:   string
  value:  boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      type="button"
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: '10px 12px',
        background: value ? 'rgba(220,38,38,0.04)' : colors.background.page,
        border: `1px solid ${value ? colors.red.border : colors.gray.border}`,
        borderRadius: 10,
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'inherit',
        WebkitTapHighlightColor: 'transparent',
        width: '100%',
      }}
    >
      <div style={{
        width: 36, height: 20, borderRadius: 10,
        background: value ? colors.red.DEFAULT : colors.gray.borderMd,
        position: 'relative', flexShrink: 0, marginTop: 1,
        transition: 'background 0.15s ease',
      }}>
        <div style={{
          width: 16, height: 16, borderRadius: '50%',
          background: '#fff',
          position: 'absolute', top: 2,
          left: value ? 'calc(100% - 18px)' : 2,
          transition: 'left 0.15s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: colors.gray[900] }}>{label}</div>
        <div style={{ fontSize: 10, color: colors.gray.dimText, marginTop: 2 }}>{desc}</div>
      </div>
    </button>
  )
}
