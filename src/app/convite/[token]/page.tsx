'use client'
// src/app/convite/[token]/page.tsx

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Eye, EyeOff, CheckCircle, XCircle, Loader } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { getRoleLabel } from '@/app/components/navigation/navigation.config'

interface InviteData {
  id:        string
  email:     string
  role:      string
  roleLabel: string
  expiresAt: string
  business: {
    displayName: string
    logoUrl?:    string | null
    slug:        string
  }
  professional?: { name: string; avatarUrl?: string | null } | null
}

type PageState = 'loading' | 'valid' | 'invalid' | 'success'

function getErrorMessage(status?: number): string {
  if (status === 410) return 'Este convite foi cancelado, expirado ou já utilizado.'
  if (status === 404) return 'Convite não encontrado.'
  return 'Não foi possível carregar o convite. Tente novamente.'
}

function passwordStrength(pwd: string): { level: 0|1|2|3; label: string; color: string } {
  if (pwd.length === 0) return { level: 0, label: '',       color: 'transparent' }
  if (pwd.length < 6)   return { level: 1, label: 'Fraca',  color: '#ef4444' }
  if (pwd.length < 10)  return { level: 2, label: 'Média',  color: '#f59e0b' }
  return                       { level: 3, label: 'Forte',  color: '#16a34a' }
}

