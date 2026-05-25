'use client'
// src/app/dashboard/equipe/components/ProfessionalPanel.tsx

import { useState, useEffect } from 'react'
import {
  ChevronLeft, Phone, Mail, Scissors, Search, Clock,
  Trash2, Save, Check,
} from 'lucide-react'

import api from '@/shared/lib/apiClient'
import { colors, typography, transitions } from '@/shared/theme'
import {
  Professional, ServiceItem, HourSlot,
  CommissionType, CommissionOverride,
} from '@/features/professionals/types'
import { fmtDuration, fmtPrice, fmtCommission } from '@/features/professionals/utils/format'

import Avatar from './Avatar'
import AvatarPicker from './AvatarPicker'
import ServicesPicker from './ServicesPicker'
import HoursEditor from './HoursEditor'
import CommissionEditor from './CommissionEditor'
import ConfirmModal from './ConfirmModal'

type TabId = 'services' | 'hours' | 'commission'

interface Props {
  prof:        Professional
  allServices: ServiceItem[]
  isMobile:    boolean
  onClose:     () => void
  onUpdated:   (p: Professional) => void
  onDeleted:   (id: string) => void
}

export default function ProfessionalPanel({
  prof, allServices, isMobile, onClose, onUpdated, onDeleted,
}: Props) {
  const [tab,        setTab]        = useState<TabId>('services')
  const [editing,    setEditing]    = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [savingHrs,  setSavingHrs]  = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const [deleting,   setDeleting]   = useState(false)

  const [hours,       setHours]       = useState<HourSlot[]>([])
  const [hoursLoaded, setHoursLoaded] = useState(false)

  // ─── Campos editáveis (modo edit) ────────────────────────────────
  const [name,            setName]            = useState(prof.name)
  const [phone,           setPhone]           = useState(prof.phone ?? '')
  const [email,           setEmail]           = useState(prof.email ?? '')
  const [role,            setRole]            = useState(prof.role  ?? '')
  const [description,     setDescription]     = useState(prof.description ?? '')
  const [showInCalendar,  setShowInCalendar]  = useState(prof.showInCalendar  ?? true)
  const [availableOnline, setAvailableOnline] = useState(prof.availableOnline ?? true)
  const [selectedSvcs,    setSelectedSvcs]    = useState<string[]>(
    (prof.services ?? []).map(ps => ps.service.id)
  )
  const [avatarUrl,       setAvatarUrl]       = useState<string | null>(prof.avatarUrl ?? null)

  // ─── Comissão (modo edit) ───────────────────────────────────────
  const [commissionType,  setCommissionType]  = useState<CommissionType | null>(prof.commissionType  ?? null)
  const [commissionValue, setCommissionValue] = useState<number | null>(prof.commissionValue ?? null)
  const [overrides,       setOverrides]       = useState<CommissionOverride[]>(prof.commissionOverrides ?? [])

  // Carrega horários ao abrir aba "hours" (uma vez)
  useEffect(() => {
    if (tab !== 'hours' || hoursLoaded) return
    let cancelled = false
    api.get(`/equipe/${prof.id}/availability`)
      .then(res => {
        if (cancelled) return
        const data = res.data?.data ?? res.data
        setHours(Array.isArray(data) ? data : [])
        setHoursLoaded(true)
      })
      .catch(() => {
        if (!cancelled) setHours([])
      })
    return () => { cancelled = true }
  }, [tab, hoursLoaded, prof.id])

  // ─── Save handlers ──────────────────────────────────────────────
  async function handleSave() {
    if (!name.trim()) return
    try {
      setSaving(true)
      const res = await api.patch(`/equipe/${prof.id}`, {
        name: name.trim(),
        phone: phone || null,
        email: email || null,
        role:  role  || null,
        description: description || null,
        avatarUrl: avatarUrl || null,
        showInCalendar, availableOnline,
        serviceIds: selectedSvcs,
        commissionType,
        commissionValue,
        commissionOverrides: overrides,
      })
      const updated = res.data?.data ?? res.data
      onUpdated(updated)
      setEditing(false)
    } catch {
      // silencioso (TODO: toast)
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveHours() {
    try {
      setSavingHrs(true)
      const res = await api.put(`/equipe/${prof.id}/availability`, { slots: hours })
      const updated = res.data?.data ?? res.data
      if (Array.isArray(updated)) setHours(updated)
    } catch {
      // silencioso
    } finally {
      setSavingHrs(false)
    }
  }

  async function handleDelete() {
    try {
      setDeleting(true)
      await api.delete(`/equipe/${prof.id}`)
      onDeleted(prof.id)
      setConfirmDel(false)
      onClose()
    } catch {
      // silencioso
    } finally {
      setDeleting(false)
    }
  }

  function handleCancelEdit() {
    // Reset pros valores originais
    setName(prof.name)
    setPhone(prof.phone ?? '')
    setEmail(prof.email ?? '')
    setRole(prof.role ?? '')
    setDescription(prof.description ?? '')
    setShowInCalendar(prof.showInCalendar ?? true)
    setAvailableOnline(prof.availableOnline ?? true)
    setSelectedSvcs((prof.services ?? []).map(ps => ps.service.id))
    setAvatarUrl(prof.avatarUrl ?? null)
    setCommissionType(prof.commissionType ?? null)
    setCommissionValue(prof.commissionValue ?? null)
    setOverrides(prof.commissionOverrides ?? [])
    setEditing(false)
  }

  function handleCommissionChange(next: {
    defaultType: CommissionType | null
    defaultValue: number | null
    overrides: CommissionOverride[]
  }) {
    setCommissionType(next.defaultType)
    setCommissionValue(next.defaultValue)
    setOverrides(next.overrides)
  }

  // Subset de serviços que o profissional faz (pros overrides)
  const profServicesForCommission: ServiceItem[] = (prof.services ?? [])
    .map(ps => ({
      id:       ps.service.id,
      name:     ps.service.name,
      duration: ps.service.duration,
      price:    ps.service.price,
      color:    ps.service.color,
    }))

  // Em modo edit usamos os ids selecionados
  const editingServices: ServiceItem[] = editing
    ? allServices.filter(s => selectedSvcs.includes(s.id))
    : profServicesForCommission

  // ─── Styles ─────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '9px 12px',
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
    fontSize: 11,
    fontWeight: 700,
    color: colors.gray.dimText,
    textTransform: 'uppercase',
    letterSpacing: '.07em',
    marginBottom: 5,
  }

  return (
    <>
      {confirmDel && (
        <ConfirmModal
          title="Apagar profissional?"
          body="O profissional será apagado permanentemente. Agendamentos existentes serão mantidos no histórico (sem vínculo)."
          confirmLabel="Sim, apagar"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDel(false)}
          confirming={deleting}
          isMobile={isMobile}
        />
      )}

      <div style={{
        display: 'flex', flexDirection: 'column',
        height: '100%',
        animation: 'eq-slide-in 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      }}>
        <style>{`
          @keyframes eq-slide-in { from { opacity:0; transform: translateX(12px) } to { opacity:1; transform: translateX(0) } }
        `}</style>

        {/* ═══════════ HEADER ═══════════ */}
        <div style={{
          padding: isMobile ? '14px 16px 0' : '20px 24px 0',
          borderBottom: `1px solid ${colors.gray.border}`,
          flexShrink: 0,
        }}>
          {/* Ações topo */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 16,
          }}>
            <button
              onClick={onClose}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600,
                color: colors.gray.dimText,
                padding: 0,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <ChevronLeft size={16} strokeWidth={2.5} />
              Voltar
            </button>

            <div style={{ display: 'flex', gap: 8 }}>
              {editing ? (
                <>
                  <button
                    onClick={handleCancelEdit}
                    style={{
                      padding: '7px 14px', borderRadius: 9,
                      border: `1px solid ${colors.gray.borderMd}`,
                      background: 'transparent',
                      fontSize: 13, cursor: 'pointer',
                      color: colors.gray.dimText, fontWeight: 600,
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !name.trim()}
                    style={{
                      padding: '7px 16px', borderRadius: 9,
                      border: 'none',
                      background: saving ? colors.gray.borderMd : colors.red.gradient,
                      color: saving ? colors.gray.dimText : '#fff',
                      fontSize: 13,
                      cursor: saving ? 'not-allowed' : 'pointer',
                      fontWeight: 700,
                      display: 'flex', alignItems: 'center', gap: 6,
                      boxShadow: saving ? 'none' : `0 3px 10px ${colors.red.glow}`,
                    }}
                  >
                    <Save size={13} strokeWidth={2} />
                    {saving ? 'Salvando...' : 'Salvar'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setConfirmDel(true)}
                    aria-label="Apagar"
                    style={{
                      padding: '7px 12px', borderRadius: 9,
                      border: `1px solid rgba(220,38,38,0.2)`,
                      background: 'rgba(220,38,38,0.06)',
                      color: colors.red.DEFAULT,
                      fontSize: 13, cursor: 'pointer',
                      display: 'flex', alignItems: 'center',
                    }}
                  >
                    <Trash2 size={13} strokeWidth={2} />
                  </button>
                  <button
                    onClick={() => setEditing(true)}
                    style={{
                      padding: '7px 16px', borderRadius: 9,
                      border: `1px solid ${colors.gray.borderMd}`,
                      background: 'transparent',
                      color: colors.gray[700],
                      fontSize: 13, cursor: 'pointer', fontWeight: 600,
                    }}
                  >
                    Editar
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Perfil */}
          <div style={{
            display: 'flex',
            alignItems: editing ? 'flex-start' : 'center',
            gap: 16,
            marginBottom: 16,
          }}>
            <div style={{ flexShrink: 0 }}>
              {editing
                ? <AvatarPicker name={name} current={avatarUrl} onChange={setAvatarUrl} />
                : <Avatar name={prof.name} size={isMobile ? 56 : 64} url={prof.avatarUrl} />
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {editing ? (
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Nome do profissional"
                  style={{ ...inputStyle, fontSize: 16, fontWeight: 700, marginBottom: 6 }}
                />
              ) : (
                <div style={{
                  fontSize: isMobile ? 17 : 18,
                  fontWeight: 700,
                  color: colors.gray[900],
                  letterSpacing: '-0.02em',
                  marginBottom: 4,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {prof.name}
                </div>
              )}

              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '3px 10px', borderRadius: 20,
                background: prof.active ? 'rgba(22,163,74,0.08)' : 'rgba(0,0,0,0.05)',
                border: `1px solid ${prof.active ? 'rgba(22,163,74,0.2)' : 'rgba(0,0,0,0.08)'}`,
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: prof.active ? '#16a34a' : colors.gray.dimText,
                }} />
                <span style={{
                  fontSize: 12, fontWeight: 600,
                  color: prof.active ? '#15803d' : colors.gray.dimText,
                }}>
                  {prof.active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
          </div>

          {/* Campos extras no modo edit */}
          {editing && (
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 10,
              marginBottom: 16,
              padding: '14px',
              borderRadius: 12,
              background: colors.background.page,
              border: `1px solid ${colors.gray.border}`,
            }}>
              <div>
                <label style={labelStyle}>Cargo</label>
                <input
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  style={inputStyle}
                  placeholder="Ex: Barbeiro, Recepcionista"
                />
              </div>

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

              {/* Checkboxes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
                {[
                  { label: 'Mostrar no calendário',                  sub: 'O profissional aparece na agenda',           val: showInCalendar,  set: setShowInCalendar  },
                  { label: 'Disponível para agendamentos online',    sub: 'Clientes podem agendar pelo link público',    val: availableOnline, set: setAvailableOnline },
                ].map(({ label, sub, val, set }) => (
                  <button
                    key={label}
                    onClick={() => set(!val)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: 0, textAlign: 'left',
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
            </div>
          )}

          {/* Contatos (modo leitura) */}
          {!editing && (prof.phone || prof.email || prof.role) && (
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 5,
              marginBottom: 14,
            }}>
              {prof.role  && <div style={{ fontSize: 13, color: colors.gray.dimText, fontWeight: 600 }}>{prof.role}</div>}
              {prof.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: colors.gray.dimText }}><Phone size={12} strokeWidth={2}/>{prof.phone}</div>}
              {prof.email && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: colors.gray.dimText }}><Mail size={12} strokeWidth={2}/>{prof.email}</div>}
            </div>
          )}

          {/* Tabs */}
          <div style={{
            display: 'flex',
            gap: 0,
            marginBottom: -1,
            overflowX: 'auto',
            scrollbarWidth: 'none',
          }}>
            <style>{`.eq-tabs-scroll::-webkit-scrollbar{display:none}`}</style>
            {([
              { id: 'services',   label: `Serviços (${(prof.services ?? []).length})` },
              { id: 'hours',      label: isMobile ? 'Horários' : 'Horário de trabalho' },
              { id: 'commission', label: 'Comissão' },
            ] as Array<{ id: TabId; label: string }>).map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: '10px 16px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: typography.fontFamily,
                  color: tab === t.id ? colors.red.DEFAULT : colors.gray.dimText,
                  borderBottom: tab === t.id
                    ? `2px solid ${colors.red.DEFAULT}`
                    : '2px solid transparent',
                  transition: `all ${transitions.fast}`,
                  letterSpacing: '.04em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ═══════════ CONTEÚDO ═══════════ */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: isMobile ? '14px 16px' : '16px 24px',
          WebkitOverflowScrolling: 'touch',
        }}>
          {tab === 'services' && (
            editing
              ? <ServicesPicker
                  selected={selectedSvcs}
                  allServices={allServices}
                  onChange={setSelectedSvcs}
                />
              : <ServicesReadOnly services={profServicesForCommission} />
          )}

          {tab === 'hours' && (
            <div>
              <HoursEditor slots={hours} onChange={setHours} />
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleSaveHours}
                  disabled={savingHrs}
                  style={{
                    padding: '10px 22px', borderRadius: 10,
                    border: 'none',
                    background: savingHrs ? colors.gray.borderMd : colors.red.gradient,
                    color: savingHrs ? colors.gray.dimText : '#fff',
                    fontSize: 13,
                    cursor: savingHrs ? 'not-allowed' : 'pointer',
                    fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: 7,
                    boxShadow: savingHrs ? 'none' : `0 3px 10px ${colors.red.glow}`,
                  }}
                >
                  <Save size={13} strokeWidth={2} />
                  {savingHrs ? 'Salvando...' : 'Salvar horários'}
                </button>
              </div>
            </div>
          )}

          {tab === 'commission' && (
            editing ? (
              <CommissionEditor
                defaultType={commissionType}
                defaultValue={commissionValue}
                overrides={overrides}
                allServices={editingServices}
                onChange={handleCommissionChange}
              />
            ) : (
              <CommissionReadOnly
                defaultType={prof.commissionType ?? null}
                defaultValue={prof.commissionValue ?? null}
                overrides={prof.commissionOverrides ?? []}
                profServices={profServicesForCommission}
              />
            )
          )}
        </div>
      </div>
    </>
  )
}

