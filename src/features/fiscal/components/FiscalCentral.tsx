// src/features/fiscal/components/FiscalCentral.tsx
'use client'

import { useRef, useState } from 'react'
import type { CSSProperties, ChangeEvent } from 'react'
import { ShieldCheck, ShieldAlert, FileKey2, Trash2 } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import type { FiscalOverview, FiscalProfile, FiscalRegime, FiscalStatus } from '../types'
import EmissionsList from './EmissionsList'
import { apiErrorMessage, formatCnpj } from '../utils'

const card: CSSProperties = {
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 17,
  padding: 20,
  backdropFilter: 'blur(24px)',
}
const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: 10.5,
  fontWeight: 600,
  letterSpacing: 0.6,
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.45)',
  marginBottom: 6,
}
const inputStyle: CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 11,
  padding: '11px 13px',
  color: '#f4f4f5',
  fontSize: 13.5,
  outline: 'none',
  boxSizing: 'border-box',
}
const primaryBtn: CSSProperties = {
  background: 'linear-gradient(135deg,#dc2626,#b91c1c)',
  border: 'none',
  color: '#fff',
  fontSize: 13.5,
  fontWeight: 700,
  padding: '12px 24px',
  borderRadius: 12,
  cursor: 'pointer',
}

const STATUS_CFG: Record<FiscalStatus, { label: string; color: string; bg: string }> = {
  INCOMPLETE: { label: 'Configuração incompleta', color: '#fbbf24', bg: 'rgba(245,158,11,0.12)' },
  READY_TO_TEST: { label: 'Pronto pra nota de teste', color: '#60a5fa', bg: 'rgba(37,99,235,0.14)' },
  ACTIVE: { label: 'Emissão ativa', color: '#4ade80', bg: 'rgba(0,184,12,0.12)' },
  BLOCKED: { label: 'Certificado vencido', color: '#f87171', bg: 'rgba(220,38,38,0.13)' },
}

interface Props {
  overview: FiscalOverview
  onChanged: () => void
}

export default function FiscalCentral({ overview, onChanged }: Props) {
  const profile = overview.profile
  const status: FiscalStatus = profile?.status ?? 'INCOMPLETE'
  const st = STATUS_CFG[status]

  return (
    <div>
      {/* hero de status */}
      <div
        style={{
          ...card,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap',
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, maxWidth: 520 }}>
          Módulo <b style={{ color: '#4ade80' }}>ativo</b> na sua assinatura (R$ 29,90/mês). As
          notas emitidas pelo caixa vão aparecer aqui — o motor de emissão está em construção.
        </div>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: st.color,
            background: st.bg,
            border: `1px solid ${st.color}44`,
            padding: '7px 14px',
            borderRadius: 99,
            whiteSpace: 'nowrap',
          }}
        >
          {st.label}
        </span>
      </div>

      {status === 'ACTIVE' || status === 'READY_TO_TEST' ? <EmissionsList monthRef={new Date()} /> : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 14 }}>
        <FiscalDataCard profile={profile} prefillCnpj={overview.prefill.cnpj} onSaved={onChanged} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <CertificateCard profile={profile} onChanged={onChanged} />
          <AddonCard onChanged={onChanged} />
        </div>
      </div>
    </div>
  )
}

