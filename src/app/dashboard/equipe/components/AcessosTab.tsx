'use client'
// src/app/dashboard/equipe/components/AcessosTab.tsx
// @eligi:acessos-v2
// Contas de acesso — apresentacao reescrita, LOGICA PRESERVADA.
//
// Os handlers de convite, revogacao, cancelamento e reenvio continuam falando
// com os mesmos endpoints, na mesma ordem. Acesso e seguranca, nao estetica:
// reposicionar e rotular, nunca reescrever regra de permissao.
//
// O que muda:
//   - botoes SEMPRE com rotulo. Antes escondiam o texto no mobile
//     (`{!isMobile && 'Revogar'}`) e sobravam dois icones vermelhos parecidos:
//     olho-cortado e aviao de papel. Qual revoga e qual convida?
//   - as acoes quebram em varias linhas em vez de estourar a largura.
//   - window.confirm/alert -> ConfirmModal do proprio modulo. Dialogo nativo em
//     PWA no iOS e inconsistente, e destoa do resto do painel.
//   - Avatar compartilhado no lugar do <img> cru (era o ultimo warning de lint
//     do modulo, e o Avatar ja trata iniciais, cor e imagem).
//   - glassCard/inkLight no lugar do card branco na mao.
//
// Dois bugs corrigidos:
//   1. OVERLAY TRAVADO. `onRevoke={p => { setRevoking(p.id); handleRevoke(p) }}`
//      ligava o overlay ANTES do window.confirm. Cancelando o confirm, o
//      `return` acontecia antes do try e o `finally` nunca rodava: o cinza
//      "Revogando acesso..." ficava preso ate o F5.
//   2. RELOAD DA APLICACAO INTEIRA depois de revogar, so para atualizar um
//      campo. Agora a page recebe onRevoked e atualiza o estado local.

import { useState, useEffect, useCallback } from 'react'
import {
  UserCog, Send, Copy, Check, RefreshCw, X, ShieldOff, Clock, CircleCheck, Mail,
} from 'lucide-react'

import { colors, typography, transitions } from '@/shared/theme'
import { Professional } from '@/features/professionals/types'
import api from '@/shared/lib/apiClient'
import { useAuth } from '@/hooks/useAuth'
import { getRoleLabel } from '@/app/components/navigation/navigation.config'

import Avatar       from './Avatar'
import ConfirmModal from './ConfirmModal'

// ─── Types ──────────────────────────────────────────────────────────────────
type InviteStatus = 'PENDING' | 'ACCEPTED' | 'CANCELED' | 'EXPIRED'
type InviteRole   = 'MANAGER' | 'RECEPTIONIST' | 'STAFF' | 'BASIC_STAFF'

interface Invite {
  id:             string
  email:          string
  role:           InviteRole
  status:         InviteStatus
  acceptLink:     string
  expiresAt:      string
  createdAt:      string
  professional?:  { id: string; name: string; avatarUrl?: string | null } | null
  invitedBy?:     { id: string; name: string } | null
}

interface AccessRow {
  prof:       Professional
  invite:     Invite | null
  hasAccess:  boolean
  userEmail?: string
  userRole?:  string
}

interface Props {
  professionals: Professional[]
  loading:       boolean
  /** Atualiza o estado da page apos revogar, no lugar do reload da aplicacao. */
  onRevoked?:    (profId: string) => void
}

/** Alvo minimo de toque. */
const TAP = 44

const ROLE_OPTIONS: Array<{ value: InviteRole; label: string; color: string; bg: string; hint: string }> = [
  { value: 'MANAGER',      label: 'Gerente',       color: '#1d4ed8', bg: '#eff6ff', hint: 'Equipe + caixa + configurações' },
  { value: 'RECEPTIONIST', label: 'Recepcionista', color: '#7c3aed', bg: '#f5f3ff', hint: 'Agenda + clientes + estoque' },
  { value: 'STAFF',        label: 'Funcionário',   color: '#166534', bg: '#f0fdf4', hint: 'Agenda + clientes + caixa' },
  { value: 'BASIC_STAFF',  label: 'Func. básico',  color: '#57534e', bg: '#fafaf9', hint: 'Só a própria agenda' },
]

