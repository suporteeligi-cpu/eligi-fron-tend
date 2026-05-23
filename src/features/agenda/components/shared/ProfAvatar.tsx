'use client'
// src/features/agenda/components/shared/ProfAvatar.tsx

import { colors } from '@/shared/theme'

interface Props {
  name:       string
  avatarUrl?: string
  size?:      number
  /** Estado ativo — usado em tabs/cards selecionados (afeta a cor padrão dos initials) */
  active?:    boolean
}

/**
 * Avatar do profissional. Aceita 3 formatos em `avatarUrl`:
 *  - `undefined` → iniciais com fundo gradient vermelho Eligi
 *  - `color:#abc123` → bloco sólido da cor especificada
 *  - URL normal → foto
 */
export default function ProfAvatar({ name, avatarUrl, size = 30, active = false }: Props) {
  const isColor  = avatarUrl?.startsWith('color:')
  const colorBg  = isColor ? avatarUrl!.replace('color:', '') : null
  const isPhoto  = avatarUrl != null && !isColor
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

  const background = colorBg
    ?? (isPhoto ? 'transparent' : (active ? 'rgba(255,255,255,0.25)' : colors.red.gradient))

  const initialColor = active && !isPhoto && !colorBg ? '#fff' : '#fff'

  return (
    <div
      aria-label={name}
      style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: Math.round(size * 0.36), fontWeight: 700,
        color: initialColor,
        boxShadow: isPhoto || colorBg ? '0 2px 6px rgba(0,0,0,0.10)' : `0 2px 8px ${colors.red.glow}`,
        overflow: 'hidden',
      }}
    >
      {isPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        initials
      )}
    </div>
  )
}
