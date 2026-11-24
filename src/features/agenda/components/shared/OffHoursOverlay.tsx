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
  /** @eligi:vac-fe-ovprop — rotulo no topo da coluna fechada (ex.: ferias) */
  label?:  string
}

/**
 * Renderiza as faixas listradas que indicam horário fora do expediente.
 * 3 zonas possíveis: antes do expediente, depois do expediente, ou dia fechado (todo).
 */
export default function OffHoursOverlay({ preH, postTop, postH, closed, totalH, label }: Props) { // @eligi:vac-fe-ovsig
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
      {closed && label && ( /* @eligi:vac-fe-overlay-label */
        <div style={{
          position: 'absolute', top: 10, left: 4, right: 4, zIndex: Z.offHoursOverlay,
          pointerEvents: 'none', display: 'flex', justifyContent: 'center',
        }}>
          <div style={{
            maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', padding: '4px 10px', borderRadius: 999,
            background: '#111114', color: '#fff',
            fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(17,17,20,.15)',
          }}>
            {label}
          </div>
        </div>
      )}
    </>
  )
}
