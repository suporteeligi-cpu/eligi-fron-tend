// src/features/fiscal/components/FiscalCentral.tsx
'use client'

import { useRef, useState } from 'react'
import type { CSSProperties, ChangeEvent } from 'react'
import { ShieldCheck, ShieldAlert, FileKey2, Trash2, Landmark, CreditCard } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { colors, glassCard, inkLight, radius, shadows } from '@/shared/theme'
import type { InkTone } from '@/shared/theme'
import type { FiscalOverview, FiscalProfile, FiscalRegime, FiscalStatus } from '../types'
import { apiErrorMessage, formatCnpj } from '../utils'
import EmissionsList from './EmissionsList'

const cardStyle: CSSProperties = { ...glassCard, padding: 20 }

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: 10.5,
  fontWeight: 600,
  letterSpacing: 0.5,
  textTransform: 'uppercase',
  color: inkLight.faint,
  marginBottom: 6,
}

const inputStyle: CSSProperties = {
  width: '100%',
  background: 'rgba(0,0,0,0.02)',
  border: `1px solid ${colors.gray.border}`,
  borderRadius: radius.md,
  padding: '11px 13px',
  color: inkLight.strong,
  fontSize: 13.5,
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
}

const primaryBtn: CSSProperties = {
  background: colors.red.gradient,
  border: 'none',
  color: '#fff',
  fontSize: 13.5,
  fontWeight: 700,
  fontFamily: 'inherit',
  padding: '12px 24px',
  borderRadius: radius.md,
  cursor: 'pointer',
  boxShadow: shadows.redSm,
}

const sectionTitle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 14,
  fontWeight: 600,
  color: inkLight.strong,
}

