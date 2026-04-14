'use client'

export default function AgendaToolbar({
  selectedDate,
  onDateChange
}: {
  selectedDate: Date
  onDateChange: (d: Date) => void
}) {
  return (
    <div style={{ padding: 10 }}>
      <input
        type="date"
        value={selectedDate.toISOString().slice(0, 10)}
        onChange={(e) => onDateChange(new Date(e.target.value))}
      />
    </div>
  )
}