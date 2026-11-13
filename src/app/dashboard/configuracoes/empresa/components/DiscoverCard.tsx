'use client'
// src/app/dashboard/configuracoes/empresa/components/DiscoverCard.tsx
//
// @eligi:discover-card — "Aparecer para clientes perto de voce" (direcao B,
// escolhida pelo Eli em 13/11/2026): interruptor, previa do cartao como o
// cliente ve no app e o que falta para aparecer. O que falta vem do back
// (mesma regra da busca); a tela nunca recalcula.

import { useState } from 'react'
import Link from 'next/link'
import { Check, Loader2 } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { inkLight, transitions } from '@/shared/theme'

export type DiscoverPendencia = 'ENDERECO' | 'SERVICO' | 'PROFISSIONAL' | 'ASSINATURA'

type Funcionamento =
  | { aberto: true; fechaAs: string }
  | { aberto: false; abre: { dia: 'hoje' | 'amanha' | number; as: string } | null }

export interface DiscoverStatus {
  ligado: boolean
  visivel: boolean
  pendencias: DiscoverPendencia[]
  previa: {
    nome: string
    tipo: string
    cidade: string | null
    logoUrl: string | null
    corPrimaria: string | null
    funcionamento: Funcionamento
    aPartirDe: number | null
    avaliacao: { total: number; media: number | null }
  }
}

interface Props {
  initial: DiscoverStatus
  /** Abre o editor do perfil publico (onde se marca o endereco no mapa). */
  onEditAddress: () => void
}

const INK = '#111114'
const INK2 = '#4b4b52'
const INK3 = '#8a8a93'

const TIPOS: Record<string, string> = {
  BARBEARIA: 'Barbearia',
  SALAO_BELEZA: 'Salão de beleza',
  CLINICA_ESTETICA: 'Clínica de estética',
  SOBRANCELHAS_CILIOS: 'Sobrancelhas e cílios',
  ESMALTERIA: 'Esmalteria',
  CLINICA_DEPILACAO: 'Clínica de depilação',
  SPA_CAPILAR: 'Spa capilar',
  STUDIO: 'Studio',
}

const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

function hora(hhmm: string): string {
  const [h, m] = hhmm.split(':')
  const hh = String(Number(h ?? 0))
  return m && m !== '00' ? `${hh}h${m}` : `${hh}h`
}

function funcionamentoLabel(f: Funcionamento): { text: string; open: boolean } {
  if (f.aberto) return { text: `Aberto até ${hora(f.fechaAs)}`, open: true }
  if (!f.abre) return { text: 'Sem horário cadastrado', open: false }
  const dia = f.abre.dia === 'hoje' ? 'hoje' : f.abre.dia === 'amanha' ? 'amanhã' : DIAS[f.abre.dia] ?? ''
  return { text: `Abre ${dia} às ${hora(f.abre.as)}`, open: false }
}

function brl(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: n % 1 ? 2 : 0 })
}

function iniciais(nome: string): string {
  const p = nome.trim().split(/\s+/).filter(Boolean)
  return ((p[0]?.[0] ?? '') + (p.length > 1 ? p[p.length - 1]?.[0] ?? '' : '')).toUpperCase() || 'E'
}

const ITENS: Array<{ key: DiscoverPendencia; ok: string; falta: string; acao: string; href?: string }> = [
  { key: 'ENDERECO', ok: 'Endereço marcado no mapa', falta: 'Marque o endereço no mapa', acao: 'Marcar' },
  { key: 'SERVICO', ok: 'Serviço no link de agendamento', falta: 'Nenhum serviço no link de agendamento', acao: 'Abrir', href: '/dashboard/servicos' },
  { key: 'PROFISSIONAL', ok: 'Profissional no link de agendamento', falta: 'Nenhum profissional no link de agendamento', acao: 'Abrir', href: '/dashboard/equipe' },
  { key: 'ASSINATURA', ok: 'Assinatura em dia', falta: 'Assinatura com pagamento pendente', acao: 'Ver', href: '/dashboard/configuracoes/assinatura' },
]

