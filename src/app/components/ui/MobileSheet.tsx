'use client'
// src/components/MobileSheet.tsx
// Desktop: modal centralizado com glass | Mobile: fullscreen bottom sheet

import { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { colors, glass, typography, radius, shadows, transitions } from '@/shared/theme'
import { useIsMobile } from '@/hooks/useIsMobile'

interface Props {
  open:      boolean
  onClose:   () => void
  title:     string
  subtitle?: string
  icon?:     ReactNode
  children:  ReactNode
  footer?:   ReactNode
  maxWidth?: number
  danger?:   boolean
}

export default function MobileSheet({
  open, onClose, title, subtitle, icon, children, footer, maxWidth = 420, danger = false,
}: Props) {
  const isMobile = useIsMobile()

  if (!open || typeof document === 'undefined') return null

  const accentColor = danger ? colors.red.DEFAULT : colors.red.DEFAULT

  const panel = (
    <>
      <style>{`
        @keyframes msheetUp   { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes msheetIn   { from{opacity:0;transform:translate(-50%,-50%) scale(0.94)} to{opacity:1;transform:translate(-50%,-50%) scale(1)} }
        @keyframes msheetFade { from{opacity:0} to{opacity:1} }
        .ms-close:hover { background:${colors.red.subtle} !important; border-color:${colors.red.border} !important; }
        .ms-body::-webkit-scrollbar { display:none }
      `}</style>

      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position:'fixed', inset:0, zIndex:9990,
          background: isMobile ? 'rgba(0,0,0,0.30)' : 'rgba(0,0,0,0.18)',
          backdropFilter:'blur(6px)', WebkitBackdropFilter:'blur(6px)',
          animation:'msheetFade 0.2s ease',
        }}
      />

      {/* Painel */}
      <div style={isMobile ? {
        // ── Mobile: tela cheia que sobe de baixo ──
        position:'fixed', left:0, right:0, bottom:0,
        height:'92dvh',
        background: glass.surface.modal.background,
        backdropFilter: glass.surface.modal.backdropFilter,
        WebkitBackdropFilter: glass.surface.modal.backdropFilter,
        borderRadius:`${radius['2xl']}px ${radius['2xl']}px 0 0`,
        boxShadow:'0 -8px 48px rgba(0,0,0,0.18)',
        zIndex:9991, display:'flex', flexDirection:'column',
        fontFamily:typography.fontFamily,
        animation:'msheetUp 0.3s cubic-bezier(0.34,1.2,0.64,1)',
      } : {
        // ── Desktop: modal centralizado ──
        position:'fixed', top:'50%', left:'50%',
        transform:'translate(-50%,-50%)',
        width:`${maxWidth}px`, maxWidth:'94vw', maxHeight:'88vh',
        background: glass.surface.modal.background,
        backdropFilter: glass.surface.modal.backdropFilter,
        WebkitBackdropFilter: glass.surface.modal.backdropFilter,
        borderRadius:`${radius['2xl']}px`,
        border:`1px solid ${colors.gray.borderMd}`,
        boxShadow: glass.surface.modal.boxShadow,
        zIndex:9991, display:'flex', flexDirection:'column',
        fontFamily:typography.fontFamily,
        animation:'msheetIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
      }}>

        {/* Handle bar — mobile only */}
        {isMobile && (
          <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 4px', flexShrink:0 }}>
            <div style={{ width:40, height:4, borderRadius:2, background:'rgba(0,0,0,0.12)' }} />
          </div>
        )}

        {/* Header */}
        <div style={{ padding:`${isMobile?16:20}px 20px 0`, flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: subtitle ? 4 : 16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              {icon && (
                <div style={{ width:36, height:36, borderRadius:radius.sm, background:danger?'rgba(220,38,38,0.1)':colors.red.subtle, border:`1px solid ${danger?colors.red.border:colors.red.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  {icon}
                </div>
              )}
              <h2 style={{ margin:0, fontSize:isMobile?18:17, fontWeight:typography.weight.bold, color:typography.color.primary, letterSpacing:'-0.3px' }}>
                {title}
              </h2>
            </div>
            <button
              className="ms-close"
              onClick={onClose}
              style={{ width:30, height:30, borderRadius:radius.full, border:`1px solid ${colors.gray.borderMd}`, background:colors.background.surfaceLight, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:transitions.fast, flexShrink:0 }}
            >
              <X size={14} color={colors.gray.dimText} />
            </button>
          </div>
          {subtitle && (
            <p style={{ margin:'0 0 16px', fontSize:typography.scale.sm, color:typography.color.muted }}>{subtitle}</p>
          )}
          <div style={{ height:1, background:colors.gray.border, margin:'0 -20px' }} />
        </div>

        {/* Body */}
        <div
          className="ms-body"
          style={{ flex:1, overflowY:'auto', padding:'16px 20px', scrollbarWidth:'none' }}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{ padding:'12px 20px', borderTop:`1px solid ${colors.gray.border}`, flexShrink:0, background: isMobile ? colors.background.surface : 'transparent', paddingBottom: isMobile ? 'max(12px, env(safe-area-inset-bottom))' : '20px' }}>
            {footer}
          </div>
        )}
      </div>
    </>
  )

  return createPortal(panel, document.body)
}
