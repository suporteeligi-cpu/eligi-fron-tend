'use client'
// src/app/dashboard/equipe/components/AcessosTab.tsx

import { useState, useEffect, useCallback } from 'react'
import { UserCog, Send, Copy, Check, RefreshCw, X, ShieldOff, Clock, CheckCircle, Mail } from 'lucide-react'
import { colors, typography, transitions } from '@/shared/theme'
import { Professional } from '@/features/professionals/types'
import api from '@/shared/lib/apiClient'
import { getRoleLabel } from '@/app/components/navigation/navigation.config'

// ─── Types ────────────────────────────────────────────────────────────────────
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
  invite:     Invite | null   // convite PENDING associado
  hasAccess:  boolean         // userId preenchido
  userEmail?: string
  userRole?:  string
}

interface Props {
  professionals: Professional[]
  isMobile:      boolean
  loading:       boolean
}

// ─── Role config ──────────────────────────────────────────────────────────────
const ROLE_OPTIONS: Array<{ value: InviteRole; label: string; color: string; bg: string }> = [
  { value: 'MANAGER',      label: 'Gerente',        color: '#1d4ed8', bg: '#eff6ff' },
  { value: 'RECEPTIONIST', label: 'Recepcionista',  color: '#7c3aed', bg: '#f5f3ff' },
  { value: 'STAFF',        label: 'Funcionário',    color: '#166534', bg: '#f0fdf4' },
  { value: 'BASIC_STAFF',  label: 'Func. básico',   color: '#57534e', bg: '#fafaf9' },
]

function roleMeta(role?: string) {
  return ROLE_OPTIONS.find(r => r.value === role) ?? { color: '#57534e', bg: '#fafaf9', label: getRoleLabel(role) }
}

// ─── Sub-componente: Modal de convite ─────────────────────────────────────────
interface InviteModalProps {
  prof:     Professional | null
  isMobile: boolean
  onClose:  () => void
  onSent:   (invite: Invite) => void
}

