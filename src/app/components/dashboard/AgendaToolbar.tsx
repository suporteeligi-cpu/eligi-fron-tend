'use client'

interface Props {
  date: string
  setDate: (d: string) => void
}

export default function AgendaToolbar({
  date,
  setDate
}: Props) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 20
      }}
    >
      <input
        type="date"
        value={date}
        onChange={(e) =>
          setDate(e.target.value)
        }
      />

      <button
        style={{
          background: '#dc2626',
          color: '#fff',
          padding: '8px 14px',
          borderRadius: 8
        }}
      >
        Novo agendamento
      </button>
    </div>
  )
}