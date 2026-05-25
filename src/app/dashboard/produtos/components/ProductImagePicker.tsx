'use client'
// src/app/dashboard/produtos/components/ProductImagePicker.tsx

import { useState, useRef } from 'react'
import { Image as ImageIcon, X, Upload } from 'lucide-react'
import { colors, typography, transitions } from '@/shared/theme'
import { readImageAsBase64, UploadError } from '@/features/products/utils/imageUpload'

interface Props {
  current?: string | null
  onChange: (base64: string | null) => void
}

export default function ProductImagePicker({ current, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(current ?? null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setLoading(true)
    try {
      const { base64 } = await readImageAsBase64(file)
      setPreview(base64)
      onChange(base64)
    } catch (err) {
      const e = err as UploadError
      setError(e.message ?? 'Erro ao processar imagem')
    } finally {
      setLoading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function handleRemove() {
    setPreview(null)
    setError(null)
    onChange(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 12,
      fontFamily: typography.fontFamily,
    }}>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFile}
        style={{ display: 'none' }}
      />

      <div style={{
        position: 'relative',
        width: 120, height: 120,
        borderRadius: 16,
        border: preview ? 'none' : `2px dashed ${colors.gray.borderMd}`,
        background: preview ? '#fff' : colors.background.page,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: preview ? '0 4px 16px rgba(0,0,0,0.08)' : 'none',
      }} onClick={() => fileRef.current?.click()}>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Produto"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: 8 }}>
            <ImageIcon size={28} color={colors.gray.dimText} style={{ opacity: 0.4, marginBottom: 4 }} />
            <div style={{ fontSize: 11, color: colors.gray.dimText }}>Sem foto</div>
          </div>
        )}
        {loading && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 12, fontWeight: 600,
            backdropFilter: 'blur(4px)',
          }}>
            Processando...
          </div>
        )}
        {preview && !loading && (
          <button
            onClick={e => { e.stopPropagation(); handleRemove() }}
            aria-label="Remover foto"
            style={{
              position: 'absolute', top: 6, right: 6,
              width: 24, height: 24, borderRadius: '50%',
              background: 'rgba(0,0,0,0.6)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 0,
            }}
          >
            <X size={12} color="#fff" strokeWidth={2.5} />
          </button>
        )}
      </div>

      <button
        onClick={() => fileRef.current?.click()}
        type="button"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '7px 14px',
          borderRadius: 9,
          border: `1px solid ${colors.gray.borderMd}`,
          background: 'transparent',
          cursor: 'pointer',
          fontSize: 12, fontWeight: 600,
          color: colors.gray[700],
          transition: `all ${transitions.fast}`,
          fontFamily: 'inherit',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = colors.red.DEFAULT
          e.currentTarget.style.color = colors.red.DEFAULT
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = colors.gray.borderMd
          e.currentTarget.style.color = colors.gray[700]
        }}
      >
        <Upload size={12} strokeWidth={2.5} />
        {preview ? 'Trocar foto' : 'Enviar foto'}
      </button>

      <div style={{
        fontSize: 11, color: colors.gray.dimText,
        textAlign: 'center', maxWidth: 220,
      }}>
        JPG, PNG ou WEBP · máx 5MB · redimensionada automaticamente
      </div>

      {error && (
        <div style={{
          fontSize: 11,
          color: colors.red.DEFAULT,
          padding: '6px 10px',
          background: 'rgba(220,38,38,0.06)',
          border: `1px solid ${colors.red.border}`,
          borderRadius: 8,
        }}>
          {error}
        </div>
      )}
    </div>
  )
}
