'use client'
// @eligi:announcement-module
import { useEffect, useState } from 'react'
import api from '@/shared/lib/apiClient'

interface PendingAnnouncement {
  id: string
  imageBase64: string
  mimeType: string
}

// Modal de comunicado do Eligi. Busca o anuncio pendente APOS o render (lazy),
// mostra 1x por usuario (tracking server-side) e some com "Entendi".
export default function AnnouncementModal() {
  const [ann, setAnn] = useState<PendingAnnouncement | null>(null)
  const [closing, setClosing] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    let alive = true
    const run = async () => {
      try {
        const res = await api.get('/announcements/pending')
        const pending = res.data?.data?.announcement as PendingAnnouncement | null
        if (alive && pending) {
          setAnn(pending)
          // proximo frame: dispara animacao de entrada
          requestAnimationFrame(() => {
            if (alive) setMounted(true)
          })
        }
      } catch {
        // silencioso: anuncio nunca pode quebrar o dashboard
      }
    }
    void run()
    return () => {
      alive = false
    }
  }, [])

  const dismiss = () => {
    if (!ann || closing) return
    setClosing(true)
    // registra visualizacao (best-effort); fecha independente do resultado
    void api.post(`/announcements/${ann.id}/seen`).catch(() => undefined)
    setTimeout(() => setAnn(null), 240)
  }

  if (!ann) return null

  const shown = mounted && !closing

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Comunicado do Eligi"
      onClick={dismiss}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        background: 'rgba(3,3,6,0.62)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        opacity: shown ? 1 : 0,
        transition: 'opacity 0.22s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 380,
          maxWidth: '88vw',
          transform: shown ? 'scale(1) translateY(0)' : 'scale(0.94) translateY(8px)',
          opacity: shown ? 1 : 0,
          transition: 'transform 0.28s cubic-bezier(0.34,1.56,0.64,1), opacity 0.22s ease',
        }}
      >
        <div
          style={{
            borderRadius: '16px 16px 0 0',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.10)',
            borderBottom: 'none',
            lineHeight: 0,
          }}
        >
          <img
            src={`data:${ann.mimeType};base64,${ann.imageBase64}`}
            alt="Comunicado do Eligi"
            style={{ display: 'block', width: '100%', height: 'auto' }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '14px 16px',
            background: 'rgba(12,12,18,0.92)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderTop: 'none',
            borderRadius: '0 0 16px 16px',
          }}
        >
          <span
            style={{
              fontSize: 11,
              letterSpacing: '0.1em',
              color: '#f09595',
              background: 'rgba(220,38,38,0.16)',
              padding: '4px 10px',
              borderRadius: 999,
            }}
          >
            NOVIDADE
          </span>
          <button
            onClick={dismiss}
            style={{
              marginLeft: 'auto',
              background: '#dc2626',
              border: 'none',
              color: '#fff',
              fontSize: 14,
              fontWeight: 500,
              padding: '9px 22px',
              borderRadius: 10,
              cursor: 'pointer',
            }}
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  )
}
