'use client'
// src/features/agenda/components/shared/OffHoursOverlay.tsx

import { Z } from '../../constants'

interface Props {
  /** Output de computeOffHoursOverlay */
  preH:    number
  postTop: number
  postH:   number
  closed:  boolean
  totalH:  number
}

/**
 * Renderiza as faixas listradas que indicam horário fora do expediente.
 * 3 zonas possíveis: antes do expediente, depois do expediente, ou dia fechado (todo).
 */
export default function OffHoursOverlay({ preH, postTop, postH, closed, totalH }: Props) {
  const stripe = 'repeating-linear-gradient(-45deg,rgba(0,0,0,0.035) 0px,rgba(0,0,0,0.035) 4px,transparent 4px,transparent 10px)'

  return (
    <>
      {(preH > 0 || closed) && (
        <div style={{
          position:'absolute', top:0, left:0, right:0,
          height: closed ? totalH : preH,
          zIndex: Z.offHoursOverlay,
          pointerEvents: 'none',
          background: stripe,
          borderBottom: closed ? 'none' : '1px solid rgba(0,0,0,0.06)',
        }} />
      )}
      {!closed && postH > 0 && (
        <div style={{
          position:'absolute', top: postTop, left:0, right:0,
          height: postH,
          zIndex: Z.offHoursOverlay,
          pointerEvents: 'none',
          background: stripe,
          borderTop: '1px solid rgba(0,0,0,0.06)',
        }} />
      )}
    </>
  )
}
