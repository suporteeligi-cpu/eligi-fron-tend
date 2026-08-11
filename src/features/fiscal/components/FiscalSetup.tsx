// src/features/fiscal/components/FiscalSetup.tsx
'use client'

import { useRef, useState } from 'react'
import type { CSSProperties, ChangeEvent } from 'react'
import { Landmark, FileKey2, CreditCard, ShieldCheck, ShieldAlert, Trash2, Info } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { ink, tone, label, body, btn } from '../ui'
import type { FiscalOverview, FiscalProfile, FiscalRegime } from '../types'
import { apiErrorMessage, formatCnpj } from '../utils'

const block: CSSProperties = { marginBottom: 26 }
const title: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 9,
  fontSize: 14,
  fontWeight: 600,
  letterSpacing: '-0.015em',
  color: ink.strong,
  marginBottom: 16,
}
const field: CSSProperties = { minWidth: 0 }
const input: CSSProperties = {
  width: '100%',
  background: '#fff',
  border: `0.5px solid ${ink.hair2}`,
  borderRadius: 10,
  padding: '11px 13px',
  color: ink.strong,
  fontSize: 13.5,
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
  letterSpacing: '-0.01em',
}
const hint: CSSProperties = { fontSize: 11.5, color: ink.faint, marginTop: 6, lineHeight: 1.45 }
const primary: CSSProperties = {
  background: ink.strong,
  border: 'none',
  color: '#fff',
  fontSize: 13,
  fontWeight: 500,
  padding: '11px 22px',
  borderRadius: 11,
  cursor: 'pointer',
  fontFamily: 'inherit',
  letterSpacing: '-0.01em',
}
const grid2: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 14 }

interface Props {
  overview: FiscalOverview
  onChanged: () => void
}

export default function FiscalSetup({ overview, onChanged }: Props) {
  return (
    <div>
      <FiscalData profile={overview.profile} prefillCnpj={overview.prefill.cnpj} onSaved={onChanged} />
      <Certificate profile={overview.profile} onChanged={onChanged} />
      <Addon onChanged={onChanged} />
    </div>
  )
}

/* ── dados fiscais ─────────────────────────────────────────────── */
function FiscalData({
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
  const [codigo, setCodigo] = useState(() => profile?.codigoTributacaoNacional ?? '060101')
  const [iss, setIss] = useState(() => (profile ? String(profile.aliquotaIss).replace('.', ',') : '5,00'))
  const [sn, setSn] = useState(() =>
    profile?.aliquotaSimplesNacional != null
      ? String(profile.aliquotaSimplesNacional).replace('.', ',')
      : '6,00',
  )
  const [ibge, setIbge] = useState(() => profile?.codigoMunicipioIbge ?? '')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const save = () => {
    if (busy) return
    const issNum = Number(iss.replace(',', '.'))
    const snNum = Number(sn.replace(',', '.'))
    if (Number.isNaN(issNum) || Number.isNaN(snNum)) {
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
        aliquotaIss: issNum,
        aliquotaSimplesNacional: snNum,
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
    <div style={block}>
      <div style={title}>
        <Landmark size={15} color={tone.red} strokeWidth={1.75} />
        Dados fiscais
      </div>

      <div style={{ ...grid2, marginBottom: 14 }}>
        <div style={field}>
          <div style={label}>CNPJ</div>
          <input
            style={{ ...input, marginTop: 7 }}
            value={cnpj}
            onChange={(e) => setCnpj(formatCnpj(e.target.value))}
            placeholder="00.000.000/0000-00"
            inputMode="numeric"
          />
        </div>
        <div style={field}>
          <div style={label}>Inscrição Municipal</div>
          <input style={{ ...input, marginTop: 7 }} value={im} onChange={(e) => setIm(e.target.value)} />
          <div style={hint}>Conforme registrada no cadastro do seu município.</div>
        </div>
        <div style={field}>
          <div style={label}>Regime</div>
          <select
            style={{ ...input, marginTop: 7 }}
            value={regime}
            onChange={(e) => setRegime(e.target.value as FiscalRegime)}
          >
            <option value="SIMPLES_NACIONAL">Simples Nacional (ME/EPP)</option>
            <option value="MEI">MEI</option>
          </select>
        </div>
      </div>

      <div style={{ ...grid2, marginBottom: 14 }}>
        <div style={field}>
          <div style={label}>Alíquota ISS (%)</div>
          <input style={{ ...input, marginTop: 7 }} value={iss} onChange={(e) => setIss(e.target.value)} inputMode="decimal" />
          <div style={hint}>Imposto municipal sobre o serviço.</div>
        </div>
        <div style={field}>
          <div style={label}>Alíquota do Simples (%)</div>
          <input style={{ ...input, marginTop: 7 }} value={sn} onChange={(e) => setSn(e.target.value)} inputMode="decimal" />
          <div style={hint}>
            Percentual dos tributos aproximados informado ao cliente (Lei 12.741). É outro número — confirme com seu contador.
          </div>
        </div>
        <div style={field}>
          <div style={label}>Código de tributação</div>
          <input style={{ ...input, marginTop: 7 }} value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="060101" />
          <div style={hint}>06.01.01 = barbearia e cabeleireiros.</div>
        </div>
        <div style={field}>
          <div style={label}>Código IBGE do município</div>
          <input style={{ ...input, marginTop: 7 }} value={ibge} onChange={(e) => setIbge(e.target.value)} placeholder="7 dígitos" inputMode="numeric" />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 16 }}>
        <Info size={12} color={ink.faint} strokeWidth={1.9} style={{ marginTop: 3, flexShrink: 0 }} />
        <span style={{ fontSize: 11.5, color: ink.faint, lineHeight: 1.45 }}>
          A alíquota do Simples muda quando o faturamento acumulado troca de faixa. Se isso acontecer, atualize aqui —
          as notas seguintes passam a informar o novo percentual.
        </span>
      </div>

      {msg && (
        <div style={{ fontSize: 12.5, color: msg.ok ? tone.green : tone.red, marginBottom: 12 }}>{msg.text}</div>
      )}

      <button onClick={save} disabled={busy} style={{ ...primary, opacity: busy ? 0.6 : 1 }}>
        {busy ? 'Salvando…' : 'Salvar dados fiscais'}
      </button>
    </div>
  )
}