/* ── Dados fiscais ─────────────────────────────────────────────── */
function FiscalDataCard({
  profile,
  prefillCnpj,
  onSaved,
}: {
  profile: FiscalProfile | null
  prefillCnpj: string | null
  onSaved: () => void
}) {
  const [cnpj, setCnpj] = useState(() => formatCnpj(profile?.cnpj ?? prefillCnpj ?? ''))
  const [im, setIm] = useState(() => profile?.inscricaoMunicipal ?? '')
  const [regime, setRegime] = useState<FiscalRegime>(() => profile?.regime ?? 'SIMPLES_NACIONAL')
  const [codigo, setCodigo] = useState(() => profile?.codigoTributacaoNacional ?? '0601')
  const [aliquota, setAliquota] = useState(() =>
    profile ? String(profile.aliquotaIss).replace('.', ',') : '2,00',
  )
  const [ibge, setIbge] = useState(() => profile?.codigoMunicipioIbge ?? '')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const save = () => {
    if (busy) return
    const aliquotaNum = Number(aliquota.replace(',', '.'))
    if (Number.isNaN(aliquotaNum)) {
      setMsg({ ok: false, text: 'Alíquota inválida.' })
      return
    }
    setBusy(true)
    setMsg(null)
    api
      .put('/fiscal/profile', {
        cnpj: cnpj.replace(/\D/g, ''),
        inscricaoMunicipal: im.trim(),
        regime,
        codigoTributacaoNacional: codigo.trim(),
        aliquotaIss: aliquotaNum,
        codigoMunicipioIbge: ibge.trim(),
      })
      .then(() => {
        setMsg({ ok: true, text: 'Dados fiscais salvos.' })
        onSaved()
      })
      .catch((err: unknown) => setMsg({ ok: false, text: apiErrorMessage(err) }))
      .finally(() => setBusy(false))
  }

  return (
    <div style={card}>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>🏛️ Dados fiscais</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={labelStyle}>CNPJ</label>
          <input
            style={inputStyle}
            value={cnpj}
            onChange={(e) => setCnpj(formatCnpj(e.target.value))}
            placeholder="00.000.000/0000-00"
            inputMode="numeric"
          />
        </div>
        <div>
          <label style={labelStyle}>Inscrição Municipal</label>
          <input style={inputStyle} value={im} onChange={(e) => setIm(e.target.value)} placeholder="Ex: 1.234.567-8" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={labelStyle}>Regime</label>
          <select style={inputStyle} value={regime} onChange={(e) => setRegime(e.target.value as FiscalRegime)}>
            <option value="SIMPLES_NACIONAL">Simples Nacional (ME/EPP)</option>
            <option value="MEI">MEI</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Alíquota ISS (%)</label>
          <input style={inputStyle} value={aliquota} onChange={(e) => setAliquota(e.target.value)} inputMode="decimal" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 6 }}>
        <div>
          <label style={labelStyle}>Código de tributação</label>
          <input style={inputStyle} value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="06.01" />
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 5, lineHeight: 1.4 }}>
            06.01 = barbearia, cabeleireiro, manicure · 06.02 = estética
          </div>
        </div>
        <div>
          <label style={labelStyle}>Código IBGE do município</label>
          <input style={inputStyle} value={ibge} onChange={(e) => setIbge(e.target.value)} placeholder="7 dígitos" inputMode="numeric" />
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 5, lineHeight: 1.4 }}>
            Busque &quot;código IBGE + sua cidade&quot;
          </div>
        </div>
      </div>

      {msg && (
        <div style={{ fontSize: 12.5, color: msg.ok ? '#4ade80' : '#fca5a5', margin: '10px 0 0' }}>{msg.text}</div>
      )}

      <button onClick={save} disabled={busy} style={{ ...primaryBtn, marginTop: 14, opacity: busy ? 0.6 : 1 }}>
        {busy ? 'Salvando…' : 'Salvar dados fiscais'}
      </button>
    </div>
  )
}

