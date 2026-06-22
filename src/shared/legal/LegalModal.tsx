// src/shared/legal/LegalModal.tsx
'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import LegalDoc from './LegalDoc'
import type { LegalKind } from './legalContent'

export default function LegalModal({
  kind, onClose,
}: {
  kind: LegalKind
  onClose: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000000,
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom))',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 18, maxWidth: 680, width: '100%',
          maxHeight: '85vh', display: 'flex', flexDirection: 'column',
          overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.30)',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12, padding: '14px 18px', borderBottom: '1px solid rgba(0,0,0,0.07)',
          flexShrink: 0,
        }}>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
            background: 'rgba(220,38,38,0.10)', color: '#dc2626',
            letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>
            Em revisao
          </span>
          <button
            onClick={onClose}
            aria-label="Fechar"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: 9, border: 'none', cursor: 'pointer',
              background: 'rgba(0,0,0,0.05)', color: 'rgba(0,0,0,0.5)',
            }}
          >
            <X size={17} strokeWidth={2} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', padding: '20px 26px 28px' }}>
          <LegalDoc kind={kind} />
        </div>
      </div>
    </div>
  )
}
