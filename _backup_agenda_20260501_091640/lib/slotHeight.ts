export const SLOT_HEIGHT = 64

export function durationToHeight(duration?: number) {
  if (!duration) return SLOT_HEIGHT

  const ratio = duration / 30
  return SLOT_HEIGHT * ratio
}
