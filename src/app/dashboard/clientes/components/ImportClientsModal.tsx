'use client'
// src/app/dashboard/clientes/components/ImportClientsModal.tsx
//
// Importação de clientes em 3 etapas:
//   1) ORIGEM   — colar texto OU enviar arquivo (CSV/vCard)
//   2) PREVIEW  — mostra novos / duplicados / inválidos; escolhe estratégia de duplicados
//   3) RESULTADO— quantos criados/atualizados/pulados

import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  X, Upload, ClipboardList, Loader2, CheckCircle2, AlertTriangle,
  UserPlus, Users, FileWarning, ArrowLeft,
} from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { colors, typography, radius, shadows } from '@/shared/theme'
import {
  RawContact, parsePastedText, parseFile,
} from '@/features/clients/utils/contactParser'

interface PreviewContact {
  name: string; phone: string; phoneRaw: string
  email: string | null; cpf: string | null; cpfValid: boolean
  reason?: string; existingId?: string; existingName?: string
}
interface PreviewResult {
  news: PreviewContact[]; duplicates: PreviewContact[]; invalid: PreviewContact[]
  totals: { received: number; news: number; duplicates: number; invalid: number }
}

type Step = 'source' | 'preview' | 'result'
type DupStrategy = 'skip' | 'update'

interface Props {
  isMobile: boolean
  onClose:  () => void
  onDone:   () => void   // chamado após importar com sucesso (pra refetch)
}

