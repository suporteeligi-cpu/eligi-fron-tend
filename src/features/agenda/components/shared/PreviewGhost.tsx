'use client'
// src/features/agenda/components/shared/PreviewGhost.tsx
// Estilo do ghost acompanha a preferência do card ('classic' vermelho saturado
// × 'clean' pastel do vermelho + faixa/tinta escura) via useCardStyle().

import { colors } from '@/shared/theme'
import { pastelOf } from '../../utils/contrast'
import { useCardStyle } from '@/hooks/useCardStyle'

interface PreviewItem {
  startTime:    string
  endTime:      string
  duration:     number
  serviceName:  string
  profId:       string
  clientName?:  string
}

interface Props {
  item:        PreviewItem
  top:         number
  height:      number
  /** Borda inset — desktop usa 3, mobile usa 4 */
  inset?:      number
  /** Raio do card — desktop usa 7, mobile usa 10 */
  radius?:     number
}

// Vermelho eligi — âncora visual do ghost nos dois estilos.
const ACCENT = '#dc2626'

/**
 * Card-fantasma renderizado durante a edição no SideCheckoutPanel.
 * Mostra horário+nome+serviço com layout adaptativo:
 * - inline (< 48px): tudo numa linha
 * - normal: empilhado
 */
export default function PreviewGhost({ item, top, height, inset = 3, radius = 7 }: Props) {
  const isInline   = height < 48
  const clientName = item.clientName ?? 'Avulso'

  const cardStyle = useCardStyle()
  const isClean   = cardStyle === 'clean'

  const tTime      = isClean ? ACCENT : '#fff'
  const tPrimary   = isClean ? '#1c1c1e' : '#fff'
  const tSecondary = isClean ? 'rgba(28,28,30,0.72)' : 'rgba(255,255,255,0.88)'
  const tStacked   = isClean ? 'rgba(28,28,30,0.78)' : 'rgba(255,255,255,0.82)'
  const tDot       = isClean ? 'rgba(28,28,30,0.35)' : 'rgba(255,255,255,0.45)'

  return (
    <div style={{
      position: 'absolute',
      top,
      left:   inset,
      right:  inset,
      height,
      zIndex: 9,
      pointerEvents: 'none',
      opacity: 0.86,
      filter: isClean
        ? 'drop-shadow(0 4px 14px rgba(0,0,0,0.14))'
        : 'drop-shadow(0 4px 14px rgba(220,38,38,0.32))',
    }}>
      <div style={{
        width: '100%', height: '100%',
        borderRadius: radius,
        background: isClean ? pastelOf(ACCENT) : colors.red.gradient,
        border: `2px dashed ${isClean ? 'rgba(220,38,38,0.55)' : 'rgba(255,255,255,0.55)'}`,
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: isInline ? '0 8px 0 11px' : '5px 8px 5px 11px',
      }}>
        {/* Barra lateral — clean: vermelho cru; clássico: branca */}
        <div aria-hidden style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
          background: isClean ? ACCENT : 'rgba(255,255,255,0.42)',
          borderRadius: `${radius}px 0 0 ${radius}px`,
        }} />

        {isInline ? (
          <div style={{ display:'flex', alignItems:'center', gap:4, overflow:'hidden', width:'100%', lineHeight:1 }}>
            <span style={{ fontSize:10, fontWeight:800, color:tTime, opacity:0.90, fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap', flexShrink:0, letterSpacing:'-0.2px' }}>
              {item.startTime}–{item.endTime}
            </span>
            <span style={{ color:tDot, fontSize:8, flexShrink:0 }}>·</span>
            <span style={{ fontSize:11, fontWeight:800, color:tPrimary, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', flexShrink:1, minWidth:0 }}>
              {clientName}
            </span>
            {item.serviceName && (
              <>
                <span style={{ color:tDot, fontSize:8, flexShrink:0 }}>·</span>
                <span style={{ fontSize:10, fontWeight:600, color:tSecondary, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', flexShrink:2, minWidth:0 }}>
                  {item.serviceName}
                </span>
              </>
            )}
          </div>
        ) : (
          <>
            <div style={{ color: isClean ? ACCENT : 'rgba(255,255,255,0.78)', fontSize:9, fontWeight:700, fontVariantNumeric:'tabular-nums', lineHeight:1, marginBottom:2 }}>
              {item.startTime}–{item.endTime}
            </div>
            <div style={{ color:tPrimary, fontSize:12, fontWeight:800, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', lineHeight:1.2 }}>
              {clientName}
            </div>
            {item.serviceName && (
              <div style={{ color:tStacked, fontSize:10, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginTop:1 }}>
                {item.serviceName}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export type { PreviewItem }
