'use client'
// src/app/dashboard/pacotes/page.tsx
//
// Pacotes & Assinaturas — switch de produto (Pacotes | Assinaturas) + sub-abas (Gerenciar | Adquiridos)

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Search, X, Plus, Package as PackageIcon, ChevronRight, Loader2, Ticket,
  RefreshCw, Infinity as InfinityIcon,
} from 'lucide-react'

import api from '@/shared/lib/apiClient'
import { colors, typography, transitions } from '@/shared/theme'
import { useDeviceMode } from '@/features/agenda/hooks/useDeviceMode'
import { ServicePackage, PackageCard, CardsListResponse } from '@/features/packages/types'
import {
  fmtBRL, fmtDate, describeValidity, STATUS_LABEL, STATUS_COLOR,
  formatCardNumber, getCardBalance,
} from '@/features/packages/utils/format'
import { MembershipPlan, MembershipCard, MembershipCardsListResponse } from '@/features/memberships/types'
import { M_STATUS_LABEL, M_STATUS_COLOR } from '@/features/memberships/format'

import PackageEditorModal from './components/PackageEditorModal'
import CardDetailModal from './components/CardDetailModal'
import MembershipEditorModal from './components/MembershipEditorModal'
import MembershipCardDetailModal from './components/MembershipCardDetailModal'
import Toast, { ToastKind } from './components/Toast'

type Product = 'packages' | 'memberships'
type Tab = 'manage' | 'acquired'

export default function PacotesPage() {
  const mode = useDeviceMode()
  const isMobile = mode === 'mobile'

  const [product, setProduct] = useState<Product>('packages')
  const [tab, setTab] = useState<Tab>('manage')
  const [toast, setToast] = useState<{ message: string; kind: ToastKind } | null>(null)

  const subtitle = product === 'packages'
    ? (tab === 'manage' ? 'Gerencie os pacotes vendíveis do seu negócio' : 'Cartões de pacote adquiridos pelos clientes')
    : (tab === 'manage' ? 'Gerencie as assinaturas (visitas ilimitadas por período)' : 'Assinaturas adquiridas pelos clientes')

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
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: isMobile ? 14 : 18, gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: isMobile ? 22 : typography.scale['2xl'], fontWeight: 700, letterSpacing: '-0.025em', color: typography.color.primary, margin: 0, lineHeight: 1.2 }}>
              Pacotes &amp; assinaturas
            </h2>
            {!isMobile && <p style={{ fontSize: 14, color: typography.color.muted, margin: '4px 0 0' }}>{subtitle}</p>}
          </div>
        </div>

        {/* Switch de produto */}
        <div style={{ display: 'flex', gap: 4, padding: 4, background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(12px)', borderRadius: 12, border: `1px solid ${colors.gray.border}`, marginBottom: 10 }}>
          <ProductBtn icon={<PackageIcon size={15} strokeWidth={2.2} />} label="Pacotes"     active={product === 'packages'}    onClick={() => setProduct('packages')} />
          <ProductBtn icon={<Ticket     size={15} strokeWidth={2.2} />} label="Assinaturas"  active={product === 'memberships'} onClick={() => setProduct('memberships')} />
        </div>

        {/* Sub-abas */}
        <div style={{ display: 'flex', gap: 4, padding: 4, background: 'rgba(255,255,255,0.45)', borderRadius: 12, border: `1px solid ${colors.gray.border}`, marginBottom: 14 }}>
          <TabBtn label="Gerenciar"  active={tab === 'manage'}   onClick={() => setTab('manage')} />
          <TabBtn label="Adquiridos" active={tab === 'acquired'} onClick={() => setTab('acquired')} />
        </div>

        {product === 'packages'
          ? (tab === 'manage'
              ? <ManageTab isMobile={isMobile} onToast={setToast} />
              : <AcquiredTab isMobile={isMobile} onToast={setToast} />)
          : (tab === 'manage'
              ? <MembershipManageTab isMobile={isMobile} onToast={setToast} />
              : <MembershipAcquiredTab isMobile={isMobile} onToast={setToast} />)
        }
      </div>
    </>
  )
}

