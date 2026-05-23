// src/features/agenda/utils/time.ts
// Helpers de tempo. Inputs sempre em formato "HH:mm".

import { SLOT_STEP } from '../constants'

/** "13:45" → 825 */
export function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

/** 825 → "13:45" */
export function minutesToTime(min: number): string {
  const safe = Math.max(0, Math.min(24 * 60, Math.round(min)))
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`
}

/** Arredonda minutos ao múltiplo mais próximo de SLOT_STEP */
export function snapToSlot(min: number, step = SLOT_STEP): number {
  return Math.round(min / step) * step
}

/** Adiciona minutos a um horário "HH:mm" */
export function addMin(t: string, min: number): string {
  return minutesToTime(toMinutes(t) + min)
}

/** Gera array de strings "HH:mm" de SLOT_STEP em SLOT_STEP minutos */
export function buildSlots(startHour: number, endHour: number, step = SLOT_STEP): string[] {
  const out: string[] = []
  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += step) {
      out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return out
}

/** Gera array de horários de meia em meia hora (mobile) */
export function buildHalfSlots(startHour: number, endHour: number): string[] {
  const out: string[] = []
  for (let h = startHour; h < endHour; h++) {
    out.push(`${String(h).padStart(2, '0')}:00`)
    out.push(`${String(h).padStart(2, '0')}:30`)
  }
  return out
}

/**
 * Calcula a janela visível da grade com base no horário de funcionamento.
 * Adiciona 1h de folga antes/depois do expediente para o usuário visualizar.
 */
export function computeGridRange(
  workingHours: { open: boolean; startTime: string; endTime: string } | undefined,
  fallback: { startHour: number; endHour: number },
): { startHour: number; endHour: number; startMin: number } {
  if (workingHours?.open) {
    const startHour = Math.max(0,  Math.floor(toMinutes(workingHours.startTime) / 60) - 1)
    const endHour   = Math.min(24, Math.floor(toMinutes(workingHours.endTime)   / 60) + 1)
    return { startHour, endHour, startMin: startHour * 60 }
  }
  return { startHour: fallback.startHour, endHour: fallback.endHour, startMin: fallback.startHour * 60 }
}
