'use client'
// src/app/dashboard/clientes/novo/page.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, User, Phone, Check, Mail, FileText } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { colors, typography, radius, shadows, transitions, glass } from '@/shared/theme'

function formatPhone(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2)  return `(${d}`
  if (d.length <= 7)  return `(${d.slice(0,2)}) ${d.slice(2)}`
  if (d.length <= 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
  return value
}

function formatCPF(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3)  return d
  if (d.length <= 6)  return `${d.slice(0,3)}.${d.slice(3)}`
  if (d.length <= 9)  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`
}

export default function NovoClientePage() {
  const router = useRouter()

  const [name,    setName]    = useState('')
  const [phone,   setPhone]   = useState('')
  const [email,   setEmail]   = useState('')
  const [cpf,     setCpf]     = useState('')
  const [saving,  setSaving]  = useState(false)
  const [success, setSuccess] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const isValid = name.trim().length >= 2 && phone.replace(/\D/g,'').length >= 8

  function handlePhone(v: string) {
    setPhone(formatPhone(v))
  }

  async function handleSave() {
    if (!isValid) return
    try {
      setSaving(true); setError(null)
      const res = await api.post('/clients', {
        name:  name.trim(),
        phone: phone.replace(/\D/g,''),
        email: email.trim() || null,
        cpf:   cpf.replace(/\D/g,'') || null,
      })
      const client = res.data?.data ?? res.data
      setSuccess(true)
      setTimeout(() => router.push(`/dashboard/clientes/${client.id}`), 1000)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string; message?: string } } })?.response?.data
      setError(msg?.error ?? msg?.message ?? 'Erro ao criar cliente.')
    } finally { setSaving(false) }
  }

  return (
    <>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .nc-input{width:100%;height:44px;padding:0 14px 0 40px;border-radius:${radius.sm}px;border:1px solid ${colors.gray.borderMd};background:${glass.surface.default.background};color:${colors.gray[900]};font-size:${typography.scale.md}px;outline:none;box-sizing:border-box;font-family:${typography.fontFamily};transition:border-color ${transitions.fast},box-shadow ${transitions.fast}}
        .nc-input:focus{border-color:${colors.red.borderHover};box-shadow:0 0 0 3px ${colors.red.focusRing}}
        .nc-input::placeholder{color:${colors.gray.dimTextLight}}
        .nc-label{display:block;font-size:${typography.scale.xs}px;font-weight:${typography.weight.bold};color:${colors.gray.dimText};letter-spacing:.08em;text-transform:uppercase;margin-bottom:7px}
        .back-btn:hover{background:${colors.red.subtle}!important}
      `}</style>

      <div style={{ maxWidth:480, animation:'fadeUp 0.3s ease', fontFamily:typography.fontFamily }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:28 }}>
          <button className="back-btn" onClick={() => router.push('/dashboard/clientes')} style={{ display:'flex', alignItems:'center', justifyContent:'center', width:34, height:34, borderRadius:radius.sm, border:`1px solid ${colors.gray.borderMd}`, background:glass.surface.default.background, cursor:'pointer', flexShrink:0, transition:transitions.fast }}>
            <ChevronLeft size={18} color={colors.gray.dimText} strokeWidth={2} />
          </button>
          <div>
            <h2 style={{ margin:0, fontSize:typography.scale['2xl'], fontWeight:typography.weight.bold, letterSpacing:'-0.025em', color:typography.color.primary }}>
              Novo cliente
            </h2>
            <p style={{ margin:'3px 0 0', fontSize:typography.scale.sm, color:typography.color.muted }}>
              Clientes › Novo
            </p>
          </div>
        </div>

        {/* Card */}
        <div style={{ background:glass.surface.default.background, backdropFilter:glass.surface.default.backdropFilter, borderRadius:radius['2xl'], border:`1px solid ${colors.gray.border}`, boxShadow:shadows.md, overflow:'hidden' }}>

          {/* Avatar preview */}
          <div style={{ padding:'28px 24px 20px', borderBottom:`1px solid ${colors.gray.border}`, display:'flex', alignItems:'center', gap:16, background:`linear-gradient(135deg, ${colors.red.subtle}, rgba(255,255,255,0))` }}>
            <div style={{ width:56, height:56, borderRadius:radius.full, background: name.trim() ? colors.red.gradient : `rgba(0,0,0,0.07)`, color:'#fff', fontSize:20, fontWeight:typography.weight.bold, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow: name.trim() ? shadows.redMd : 'none', transition:'all 0.3s' }}>
              {name.trim()
                ? name.trim().split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()
                : <User size={22} color="rgba(0,0,0,0.25)" />
              }
            </div>
            <div>
              <div style={{ fontSize:typography.scale.lg, fontWeight:typography.weight.bold, color: name.trim() ? typography.color.primary : typography.color.muted }}>
                {name.trim() || 'Nome do cliente'}
              </div>
              <div style={{ fontSize:typography.scale.sm, color:typography.color.muted, marginTop:2 }}>
                {phone || 'Telefone'}
              </div>
            </div>
          </div>

          {/* Campos */}
          <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:18 }}>

            {error && (
              <div style={{ padding:'10px 14px', borderRadius:radius.sm, background:`rgba(220,38,38,0.06)`, border:`1px solid ${colors.red.border}`, color:colors.red.dark, fontSize:typography.scale.sm }}>
                {error}
              </div>
            )}

            {success && (
              <div style={{ padding:'10px 14px', borderRadius:radius.sm, background:`rgba(22,163,74,0.06)`, border:`1px solid rgba(22,163,74,0.2)`, color:'#15803d', fontSize:typography.scale.sm, display:'flex', alignItems:'center', gap:6 }}>
                <Check size={14} /> Cliente criado! Redirecionando...
              </div>
            )}

            {/* Nome */}
            <div>
              <label className="nc-label">Nome completo *</label>
              <div style={{ position:'relative' }}>
                <User size={15} color={colors.gray.dimText} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                <input
                  className="nc-input"
                  placeholder="Ex: Lucas Mendes"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                  autoFocus
                />
              </div>
            </div>

            {/* Telefone */}
            <div>
              <label className="nc-label">Telefone *</label>
              <div style={{ position:'relative' }}>
                <Phone size={15} color={colors.gray.dimText} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                <input
                  className="nc-input"
                  placeholder="(11) 99999-9999"
                  value={phone}
                  onChange={e => handlePhone(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                  inputMode="tel"
                />
              </div>
            </div>
            {/* Email (opcional) */}
            <div>
              <label className="nc-label">Email <span style={{ textTransform:'none', fontWeight:500, color:colors.gray.dimTextLight }}>(opcional)</span></label>
              <div style={{ position:'relative' }}>
                <Mail size={15} color={colors.gray.dimText} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                <input
                  className="nc-input"
                  placeholder="cliente@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                  inputMode="email"
                  type="email"
                />
              </div>
            </div>
            {/* CPF (opcional) */}
            <div>
              <label className="nc-label">CPF <span style={{ textTransform:'none', fontWeight:500, color:colors.gray.dimTextLight }}>(opcional)</span></label>
              <div style={{ position:'relative' }}>
                <FileText size={15} color={colors.gray.dimText} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                <input
                  className="nc-input"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={e => setCpf(formatCPF(e.target.value))}
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                  inputMode="numeric"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding:'0 24px 24px', display:'flex', gap:8 }}>
            <button
              onClick={() => router.push('/dashboard/clientes')}
              style={{ padding:'12px 20px', borderRadius:radius.sm, border:`1px solid ${colors.gray.borderMd}`, background:glass.surface.default.background, fontSize:typography.scale.base, fontWeight:typography.weight.semibold, cursor:'pointer', color:typography.color.secondary, transition:transitions.fast }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!isValid || saving || success}
              style={{
                flex:1, padding:'12px', borderRadius:radius.sm, border:'none',
                background: success ? 'linear-gradient(135deg,#16a34a,#15803d)' : !isValid || saving ? `rgba(0,0,0,0.1)` : colors.red.gradient,
                color: !isValid || saving ? colors.gray.dimText : '#fff',
                fontSize:typography.scale.base, fontWeight:typography.weight.bold,
                cursor: !isValid || saving || success ? 'not-allowed' : 'pointer',
                boxShadow: isValid && !saving && !success ? shadows.redMd : 'none',
                transition:transitions.base,
                display:'flex', alignItems:'center', justifyContent:'center', gap:6,
              }}
            >
              {success ? <><Check size={15}/> Criado!</> : saving ? 'Salvando...' : 'Criar cliente'}
            </button>
          </div>
        </div>

        <p style={{ marginTop:14, fontSize:typography.scale.sm, color:typography.color.muted, textAlign:'center' }}>
          Após criar, você poderá adicionar mais informações no perfil do cliente.
        </p>
      </div>
    </>
  )
}
