'use client'

interface Props {
  open: boolean
  onClose: () => void
  time: string | null
  professionalId: string | null
}

export default function CreateBookingModal({
  open,
  onClose,
  time,
  professionalId,
}: Props) {
  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.18)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp {
          from { opacity:0; transform:translateY(12px) scale(0.97) }
          to   { opacity:1; transform:translateY(0) scale(1) }
        }
      `}</style>

      <div
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          padding: '24px 24px 20px',
          borderRadius: 20,
          width: 300,
          border: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.13)',
          fontFamily: '-apple-system, "SF Pro Display", system-ui, sans-serif',
          animation: 'slideUp 0.22s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {/* header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 700,
              color: '#111827',
              letterSpacing: '-0.3px',
            }}
          >
            Novo agendamento
          </h3>
          <button
            onClick={onClose}
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              border: '1px solid rgba(0,0,0,0.09)',
              background: 'rgba(0,0,0,0.04)',
              cursor: 'pointer',
              fontSize: 12,
              color: 'rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* info */}
        <div
          style={{
            background: 'rgba(0,0,0,0.03)',
            border: '1px solid rgba(0,0,0,0.07)',
            borderRadius: 12,
            padding: '12px 14px',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: 'rgba(0,0,0,0.4)',
              marginBottom: 4,
              fontWeight: 500,
            }}
          >
            Horário selecionado
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>
            {time ?? '—'}
          </div>
          {professionalId && (
            <div
              style={{
                fontSize: 12,
                color: 'rgba(0,0,0,0.38)',
                marginTop: 2,
              }}
            >
              Profissional: {professionalId}
            </div>
          )}
        </div>

        {/* close */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '12px',
            background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(220,38,38,0.25)',
            fontFamily: '-apple-system, system-ui, sans-serif',
          }}
        >
          Fechar
        </button>
      </div>
    </div>
  )
}