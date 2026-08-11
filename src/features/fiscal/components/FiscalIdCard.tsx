// src/features/fiscal/components/FiscalIdCard.tsx
'use client'

import type { CSSProperties } from 'react'
import { Building2, Scale, MapPin, ShieldCheck, ShieldAlert } from 'lucide-react'
import { card, ink, tone, label, numeric } from '../ui'
import type { FiscalSummary, FiscalProfile } from '../types'

/** Descrições dos códigos de tributação mais comuns no segmento beleza. */
const CTRIB: Record<string, string> = {
  '060101': 'Barbearia, cabeleireiros e congêneres',
  '060102': 'Esteticistas, tratamento de pele e depilação',
  '060201': 'Esteticistas e congêneres',
  '060301': 'Banhos, duchas, massagens e congêneres',
  '060401': 'Ginástica, dança e atividades físicas',
}

const REGIME: Record<string, string> = {
  SIMPLES_NACIONAL: 'Simples Nacional · ME/EPP',
  MEI: 'Simples Nacional · MEI',
}

function fmtCnpj(v: string): string {
  const d = v.replace(/\D/g, '')
  if (d.length !== 14) return v
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}

function fmtCod(v: string): string {
  const d = v.replace(/\D/g, '')
  return d.length === 6 ? `${d.slice(0, 2)}.${d.slice(2, 4)}.${d.slice(4)}` : v
}

const colStyle: CSSProperties = { flex: 1, padding: '26px 24px', borderRight: `0.5px solid ${ink.hair}`, minWidth: 168 }
const tag: CSSProperties = {
  fontSize: 11.5,
  fontWeight: 500,
  padding: '5px 11px',
  borderRadius: 7,
  border: `0.5px solid ${ink.hair2}`,
  color: ink.mid,
  letterSpacing: '-0.01em',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
}
const valStyle: CSSProperties = {
  fontSize: 19,
  fontWeight: 600,
  letterSpacing: '-0.025em',
  marginTop: 9,
  lineHeight: 1.15,
  color: ink.strong,
  fontVariantNumeric: 'tabular-nums',
}
const subStyle: CSSProperties = { fontSize: 11.5, color: ink.faint, marginTop: 6, lineHeight: 1.4 }

interface Props {
  business: FiscalSummary['business']
  profile: FiscalProfile | null
}

export default function FiscalIdCard({ business, profile }: Props) {
  const cert = profile?.certificate ?? null
  const blocked = profile?.status === 'BLOCKED'
  const days = cert?.daysLeft ?? null
  const soon = cert?.expiresSoon ?? false

  return (
    <div style={{ ...card, display: 'flex', flexWrap: 'wrap', overflow: 'hidden', marginBottom: 14 }}>
      <div style={{ flex: '1.4 1 300px', padding: '26px 30px', borderRight: `0.5px solid ${ink.hair}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <Building2 size={16} color={tone.red} strokeWidth={1.75} />
          <span style={{ fontSize: 21, fontWeight: 600, letterSpacing: '-0.03em', color: ink.strong }}>
            {business.displayName}
          </span>
        </div>
        <div style={{ fontSize: 12.5, color: ink.faint, marginTop: 4, ...numeric, letterSpacing: '0.005em' }}>
          CNPJ {fmtCnpj(business.cnpj)}
          {business.inscricaoMunicipal ? ` · IM ${business.inscricaoMunicipal}` : ''}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 16, flexWrap: 'wrap' }}>
          <span style={tag}>
            <Scale size={12} color={tone.blue} strokeWidth={1.75} />
            {REGIME[business.regime] ?? business.regime}
          </span>
          {business.municipio && (
            <span style={tag}>
              <MapPin size={12} color={tone.violet} strokeWidth={1.75} />
              {business.municipio}
              {business.uf ? `/${business.uf}` : ''}
            </span>
          )}
        </div>
      </div>

      <div style={colStyle}>
        <div style={label}>Serviço principal</div>
        <div style={valStyle}>{fmtCod(business.codigoTributacaoNacional)}</div>
        <div style={subStyle}>{CTRIB[business.codigoTributacaoNacional.replace(/\D/g, '')] ?? 'Código de tributação nacional'}</div>
      </div>

      <div style={colStyle}>
        <div style={label}>Alíquota ISS</div>
        <div style={valStyle}>{business.aliquotaIss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}%</div>
        <div style={subStyle}>definida pelo município</div>
      </div>

      <div style={{ ...colStyle, borderRight: 'none' }}>
        <div style={label}>Certificado A1</div>
        <div style={{ ...valStyle, color: blocked ? tone.red : soon ? tone.amber : tone.green, display: 'flex', alignItems: 'center', gap: 7 }}>
          {blocked || soon ? (
            <ShieldAlert size={16} strokeWidth={1.75} />
          ) : (
            <ShieldCheck size={16} strokeWidth={1.75} />
          )}
          {blocked ? 'Vencido' : days != null ? `${days} dias` : '—'}
        </div>
        <div style={subStyle}>
          {cert?.expiresAt ? `vence ${new Date(cert.expiresAt).toLocaleDateString('pt-BR')}` : 'não configurado'}
        </div>
      </div>
    </div>
  )
}
