'use client'
// src/features/agenda/components/shared/CurrentTimeLine.tsx

import { colors } from '@/shared/theme'
import { Z } from '../../constants'

interface Props {
  y: number
}

/**
 * Linha vermelha + bolinha indicando a hora atual.
 * Renderiza apenas quando y >= 0 (input do useCurrentTimeY).
 */
export default function CurrentTimeLine({ y }: Props) {
  if (y < 0) return null
  return (
    <div style={{
      position:'absolute', top: y, left:0, right:0, height:2,
      background: `linear-gradient(90deg, ${colors.red.DEFAULT}, ${colors.red.light})`,
      zIndex: Z.currentTime,
      pointerEvents:'none',
      boxShadow: `0 0 6px ${colors.red.glow}`,
    }}>
      <div style={{
        width:8, height:8, borderRadius:'50%',
        background: colors.red.DEFAULT,
        position:'absolute', left:-4, top:-3,
        boxShadow: `0 0 6px ${colors.red.glow}`,
      }} />
    </div>
  )
}
