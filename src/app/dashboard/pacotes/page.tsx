'use client'
// src/app/dashboard/pacotes/page.tsx
//
// Página de Pacotes — 2 abas: "Gerenciar Pacotes" (templates) + "Adquiridos" (cartões)

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Search, X, Plus, Package as PackageIcon, ChevronRight, Loader2,
} from 'lucide-react'

import api from '@/shared/lib/apiClient'
import { colors, typography, transitions } from '@/shared/theme'
import { useDeviceMode } from '@/features/agenda/hooks/useDeviceMode'
import { ServicePackage, PackageCard, CardsListResponse } from '@/features/packages/types'
import {
  fmtBRL, fmtDate, describeValidity, STATUS_LABEL, STATUS_COLOR,
  formatCardNumber, getCardBalance,
} from '@/features/packages/utils/format'

import PackageEditorModal from './components/PackageEditorModal'
import CardDetailModal from './components/CardDetailModal'
import Toast, { ToastKind } from './components/Toast'

type Tab = 'manage' | 'acquired'

export default function PacotesPage() {
  const mode = useDeviceMode()
  const isMobile = mode === 'mobile'

  const [tab, setTab] = useState<Tab>('manage')
  const [toast, setToast] = useState<{ message: string; kind: ToastKind } | null>(null)

  return (
    <>
      <style>{`
        @keyframes pkg-fade-up { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pkg-spin    { to { transform: rotate(360deg) } }
      `}</style>

      {toast && (
        <Toast message={toast.message} kind={toast.kind} onClose={() => setToast(null)} />
      )}

      <div style={{
        padding: isMobile ? '0 12px' : 0,
        animation: 'pkg-fade-up 380ms cubic-bezier(0.22, 1, 0.36, 1) both',
        fontFamily: typography.fontFamily,
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          marginBottom: isMobile ? 14 : 18,
          gap: 12,
        }}>
          <div style={{ minWidth: 0 }}>
            <h2 style={{
              fontSize: isMobile ? 22 : typography.scale['2xl'],
              fontWeight: 700,
              letterSpacing: '-0.025em',
              color: typography.color.primary,
              margin: 0,
              lineHeight: 1.2,
            }}>
              Pacotes
            </h2>
            {!isMobile && (
              <p style={{ fontSize: 14, color: typography.color.muted, margin: '4px 0 0' }}>
                {tab === 'manage'
                  ? 'Gerencie os pacotes vendíveis do seu negócio'
                  : 'Cartões adquiridos pelos clientes'
                }
              </p>
            )}
          </div>
        </div>

        {/* Abas */}
        <div style={{
          display: 'flex', gap: 4, padding: 4,
          background: 'rgba(255,255,255,0.65)',
          backdropFilter: 'blur(12px)',
          borderRadius: 12,
          border: `1px solid ${colors.gray.border}`,
          marginBottom: 14,
        }}>
          <TabBtn label="Gerenciar pacotes" active={tab === 'manage'}  onClick={() => setTab('manage')} />
          <TabBtn label="Adquiridos"        active={tab === 'acquired'} onClick={() => setTab('acquired')} />
        </div>

        {tab === 'manage'
          ? <ManageTab isMobile={isMobile} onToast={setToast} />
          : <AcquiredTab isMobile={isMobile} onToast={setToast} />
        }
      </div>
    </>
  )
}

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '10px 14px',
        borderRadius: 9,
        border: 'none',
        background: active ? '#fff' : 'transparent',
        color: active ? colors.gray[900] : colors.gray.dimText,
        fontWeight: active ? 700 : 600,
        fontSize: 13,
        cursor: 'pointer',
        transition: `all ${transitions.fast}`,
        boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
        fontFamily: 'inherit',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {label}
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// ABA 1: Gerenciar pacotes (templates)
// ═══════════════════════════════════════════════════════════════════════════
function ManageTab({
  isMobile, onToast,
}: {
  isMobile: boolean
  onToast:  (t: { message: string; kind: ToastKind }) => void
}) {
  const [packages, setPackages] = useState<ServicePackage[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ServicePackage | null>(null)

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await api.get('/packages', { signal })
      if (signal?.aborted) return
      const data = res.data?.data ?? res.data
      setPackages(Array.isArray(data) ? data : [])
    } catch {
      if (!signal?.aborted) setPackages([])
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const ctrl = new AbortController()
    fetchData(ctrl.signal)
    return () => ctrl.abort()
  }, [fetchData])

  const filtered = useMemo(() => {
    if (!query.trim()) return packages
    const q = query.trim().toLowerCase()
    return packages.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.description ?? '').toLowerCase().includes(q),
    )
  }, [packages, query])

  function handleAdd() {
    setEditing(null)
    setModalOpen(true)
  }

  function handleEdit(p: ServicePackage) {
    setEditing(p)
    setModalOpen(true)
  }

  function handleSaved(saved: ServicePackage) {
    setPackages(prev => {
      const exists = prev.find(p => p.id === saved.id)
      if (exists) return prev.map(p => p.id === saved.id ? saved : p)
      return [saved, ...prev]
    })
    onToast({ message: editing ? 'Pacote atualizado' : 'Pacote criado', kind: 'success' })
  }

  return (
    <>
      {modalOpen && (
        <PackageEditorModal
          package_={editing}
          isMobile={isMobile}
          onSaved={handleSaved}
          onClose={() => { setModalOpen(false); setTimeout(() => setEditing(null), 200) }}
        />
      )}

      {/* Busca + botão novo */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <div style={{
          flex: 1,
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px',
          borderRadius: 12,
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${colors.gray.borderMd}`,
        }}>
          <Search size={14} color={colors.gray.dimText} strokeWidth={2} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar pacote..."
            inputMode="search"
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontSize: 14, background: 'transparent',
              color: colors.gray[900],
              fontFamily: 'inherit',
              minWidth: 0,
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              aria-label="Limpar"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: 4, display: 'flex',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <X size={13} color={colors.gray.dimText} />
            </button>
          )}
        </div>
        <button
          onClick={handleAdd}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: isMobile ? '10px 14px' : '10px 18px',
            borderRadius: 12,
            border: 'none',
            background: colors.red.gradient,
            color: '#fff',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: `0 4px 14px ${colors.red.glow}`,
            letterSpacing: '.02em',
            flexShrink: 0,
            WebkitTapHighlightColor: 'transparent',
            fontFamily: 'inherit',
          }}
        >
          <Plus size={15} strokeWidth={2.5} />
          {isMobile ? 'Novo' : 'Novo pacote'}
        </button>
      </div>

      {loading ? (
        <LoadingState />
      ) : packages.length === 0 ? (
        <EmptyState
          title="Nenhum pacote cadastrado"
          subtitle="Crie pacotes combinando vários serviços com desconto para fidelizar seus clientes."
          ctaLabel="+ Criar primeiro pacote"
          onCta={handleAdd}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Nenhum pacote encontrado"
          subtitle={`Nenhum pacote corresponde a "${query}".`}
        />
      ) : (
        <div style={{
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: 'blur(20px) saturate(160%)',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.60)',
          boxShadow: '0 2px 0 rgba(255,255,255,0.85) inset, 0 8px 28px rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}>
          {filtered.map((p, i) => (
            <PackageRow
              key={p.id}
              pkg={p}
              isMobile={isMobile}
              isLast={i === filtered.length - 1}
              onClick={() => handleEdit(p)}
            />
          ))}
        </div>
      )}
    </>
  )
}

function PackageRow({
  pkg, isMobile, isLast, onClick,
}: {
  pkg: ServicePackage
  isMobile: boolean
  isLast: boolean
  onClick: () => void
}) {
  const cardsCount = pkg._count?.cards ?? 0
  const itemsCount = pkg.items?.length ?? 0
  const totalQty = pkg.items?.reduce((s, it) => s + it.quantity, 0) ?? 0

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? 12 : 14,
        padding: isMobile ? '14px 14px' : '14px 16px',
        border: 'none',
        borderBottom: isLast ? 'none' : `1px solid ${colors.gray.border}`,
        background: 'transparent',
        cursor: 'pointer',
        textAlign: 'left',
        transition: `background ${transitions.fast}`,
        WebkitTapHighlightColor: 'transparent',
        fontFamily: typography.fontFamily,
      }}
      onMouseEnter={e => (e.currentTarget.style.background = colors.gray.hover)}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{
        width: isMobile ? 42 : 46,
        height: isMobile ? 42 : 46,
        borderRadius: 10,
        background: pkg.color ?? colors.red.gradient,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        boxShadow: `0 2px 8px ${colors.red.glow}`,
      }}>
        <PackageIcon size={isMobile ? 20 : 22} color="#fff" strokeWidth={2} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3,
        }}>
          <span style={{
            fontSize: 14, fontWeight: 700,
            color: colors.gray[900],
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            letterSpacing: '-0.01em',
          }}>{pkg.name}</span>
          {!pkg.active && (
            <span style={{
              fontSize: 9, fontWeight: 700,
              color: colors.gray.dimText,
              background: colors.background.page,
              border: `1px solid ${colors.gray.borderMd}`,
              borderRadius: 4, padding: '1px 5px',
              letterSpacing: '.04em',
            }}>INATIVO</span>
          )}
        </div>
        <div style={{
          fontSize: 11, color: colors.gray.dimText,
          display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
        }}>
          <span>{itemsCount} serviço{itemsCount !== 1 && 's'} · {totalQty} crédito{totalQty !== 1 && 's'}</span>
          <span>·</span>
          <span>{describeValidity(pkg.validityType, pkg.validityValue)}</span>
          {cardsCount > 0 && (
            <>
              <span>·</span>
              <span>{cardsCount} vendido{cardsCount !== 1 && 's'}</span>
            </>
          )}
        </div>
      </div>

      <div style={{
        fontSize: 15, fontWeight: 800,
        color: colors.gray[900],
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '-0.01em',
        flexShrink: 0,
      }}>
        {fmtBRL(pkg.price)}
      </div>

      <ChevronRight size={15} color={colors.gray.dimText} strokeWidth={2} style={{ flexShrink: 0 }} />
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// ABA 2: Adquiridos (cartões)
// ═══════════════════════════════════════════════════════════════════════════
function AcquiredTab({
  isMobile, onToast,
}: {
  isMobile: boolean
  onToast:  (t: { message: string; kind: ToastKind }) => void
}) {
  const [cards, setCards] = useState<PackageCard[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [detailCardId, setDetailCardId] = useState<string | null>(null)

  const fetchData = useCallback(async (search?: string, signal?: AbortSignal) => {
    try {
      setLoading(true)
      const params: Record<string, string> = {}
      if (search?.trim()) params.search = search.trim()
      const res = await api.get('/package-cards', { params, signal })
      if (signal?.aborted) return
      const data: CardsListResponse = res.data?.data ?? res.data
      setCards(data?.cards ?? [])
    } catch {
      if (!signal?.aborted) setCards([])
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])

  // Carrega na entrada e quando query muda (com debounce simples)
  useEffect(() => {
    const ctrl = new AbortController()
    const t = setTimeout(() => fetchData(query, ctrl.signal), 250)
    return () => { ctrl.abort(); clearTimeout(t) }
  }, [query, fetchData])

  function handleCanceled(cardId: string) {
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, status: 'CANCELED' } : c))
    onToast({ message: 'Cartão cancelado', kind: 'success' })
  }

  return (
    <>
      {detailCardId && (
        <CardDetailModal
          cardId={detailCardId}
          isMobile={isMobile}
          onClose={() => setDetailCardId(null)}
          onCanceled={handleCanceled}
        />
      )}

      {/* Busca */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px',
        borderRadius: 12,
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${colors.gray.borderMd}`,
        marginBottom: 12,
      }}>
        <Search size={14} color={colors.gray.dimText} strokeWidth={2} />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Pesquisar em adquiridos..."
          inputMode="search"
          style={{
            flex: 1, border: 'none', outline: 'none',
            fontSize: 14, background: 'transparent',
            color: colors.gray[900],
            fontFamily: 'inherit',
            minWidth: 0,
          }}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            aria-label="Limpar"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 4, display: 'flex',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <X size={13} color={colors.gray.dimText} />
          </button>
        )}
      </div>

      {loading ? (
        <LoadingState />
      ) : cards.length === 0 ? (
        <EmptyState
          title={query ? 'Nenhum cartão encontrado' : 'Nenhum cartão adquirido'}
          subtitle={
            query
              ? `Nenhum cartão corresponde a "${query}".`
              : 'Cartões aparecem aqui após a venda de pacotes no Caixa.'
          }
        />
      ) : (
        <div style={{
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: 'blur(20px) saturate(160%)',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.60)',
          boxShadow: '0 2px 0 rgba(255,255,255,0.85) inset, 0 8px 28px rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}>
          {cards.map((c, i) => (
            <CardRow
              key={c.id}
              card={c}
              isMobile={isMobile}
              isLast={i === cards.length - 1}
              onClick={() => setDetailCardId(c.id)}
            />
          ))}
        </div>
      )}
    </>
  )
}

