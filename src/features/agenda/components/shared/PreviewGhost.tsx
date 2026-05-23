'use client'
// src/features/agenda/components/shared/PreviewGhost.tsx

import { colors } from '@/shared/theme'

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

/**
 * Card-fantasma renderizado durante a edição no SideCheckoutPanel.
 * Mostra horário+nome+serviço com layout adaptativo:
 * - inline (< 48px): tudo numa linha
 * - normal: empilhado
 */
export default function PreviewGhost({ item, top, height, inset = 3, radius = 7 }: Props) {
  const isInline   = height < 48
  const clientName = item.clientName ?? 'Avulso'

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
      filter:  'drop-shadow(0 4px 14px rgba(220,38,38,0.32))',
    }}>
      <div style={{
        width: '100%', height: '100%',
        borderRadius: radius,
        background: colors.red.gradient,
        border: '2px dashed rgba(255,255,255,0.55)',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: isInline ? '0 8px 0 11px' : '5px 8px 5px 11px',
      }}>
        {/* Barra lateral branca */}
        <div aria-hidden style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
          background: 'rgba(255,255,255,0.42)',
          borderRadius: `${radius}px 0 0 ${radius}px`,
        }} />

        {isInline ? (
          <div style={{ display:'flex', alignItems:'center', gap:4, overflow:'hidden', width:'100%', lineHeight:1 }}>
            <span style={{ fontSize:10, fontWeight:800, color:'#fff', opacity:0.90, fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap', flexShrink:0, letterSpacing:'-0.2px' }}>
              {item.startTime}–{item.endTime}
            </span>
            <span style={{ color:'rgba(255,255,255,0.45)', fontSize:8, flexShrink:0 }}>·</span>
            <span style={{ fontSize:11, fontWeight:800, color:'#fff', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', flexShrink:1, minWidth:0 }}>
              {clientName}
            </span>
            {item.serviceName && (
              <>
                <span style={{ color:'rgba(255,255,255,0.45)', fontSize:8, flexShrink:0 }}>·</span>
                <span style={{ fontSize:10, fontWeight:600, color:'rgba(255,255,255,0.88)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', flexShrink:2, minWidth:0 }}>
                  {item.serviceName}
                </span>
              </>
            )}
          </div>
        ) : (
          <>
            <div style={{ color:'rgba(255,255,255,0.78)', fontSize:9, fontWeight:700, fontVariantNumeric:'tabular-nums', lineHeight:1, marginBottom:2 }}>
              {item.startTime}–{item.endTime}
            </div>
            <div style={{ color:'#fff', fontSize:12, fontWeight:800, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', lineHeight:1.2 }}>
              {clientName}
            </div>
            {item.serviceName && (
              <div style={{ color:'rgba(255,255,255,0.82)', fontSize:10, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginTop:1 }}>
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
