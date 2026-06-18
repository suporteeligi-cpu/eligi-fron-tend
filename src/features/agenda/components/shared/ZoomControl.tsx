'use client'
// src/features/agenda/components/shared/ZoomControl.tsx
// Stepper de densidade da grade (desktop/iPad). Mora no canto da coluna de tempo.

import { colors } from '@/shared/theme'

interface Props {
  onZoomIn:  () => void
  onZoomOut: () => void
  canIn:     boolean
  canOut:    boolean
}

export default function ZoomControl({ onZoomIn, onZoomOut, canIn, canOut }: Props) {
  function btnStyle(enabled: boolean): React.CSSProperties {
    return {
      width: 24, height: 17,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 0, margin: 0,
      border: `1px solid ${colors.gray.border}`,
      borderRadius: 5,
      background: enabled ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.03)',
      color: enabled ? colors.gray['900'] : colors.gray.dimTextLight,
      cursor: enabled ? 'pointer' : 'default',
      fontSize: 13, fontWeight: 600, lineHeight: 1,
      fontVariantNumeric: 'tabular-nums',
      userSelect: 'none',
    }
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <button
        type="button" aria-label="Aproximar (mais zoom)" title="Aproximar"
        disabled={!canIn} style={btnStyle(canIn)}
        onClick={e => { e.stopPropagation(); onZoomIn() }}
      >+</button>
      <button
        type="button" aria-label="Afastar (menos zoom)" title="Afastar"
        disabled={!canOut} style={btnStyle(canOut)}
        onClick={e => { e.stopPropagation(); onZoomOut() }}
      >−</button>
    </div>
  )
}
