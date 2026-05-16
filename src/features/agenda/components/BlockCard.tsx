'use client'
// src/features/agenda/components/BlockCard.tsx

import { AgendaBlock } from '../types'
import { Ban } from 'lucide-react'

interface Props {
  block:       AgendaBlock
  totalHeight: number
  onDelete?:   (id: string) => void
}

export default function BlockCard({ block, totalHeight, onDelete }: Props) {
  const compact  = totalHeight < 32
  const showTime = totalHeight >= 28
  const showIcon = totalHeight >= 40

  return (
    <div
      style={{
        position: 'relative',
        width: '100%', height: '100%',
        borderRadius: 7,
        // Glass Eligi: fundo branco translúcido com blur
        background: 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.75)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
        overflow: 'hidden',
        boxSizing: 'border-box',
        cursor: onDelete ? 'pointer' : 'default',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: compact ? 'center' : 'flex-start',
        padding: compact ? '0 7px 0 9px' : '5px 7px 5px 9px',
        gap: 2,
        transition: 'box-shadow 0.15s ease',
      }}
      onClick={() => onDelete?.(block.id)}
      title={onDelete ? 'Clique para remover bloqueio' : undefined}
    >
      {/* Listras diagonais — padrão de indisponível */}
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

      {/* Barra lateral esquerda — cinza escuro */}
      <div aria-hidden style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
        background: 'rgba(100,116,139,0.5)',
        borderRadius: '7px 0 0 7px',
      }} />

      {/* Conteúdo */}
      {compact ? (
        // Tiny: horário numa linha
        <div style={{ display:'flex', alignItems:'center', gap:4, overflow:'hidden' }}>
          {showIcon && <Ban size={9} color="rgba(71,85,105,0.7)" strokeWidth={2} style={{ flexShrink:0 }} />}
          <span style={{ fontSize:9, fontWeight:600, color:'rgba(71,85,105,0.9)', fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap' }}>
            {block.startTime}–{block.endTime}
          </span>
        </div>
      ) : (
        <>
          {/* Linha 1: ícone + horário */}
          {showTime && (
            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
              {showIcon && <Ban size={10} color="rgba(71,85,105,0.8)" strokeWidth={2} style={{ flexShrink:0 }} />}
              <span style={{ fontSize:10, fontWeight:700, color:'rgba(51,65,85,0.9)', fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap' }}>
                {block.startTime}–{block.endTime}
              </span>
            </div>
          )}

          {/* Linha 2: motivo ou label padrão */}
          {totalHeight >= 44 && (
            <div style={{ fontSize:10, fontWeight:500, color:'rgba(71,85,105,0.75)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
              {block.reason || 'Bloqueio de horário'}
            </div>
          )}
        </>
      )}

      {/* Indicador de delete no hover */}
      {onDelete && (
        <div style={{
          position: 'absolute', top:4, right:5,
          fontSize: 9, color: 'rgba(220,38,38,0.6)',
          opacity: 0, transition: 'opacity 0.15s',
          fontWeight: 600,
          pointerEvents: 'none',
        }}
          className="block-del-hint"
        >
          ✕
        </div>
      )}

      <style>{`
        div:hover > .block-del-hint { opacity: 1 !important; }
      `}</style>
    </div>
  )
}
