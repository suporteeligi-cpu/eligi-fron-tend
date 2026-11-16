'use client'
// src/app/dashboard/configuracoes/aparencia/page.tsx
// @eligi:cfg-aparencia-v2 — Aparencia, direcao B (ver @eligi:doc-cfg-aparencia).
// Preferencia VISUAL por aparelho (localStorage 'eligi-card-style', via
// useCardStyle) — sem backend. Acessivel a TODOS os cargos (o menu de quem nao
// e dono abre direto aqui); o link de volta so aparece para o dono, que e quem
// tem a tela de Configuracoes.
// Selecionado em grafite (era vermelho), alvo inteiro do cartao, toast no lugar
// do "Salvo" verde.

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ChevronLeft, Smartphone } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { setCardStyle, useCardStyle } from '@/hooks/useCardStyle'
import {
  AgendaCardStyle, inkFor, inkForPastel, pastelOf, stripOf,
} from '@/features/agenda/utils/contrast'
import { colorToGradient } from '@/features/agenda/constants/serviceColors'
import { typography } from '@/shared/theme'

const SAMPLE = [
  { time: '11:15–12:15', name: 'Juliana Lima',   svc: 'Alongamento em gel', color: '#8b5cf6' },
  { time: '12:30–13:15', name: 'Lucas Oliveira', svc: 'Pedicure',           color: '#06b6d4' },
  { time: '13:15–14:45', name: 'Mariana R.',     svc: 'Fibra de vidro',     color: '#22c55e' },
]

const OPTIONS: Array<{ value: AgendaCardStyle; label: string; description: string }> = [
  { value: 'classic', label: 'Clássico', description: 'Cores cheias. Dá para reconhecer o serviço de longe.' },
  { value: 'clean',   label: 'Suave',    description: 'Tons claros com uma faixa colorida. A agenda fica mais calma.' },
]

const INK = '#111114'
const INK_2 = '#4b4b52'
const INK_3 = '#6b6b73'

const CSS = `
.cfp{ max-width:720px; font-family:${typography.fontFamily}; color:${INK}; animation:cfp-in .25s ease; }
@keyframes cfp-in{ from{opacity:0; transform:translateY(6px)} to{opacity:1; transform:none} }
.cfp *{ box-sizing:border-box; }
.cfp :where(span, div, b, i, p, h1, strong){ color:inherit; } /* vence main span */
.cfp a{ text-decoration:none; color:inherit; }
.cfp button{ font-family:inherit; cursor:pointer; -webkit-tap-highlight-color:transparent; }
.cfp a:focus-visible, .cfp button:focus-visible{ outline:2px solid #dc2626; outline-offset:2px; }
.cfp-back{ display:inline-flex; align-items:center; gap:4px; min-height:44px; padding:0 10px 0 4px; margin-left:-4px; border-radius:12px; font-size:14px; font-weight:500; color:${INK_2}; }
.cfp-h1{ margin:4px 0 0; font-size:28px; font-weight:600; font-family:${typography.fontFamilyDisplay}; letter-spacing:-.03em; }
.cfp-lead{ margin:6px 0 0; font-size:14px; line-height:1.45; color:${INK_3}; max-width:560px; }
.cfp-cap{ margin:24px 0 8px; font-family:${typography.fontFamilyMono}; font-size:11px; letter-spacing:.08em; text-transform:uppercase; font-weight:500; color:${INK_3}; }
.cfp-grid{ display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:10px; }
.cfp-opt{ position:relative; text-align:left; background:#fff; border:1px solid #ececf0; border-radius:18px; padding:16px; display:flex; flex-direction:column; gap:12px; }
.cfp-opt[aria-checked="true"]{ border:2px solid ${INK}; padding:15px; }
@media (hover:hover){ .cfp-opt[aria-checked="false"]:hover{ border-color:#cfcfd6; } }
.cfp-top{ display:flex; align-items:flex-start; gap:12px; }
.cfp-dot{ width:22px; height:22px; border-radius:50%; border:2px solid #c9c9d0; flex-shrink:0; margin-top:1px; }
.cfp-opt[aria-checked="true"] .cfp-dot{ border:7px solid ${INK}; }
.cfp-t{ font-size:16px; font-weight:600; }
.cfp-d{ font-size:13px; line-height:1.45; color:${INK_3}; margin-top:2px; }
.cfp-sample{ display:flex; flex-direction:column; gap:6px; background:#f5f5f7; border-radius:12px; padding:10px; }
.cfp-note{ margin-top:16px; display:flex; gap:10px; align-items:flex-start; padding:12px 14px; border-radius:14px; background:#f7f7f9; font-size:13px; line-height:1.5; color:${INK_3}; }
.cfp-toast{ position:fixed; left:50%; transform:translateX(-50%); bottom:calc(64px + env(safe-area-inset-bottom) + 14px); z-index:10000; padding:11px 16px; border-radius:12px; font-size:14px; font-weight:500; font-family:${typography.fontFamily}; box-shadow:0 8px 24px rgba(17,17,20,.18); background:${INK}; color:#fff; max-width:calc(100vw - 32px); }
@media (min-width:1024px){ .cfp-toast{ bottom:24px; left:calc(50% + var(--sidebar-width, 0px) / 2); } }
`

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
      <span style={{ fontSize: 10, fontWeight: 600, color: strip ?? ink.secondary, fontVariantNumeric: 'tabular-nums', lineHeight: 1.25 }}>
        {time}
      </span>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: ink.primary, lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {name}
      </span>
      <span style={{ fontSize: 11, fontWeight: 500, color: ink.secondary, lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {svc}
      </span>
    </div>
  )
}

export default function AparenciaConfigPage() {
  const { user }  = useAuth()
  const current   = useCardStyle()
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 2200)
    return () => window.clearTimeout(t)
  }, [toast])

  const choose = (opt: (typeof OPTIONS)[number]) => {
    if (opt.value === current) return
    setCardStyle(opt.value)
    setToast(`Agenda no estilo ${opt.label}`)
  }

  return (
    <div className="cfp">
      <style>{CSS}</style>
      {user?.role === 'BUSINESS_OWNER' && (
        <Link href="/dashboard/configuracoes" className="cfp-back"><ChevronLeft size={18} aria-hidden /> Configurações</Link>
      )}
      <h1 className="cfp-h1">Aparência</h1>
      <p className="cfp-lead">Como os horários aparecem na sua agenda.</p>

      <div className="cfp-cap">Cartões da agenda</div>
      <div className="cfp-grid" role="radiogroup" aria-label="Cartões da agenda">
        {OPTIONS.map(opt => {
          const active = current === opt.value
          return (
            <button key={opt.value} type="button" role="radio" aria-checked={active} className="cfp-opt" onClick={() => choose(opt)}>
              <span className="cfp-top">
                <span className="cfp-dot" aria-hidden />
                <span>
                  <span className="cfp-t" style={{ display: 'block' }}>{opt.label}</span>
                  <span className="cfp-d" style={{ display: 'block' }}>{opt.description}</span>
                </span>
              </span>
              <span className="cfp-sample" aria-hidden>
                {SAMPLE.map(s => <MiniCard key={s.name} {...s} clean={opt.value === 'clean'} />)}
              </span>
            </button>
          )
        })}
      </div>

      <p className="cfp-note">
        <Smartphone size={16} aria-hidden style={{ flexShrink: 0, marginTop: 2 }} />
        Vale só para este aparelho. Cada pessoa da equipe escolhe a sua, e no celular e no computador pode ser diferente.
      </p>

      {toast && <div className="cfp-toast" role="status" aria-live="polite">{toast}</div>}
    </div>
  )
}
