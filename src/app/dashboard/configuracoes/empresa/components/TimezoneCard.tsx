'use client'
// src/app/dashboard/configuracoes/empresa/components/TimezoneCard.tsx

import { useState, useEffect, useRef } from 'react'
import {
  Clock, Check, ChevronDown, Loader2, Sparkles, Globe,
} from 'lucide-react'
import api from '@/shared/lib/apiClient'
import {
  COMMON_TIMEZONES, detectBrowserTimezone, labelForTimezone, formatNowInTz,
} from '@/shared/lib/timezones'

interface Props {
  initialTimezone: string
  onSaved?: (tz: string) => void
}

export default function TimezoneCard({ initialTimezone, onSaved }: Props) {
  const [currentTz, setCurrentTz] = useState(initialTimezone)
  const [selectedTz, setSelectedTz] = useState(initialTimezone)
  const [browserTz]   = useState<string | null>(() => detectBrowserTimezone())
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  // Live clock no fuso selecionado
  const [nowText, setNowText] = useState(() => formatNowInTz(selectedTz))
  useEffect(() => {
    setNowText(formatNowInTz(selectedTz))
    const id = setInterval(() => setNowText(formatNowInTz(selectedTz)), 30_000)
    return () => clearInterval(id)
  }, [selectedTz])

  const dropdownRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!dropdownOpen) return
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen])

  const hasChanged = selectedTz !== currentTz
  const browserDifferent = browserTz && browserTz !== currentTz

  async function save() {
    if (!hasChanged) return
    setSaving(true)
    setError(null)
    try {
      await api.patch('/business-settings/timezone', { timezone: selectedTz })
      setCurrentTz(selectedTz)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2500)
      onSaved?.(selectedTz)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  function applyBrowserTz() {
    if (browserTz) setSelectedTz(browserTz)
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(20px)',
      borderRadius: 14,
      border: '1px solid rgba(0,0,0,0.07)',
      boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
      padding: 24,
      fontFamily: '-apple-system,"SF Pro Display",system-ui,sans-serif',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 11,
          background: 'linear-gradient(135deg, rgba(220,38,38,0.10), rgba(185,28,28,0.06))',
          border: '1px solid rgba(220,38,38,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Clock size={17} color="#dc2626" strokeWidth={2} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', letterSpacing: '-0.01em' }}>
            Fuso horário
          </div>
          <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
            Usado pra calcular receita do dia, agendamentos e relatórios
          </div>
        </div>
      </div>

      {/* Auto-detect alert */}
      {browserDifferent && (
        <button
          onClick={applyBrowserTz}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '11px 13px',
            background: 'rgba(217, 119, 6, 0.06)',
            border: '1px solid rgba(217, 119, 6, 0.2)',
            borderRadius: 10,
            cursor: 'pointer',
            textAlign: 'left',
            fontFamily: 'inherit',
            marginBottom: 14,
            transition: 'all 0.15s ease',
            WebkitTapHighlightColor: 'transparent',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(217, 119, 6, 0.10)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(217, 119, 6, 0.06)' }}
        >
          <Sparkles size={14} color="#b45309" strokeWidth={2.2} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e' }}>
              Detectamos que você está em <strong>{labelForTimezone(browserTz!)}</strong>
            </div>
            <div style={{ fontSize: 11, color: '#92400e', opacity: 0.8 }}>
              Toque pra aplicar
            </div>
          </div>
        </button>
      )}

      {/* Live clock no fuso selecionado */}
      <div style={{
        padding: '14px 16px',
        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
        borderRadius: 11,
        marginBottom: 14,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <Globe size={16} color="rgba(255,255,255,0.65)" strokeWidth={2} />
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 10, fontWeight: 700,
            color: 'rgba(255,255,255,0.65)',
            textTransform: 'uppercase',
            letterSpacing: '.08em',
          }}>
            HORA NO FUSO SELECIONADO
          </div>
          <div style={{
            color: '#fff',
            fontSize: 18,
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.01em',
            marginTop: 2,
          }}>
            {nowText}
          </div>
        </div>
      </div>

      {/* Select de timezone */}
      <div ref={dropdownRef} style={{ position: 'relative', marginBottom: 12 }}>
        <button
          onClick={() => setDropdownOpen(o => !o)}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 14px',
            background: '#fff',
            border: '1px solid rgba(0,0,0,0.10)',
            borderRadius: 10,
            cursor: 'pointer',
            textAlign: 'left',
            fontFamily: 'inherit',
            fontSize: 14,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, color: 'rgba(0,0,0,0.45)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>
              FUSO SELECIONADO
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginTop: 2 }}>
              {labelForTimezone(selectedTz)}
            </div>
          </div>
          <ChevronDown size={14} color="rgba(0,0,0,0.45)" strokeWidth={2} />
        </button>

        {dropdownOpen && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0, right: 0,
            background: '#fff',
            border: '1px solid rgba(0,0,0,0.10)',
            borderRadius: 11,
            boxShadow: '0 12px 28px rgba(0,0,0,0.10)',
            maxHeight: 320,
            overflowY: 'auto',
            zIndex: 100,
            padding: 4,
          }}>
            {/* Brasil */}
            <SectionTitle>Brasil</SectionTitle>
            {COMMON_TIMEZONES.filter(t => t.country === 'BR').map(t => (
              <OptionRow
                key={t.value}
                label={t.label}
                selected={selectedTz === t.value}
                onClick={() => { setSelectedTz(t.value); setDropdownOpen(false) }}
              />
            ))}

            {/* Internacional */}
            <SectionTitle>Internacional</SectionTitle>
            {COMMON_TIMEZONES.filter(t => t.country !== 'BR').map(t => (
              <OptionRow
                key={t.value}
                label={t.label}
                selected={selectedTz === t.value}
                onClick={() => { setSelectedTz(t.value); setDropdownOpen(false) }}
              />
            ))}
          </div>
        )}
      </div>

      {error && (
        <div style={{
          padding: '10px 12px',
          background: 'rgba(220,38,38,0.06)',
          border: '1px solid rgba(220,38,38,0.18)',
          borderRadius: 8,
          fontSize: 12,
          color: '#dc2626',
          marginBottom: 12,
        }}>
          {error}
        </div>
      )}

      {/* Footer: salvar ou ok */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)', flex: 1 }}>
          {hasChanged
            ? 'Alterações não salvas'
            : success
              ? <span style={{ color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Check size={11} strokeWidth={2.4} />
                  Salvo
                </span>
              : <span>Fuso atual: <strong style={{ color: '#111827' }}>{labelForTimezone(currentTz)}</strong></span>
          }
        </div>
        <button
          onClick={save}
          disabled={!hasChanged || saving}
          style={{
            padding: '9px 18px',
            borderRadius: 8,
            border: 'none',
            background: hasChanged && !saving
              ? 'linear-gradient(135deg, #dc2626, #b91c1c)'
              : 'rgba(0,0,0,0.06)',
            color: hasChanged && !saving ? '#fff' : 'rgba(0,0,0,0.35)',
            fontSize: 13,
            fontWeight: 700,
            cursor: hasChanged && !saving ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: 6,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {saving && <Loader2 size={12} style={{ animation: 'pos-spin 0.8s linear infinite' }} />}
          {saving ? 'Salvando…' : 'Salvar'}
        </button>
      </div>

      <style>{`@keyframes pos-spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700,
      color: 'rgba(0,0,0,0.40)',
      textTransform: 'uppercase',
      letterSpacing: '.07em',
      padding: '8px 10px 4px',
    }}>
      {children}
    </div>
  )
}

function OptionRow({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '9px 10px',
        background: selected ? 'rgba(220, 38, 38, 0.06)' : 'transparent',
        border: 'none',
        borderRadius: 7,
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'inherit',
        fontSize: 13,
        fontWeight: selected ? 700 : 500,
        color: selected ? '#dc2626' : '#111827',
        WebkitTapHighlightColor: 'transparent',
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'rgba(0,0,0,0.04)' }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent' }}
    >
      {selected && <Check size={12} color="#dc2626" strokeWidth={2.4} />}
      <span style={{ flex: 1 }}>{label}</span>
    </button>
  )
}