export default function ConvitePage() {
  const params = useParams()
  const router = useRouter()
  const token  = params?.token as string

  const [pageState,   setPageState]   = useState<PageState>('loading')
  const [invite,      setInvite]      = useState<InviteData | null>(null)
  const [errorMsg,    setErrorMsg]    = useState('')
  const [password,    setPassword]    = useState('')
  const [confirmPwd,  setConfirmPwd]  = useState('')
  const [showPwd,     setShowPwd]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting,  setSubmitting]  = useState(false)
  const [formError,   setFormError]   = useState('')

  useEffect(() => {
    if (!token) { setPageState('invalid'); return }
    api.get(`/invites/token/${token}`)
      .then(res => { setInvite(res.data); setPageState('valid') })
      .catch(err => { setErrorMsg(getErrorMessage(err?.response?.status)); setPageState('invalid') })
  }, [token])

  async function handleSubmit() {
    setFormError('')
    if (password.length < 6)      { setFormError('A senha deve ter pelo menos 6 caracteres'); return }
    if (password !== confirmPwd)   { setFormError('As senhas não coincidem'); return }
    try {
      setSubmitting(true)
      // Nome vem do Professional vinculado; se não tiver, usa o email
      const name = invite?.professional?.name ?? invite?.email ?? 'Funcionário'
      await api.post(`/invites/token/${token}/accept`, { name, password })
      setPageState('success')
      setTimeout(() => router.replace('/dashboard'), 1500)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setFormError(msg ?? 'Erro ao criar conta. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const strength = passwordStrength(password)

  const pageStyle: React.CSSProperties = {
    minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center',
    background:'linear-gradient(135deg,#0f0f18 0%,#1a1a2e 50%,#0f0f18 100%)',
    padding:'24px 16px', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
  }
  const cardStyle: React.CSSProperties = {
    width:'100%', maxWidth:420,
    background:'rgba(255,255,255,0.04)',
    backdropFilter:'blur(24px) saturate(160%)',
    WebkitBackdropFilter:'blur(24px) saturate(160%)',
    border:'1px solid rgba(255,255,255,0.10)',
    borderRadius:20, overflow:'hidden',
  }
  const inputStyle: React.CSSProperties = {
    width:'100%', boxSizing:'border-box', padding:'12px 14px',
    borderRadius:10, border:'1px solid rgba(255,255,255,0.12)',
    background:'rgba(255,255,255,0.06)', color:'#fff',
    fontSize:14, outline:'none', fontFamily:'inherit',
  }
  const labelStyle: React.CSSProperties = {
    fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.50)',
    display:'block', marginBottom:6,
  }

  if (pageState === 'loading') return (
    <div style={pageStyle}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
        <div style={{ width:40, height:40, borderRadius:'50%', border:'3px solid rgba(220,38,38,0.2)', borderTopColor:'#dc2626', animation:'spin 0.8s linear infinite' }} />
        <span style={{ fontSize:14, color:'rgba(255,255,255,0.45)' }}>Carregando convite...</span>
      </div>
    </div>
  )

  if (pageState === 'invalid') return (
    <div style={pageStyle}>
      <div style={{ ...cardStyle, padding:'40px 32px', textAlign:'center' }}>
        <XCircle size={44} color="#ef4444" style={{ marginBottom:16, opacity:0.9 }} />
        <div style={{ fontSize:20, fontWeight:700, color:'#fff', marginBottom:8 }}>Convite inválido</div>
        <div style={{ fontSize:14, color:'rgba(255,255,255,0.50)', lineHeight:1.6, marginBottom:24 }}>{errorMsg}</div>
        <button onClick={() => router.push('/login')} style={{ padding:'10px 24px', borderRadius:10, border:'1px solid rgba(255,255,255,0.15)', background:'transparent', color:'rgba(255,255,255,0.70)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
          Ir para o login
        </button>
      </div>
    </div>
  )

  if (pageState === 'success') return (
    <div style={pageStyle}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ ...cardStyle, padding:'40px 32px', textAlign:'center' }}>
        <CheckCircle size={44} color="#4ade80" style={{ marginBottom:16, opacity:0.9 }} />
        <div style={{ fontSize:20, fontWeight:700, color:'#fff', marginBottom:8 }}>Conta criada!</div>
        <div style={{ fontSize:14, color:'rgba(255,255,255,0.50)', lineHeight:1.6 }}>Redirecionando para o dashboard...</div>
        <div style={{ marginTop:20 }}>
          <div style={{ width:24, height:24, borderRadius:'50%', border:'2px solid rgba(74,222,128,0.3)', borderTopColor:'#4ade80', animation:'spin 0.8s linear infinite', margin:'0 auto' }} />
        </div>
      </div>
    </div>
  )

  const roleColor = ({ MANAGER:'#3b82f6', RECEPTIONIST:'#8b5cf6', STAFF:'#22c55e', BASIC_STAFF:'#94a3b8' } as Record<string,string>)[invite?.role ?? ''] ?? '#94a3b8'

  return (
    <div style={pageStyle}>
      <style>{`
        @keyframes spin    { to { transform:rotate(360deg); } }
        @keyframes fade-up { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .cv-input:focus { border-color:rgba(220,38,38,0.60)!important; box-shadow:0 0 0 3px rgba(220,38,38,0.12); }
        .cv-input::placeholder { color:rgba(255,255,255,0.25); }
      `}</style>

      <div style={{ ...cardStyle, animation:'fade-up 320ms cubic-bezier(.22,1,.36,1)' }}>

        {/* Header vermelho */}
        <div style={{ background:'linear-gradient(135deg,#dc2626,#b91c1c)', padding:'24px 28px', display:'flex', alignItems:'center', gap:14 }}>
          {invite?.business.logoUrl
            ? <img src={invite.business.logoUrl} alt="" style={{ width:44, height:44, borderRadius:12, objectFit:'cover', border:'2px solid rgba(255,255,255,0.3)' }} />
            : <div style={{ width:44, height:44, borderRadius:12, background:'rgba(255,255,255,0.20)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:800, color:'#fff', border:'2px solid rgba(255,255,255,0.25)' }}>
                {invite?.business.displayName?.charAt(0).toUpperCase()}
              </div>
          }
          <div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.65)', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:2 }}>Convite de</div>
            <div style={{ fontSize:16, fontWeight:700, color:'#fff' }}>{invite?.business.displayName}</div>
          </div>
        </div>

        <div style={{ padding:'24px 28px' }}>

          {/* Card info do profissional */}
          <div style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(255,255,255,0.06)', border:`1px solid ${roleColor}44`, borderRadius:10, padding:'10px 14px', marginBottom:20 }}>
            <div style={{ width:36, height:36, borderRadius:9, background:`${roleColor}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:roleColor, flexShrink:0 }}>
              {(invite?.professional?.name ?? invite?.email ?? '?').charAt(0).toUpperCase()}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:600, color:'#fff', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                {invite?.professional?.name ?? invite?.email}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:2 }}>
                <span style={{ fontSize:10, fontWeight:600, padding:'1px 7px', borderRadius:999, background:`${roleColor}22`, color:roleColor }}>
                  {getRoleLabel(invite?.role)}
                </span>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {invite?.email}
                </span>
              </div>
            </div>
          </div>

          <div style={{ fontSize:13, color:'rgba(255,255,255,0.45)', marginBottom:20, lineHeight:1.6 }}>
            Crie uma senha para acessar o dashboard da equipe.
          </div>

          {/* Só senha + confirmação */}
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

            <div>
              <label style={labelStyle}>Senha</label>
              <div style={{ position:'relative' }}>
                <input className="cv-input" type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" style={{ ...inputStyle, paddingRight:42 }} autoComplete="new-password" autoFocus />
                <button type="button" onClick={() => setShowPwd(v => !v)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', padding:2, display:'flex', color:'rgba(255,255,255,0.40)' }}>
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {password.length > 0 && (
                <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:6 }}>
                  <div style={{ flex:1, height:3, borderRadius:999, background:'rgba(255,255,255,0.08)', overflow:'hidden' }}>
                    <div style={{ height:'100%', borderRadius:999, background:strength.color, width:`${(strength.level/3)*100}%`, transition:'all 300ms ease' }} />
                  </div>
                  <span style={{ fontSize:11, color:strength.color, fontWeight:600, minWidth:36 }}>{strength.label}</span>
                </div>
              )}
            </div>

            <div>
              <label style={labelStyle}>Confirmar senha</label>
              <div style={{ position:'relative' }}>
                <input className="cv-input" type={showConfirm ? 'text' : 'password'} value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="Repita a senha" style={{ ...inputStyle, paddingRight:42, borderColor: confirmPwd && confirmPwd !== password ? 'rgba(239,68,68,0.5)' : undefined }} autoComplete="new-password" onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }} />
                <button type="button" onClick={() => setShowConfirm(v => !v)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', padding:2, display:'flex', color:'rgba(255,255,255,0.40)' }}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {formError && (
            <div style={{ marginTop:14, padding:'10px 14px', background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:10, fontSize:13, color:'#fca5a5', lineHeight:1.5 }}>
              {formError}
            </div>
          )}

          <button onClick={handleSubmit} disabled={submitting} style={{ marginTop:20, width:'100%', padding:'13px', borderRadius:12, border:'none', background: submitting ? 'rgba(220,38,38,0.50)' : 'linear-gradient(135deg,#dc2626,#b91c1c)', color:'#fff', fontSize:14, fontWeight:700, cursor: submitting ? 'default' : 'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:'0 6px 20px rgba(220,38,38,0.30)' }}>
            {submitting
              ? <><Loader size={16} style={{ animation:'spin 0.8s linear infinite' }} /> Criando conta...</>
              : 'Criar senha e entrar'
            }
          </button>

          <div style={{ marginTop:16, textAlign:'center', fontSize:12, color:'rgba(255,255,255,0.25)' }}>
            Já tem uma conta?{' '}
            <button onClick={() => router.push('/login')} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.50)', cursor:'pointer', fontSize:12, fontFamily:'inherit', textDecoration:'underline' }}>
              Fazer login
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
