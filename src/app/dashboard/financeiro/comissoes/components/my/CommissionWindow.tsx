// src/app/dashboard/financeiro/comissoes/components/my/CommissionWindow.tsx
// @eligi:mc-d-window — janela de modulo com abas (direcao D).
//
// Nao usa o Sheet compartilhado: ele cobre a navbar no celular. Aqui a janela
// respeita a regra do dashboard: no celular vai de 104px ate a barra inferior;
// no computador fica centralizada na area de conteudo. Portal no <body> (um
// ancestral com transform prenderia o position:fixed). Esc fecha e o foco
// volta para o cartao que abriu.
'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { MC_CSS } from './mcStyles'
import { ModIcon } from './mcParts'
import { MODS, type ModKey } from './mcTypes'

const noop = () => () => {}

interface Props {
  mod:       ModKey
  subtitle:  string
  onChange:  (k: ModKey) => void
  onClose:   () => void
  children:  React.ReactNode
}

export default function CommissionWindow({ mod, subtitle, onChange, onClose, children }: Props) {
  const mounted = useSyncExternalStore(noop, () => true, () => false)
  const closeRef = useRef<HTMLButtonElement>(null)
  const tabsRef = useRef<HTMLDivElement>(null)
  const title = MODS.find(m => m.key === mod)?.label ?? ''

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => { document.body.style.overflow = prev }
  }, [])

  function onTabKey(e: React.KeyboardEvent) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    const i = MODS.findIndex(m => m.key === mod)
    const next = MODS[(i + (e.key === 'ArrowRight' ? 1 : MODS.length - 1)) % MODS.length]
    onChange(next.key)
    const btn = tabsRef.current?.querySelector<HTMLButtonElement>(`[data-mod="${next.key}"]`)
    btn?.focus()
  }

  if (!mounted) return null
  return createPortal(
    <div className="mcw">
      <style>{MC_CSS}</style>
      <div className="mcw-scrim" onClick={onClose} aria-hidden />
      <div className="mcw-sheet" role="dialog" aria-modal="true" aria-labelledby="mcw-title">
        <div className="mcw-h">
          <span className="mc-ti" style={{ width: 36, height: 36, margin: 0 }}><ModIcon k={mod} size={18} /></span>
          <div className="mc-min0" style={{ flex: 1 }}>
            <h2 id="mcw-title" className="mcw-t">{title}</h2>
            <div className="mc-fnt mc-ell" style={{ fontSize: 12 }}>{subtitle}</div>
          </div>
          <button ref={closeRef} className="mcw-ib" aria-label="Fechar" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="mcw-tabs" role="tablist" aria-label="Módulos" ref={tabsRef} onKeyDown={onTabKey}>
          {MODS.map(m => (
            <button key={m.key} data-mod={m.key} role="tab" aria-selected={m.key === mod} tabIndex={m.key === mod ? 0 : -1}
              onClick={() => onChange(m.key)}>
              <ModIcon k={m.key} size={18} />
              <span>{m.label}</span>
            </button>
          ))}
        </div>
        <div className="mcw-body" role="tabpanel" aria-label={title} key={mod}>{children}</div>
      </div>
    </div>,
    document.body,
  )
}
