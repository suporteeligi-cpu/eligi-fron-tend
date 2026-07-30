'use client'
// src/app/dashboard/configuracoes/aparencia/page.tsx
// Preferência VISUAL por dispositivo (localStorage 'eligi-card-style') — sem backend.
// Acessível a TODOS os cargos (routeAccess libera só esta subtree; o hub de
// Configurações segue exclusivo do BUSINESS_OWNER, por isso o link de volta
// só aparece pro owner).

import Link from 'next/link'
import { useState } from 'react'
import { Check, ChevronLeft } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { setCardStyle, useCardStyle } from '@/hooks/useCardStyle'
import {
  AgendaCardStyle, inkFor, inkForPastel, pastelOf, stripOf,
} from '@/features/agenda/utils/contrast'
import { colorToGradient } from '@/features/agenda/constants/serviceColors'

const SAMPLE = [
  { time: '11:15–12:15', name: 'Juliana Lima',   svc: 'Alongamento em gel', color: '#8b5cf6' },
  { time: '12:30–13:15', name: 'Lucas Oliveira', svc: 'Pedicure',           color: '#06b6d4' },
  { time: '13:15–14:45', name: 'Mariana R.',     svc: 'Fibra de vidro',     color: '#22c55e' },
]

function MiniCard({ time, name, svc, color, clean }: {
  time: string; name: string; svc: string; color: string; clean: boolean
}) {
  const ink   = clean ? inkForPastel() : inkFor(color)
  const strip = clean ? stripOf(color) : null
  return (
    <div style={{
      borderRadius: 8,
      padding: '5px 9px 6px',
      background: clean ? pastelOf(color) : colorToGradient(color),
      border: clean ? '1px solid rgba(0,0,0,0.05)' : '1px solid rgba(255,255,255,0.15)',
      borderLeft: strip ? `4px solid ${strip}` : undefined,
      boxShadow: clean ? '0 1px 2px rgba(0,0,0,0.05)' : '0 2px 6px rgba(0,0,0,0.10)',
      display: 'flex', flexDirection: 'column', gap: 1, overflow: 'hidden',
    }}>
      <span style={{ fontSize: 9.5, fontWeight: 600, color: strip ?? ink.secondary, fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>
        {time}
      </span>
      <span style={{ fontSize: 12, fontWeight: 700, color: ink.primary, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {name}
      </span>
      <span style={{ fontSize: 10.5, fontWeight: 500, color: ink.secondary, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {svc}
      </span>
    </div>
  )
}

const OPTIONS: Array<{ value: AgendaCardStyle; label: string; description: string }> = [
  { value: 'classic', label: 'Clássico', description: 'Cores cheias — identificação do serviço à distância.' },
  { value: 'clean',   label: 'Clean',    description: 'Tons suaves com faixa colorida — agenda menos saturada.' },
]

export default function AparenciaConfigPage() {
  const { user }  = useAuth()
  const current   = useCardStyle()
  const [saved, setSaved] = useState(false)

  const choose = (style: AgendaCardStyle) => {
    if (style === current) return
    setCardStyle(style)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1600)
  }

  return (
    <>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }`}</style>
      <div style={{ maxWidth: 720, animation: 'fadeUp 0.3s ease', fontFamily: '-apple-system,"SF Pro Display",system-ui,sans-serif' }}>

        {user?.role === 'BUSINESS_OWNER' && (
          <Link href="/dashboard/configuracoes" style={{
            display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none',
            fontSize: 13, fontWeight: 600, color: 'rgba(0,0,0,0.45)', marginBottom: 18,
          }}>
            <ChevronLeft size={16} strokeWidth={2.2} /> Configurações
          </Link>
        )}

        <div style={{ marginBottom: 26 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em', color: '#0f0f14' }}>Aparência</h2>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'rgba(0,0,0,0.45)' }}>
            Escolha o estilo dos cards da agenda. A preferência vale para este dispositivo.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          {OPTIONS.map(opt => {
            const active = current === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => choose(opt.value)}
                aria-pressed={active}
                style={{
                  textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                  background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
                  borderRadius: 14, padding: '16px 16px 14px',
                  border: active ? '1.5px solid #dc2626' : '1px solid rgba(0,0,0,0.07)',
                  boxShadow: active ? '0 8px 24px rgba(220,38,38,0.10)' : '0 1px 6px rgba(0,0,0,0.04)',
                  transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
                  position: 'relative',
                }}
              >
                <div aria-hidden style={{
                  position: 'absolute', top: 14, right: 14,
                  width: 18, height: 18, borderRadius: '50%',
                  border: active ? '5.5px solid #dc2626' : '2px solid rgba(0,0,0,0.20)',
                  background: '#fff', boxSizing: 'border-box',
                  transition: 'border 0.15s ease',
                }} />

                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 2 }}>
                  {opt.label}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', lineHeight: 1.45, marginBottom: 12, paddingRight: 26 }}>
                  {opt.description}
                </div>

                <div style={{
                  display: 'flex', flexDirection: 'column', gap: 6,
                  background: 'rgba(0,0,0,0.03)', borderRadius: 10, padding: 10,
                }}>
                  {SAMPLE.map(s => (
                    <MiniCard key={s.name} {...s} clean={opt.value === 'clean'} />
                  ))}
                </div>
              </button>
            )
          })}
        </div>

        <div style={{ height: 18, marginTop: 12, display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#1D9E75', fontWeight: 600, opacity: saved ? 1 : 0, transition: 'opacity 0.2s ease' }}>
          <Check size={14} strokeWidth={2.4} /> Salvo neste dispositivo
        </div>
      </div>
    </>
  )
}
