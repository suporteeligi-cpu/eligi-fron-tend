'use client'
// src/app/dashboard/financeiro/comissoes/components/PayoutSettingsModal.tsx

import { useState, useEffect, useMemo } from 'react'
import { X, Calendar, Briefcase, Package, AlertTriangle, Loader2 } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { colors, typography, radius, shadows, transitions } from '@/shared/theme'
import { PayoutSettings, PayoutFrequency } from '@/features/payouts/types'

interface Props {
  settings: PayoutSettings | null
  isMobile: boolean
  onClose:  () => void
  onSaved:  (s: PayoutSettings) => void
}

const WEEKDAYS = [
  { label: 'Dom', value: 0 },
  { label: 'Seg', value: 1 },
  { label: 'Ter', value: 2 },
  { label: 'Qua', value: 3 },
  { label: 'Qui', value: 4 },
  { label: 'Sex', value: 5 },
  { label: 'Sáb', value: 6 },
] as const

/** Dado periodStartDay e weekday (pagamento), calcula o período da semana atual e scheduledFor */
function previewPeriod(startDay: number, payDay: number): { start: Date; end: Date; pay: Date } {
  const today   = new Date(); today.setHours(0,0,0,0)
  const todayWd = today.getDay()
  const dBack   = (todayWd - startDay + 7) % 7
  const start   = new Date(today); start.setDate(today.getDate() - dBack)
  const end     = new Date(start); end.setDate(start.getDate() + 6)
  const endWd   = end.getDay()
  const dPay    = (payDay - endWd + 7) % 7
  const pay     = new Date(end); pay.setDate(end.getDate() + (dPay === 0 ? 0 : dPay))
  return { start, end, pay }
}