// ─── ReadOnly Subcomponents ─────────────────────────────────────────

function ServicesReadOnly({ services }: { services: ServiceItem[] }) {
  const [q, setQ] = useState('')
  const filtered = services.filter(s => s.name.toLowerCase().includes(q.toLowerCase()))

  if (services.length === 0) return (
    <div style={{ padding: '32px 0', textAlign: 'center' }}>
      <Scissors size={28} color={colors.gray.dimText} style={{ opacity: 0.3, marginBottom: 10 }} />
      <div style={{ fontSize: 14, color: colors.gray.dimText }}>Nenhum serviço vinculado</div>
    </div>
  )

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '9px 12px',
        borderRadius: 10,
        background: colors.background.page,
        border: `1px solid ${colors.gray.borderMd}`,
        marginBottom: 12,
      }}>
        <Search size={13} color={colors.gray.dimText} />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Pesquisar serviços..."
          style={{
            flex: 1, border: 'none', outline: 'none',
            fontSize: 13, background: 'transparent',
            fontFamily: typography.fontFamily,
            color: colors.gray[900],
          }}
        />
      </div>
      {filtered.map(s => (
        <div key={s.id} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 0',
          borderBottom: `1px solid ${colors.gray.border}`,
        }}>
          <div style={{
            width: 3, height: 34, borderRadius: 2,
            background: s.color ?? colors.red.DEFAULT,
            flexShrink: 0,
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: colors.gray[900] }}>{s.name}</div>
            <div style={{
              fontSize: 11, color: colors.gray.dimText, marginTop: 1,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <Clock size={10} strokeWidth={2} />
              {fmtDuration(s.duration)}
            </div>
          </div>
          {s.price != null && (
            <span style={{
              fontSize: 13, fontWeight: 700,
              color: colors.gray[900],
              fontVariantNumeric: 'tabular-nums',
              flexShrink: 0,
            }}>
              {fmtPrice(s.price)}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

function CommissionReadOnly({
  defaultType, defaultValue, overrides, profServices,
}: {
  defaultType:  CommissionType | null
  defaultValue: number | null
  overrides:    CommissionOverride[]
  profServices: ServiceItem[]
}) {
  if (defaultType == null && overrides.length === 0) return (
    <div style={{ padding: '32px 0', textAlign: 'center' }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>💰</div>
      <div style={{ fontSize: 14, color: colors.gray.dimText, marginBottom: 4 }}>
        Nenhuma comissão configurada
      </div>
      <div style={{ fontSize: 12, color: colors.gray.dimTextLight }}>
        Clique em &ldquo;Editar&rdquo; para definir
      </div>
    </div>
  )

  return (
    <div>
      {defaultType != null && defaultValue != null && (
        <div style={{
          padding: '12px 14px',
          background: colors.background.page,
          border: `1px solid ${colors.gray.border}`,
          borderRadius: 10,
          marginBottom: overrides.length > 0 ? 16 : 0,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700,
            color: colors.gray.dimText,
            textTransform: 'uppercase',
            letterSpacing: '.06em',
            marginBottom: 4,
          }}>
            Comissão padrão
          </div>
          <div style={{
            fontSize: 18, fontWeight: 700,
            color: colors.red.DEFAULT,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.01em',
          }}>
            {fmtCommission(defaultType, defaultValue)}
          </div>
        </div>
      )}

      {overrides.length > 0 && (
        <div>
          <div style={{
            fontSize: 11, fontWeight: 700,
            color: colors.gray.dimText,
            textTransform: 'uppercase',
            letterSpacing: '.06em',
            marginBottom: 10,
          }}>
            Comissões específicas
          </div>
          {overrides.map(o => {
            const service = profServices.find(s => s.id === o.serviceId)
            if (!service) return null
            return (
              <div key={o.serviceId} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 0',
                borderBottom: `1px solid ${colors.gray.border}`,
              }}>
                <div style={{
                  width: 3, height: 28, borderRadius: 2,
                  background: service.color ?? colors.red.DEFAULT,
                  flexShrink: 0,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 600, color: colors.gray[900],
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {service.name}
                  </div>
                </div>
                <span style={{
                  fontSize: 14, fontWeight: 700,
                  color: colors.red.DEFAULT,
                  fontVariantNumeric: 'tabular-nums',
                  flexShrink: 0,
                }}>
                  {fmtCommission(o.commissionType, o.commissionValue)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
