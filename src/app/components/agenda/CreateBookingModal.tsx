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
  professionalId
}: Props) {
  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}
    >
      <div
        style={{
          background: '#fff',
          padding: 20,
          borderRadius: 12,
          width: 320
        }}
      >
        <h3>Novo agendamento</h3>

        <p><strong>Horário:</strong> {time}</p>
        <p><strong>Profissional:</strong> {professionalId}</p>

        <button
          onClick={onClose}
          style={{
            marginTop: 10,
            width: '100%',
            padding: 10,
            background: '#dc2626',
            color: '#fff',
            border: 'none',
            borderRadius: 8
          }}
        >
          Fechar
        </button>
      </div>
    </div>
  )
}