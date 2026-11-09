'use client'
// src/app/dashboard/clientes/[id]/components/ClientProfileView.tsx
// @eligi:clients-profile-v2 — a ficha do cliente (direcao B "Ficha").
//
// Usada em dois lugares: pagina /dashboard/clientes/[id] (celular, link direto)
// e painel direito da lista no computador (`embedded`). Quem usa passa
// key={id}: trocar de cliente remonta, e o "carregando" nasce verdadeiro sem
// setState dentro de efeito.

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, CreditCard, Pencil, Trash2 } from 'lucide-react'

import api from '@/shared/lib/apiClient'
import { useAuth } from '@/hooks/useAuth'
import { useIsMobile } from '@/hooks/useIsMobile'
import { waLink } from '@/shared/utils/whatsapp'
import EligiClubIcon from '@/app/components/navigation/EligiClubIcon'
import type { ClientListItem, ClientProfile, SpendBreakdown } from '@/features/clients/types'
import {
  formatPhone, maskPhone, maskBirthDate, formatBirthLabel,
  fmtMoney2, splitMoney, fmtShortDate, fmtMonthYear, plural,
} from '@/features/clients/utils/format'
import { INK, INK_2, INK_3 } from '@/features/clients/styles'

import EditableField    from './EditableField'
import DeleteModal      from './DeleteModal'
import ShareWalletModal from './ShareWalletModal'
import ClientHistory    from './ClientHistory'

interface Props {
  id:         string
  embedded?:  boolean
  onChanged?: (id: string, patch: Partial<ClientListItem>) => void
  onDeleted?: (id: string) => void
}

type Tab = 'history' | 'data' | 'club'
type Field = 'name' | 'phone' | 'email' | 'cpf' | 'birthDate'

// Mesma regra do back (canSeeClientPhone / receptionistOrAbove no PUT).
const EDIT_ROLES   = new Set(['BUSINESS_OWNER', 'MANAGER', 'RECEPTIONIST'])
const DELETE_ROLES = new Set(['BUSINESS_OWNER', 'MANAGER'])

function apiMessage(e: unknown, fallback: string): string {
  const data = (e as { response?: { data?: { message?: string; error?: string } } })?.response?.data
  return data?.message || data?.error || fallback
}

const SEGMENTS: { key: keyof SpendBreakdown; label: string; color: string }[] = [
  { key: 'services',  label: 'Serviços',  color: INK },
  { key: 'club',      label: 'Clube',     color: INK_2 },
  { key: 'products',  label: 'Produtos',  color: '#8a8a93' },
  { key: 'packages',  label: 'Pacotes',   color: '#c4c4cc' },
  { key: 'estimated', label: 'Estimado',  color: '#e0e0e6' },
]

function SpendBlock({ c }: { c: ClientProfile }) {
  const m = c.metrics
  const s = m.spend
  const { int, cents } = splitMoney(s.total)
  const parts = SEGMENTS.filter(p => (s[p.key] ?? 0) > 0.004)
  const since = m.firstVisit ? ` DESDE ${fmtMonthYear(m.firstVisit).toUpperCase()}` : ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span className="cl-spend-label cl-m">
          Gasto total{m.visits > 0 ? ` · ${plural(m.visits, 'visita', 'visitas')}${since}` : ''}
        </span>
        <span className="cl-spend-big cl-d cl-n">
          R$ {int}<span className="cl-cents">,{cents}</span>
        </span>
      </div>
      {parts.length > 0 && (
        <>
          <div className="cl-bar" aria-hidden="true">
            {parts.map(p => <i key={p.key} style={{ flex: s[p.key], background: p.color }} />)}
          </div>
          <div className="cl-legend cl-n">
            {parts.map(p => (
              <span key={p.key}><i className="cl-sw" style={{ background: p.color }} /><b>{p.label}</b> R$ {fmtMoney2(s[p.key])}</span>
            ))}
            {s.discounts > 0.004 && <span><b>Descontos</b> −R$ {fmtMoney2(s.discounts)}</span>}
          </div>
        </>
      )}
      {m.estimatedVisits > 0 && (
        <span className="cl-spend-note">
          {plural(m.estimatedVisits, 'visita concluída', 'visitas concluídas')} sem venda no caixa: entrou pelo preço atual do serviço.
        </span>
      )}
    </div>
  )
}

