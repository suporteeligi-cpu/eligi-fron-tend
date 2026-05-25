'use client'
// src/app/dashboard/equipe/components/AvatarPicker.tsx

import { useState, useRef } from 'react'
import { X, User } from 'lucide-react'
import { colors, transitions } from '@/shared/theme'
import { getInitials } from '@/features/professionals/utils/format'

interface Props {
  name:     string
  current?: string | null
  onChange: (url: string | null) => void
}

const AVATAR_COLORS = [
  { bg: 'linear-gradient(145deg,#ef4444,#dc2626)', label: 'Vermelho' },
  { bg: 'linear-gradient(145deg,#3b82f6,#2563eb)', label: 'Azul' },
  { bg: 'linear-gradient(145deg,#8b5cf6,#7c3aed)', label: 'Roxo' },
  { bg: 'linear-gradient(145deg,#10b981,#059669)', label: 'Verde' },
  { bg: 'linear-gradient(145deg,#f59e0b,#d97706)', label: 'Âmbar' },
  { bg: 'linear-gradient(145deg,#ec4899,#db2777)', label: 'Rosa' },
  { bg: 'linear-gradient(145deg,#06b6d4,#0891b2)', label: 'Ciano' },
  { bg: 'linear-gradient(145deg,#64748b,#475569)', label: 'Cinza' },
]

const MAX_FILE_MB = 2

export default function AvatarPicker({ name, current, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(current ?? null)
  const [loading, setLoading] = useState(false)
  const initials = getInitials(name || '?')

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      alert(`Imagem muito grande. Máximo ${MAX_FILE_MB}MB.`)
      return
    }

    setLoading(true)
    const reader = new FileReader()
    reader.onload = ev => {
      const b64 = ev.target?.result as string
      setPreview(b64)
      onChange(b64)
      setLoading(false)
    }
    reader.onerror = () => {
      alert('Erro ao ler a imagem')
      setLoading(false)
    }
    reader.readAsDataURL(file)
  }

  function handleColor(bg: string) {
    const newValue = `color:${bg}`
    setPreview(newValue)
    onChange(newValue)
  }

  function handleRemove() {
    setPreview(null)
    onChange(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const isColor = preview?.startsWith('color:')
  const colorBg = isColor ? preview!.replace('color:', '') : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      {/* Preview atual */}
      <div style={{ position: 'relative' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: colorBg ?? (preview && !isColor ? 'transparent' : colors.red.gradient),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, fontWeight: 700, color: '#fff',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          overflow: 'hidden',
          border: '3px solid rgba(255,255,255,0.9)',
        }}>
          {preview && !isColor ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : initials}
          {loading && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, color: '#fff',
              borderRadius: '50%',
            }}>...</div>
          )}
        </div>

        {preview && (
          <button
            onClick={handleRemove}
            aria-label="Remover avatar"
            style={{
              position: 'absolute', top: -4, right: -4,
              width: 22, height: 22, borderRadius: '50%',
              background: '#fff',
              border: `1.5px solid ${colors.gray.borderMd}`,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
            }}
          >
            <X size={11} color={colors.gray.dimText} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* Upload de foto */}
      <div style={{ width: '100%' }}>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          style={{ display: 'none' }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          style={{
            width: '100%', padding: '9px',
            borderRadius: 10,
            border: `1.5px dashed ${colors.gray.borderMd}`,
            background: 'transparent',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            color: colors.gray[700],
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 7,
            transition: `all ${transitions.fast}`,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = colors.red.DEFAULT
            e.currentTarget.style.color = colors.red.DEFAULT
            e.currentTarget.style.background = colors.red.subtle
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = colors.gray.borderMd
            e.currentTarget.style.color = colors.gray[700]
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <User size={14} strokeWidth={2} />
          Enviar foto
        </button>
        <div style={{ fontSize: 11, color: colors.gray.dimText, textAlign: 'center', marginTop: 5 }}>
          JPG, PNG ou WEBP · máx {MAX_FILE_MB}MB
        </div>
      </div>

      {/* Cores pré-definidas */}
      <div style={{ width: '100%' }}>
        <div style={{
          fontSize: 11, fontWeight: 700,
          color: colors.gray.dimText,
          textTransform: 'uppercase',
          letterSpacing: '.07em',
          marginBottom: 8,
        }}>
          Ou escolha uma cor
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6 }}>
          {AVATAR_COLORS.map(c => {
            const isSel = preview === `color:${c.bg}`
            return (
              <button
                key={c.bg}
                onClick={() => handleColor(c.bg)}
                title={c.label}
                aria-label={`Cor ${c.label}`}
                aria-pressed={isSel}
                style={{
                  width: '100%', aspectRatio: '1',
                  borderRadius: '50%',
                  background: c.bg,
                  border: isSel ? `3px solid ${colors.gray[900]}` : '3px solid transparent',
                  cursor: 'pointer',
                  transition: `transform ${transitions.fast}, border ${transitions.fast}`,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                  padding: 0,
                  WebkitTapHighlightColor: 'transparent',
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.15)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
