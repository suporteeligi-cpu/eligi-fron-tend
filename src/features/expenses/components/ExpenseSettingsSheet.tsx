// src/features/expenses/components/ExpenseSettingsSheet.tsx
'use client'

import { X, Users, Package, Info, CreditCard } from 'lucide-react'
import { typography } from '@/shared/theme'
import { useExpenseSettings } from '../hooks/useExpenseSettings'

interface Props {
  onClose: () => void
  onSaved?: () => void
}

interface ToggleRowProps {
  icon:     React.ReactNode
  accent:   string
  name:     string
  desc:     string
  value:    boolean
  onChange: (v: boolean) => void
}

function ToggleRow({ icon, accent, name, desc, value, onChange }: ToggleRowProps) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        border:       value ? '1.5px solid var(--border, #cbd5e1)' : '1px solid var(--border, #e5e7eb)',
        background:   value ? 'var(--card-bg-secondary, #f8fafc)' : 'transparent',
        borderRadius: 12,
        padding:      14,
        cursor:       'pointer',
        transition:   'background 0.15s, border-color 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 8,
          background: accent, display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: typography.weight.medium, color: typography.color.primary }}>
            {name}
          </div>
          <div style={{ fontSize: 12, color: typography.color.muted, marginTop: 3, lineHeight: 1.5 }}>
            {desc}
          </div>
        </div>
        <div style={{
          width: 40, height: 23, borderRadius: 12, flexShrink: 0,
          position: 'relative', background: value ? '#dc2626' : 'var(--border, #cbd5e1)',
          transition: 'background 0.2s',
        }}>
          <div style={{
            position: 'absolute', top: 3, left: value ? 20 : 3,
            width: 17, height: 17, borderRadius: '50%', background: '#fff',
            transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }} />
        </div>
      </div>
    </div>
  )
}

// Renderizado SÓ quando aberto (o pai faz {open && <ExpenseSettingsSheet/>}),
// então o fetch na montagem do hook roda a cada abertura.
const METHOD_META: { method: string; label: string; color: string; hint?: string }[] = [
  { method: 'CREDIT',   label: 'Crédito',        color: '#185FA5' },
  { method: 'DEBIT',    label: 'Débito',         color: '#7F77DD' },
  { method: 'PIX',      label: 'Pix',            color: '#00B8A9', hint: 'via maquininha' },
  { method: 'TRANSFER', label: 'Transferência',  color: '#EF9F27' },
  { method: 'CASH',     label: 'Dinheiro',       color: '#888780' },
  { method: 'OTHER',    label: 'Outros',         color: '#888780' },
]

function CardFeeGrid({
  cardFees, setCardFee,
}: {
  cardFees: { method: string; percent: string }[]
  setCardFee: (method: string, percent: string) => void
}) {
  return (
    <div style={{ marginTop: 10, paddingTop: 4, borderTop: '1px solid var(--border, #f1f5f9)' }}>
      {METHOD_META.map((m, i) => {
        const draft = cardFees.find((c) => c.method === m.method)
        const percent = draft?.percent ?? '0'
        return (
          <div
            key={m.method}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '9px 4px',
              borderTop: i === 0 ? 'none' : '1px solid var(--border, #f1f5f9)',
            }}
          >
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, color: typography.color.primary }}>
              {m.label}
              {m.hint && (
                <span style={{ fontSize: 11, color: typography.color.muted, marginLeft: 6 }}>{m.hint}</span>
              )}
            </div>
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'var(--card-bg-secondary, #f8fafc)',
                border: '1px solid var(--border, #e5e7eb)',
                borderRadius: 10, padding: '0 10px', height: 40, width: 96, flexShrink: 0,
              }}
            >
              <input
                inputMode="decimal"
                value={percent}
                onChange={(e) => setCardFee(m.method, e.target.value.replace(/[^\d,.]/g, ''))}
                placeholder="0"
                style={{
                  flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent',
                  textAlign: 'right', fontSize: 16, fontWeight: 600, color: typography.color.primary,
                }}
              />
              <span style={{ fontSize: 14, color: typography.color.muted, fontWeight: 500 }}>%</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function ExpenseSettingsSheet({ onClose, onSaved }: Props) {
  const {
    autoCommission, setAutoCommission,
    autoStock,      setAutoStock,
    autoCardFee,    setAutoCardFee,
    cardFees,       setCardFee,
    loading, saving, save,
  } = useExpenseSettings()

  async function handleSave() {
    const ok = await save({ autoCommission, autoStock, autoCardFee, cardFees })
    if (ok) {
      onSaved?.()
      onClose()
    }
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 9997, animation: 'fadeIn 0.18s ease' }}
      />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'min(400px, 100vw)', background: 'var(--card-bg, #fff)',
        zIndex: 9998, display: 'flex', flexDirection: 'column',
        animation: 'slideInRight 0.22s cubic-bezier(0.34,1.56,0.64,1)',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.12)',
      }}>
        <style>{`
          @keyframes fadeIn{from{opacity:0}to{opacity:1}}
          @keyframes slideInRight{from{transform:translateX(100%)}to{transform:translateX(0)}}
        `}</style>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 22px 16px', borderBottom: '1px solid var(--border, #e5e7eb)',
        }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: typography.weight.bold, color: typography.color.primary }}>
              Despesas automáticas
            </div>
            <div style={{ fontSize: 12, color: typography.color.muted, marginTop: 2 }}>
              Gere despesas a partir de outros módulos
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 8, color: typography.color.muted, lineHeight: 0 }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loading ? (
            <div style={{ height: 80, borderRadius: 12, background: 'var(--skeleton, #f1f5f9)' }} />
          ) : (
            <>
              <ToggleRow
                icon={<Users size={17} color="#dc2626" />}
                accent="rgba(220,38,38,0.12)"
                name="Comissões pagas"
                desc="Quando você paga um profissional, o valor vira uma despesa na categoria Comissão."
                value={autoCommission}
                onChange={setAutoCommission}
              />
              <ToggleRow
                icon={<Package size={17} color="#d97706" />}
                accent="rgba(217,119,6,0.12)"
                name="Reposição de estoque"
                desc="Toda entrada de produto com custo informado vira uma despesa na categoria Estoque."
                value={autoStock}
                onChange={setAutoStock}
              />
              <ToggleRow
                icon={<CreditCard size={17} color="#0e7490" />}
                accent="rgba(0,184,169,0.14)"
                name="Taxa de máquina de cartão"
                desc="Calcula o custo da adquirente em cada venda e lança como despesa."
                value={autoCardFee}
                onChange={setAutoCardFee}
              />
              {autoCardFee && <CardFeeGrid cardFees={cardFees} setCardFee={setCardFee} />}

              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 7,
                fontSize: 11, color: typography.color.muted,
                marginTop: 4, padding: '10px 0 0', borderTop: '1px solid var(--border, #f1f5f9)',
              }}>
                <Info size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>Vale só daqui pra frente. Despesas geradas assim não podem ser editadas à mão.</span>
              </div>
            </>
          )}
        </div>

        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border, #e5e7eb)' }}>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            style={{
              width: '100%', padding: '11px 0', borderRadius: 10, border: 'none',
              background: (saving || loading) ? '#94a3b8' : 'linear-gradient(135deg,#dc2626,#b91c1c)',
              cursor: (saving || loading) ? 'not-allowed' : 'pointer',
              fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '0.02em',
            }}
          >
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>
    </>
  )
}