function Kpis({ c }: { c: ClientProfile }) {
  const m = c.metrics
  const freqSub = m.lapsed && m.daysSinceLastVisit !== null
    ? { text: `sumido há ${m.daysSinceLastVisit} dias`, warn: true }
    : m.nextExpectedAt
      ? { text: `próxima ~${fmtShortDate(m.nextExpectedAt).toLowerCase()}`, warn: false }
      : { text: m.visits < 3 ? 'a partir de 3 visitas' : '', warn: false }
  return (
    <div className="cl-kpis">
      <div className="cl-kpi">
        <span className="cl-kpi-l">Ticket médio</span>
        <span className="cl-kpi-v cl-d cl-n">{m.visits > 0 ? `R$ ${fmtMoney2(m.ticketAverage)}` : '—'}</span>
        {m.favoriteService && <span className="cl-kpi-s" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>mais faz {m.favoriteService}</span>}
      </div>
      <div className="cl-kpi">
        <span className="cl-kpi-l">Frequência</span>
        <span className="cl-kpi-v cl-d cl-n">{m.frequencyDays ? `${m.frequencyDays} dias` : '—'}</span>
        {freqSub.text && <span className={`cl-kpi-s${freqSub.warn ? ' is-warn' : ''}`}>{freqSub.text}</span>}
      </div>
      <div className="cl-kpi">
        <span className="cl-kpi-l">Faltas</span>
        <span className="cl-kpi-v cl-d cl-n">{m.noShows}</span>
        {m.canceled > 0 && <span className="cl-kpi-s">{plural(m.canceled, 'cancelado', 'cancelados')}</span>}
      </div>
    </div>
  )
}

