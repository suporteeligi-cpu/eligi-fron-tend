'use client'
// src/features/agenda/components/shared/ConfirmModal.tsx

import { createPortal } from 'react-dom'
import { useEffect } from 'react'
import { EASE, Z } from '../../constants'

interface Props {
  title:        string
  confirmLabel: string
  onConfirm:    () => void
  onCancel:     () => void
  /** 'centered' (desktop/iPad) | 'sheet' (mobile bottom sheet) */
  variant?:     'centered' | 'sheet'
}

/**
 * Modal de confirmação padrão Eligi.
 * - centered: spring scale-up no centro
 * - sheet: bottom sheet com handle, slide-up
 *
 * Suporta `\n` no title via white-space: pre-line.
 * Fecha com Esc (centered) e backdrop click.
 */
export default function ConfirmModal({ title, confirmLabel, onConfirm, onCancel, variant = 'centered' }: Props) {
  // Esc fecha
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  // SSR safety — portal só existe no cliente
  if (typeof document === 'undefined') return null

  const isSheet = variant === 'sheet'

  const content = (
    <>
      <div
        onClick={onCancel}
        style={{
          position:'fixed', inset:0,
          background:'rgba(0,0,0,0.30)',
          backdropFilter:'blur(8px)',
          WebkitBackdropFilter:'blur(8px)',
          zIndex: Z.overlay,
          animation: `cm-fade 0.18s ease`,
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        style={isSheet ? {
          position:'fixed', bottom:0, left:0, right:0,
          background:'rgba(255,255,255,0.99)',
          borderRadius:'24px 24px 0 0',
          boxShadow:'0 -8px 40px rgba(0,0,0,0.15)',
          zIndex: Z.modal,
          padding:`28px 24px max(36px, env(safe-area-inset-bottom))`,
          textAlign:'center',
          fontFamily:'-apple-system,"SF Pro Display",system-ui,sans-serif',
          animation:`cm-up 0.28s ${EASE.sheet}`,
        } : {
          position:'fixed', top:'50%', left:'50%',
          transform:'translate(-50%,-50%)',
          width:340, maxWidth:'88vw',
          background:'rgba(255,255,255,0.99)',
          borderRadius:22,
          boxShadow:'0 32px 72px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.06)',
          zIndex: Z.modal,
          padding:'32px 24px 22px',
          fontFamily:'-apple-system,"SF Pro Display",system-ui,sans-serif',
          textAlign:'center',
          animation:`cm-in 0.22s ${EASE.spring}`,
        }}
      >
        <style>{`
          @keyframes cm-fade { from { opacity:0 } to { opacity:1 } }
          @keyframes cm-in   { from { opacity:0; transform: translate(-50%,-50%) scale(0.92) } to { opacity:1; transform: translate(-50%,-50%) scale(1) } }
          @keyframes cm-up   { from { transform: translateY(100%) } to { transform: translateY(0) } }
        `}</style>

        {isSheet && (
          <div aria-hidden style={{ width:40, height:4, borderRadius:2, background:'rgba(0,0,0,0.12)', margin:'0 auto 22px' }} />
        )}

        {/* Logo eligi */}
        <div
          aria-hidden
          style={{
            width:44, height:44, borderRadius:13,
            background:'linear-gradient(145deg,#ef4444,#dc2626,#b91c1c)',
            display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 18px',
            boxShadow:'0 6px 18px rgba(220,38,38,0.30)',
          }}
        >
          <span style={{ color:'#fff', fontWeight:800, fontSize:20, letterSpacing:'-0.04em' }}>e</span>
        </div>

        <h3 style={{
          margin:'0 0 24px', fontSize:18, fontWeight:700,
          color:'#0f0f14', lineHeight:1.35, letterSpacing:'-0.02em',
          whiteSpace:'pre-line',
        }}>
          {title}
        </h3>

        <button
          type="button"
          onClick={onConfirm}
          style={{
            width:'100%', padding:'14px', marginBottom:10,
            background:'linear-gradient(135deg,#dc2626,#b91c1c)',
            color:'#fff', border:'none', borderRadius:13,
            fontWeight:700, fontSize:14, cursor:'pointer',
            letterSpacing:'0.04em', textTransform:'uppercase',
            boxShadow:'0 4px 16px rgba(220,38,38,0.28)',
            transition:`transform 0.12s ${EASE.smooth}`,
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
        >
          {confirmLabel}
        </button>

        <button
          type="button"
          onClick={onCancel}
          style={{
            width:'100%', padding:'13px',
            background:'transparent',
            border:'1px solid rgba(0,0,0,0.08)',
            borderRadius:13, fontSize:14, cursor:'pointer',
            color:'rgba(0,0,0,0.45)', fontWeight:500,
            transition:`background 0.12s ${EASE.smooth}`,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
        >
          Voltar
        </button>
      </div>
    </>
  )

  return createPortal(content, document.body)
}