function ProductBtn({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
        padding: '10px 14px', borderRadius: 9, border: 'none',
        background: active ? '#fff' : 'transparent',
        color: active ? colors.red.DEFAULT : colors.gray.dimText,
        fontWeight: active ? 700 : 600, fontSize: 13, cursor: 'pointer',
        transition: `all ${transitions.fast}`,
        boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
        fontFamily: 'inherit', WebkitTapHighlightColor: 'transparent',
      }}
    >
      {icon}{label}
    </button>
  )
}

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: '9px 14px', borderRadius: 9, border: 'none',
        background: active ? '#fff' : 'transparent',
        color: active ? colors.gray[900] : colors.gray.dimText,
        fontWeight: active ? 700 : 600, fontSize: 13, cursor: 'pointer',
        transition: `all ${transitions.fast}`,
        boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
        fontFamily: 'inherit', WebkitTapHighlightColor: 'transparent',
      }}
    >
      {label}
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// PACOTES — Gerenciar
// ═══════════════════════════════════════════════════════════════════════════
function ManageTab({ isMobile, onToast }: { isMobile: boolean; onToast: (t: { message: string; kind: ToastKind }) => void }) {
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
    return packages.filter(p => p.name.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q))
  }, [packages, query])

  function handleAdd() { setEditing(null); setModalOpen(true) }
  function handleEdit(p: ServicePackage) { setEditing(p); setModalOpen(true) }
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

      <SearchAddBar
        query={query} setQuery={setQuery}
        placeholder="Buscar pacote..."
        addLabel={isMobile ? 'Novo' : 'Novo pacote'}
        onAdd={handleAdd}
      />

      {loading ? <LoadingState /> : packages.length === 0 ? (
        <EmptyState title="Nenhum pacote cadastrado" subtitle="Crie pacotes combinando vários serviços com desconto para fidelizar seus clientes." ctaLabel="+ Criar primeiro pacote" onCta={handleAdd} />
      ) : filtered.length === 0 ? (
        <EmptyState title="Nenhum pacote encontrado" subtitle={`Nenhum pacote corresponde a "${query}".`} />
      ) : (
        <ListShell>
          {filtered.map((p, i) => <PackageRow key={p.id} pkg={p} isMobile={isMobile} isLast={i === filtered.length - 1} onClick={() => handleEdit(p)} />)}
        </ListShell>
      )}
    </>
  )
}

