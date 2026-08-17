// src/features/reports/components/TabSelector.tsx  [rpt-mobile-leva1]
// Seletor colapsável de abas — só mobile. Colapsado: aba atual (ícone 40px,
// rótulo 17px) + ‹ › vizinhas + caret. Aberto: grade 4 colunas, fecha ao
// escolher. Desktop continua com a barra de abas do ReportsModule.
'use client'

import { useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { TABS, ONLINE } from '../constants'
import type { ReportTab, TabDef } from '../types'

interface Props {
  value: ReportTab
  onChange: (tab: ReportTab) => void
}

const INK = '#0c0c12'
const isOnline = (t: TabDef) => t.id === 'marketing'

export default function TabSelector({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const idx = Math.max(0, TABS.findIndex((t) => t.id === value))
  const cur = TABS[idx]
  const Icon = cur.icon
  const accent = isOnline(cur) ? ONLINE : INK

  function step(delta: number) {
    const next = TABS[(idx + delta + TABS.length) % TABS.length]
    onChange(next.id)
  }
  function pick(id: ReportTab) {
    onChange(id)
    setOpen(false)
  }

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.82)',
        WebkitBackdropFilter: 'blur(18px)', backdropFilter: 'blur(18px)',
        border: '1px solid rgba(255,255,255,0.8)', borderRadius: 20,
        boxShadow: open ? '0 18px 44px rgba(0,0,0,0.14)' : '0 10px 28px rgba(0,0,0,0.08)',
        overflow: 'hidden', transition: 'box-shadow .2s',
      }}
    >
      {/* barra colapsada */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 8px 8px 10px' }}>
        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? 'Fechar categorias' : 'Escolher categoria do relatório'}
          onClick={() => setOpen((o) => !o)}
          style={{
            flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10,
            background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left',
          }}
        >
          <span
            style={{
              width: 40, height: 40, borderRadius: 13, flex: 'none',
              background: accent, color: '#fff', display: 'grid', placeItems: 'center',
            }}
          >
            <Icon size={20} />
          </span>
          <span style={{ minWidth: 0 }}>
            <span
              style={{
                display: 'block', fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em',
                lineHeight: 1.1, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}
            >
              {cur.label}
            </span>
            <span style={{ display: 'block', fontSize: 12, color: 'rgba(0,0,0,0.5)', fontWeight: 500 }}>
              {cur.hint}
            </span>
          </span>
        </button>

        <button type="button" aria-label="Categoria anterior" onClick={() => step(-1)} style={miniBtn}>
          <ChevronLeft size={18} />
        </button>
        <button type="button" aria-label="Próxima categoria" onClick={() => step(1)} style={miniBtn}>
          <ChevronRight size={18} />
        </button>
        <button
          type="button"
          aria-label={open ? 'Fechar' : 'Abrir'}
          onClick={() => setOpen((o) => !o)}
          style={{ ...miniBtn, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .25s' }}
        >
          <ChevronDown size={18} />
        </button>
      </div>

      {/* grade aberta */}
      {open && (
        <div
          role="tablist"
          style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))',
            gap: 6, padding: '0 8px 8px',
          }}
        >
          {TABS.map((t) => {
            const on = t.id === value
            const online = isOnline(t)
            const TIcon = t.icon
            const fg = on ? '#fff' : online ? ONLINE : 'rgba(12,12,18,0.72)'
            const bg = on ? (online ? ONLINE : INK) : 'rgba(12,12,18,0.035)'
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => pick(t.id)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  padding: '10px 4px 9px', borderRadius: 14, border: 'none', cursor: 'pointer',
                  background: bg, color: fg, fontSize: 12.5, fontWeight: 700,
                  letterSpacing: '-0.01em', lineHeight: 1.05, textAlign: 'center',
                }}
              >
                <span
                  style={{
                    width: 38, height: 38, borderRadius: 12, display: 'grid', placeItems: 'center',
                    background: on ? 'rgba(255,255,255,0.16)' : online ? 'rgba(124,58,237,0.10)' : '#fff',
                    boxShadow: on ? 'none' : '0 2px 6px rgba(0,0,0,0.05)',
                  }}
                >
                  <TIcon size={17} />
                </span>
                {t.shortLabel}
                <span style={{ fontSize: 10, fontWeight: 500, color: on ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.45)' }}>
                  {t.hint}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

const miniBtn: React.CSSProperties = {
  width: 36, height: 36, borderRadius: 12, flex: 'none', border: 'none', cursor: 'pointer',
  display: 'grid', placeItems: 'center', color: INK, background: 'rgba(12,12,18,0.05)',
}
