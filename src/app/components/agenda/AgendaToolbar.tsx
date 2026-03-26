'use client'

interface Props {
  date: string
  setDate: (date: string) => void
}

export default function AgendaToolbar({ date, setDate }: Props) {
  return (
    <input
      type='date'
      value={date}
      onChange={e => setDate(e.target.value)}
    />
  )
}