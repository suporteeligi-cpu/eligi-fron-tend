'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, XCircle, Loader2, MailQuestion } from 'lucide-react'
import api from '@/shared/lib/apiClient'

type Status = 'loading' | 'success' | 'error' | 'no-token'

const BRAND = '#dc2626'

function VerifyEmailInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<Status>(token ? 'loading' : 'no-token')
  const ran = useRef(false)

  useEffect(() => {
    if (!token) return
    if (ran.current) return // evita duplo POST no StrictMode (token vira inválido no 2º)
    ran.current = true

    api
      .post('/auth/verify-email', { token })
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'))
  }, [token])

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: '#f6f6f8'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#ffffff',
          borderRadius: 20,
          border: '1px solid #ececf1',
          boxShadow: '0 12px 40px rgba(0,0,0,0.06)',
          padding: 36,
          textAlign: 'center'
        }}
      >
        {/* Marca */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 56,
            height: 56,
            borderRadius: 16,
            marginBottom: 20,
            background:
              status === 'success'
                ? 'linear-gradient(135deg,#16a34a,#15803d)'
                : status === 'error' || status === 'no-token'
                ? 'linear-gradient(135deg,#dc2626,#b91c1c)'
                : 'linear-gradient(135deg,#dc2626,#b91c1c)'
          }}
        >
          {status === 'loading' && (
            <Loader2
              size={28}
              color="#fff"
              style={{ animation: 'spin 0.9s linear infinite' }}
            />
          )}
          {status === 'success' && <CheckCircle2 size={28} color="#fff" />}
          {status === 'error' && <XCircle size={28} color="#fff" />}
          {status === 'no-token' && <MailQuestion size={28} color="#fff" />}
        </div>

        {status === 'loading' && (
          <>
            <h1 style={titleStyle}>Confirmando seu e-mail…</h1>
            <p style={textStyle}>Só um instante.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <h1 style={titleStyle}>E-mail confirmado!</h1>
            <p style={textStyle}>Sua conta está verificada. Tudo certo pra continuar.</p>
            <button
              onClick={() => router.push('/dashboard')}
              style={buttonStyle}
            >
              Ir para o painel
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <h1 style={titleStyle}>Link inválido ou expirado</h1>
            <p style={textStyle}>
              Este link de verificação não é mais válido. Entre na sua conta e
              solicite um novo e-mail de confirmação.
            </p>
            <button onClick={() => router.push('/login')} style={buttonStyle}>
              Ir para o login
            </button>
          </>
        )}

        {status === 'no-token' && (
          <>
            <h1 style={titleStyle}>Link incompleto</h1>
            <p style={textStyle}>
              Não encontramos o código de verificação. Abra o link direto do
              e-mail que enviamos.
            </p>
            <button onClick={() => router.push('/login')} style={buttonStyle}>
              Ir para o login
            </button>
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

const titleStyle: React.CSSProperties = {
  margin: '0 0 10px',
  fontSize: 20,
  fontWeight: 700,
  color: '#0c0c12'
}

const textStyle: React.CSSProperties = {
  margin: '0 0 24px',
  fontSize: 14,
  lineHeight: 1.6,
  color: '#5f6368'
}

const buttonStyle: React.CSSProperties = {
  width: '100%',
  padding: '13px 20px',
  background: BRAND,
  color: '#fff',
  border: 'none',
  borderRadius: 12,
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer'
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100dvh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f6f6f8'
          }}
        >
          <Loader2
            size={28}
            color="#dc2626"
            style={{ animation: 'spin 0.9s linear infinite' }}
          />
        </div>
      }
    >
      <VerifyEmailInner />
    </Suspense>
  )
}
