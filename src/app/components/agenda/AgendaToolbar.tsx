'use client'

interface Props {
  selectedDate: Date
  onDateChange: (date: Date) => void
}

export default function AgendaToolbar({
  selectedDate,
  onDateChange
}: Props) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px'
      }}
    >
      {/* BOTÃO HOJE */}
      <button
        onClick={() => onDateChange(new Date())}
        style={{
          padding: '6px 12px',
          borderRadius: 8,
          border: '1px solid #e5e7eb',
          background: '#fff',
          cursor: 'pointer'
        }}
      >
        Hoje
      </button>

      {/* DATA ATUAL */}
      <span
        style={{
          fontWeight: 500,
          fontSize: 14
        }}
      >
        {selectedDate.toDateString()}
      </span>
    </div>
  )
}