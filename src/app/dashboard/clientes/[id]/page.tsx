'use client'
// src/app/dashboard/clientes/[id]/page.tsx

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ChevronLeft, Phone, Calendar, Trash2, TrendingUp, Star,
} from 'lucide-react'

import api from '@/shared/lib/apiClient'
import { colors, typography, radius, shadows, transitions, glass } from '@/shared/theme'
import { useDeviceMode } from '@/features/agenda/hooks/useDeviceMode'
import { getInitials, formatPhone, maskPhone, fmtRevenue } from '@/features/clients/utils/format'

import EditableField from './components/EditableField'
import DeleteModal   from './components/DeleteModal'
import BookingRow, { BookingItem } from './components/BookingRow'

import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
dayjs.locale('pt-br')

interface Metrics {
  totalBookings:   number
  completed:       number
  canceled:        number
  confirmed:       number
  noShows:         number
  totalRevenue:    number
  lastVisit:       string | null
  favoriteService: string | null
  avgMonthly:      number
}

interface ClientProfile {
  id:        string
  name:      string
  phone:     string
  email:     string | null
  cpf:       string | null
  createdAt: string
  metrics:   Metrics
  bookings:  BookingItem[]
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ClientProfilePage() {
  const router = useRouter()
  const params = useParams()
  const id     = params?.id as string
  const mode   = useDeviceMode()
  const isMobile = mode === 'mobile'

  const [client,     setClient]     = useState<ClientProfile | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [tab,        setTab]        = useState<'bookings' | 'info'>('bookings')
  const [showDelete, setShowDelete] = useState(false)
  const [deleting,   setDeleting]   = useState(false)
  const [toast,      setToast]      = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  function showToast(msg: string, type: 'success' | 'error') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ─── Fetch profile ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return
    let cancelled = false

    api.get(`/clients/${id}`)
      .then(res => { if (!cancelled) setClient(res.data?.data ?? res.data) })
      .catch(()  => { if (!cancelled) setClient(null) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [id])

  // ─── Handlers ───────────────────────────────────────────────────────────
  async function handleUpdate(field: 'name' | 'phone' | 'email' | 'cpf', value: string) {
    const payload =
      field === 'phone' ? { phone: value.replace(/\D/g, '') } :
      field === 'cpf'   ? { cpf:   value.replace(/\D/g, '') || null } :
      field === 'email' ? { email: value.trim() || null } :
                          { name:  value }
    const res = await api.put(`/clients/${id}`, payload)
    const updated = res.data?.data ?? res.data
    setClient(prev => prev ? { ...prev, [field]: updated[field] } : prev)
    showToast('Dados atualizados!', 'success')
  }

  async function handleDelete() {
    try {
      setDeleting(true)
      await api.delete(`/clients/${id}`)
      router.push('/dashboard/clientes')
    } catch {
      showToast('Erro ao apagar cliente', 'error')
      setDeleting(false)
    }
  }

  // ─── Loading / not found ────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        border: `3px solid ${colors.red.subtle}`,
        borderTopColor: colors.red.DEFAULT,
        animation: 'spin 0.8s linear infinite',
      }} />
    </div>
  )

  if (!client) return (
    <div style={{ textAlign: 'center', padding: 80 }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>😕</div>
      <div style={{ fontSize: 16, fontWeight: typography.weight.semibold, color: typography.color.primary, marginBottom: 12 }}>
        Cliente não encontrado
      </div>
      <button
        onClick={() => router.back()}
        style={{
          padding: '8px 16px',
          borderRadius: radius.sm,
          border: `1px solid ${colors.gray.borderMd}`,
          background: 'transparent',
          cursor: 'pointer',
          fontSize: typography.scale.base,
          color: typography.color.secondary,
        }}
      >
        Voltar
      </button>
    </div>
  )

  const { metrics, bookings } = client

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes fadeUp{from{opacity:0; transform:translateY(10px)} to{opacity:1; transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes toastIn{from{opacity:0; transform:translateX(-50%) translateY(8px)} to{opacity:1; transform:translateX(-50%) translateY(0)}}
        .bk-row-host:not(:last-child){ border-bottom: 1px solid ${colors.gray.border} }
        .bk-row-host:hover{ background:${colors.red.subtle} }
        .pr-tab{
          flex:1; padding:10px; border:none; background:transparent;
          font-size:${typography.scale.sm}px; font-weight:${typography.weight.bold};
          letter-spacing:.06em; text-transform:uppercase; cursor:pointer;
          color:${colors.gray.dimText}; border-bottom:2px solid transparent;
          transition: all ${transitions.fast};
          font-family:${typography.fontFamily};
          -webkit-tap-highlight-color: transparent;
        }
        .pr-tab.active{ color:${colors.red.DEFAULT}; border-bottom-color:${colors.red.DEFAULT} }
        .back-btn:hover{ background:${colors.red.subtle} !important }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%',
          transform: 'translateX(-50%)',
          padding: '11px 20px',
          borderRadius: radius.md,
          background: toast.type === 'success'
            ? 'linear-gradient(135deg, #22c55e, #16a34a)'
            : 'linear-gradient(135deg, #dc2626, #b91c1c)',
          color: '#fff',
          fontSize: typography.scale.base,
          fontWeight: typography.weight.semibold,
          boxShadow: shadows.lg,
          zIndex: 9999, whiteSpace: 'nowrap',
          animation: 'toastIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
          fontFamily: typography.fontFamily,
        }}>
          {toast.msg}
        </div>
      )}

      {showDelete && (
        <DeleteModal
          name={client.name}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
          deleting={deleting}
          isMobile={isMobile}
        />
      )}

      <div style={{
        maxWidth: 760,
        padding: isMobile ? '0 12px' : 0,
        animation: 'fadeUp 0.3s ease',
        fontFamily: typography.fontFamily,
      }}>

        {/* ═══════════════════════ HEADER ═══════════════════════ */}
        {isMobile ? (
          // Mobile: top-bar slim com voltar/apagar + bloco central com avatar e nome
          <>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 12,
            }}>
              <button
                className="back-btn"
                onClick={() => router.push('/dashboard/clientes')}
                aria-label="Voltar"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 36, height: 36,
                  borderRadius: radius.sm,
                  border: `1px solid ${colors.gray.borderMd}`,
                  background: glass.surface.default.background,
                  cursor: 'pointer',
                  transition: transitions.fast,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <ChevronLeft size={20} color={colors.gray.dimText} strokeWidth={2} />
              </button>

              <button
                onClick={() => setShowDelete(true)}
                aria-label="Apagar cliente"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 36, height: 36,
                  borderRadius: radius.sm,
                  border: `1px solid rgba(220,38,38,0.2)`,
                  background: 'rgba(220,38,38,0.06)',
                  color: colors.red.DEFAULT,
                  cursor: 'pointer',
                  transition: transitions.fast,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <Trash2 size={16} strokeWidth={2} />
              </button>
            </div>

            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              marginBottom: 16, textAlign: 'center', gap: 6,
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: radius.full,
                background: colors.red.gradient,
                color: '#fff',
                fontSize: 22, fontWeight: typography.weight.bold,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: shadows.redMd,
                letterSpacing: '-0.02em',
              }}>
                {getInitials(client.name)}
              </div>

              <h2 style={{
                margin: 0,
                fontSize: 20,
                fontWeight: typography.weight.bold,
                letterSpacing: '-0.02em',
                color: typography.color.primary,
                lineHeight: 1.2,
              }}>
                {client.name}
              </h2>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: typography.scale.sm, color: typography.color.muted, fontVariantNumeric: 'tabular-nums' }}>
                  <Phone size={12} color={colors.gray.dimText} strokeWidth={2} />
                  {formatPhone(client.phone)}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: typography.scale.sm, color: typography.color.muted }}>
                  <Calendar size={12} color={colors.gray.dimText} strokeWidth={2} />
                  Desde {dayjs(client.createdAt).format('MMM/YY')}
                </span>
              </div>

              {metrics.lastVisit && (
                <div style={{ fontSize: typography.scale.xs, color: typography.color.muted, marginTop: 2 }}>
                  Última visita: <strong style={{ color: typography.color.primary }}>{dayjs(metrics.lastVisit).format('DD/MM/YYYY')}</strong>
                </div>
              )}
            </div>
          </>
        ) : (
          // Desktop: layout horizontal (mantido)
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 22 }}>
            <button
              className="back-btn"
              onClick={() => router.push('/dashboard/clientes')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 34, height: 34,
                borderRadius: radius.sm,
                border: `1px solid ${colors.gray.borderMd}`,
                background: glass.surface.default.background,
                cursor: 'pointer', flexShrink: 0,
                transition: transitions.fast,
                marginTop: 6,
              }}
            >
              <ChevronLeft size={18} color={colors.gray.dimText} strokeWidth={2} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 0 }}>
              <div style={{
                width: 60, height: 60, borderRadius: radius.full,
                background: colors.red.gradient,
                color: '#fff',
                fontSize: 22, fontWeight: typography.weight.bold,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                boxShadow: shadows.redMd,
              }}>
                {getInitials(client.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{
                  margin: 0,
                  fontSize: typography.scale['2xl'],
                  fontWeight: typography.weight.bold,
                  letterSpacing: '-0.025em',
                  color: typography.color.primary,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {client.name}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: typography.scale.base, color: typography.color.muted }}>
                    <Phone size={13} color={colors.gray.dimText} /> {formatPhone(client.phone)}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: typography.scale.base, color: typography.color.muted }}>
                    <Calendar size={13} color={colors.gray.dimText} /> Cliente desde {dayjs(client.createdAt).format('MMM YYYY')}
                  </span>
                </div>
                {metrics.lastVisit && (
                  <div style={{ marginTop: 3, fontSize: typography.scale.sm, color: typography.color.muted }}>
                    Última visita: <strong style={{ color: typography.color.primary }}>{dayjs(metrics.lastVisit).format('DD [de] MMMM [de] YYYY')}</strong>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowDelete(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px',
                borderRadius: radius.sm,
                border: `1px solid rgba(220,38,38,0.2)`,
                background: 'rgba(220,38,38,0.06)',
                color: colors.red.DEFAULT,
                fontSize: typography.scale.sm,
                fontWeight: typography.weight.semibold,
                cursor: 'pointer',
                flexShrink: 0,
                transition: transitions.fast,
                marginTop: 6,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.12)'; e.currentTarget.style.borderColor = colors.red.borderHover }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.06)'; e.currentTarget.style.borderColor = 'rgba(220,38,38,0.2)' }}
            >
              <Trash2 size={14} strokeWidth={2} /> Apagar
            </button>
          </div>
        )}

        {/* ═══════════════════════ MÉTRICAS ═══════════════════════ */}
        {isMobile ? (
          // Mobile: 1x2 só Concluídos + Receita
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            <div style={{
              padding: '12px 14px',
              borderRadius: radius.md,
              background: glass.surface.default.background,
              backdropFilter: glass.surface.default.backdropFilter,
              border: `1px solid ${colors.gray.border}`,
              boxShadow: shadows.sm,
            }}>
              <div style={{
                fontSize: typography.scale.xs,
                fontWeight: typography.weight.bold,
                color: typography.color.muted,
                textTransform: 'uppercase',
                letterSpacing: '.06em',
                marginBottom: 4,
              }}>Concluídos</div>
              <div style={{
                fontSize: 22,
                fontWeight: typography.weight.bold,
                color: colors.slate.DEFAULT,
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1,
              }}>{metrics.completed}</div>
              <div style={{ fontSize: typography.scale.xs, color: typography.color.muted, marginTop: 3 }}>
                de {metrics.totalBookings} total
              </div>
            </div>

            <div style={{
              padding: '12px 14px',
              borderRadius: radius.md,
              background: glass.surface.default.background,
              backdropFilter: glass.surface.default.backdropFilter,
              border: `1px solid ${colors.gray.border}`,
              boxShadow: shadows.sm,
            }}>
              <div style={{
                fontSize: typography.scale.xs,
                fontWeight: typography.weight.bold,
                color: typography.color.muted,
                textTransform: 'uppercase',
                letterSpacing: '.06em',
                marginBottom: 4,
              }}>Receita</div>
              <div style={{
                fontSize: 22,
                fontWeight: typography.weight.bold,
                color: colors.red.DEFAULT,
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1,
              }}>
                {metrics.totalRevenue > 0
                  ? `R$ ${metrics.totalRevenue.toFixed(2).replace('.', ',')}`
                  : '—'
                }
              </div>
              <div style={{ fontSize: typography.scale.xs, color: typography.color.muted, marginTop: 3 }}>
                gerado
              </div>
            </div>
          </div>
        ) : (
          // Desktop: 4 cards (mantido)
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Agendamentos', value: String(metrics.totalBookings), sub: 'total',      color: typography.color.primary },
              { label: 'Concluídos',   value: String(metrics.completed),     sub: 'realizados', color: colors.slate.DEFAULT },
              { label: 'Cancelados',   value: String(metrics.canceled),      sub: 'vezes',      color: typography.color.muted },
              { label: 'Receita',      value: fmtRevenue(metrics.totalRevenue), sub: 'gerado',  color: colors.red.DEFAULT },
            ].map(m => (
              <div key={m.label} style={{
                padding: '14px 16px',
                borderRadius: radius.lg,
                background: glass.surface.default.background,
                backdropFilter: glass.surface.default.backdropFilter,
                border: `1px solid ${colors.gray.border}`,
                boxShadow: shadows.sm,
              }}>
                <div style={{
                  fontSize: typography.scale.xs,
                  fontWeight: typography.weight.bold,
                  color: typography.color.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '.07em',
                  marginBottom: 6,
                }}>{m.label}</div>
                <div style={{
                  fontSize: 20,
                  fontWeight: typography.weight.bold,
                  color: m.color,
                  fontVariantNumeric: 'tabular-nums',
                }}>{m.value}</div>
                <div style={{ fontSize: typography.scale.xs, color: typography.color.muted, marginTop: 2 }}>
                  {m.sub}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══════════════════════ INSIGHTS ═══════════════════════ */}
        {(metrics.favoriteService || metrics.avgMonthly > 0) && (
          <div style={{
            display: 'flex',
            gap: isMobile ? 6 : 10,
            marginBottom: isMobile ? 14 : 20,
            flexWrap: 'wrap',
          }}>
            {metrics.favoriteService && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: isMobile ? '6px 10px' : '8px 14px',
                borderRadius: radius.full,
                background: colors.red.subtle,
                border: `1px solid ${colors.red.border}`,
              }}>
                <Star size={12} color={colors.red.DEFAULT} fill={colors.red.DEFAULT} />
                <span style={{
                  fontSize: typography.scale.sm,
                  fontWeight: typography.weight.semibold,
                  color: colors.red.dark,
                }}>
                  {isMobile ? metrics.favoriteService : `Serviço favorito: ${metrics.favoriteService}`}
                </span>
              </div>
            )}
            {metrics.avgMonthly > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: isMobile ? '6px 10px' : '8px 14px',
                borderRadius: radius.full,
                background: colors.slate.subtle,
                border: `1px solid ${colors.slate.border}`,
              }}>
                <TrendingUp size={12} color={colors.slate.DEFAULT} />
                <span style={{
                  fontSize: typography.scale.sm,
                  fontWeight: typography.weight.semibold,
                  color: colors.slate.dark,
                }}>
                  {metrics.avgMonthly}x/mês
                </span>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════ TABS ═══════════════════════ */}
        <div style={{
          background: glass.surface.default.background,
          backdropFilter: glass.surface.default.backdropFilter,
          borderRadius: radius.xl,
          border: `1px solid ${colors.gray.border}`,
          boxShadow: shadows.sm,
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex',
            borderBottom: `1px solid ${colors.gray.border}`,
            padding: '0 4px',
          }}>
            <button
              className={`pr-tab${tab === 'bookings' ? ' active' : ''}`}
              onClick={() => setTab('bookings')}
            >
              Agendamentos ({bookings.length})
            </button>
            <button
              className={`pr-tab${tab === 'info' ? ' active' : ''}`}
              onClick={() => setTab('info')}
            >
              Informações
            </button>
          </div>

          {tab === 'bookings' ? (
            bookings.length === 0 ? (
              <div style={{
                padding: isMobile ? '36px 24px' : '48px 32px',
                textAlign: 'center',
                color: typography.color.muted,
              }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>📅</div>
                <div style={{
                  fontSize: typography.scale.md,
                  fontWeight: typography.weight.semibold,
                  color: typography.color.primary,
                  marginBottom: 4,
                }}>
                  Nenhum agendamento
                </div>
                <div style={{ fontSize: typography.scale.sm }}>
                  Os agendamentos deste cliente aparecerão aqui.
                </div>
              </div>
            ) : (
              <div>
                {bookings.map(b => (
                  <div key={b.id} className="bk-row-host">
                    <BookingRow booking={b} isMobile={isMobile} />
                  </div>
                ))}
              </div>
            )
          ) : (
            // ─── Tab Informações ─────────────────────────────────────────
            <div style={{ padding: isMobile ? '12px' : '4px 20px 20px' }}>
              <EditableField
                label="Nome completo"
                value={client.name}
                onSave={v => handleUpdate('name', v)}
                isMobile={isMobile}
              />
              <EditableField
                label="Telefone"
                value={formatPhone(client.phone)}
                onSave={v => handleUpdate('phone', v)}
                mask={maskPhone}
                isMobile={isMobile}
                inputMode="tel"
              />
              <EditableField
                label="Email"
                value={client.email ?? ''}
                onSave={v => handleUpdate('email', v)}
                isMobile={isMobile}
                inputMode="email"
              />
              <EditableField
                label="CPF"
                value={client.cpf ?? ''}
                onSave={v => handleUpdate('cpf', v)}
                isMobile={isMobile}
                inputMode="numeric"
              />

              {/* Campos readonly — futuros */}
              {([
                { label: 'Cliente desde',      value: dayjs(client.createdAt).format(isMobile ? 'DD/MM/YYYY' : 'DD [de] MMMM [de] YYYY') },
                { label: 'Cliente confiável',  value: 'Não' },
                { label: 'Desconto',           value: 'Sem desconto' },
              ] as const).map(f => (
                isMobile ? (
                  <div key={f.label} style={{
                    background: 'rgba(255,255,255,0.85)',
                    borderRadius: radius.md,
                    border: `1px solid ${colors.gray.border}`,
                    padding: '12px 14px',
                    marginBottom: 8,
                    opacity: 0.7,
                  }}>
                    <div style={{
                      fontSize: typography.scale.xs,
                      fontWeight: typography.weight.bold,
                      color: typography.color.muted,
                      textTransform: 'uppercase',
                      letterSpacing: '.06em',
                      marginBottom: 6,
                    }}>{f.label}</div>
                    <div style={{
                      fontSize: typography.scale.lg,
                      fontWeight: typography.weight.semibold,
                      color: typography.color.primary,
                    }}>{f.value}</div>
                  </div>
                ) : (
                  <div key={f.label} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 0',
                    borderBottom: `1px solid ${colors.gray.border}`,
                  }}>
                    <span style={{ fontSize: typography.scale.base, color: typography.color.muted }}>{f.label}</span>
                    <span style={{
                      fontSize: typography.scale.base,
                      fontWeight: typography.weight.semibold,
                      color: typography.color.primary,
                    }}>{f.value}</span>
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