export default function ImportClientsModal({ isMobile, onClose, onDone }: Props) {
  const [step, setStep]       = useState<Step>('source')
  const [pasted, setPasted]   = useState('')
  const [preview, setPreview] = useState<PreviewResult | null>(null)
  const [strategy, setStrategy] = useState<DupStrategy>('skip')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [result, setResult]   = useState<{ created: number; updated: number; skipped: number } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // ─── Etapa 1 → 2: parseia e chama /preview ──────────────────────────────
  async function runPreview(contacts: RawContact[]) {
    if (contacts.length === 0) {
      setError('Nenhum contato reconhecido. Confira o formato.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await api.post('/clients/import/preview', { contacts })
      const data: PreviewResult = res.data?.data ?? res.data
      setPreview(data)
      setStep('preview')
    } catch {
      setError('Erro ao analisar os contatos. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  function handlePasteContinue() {
    runPreview(parsePastedText(pasted))
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const content = String(reader.result ?? '')
      runPreview(parseFile(file.name, content))
    }
    reader.onerror = () => setError('Não consegui ler o arquivo.')
    reader.readAsText(file, 'utf-8')
  }

  // ─── Etapa 2 → 3: confirma a importação ─────────────────────────────────
  async function handleConfirm() {
    if (!preview) return
    setLoading(true)
    setError(null)
    try {
      const toRaw = (c: PreviewContact): RawContact => ({
        name: c.name, phone: c.phone, email: c.email, cpf: c.cpfValid ? c.cpf : null,
      })
      const res = await api.post('/clients/import/confirm', {
        news:              preview.news.map(toRaw),
        duplicates:        preview.duplicates.map(toRaw),
        duplicateStrategy: strategy,
      })
      setResult(res.data?.data ?? res.data)
      setStep('result')
    } catch {
      setError('Erro ao importar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (typeof document === 'undefined') return null

  const panel: React.CSSProperties = isMobile
    ? {
        position: 'fixed', inset: 0, top: 'var(--navbar-h, 104px)',
        background: '#fff', zIndex: 10000,
        display: 'flex', flexDirection: 'column',
        fontFamily: typography.fontFamily,
      }
    : {
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 'min(560px, 92vw)', maxHeight: '86vh',
        background: '#fff', borderRadius: radius['2xl'], boxShadow: shadows.lg,
        zIndex: 10000, display: 'flex', flexDirection: 'column', overflow: 'hidden',
        fontFamily: typography.fontFamily,
      }

  const content = (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
        backdropFilter: 'blur(4px)', zIndex: 9999,
      }} />
      <div style={panel}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '16px 20px', borderBottom: `1px solid ${colors.gray.border}`,
        }}>
          {step !== 'source' && step !== 'result' && (
            <button onClick={() => setStep('source')} style={iconBtn}>
              <ArrowLeft size={18} color={colors.gray[700]} />
            </button>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: colors.gray[900] }}>
              Importar clientes
            </div>
            <div style={{ fontSize: 11, color: colors.gray.dimText }}>
              {step === 'source'  && 'Cole a lista ou envie um arquivo'}
              {step === 'preview' && 'Confira antes de importar'}
              {step === 'result'  && 'Importação concluída'}
            </div>
          </div>
          <button onClick={onClose} style={iconBtn}>
            <X size={18} color={colors.gray[700]} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 12px', marginBottom: 14,
              background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)',
              borderRadius: 10, fontSize: 13, color: colors.red.DEFAULT,
            }}>
              <AlertTriangle size={15} /> {error}
            </div>
          )}

          {/* ETAPA 1: ORIGEM */}
          {step === 'source' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <button onClick={() => fileRef.current?.click()} style={uploadCard}>
                <Upload size={22} color={colors.red.DEFAULT} />
                <div style={{ fontSize: 14, fontWeight: 700, color: colors.gray[900] }}>Enviar arquivo</div>
                <div style={{ fontSize: 11, color: colors.gray.dimText }}>CSV ou vCard (.vcf) exportado do celular</div>
              </button>
              <input
                ref={fileRef} type="file" accept=".csv,.vcf,.txt,.tsv,text/csv,text/vcard"
                onChange={handleFile} style={{ display: 'none' }}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: colors.gray.dimText, fontSize: 11 }}>
                <div style={{ flex: 1, height: 1, background: colors.gray.border }} /> OU <div style={{ flex: 1, height: 1, background: colors.gray.border }} />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <ClipboardList size={14} color={colors.gray[700]} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: colors.gray[900] }}>Colar lista</span>
                </div>
                <textarea
                  value={pasted}
                  onChange={e => setPasted(e.target.value)}
                  placeholder={'Um contato por linha. Ex:\nJoão Silva, (11) 98765-4321\nMaria Souza, 11 91234-5678, maria@email.com'}
                  rows={6}
                  style={{
                    width: '100%', boxSizing: 'border-box', resize: 'vertical',
                    padding: '10px 12px', borderRadius: 10,
                    border: `1px solid ${colors.gray.borderMd}`,
                    fontSize: 13, fontFamily: typography.fontFamily, color: colors.gray[900],
                    outline: 'none', lineHeight: 1.5,
                  }}
                />
                <button
                  onClick={handlePasteContinue}
                  disabled={loading || !pasted.trim()}
                  style={{ ...primaryBtn, marginTop: 10, width: '100%', opacity: (loading || !pasted.trim()) ? 0.5 : 1 }}
                >
                  {loading ? <Loader2 size={15} className="spin" /> : null}
                  Analisar contatos
                </button>
              </div>
            </div>
          )}

          {/* ETAPA 2: PREVIEW */}
          {step === 'preview' && preview && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Resumo */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                <Stat icon={<UserPlus size={15} />} label="Novos"      value={preview.totals.news}       tone="green" />
                <Stat icon={<Users size={15} />}    label="Duplicados" value={preview.totals.duplicates} tone="amber" />
                <Stat icon={<FileWarning size={15} />} label="Inválidos" value={preview.totals.invalid}  tone="red" />
              </div>

              {/* Estratégia de duplicados */}
              {preview.duplicates.length > 0 && (
                <div style={{ padding: '12px 14px', background: colors.background.page, borderRadius: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: colors.gray[900], marginBottom: 8 }}>
                    {preview.duplicates.length} telefone(s) já cadastrado(s). O que fazer?
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['skip', 'update'] as DupStrategy[]).map(s => (
                      <button key={s} onClick={() => setStrategy(s)} style={{
                        flex: 1, padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                        fontSize: 12, fontWeight: 700,
                        border: strategy === s ? '1px solid transparent' : `1px solid ${colors.gray.borderMd}`,
                        background: strategy === s ? colors.red.gradient : '#fff',
                        color: strategy === s ? '#fff' : colors.gray[700],
                      }}>
                        {s === 'skip' ? 'Pular' : 'Atualizar dados'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Listas (resumidas) */}
              <PreviewList title="Serão criados"   items={preview.news}       tone="green" empty="Nenhum novo" />
              {preview.duplicates.length > 0 && (
                <PreviewList title="Duplicados" items={preview.duplicates} tone="amber"
                  subtitleFn={c => c.existingName ? `já existe: ${c.existingName}` : c.reason} />
              )}
              {preview.invalid.length > 0 && (
                <PreviewList title="Ignorados (inválidos)" items={preview.invalid} tone="red"
                  subtitleFn={c => `${c.phoneRaw || 'sem telefone'} — ${c.reason}`} />
              )}
            </div>
          )}

          {/* ETAPA 3: RESULTADO */}
          {step === 'result' && result && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <CheckCircle2 size={48} color="#15803d" style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 18, fontWeight: 800, color: colors.gray[900], marginBottom: 6 }}>
                Importação concluída
              </div>
              <div style={{ fontSize: 14, color: colors.gray[700], lineHeight: 1.6 }}>
                <strong>{result.created}</strong> criado(s)
                {result.updated > 0 && <> · <strong>{result.updated}</strong> atualizado(s)</>}
                {result.skipped > 0 && <> · <strong>{result.skipped}</strong> pulado(s)</>}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'preview' && preview && (
          <div style={{ padding: 16, borderTop: `1px solid ${colors.gray.border}`, display: 'flex', gap: 10 }}>
            <button onClick={() => setStep('source')} style={{ ...secondaryBtn, flex: 1 }}>Voltar</button>
            <button
              onClick={handleConfirm}
              disabled={loading || (preview.totals.news === 0 && (strategy === 'skip' || preview.totals.duplicates === 0))}
              style={{ ...primaryBtn, flex: 2, opacity: loading ? 0.6 : 1 }}
            >
              {loading ? <Loader2 size={15} className="spin" /> : null}
              Importar {preview.totals.news + (strategy === 'update' ? preview.totals.duplicates : 0)} cliente(s)
            </button>
          </div>
        )}
        {step === 'result' && (
          <div style={{ padding: 16, borderTop: `1px solid ${colors.gray.border}` }}>
            <button onClick={() => { onDone(); onClose() }} style={{ ...primaryBtn, width: '100%' }}>
              Concluir
            </button>
          </div>
        )}

        <style>{`.spin{animation:spin 0.8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </>
  )

  return createPortal(content, document.body)
}

// ─── Subcomponentes ──────────────────────────────────────────────────────────
function Stat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: 'green'|'amber'|'red' }) {
  const map = {
    green: { c: '#15803d', bg: 'rgba(22,163,74,0.10)' },
    amber: { c: '#b45309', bg: 'rgba(245,158,11,0.12)' },
    red:   { c: '#dc2626', bg: 'rgba(220,38,38,0.08)' },
  }[tone]
  return (
    <div style={{ padding: '10px 8px', background: map.bg, borderRadius: 10, textAlign: 'center' }}>
      <div style={{ color: map.c, display: 'flex', justifyContent: 'center', marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: colors.gray[900], lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, fontWeight: 600, color: colors.gray.dimText, marginTop: 2 }}>{label}</div>
    </div>
  )
}

function PreviewList({ title, items, tone, empty, subtitleFn }: {
  title: string; items: PreviewContact[]; tone: 'green'|'amber'|'red';
  empty?: string; subtitleFn?: (c: PreviewContact) => string | undefined
}) {
  const c = { green: '#15803d', amber: '#b45309', red: '#dc2626' }[tone]
  if (items.length === 0) {
    return empty ? <div style={{ fontSize: 12, color: colors.gray.dimText }}>{empty}</div> : null
  }
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: c, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>
        {title} ({items.length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 180, overflowY: 'auto' }}>
        {items.slice(0, 100).map((it, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '6px 10px', background: colors.background.page, borderRadius: 7, fontSize: 12,
          }}>
            <span style={{ fontWeight: 600, color: colors.gray[900], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {it.name}
            </span>
            <span style={{ color: colors.gray.dimText, fontSize: 11, flexShrink: 0, marginLeft: 8 }}>
              {subtitleFn ? subtitleFn(it) : it.phone}
            </span>
          </div>
        ))}
        {items.length > 100 && (
          <div style={{ fontSize: 11, color: colors.gray.dimText, textAlign: 'center', padding: 4 }}>
            + {items.length - 100} outros
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Estilos compartilhados ────────────────────────────────────────────────
const iconBtn: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
}
const uploadCard: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
  padding: '24px 16px', borderRadius: 14, cursor: 'pointer',
  border: `2px dashed ${colors.red.border}`, background: colors.red.subtle,
  fontFamily: typography.fontFamily, width: '100%',
}
const primaryBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  padding: '11px 16px', borderRadius: 12, border: 'none',
  background: colors.red.gradient, color: '#fff', fontSize: 14, fontWeight: 700,
  cursor: 'pointer', fontFamily: typography.fontFamily,
}
const secondaryBtn: React.CSSProperties = {
  padding: '11px 16px', borderRadius: 12, border: `1px solid ${colors.gray.borderMd}`,
  background: '#fff', color: colors.gray[700], fontSize: 14, fontWeight: 600,
  cursor: 'pointer', fontFamily: typography.fontFamily,
}
