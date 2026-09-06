'use client'
// src/features/agenda/components/LunchBand.tsx
// @eligi:lunch-band
// Faixa de almoco na agenda.
//
// Nao usa as listras diagonais do BlockCard de proposito: hachura e vocabulario
// de ALERTA, e almoco e ROTINA. Bloqueio e excecao e merece chamar atencao; a
// pausa de todo dia deve ser quieta, quase parte do fundo da grade.
//
// CLIQUE INTERCEPTADO: os tres layouts envolvem este componente num <div> com
// onClick que abre o BlockEditModal. Aquele modal salva com PUT /blocks/<id>, e
// o id do almoco e sintetico (lunch:<prof>:<data>) — nao existe como linha. Sem
// o stopPropagation daqui, o lojista edita o horario, salva e leva erro.
// A fatia 4b-2 troca este stopPropagation pelo menu de excecao.

import { useState } from 'react'
import { AgendaBlock } from '../types'
import { Utensils } from 'lucide-react'
// @eligi:lunch-band-menu-import
import LunchExceptionMenu from './LunchExceptionMenu'

interface Props {
  block:       AgendaBlock
  totalHeight: number
}

// Mesmos limiares do BlockCard: numa agenda com zoom baixo, 1h vira 14px.
const H_MICRO   = 14
const H_COMPACT = 32
const H_FULL    = 44

// Cinza-quente. Distingue da ardosia fria do bloqueio sem virar alerta.
const INK   = 'rgba(87,83,78,0.92)'
const INK_2 = 'rgba(120,113,108,0.80)'
const EDGE  = 'rgba(168,162,158,0.85)'

export default function LunchBand({ block, totalHeight }: Props) {
  // @eligi:lunch-band-state
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)

  const isMicro   = totalHeight <= H_MICRO
  const isCompact = totalHeight > H_MICRO && totalHeight <= H_COMPACT
  const showLabel = totalHeight >= H_FULL

  return (
    <div
      aria-label={`Almoço, ${block.startTime} às ${block.endTime}`}
      // @eligi:lunch-band-menu
      // O stopPropagation continua sendo essencial: sem ele o clique sobe para
      // o <div> do layout e abre o BlockEditModal, que salvaria com um id
      // sintetico que nao existe no banco. O que mudou e que agora, alem de
      // barrar, o clique abre o menu de excecao.
      onClick={e => {
        e.stopPropagation()
        setMenu({ x: e.clientX, y: e.clientY })
      }}
      style={{
        position: 'relative',
        width: '100%', height: '100%',
        borderRadius: 7,
        background: 'rgba(250,249,247,0.82)',
        backdropFilter: 'blur(10px) saturate(120%)',
        WebkitBackdropFilter: 'blur(10px) saturate(120%)',
        border: '1px solid rgba(231,229,228,0.9)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.75)',
        overflow: 'hidden',
        boxSizing: 'border-box',
        cursor: 'default',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: (isMicro || isCompact) ? 'center' : 'flex-start',
        padding: isMicro ? '0 6px 0 8px' : isCompact ? '0 7px 0 9px' : '5px 7px 5px 9px',
        gap: 2,
      }}
    >
      {/* @eligi:lunch-band-render — o menu usa portal, entao a posicao aqui
          dentro nao afeta o layout da faixa. */}
      {menu && (
        <LunchExceptionMenu
          block={block}
          x={menu.x}
          y={menu.y}
          onClose={() => setMenu(null)}
        />
      )}

      {/* Barra lateral. Sem listras: rotina nao usa hachura de alerta. */}
      <div aria-hidden style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
        background: EDGE,
        borderRadius: '7px 0 0 7px',
      }} />

      {isMicro && (
        <div style={{ display:'flex', alignItems:'center', gap:3, overflow:'hidden', lineHeight:1 }}>
          <Utensils size={8} color={INK_2} strokeWidth={2.5} style={{ flexShrink:0 }} />
          <span style={{
            fontSize:9, fontWeight:700, color:INK,
            fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap',
            letterSpacing:'-0.2px',
          }}>
            {block.startTime}
          </span>
        </div>
      )}

      {isCompact && (
        <div style={{ display:'flex', alignItems:'center', gap:4, overflow:'hidden', width:'100%', lineHeight:1 }}>
          <Utensils size={10} color={INK_2} strokeWidth={2} style={{ flexShrink:0 }} />
          <span style={{
            fontSize:10, fontWeight:700, color:INK,
            fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap',
            flexShrink:0, letterSpacing:'-0.2px',
          }}>
            {block.startTime}–{block.endTime}
          </span>
          <span style={{ color:'rgba(168,162,158,0.7)', fontSize:9, flexShrink:0 }}>·</span>
          <span style={{
            fontSize:10, fontWeight:500, color:INK_2,
            whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
            flexShrink:1, minWidth:0,
          }}>
            Almoço
          </span>
        </div>
      )}

      {!isMicro && !isCompact && (
        <>
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <Utensils size={10} color={INK_2} strokeWidth={2} style={{ flexShrink:0 }} />
            <span style={{
              fontSize:10, fontWeight:700, color:INK,
              fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap',
              letterSpacing:'-0.2px',
            }}>
              {block.startTime}–{block.endTime}
            </span>
          </div>

          {showLabel && (
            <div style={{
              fontSize:10, fontWeight:500, color:INK_2,
              whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
              letterSpacing:'-0.1px',
            }}>
              Almoço
            </div>
          )}
        </>
      )}
    </div>
  )
}