function InviteModal({ prof, isMobile, onClose, onSent }: InviteModalProps) {
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
        email: email.trim(),
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

  const overlayStyle: React.CSSProperties = {
    position:        'fixed',
    inset:           0,
    background:      'rgba(0,0,0,0.35)',
    backdropFilter:  'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    zIndex:          9998,
    display:         'flex',
    alignItems:      isMobile ? 'flex-end' : 'center',
    justifyContent:  'center',
  }

  const modalStyle: React.CSSProperties = {
    background:   '#fff',
    borderRadius: isMobile ? '20px 20px 0 0' : 16,
    width:        isMobile ? '100%' : 480,
    maxWidth:     '100%',
    padding:      '24px 24px ' + (isMobile ? 'max(24px,env(safe-area-inset-bottom))' : '24px'),
    fontFamily:   typography.fontFamily,
    animation:    isMobile ? 'eq-sheet-up 260ms cubic-bezier(.22,1,.36,1)' : 'eq-fade-up 200ms ease',
  }

  return (
    <div style={overlayStyle} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <style>{`
        @keyframes eq-sheet-up { from{transform:translateY(100%)} to{transform:translateY(0)} }
        @keyframes eq-fade-up  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
      <div style={modalStyle}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:typography.color.primary }}>
              {prof ? `Convidar ${prof.name}` : 'Convidar funcionário'}
            </div>
            <div style={{ fontSize:12, color:typography.color.muted, marginTop:2 }}>
              Convite válido por 7 dias
            </div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', padding:4, borderRadius:8, display:'flex' }}>
            <X size={18} color={typography.color.muted} />
          </button>
        </div>

        {/* E-mail */}
        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:12, fontWeight:600, color:typography.color.muted, display:'block', marginBottom:6 }}>
            E-mail
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="funcionario@email.com"
            style={{
              width:'100%', boxSizing:'border-box',
              padding:'10px 12px', borderRadius:10,
              border:`1px solid ${colors.gray.border}`,
              fontSize:13, outline:'none',
              fontFamily:typography.fontFamily,
              color:typography.color.primary,
            }}
          />
        </div>

        {/* Cargo */}
        <div style={{ marginBottom:20 }}>
          <label style={{ fontSize:12, fontWeight:600, color:typography.color.muted, display:'block', marginBottom:8 }}>
            Cargo
          </label>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {ROLE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setRole(opt.value)}
                style={{
                  padding:'10px 12px', borderRadius:10, cursor:'pointer',
                  border: role === opt.value ? `2px solid ${opt.color}` : `1px solid ${colors.gray.border}`,
                  background: role === opt.value ? opt.bg : '#fff',
                  textAlign:'left', fontFamily:'inherit',
                  transition:`all ${transitions.fast}`,
                }}
              >
                <div style={{ fontSize:12, fontWeight:700, color: opt.color }}>{opt.label}</div>
                <div style={{ fontSize:10, color:typography.color.muted, marginTop:2 }}>
                  {opt.value === 'MANAGER'      && 'Equipe + caixa + config'}
                  {opt.value === 'RECEPTIONIST' && 'Agenda + clientes + estoque'}
                  {opt.value === 'STAFF'        && 'Agenda + clientes + caixa'}
                  {opt.value === 'BASIC_STAFF'  && 'Só agenda própria'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Erro */}
        {error && (
          <div style={{ fontSize:12, color:'#dc2626', marginBottom:12, padding:'8px 12px', background:'#fef2f2', borderRadius:8 }}>
            {error}
          </div>
        )}

        {/* Ações */}
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button
            onClick={onClose}
            style={{ padding:'9px 16px', borderRadius:10, border:`1px solid ${colors.gray.border}`, background:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', color:typography.color.muted }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            style={{
              padding:'9px 18px', borderRadius:10, border:'none',
              background: sending ? '#fca5a5' : colors.red.gradient,
              color:'#fff', fontSize:13, fontWeight:700, cursor: sending ? 'default' : 'pointer',
              fontFamily:'inherit', display:'flex', alignItems:'center', gap:6,
              boxShadow:`0 4px 12px ${colors.red.glow}`,
            }}
          >
            <Send size={14} />
            {sending ? 'Enviando...' : 'Enviar convite'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-componente: linha de acesso ──────────────────────────────────────────
interface AccessRowItemProps {
  row:       AccessRow
  isMobile:  boolean
  onInvite:  (prof: Professional) => void
  onRevoke:  (prof: Professional) => void
  onCancel:  (invite: Invite) => void
  onResend:  (invite: Invite) => void
  onCopyLink:(link: string) => void
  copiedId:  string | null
}

function AccessRowItem({ row, isMobile, onInvite, onRevoke, onCancel, onResend, onCopyLink, copiedId }: AccessRowItemProps) {
  const { prof, invite, hasAccess } = row
  const meta = roleMeta(invite?.role ?? (hasAccess ? row.userRole : undefined))

  const initials = prof.name.split(' ').slice(0,2).map(n => n[0]).join('').toUpperCase()

  // Status visual
  let statusEl: React.ReactNode
  if (hasAccess) {
    statusEl = (
      <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:600, color:'#166534', background:'#f0fdf4', padding:'2px 8px', borderRadius:999 }}>
        <CheckCircle size={11} /> Ativo
      </span>
    )
  } else if (invite?.status === 'PENDING') {
    statusEl = (
      <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:600, color:'#854d0e', background:'#fef9c3', padding:'2px 8px', borderRadius:999 }}>
        <Clock size={11} /> Convite pendente
      </span>
    )
  } else {
    statusEl = (
      <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, color:typography.color.muted, background:colors.background?.page ?? '#f9fafb', padding:'2px 8px', borderRadius:999 }}>
        Sem acesso
      </span>
    )
  }

  return (
    <div style={{
      display:'flex', alignItems:'center', gap:12,
      padding: isMobile ? '12px 14px' : '12px 20px',
      borderBottom:`1px solid ${colors.gray.border}`,
    }}>
      {/* Avatar */}
      <div style={{
        width:38, height:38, borderRadius:11, flexShrink:0,
        background: prof.avatarUrl ? 'transparent' : colors.red.gradient,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:13, fontWeight:700, color:'#fff',
        overflow:'hidden',
      }}>
        {prof.avatarUrl
          ? <img src={prof.avatarUrl} alt={prof.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          : initials
        }
      </div>

      {/* Info */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:600, color:typography.color.primary, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
          {prof.name}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:3, flexWrap:'wrap' }}>
          {(invite?.role || hasAccess) && (
            <span style={{ fontSize:10, fontWeight:600, padding:'1px 7px', borderRadius:999, background: meta.bg, color: meta.color }}>
              {meta.label}
            </span>
          )}
          {statusEl}
          {invite?.status === 'PENDING' && invite.email && (
            <span style={{ fontSize:11, color:typography.color.muted, display:'flex', alignItems:'center', gap:3 }}>
              <Mail size={10} /> {invite.email}
            </span>
          )}
        </div>
      </div>

      {/* Ações */}
      <div style={{ display:'flex', gap:6, flexShrink:0 }}>
        {hasAccess && (
          <button
            onClick={() => onRevoke(prof)}
            style={{ fontSize:11, padding:'5px 10px', borderRadius:8, border:`1px solid #fca5a5`, background:'#fff', color:'#dc2626', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:4 }}
          >
            <ShieldOff size={12} />
            {!isMobile && 'Revogar'}
          </button>
        )}
        {invite?.status === 'PENDING' && (
          <>
            <button
              onClick={() => onCopyLink(invite.acceptLink)}
              style={{ fontSize:11, padding:'5px 10px', borderRadius:8, border:`1px solid ${colors.gray.border}`, background:'#fff', color:typography.color.muted, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:4 }}
              title="Copiar link"
            >
              {copiedId === invite.id ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
              {!isMobile && (copiedId === invite.id ? 'Copiado!' : 'Copiar link')}
            </button>
            <button
              onClick={() => onResend(invite)}
              style={{ fontSize:11, padding:'5px 10px', borderRadius:8, border:`1px solid ${colors.gray.border}`, background:'#fff', color:typography.color.muted, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:4 }}
              title="Reenviar e-mail"
            >
              <RefreshCw size={12} />
              {!isMobile && 'Reenviar'}
            </button>
            <button
              onClick={() => onCancel(invite)}
              style={{ fontSize:11, padding:'5px 10px', borderRadius:8, border:`1px solid #fca5a5`, background:'#fff', color:'#dc2626', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:4 }}
            >
              <X size={12} />
              {!isMobile && 'Cancelar'}
            </button>
          </>
        )}
        {!hasAccess && invite?.status !== 'PENDING' && (
          <button
            onClick={() => onInvite(prof)}
            style={{ fontSize:11, padding:'5px 12px', borderRadius:8, border:'none', background:colors.red.gradient, color:'#fff', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:4, boxShadow:`0 2px 8px ${colors.red.glow}` }}
          >
            <Send size={12} />
            {!isMobile && 'Convidar'}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── AcessosTab principal ─────────────────────────────────────────────────────
export default function AcessosTab({ professionals, isMobile, loading }: Props) {
  const [invites,     setInvites]     = useState<Invite[]>([])
  const [loadingInv,  setLoadingInv]  = useState(true)
  const [inviteProf,  setInviteProf]  = useState<Professional | null>(null)
  const [showInvite,  setShowInvite]  = useState(false)
  const [copiedId,    setCopiedId]    = useState<string | null>(null)
  const [revoking,    setRevoking]    = useState<string | null>(null)

  // Fetch invites
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

  // Monta rows cruzando professionals + invites
  const rows: AccessRow[] = professionals.map(prof => {
    // Convite PENDING associado a este profissional
    const invite = invites.find(i =>
      i.status === 'PENDING' && i.professional?.id === prof.id
    ) ?? null

    // @ts-expect-error userId é campo do backend não tipado no front ainda
    const hasAccess = Boolean(prof.userId)

    return { prof, invite, hasAccess }
  })

  const activeCount  = rows.filter(r => r.hasAccess).length
  const pendingCount = rows.filter(r => r.invite?.status === 'PENDING').length

  // ── Handlers ──────────────────────────────────────────────────────
  function handleOpenInvite(prof: Professional) {
    setInviteProf(prof)
    setShowInvite(true)
  }

  function handleInviteSent(invite: Invite) {
    setInvites(prev => [invite, ...prev.filter(i => i.id !== invite.id)])
    setShowInvite(false)
  }

  async function handleRevoke(prof: Professional) {
    if (!window.confirm(`Revogar acesso de ${prof.name}? A conta será desconectada imediatamente.`)) return
    try {
      setRevoking(prof.id)
      await api.delete(`/invites/access/${prof.id}`)
      // Recarrega a página pra atualizar o prof.userId (vem do /equipe)
      window.location.reload()
    } catch {
      alert('Erro ao revogar acesso')
    } finally {
      setRevoking(null)
    }
  }

  async function handleCancel(invite: Invite) {
    try {
      await api.delete(`/invites/${invite.id}`)
      setInvites(prev => prev.filter(i => i.id !== invite.id))
    } catch {
      alert('Erro ao cancelar convite')
    }
  }

  async function handleResend(invite: Invite) {
    try {
      // Cancela o atual e cria novo pro mesmo email+profissional
      await api.delete(`/invites/${invite.id}`)
      const res = await api.post('/invites', {
        email:          invite.email,
        role:           invite.role,
        professionalId: invite.professional?.id,
      })
      setInvites(prev => [res.data, ...prev.filter(i => i.id !== invite.id)])
    } catch {
      alert('Erro ao reenviar convite')
    }
  }

  function handleCopyLink(link: string) {
    navigator.clipboard.writeText(link).catch(() => {})
    const invite = invites.find(i => i.acceptLink === link)
    if (invite) {
      setCopiedId(invite.id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  // ── Render ────────────────────────────────────────────────────────
  const isLoading = loading || loadingInv

  return (
    <>
      {showInvite && (
        <InviteModal
          prof={inviteProf}
          isMobile={isMobile}
          onClose={() => setShowInvite(false)}
          onSent={handleInviteSent}
        />
      )}

      <div style={{ fontFamily: typography.fontFamily, height: '100%', display: 'flex', flexDirection: 'column' }}>

        {/* Top bar */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding: isMobile ? '12px 14px' : '14px 20px',
          borderBottom:`1px solid ${colors.gray.border}`,
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:typography.color.primary }}>
              Contas de acesso
            </div>
            <div style={{ fontSize:12, color:typography.color.muted, marginTop:2 }}>
              {isLoading
                ? 'Carregando...'
                : `${activeCount} ativo${activeCount !== 1 ? 's' : ''} · ${pendingCount} convite${pendingCount !== 1 ? 's' : ''} pendente${pendingCount !== 1 ? 's' : ''}`
              }
            </div>
          </div>
          <button
            onClick={() => { setInviteProf(null); setShowInvite(true) }}
            style={{
              display:'flex', alignItems:'center', gap:6,
              padding:'8px 16px', borderRadius:10, border:'none',
              background: colors.red.gradient, color:'#fff',
              fontSize:12, fontWeight:700, cursor:'pointer',
              fontFamily:'inherit',
              boxShadow:`0 4px 12px ${colors.red.glow}`,
            }}
          >
            <Send size={13} />
            {isMobile ? 'Convidar' : 'Novo convite'}
          </button>
        </div>

        {/* Lista */}
        <div style={{ flex:1, overflowY:'auto' }}>
          {isLoading ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:40 }}>
              <div style={{ width:24, height:24, borderRadius:'50%', border:'2px solid #fca5a5', borderTopColor:'#dc2626', animation:'eq-spin 0.8s linear infinite' }} />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState />
          ) : (
            rows.map(row => (
              <AccessRowItem
                key={row.prof.id}
                row={row}
                isMobile={isMobile}
                onInvite={handleOpenInvite}
                onRevoke={prof => { setRevoking(prof.id); handleRevoke(prof) }}
                onCancel={handleCancel}
                onResend={handleResend}
                onCopyLink={handleCopyLink}
                copiedId={copiedId}
              />
            ))
          )}

          {/* Convites sem profissional vinculado */}
          {invites.filter(i => i.status === 'PENDING' && !i.professional).length > 0 && (
            <>
              <div style={{ padding:'8px 20px', fontSize:11, fontWeight:600, color:typography.color.muted, textTransform:'uppercase', letterSpacing:'.06em', borderBottom:`1px solid ${colors.gray.border}` }}>
                Convites avulsos (sem profissional)
              </div>
              {invites.filter(i => i.status === 'PENDING' && !i.professional).map(invite => (
                <div key={invite.id} style={{
                  display:'flex', alignItems:'center', gap:12,
                  padding: isMobile ? '12px 14px' : '12px 20px',
                  borderBottom:`1px solid ${colors.gray.border}`,
                }}>
                  <div style={{
                    width:38, height:38, borderRadius:11, flexShrink:0,
                    background:'#f3f4f6',
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    <Mail size={16} color={typography.color.muted} />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:typography.color.primary }}>{invite.email}</div>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:3 }}>
                      <span style={{ fontSize:10, fontWeight:600, padding:'1px 7px', borderRadius:999, background: roleMeta(invite.role).bg, color: roleMeta(invite.role).color }}>
                        {roleMeta(invite.role).label}
                      </span>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:600, color:'#854d0e', background:'#fef9c3', padding:'2px 8px', borderRadius:999 }}>
                        <Clock size={11} /> Pendente
                      </span>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={() => handleCopyLink(invite.acceptLink)} style={{ fontSize:11, padding:'5px 10px', borderRadius:8, border:`1px solid ${colors.gray.border}`, background:'#fff', color:typography.color.muted, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:4 }}>
                      {copiedId === invite.id ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                      {!isMobile && (copiedId === invite.id ? 'Copiado!' : 'Copiar')}
                    </button>
                    <button onClick={() => handleCancel(invite)} style={{ fontSize:11, padding:'5px 10px', borderRadius:8, border:`1px solid #fca5a5`, background:'#fff', color:'#dc2626', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:4 }}>
                      <X size={12} />
                      {!isMobile && 'Cancelar'}
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {revoking && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.2)', zIndex:9997, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'#fff', borderRadius:14, padding:'20px 28px', fontSize:13, color:typography.color.muted }}>
            Revogando acesso...
          </div>
        </div>
      )}
    </>
  )
}

function EmptyState() {
  return (
    <div style={{
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      gap:10, padding:48, color:typography.color.muted,
      fontFamily: typography.fontFamily,
    }}>
      <UserCog size={32} style={{ opacity:0.18 }} />
      <span style={{ fontSize:13 }}>Nenhum profissional cadastrado</span>
    </div>
  )
}