function PackageRow({ pkg, isMobile, isLast, onClick }: { pkg: ServicePackage; isMobile: boolean; isLast: boolean; onClick: () => void }) {
  const cardsCount = pkg._count?.cards ?? 0
  const itemsCount = pkg.items?.length ?? 0
  const totalQty = pkg.items?.reduce((s, it) => s + it.quantity, 0) ?? 0

  return (
    <RowShell isMobile={isMobile} isLast={isLast} onClick={onClick}
      iconBg={pkg.color ?? colors.red.gradient} icon={<PackageIcon size={isMobile ? 20 : 22} color="#fff" strokeWidth={2} />}
      trailing={<PriceTag price={pkg.price} />}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: colors.gray[900], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.01em' }}>{pkg.name}</span>
        {!pkg.active && <InactiveTag />}
      </div>
      <div style={{ fontSize: 11, color: colors.gray.dimText, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span>{itemsCount} serviço{itemsCount !== 1 && 's'} · {totalQty} crédito{totalQty !== 1 && 's'}</span>
        <span>·</span>
        <span>{describeValidity(pkg.validityType, pkg.validityValue)}</span>
        {cardsCount > 0 && (<><span>·</span><span>{cardsCount} vendido{cardsCount !== 1 && 's'}</span></>)}
      </div>
    </RowShell>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// PACOTES — Adquiridos
// ═══════════════════════════════════════════════════════════════════════════
function AcquiredTab({ isMobile, onToast }: { isMobile: boolean; onToast: (t: { message: string; kind: ToastKind }) => void }) {
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
        <CardDetailModal cardId={detailCardId} isMobile={isMobile} onClose={() => setDetailCardId(null)} onCanceled={handleCanceled} />
      )}

      <SearchBar query={query} setQuery={setQuery} placeholder="Pesquisar em adquiridos..." />

      {loading ? <LoadingState /> : cards.length === 0 ? (
        <EmptyState
          title={query ? 'Nenhum cartão encontrado' : 'Nenhum cartão adquirido'}
          subtitle={query ? `Nenhum cartão corresponde a "${query}".` : 'Cartões aparecem aqui após a venda de pacotes no Caixa.'}
        />
      ) : (
        <ListShell>
          {cards.map((c, i) => <CardRow key={c.id} card={c} isMobile={isMobile} isLast={i === cards.length - 1} onClick={() => setDetailCardId(c.id)} />)}
        </ListShell>
      )}
    </>
  )
}

function CardRow({ card, isMobile, isLast, onClick }: { card: PackageCard; isMobile: boolean; isLast: boolean; onClick: () => void }) {
  const statusC = STATUS_COLOR[card.status]
  const balance = getCardBalance(card)
  const remaining = balance.total - balance.used

  return (
    <RowShell isMobile={isMobile} isLast={isLast} onClick={onClick}
      iconBg={card.package?.color ?? colors.background.page} iconBorder
      icon={<PackageIcon size={isMobile ? 17 : 19} color={card.package?.color ? '#fff' : colors.gray[700]} strokeWidth={2} />}
      trailing={
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0, minWidth: isMobile ? 70 : 86 }}>
          <StatusPill label={STATUS_LABEL[card.status]} fg={statusC.fg} bg={statusC.bg} />
          <div style={{ fontSize: 13, fontWeight: 800, color: remaining === 0 ? colors.gray.dimText : colors.gray[900], fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em', lineHeight: 1 }}>
            {remaining}<span style={{ color: colors.gray.dimText, fontWeight: 600, fontSize: 11 }}>/{balance.total}</span>
          </div>
          <div style={{ fontSize: 9, color: colors.gray.dimText, textTransform: 'uppercase', letterSpacing: '.05em' }}>Saldo</div>
        </div>
      }>
      <div style={{ fontSize: 14, fontWeight: 700, color: colors.gray[900], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.01em' }}>
        {card.packageName} · {fmtBRL(card.totalPrice)}
      </div>
      <div style={{ fontSize: 11, color: colors.gray.dimText, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {card.client?.name ?? '—'} · {formatCardNumber(card.cardNumber)} · {fmtDate(card.createdAt)}
      </div>
    </RowShell>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// ASSINATURAS — Gerenciar
// ═══════════════════════════════════════════════════════════════════════════
function MembershipManageTab({ isMobile, onToast }: { isMobile: boolean; onToast: (t: { message: string; kind: ToastKind }) => void }) {
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<MembershipPlan | null>(null)

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await api.get('/memberships', { signal })
      if (signal?.aborted) return
      const data = res.data?.data ?? res.data
      setPlans(Array.isArray(data) ? data : [])
    } catch {
      if (!signal?.aborted) setPlans([])
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
    if (!query.trim()) return plans
    const q = query.trim().toLowerCase()
    return plans.filter(p => p.name.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q))
  }, [plans, query])

  function handleAdd() { setEditing(null); setModalOpen(true) }
  function handleEdit(p: MembershipPlan) { setEditing(p); setModalOpen(true) }
  function handleSaved(saved: MembershipPlan) {
    setPlans(prev => {
      const exists = prev.find(p => p.id === saved.id)
      if (exists) return prev.map(p => p.id === saved.id ? saved : p)
      return [saved, ...prev]
    })
    onToast({ message: editing ? 'Assinatura atualizada' : 'Assinatura criada', kind: 'success' })
  }

  return (
    <>
      {modalOpen && (
        <MembershipEditorModal
          membership_={editing}
          isMobile={isMobile}
          onSaved={handleSaved}
          onClose={() => { setModalOpen(false); setTimeout(() => setEditing(null), 200) }}
        />
      )}

      <SearchAddBar
        query={query} setQuery={setQuery}
        placeholder="Buscar assinatura..."
        addLabel={isMobile ? 'Nova' : 'Nova assinatura'}
        onAdd={handleAdd}
      />

      {loading ? <LoadingState /> : plans.length === 0 ? (
        <EmptyState title="Nenhuma assinatura cadastrada" subtitle="Crie planos com visitas ilimitadas dentro de um período — ótimos para fidelizar e gerar receita recorrente." ctaLabel="+ Criar primeira assinatura" onCta={handleAdd} />
      ) : filtered.length === 0 ? (
        <EmptyState title="Nenhuma assinatura encontrada" subtitle={`Nenhuma assinatura corresponde a "${query}".`} />
      ) : (
        <ListShell>
          {filtered.map((p, i) => <MembershipRow key={p.id} plan={p} isMobile={isMobile} isLast={i === filtered.length - 1} onClick={() => handleEdit(p)} />)}
        </ListShell>
      )}
    </>
  )
}

function MembershipRow({ plan, isMobile, isLast, onClick }: { plan: MembershipPlan; isMobile: boolean; isLast: boolean; onClick: () => void }) {
  const cardsCount = plan._count?.cards ?? 0
  const coverage = plan.allServices ? 'Todos os serviços' : `${plan.services?.length ?? 0} serviço${(plan.services?.length ?? 0) !== 1 ? 's' : ''}`

  return (
    <RowShell isMobile={isMobile} isLast={isLast} onClick={onClick}
      iconBg={plan.color ?? colors.red.gradient} icon={<Ticket size={isMobile ? 20 : 22} color="#fff" strokeWidth={2} />}
      trailing={<PriceTag price={plan.price} />}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: colors.gray[900], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.01em' }}>{plan.name}</span>
        {plan.recurring && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 9, fontWeight: 700, color: '#6D28D9', background: 'rgba(124,58,237,0.10)', borderRadius: 4, padding: '1px 5px', letterSpacing: '.04em' }}>
            <RefreshCw size={9} strokeWidth={2.6} />RECORRENTE
          </span>
        )}
        {!plan.active && <InactiveTag />}
      </div>
      <div style={{ fontSize: 11, color: colors.gray.dimText, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><InfinityIcon size={11} strokeWidth={2.4} />{coverage}</span>
        <span>·</span>
        <span>{describeValidity(plan.validityType, plan.validityValue)}</span>
        {cardsCount > 0 && (<><span>·</span><span>{cardsCount} vendida{cardsCount !== 1 && 's'}</span></>)}
      </div>
    </RowShell>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// ASSINATURAS — Adquiridos
// ═══════════════════════════════════════════════════════════════════════════
function MembershipAcquiredTab({ isMobile, onToast }: { isMobile: boolean; onToast: (t: { message: string; kind: ToastKind }) => void }) {
  const [cards, setCards] = useState<MembershipCard[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [detailCardId, setDetailCardId] = useState<string | null>(null)

  const fetchData = useCallback(async (search?: string, signal?: AbortSignal) => {
    try {
      setLoading(true)
      const params: Record<string, string> = {}
      if (search?.trim()) params.search = search.trim()
      const res = await api.get('/membership-cards', { params, signal })
      if (signal?.aborted) return
      const data: MembershipCardsListResponse = res.data?.data ?? res.data
      setCards(data?.cards ?? [])
    } catch {
      if (!signal?.aborted) setCards([])
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const ctrl = new AbortController()
    const t = setTimeout(() => fetchData(query, ctrl.signal), 250)
    return () => { ctrl.abort(); clearTimeout(t) }
  }, [query, fetchData])

  function handleCanceled(cardId: string) {
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, status: 'CANCELED' } : c))
    onToast({ message: 'Assinatura cancelada', kind: 'success' })
  }

  return (
    <>
      {detailCardId && (
        <MembershipCardDetailModal cardId={detailCardId} isMobile={isMobile} onClose={() => setDetailCardId(null)} onCanceled={handleCanceled} />
      )}

      <SearchBar query={query} setQuery={setQuery} placeholder="Pesquisar em adquiridas..." />

      {loading ? <LoadingState /> : cards.length === 0 ? (
        <EmptyState
          title={query ? 'Nenhuma assinatura encontrada' : 'Nenhuma assinatura adquirida'}
          subtitle={query ? `Nenhuma assinatura corresponde a "${query}".` : 'Assinaturas aparecem aqui após a venda no Caixa.'}
        />
      ) : (
        <ListShell>
          {cards.map((c, i) => <MembershipCardRow key={c.id} card={c} isMobile={isMobile} isLast={i === cards.length - 1} onClick={() => setDetailCardId(c.id)} />)}
        </ListShell>
      )}
    </>
  )
}

function MembershipCardRow({ card, isMobile, isLast, onClick }: { card: MembershipCard; isMobile: boolean; isLast: boolean; onClick: () => void }) {
  const statusC = M_STATUS_COLOR[card.status]
  const usesCount = card._count?.uses ?? card.uses?.length ?? 0

  return (
    <RowShell isMobile={isMobile} isLast={isLast} onClick={onClick}
      iconBg={card.plan?.color ?? colors.background.page} iconBorder
      icon={<Ticket size={isMobile ? 17 : 19} color={card.plan?.color ? '#fff' : colors.gray[700]} strokeWidth={2} />}
      trailing={
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0, minWidth: isMobile ? 70 : 86 }}>
          <StatusPill label={M_STATUS_LABEL[card.status]} fg={statusC.fg} bg={statusC.bg} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: colors.gray[700] }}>
            <InfinityIcon size={13} strokeWidth={2.2} />
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{usesCount}</span>
          </div>
          <div style={{ fontSize: 9, color: colors.gray.dimText, textTransform: 'uppercase', letterSpacing: '.05em' }}>Usos</div>
        </div>
      }>
      <div style={{ fontSize: 14, fontWeight: 700, color: colors.gray[900], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.01em' }}>
        {card.planName} · {fmtBRL(card.totalPrice)}
      </div>
      <div style={{ fontSize: 11, color: colors.gray.dimText, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {card.client?.name ?? '—'} · {formatCardNumber(card.cardNumber)} · {card.validUntil ? `até ${fmtDate(card.validUntil)}` : 'sem validade'}
      </div>
    </RowShell>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Componentes compartilhados
// ═══════════════════════════════════════════════════════════════════════════

function SearchAddBar({ query, setQuery, placeholder, addLabel, onAdd }: { query: string; setQuery: (v: string) => void; placeholder: string; addLabel: string; onAdd: () => void }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
      <SearchBox query={query} setQuery={setQuery} placeholder={placeholder} flex />
      <button
        onClick={onAdd}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 12, border: 'none', background: colors.red.gradient, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 14px ${colors.red.glow}`, letterSpacing: '.02em', flexShrink: 0, WebkitTapHighlightColor: 'transparent', fontFamily: 'inherit' }}
      >
        <Plus size={15} strokeWidth={2.5} />{addLabel}
      </button>
    </div>
  )
}

function SearchBar({ query, setQuery, placeholder }: { query: string; setQuery: (v: string) => void; placeholder: string }) {
  return <div style={{ marginBottom: 12 }}><SearchBox query={query} setQuery={setQuery} placeholder={placeholder} /></div>
}

function SearchBox({ query, setQuery, placeholder, flex }: { query: string; setQuery: (v: string) => void; placeholder: string; flex?: boolean }) {
  return (
    <div style={{ flex: flex ? 1 : undefined, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: `1px solid ${colors.gray.borderMd}` }}>
      <Search size={14} color={colors.gray.dimText} strokeWidth={2} />
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={placeholder}
        inputMode="search"
        style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, background: 'transparent', color: colors.gray[900], fontFamily: 'inherit', minWidth: 0 }}
      />
      {query && (
        <button onClick={() => setQuery('')} aria-label="Limpar" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', WebkitTapHighlightColor: 'transparent' }}>
          <X size={13} color={colors.gray.dimText} />
        </button>
      )}
    </div>
  )
}

function ListShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px) saturate(160%)', WebkitBackdropFilter: 'blur(20px) saturate(160%)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.60)', boxShadow: '0 2px 0 rgba(255,255,255,0.85) inset, 0 8px 28px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
      {children}
    </div>
  )
}

function RowShell({ children, trailing, icon, iconBg, iconBorder, isMobile, isLast, onClick }: { children: React.ReactNode; trailing?: React.ReactNode; icon: React.ReactNode; iconBg: string; iconBorder?: boolean; isMobile: boolean; isLast: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 14, padding: isMobile ? '14px 14px' : '14px 16px', border: 'none', borderBottom: isLast ? 'none' : `1px solid ${colors.gray.border}`, background: 'transparent', cursor: 'pointer', textAlign: 'left', transition: `background ${transitions.fast}`, WebkitTapHighlightColor: 'transparent', fontFamily: typography.fontFamily }}
      onMouseEnter={e => (e.currentTarget.style.background = colors.gray.hover)}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{ width: isMobile ? 42 : 46, height: isMobile ? 42 : 46, borderRadius: 10, background: iconBg, border: iconBorder ? `1px solid ${colors.gray.border}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: iconBorder ? 'none' : `0 2px 8px ${colors.red.glow}` }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
      {trailing}
      <ChevronRight size={15} color={colors.gray.dimText} strokeWidth={2} style={{ flexShrink: 0 }} />
    </button>
  )
}

function PriceTag({ price }: { price: number }) {
  return <div style={{ fontSize: 15, fontWeight: 800, color: colors.gray[900], fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em', flexShrink: 0 }}>{fmtBRL(price)}</div>
}

function StatusPill({ label, fg, bg }: { label: string; fg: string; bg: string }) {
  return <span style={{ padding: '2px 8px', borderRadius: 999, background: bg, color: fg, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</span>
}

function InactiveTag() {
  return <span style={{ fontSize: 9, fontWeight: 700, color: colors.gray.dimText, background: colors.background.page, border: `1px solid ${colors.gray.borderMd}`, borderRadius: 4, padding: '1px 5px', letterSpacing: '.04em' }}>INATIVO</span>
}

function LoadingState() {
  return <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Loader2 size={26} style={{ animation: 'pkg-spin 0.8s linear infinite', color: colors.red.DEFAULT }} /></div>
}

function EmptyState({ title, subtitle, ctaLabel, onCta }: { title: string; subtitle: string; ctaLabel?: string; onCta?: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '50px 24px', background: 'rgba(255,255,255,0.85)', borderRadius: 14, border: `1px solid ${colors.gray.border}` }}>
      <PackageIcon size={36} color={colors.gray.dimText} style={{ opacity: 0.3, marginBottom: 12 }} />
      <div style={{ fontSize: 15, fontWeight: 600, color: typography.color.primary, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 13, color: colors.gray.dimText, maxWidth: 360, margin: '0 auto', marginBottom: ctaLabel ? 20 : 0 }}>{subtitle}</div>
      {ctaLabel && onCta && (
        <button onClick={onCta} style={{ padding: '11px 22px', borderRadius: 10, background: colors.red.gradient, color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 14, boxShadow: `0 3px 10px ${colors.red.glow}`, fontFamily: 'inherit' }}>{ctaLabel}</button>
      )}
    </div>
  )
}