export default function DiscoverCard({ initial, onEditAddress }: Props) {
  const [status, setStatus] = useState<DiscoverStatus>(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const ligado = status.ligado
  const p = status.previa
  const func = funcionamentoLabel(p.funcionamento)
  const falta = new Set(status.pendencias)

  async function alternar() {
    if (saving) return
    setSaving(true)
    setError(null)
    try {
      const res = await api.patch('/business-settings/discover', { discoverable: !ligado })
      const next = (res.data?.data?.discover ?? null) as DiscoverStatus | null
      setStatus(next ?? { ...status, ligado: !ligado, visivel: !ligado && status.pendencias.length === 0 })
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { error?: string; message?: string } } }
      const s = e.response?.status
      setError(
        s === undefined
          ? 'Sem conexão. Confira a internet e tente de novo.'
          : s >= 500
            ? 'Serviço temporariamente indisponível. Tente novamente em instantes.'
            : e.response?.data?.error ?? e.response?.data?.message ?? 'Não foi possível salvar. Tente de novo.',
      )
    } finally {
      setSaving(false)
    }
  }

  const situacao = !ligado
    ? { text: 'Desligado · seu link continua funcionando para quem já tem', tone: inkLight.neutral, dot: INK3 }
    : status.visivel
      ? { text: 'Aparecendo agora para quem está perto', tone: inkLight.ok, dot: '#16a34a' }
      : { text: 'Ligado, mas ainda não aparece: falta o que está marcado abaixo', tone: inkLight.warn, dot: '#b45309' }

  return (
    <section
      aria-labelledby="discover-title"
      style={{
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(20px)',
        borderRadius: 14,
        border: '1px solid rgba(17,17,20,0.07)',
        boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        fontFamily: 'var(--font-eligi-sans), system-ui, sans-serif',
        color: INK,
      }}
    >
      <style>{`
        .dsc-sw:focus-visible,.dsc-act:focus-visible{outline:2px solid #dc2626;outline-offset:3px}
        .dsc-eye{font-family:var(--font-eligi-mono),ui-monospace,monospace;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:${INK3}}
        @keyframes dsc-spin{to{transform:rotate(360deg)}}
        .dsc-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <label htmlFor="dsc-switch" style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
          <span id="discover-title" style={{ display: 'block', fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em', color: INK }}>
            Aparecer para clientes perto de você
          </span>
          <span style={{ display: 'block', fontSize: 12.5, color: 'rgba(17,17,20,0.5)', marginTop: 2 }}>
            Na tela inicial do app Eligi Cliente, por distância.
          </span>
        </label>
        {saving && <Loader2 size={16} aria-hidden style={{ color: INK3, animation: 'dsc-spin 0.8s linear infinite' }} />}
        <button
          id="dsc-switch"
          type="button"
          role="switch"
          aria-checked={ligado}
          aria-busy={saving}
          className="dsc-sw"
          disabled={saving}
          onClick={alternar}
          style={{
            position: 'relative', width: 52, height: 32, borderRadius: 999, border: 'none', padding: 0, flex: 'none',
            background: ligado ? INK : 'rgba(17,17,20,0.18)',
            cursor: saving ? 'wait' : 'pointer',
            transition: `background ${transitions.fast}`,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <span style={{
            position: 'absolute', top: 3, left: 3, width: 26, height: 26, borderRadius: '50%', background: '#fff',
            boxShadow: '0 1px 3px rgba(17,17,20,0.25)',
            transform: ligado ? 'translateX(20px)' : 'none', transition: `transform ${transitions.fast}`,
          }} />
        </button>
      </div>

      <div role="status" style={{
        display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 600,
        color: situacao.tone.text, background: situacao.tone.bg, borderRadius: 10, padding: '9px 12px',
      }}>
        <span aria-hidden style={{ width: 7, height: 7, borderRadius: '50%', background: situacao.dot, flex: 'none' }} />
        {situacao.text}
      </div>

      {error && (
        <div role="alert" style={{
          fontSize: 12.5, color: inkLight.bad.text, background: inkLight.bad.bg,
          border: `1px solid ${inkLight.bad.border}`, borderRadius: 10, padding: '9px 12px',
        }}>
          {error}
        </div>
      )}

      <div className="dsc-eye">Como aparece no app</div>
      <div style={{
        border: '1px solid rgba(17,17,20,0.08)', borderRadius: 14, padding: 12, display: 'flex', gap: 12,
        alignItems: 'center', background: '#fff', opacity: status.visivel ? 1 : 0.5, transition: 'opacity .2s',
      }}>
        {p.logoUrl ? (
          <span aria-hidden style={{
            width: 48, height: 48, borderRadius: 12, flex: 'none', background: `#fff center/cover no-repeat url("${p.logoUrl}")`,
            border: '1px solid rgba(17,17,20,0.08)',
          }} />
        ) : (
          <span aria-hidden style={{
            width: 48, height: 48, borderRadius: 12, flex: 'none', display: 'grid', placeItems: 'center',
            background: p.corPrimaria ?? INK, color: '#fff',
            fontFamily: 'var(--font-eligi-display), system-ui, sans-serif', fontWeight: 700, fontSize: 16,
          }}>
            {iniciais(p.nome)}
          </span>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {p.nome}
          </div>
          <div style={{ fontSize: 12.5, color: INK2, marginTop: 2 }}>
            {[TIPOS[p.tipo] ?? null, p.cidade].filter(Boolean).join(' · ') || ' '}
          </div>
          <div style={{ fontSize: 12, marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: '2px 8px', alignItems: 'center' }}>
            <span style={{ color: func.open ? inkLight.ok.text : INK2, fontWeight: 600 }}>{func.text}</span>
            {p.aPartirDe !== null && (
              <span style={{ color: INK2 }}>
                a partir de <b style={{ fontVariantNumeric: 'tabular-nums', color: INK }}>{brl(p.aPartirDe)}</b>
              </span>
            )}
          </div>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700, borderRadius: 999, padding: '3px 8px', alignSelf: 'flex-start', whiteSpace: 'nowrap',
          color: p.avaliacao.media !== null ? '#b45309' : INK2,
          background: p.avaliacao.media !== null ? '#fffbeb' : '#f0f0f3',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {p.avaliacao.media !== null ? `★ ${p.avaliacao.media.toFixed(1).replace('.', ',')}` : 'Novo'}
        </span>
      </div>

      <div className="dsc-eye">Para aparecer</div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13.5 }}>
        {ITENS.map((it) => {
          const ok = !falta.has(it.key)
          if (ok) {
            return (
              <li key={it.key} style={{ display: 'flex', gap: 10, alignItems: 'center', minHeight: 28, color: INK }}>
                <span aria-hidden style={{
                  width: 20, height: 20, borderRadius: '50%', flex: 'none', display: 'grid', placeItems: 'center',
                  background: inkLight.ok.bg, color: inkLight.ok.text,
                }}>
                  <Check size={12} strokeWidth={3} />
                </span>
                <span style={{ color: INK }}><span className="dsc-sr">Feito: </span>{it.ok}</span>
              </li>
            )
          }
          const acaoStyle: React.CSSProperties = {
            minHeight: 44, display: 'flex', alignItems: 'center', padding: '0 4px', fontSize: 13, fontWeight: 700,
            color: '#92400e', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline',
            textUnderlineOffset: 3, fontFamily: 'inherit', flex: 'none',
          }
          return (
            <li key={it.key} style={{
              display: 'flex', gap: 10, alignItems: 'center', background: '#fffbeb', borderRadius: 10, padding: '0 6px 0 10px',
            }}>
              <span aria-hidden style={{
                width: 20, height: 20, borderRadius: '50%', flex: 'none', display: 'grid', placeItems: 'center',
                background: '#b45309', color: '#fff', fontSize: 12, fontWeight: 800,
              }}>!</span>
              <span style={{ flex: 1, minWidth: 0, color: '#92400e' }}><span className="dsc-sr">Falta: </span>{it.falta}</span>
              {it.href ? (
                <Link href={it.href} className="dsc-act" style={acaoStyle}>{it.acao}</Link>
              ) : (
                <button type="button" className="dsc-act" onClick={onEditAddress} style={acaoStyle}>{it.acao}</button>
              )}
            </li>
          )
        })}
      </ul>

      <p style={{ margin: 0, fontSize: 12, color: INK2, lineHeight: 1.5 }}>
        Enquanto faltar algum item, seu lugar não aparece, mesmo ligado. O seu link continua funcionando normalmente.
      </p>
    </section>
  )
}
