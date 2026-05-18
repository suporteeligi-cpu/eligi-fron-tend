'use client'
// src/features/agenda/components/SlotContextMenu.tsx

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Calendar, Ban, X } from 'lucide-react'
import { colors, typography, radius, shadows, transitions, glass } from '@/shared/theme'
import { useIsMobile } from '@/hooks/useIsMobile'

interface Props {
  x:            number
  y:            number
  time:         string
  profId:       string
  onClose:      () => void
  onNewBooking: (time: string, profId: string) => void
  onNewBlock:   (time: string, profId: string) => void
}

export default function SlotContextMenu({ x, y, time, profId, onClose, onNewBooking, onNewBlock }: Props) {
  const menuRef  = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose()
    }
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    const t = setTimeout(() => {
      document.addEventListener('mousedown', handle)
      document.addEventListener('keydown', handleKey)
    }, 0)
    return () => {
      clearTimeout(t)
      document.removeEventListener('mousedown', handle)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  const actions = [
    {
      icon: <Calendar size={isMobile?22:15} color={colors.red.DEFAULT} strokeWidth={2} />,
      label: 'Novo agendamento',
      sub: `às ${time}`,
      onClick: () => { onNewBooking(time, profId); onClose() },
      accent: true,
    },
    {
      icon: <Ban size={isMobile?22:15} color={colors.slate.DEFAULT} strokeWidth={2} />,
      label: 'Bloquear horário',
      sub: `às ${time}`,
      onClick: () => { onNewBlock(time, profId); onClose() },
      accent: false,
    },
  ]

  if (isMobile) {
    // ── Mobile: bottom sheet ──────────────────────────────────────────────────
    return createPortal(
      <>
        <style>{`@keyframes ctxUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
        <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.25)', backdropFilter:'blur(6px)', zIndex:9998 }} />
        <div ref={menuRef} style={{
          position:'fixed', left:0, right:0, bottom:0,
          background: glass.surface.modal.background,
          backdropFilter: glass.surface.modal.backdropFilter,
          WebkitBackdropFilter: glass.surface.modal.backdropFilter,
          borderRadius:`${radius['2xl']}px ${radius['2xl']}px 0 0`,
          boxShadow:'0 -8px 40px rgba(0,0,0,0.15)',
          zIndex:9999, fontFamily:typography.fontFamily,
          animation:'ctxUp 0.28s cubic-bezier(0.34,1.2,0.64,1)',
          paddingBottom:'max(16px, env(safe-area-inset-bottom))',
        }}>
          {/* Handle */}
          <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 4px' }}>
            <div style={{ width:40, height:4, borderRadius:2, background:'rgba(0,0,0,0.12)' }} />
          </div>

          {/* Título */}
          <div style={{ padding:'8px 20px 14px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:16, fontWeight:typography.weight.bold, color:typography.color.primary }}>O que deseja fazer?</div>
              <div style={{ fontSize:typography.scale.sm, color:typography.color.muted, marginTop:2 }}>às {time}</div>
            </div>
            <button onClick={onClose} style={{ width:30, height:30, borderRadius:radius.full, border:`1px solid ${colors.gray.borderMd}`, background:colors.background.surfaceLight, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <X size={14} color={colors.gray.dimText} />
            </button>
          </div>

          {/* Ações */}
          <div style={{ padding:'0 16px 8px', display:'flex', flexDirection:'column', gap:8 }}>
            {actions.map(a => (
              <button key={a.label} onClick={a.onClick} style={{
                display:'flex', alignItems:'center', gap:14,
                padding:'16px 18px', borderRadius:radius.lg,
                border:`1px solid ${a.accent ? colors.red.border : colors.slate.border}`,
                background: a.accent ? colors.red.subtle : colors.slate.subtle,
                cursor:'pointer', textAlign:'left', transition:`all ${transitions.fast}`,
                width:'100%',
              }}>
                <div style={{ width:44, height:44, borderRadius:radius.md, background: a.accent ? 'rgba(220,38,38,0.1)' : 'rgba(71,85,105,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  {a.icon}
                </div>
                <div>
                  <div style={{ fontSize:15, fontWeight:typography.weight.bold, color:a.accent ? colors.red.dark : colors.slate.dark }}>{a.label}</div>
                  <div style={{ fontSize:typography.scale.sm, color:typography.color.muted, marginTop:2 }}>{a.sub}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </>,
      document.body
    )
  }

  // ── Desktop: menu flutuante ───────────────────────────────────────────────
  // Posiciona o menu dentro da viewport
  const menuW = 200
  const menuH = 110
  const posX  = Math.min(x, window.innerWidth  - menuW - 12)
  const posY  = Math.min(y, window.innerHeight - menuH - 12)

  return createPortal(
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:9997 }} />
      <div ref={menuRef} style={{
        position:'fixed', left:posX, top:posY,
        width:menuW, background: glass.surface.modal.background,
        backdropFilter: glass.surface.modal.backdropFilter,
        WebkitBackdropFilter: glass.surface.modal.backdropFilter,
        borderRadius:radius.lg, border:`1px solid ${colors.gray.borderMd}`,
        boxShadow: shadows.lg,
        zIndex:9998, overflow:'hidden',
        fontFamily:typography.fontFamily,
        animation:'fadeIn 0.12s ease',
      }}>
        <style>{`@keyframes fadeIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}`}</style>
        {actions.map((a, i) => (
          <button key={a.label} onClick={a.onClick} style={{
            width:'100%', display:'flex', alignItems:'center', gap:10,
            padding:'11px 14px', border:'none',
            borderBottom: i < actions.length-1 ? `1px solid ${colors.gray.border}` : 'none',
            background:'transparent', cursor:'pointer', textAlign:'left',
            transition:`background ${transitions.fast}`,
          }}
            onMouseEnter={e => (e.currentTarget.style.background = a.accent ? colors.red.subtle : colors.slate.subtle)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            {a.icon}
            <span style={{ fontSize:typography.scale.base, fontWeight:typography.weight.semibold, color:a.accent ? colors.red.dark : colors.slate.dark }}>
              {a.label}
            </span>
          </button>
        ))}
      </div>
    </>,
    document.body
  )
}