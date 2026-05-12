'use client'
// src/app/(dashboard)/configuracoes/page.tsx

import { useState, useEffect } from 'react'
import api from '@/shared/lib/apiClient'

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface BookingSettings {
  autoConfirm:            boolean
  avoidGapsBetweenVisits: boolean
  minBookingNotice:       number
  maxFutureBookingDays:   number
  rescheduleNotice:       number
}

// ─── Opções dos selects ───────────────────────────────────────────────────────
const NOTICE_OPTIONS = [
  { label: 'Sem limite',                    value: 0    },
  { label: 'Pelo menos 15 minutos antes',   value: 15   },
  { label: 'Pelo menos 30 minutos antes',   value: 30   },
  { label: 'Pelo menos 1 hora antes',       value: 60   },
  { label: 'Pelo menos 2 horas antes',      value: 120  },
  { label: 'Pelo menos 3 horas antes',      value: 180  },
  { label: 'Pelo menos 6 horas antes',      value: 360  },
  { label: 'Pelo menos 12 horas antes',     value: 720  },
  { label: 'Pelo menos 24 horas antes',     value: 1440 },
]

const FUTURE_OPTIONS = [
  { label: 'máx. 1 dia de antecedência',    value: 1   },
  { label: 'máx. 3 dias de antecedência',   value: 3   },
  { label: 'máx. 7 dias de antecedência',   value: 7   },
  { label: 'máx. 14 dias de antecedência',  value: 14  },
  { label: 'máx. 30 dias de antecedência',  value: 30  },
  { label: 'máx. 60 dias de antecedência',  value: 60  },
  { label: 'máx. 90 dias de antecedência',  value: 90  },
  { label: 'Sem limite',                    value: 365 },
]

const RESCHEDULE_OPTIONS = [
  { label: 'Sem limite',                    value: 0    },
  { label: 'Pelo menos 30 minutos antes',   value: 30   },
  { label: 'Pelo menos 1 hora antes',       value: 60   },
  { label: 'Pelo menos 2 horas antes',      value: 120  },
  { label: 'Pelo menos 3 horas antes',      value: 180  },
  { label: 'Pelo menos 6 horas antes',      value: 360  },
  { label: 'Pelo menos 12 horas antes',     value: 720  },
  { label: 'Pelo menos 24 horas antes',     value: 1440 },
]

// ─── Componentes internos ─────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 48, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer',
        background: checked ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'rgba(0,0,0,0.15)',
        position: 'relative', transition: 'background 0.2s',
        flexShrink: 0,
        boxShadow: checked ? '0 2px 8px rgba(34,197,94,0.35)' : 'none',
      }}
    >
      <div style={{
        width: 22, height: 22, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 3,
        left: checked ? 23 : 3,
        transition: 'left 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
      }} />
    </button>
  )
}

function Select({
  value, onChange, options,
}: {
  value: number
  onChange: (v: number) => void
  options: { label: string; value: number }[]
}) {
  return (
    <div style={{ position: 'relative', flex: 1 }}>
      <select
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          width: '100%', padding: '10px 36px 10px 14px',
          borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)',
          background: 'rgba(255,255,255,0.8)', color: '#111827',
          fontSize: 14, appearance: 'none', cursor: 'pointer', outline: 'none',
          fontFamily: '-apple-system,"SF Pro Display",system-ui,sans-serif',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
        onFocus={e => { e.target.style.borderColor = 'rgba(220,38,38,0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(220,38,38,0.08)' }}
        onBlur={e  => { e.target.style.borderColor = 'rgba(0,0,0,0.1)';     e.target.style.boxShadow = 'none' }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {/* Seta */}
      <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'rgba(0,0,0,0.35)', fontSize: 12 }}>
        ▾
      </div>
    </div>
  )
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
      borderRadius: 16, border: '1px solid rgba(0,0,0,0.07)',
      boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
      overflow: 'hidden',
    }}>
      {children}
    </div>
  )
}

function ToggleRow({
  label, description, checked, onChange, last = false,
}: {
  label: string; description?: string; checked: boolean; onChange: (v: boolean) => void; last?: boolean
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      gap: 16, padding: '18px 20px',
      borderBottom: last ? 'none' : '1px solid rgba(0,0,0,0.06)',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{label}</div>
        {description && (
          <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginTop: 4, lineHeight: 1.5, maxWidth: 360 }}>
            {description}
          </div>
        )}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  )
}