function roleMeta(role?: string) {
  return ROLE_OPTIONS.find(r => r.value === role)
      ?? { color: '#57534e', bg: '#fafaf9', label: getRoleLabel(role), hint: '' }
}

// ─── Botao de acao com rotulo ───────────────────────────────────────────────
function ActionButton({
  label, Icon, tone = 'neutral', onClick,
}: {
  label:   string
  Icon:    React.ComponentType<{ size?: number; strokeWidth?: number }>
  tone?:   'neutral' | 'danger' | 'primary'
  onClick: () => void
}) {
  const palette = {
    neutral: { bg: '#fff',                  fg: colors.gray[700],    border: '1px solid rgba(17,17,20,0.10)' },
    danger:  { bg: 'rgba(220,38,38,0.06)',  fg: colors.red.DEFAULT,  border: '1px solid rgba(220,38,38,0.20)' },
    primary: { bg: colors.red.gradient,     fg: '#fff',              border: 'none' },
  }[tone]

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        minHeight:               36,
        display:                 'inline-flex',
        alignItems:              'center',
        gap:                     6,
        padding:                 '0 13px',
        borderRadius:            999,
        border:                  palette.border,
        background:              palette.bg,
        color:                   palette.fg,
        fontSize:                12.5,
        fontWeight:              700,
        fontFamily:              'inherit',
        cursor:                  'pointer',
        whiteSpace:              'nowrap',
        transition:              `filter ${transitions.fast}`,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <Icon size={14} strokeWidth={2.2} />
      {label}
    </button>
  )
}

