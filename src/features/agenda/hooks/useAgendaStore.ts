'use client'
// src/features/agenda/hooks/useAgendaStore.ts

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { AgendaBooking, AgendaBlock } from '../types'

interface CheckoutState {
  open:           boolean
  mode:           'create' | 'edit'
  time:           string | null
  professionalId: string | null
  booking:        AgendaBooking | null
}

// Preview — ghost na grade enquanto o checkout está aberto
export interface PreviewState {
  active:         boolean
  date:           string
  time:           string
  professionalId: string
  duration:       number
  serviceName?:   string
  serviceColor?:  string
  clientName?:    string   // nome do cliente ou 'Avulso'
  allItems?:      Array<{
    startTime:   string
    endTime:     string
    duration:    number
    serviceName: string
    profId:      string
    clientName?: string
  }>
}

interface AgendaStore {
  // ── Data ──
  selectedDate:    Date
  setSelectedDate: (date: Date) => void

  // ── Bookings por data ──
  bookingsByDate:     Record<string, AgendaBooking[]>
  setBookingsForDate: (date: string, bookings: AgendaBooking[]) => void
  addBooking:         (date: string, booking: AgendaBooking) => void
  updateBooking:      (date: string, booking: AgendaBooking) => void
  removeBooking:      (date: string, id: string) => void
  getBookingsForDate: (date: string) => AgendaBooking[]

  // ── Bloqueios por data ──
  blocksByDate:     Record<string, AgendaBlock[]>
  setBlocksForDate: (date: string, blocks: AgendaBlock[]) => void
  addBlock:         (date: string, block: AgendaBlock) => void
  removeBlock:      (date: string, id: string) => void
  getBlocksForDate: (date: string) => AgendaBlock[]

  // ── Checkout ──
  checkout:      CheckoutState
  openCreate:    (time: string, professionalId: string) => void
  openEdit:      (booking: AgendaBooking) => void
  closeCheckout: () => void

  // ── Preview (ghost na grade) ──
  preview:       PreviewState | null
  setPreview:    (p: PreviewState | null) => void
}

const CHECKOUT_CLOSED: CheckoutState = {
  open: false, mode: 'create', time: null, professionalId: null, booking: null,
}

export const useAgendaStore = create<AgendaStore>()(
  persist(
    (set, get) => ({
      // ── Data ──
      selectedDate:    new Date(),
      setSelectedDate: (date) => set({ selectedDate: date }),

      // ── Bookings ──
      bookingsByDate: {},

      getBookingsForDate: (date) => get().bookingsByDate[date] ?? [],

      setBookingsForDate: (date, bookings) =>
        set(s => ({ bookingsByDate: { ...s.bookingsByDate, [date]: bookings } })),

      addBooking: (date, booking) =>
        set(s => {
          const cur = s.bookingsByDate[date] ?? []
          if (cur.some(b => b.id === booking.id)) return s
          return { bookingsByDate: { ...s.bookingsByDate, [date]: [...cur, booking] } }
        }),

      updateBooking: (date, booking) =>
        set(s => {
          const cur = s.bookingsByDate[date] ?? []
          const idx = cur.findIndex(b => b.id === booking.id)
          const next = idx === -1 ? [...cur, booking] : cur.map((b, i) => i === idx ? booking : b)
          return { bookingsByDate: { ...s.bookingsByDate, [date]: next } }
        }),

      removeBooking: (date, id) =>
        set(s => ({
          bookingsByDate: {
            ...s.bookingsByDate,
            [date]: (s.bookingsByDate[date] ?? []).filter(b => b.id !== id),
          },
        })),

      // ── Blocks ──
      blocksByDate: {},

      getBlocksForDate: (date) => get().blocksByDate[date] ?? [],

      setBlocksForDate: (date, blocks) =>
        set(s => ({ blocksByDate: { ...s.blocksByDate, [date]: blocks } })),

      addBlock: (date, block) =>
        set(s => {
          const cur = s.blocksByDate[date] ?? []
          if (cur.some(b => b.id === block.id)) return s
          return { blocksByDate: { ...s.blocksByDate, [date]: [...cur, block] } }
        }),

      removeBlock: (date, id) =>
        set(s => ({
          blocksByDate: {
            ...s.blocksByDate,
            [date]: (s.blocksByDate[date] ?? []).filter(b => b.id !== id),
          },
        })),

      // ── Checkout ──
      checkout: CHECKOUT_CLOSED,

      openCreate: (time, professionalId) =>
        set({ checkout: { open: true, mode: 'create', time, professionalId, booking: null } }),

      openEdit: (booking) =>
        set({
          checkout: {
            open: true, mode: 'edit',
            time: booking.start,
            professionalId: booking.professionalId,
            booking,
          },
        }),

      closeCheckout: () => set({ checkout: CHECKOUT_CLOSED, preview: null }),

      // ── Preview ──
      preview: null,
      setPreview: (p) => set({ preview: p }),
    }),
    {
      name:    'eligi-agenda',
      storage: createJSONStorage(() => sessionStorage),
      partialize: s => ({
        selectedDate:   s.selectedDate,
        bookingsByDate: s.bookingsByDate,
        blocksByDate:   s.blocksByDate,
      }),
    }
  )
)