function SelectRow({
  label, value, onChange, options, last = false,
}: {
  label: string; value: number; onChange: (v: number) => void
  options: { label: string; value: number }[]; last?: boolean
}) {
  return (
    <div style={{
      padding: '14px 20px',
      borderBottom: last ? 'none' : '1px solid rgba(0,0,0,0.06)',
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(0,0,0,0.4)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>
        {label}
      </div>
      <Select value={value} onChange={onChange} options={options} />
    </div>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      padding: '12px 20px', borderRadius: 12, zIndex: 9999,
      background: type === 'success' ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'linear-gradient(135deg,#dc2626,#b91c1c)',
      color: '#fff', fontSize: 14, fontWeight: 600,
      boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
      fontFamily: '-apple-system,"SF Pro Display",system-ui,sans-serif',
      whiteSpace: 'nowrap',
      animation: 'toastIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
    }}>
      {message}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ConfiguracoesPage() {
  const [settings, setSettings] = useState<BookingSettings>({
    autoConfirm:            true,
    avoidGapsBetweenVisits: true,
    minBookingNotice:       15,
    maxFutureBookingDays:   7,
    rescheduleNotice:       60,
  })
  const [original,  setOriginal]  = useState<BookingSettings | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [toast,     setToast]     = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const isDirty = original && JSON.stringify(settings) !== JSON.stringify(original)

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2800)
  }

  // Carrega configurações
  useEffect(() => {
    api.get('/booking-settings')
      .then(res => {
        const data = res.data?.data ?? res.data
        setSettings(data)
        setOriginal(data)
      })
      .catch(() => showToast('Erro ao carregar configurações', 'error'))
      .finally(() => setLoading(false))
  }, [])

  // Salva
  async function handleSave() {
    try {
      setSaving(true)
      const res = await api.put('/booking-settings', settings)
      const data = res.data?.data ?? res.data
      setSettings(data)
      setOriginal(data)
      showToast('Configurações salvas com sucesso!', 'success')
    } catch {
      showToast('Erro ao salvar configurações', 'error')
    } finally {
      setSaving(false)
    }
  }

  function update<K extends keyof BookingSettings>(key: K, value: BookingSettings[K]) {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(220,38,38,0.15)', borderTopColor: '#dc2626', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  return (
    <>
      <style>{`
        @keyframes toastIn { from { opacity:0; transform:translateX(-50%) translateY(12px) } to { opacity:1; transform:translateX(-50%) translateY(0) } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} />}

      <div style={{ maxWidth: 720, animation: 'fadeUp 0.3s ease', fontFamily: '-apple-system,"SF Pro Display",system-ui,sans-serif' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em', color: '#0f0f14' }}>
              Configurações
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: 'rgba(0,0,0,0.45)' }}>
              Ajuste as regras de agendamento do seu negócio.
            </p>
          </div>

          {/* Botão Salvar */}
          <button
            onClick={handleSave}
            disabled={!isDirty || saving}
            style={{
              padding: '10px 24px', borderRadius: 12, border: 'none',
              background: isDirty && !saving
                ? 'linear-gradient(135deg,#dc2626,#b91c1c)'
                : 'rgba(0,0,0,0.08)',
              color: isDirty && !saving ? '#fff' : 'rgba(0,0,0,0.3)',
              fontSize: 14, fontWeight: 600, cursor: isDirty && !saving ? 'pointer' : 'not-allowed',
              boxShadow: isDirty && !saving ? '0 4px 14px rgba(220,38,38,0.28)' : 'none',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Seção 1: Confirmação e gaps */}
          <SectionCard>
            <div style={{ padding: '14px 20px 10px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Comportamento geral
              </span>
            </div>

            <ToggleRow
              label="Confirmação automática de reservas"
              description="Recomendamos ativar as confirmações automáticas. Com isso você economiza tempo e facilita para seus clientes fazerem reservas online."
              checked={settings.autoConfirm}
              onChange={v => update('autoConfirm', v)}
            />

            <ToggleRow
              label="Evitar pausas entre visitas"
              description="Ao otimizar as datas disponíveis, você evitará lacunas no calendário e aproveitará melhor seu tempo."
              checked={settings.avoidGapsBetweenVisits}
              onChange={v => update('avoidGapsBetweenVisits', v)}
              last
            />
          </SectionCard>

          {/* Seção 2: Configurações de tempo */}
          <SectionCard>
            <div style={{ padding: '14px 20px 10px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Configurações de agendamento
              </span>
            </div>

            <SelectRow
              label="Limite de tempo para reserva"
              value={settings.minBookingNotice}
              onChange={v => update('minBookingNotice', v)}
              options={NOTICE_OPTIONS}
            />

            <SelectRow
              label="Reservas no futuro"
              value={settings.maxFutureBookingDays}
              onChange={v => update('maxFutureBookingDays', v)}
              options={FUTURE_OPTIONS}
            />

            <SelectRow
              label="Troca de horário de reserva"
              value={settings.rescheduleNotice}
              onChange={v => update('rescheduleNotice', v)}
              options={RESCHEDULE_OPTIONS}
              last
            />
          </SectionCard>

          {/* Info */}
          <div style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(220,38,38,0.04)', border: '1px solid rgba(220,38,38,0.12)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>💡</span>
            <p style={{ margin: 0, fontSize: 13, color: 'rgba(0,0,0,0.5)', lineHeight: 1.6 }}>
              Essas configurações se aplicam aos agendamentos feitos pelos seus clientes via link público. Os agendamentos feitos diretamente na agenda não são afetados.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}