// ─── Modal de convite ───────────────────────────────────────────────────────
function InviteModal({
  prof, onClose, onSent,
}: {
  prof:    Professional | null
  onClose: () => void
  onSent:  (invite: Invite) => void
}) {
  const [email,   setEmail]   = useState(prof?.email ?? '')
  const [role,    setRole]    = useState<InviteRole>('STAFF')
  const [sending, setSending] = useState(false)
  const [error,   setError]   = useState('')

  async function handleSend() {
    if (!email.trim()) { setError('Informe o e-mail'); return }
    try {
      setSending(true)
      setError('')
      const res = await api.post('/invites', {
        email:          email.trim(),
        role,
        professionalId: prof?.id ?? undefined,
      })
      onSent(res.data)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Erro ao enviar convite')
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position:             'fixed',
        inset:                0,
        background:           'rgba(0,0,0,0.35)',
        backdropFilter:       'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex:               9998,
        display:              'flex',
        justifyContent:       'center',
      }}
      className="eq-inv-overlay"
    >
      <style>{`
        @keyframes eq-sheet-up { from{transform:translateY(100%)} to{transform:translateY(0)} }
        @keyframes eq-fade-up  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        /* Folha por baixo em tela estreita, caixa centrada quando ha espaco. */
        .eq-inv-overlay{ align-items: flex-end; }
        .eq-inv-modal{ width:100%; border-radius:22px 22px 0 0;
                       animation: eq-sheet-up 260ms cubic-bezier(.22,1,.36,1); }
        @media (min-width: 640px){
          .eq-inv-overlay{ align-items: center; }
          .eq-inv-modal{ width:480px; border-radius:20px;
                         animation: eq-fade-up 200ms ease; }
        }
        @media (prefers-reduced-motion: reduce){ .eq-inv-modal{ animation:none } }
      `}</style>

      <div
        className="eq-inv-modal"
        role="dialog"
        aria-label="Convidar para o sistema"
        style={{
          background:    '#fff',
          maxWidth:      '100%',
          maxHeight:     '90vh',
          overflowY:     'auto',
          padding:       '22px 22px max(22px, env(safe-area-inset-bottom))',
          fontFamily:    typography.fontFamily,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 18 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: colors.gray[900], letterSpacing: '-0.01em' }}>
              {prof ? `Convidar ${prof.name}` : 'Convidar funcionário'}
            </div>
            <div style={{ fontSize: 12.5, color: colors.gray.dimText, marginTop: 3 }}>
              O convite vale por 7 dias
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            style={{
              width: TAP, height: TAP, flexShrink: 0,
              display: 'grid', placeItems: 'center',
              border: 'none', borderRadius: 14,
              background: 'rgba(17,17,20,0.05)',
              color: colors.gray.dimText,
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <X size={19} strokeWidth={2.4} />
          </button>
        </div>

        <label style={{
          display: 'block', fontSize: 12, fontWeight: 700,
          color: colors.gray.dimText, marginBottom: 6,
        }}>
          E-mail
        </label>
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="funcionario@email.com"
          style={{
            width:        '100%',
            boxSizing:    'border-box',
            minHeight:    TAP,
            padding:      '0 14px',
            borderRadius: 14,
            border:       `1px solid ${colors.gray.borderMd}`,
            // 16px evita o zoom automatico do iOS ao focar o campo
            fontSize:     16,
            outline:      'none',
            fontFamily:   'inherit',
            color:        colors.gray[900],
            marginBottom: 18,
          }}
        />

        <div style={{
          fontSize: 12, fontWeight: 700,
          color: colors.gray.dimText, marginBottom: 8,
        }}>
          O que essa pessoa vai poder fazer
        </div>
        <div style={{ display: 'grid', gap: 8, marginBottom: 18 }}>
          {ROLE_OPTIONS.map(opt => {
            const active = role === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRole(opt.value)}
                aria-pressed={active}
                style={{
                  minHeight:               TAP + 10,
                  padding:                 '10px 14px',
                  borderRadius:            14,
                  cursor:                  'pointer',
                  textAlign:               'left',
                  fontFamily:              'inherit',
                  border:                  active ? `2px solid ${opt.color}` : `1px solid ${colors.gray.border}`,
                  background:              active ? opt.bg : '#fff',
                  transition:              `all ${transitions.fast}`,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <div style={{ fontSize: 13.5, fontWeight: 700, color: opt.color }}>{opt.label}</div>
                <div style={{ fontSize: 11.5, color: colors.gray.dimText, marginTop: 2 }}>{opt.hint}</div>
              </button>
            )
          })}
        </div>

        {error && (
          <div style={{
            fontSize: 12.5, color: colors.red.DEFAULT,
            marginBottom: 12, padding: '10px 13px',
            background: 'rgba(220,38,38,0.07)', borderRadius: 12,
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1, minHeight: TAP, borderRadius: 999,
              border: `1px solid ${colors.gray.border}`,
              background: '#fff', color: colors.gray.dimText,
              fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={sending}
            style={{
              flex: 2, minHeight: TAP, borderRadius: 999, border: 'none',
              background: sending ? '#fca5a5' : colors.red.gradient,
              color: '#fff', fontSize: 13.5, fontWeight: 700,
              cursor: sending ? 'default' : 'pointer',
              fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              boxShadow: `0 4px 12px ${colors.red.glow}`,
            }}
          >
            <Send size={15} strokeWidth={2.3} />
            {sending ? 'Enviando…' : 'Enviar convite'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Linha ──────────────────────────────────────────────────────────────────
function AccessRowItem({
  row, onInvite, onRevoke, onCancel, onResend, onCopyLink, copiedId,
}: {
  row:        AccessRow
  onInvite:   (prof: Professional) => void
  onRevoke:   (prof: Professional) => void
  onCancel:   (invite: Invite) => void
  onResend:   (invite: Invite) => void
  onCopyLink: (link: string) => void
  copiedId:   string | null
}) {
  const { prof, invite, hasAccess } = row
  const meta = roleMeta(invite?.role ?? (hasAccess ? row.userRole : undefined))

  let statusEl: React.ReactNode
  if (hasAccess) {
    statusEl = (
      <span style={{ ...chipBase, color: '#166534', background: '#f0fdf4' }}>
        <CircleCheck size={11} strokeWidth={2.4} /> Ativo
      </span>
    )
  } else if (invite?.status === 'PENDING') {
    statusEl = (
      <span style={{ ...chipBase, color: '#854d0e', background: '#fef9c3' }}>
        <Clock size={11} strokeWidth={2.4} /> Convite pendente
      </span>
    )
  } else {
    statusEl = (
      <span style={{ ...chipBase, color: colors.gray.dimText, background: 'rgba(17,17,20,0.05)' }}>
        Sem acesso
      </span>
    )
  }

  return (
    <div style={{
      display:      'flex',
      alignItems:   'flex-start',
      gap:          12,
      padding:      '14px 16px',
      borderTop:    '1px solid rgba(17,17,20,0.06)',
    }}>
      <Avatar name={prof.name} size={42} url={prof.avatarUrl} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize:     14.5,
          fontWeight:   700,
          color:        colors.gray[900],
          overflow:     'hidden',
          textOverflow: 'ellipsis',
          whiteSpace:   'nowrap',
        }}>
          {prof.name}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
          {(invite?.role || hasAccess) && (
            <span style={{ ...chipBase, background: meta.bg, color: meta.color }}>
              {meta.label}
            </span>
          )}
          {statusEl}
          {invite?.status === 'PENDING' && invite.email && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 11.5, color: colors.gray.dimText,
              maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              <Mail size={11} strokeWidth={2.2} /> {invite.email}
            </span>
          )}
        </div>

        {/* Acoes com rotulo. flexWrap para quebrarem em vez de estourar. */}
        <div style={{ display: 'flex', gap: 7, marginTop: 10, flexWrap: 'wrap' }}>
          {hasAccess && (
            <ActionButton label="Revogar acesso" Icon={ShieldOff} tone="danger" onClick={() => onRevoke(prof)} />
          )}

          {invite?.status === 'PENDING' && (
            <>
              <ActionButton
                label={copiedId === invite.id ? 'Link copiado' : 'Copiar link'}
                Icon={copiedId === invite.id ? Check : Copy}
                onClick={() => onCopyLink(invite.acceptLink)}
              />
              <ActionButton label="Reenviar" Icon={RefreshCw} onClick={() => onResend(invite)} />
              <ActionButton label="Cancelar convite" Icon={X} tone="danger" onClick={() => onCancel(invite)} />
            </>
          )}

          {!hasAccess && invite?.status !== 'PENDING' && (
            <ActionButton label="Convidar" Icon={Send} tone="primary" onClick={() => onInvite(prof)} />
          )}
        </div>
      </div>
    </div>
  )
}

const chipBase: React.CSSProperties = {
  display:      'inline-flex',
  alignItems:   'center',
  gap:          4,
  fontSize:     11,
  fontWeight:   700,
  padding:      '3px 8px',
  borderRadius: 999,
  whiteSpace:   'nowrap',
}

// ─── Principal ──────────────────────────────────────────────────────────────
export default function AcessosTab({ professionals, loading, onRevoked }: Props) {
  const { user: authUser } = useAuth()

  const [invites,    setInvites]    = useState<Invite[]>([])
  const [loadingInv, setLoadingInv] = useState(true)
  const [inviteProf, setInviteProf] = useState<Professional | null>(null)
  const [showInvite, setShowInvite] = useState(false)
  const [copiedId,   setCopiedId]   = useState<string | null>(null)

  const [revokeTarget, setRevokeTarget] = useState<Professional | null>(null)
  const [revoking,     setRevoking]     = useState(false)
  const [actionError,  setActionError]  = useState('')

  const fetchInvites = useCallback(async () => {
    try {
      setLoadingInv(true)
      const res = await api.get('/invites')
      setInvites(res.data ?? [])
    } catch {
      setInvites([])
    } finally {
      setLoadingInv(false)
    }
  }, [])

  useEffect(() => { fetchInvites() }, [fetchInvites])

  const rows: AccessRow[] = professionals.map(prof => {
    const invite = invites.find(i => i.status === 'PENDING' && i.professional?.id === prof.id) ?? null
    const hasAccess = Boolean(prof.userId) || (authUser?.professionalId === prof.id)
    const userRole = prof.user?.role ?? invite?.role ?? undefined
    return { prof, invite, hasAccess, userRole }
  })

  const activeCount  = rows.filter(r => r.hasAccess).length
  const pendingCount = rows.filter(r => r.invite?.status === 'PENDING').length
  const orphanInvites = invites.filter(i => i.status === 'PENDING' && !i.professional)

  function handleOpenInvite(prof: Professional) {
    setInviteProf(prof)
    setShowInvite(true)
  }

  function handleInviteSent(invite: Invite) {
    setInvites(prev => [invite, ...prev.filter(i => i.id !== invite.id)])
    setShowInvite(false)
  }

  /**
   * O overlay so liga DEPOIS da confirmacao. Antes ele era ligado no clique,
   * e cancelar o window.confirm deixava o cinza preso na tela ate o F5.
   */
  async function confirmRevoke() {
    const prof = revokeTarget
    if (!prof) return
    try {
      setRevoking(true)
      setActionError('')
      await api.delete(`/invites/access/${prof.id}`)
      setRevokeTarget(null)
      // Sem window.location.reload(): a page atualiza o estado local.
      onRevoked?.(prof.id)
    } catch {
      setActionError('Não foi possível revogar o acesso. Tente de novo.')
    } finally {
      setRevoking(false)
    }
  }

  async function handleCancel(invite: Invite) {
    try {
      setActionError('')
      await api.delete(`/invites/${invite.id}`)
      setInvites(prev => prev.filter(i => i.id !== invite.id))
    } catch {
      setActionError('Não foi possível cancelar o convite.')
    }
  }

  async function handleResend(invite: Invite) {
    try {
      setActionError('')
      // Cancela o atual e cria um novo para o mesmo email + profissional.
      await api.delete(`/invites/${invite.id}`)
      const res = await api.post('/invites', {
        email:          invite.email,
        role:           invite.role,
        professionalId: invite.professional?.id,
      })
      setInvites(prev => [res.data, ...prev.filter(i => i.id !== invite.id)])
    } catch {
      setActionError('Não foi possível reenviar o convite.')
    }
  }

  function handleCopyLink(link: string) {
    navigator.clipboard.writeText(link).catch(() => {})
    const invite = invites.find(i => i.acceptLink === link)
    if (invite) {
      setCopiedId(invite.id)
      window.setTimeout(() => setCopiedId(null), 2000)
    }
  }

  const isLoading = loading || loadingInv

  return (
    <>
      {showInvite && (
        <InviteModal
          prof={inviteProf}
          onClose={() => setShowInvite(false)}
          onSent={handleInviteSent}
        />
      )}

      {revokeTarget && (
        <ConfirmModal
          title="Revogar acesso?"
          body={`${revokeTarget.name} será desconectado imediatamente e perderá o acesso ao sistema. O cadastro do profissional continua aqui.`}
          confirmLabel="Sim, revogar"
          onConfirm={confirmRevoke}
          onCancel={() => setRevokeTarget(null)}
          confirming={revoking}
          isMobile={false}
        />
      )}

      <div style={{
        background:     'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(16px)',
        border:         '1px solid rgba(17,17,20,0.07)',
        borderRadius:   22,
        boxShadow:      '0 4px 20px rgba(17,17,20,0.05)',
        overflow:       'hidden',
        fontFamily:     typography.fontFamily,
      }}>
        {/* topo */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          gap:            12,
          padding:        '14px 16px',
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: colors.gray[900] }}>
              Contas de acesso
            </div>
            <div style={{ fontSize: 12.5, color: colors.gray.dimText, marginTop: 2 }}>
              {isLoading
                ? 'Carregando…'
                : `${activeCount} ${activeCount === 1 ? 'ativo' : 'ativos'}`
                  + ` · ${pendingCount} ${pendingCount === 1 ? 'convite pendente' : 'convites pendentes'}`}
            </div>
          </div>

          <button
            type="button"
            onClick={() => { setInviteProf(null); setShowInvite(true) }}
            style={{
              flexShrink:              0,
              minHeight:               TAP,
              display:                 'inline-flex',
              alignItems:              'center',
              gap:                     6,
              padding:                 '0 16px',
              borderRadius:            999,
              border:                  'none',
              background:              colors.red.gradient,
              color:                   '#fff',
              fontSize:                13,
              fontWeight:              700,
              fontFamily:              'inherit',
              cursor:                  'pointer',
              boxShadow:               `0 4px 12px ${colors.red.glow}`,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Send size={15} strokeWidth={2.3} />
            Convidar
          </button>
        </div>

        {actionError && (
          <div style={{
            margin:       '0 16px 12px',
            padding:      '10px 13px',
            borderRadius: 12,
            background:   'rgba(220,38,38,0.07)',
            color:        colors.red.DEFAULT,
            fontSize:     12.5,
          }}>
            {actionError}
          </div>
        )}

        {/* lista */}
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 44 }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              border: '2px solid #fca5a5', borderTopColor: colors.red.DEFAULT,
              animation: 'eq-spin 0.8s linear infinite',
            }} />
          </div>
        ) : rows.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 10, padding: 44, color: colors.gray.dimText,
          }}>
            <UserCog size={30} style={{ opacity: 0.18 }} />
            <span style={{ fontSize: 13 }}>Nenhum profissional cadastrado</span>
          </div>
        ) : (
          rows.map(row => (
            <AccessRowItem
              key={row.prof.id}
              row={row}
              onInvite={handleOpenInvite}
              onRevoke={setRevokeTarget}
              onCancel={handleCancel}
              onResend={handleResend}
              onCopyLink={handleCopyLink}
              copiedId={copiedId}
            />
          ))
        )}

        {/* convites sem profissional vinculado */}
        {orphanInvites.length > 0 && (
          <>
            <div style={{
              padding:       '10px 16px',
              fontSize:      11,
              fontWeight:    700,
              letterSpacing: '.12em',
              textTransform: 'uppercase',
              color:         colors.gray.dimText,
              borderTop:     '1px solid rgba(17,17,20,0.06)',
              background:    'rgba(17,17,20,0.02)',
            }}>
              Convites avulsos
            </div>

            {orphanInvites.map(invite => (
              <div key={invite.id} style={{
                display:    'flex',
                alignItems: 'flex-start',
                gap:        12,
                padding:    '14px 16px',
                borderTop:  '1px solid rgba(17,17,20,0.06)',
              }}>
                <span style={{
                  width: 42, height: 42, flexShrink: 0,
                  borderRadius: '50%',
                  display: 'grid', placeItems: 'center',
                  background: 'rgba(17,17,20,0.05)',
                  color: colors.gray.dimText,
                }}>
                  <Mail size={17} strokeWidth={2.1} />
                </span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14, fontWeight: 700, color: colors.gray[900],
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {invite.email}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
                    <span style={{ ...chipBase, background: roleMeta(invite.role).bg, color: roleMeta(invite.role).color }}>
                      {roleMeta(invite.role).label}
                    </span>
                    <span style={{ ...chipBase, color: '#854d0e', background: '#fef9c3' }}>
                      <Clock size={11} strokeWidth={2.4} /> Pendente
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 7, marginTop: 10, flexWrap: 'wrap' }}>
                    <ActionButton
                      label={copiedId === invite.id ? 'Link copiado' : 'Copiar link'}
                      Icon={copiedId === invite.id ? Check : Copy}
                      onClick={() => handleCopyLink(invite.acceptLink)}
                    />
                    <ActionButton label="Cancelar convite" Icon={X} tone="danger" onClick={() => handleCancel(invite)} />
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </>
  )
}
