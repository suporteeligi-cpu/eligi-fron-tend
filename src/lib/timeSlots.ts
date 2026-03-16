export function generateTimeSlots() {
  const slots: string[] = []

  let hour = 8
  let minute = 0

  while (hour < 21) {
    const h = hour.toString().padStart(2, '0')
    const m = minute.toString().padStart(2, '0')

    slots.push(`${h}:${m}`)

    minute += 30

    if (minute === 60) {
      minute = 0
      hour++
    }
  }

  return slots
}
