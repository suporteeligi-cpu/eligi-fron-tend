'use client'
// src/app/dashboard/caixa/components/Avatar.tsx

import { colors } from '@/shared/theme'
import { getInitials } from '@/features/sales/utils/format'

interface Props {
  name:     string
  size?:    number
  url?:     string | null
  bgColor?: string
}

export default function Avatar({ name, size = 36, url, bgColor }: Props) {
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: url ? '#fff' : (bgColor ?? colors.red.gradient),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size * 0.36,
      fontWeight: 700,
      color: '#fff',
      flexShrink: 0,
      overflow: 'hidden',
      boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
      userSelect: 'none',
    }}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        getInitials(name) || '—'
      )}
    </div>
  )
}
