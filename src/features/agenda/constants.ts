// src/features/agenda/constants.ts
// Constantes globais do módulo agenda — fonte única.
// NÃO duplicar estes valores em outros arquivos.

// ─── Grade ────────────────────────────────────────────────────────────────────
export const SLOT_STEP   = 5                  // minutos por slot
export const MIN_DUR     = 5                  // duração mínima de booking/resize

// Desktop / iPad — slots de 5min com altura fixa
export const SLOT_H      = 10                 // px por slot de 5min (desktop/iPad)
export const PX_PER_MIN  = SLOT_H / SLOT_STEP // 2px/min

// Mobile — slots maiores para toque confortável
export const MOBILE_ROW_H       = 56          // px por meio-slot de 30min
export const MOBILE_PX_PER_MIN  = MOBILE_ROW_H / 30 // ~1.87px/min

// ─── Layout ───────────────────────────────────────────────────────────────────
export const MIN_CARD_H_DESKTOP = 14          // permite estado MICRO em 5-7min
export const MIN_CARD_H_MOBILE  = 14          // idem mobile
export const HEADER_H_FALLBACK  = 56          // se theme não estiver disponível

// ─── Interação ────────────────────────────────────────────────────────────────
export const DRAG_THRESHOLD_PX  = 4           // mouse movimento mínimo p/ ser "drag"
export const TOUCH_CANCEL_PX    = 8           // touch movimento que cancela long-press / tap
export const LONG_PRESS_MS      = 420         // tempo de long-press p/ ativar drag
export const VIBRATE_DRAG_MS    = 40          // duração da vibração ao iniciar drag
export const VIBRATE_RESIZE_MS  = 30          // duração da vibração ao iniciar resize

// ─── Default working hours fallback ──────────────────────────────────────────
export const DEFAULT_START_HOUR_DESKTOP = 8
export const DEFAULT_END_HOUR_DESKTOP   = 20
export const DEFAULT_START_HOUR_MOBILE  = 7
export const DEFAULT_END_HOUR_MOBILE    = 21

// ─── Z-index hierarchy ───────────────────────────────────────────────────────
export const Z = {
  gridBase:        5,
  offHoursOverlay: 6,
  block:           7,
  booking:         8,
  preview:         9,
  currentTime:     15,
  headerSticky:    20,
  ghostFixed:      9997,
  overlay:         9998,
  modal:           9999,
  ghostTouch:      99999,
} as const

// ─── Easings premium ─────────────────────────────────────────────────────────
export const EASE = {
  spring:  'cubic-bezier(0.34, 1.56, 0.64, 1)',
  smooth:  'cubic-bezier(0.4, 0, 0.2, 1)',
  sheet:   'cubic-bezier(0.34, 1.2, 0.64, 1)',
} as const
