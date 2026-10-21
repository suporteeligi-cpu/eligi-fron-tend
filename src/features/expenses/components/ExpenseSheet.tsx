// src/features/expenses/components/ExpenseSheet.tsx
// @eligi:expcat-sheet — folha do modulo de despesas.
// Celular: sobe do rodape (alvo do polegar). Computador: cartao no centro.
// Vai por portal no <body>: ancestral com transform (animacao de entrada da
// pagina) prenderia o position:fixed dentro dele (licao do EligiClub).
'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

const INK = '#111114'
const INK3 = '#8a8a93'

interface Props {
  title:    string
  subtitle?: string
  onClose:  () => void
  /** 1 = folha comum; 2 = folha aberta por cima de outra */
  level?:   1 | 2
  footer?:  React.ReactNode
  children: React.ReactNode
  /** rotulo do dialogo para leitor de tela (padrao = title) */
  label?:   string
}

const noop = () => () => {}

export default function ExpenseSheet({ title, subtitle, onClose, level = 1, footer, children, label }: Props) {
  // portal so no cliente (no servidor nao existe document)
  const mounted = useSyncExternalStore(noop, () => true, () => false)

  useEffect(() => {
    // folha de cima escuta na captura e para o evento: Esc fecha so ela
    const capture = level === 2
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      if (capture) e.stopPropagation()
      onClose()
    }
    document.addEventListener('keydown', onKey, capture)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey, capture)
      document.body.style.overflow = prev
    }
  }, [onClose, level])

  if (!mounted) return null
  const z = level === 2 ? 10002 : 10000

  return createPortal(
    <div className="xs-scrim" style={{ zIndex: z }} onClick={onClose}>
      <style>{CSS}</style>
      <div
        className="xs-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={label ?? title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="xs-grab" aria-hidden />
        <div className="xs-head">
          <div style={{ minWidth: 0 }}>
            <div className="xs-title">{title}</div>
            {subtitle && <div className="xs-sub">{subtitle}</div>}
          </div>
          <button type="button" className="xs-x" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        <div className="xs-body">{children}</div>
        {footer && <div className="xs-foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

const CSS = `
.xs-scrim{position:fixed;inset:0;background:rgba(17,17,20,.42);display:flex;align-items:flex-end;justify-content:center;animation:xs-fade .18s ease}
.xs-sheet{background:#fff;width:100%;max-height:calc(100dvh - 56px);display:flex;flex-direction:column;border-radius:22px 22px 0 0;box-shadow:0 -12px 40px rgba(17,17,20,.16);animation:xs-up .26s cubic-bezier(.34,1.3,.64,1);font-family:var(--font-sans)}
.xs-grab{width:38px;height:5px;border-radius:3px;background:#d4d4da;margin:8px auto 0;flex-shrink:0}
.xs-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:12px 18px 10px;flex-shrink:0}
.xs-title{font-family:var(--font-display);font-size:20px;font-weight:700;letter-spacing:-.03em;color:${INK}}
.xs-sub{font-size:13px;color:${INK3};margin-top:3px}
.xs-x{width:40px;height:40px;border-radius:12px;border:0;background:#f0f0f3;color:#4b4b52;display:grid;place-items:center;cursor:pointer;flex-shrink:0}
.xs-x:hover{background:#e7e7ec}
.xs-body{padding:4px 18px 16px;overflow-y:auto;flex:1;min-height:0}
.xs-foot{padding:12px 18px calc(14px + env(safe-area-inset-bottom));border-top:1px solid rgba(17,17,20,.07);flex-shrink:0}
@media (min-width:640px){
  .xs-scrim{align-items:center;padding:24px}
  .xs-sheet{width:480px;max-height:calc(100dvh - 48px);border-radius:20px;box-shadow:0 24px 60px rgba(17,17,20,.22);animation:xs-pop .22s cubic-bezier(.34,1.3,.64,1)}
  .xs-grab{display:none}
  .xs-head{padding:20px 22px 10px}
  .xs-body{padding:4px 22px 18px}
  .xs-foot{padding:14px 22px 18px}
}
@keyframes xs-fade{from{opacity:0}}
@keyframes xs-up{from{transform:translateY(40px);opacity:.5}}
@keyframes xs-pop{from{transform:translateY(8px) scale(.98);opacity:0}}
@media (prefers-reduced-motion:reduce){.xs-scrim,.xs-sheet{animation:none}}
`
