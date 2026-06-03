'use client'

import { useState } from 'react'
import { isAxiosError } from 'axios'
import { MailWarning, X } from 'lucide-react'
import api from '@/shared/lib/apiClient'

// ⚠️ AJUSTE este import para o caminho do seu AuthContext (o que exporta useAuth via Provider).
// Ex.: '@/contexts/AuthContext' | '@/providers/AuthContext' | '@/app/providers/AuthContext'
import { useAuth } from '@/contexts/AuthContext'

type SendState = 'idle' | 'sending' | 'sent' | 'cooldown' | 'error'

export default function EmailVerifyBanner() {
  const { user } = useAuth()
  const [state, setState] = useState<SendState>('idle')
  const [dismissed, setDismissed] = useState(false)

  // só aparece para usuário logado e não verificado
  if (!user || user.emailVerified || dismissed) return null

  async function resend() {
    setState('sending')
    try {
      await api.post('/auth/resend-verification')
      setState('sent')
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 429) {
        setState('cooldown')
      } else {
        setState('error')
      }
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
        padding: '12px 16px',
        background: '#fffbeb',
        border: '1px solid #fde68a',
        borderRadius: 12,
        margin: '12px 0'
      }}
    >
      <MailWarning size={18} color="#b45309" style={{ flexShrink: 0 }} />

      <span
        style={{
          fontSize: 13.5,
          color: '#92400e',
          fontWeight: 500,
          flex: 1,
          minWidth: 180
        }}
      >
        Confirme seu e-mail para garantir o acesso à sua conta.
      </span>

      {state === 'sent' ? (
        <span style={{ fontSize: 13, color: '#15803d', fontWeight: 600 }}>
          E-mail reenviado ✓
        </span>
      ) : state === 'cooldown' ? (
        <span style={{ fontSize: 13, color: '#b45309', fontWeight: 500 }}>
          Aguarde antes de reenviar
        </span>
      ) : (
        <button
          onClick={resend}
          disabled={state === 'sending'}
          style={{
            padding: '7px 14px',
            background: '#b45309',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: state === 'sending' ? 'default' : 'pointer',
            opacity: state === 'sending' ? 0.7 : 1,
            flexShrink: 0
          }}
        >
          {state === 'sending'
            ? 'Enviando…'
            : state === 'error'
            ? 'Tentar de novo'
            : 'Reenviar e-mail'}
        </button>
      )}

      <button
        onClick={() => setDismissed(true)}
        aria-label="Dispensar"
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 4,
          display: 'flex',
          flexShrink: 0
        }}
      >
        <X size={16} color="#b45309" />
      </button>
    </div>
  )
}