function CardRow({
  card, isMobile, isLast, onClick,
}: {
  card: PackageCard
  isMobile: boolean
  isLast: boolean
  onClick: () => void
}) {
  const statusC = STATUS_COLOR[card.status]
  const balance = getCardBalance(card)
  const remaining = balance.total - balance.used

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? 11 : 14,
        padding: isMobile ? '14px 14px' : '14px 16px',
        border: 'none',
        borderBottom: isLast ? 'none' : `1px solid ${colors.gray.border}`,
        background: 'transparent',
        cursor: 'pointer',
        textAlign: 'left',
        transition: `background ${transitions.fast}`,
        WebkitTapHighlightColor: 'transparent',
        fontFamily: typography.fontFamily,
      }}
      onMouseEnter={e => (e.currentTarget.style.background = colors.gray.hover)}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{
        width: isMobile ? 38 : 42,
        height: isMobile ? 38 : 42,
        borderRadius: 9,
        background: card.package?.color ?? colors.background.page,
        border: `1px solid ${colors.gray.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <PackageIcon size={isMobile ? 17 : 19} color={card.package?.color ? '#fff' : colors.gray[700]} strokeWidth={2} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 700,
          color: colors.gray[900],
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          letterSpacing: '-0.01em',
        }}>
          {card.packageName} · {fmtBRL(card.totalPrice)}
        </div>
        <div style={{
          fontSize: 11, color: colors.gray.dimText,
          marginTop: 2,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {card.client?.name ?? '—'} · {formatCardNumber(card.cardNumber)} · {fmtDate(card.createdAt)}
        </div>
      </div>

      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
        gap: 4, flexShrink: 0,
        minWidth: isMobile ? 70 : 86,
      }}>
        <span style={{
          padding: '2px 8px',
          borderRadius: 999,
          background: statusC.bg,
          color: statusC.fg,
          fontSize: 9,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '.05em',
        }}>
          {STATUS_LABEL[card.status]}
        </span>
        <div style={{
          fontSize: 13, fontWeight: 800,
          color: remaining === 0 ? colors.gray.dimText : colors.gray[900],
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.01em',
          lineHeight: 1,
        }}>
          {remaining}<span style={{ color: colors.gray.dimText, fontWeight: 600, fontSize: 11 }}>/{balance.total}</span>
        </div>
        <div style={{
          fontSize: 9, color: colors.gray.dimText,
          textTransform: 'uppercase', letterSpacing: '.05em',
        }}>Saldo</div>
      </div>

      <ChevronRight size={15} color={colors.gray.dimText} strokeWidth={2} style={{ flexShrink: 0 }} />
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Estados auxiliares
// ═══════════════════════════════════════════════════════════════════════════

function LoadingState() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
      <Loader2 size={26} style={{ animation: 'pkg-spin 0.8s linear infinite', color: colors.red.DEFAULT }} />
    </div>
  )
}

function EmptyState({
  title, subtitle, ctaLabel, onCta,
}: {
  title:     string
  subtitle:  string
  ctaLabel?: string
  onCta?:    () => void
}) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '50px 24px',
      background: 'rgba(255,255,255,0.85)',
      borderRadius: 14,
      border: `1px solid ${colors.gray.border}`,
    }}>
      <PackageIcon size={36} color={colors.gray.dimText} style={{ opacity: 0.3, marginBottom: 12 }} />
      <div style={{ fontSize: 15, fontWeight: 600, color: typography.color.primary, marginBottom: 4 }}>
        {title}
      </div>
      <div style={{
        fontSize: 13, color: colors.gray.dimText, maxWidth: 360, margin: '0 auto',
        marginBottom: ctaLabel ? 20 : 0,
      }}>
        {subtitle}
      </div>
      {ctaLabel && onCta && (
        <button
          onClick={onCta}
          style={{
            padding: '11px 22px',
            borderRadius: 10,
            background: colors.red.gradient,
            color: '#fff', border: 'none',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 14,
            boxShadow: `0 3px 10px ${colors.red.glow}`,
            fontFamily: 'inherit',
          }}
        >
          {ctaLabel}
        </button>
      )}
    </div>
  )
}
