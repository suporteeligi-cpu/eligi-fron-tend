'use client'
// src/features/agenda/components/SlotContextMenu.tsx

import { useEffect, useRef } from 'react'
import { Calendar, Ban, Coffee } from 'lucide-react'

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
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose()
    }
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    setTimeout(() => {
      document.addEventListener('mousedown', handle)
      document.addEventListener('keydown',   handleKey)
    }, 0)
    return () => {
      document.removeEventListener('mousedown', handle)
      document.removeEventListener('keydown',   handleKey)
    }
  }, [onClose])

  const menuW = 230
  const menuH = 165
  const adjX  = Math.min(x, (typeof window !== 'undefined' ? window.innerWidth  : 800) - menuW - 12)
  const adjY  = Math.min(y, (typeof window !== 'undefined' ? window.innerHeight : 600) - menuH - 12)

  const items = [
    {
      icon: Calendar, label: 'Novo agendamento', color: '#dc2626',
      action: () => { onNewBooking(time, profId); onClose() },
    },
    {
      icon: Ban, label: 'Novo bloqueio de horário', color: '#475569',
      action: () => { onNewBlock(time, profId); onClose() },
    },
    {
      icon: Coffee, label: 'Adicionar folga', color: '#7c3aed',
      action: () => { onNewBlock(time, profId); onClose() },
    },
  ]

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:9990 }} />
      <div
        ref={menuRef}
        style={{
          position: 'fixed', top: adjY, left: adjX,
          width: menuW, zIndex: 9991,
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: 14,
          border: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.06)',
          overflow: 'hidden',
          animation: 'ctxMenuIn 0.14s cubic-bezier(0.34,1.56,0.64,1)',
          fontFamily: '-apple-system,"SF Pro Display",system-ui,sans-serif',
        }}
      >
        <style>{`@keyframes ctxMenuIn{from{opacity:0;transform:scale(0.93) translateY(-4px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>

        {/* Label horário */}
        <div style={{ padding:'9px 14px 7px', borderBottom:'1px solid rgba(0,0,0,0.06)' }}>
          <span style={{ fontSize:11, fontWeight:700, color:'rgba(0,0,0,0.35)', letterSpacing:'0.07em', textTransform:'uppercase', fontVariantNumeric:'tabular-nums' }}>
            {time}
          </span>
        </div>

        {items.map(({ icon: Icon, label, color, action }, i) => (
          <button
            key={label}
            onClick={action}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px',
              border: 'none', borderBottom: i < items.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
              background: 'transparent', cursor: 'pointer', textAlign: 'left',
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.03)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ width:28, height:28, borderRadius:8, background:`${color}15`, border:`1px solid ${color}25`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Icon size={13} color={color} strokeWidth={2.2} />
            </div>
            <span style={{ fontSize:13, fontWeight:600, color:'#111827' }}>{label}</span>
          </button>
        ))}
      </div>
    </>
  )
}