/* ── certificado ───────────────────────────────────────────────── */
function Certificate({ profile, onChanged }: { profile: FiscalProfile | null; onChanged: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [pfxBase64, setPfxBase64] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const cert = profile?.certificate ?? null
  // vencimento vem do status derivado no back — sem Date.now() no render
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

  return (
    <div style={{ ...block, paddingTop: 22, borderTop: `0.5px solid ${ink.hair}` }}>
      <div style={title}>
        <FileKey2 size={15} color={tone.red} strokeWidth={1.75} />
        Certificado digital A1
      </div>

      {cert ? (
        <div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {expired ? (
              <ShieldAlert size={26} color={tone.red} strokeWidth={1.6} />
            ) : (
              <ShieldCheck size={26} color={tone.green} strokeWidth={1.6} />
            )}
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: ink.strong, letterSpacing: '-0.015em' }}>
                {cert.subject ?? 'Certificado'}
              </div>
              <div style={{ ...body, fontSize: 12.5 }}>
                {cert.expiresAt
                  ? `${expired ? 'venceu' : 'vence'} em ${new Date(cert.expiresAt).toLocaleDateString('pt-BR')}`
                  : '—'}
                {cert.daysLeft != null && !expired ? ` · ${cert.daysLeft} dias restantes` : ''}
              </div>
            </div>
          </div>
          <button
            onClick={remove}
            disabled={busy}
            style={{
              ...btn,
              marginTop: 14,
              color: tone.red,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
            }}
          >
            <Trash2 size={13} strokeWidth={1.8} /> Substituir certificado
          </button>
        </div>
      ) : (
        <div>
          <p style={{ ...body, fontSize: 12.5, marginBottom: 14 }}>
            É a assinatura eletrônica do seu CNPJ, obrigatória para emitir nota. Arquivo .pfx ou .p12, guardado
            criptografado.
          </p>
          {!hasProfile && (
            <div style={{ fontSize: 12, color: tone.amber, marginBottom: 12 }}>Salve os dados fiscais primeiro.</div>
          )}
          <input ref={fileRef} type="file" accept=".pfx,.p12" onChange={onFile} style={{ display: 'none' }} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={!hasProfile || busy}
            style={{
              width: '100%',
              background: 'rgba(0,0,0,0.015)',
              border: `1px dashed ${ink.hair2}`,
              borderRadius: 12,
              padding: '20px 14px',
              color: ink.mid,
              fontSize: 13,
              fontFamily: 'inherit',
              cursor: !hasProfile || busy ? 'not-allowed' : 'pointer',
              opacity: hasProfile ? 1 : 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 9,
              letterSpacing: '-0.01em',
            }}
          >
            <FileKey2 size={16} strokeWidth={1.75} />
            {fileName ?? 'Escolher arquivo .pfx'}
          </button>

          {pfxBase64 && (
            <div style={{ marginTop: 14, maxWidth: 320 }}>
              <div style={label}>Senha do certificado</div>
              <input
                style={{ ...input, marginTop: 7 }}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button
                onClick={upload}
                disabled={busy || password.length === 0}
                style={{ ...primary, marginTop: 12, opacity: busy || !password ? 0.6 : 1 }}
              >
                {busy ? 'Validando…' : 'Enviar certificado'}
              </button>
            </div>
          )}
        </div>
      )}

      {msg && <div style={{ fontSize: 12.5, color: tone.red, marginTop: 12 }}>{msg}</div>}
    </div>
  )
}

/* ── add-on ────────────────────────────────────────────────────── */
function Addon({ onChanged }: { onChanged: () => void }) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const deactivate = () => {
    if (busy) return
    if (
      !window.confirm(
        'Desativar o módulo de Notas Fiscais?\n\nOs R$ 29,90/mês saem da próxima fatura e a emissão para de funcionar.',
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
    <div style={{ paddingTop: 22, borderTop: `0.5px solid ${ink.hair}` }}>
      <div style={title}>
        <CreditCard size={15} color={tone.red} strokeWidth={1.75} />
        Assinatura do módulo
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <span style={{ ...body, fontSize: 12.5 }}>Cobrado junto com sua mensalidade do Eligi</span>
        <span style={{ fontSize: 15, fontWeight: 600, color: ink.strong, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
          R$ 29,90/mês
        </span>
      </div>
      {msg && <div style={{ fontSize: 12.5, color: tone.red, marginTop: 10 }}>{msg}</div>}
      <button
        onClick={deactivate}
        disabled={busy}
        style={{
          background: 'none',
          border: 'none',
          color: ink.faint,
          fontSize: 11.5,
          fontFamily: 'inherit',
          textDecoration: 'underline',
          cursor: 'pointer',
          padding: 0,
          marginTop: 12,
        }}
      >
        {busy ? 'Desativando…' : 'Desativar módulo (vale a partir do próximo ciclo)'}
      </button>
    </div>
  )
}