/* ── Certificado A1 ────────────────────────────────────────────── */
function CertificateCard({ profile, onChanged }: { profile: FiscalProfile | null; onChanged: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [pfxBase64, setPfxBase64] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const cert = profile?.certificate ?? null
  // Vencimento vem do status derivado no back (fonte única) — sem Date.now() no render (Compiler purity)
  const expired = profile?.status === 'BLOCKED'
  const hasProfile = Boolean(profile)

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      const base64 = result.split(',')[1] ?? ''
      setPfxBase64(base64)
      setFileName(file.name)
      setMsg(null)
    }
    reader.onerror = () => setMsg('Não foi possível ler o arquivo.')
    reader.readAsDataURL(file)
  }

  const upload = () => {
    if (busy || !pfxBase64) return
    setBusy(true)
    setMsg(null)
    api
      .post('/fiscal/certificate', { pfxBase64, password })
      .then(() => {
        setPfxBase64(null)
        setFileName(null)
        setPassword('')
        onChanged()
      })
      .catch((err: unknown) => setMsg(apiErrorMessage(err)))
      .finally(() => setBusy(false))
  }

  const remove = () => {
    if (busy) return
    if (!window.confirm('Remover o certificado? A emissão de notas para de funcionar até enviar outro.')) return
    setBusy(true)
    api
      .delete('/fiscal/certificate')
      .then(() => onChanged())
      .catch((err: unknown) => setMsg(apiErrorMessage(err)))
      .finally(() => setBusy(false))
  }

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>🔐 Certificado A1</div>
        {cert && (
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: expired ? '#f87171' : '#4ade80',
              background: expired ? 'rgba(220,38,38,0.12)' : 'rgba(0,184,12,0.12)',
              border: `1px solid ${expired ? 'rgba(220,38,38,0.35)' : 'rgba(0,184,12,0.3)'}`,
              padding: '3px 9px',
              borderRadius: 99,
            }}
          >
            {expired ? 'VENCIDO' : 'VÁLIDO'}
          </span>
        )}
      </div>

      {cert ? (
        <div>
          <div style={{ display: 'flex', gap: 11, alignItems: 'center', fontSize: 12.5, color: 'rgba(255,255,255,0.6)' }}>
            {expired ? <ShieldAlert size={30} color="#f87171" /> : <ShieldCheck size={30} color="#4ade80" />}
            <div>
              <div style={{ color: '#f4f4f5', fontWeight: 600 }}>{cert.subject ?? 'Certificado'}</div>
              {cert.expiresAt && (
                <div>
                  expira {new Date(cert.expiresAt).toLocaleDateString('pt-BR')} · avisamos antes de vencer
                </div>
              )}
            </div>
          </div>
          <button
            onClick={remove}
            disabled={busy}
            style={{
              background: 'none',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#fca5a5',
              fontSize: 12,
              padding: '7px 13px',
              borderRadius: 9,
              cursor: 'pointer',
              marginTop: 12,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Trash2 size={13} /> Remover / substituir
          </button>
        </div>
      ) : (
        <div>
          <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, margin: '0 0 12px' }}>
            É a assinatura eletrônica do seu CNPJ — obrigatória pra emitir nota. Arquivo .pfx ou
            .p12, guardado criptografado.
          </p>
          {!hasProfile && (
            <div style={{ fontSize: 12, color: '#fbbf24', marginBottom: 12 }}>
              Salve os dados fiscais primeiro.
            </div>
          )}
          <input ref={fileRef} type="file" accept=".pfx,.p12" onChange={onFile} style={{ display: 'none' }} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={!hasProfile || busy}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.05)',
              border: '2px dashed rgba(255,255,255,0.15)',
              borderRadius: 13,
              padding: '18px 14px',
              color: 'rgba(255,255,255,0.7)',
              fontSize: 13,
              cursor: !hasProfile || busy ? 'not-allowed' : 'pointer',
              opacity: !hasProfile ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <FileKey2 size={17} />
            {fileName ?? 'Escolher arquivo .pfx'}
          </button>
          {pfxBase64 && (
            <div style={{ marginTop: 12 }}>
              <label style={labelStyle}>Senha do certificado</label>
              <input
                style={inputStyle}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button
                onClick={upload}
                disabled={busy || password.length === 0}
                style={{ ...primaryBtn, width: '100%', marginTop: 12, opacity: busy || password.length === 0 ? 0.6 : 1 }}
              >
                {busy ? 'Validando…' : 'Enviar certificado'}
              </button>
            </div>
          )}
        </div>
      )}

      {msg && <div style={{ fontSize: 12.5, color: '#fca5a5', marginTop: 10 }}>{msg}</div>}
    </div>
  )
}

/* ── Add-on ────────────────────────────────────────────────────── */
function AddonCard({ onChanged }: { onChanged: () => void }) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const deactivate = () => {
    if (busy) return
    if (
      !window.confirm(
        'Desativar o módulo de Notas Fiscais?\n\nOs R$ 29,90/mês saem da sua próxima fatura e a emissão para de funcionar.',
      )
    )
      return
    setBusy(true)
    setMsg(null)
    api
      .post('/billing/nfse-addon', { enabled: false })
      .then(() => onChanged())
      .catch((err: unknown) => setMsg(apiErrorMessage(err)))
      .finally(() => setBusy(false))
  }

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>💳 Add-on</div>
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            color: '#4ade80',
            background: 'rgba(0,184,12,0.12)',
            border: '1px solid rgba(0,184,12,0.3)',
            padding: '3px 9px',
            borderRadius: 99,
          }}
        >
          ATIVO
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'rgba(255,255,255,0.55)' }}>
        <span>Na sua assinatura</span>
        <b style={{ color: '#f4f4f5', fontSize: 14 }}>R$ 29,90/mês</b>
      </div>
      {msg && <div style={{ fontSize: 12.5, color: '#fca5a5', marginTop: 10 }}>{msg}</div>}
      <button
        onClick={deactivate}
        disabled={busy}
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.4)',
          fontSize: 11.5,
          textDecoration: 'underline',
          cursor: 'pointer',
          padding: 0,
          marginTop: 10,
        }}
      >
        {busy ? 'Desativando…' : 'Desativar módulo (vale a partir do próximo ciclo)'}
      </button>
    </div>
  )
}
