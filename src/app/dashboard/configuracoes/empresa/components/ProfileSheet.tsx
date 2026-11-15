'use client'
// src/app/dashboard/configuracoes/empresa/components/ProfileSheet.tsx
// @eligi:perfil-sheet — folha de edicao de Perfil e endereco.
// Celular: entre a navbar (104 px) e a barra de baixo (64 px + area segura).
// Computador: centrada na area da pagina (descontando o menu lateral).
// Esc fecha, foco entra na folha e volta para quem abriu, a pagina nao rola atras.

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface Props {
  title: string
  subtitle?: string
  /** Largura no computador. */
  width?: number
  onClose: () => void
  footer?: React.ReactNode
  children: React.ReactNode
}

export default function ProfileSheet({ title, subtitle, width = 520, onClose, footer, children }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  useEffect(() => { closeRef.current = onClose })

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    ref.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeRef.current() }
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      prev?.focus()
    }
  }, [])

  return createPortal(
    <>
      <div className="pf-drop" onClick={onClose} aria-hidden />
      <div
        className="pf-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pf-sheet-t"
        ref={ref}
        tabIndex={-1}
        style={{ '--pf-w': `${width}px` } as React.CSSProperties}
      >
        <div className="pf-grab" aria-hidden />
        <div className="pf-sh-top">
          <div style={{ minWidth: 0 }}>
            <h2 id="pf-sheet-t" className="pf-sh-t">{title}</h2>
            {subtitle && <p className="pf-sh-s">{subtitle}</p>}
          </div>
          <button type="button" className="pf-x" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
        </div>
        <div className="pf-sh-body">{children}</div>
        {footer && <div className="pf-sh-foot">{footer}</div>}
      </div>
    </>,
    document.body,
  )
}
