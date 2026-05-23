'use client'
// src/features/agenda/components/BlockCard.tsx
// Card de bloqueio. Visual glass-Eligi com listras diagonais de "indisponível".

import { AgendaBlock } from '../types'
import { Ban } from 'lucide-react'

interface Props {
  block:       AgendaBlock
  totalHeight: number
  onDelete?:   (id: string) => void
}

// Estados por altura (alinhados com BookingCard desktop, PX_PER_MIN = 2)
// ≤ 14px → MICRO: só ícone + horário compacto
// ≤ 32px → COMPACT: horário + label inline
// ≤ 44px → NORMAL: ícone + horário no topo
// ≥ 44px → FULL: ícone + horário + motivo
const H_MICRO   = 14
const H_COMPACT = 32
const H_FULL    = 44

export default function BlockCard({ block, totalHeight, onDelete }: Props) {
  const isMicro   = totalHeight <= H_MICRO
  const isCompact = totalHeight > H_MICRO   && totalHeight <= H_COMPACT
  const showMotivo = totalHeight >= H_FULL
  const interactive = !!onDelete

  return (
    <div
      role={interactive ? 'button' : undefined}
      aria-label={`Bloqueio ${block.startTime} às ${block.endTime}${block.reason ? ` — ${block.reason}` : ''}`}
      className="eligi-block-card"
      onClick={onDelete ? () => onDelete(block.id) : undefined}
      title={interactive ? 'Clique para remover bloqueio' : undefined}
      style={{
        position: 'relative',
        width: '100%', height: '100%',
        borderRadius: 7,
        // Glass Eligi: branco translúcido + blur
        background: 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(12px) saturate(140%)',
        WebkitBackdropFilter: 'blur(12px) saturate(140%)',
        border: '1px solid rgba(255,255,255,0.75)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
        overflow: 'hidden',
        boxSizing: 'border-box',
        cursor: interactive ? 'pointer' : 'default',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: (isMicro || isCompact) ? 'center' : 'flex-start',
        padding: isMicro ? '0 6px 0 8px' : isCompact ? '0 7px 0 9px' : '5px 7px 5px 9px',
        gap: 2,
      }}
    >
      <style>{`
        .eligi-block-card {
          transition: box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1),
                      transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .eligi-block-card:hover {
          box-shadow: 0 4px 16px rgba(0,0,0,0.10),
                      inset 0 1px 0 rgba(255,255,255,0.95);
        }
        .eligi-block-card:hover .block-del-hint {
          opacity: 1 !important;
        }
        .eligi-block-card:active {
          transform: scale(0.99);
        }
      `}</style>

      {/* Listras diagonais "indisponível" */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0,
        backgroundImage: `repeating-linear-gradient(
          -45deg,
          rgba(0,0,0,0.04) 0px,
          rgba(0,0,0,0.04) 4px,
          transparent 4px,
          transparent 12px
        )`,
        borderRadius: 7,
        pointerEvents: 'none',
      }} />

      {/* Barra lateral esquerda */}
      <div aria-hidden style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
        background: 'rgba(100,116,139,0.5)',
        borderRadius: '7px 0 0 7px',
      }} />

      {/* MICRO — só horário compacto */}
      {isMicro && (
        <div style={{ display:'flex', alignItems:'center', gap:3, overflow:'hidden', lineHeight:1 }}>
          <Ban size={8} color="rgba(71,85,105,0.75)" strokeWidth={2.5} style={{ flexShrink:0 }} />
          <span style={{
            fontSize:9, fontWeight:700, color:'rgba(51,65,85,0.9)',
            fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap',
            letterSpacing:'-0.2px',
          }}>
            {block.startTime}
          </span>
        </div>
      )}

      {/* COMPACT — horário · motivo inline */}
      {isCompact && (
        <div style={{ display:'flex', alignItems:'center', gap:4, overflow:'hidden', width:'100%', lineHeight:1 }}>
          <Ban size={10} color="rgba(71,85,105,0.8)" strokeWidth={2} style={{ flexShrink:0 }} />
          <span style={{
            fontSize:10, fontWeight:700, color:'rgba(51,65,85,0.9)',
            fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap',
            flexShrink:0, letterSpacing:'-0.2px',
          }}>
            {block.startTime}–{block.endTime}
          </span>
          {block.reason && (
            <>
              <span style={{ color:'rgba(71,85,105,0.40)', fontSize:9, flexShrink:0 }}>·</span>
              <span style={{
                fontSize:10, fontWeight:500, color:'rgba(71,85,105,0.75)',
                whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                flexShrink:1, minWidth:0,
              }}>
                {block.reason}
              </span>
            </>
          )}
        </div>
      )}

      {/* NORMAL/FULL */}
      {!isMicro && !isCompact && (
        <>
          {/* Linha 1: ícone + horário */}
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <Ban size={10} color="rgba(71,85,105,0.8)" strokeWidth={2} style={{ flexShrink:0 }} />
            <span style={{
              fontSize:10, fontWeight:700, color:'rgba(51,65,85,0.9)',
              fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap',
              letterSpacing:'-0.2px',
            }}>
              {block.startTime}–{block.endTime}
            </span>
          </div>

          {/* Linha 2: motivo (só se altura permite) */}
          {showMotivo && (
            <div style={{
              fontSize:10, fontWeight:500, color:'rgba(71,85,105,0.75)',
              whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
              letterSpacing:'-0.1px',
            }}>
              {block.reason || 'Bloqueio de horário'}
            </div>
          )}
        </>
      )}

      {/* Hint de delete no hover (desktop) */}
      {interactive && (
        <div
          className="block-del-hint"
          aria-hidden
          style={{
            position: 'absolute', top: 4, right: 5,
            fontSize: 10, color: 'rgba(220,38,38,0.7)',
            fontWeight: 700,
            opacity: 0,
            transition: 'opacity 0.15s ease',
            pointerEvents: 'none',
          }}
        >
          ✕
        </div>
      )}
    </div>
  )
}