const STATUS_CFG: Record<FiscalStatus, { label: string; tone: InkTone }> = {
  INCOMPLETE: { label: 'Configuração incompleta', tone: inkLight.warn },
  READY_TO_TEST: { label: 'Pronto pra nota de teste', tone: inkLight.info },
  ACTIVE: { label: 'Emissão ativa', tone: inkLight.ok },
  BLOCKED: { label: 'Certificado vencido', tone: inkLight.bad },
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
      <div
        style={{
          ...cardStyle,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap',
          marginBottom: 14,
        }}
      >
        <div style={{ fontSize: 13.5, color: inkLight.label, lineHeight: 1.5, maxWidth: 560 }}>
          Módulo <b style={{ color: inkLight.ok.text }}>ativo</b> na sua assinatura (R$ 29,90/mês). As notas
          emitidas pelo caixa aparecem aqui.
        </div>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: st.tone.text,
            background: st.tone.bg,
            border: `1px solid ${st.tone.border}`,
            padding: '7px 14px',
            borderRadius: radius.full,
            whiteSpace: 'nowrap',
          }}
        >
          {st.label}
        </span>
      </div>

      {/* @eligi:nfse-cert-banner — A1 vale 12 meses; vencer sem aviso para a emissão no meio do expediente */}
      {profile?.certificate?.expiresSoon && status !== 'BLOCKED' && (
        <div
          style={{
            ...cardStyle,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 14,
            background: inkLight.warn.bg,
            border: `1px solid ${inkLight.warn.border}`,
          }}
        >
          <ShieldAlert size={22} color={inkLight.warn.text} style={{ flexShrink: 0 }} />
          <div style={{ fontSize: 13, color: inkLight.warn.text, lineHeight: 1.5 }}>
            <b>
              {typeof profile.certificate.daysLeft === 'number' && profile.certificate.daysLeft > 0
                ? `Seu certificado vence em ${profile.certificate.daysLeft} dia${profile.certificate.daysLeft === 1 ? '' : 's'}.`
                : 'Seu certificado está perto de vencer.'}
            </b>{' '}
            Renove com seu contador ou na certificadora e envie o arquivo novo abaixo — sem
            certificado válido a emissão de notas para.
          </div>
        </div>
      )}

      {(status === 'ACTIVE' || status === 'READY_TO_TEST') && <EmissionsList monthRef={new Date()} />}

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
    <div style={cardStyle}>
      <div style={{ ...sectionTitle, marginBottom: 14 }}>
        <Landmark size={16} color={colors.red.DEFAULT} /> Dados fiscais
      </div>

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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Código de tributação</label>
          <input style={inputStyle} value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="06.01" />
          <div style={{ fontSize: 11, color: inkLight.faint, marginTop: 5, lineHeight: 1.4 }}>
            06.01 = barbearia, cabeleireiro, manicure · 06.02 = estética
          </div>
        </div>
        <div>
          <label style={labelStyle}>Código IBGE do município</label>
          <input style={inputStyle} value={ibge} onChange={(e) => setIbge(e.target.value)} placeholder="7 dígitos" inputMode="numeric" />
          <div style={{ fontSize: 11, color: inkLight.faint, marginTop: 5, lineHeight: 1.4 }}>
            Busque &quot;código IBGE + sua cidade&quot;
          </div>
        </div>
      </div>

      {msg && (
        <div style={{ fontSize: 12.5, color: msg.ok ? inkLight.ok.text : inkLight.bad.text, marginTop: 12 }}>
          {msg.text}
        </div>
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
  // vencimento vem do status derivado no back (fonte única; sem Date.now no render)
  const expired = profile?.status === 'BLOCKED'
  const hasProfile = Boolean(profile)

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      setPfxBase64(result.split(',')[1] ?? '')
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

  const tone: InkTone = expired ? inkLight.bad : inkLight.ok

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={sectionTitle}>
          <FileKey2 size={16} color={colors.red.DEFAULT} /> Certificado A1
        </span>
        {cert && (
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: tone.text,
              background: tone.bg,
              border: `1px solid ${tone.border}`,
              padding: '3px 9px',
              borderRadius: radius.full,
            }}
          >
            {expired ? 'VENCIDO' : 'VÁLIDO'}
          </span>
        )}
      </div>

      {cert ? (
        <div>
          <div style={{ display: 'flex', gap: 11, alignItems: 'center', fontSize: 12.5, color: inkLight.label }}>
            {expired ? (
              <ShieldAlert size={28} color={inkLight.bad.text} />
            ) : (
              <ShieldCheck size={28} color={inkLight.ok.text} />
            )}
            <div>
              <div style={{ color: inkLight.strong, fontWeight: 600 }}>{cert.subject ?? 'Certificado'}</div>
              {cert.expiresAt && (
                <div>expira {new Date(cert.expiresAt).toLocaleDateString('pt-BR')} · avisamos antes de vencer</div>
              )}
            </div>
          </div>
          <button
            onClick={remove}
            disabled={busy}
            style={{
              background: 'transparent',
              border: `1px solid ${inkLight.bad.border}`,
              color: inkLight.bad.text,
              fontSize: 12,
              fontFamily: 'inherit',
              padding: '7px 13px',
              borderRadius: radius.sm,
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
          <p style={{ fontSize: 12.5, color: inkLight.label, lineHeight: 1.5, margin: '0 0 12px' }}>
            É a assinatura eletrônica do seu CNPJ — obrigatória pra emitir nota. Arquivo .pfx ou .p12, guardado
            criptografado.
          </p>
          {!hasProfile && (
            <div style={{ fontSize: 12, color: inkLight.warn.text, marginBottom: 12 }}>
              Salve os dados fiscais primeiro.
            </div>
          )}
          <input ref={fileRef} type="file" accept=".pfx,.p12" onChange={onFile} style={{ display: 'none' }} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={!hasProfile || busy}
            style={{
              width: '100%',
              background: 'rgba(0,0,0,0.02)',
              border: '2px dashed rgba(0,0,0,0.14)',
              borderRadius: radius.lg,
              padding: '18px 14px',
              color: inkLight.label,
              fontSize: 13,
              fontFamily: 'inherit',
              cursor: !hasProfile || busy ? 'not-allowed' : 'pointer',
              opacity: hasProfile ? 1 : 0.55,
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
                style={{
                  ...primaryBtn,
                  width: '100%',
                  marginTop: 12,
                  opacity: busy || password.length === 0 ? 0.6 : 1,
                }}
              >
                {busy ? 'Validando…' : 'Enviar certificado'}
              </button>
            </div>
          )}
        </div>
      )}

      {msg && <div style={{ fontSize: 12.5, color: inkLight.bad.text, marginTop: 10 }}>{msg}</div>}
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
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={sectionTitle}>
          <CreditCard size={16} color={colors.red.DEFAULT} /> Add-on
        </span>
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            color: inkLight.ok.text,
            background: inkLight.ok.bg,
            border: `1px solid ${inkLight.ok.border}`,
            padding: '3px 9px',
            borderRadius: radius.full,
          }}
        >
          ATIVO
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: inkLight.label }}>
        <span>Na sua assinatura</span>
        <b style={{ color: inkLight.strong, fontSize: 14 }}>R$ 29,90/mês</b>
      </div>

      {msg && <div style={{ fontSize: 12.5, color: inkLight.bad.text, marginTop: 10 }}>{msg}</div>}

      <button
        onClick={deactivate}
        disabled={busy}
        style={{
          background: 'none',
          border: 'none',
          color: inkLight.faint,
          fontSize: 11.5,
          fontFamily: 'inherit',
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
