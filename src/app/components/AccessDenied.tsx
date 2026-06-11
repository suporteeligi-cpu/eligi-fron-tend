'use client'
// src/app/components/AccessDenied.tsx

import { useRouter } from 'next/navigation'
import { ShieldOff } from 'lucide-react'
import { getRoleLabel } from '@/app/components/navigation/navigation.config'
import { useAuth } from '@/hooks/useAuth'

interface Props {
  requiredRole?: string   // ex: 'MANAGER'
  message?:      string   // mensagem customizada
}

export default function AccessDenied({ requiredRole, message }: Props) {
  const router    = useRouter()
  const { user }  = useAuth()
  const roleLabel = getRoleLabel(user?.role)

  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      minHeight:      '60vh',
      padding:        '40px 24px',
      fontFamily:     '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      textAlign:      'center',
      animation:      'ad-fade 300ms ease',
    }}>
      <style>{`@keyframes ad-fade { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>

      {/* Ícone */}
      <div style={{
        width:           72,
        height:          72,
        borderRadius:    20,
        background:      '#fef2f2',
        border:          '1.5px solid #fecaca',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        marginBottom:    24,
      }}>
        <ShieldOff size={32} color="#dc2626" strokeWidth={1.5} />
      </div>

      {/* Título */}
      <h2 style={{
        fontSize:     22,
        fontWeight:   700,
        color:        '#111827',
        margin:       '0 0 8px',
        letterSpacing: '-0.025em',
      }}>
        Acesso restrito
      </h2>

      {/* Subtítulo */}
      <p style={{
        fontSize:   14,
        color:      '#6b7280',
        margin:     '0 0 20px',
        maxWidth:   380,
        lineHeight: 1.6,
      }}>
        {message ?? (
          <>
            Esta área não está disponível para o cargo <strong style={{ color:'#374151' }}>{roleLabel}</strong>.
            {requiredRole && (
              <> Acesso permitido a partir de <strong style={{ color:'#374151' }}>{getRoleLabel(requiredRole)}</strong>.</>
            )}
          </>
        )}
      </p>

      {/* Card de info */}
      <div style={{
        background:    '#f9fafb',
        border:        '1px solid #e5e7eb',
        borderRadius:  12,
        padding:       '14px 20px',
        marginBottom:  28,
        maxWidth:      340,
        width:         '100%',
      }}>
        <div style={{ fontSize:12, color:'#9ca3af', marginBottom:4, textTransform:'uppercase', letterSpacing:'.06em' }}>
          Seu cargo atual
        </div>
        <div style={{ fontSize:15, fontWeight:600, color:'#374151' }}>
          {roleLabel}
        </div>
        {user?.email && (
          <div style={{ fontSize:12, color:'#9ca3af', marginTop:4 }}>
            {user.email}
          </div>
        )}
      </div>

      {/* Botão voltar */}
      <button
        onClick={() => router.push('/dashboard/agenda')}
        style={{
          padding:      '10px 24px',
          borderRadius: 10,
          border:       'none',
          background:   'linear-gradient(135deg,#dc2626,#b91c1c)',
          color:        '#fff',
          fontSize:     13,
          fontWeight:   700,
          cursor:       'pointer',
          fontFamily:   'inherit',
          boxShadow:    '0 4px 12px rgba(220,38,38,0.25)',
        }}
      >
        Ir para minha agenda
      </button>
    </div>
  )
}
