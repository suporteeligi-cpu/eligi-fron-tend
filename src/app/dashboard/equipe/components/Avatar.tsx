'use client'
// src/app/dashboard/equipe/components/Avatar.tsx

import { colors } from '@/shared/theme'
import { getInitials } from '@/features/professionals/utils/format'

interface Props {
  name:  string
  size?: number
  url?:  string | null
}

export default function Avatar({ name, size = 40, url }: Props) {
  const isColor = url?.startsWith('color:')
  const colorBg = isColor ? url!.replace('color:', '') : null

  return (
    <div style={{
      width: size, height: size,
      borderRadius: '50%',
      flexShrink: 0,
      background: colorBg ?? (url && !isColor ? 'transparent' : colors.red.gradient),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size * 0.33,
      fontWeight: 700,
      color: '#fff',
      boxShadow: `0 3px 10px ${colors.red.glow}`,
      overflow: 'hidden',
      letterSpacing: '-0.02em',
    }}>
      {url && !isColor ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        getInitials(name)
      )}
    </div>
  )
}
