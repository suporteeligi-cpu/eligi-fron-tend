export const SLOT_MINUTES = 30
export const SLOT_HEIGHT = 72

export function generateTimeSlots() {
  const slots: string[] = []

  let hour = 8
  let minute = 0

  while (hour < 21) {
    const h = hour.toString().padStart(2, '0')
    const m = minute.toString().padStart(2, '0')

    slots.push(`${h}:${m}`)

    minute += SLOT_MINUTES

    if (minute === 60) {
      minute = 0
      hour++
    }
  }

  return slots
}