function ClubPanel({ c }: { c: NonNullable<ClientProfile['club']> }) {
  const active = c.status === 'ACTIVE'
  const info = [
    { l: 'Mensalidade',    v: c.value !== null ? `R$ ${fmtMoney2(c.value)}` : '—' },
    { l: 'Fichas',         v: String(c.fichas) },
    { l: 'Membro desde',   v: fmtMonthYear(c.startedAt) },
    { l: 'Próx. cobrança', v: c.currentPeriodEnd ? fmtShortDate(c.currentPeriodEnd) : '—' },
  ]
  return (
    <div className="cl-club">
      <div className="cl-club-head">
        <EligiClubIcon size={22} color={INK} />
        <span style={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1, minWidth: 0 }}>
          <span className="cl-kpi-l cl-m" style={{ letterSpacing: '.08em' }}>ELIGICLUB</span>
          <span className="cl-club-name">{c.planName}</span>
        </span>
        <span className={`cl-pill${active ? '' : ' is-warn'}`}>{active ? 'Ativo' : c.status === 'PAST_DUE' ? 'Em atraso' : c.status === 'PENDING' ? 'Aguardando pagamento' : c.status}</span>
      </div>
      <div className="cl-club-grid">
        {info.map(it => (
          <div key={it.l} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span className="cl-kpi-l">{it.l}</span>
            <span className="cl-kpi-v cl-d cl-n" style={{ fontSize: 16 }}>{it.v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ClientProfileView({ id, embedded = false, onChanged, onDeleted }: Props) {
  const router = useRouter()
  const { user } = useAuth()
  const narrow = useIsMobile(1024)
  const role = user?.role as string | undefined
  const canEdit   = !!role && EDIT_ROLES.has(role)
  const canDelete = !!role && DELETE_ROLES.has(role)

  const [client,     setClient]     = useState<ClientProfile | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [notFound,   setNotFound]   = useState(false)
  const [failed,     setFailed]     = useState(false)
  const [tab,        setTab]        = useState<Tab>('history')
  const [showDelete, setShowDelete] = useState(false)
  const [showShare,  setShowShare]  = useState(false)
  const [deleting,   setDeleting]   = useState(false)
  const [toast,      setToast]      = useState<{ msg: string; bad: boolean } | null>(null)
  const [retry,      setRetry]      = useState(0)

  useEffect(() => {
    let cancelled = false
    api.get(`/clients/${id}`)
      .then(res => {
        if (cancelled) return
        setClient((res.data?.data ?? res.data) as ClientProfile)
        setFailed(false)
        setNotFound(false)
      })
      .catch(e => {
        if (cancelled) return
        const status = (e as { response?: { status?: number } })?.response?.status
        if (status === 404) setNotFound(true)
        else setFailed(true)
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id, retry])

  function showToast(msg: string, bad = false) {
    setToast({ msg, bad })
    setTimeout(() => setToast(null), 3200)
  }

  async function handleUpdate(field: Field, value: string) {
    const payload =
      field === 'phone'     ? { phone: value.replace(/\D/g, '') } :
      field === 'cpf'       ? { cpf: value.replace(/\D/g, '') || null } :
      field === 'birthDate' ? { birthDate: value.trim() || null } :
      field === 'email'     ? { email: value.trim() || null } :
                              { name: value }
    const res = await api.put(`/clients/${id}`, payload)
    const updated = res.data?.data ?? res.data
    // O PUT devolve o registro cru (birthMonthDay/birthYear), nao o birthLabel.
    setClient(prev => {
      if (!prev) return prev
      if (field === 'birthDate') return { ...prev, birthLabel: formatBirthLabel(updated.birthMonthDay, updated.birthYear) }
      return { ...prev, [field]: updated[field] ?? null }
    })
    if (field === 'name' || field === 'phone') onChanged?.(id, { [field]: updated[field] ?? null })
    showToast('Dados atualizados')
  }

  async function handleDelete() {
    try {
      setDeleting(true)
      await api.delete(`/clients/${id}`)
      setShowDelete(false)
      if (embedded && onDeleted) { onDeleted(id); return }
      router.push('/dashboard/clientes')
    } catch (e) {
      setDeleting(false)
      setShowDelete(false)
      showToast(apiMessage(e, 'Não foi possível apagar o cliente.'), true)
    }
  }

  const back = !embedded && (
    <div className="cl-prof-top">
      <button type="button" className="cl-btn-out" onClick={() => router.push('/dashboard/clientes')} style={{ paddingLeft: 10 }}>
        <ChevronLeft size={18} />
        <span>Clientes</span>
      </button>
      {canDelete && client && (
        <button type="button" className="cl-icon-btn" onClick={() => setShowDelete(true)} aria-label="Apagar cliente" style={{ color: '#a32d2d' }}>
          <Trash2 size={16} />
        </button>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="cl-prof" aria-busy="true">
        {back}
        <div className="cl-state" style={{ padding: '80px 0' }}><span className="cl-spinner" aria-label="Carregando ficha" /></div>
      </div>
    )
  }

  if (notFound || failed || !client) {
    return (
      <div className="cl-prof">
        {back}
        <div className="cl-state" role="alert">
          <div className="cl-state-title">{notFound ? 'Cliente não encontrado' : 'Não foi possível abrir a ficha'}</div>
          <div className="cl-state-text">{notFound ? 'Ele pode ter sido apagado.' : 'Verifique a conexão e tente de novo.'}</div>
          {!notFound && (
            <button type="button" className="cl-btn-out" onClick={() => { setLoading(true); setRetry(r => r + 1) }}>Tentar de novo</button>
          )}
        </div>
      </div>
    )
  }

  const m = client.metrics
  const subParts: string[] = []
  if (client.phone) subParts.push(formatPhone(client.phone))
  if (client.email) subParts.push(client.email)
  if (client.contactMasked) subParts.push('contato oculto para o seu cargo')
  subParts.push(`cliente desde ${fmtMonthYear(client.createdAt)}`)
  if (client.club) subParts.push(client.club.planName)

  const tabs: { id: Tab; label: string }[] = [
    { id: 'history', label: 'Histórico' },
    { id: 'data',    label: 'Dados' },
    ...(client.club ? [{ id: 'club' as const, label: 'Clube' }] : []),
  ]
  const hiddenText = client.contactMasked ? 'Oculto para o seu cargo' : 'Não informado'

  return (
    <div className="cl-prof">
      {back}

      {toast && <div className={`cl-toast${toast.bad ? ' is-bad' : ''}`} role="status"><span>{toast.msg}</span></div>}

      {showDelete && (
        <DeleteModal
          name={client.name}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
          deleting={deleting}
          isMobile={narrow}
        />
      )}
      {showShare && <ShareWalletModal clientId={id} clientName={client.name} onClose={() => setShowShare(false)} />}

      <div className="cl-prof-id">
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <h2 className="cl-prof-name cl-d">
            {client.name}
            {client.club && <EligiClubIcon size={24} color={INK} aria-label="Membro do clube" />}
          </h2>
          <div className="cl-prof-sub cl-n">
            {subParts.map((p, i) => (
              <span key={i}>{i > 0 && <span className="cl-dot">·</span>}{p}</span>
            ))}
          </div>
        </div>
        <div className="cl-actions">
          {client.phone && (
            <a className="cl-btn-dark" href={waLink(client.phone)} target="_blank" rel="noopener noreferrer">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 20l1.4-4A8 8 0 1112 20a8 8 0 01-4-1.1z" /></svg>
              <span>WhatsApp</span>
            </a>
          )}
          {canEdit && (
            <button type="button" className="cl-btn-out" onClick={() => setTab('data')}>
              <Pencil size={15} /><span>Editar</span>
            </button>
          )}
          {canEdit && (
            <button type="button" className="cl-btn-out" onClick={() => setShowShare(true)}>
              <CreditCard size={15} /><span>Cartão</span>
            </button>
          )}
          {canDelete && embedded && (
            <button type="button" className="cl-btn-out is-danger" onClick={() => setShowDelete(true)} aria-label="Apagar cliente">
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      <SpendBlock c={client} />
      <Kpis c={client} />

      <div className="cl-ptabs" role="tablist" aria-label="Seções da ficha">
        {tabs.map(t => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`cl-tab${tab === t.id ? ' is-on' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}{t.id === 'history' && client.historyTotal > 0 ? ` · ${client.historyTotal}` : ''}
          </button>
        ))}
      </div>

      {tab === 'history' && (
        <ClientHistory history={client.history} historyTotal={client.historyTotal} priceChanges={client.priceChanges} />
      )}

      {tab === 'data' && (
        <div className="cl-fields">
          <EditableField label="Nome" value={client.name} onSave={v => handleUpdate('name', v)} locked={!canEdit} />
          <EditableField label="Telefone" value={formatPhone(client.phone)} onSave={v => handleUpdate('phone', v)} mask={maskPhone} inputMode="tel" locked={!canEdit} emptyText={hiddenText} />
          <EditableField label="E-mail" value={client.email ?? ''} onSave={v => handleUpdate('email', v)} inputMode="email" locked={!canEdit} emptyText={hiddenText} />
          <EditableField label="Aniversário" value={client.birthLabel ?? ''} onSave={v => handleUpdate('birthDate', v)} mask={maskBirthDate} inputMode="numeric" locked={!canEdit} />
          <EditableField label="CPF" value={client.cpf ?? ''} onSave={v => handleUpdate('cpf', v)} inputMode="numeric" locked={!canEdit} emptyText={hiddenText} />
          <div className="cl-field">
            <div className="cl-field-main">
              <span className="cl-field-l">Cliente desde</span>
              <span className="cl-field-v cl-n">{new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(client.createdAt))}</span>
            </div>
          </div>
          {m.lastVisit && (
            <div className="cl-field">
              <div className="cl-field-main">
                <span className="cl-field-l">Última visita</span>
                <span className="cl-field-v cl-n">{new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(m.lastVisit))}</span>
              </div>
            </div>
          )}
          {!!role && !canEdit && (
            <div className="cl-lock" style={{ color: INK_3 }}>Só dono, gerente e recepção alteram os dados do cliente.</div>
          )}
        </div>
      )}

      {tab === 'club' && client.club && <ClubPanel c={client.club} />}
    </div>
  )
}
