'use client'
// src/app/(dashboard)/configuracoes/horarios/page.tsx

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Clock } from 'lucide-react'
import api from '@/shared/lib/apiClient'

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface HourSlot {
  weekday:   number
  open:      boolean
  startTime: string
  endTime:   string
}

const DAYS = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado']
const DAYS_SHORT = ['DOM','SEG','TER','QUA','QUI','SEX','SÁB']

// Gera opções de horário de 30 em 30 min
function generateTimeOptions(): string[] {
  const opts: string[] = []
  for (let h = 0; h < 24; h++)
    for (let m = 0; m < 60; m += 30)
      opts.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`)
  return opts
}
const TIME_OPTIONS = generateTimeOptions()

// ─── Subcomponentes ───────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
        background: checked ? 'linear-gradient(135deg,#dc2626,#b91c1c)' : 'rgba(0,0,0,0.12)',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
        boxShadow: checked ? '0 2px 8px rgba(220,38,38,0.30)' : 'none',
      }}
    >
      <div style={{
        width: 20, height: 20, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 3,
        left: checked ? 21 : 3,
        transition: 'left 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
      }} />
    </button>
  )
}

function TimeSelect({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        disabled={disabled}
        onChange={e => onChange(e.target.value)}
        style={{
          padding: '8px 28px 8px 12px',
          borderRadius: 8, border: '1px solid rgba(0,0,0,0.09)',
          background: disabled ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.9)',
          color: disabled ? 'rgba(0,0,0,0.3)' : '#111827',
          fontSize: 13, appearance: 'none', cursor: disabled ? 'default' : 'pointer',
          outline: 'none', fontVariantNumeric: 'tabular-nums',
          fontFamily: '-apple-system,"SF Pro Display",system-ui,sans-serif',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          minWidth: 86,
        }}
        onFocus={e => { if (!disabled) { e.target.style.borderColor = 'rgba(220,38,38,0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(220,38,38,0.08)' } }}
        onBlur={e  => { e.target.style.borderColor = 'rgba(0,0,0,0.09)'; e.target.style.boxShadow = 'none' }}
      >
        {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
      <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'rgba(0,0,0,0.28)', fontSize: 10 }}>▾</div>
    </div>
  )
}

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div style={{
      position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
      padding: '12px 22px', borderRadius: 14, zIndex: 9999,
      background: type === 'success' ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'linear-gradient(135deg,#dc2626,#b91c1c)',
      color: '#fff', fontSize: 14, fontWeight: 600,
      boxShadow: '0 8px 28px rgba(0,0,0,0.16)',
      fontFamily: '-apple-system,"SF Pro Display",system-ui,sans-serif',
      whiteSpace: 'nowrap',
      animation: 'toastIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
    }}>
      {message}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HorariosPage() {
  const router  = useRouter()
  const [slots,    setSlots]    = useState<HourSlot[]>([])
  const [original, setOriginal] = useState<HourSlot[]>([])
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [toast,    setToast]    = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [error,    setError]    = useState<string | null>(null)

  const isDirty = JSON.stringify(slots) !== JSON.stringify(original)

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2800)
  }

  useEffect(() => {
    api.get('/business-hours')
      .then(res => {
        const data = res.data?.data ?? res.data
        setSlots(data)
        setOriginal(data)
      })
      .catch(() => showToast('Erro ao carregar horários', 'error'))
      .finally(() => setLoading(false))
  }, [])

  function updateSlot(weekday: number, patch: Partial<HourSlot>) {
    setError(null)
    setSlots(prev => prev.map(s => s.weekday === weekday ? { ...s, ...patch } : s))
  }

  async function handleSave() {
    // Valida no cliente antes de enviar
    for (const s of slots) {
      if (s.open && s.startTime >= s.endTime) {
        setError(`${DAYS[s.weekday]}: o horário de início deve ser antes do fim.`)
        return
      }
    }
    try {
      setSaving(true)
      setError(null)
      const res  = await api.put('/business-hours', { slots })
      const data = res.data?.data ?? res.data
      setSlots(data)
      setOriginal(data)
      showToast('Horários salvos com sucesso!', 'success')
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
      showToast(msg ?? 'Erro ao salvar horários', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Atalhos: copiar horário de um dia para todos os dias abertos
  function copyToAll(weekday: number) {
    const source = slots.find(s => s.weekday === weekday)
    if (!source) return
    setSlots(prev => prev.map(s =>
      s.open ? { ...s, startTime: source.startTime, endTime: source.endTime } : s
    ))
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(220,38,38,0.15)', borderTopColor: '#dc2626', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <>
      <style>{`
        @keyframes toastIn { from { opacity:0; transform:translateX(-50%) translateY(10px) } to { opacity:1; transform:translateX(-50%) translateY(0) } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        .back-btn:hover { background:rgba(220,38,38,0.06) !important; }
        .back-btn:hover svg { stroke:#dc2626 !important; }
        .copy-btn { font-size:11px; color:rgba(0,0,0,0.35); background:none; border:none; cursor:pointer; padding:3px 6px; border-radius:6px; transition:all 0.15s; white-space:nowrap; }
        .copy-btn:hover { background:rgba(220,38,38,0.06); color:#dc2626; }
        .day-row { transition: opacity 0.15s; }
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} />}

      <div style={{ maxWidth: 640, animation: 'fadeUp 0.3s ease', fontFamily: '-apple-system,"SF Pro Display",system-ui,sans-serif' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className="back-btn"
              onClick={() => router.push('/dashboard/configuracoes')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 34, height: 34, borderRadius: 10,
                border: '1px solid rgba(0,0,0,0.09)', background: 'rgba(255,255,255,0.8)',
                cursor: 'pointer', flexShrink: 0, transition: 'background 0.15s',
              }}
            >
              <ChevronLeft size={18} color="rgba(0,0,0,0.5)" strokeWidth={2} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: 'linear-gradient(135deg,#dc2626,#b91c1c)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(220,38,38,0.28)',
              }}>
                <Clock size={18} color="#fff" strokeWidth={1.8} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', color: '#0f0f14' }}>
                  Horários de funcionamento
                </h2>
                <p style={{ margin: 0, fontSize: 12, color: 'rgba(0,0,0,0.4)' }}>
                  Configurações › Horários
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={!isDirty || saving}
            style={{
              padding: '9px 22px', borderRadius: 10, border: 'none',
              background: isDirty && !saving ? 'linear-gradient(135deg,#dc2626,#b91c1c)' : 'rgba(0,0,0,0.07)',
              color: isDirty && !saving ? '#fff' : 'rgba(0,0,0,0.28)',
              fontSize: 13, fontWeight: 600,
              cursor: isDirty && !saving ? 'pointer' : 'not-allowed',
              boxShadow: isDirty && !saving ? '0 4px 14px rgba(220,38,38,0.25)' : 'none',
              transition: 'all 0.2s', whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>

        {/* Erro de validação */}
        {error && (
          <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 10, background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.18)', color: '#b91c1c', fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* Card de dias */}
        <div style={{
          background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(20px)',
          borderRadius: 16, border: '1px solid rgba(0,0,0,0.07)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.05)', overflow: 'hidden',
        }}>
          {/* Header do card */}
          <div style={{ padding: '13px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,0.35)', letterSpacing: '0.09em', textTransform: 'uppercase' }}>
              Dias e horários
            </span>
            <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.35)' }}>
              {slots.filter(s => s.open).length} dia{slots.filter(s => s.open).length !== 1 ? 's' : ''} ativo{slots.filter(s => s.open).length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Linhas de dia */}
          {slots.map((slot, idx) => {
            const isLast = idx === slots.length - 1
            return (
              <div
                key={slot.weekday}
                className="day-row"
                style={{
                  padding: '14px 20px',
                  borderBottom: isLast ? 'none' : '1px solid rgba(0,0,0,0.05)',
                  display: 'flex', alignItems: 'center', gap: 14,
                  opacity: slot.open ? 1 : 0.55,
                  background: slot.open ? 'transparent' : 'rgba(0,0,0,0.01)',
                }}
              >
                {/* Toggle */}
                <Toggle
                  checked={slot.open}
                  onChange={v => updateSlot(slot.weekday, { open: v })}
                />

                {/* Nome do dia */}
                <div style={{ width: 130, flexShrink: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
                    {DAYS[slot.weekday]}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.35)', marginTop: 1 }}>
                    {DAYS_SHORT[slot.weekday]}
                  </div>
                </div>

                {/* Horários ou fechado */}
                {slot.open ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                    <TimeSelect
                      value={slot.startTime}
                      onChange={v => updateSlot(slot.weekday, { startTime: v })}
                    />
                    <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.3)', fontWeight: 500 }}>até</span>
                    <TimeSelect
                      value={slot.endTime}
                      onChange={v => updateSlot(slot.weekday, { endTime: v })}
                    />
                    {/* Duração */}
                    <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.3)', marginLeft: 4, whiteSpace: 'nowrap' }}>
                      {(() => {
                        const [sh, sm] = slot.startTime.split(':').map(Number)
                        const [eh, em] = slot.endTime.split(':').map(Number)
                        const diff = (eh * 60 + em) - (sh * 60 + sm)
                        if (diff <= 0) return '—'
                        const h = Math.floor(diff / 60)
                        const m = diff % 60
                        return h > 0 && m > 0 ? `${h}h${m}m` : h > 0 ? `${h}h` : `${m}m`
                      })()}
                    </span>
                    {/* Copiar para todos */}
                    <button className="copy-btn" onClick={() => copyToAll(slot.weekday)} title="Aplicar este horário para todos os dias abertos">
                      Copiar para todos
                    </button>
                  </div>
                ) : (
                  <div style={{ flex: 1, fontSize: 13, color: 'rgba(0,0,0,0.3)', fontStyle: 'italic' }}>
                    Fechado
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Info */}
        <div style={{
          marginTop: 16, padding: '13px 18px', borderRadius: 12,
          background: 'rgba(220,38,38,0.04)', border: '1px solid rgba(220,38,38,0.10)',
          display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>💡</span>
          <p style={{ margin: 0, fontSize: 13, color: 'rgba(0,0,0,0.45)', lineHeight: 1.6 }}>
            Esses horários são usados para controlar a disponibilidade no link público de agendamento.
            Use o botão <strong>Copiar para todos</strong> para replicar rapidamente o horário de um dia para os demais.
          </p>
        </div>
      </div>
    </>
  )
}