function fmtShort(d: Date): string {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function fmtWd(d: Date): string {
  return d.toLocaleDateString('pt-BR', { weekday: 'short' })
    .replace('.', '').replace(/^\w/, c => c.toUpperCase())
}

export default function PayoutSettingsModal({ settings, isMobile, onClose, onSaved }: Props) {
  const [frequency,      setFrequency]      = useState<PayoutFrequency>(settings?.frequency ?? 'MONTHLY')
  const [weekday,        setWeekday]        = useState<number>(settings?.weekday ?? 2)
  const [periodStartDay, setPeriodStartDay] = useState<number>(settings?.periodStartDay ?? 0)
  const [monthDay,       setMonthDay]       = useState<number>(settings?.monthDay ?? 1)
  const [includeServices,setIncludeServices]= useState(settings?.includeServices ?? true)
  const [includeProducts,setIncludeProducts]= useState(settings?.includeProducts ?? true)
  const [enabled,        setEnabled]        = useState(settings?.enabled ?? true)
  const [saving,         setSaving]         = useState(false)
  const [error,          setError]          = useState<string | null>(null)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const isWeekBased = frequency === 'WEEKLY' || frequency === 'BIWEEKLY'

  const preview = useMemo(() => {
    if (!isWeekBased) return null
    return previewPeriod(periodStartDay, weekday)
  }, [isWeekBased, periodStartDay, weekday])

  async function save() {
    setError(null)
    if (!includeServices && !includeProducts) {
      setError('Selecione pelo menos um tipo (serviços ou produtos)')
      return
    }
    setSaving(true)
    try {
      const body = {
        frequency,
        weekday:        isWeekBased ? weekday : null,
        periodStartDay: isWeekBased ? periodStartDay : null,
        monthDay:       frequency === 'MONTHLY' ? monthDay : null,
        includeServices,
        includeProducts,
        enabled,
      }
      const res  = await api.put('/payouts/settings', body)
      const data = res.data?.data ?? res.data
      onSaved(data)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'Erro ao salvar')
      setSaving(false)
    }
  }

  const sheetStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed', bottom: 0, left: 0, right: 0,
        maxHeight: '92vh',
        borderTopLeftRadius: 18, borderTopRightRadius: 18,
        animation: 'slideUp 0.25s ease',
      }
    : {
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '92%', maxWidth: 460, maxHeight: '90vh',
        borderRadius: radius.xl,
        animation: 'fadeScale 0.2s ease',
      }

  return (
    <>
      <style>{`
        @keyframes slideUp  { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fadeScale { from { opacity:0; transform:translate(-50%,-50%) scale(.95); } to { opacity:1; transform:translate(-50%,-50%) scale(1); } }
        @keyframes pos-spin  { to { transform: rotate(360deg) } }
      `}</style>

      {/* Backdrop */}
      <div onClick={onClose} style={{
        position:'fixed', inset:0,
        background:'rgba(0,0,0,0.45)', backdropFilter:'blur(2px)', zIndex:1000,
      }} />

      {/* Sheet/Modal */}
      <div style={{
        ...sheetStyle,
        background: '#fff', boxShadow: shadows.lg,
        zIndex: 1001, fontFamily: typography.fontFamily,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 18px', borderBottom: `1px solid ${colors.gray.border}`,
          display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: colors.red.gradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Calendar size={15} color="#fff" strokeWidth={2.4} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: typography.scale.lg, fontWeight: typography.weight.bold, color: typography.color.primary }}>
              Configurar pagamento
            </div>
            <div style={{ fontSize: typography.scale.sm, color: typography.color.muted }}>
              Quando você paga comissões à equipe
            </div>
          </div>
          <button onClick={onClose} aria-label="Fechar" style={{
            width: 30, height: 30, borderRadius: '50%',
            border: `1px solid ${colors.gray.border}`, background: '#fff',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <X size={13} color={colors.gray.dimText} />
          </button>
        </div>

        {/* Body */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '18px',
          display: 'flex', flexDirection: 'column', gap: 18,
        }}>

          {/* Frequência */}
          <div>
            <label style={labelStyle}>FREQUÊNCIA</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
              {(['WEEKLY','BIWEEKLY','MONTHLY'] as PayoutFrequency[]).map(f => (
                <button key={f} onClick={() => setFrequency(f)} type="button" style={{
                  padding: '10px 8px', borderRadius: radius.sm,
                  border: `1px solid ${frequency === f ? colors.red.DEFAULT : colors.gray.borderMd}`,
                  background: frequency === f ? colors.red.subtle : '#fff',
                  color: frequency === f ? colors.red.DEFAULT : typography.color.primary,
                  fontSize: typography.scale.sm, fontWeight: typography.weight.semibold,
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: `all ${transitions.fast}`, WebkitTapHighlightColor: 'transparent',
                }}>
                  {f === 'WEEKLY' ? 'Semanal' : f === 'BIWEEKLY' ? 'Quinzenal' : 'Mensal'}
                </button>
              ))}
            </div>
          </div>

          {/* SEMANAL/QUINZENAL — dois seletores */}
          {isWeekBased && (<>

            {/* Início do período */}
            <div>
              <label style={labelStyle}>INÍCIO DO PERÍODO</label>
              <div style={{ fontSize: typography.scale.xs, color: typography.color.muted, marginBottom: 8 }}>
                Primeiro dia da semana de contagem das comissões
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
                {WEEKDAYS.map(d => (
                  <button key={d.value} onClick={() => setPeriodStartDay(d.value)} type="button" style={{
                    padding: '10px 4px', borderRadius: radius.sm,
                    border: `1px solid ${periodStartDay === d.value ? colors.red.DEFAULT : colors.gray.borderMd}`,
                    background: periodStartDay === d.value ? colors.red.subtle : '#fff',
                    color: periodStartDay === d.value ? colors.red.DEFAULT : typography.color.primary,
                    fontSize: typography.scale.xs, fontWeight: typography.weight.semibold,
                    cursor: 'pointer', fontFamily: 'inherit',
                    transition: `all ${transitions.fast}`, WebkitTapHighlightColor: 'transparent',
                  }}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dia de pagamento */}
            <div>
              <label style={labelStyle}>DIA DE PAGAMENTO</label>
              <div style={{ fontSize: typography.scale.xs, color: typography.color.muted, marginBottom: 8 }}>
                Dia da semana em que os pagamentos são realizados
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
                {WEEKDAYS.map(d => (
                  <button key={d.value} onClick={() => setWeekday(d.value)} type="button" style={{
                    padding: '10px 4px', borderRadius: radius.sm,
                    border: `1px solid ${weekday === d.value ? colors.red.DEFAULT : colors.gray.borderMd}`,
                    background: weekday === d.value ? colors.red.subtle : '#fff',
                    color: weekday === d.value ? colors.red.DEFAULT : typography.color.primary,
                    fontSize: typography.scale.xs, fontWeight: typography.weight.semibold,
                    cursor: 'pointer', fontFamily: 'inherit',
                    transition: `all ${transitions.fast}`, WebkitTapHighlightColor: 'transparent',
                  }}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview do período */}
            {preview && (
              <div style={{
                padding: '11px 14px',
                background: 'rgba(220,38,38,0.04)',
                border: `1px solid ${colors.red.border}`,
                borderRadius: radius.sm,
                fontSize: typography.scale.sm,
                color: typography.color.primary,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <Calendar size={13} color={colors.red.DEFAULT} strokeWidth={2.2} style={{ flexShrink: 0 }} />
                <span>
                  <span style={{ fontWeight: typography.weight.semibold, color: colors.red.DEFAULT }}>
                    Período atual:&nbsp;
                  </span>
                  {fmtWd(preview.start)} {fmtShort(preview.start)} → {fmtWd(preview.end)} {fmtShort(preview.end)}
                  <span style={{ color: typography.color.muted }}>
                    &nbsp;· Pagamento: {fmtWd(preview.pay)} {fmtShort(preview.pay)}
                  </span>
                </span>
              </div>
            )}
          </>)}

          {/* Dia do mês (MONTHLY) */}
          {frequency === 'MONTHLY' && (
            <div>
              <label style={labelStyle}>DIA DO MÊS</label>
              <input
                type="number" min={1} max={31}
                value={monthDay}
                onChange={e => setMonthDay(Math.max(1, Math.min(31, Number(e.target.value) || 1)))}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '10px 14px', borderRadius: radius.sm,
                  border: `1px solid ${colors.gray.borderMd}`,
                  fontSize: typography.scale.base, fontWeight: typography.weight.semibold,
                  outline: 'none', fontFamily: 'inherit', fontVariantNumeric: 'tabular-nums',
                }}
              />
              <div style={{ fontSize: typography.scale.xs, color: typography.color.muted, marginTop: 4 }}>
                Pagamento ocorrerá todo dia {monthDay} (ou último dia do mês se inválido)
              </div>
            </div>
          )}

          {/* Tipos incluídos */}
          <div>
            <label style={labelStyle}>INCLUIR COMISSÕES DE</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <CheckRow
                checked={includeServices} onChange={setIncludeServices}
                Icon={Briefcase} label="Serviços" description="Comissões por serviços executados"
              />
              <CheckRow
                checked={includeProducts} onChange={setIncludeProducts}
                Icon={Package} label="Produtos" description="Comissões por produtos vendidos"
              />
            </div>
          </div>

          {/* Toggle ativo */}
          <div style={{
            padding: '12px 14px',
            background: colors.background.page,
            border: `1px solid ${colors.gray.border}`,
            borderRadius: radius.md,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: typography.scale.base, fontWeight: typography.weight.semibold, color: typography.color.primary }}>
                Sistema ativo
              </div>
              <div style={{ fontSize: typography.scale.sm, color: typography.color.muted, marginTop: 2 }}>
                Gerar payouts automaticamente
              </div>
            </div>
            <Toggle checked={enabled} onChange={setEnabled} />
          </div>

          {error && (
            <div style={{
              padding: '10px 12px',
              background: 'rgba(220,38,38,0.08)', border: `1px solid ${colors.red.border}`,
              borderRadius: radius.sm, fontSize: typography.scale.sm, color: colors.red.DEFAULT,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <AlertTriangle size={14} />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 18px', borderTop: `1px solid ${colors.gray.border}`,
          display: 'flex', gap: 8, flexShrink: 0,
        }}>
          <button onClick={onClose} disabled={saving} style={{
            padding: '11px 18px', borderRadius: radius.sm,
            border: `1px solid ${colors.gray.borderMd}`, background: '#fff',
            color: typography.color.primary, fontSize: typography.scale.sm,
            fontWeight: typography.weight.semibold, cursor: 'pointer',
            fontFamily: 'inherit', WebkitTapHighlightColor: 'transparent',
          }}>
            Cancelar
          </button>
          <button onClick={save} disabled={saving} style={{
            flex: 1, padding: '11px 18px', borderRadius: radius.sm, border: 'none',
            background: saving ? colors.gray.dimTextLight : colors.red.gradient,
            color: '#fff', fontSize: typography.scale.sm, fontWeight: typography.weight.bold,
            cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            boxShadow: saving ? 'none' : shadows.redSm, WebkitTapHighlightColor: 'transparent',
          }}>
            {saving && <Loader2 size={14} style={{ animation: 'pos-spin 0.8s linear infinite' }} />}
            {saving ? 'Salvando…' : 'Salvar configuração'}
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: typography.scale.xs,
  fontWeight: typography.weight.bold, color: typography.color.muted,
  textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8,
}

function CheckRow({ checked, onChange, Icon, label, description }: {
  checked:  boolean
  onChange: (v: boolean) => void
  Icon:     React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>
  label:    string
  description: string
}) {
  return (
    <button onClick={() => onChange(!checked)} type="button" style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px',
      background: checked ? colors.red.subtle : colors.background.page,
      border: `1px solid ${checked ? colors.red.border : colors.gray.borderMd}`,
      borderRadius: radius.sm, cursor: 'pointer', textAlign: 'left',
      fontFamily: 'inherit', transition: `all ${transitions.fast}`,
      WebkitTapHighlightColor: 'transparent',
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: '50%', background: '#fff',
        border: `1px solid ${checked ? colors.red.border : colors.gray.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={14} color={checked ? colors.red.DEFAULT : colors.gray.dimText} strokeWidth={2.2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: typography.scale.base, fontWeight: typography.weight.semibold, color: typography.color.primary }}>
          {label}
        </div>
        <div style={{ fontSize: typography.scale.xs, color: typography.color.muted }}>
          {description}
        </div>
      </div>
      <div style={{
        width: 18, height: 18, borderRadius: 5,
        border: `2px solid ${checked ? colors.red.DEFAULT : colors.gray.borderMd}`,
        background: checked ? colors.red.DEFAULT : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {checked && (
          <svg viewBox="0 0 12 12" width="10" height="10">
            <path d="M2 6.5 L5 9 L10 3" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
    </button>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} type="button" role="switch" aria-checked={checked} style={{
      width: 42, height: 24, borderRadius: 12,
      background: checked ? colors.red.DEFAULT : colors.gray.borderMd,
      border: 'none', cursor: 'pointer', position: 'relative',
      transition: 'background 0.2s ease', flexShrink: 0, padding: 0,
      WebkitTapHighlightColor: 'transparent',
    }}>
      <div style={{
        width: 18, height: 18, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 3, left: checked ? 21 : 3,
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s ease',
      }} />
    </button>
  )
}
