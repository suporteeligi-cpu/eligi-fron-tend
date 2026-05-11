'use client'
// src/features/agenda/hooks/useAgendaStore.ts

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { AgendaBooking } from '../types'

interface CheckoutState {
  open:           boolean
  mode:           'create' | 'edit'
  time:           string | null
  professionalId: string | null
  booking:        AgendaBooking | null
}

interface AgendaStore {
  // ── Data selecionada ──
  selectedDate:    Date
  setSelectedDate: (date: Date) => void

  // ── Cache de bookings por data "YYYY-MM-DD" ──
  // Cada chave é uma data; assim bookings de dias diferentes nunca se misturam
  bookingsByDate:    Record<string, AgendaBooking[]>
  setBookingsForDate:(date: string, bookings: AgendaBooking[]) => void
  addBooking:        (date: string, booking: AgendaBooking) => void
  updateBooking:     (date: string, booking: AgendaBooking) => void
  removeBooking:     (date: string, id: string) => void
  getBookingsForDate:(date: string) => AgendaBooking[]

  // ── Checkout panel ──
  checkout:      CheckoutState
  openCreate:    (time: string, professionalId: string) => void
  openEdit:      (booking: AgendaBooking) => void
  closeCheckout: () => void
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

      // ── Bookings por data ──
      bookingsByDate: {},

      getBookingsForDate: (date) => get().bookingsByDate[date] ?? [],

      setBookingsForDate: (date, bookings) =>
        set((s) => ({
          bookingsByDate: { ...s.bookingsByDate, [date]: bookings },
        })),

      addBooking: (date, booking) =>
        set((s) => {
          const current = s.bookingsByDate[date] ?? []
          // Guard anti-duplicata
          if (current.some(b => b.id === booking.id)) return s
          return { bookingsByDate: { ...s.bookingsByDate, [date]: [...current, booking] } }
        }),

      updateBooking: (date, booking) =>
        set((s) => {
          const current = s.bookingsByDate[date] ?? []
          const idx = current.findIndex(b => b.id === booking.id)
          const next = idx === -1
            ? [...current, booking]
            : current.map((b, i) => i === idx ? booking : b)
          return { bookingsByDate: { ...s.bookingsByDate, [date]: next } }
        }),

      removeBooking: (date, id) =>
        set((s) => {
          const current = s.bookingsByDate[date] ?? []
          return { bookingsByDate: { ...s.bookingsByDate, [date]: current.filter(b => b.id !== id) } }
        }),

      // ── Checkout ──
      checkout: CHECKOUT_CLOSED,

      openCreate: (time, professionalId) =>
        set({ checkout: { open: true, mode: 'create', time, professionalId, booking: null } }),

      openEdit: (booking) =>
        set({ checkout: {
          open: true, mode: 'edit',
          time: booking.start,
          professionalId: booking.professionalId,
          booking,
        }}),

      closeCheckout: () => set({ checkout: CHECKOUT_CLOSED }),
    }),
    {
      name:    'eligi-agenda',
      storage: createJSONStorage(() => sessionStorage), // sessionStorage: persiste na aba, limpa ao fechar
      partialize: (s) => ({
        selectedDate:   s.selectedDate,
        bookingsByDate: s.bookingsByDate,
      }),
    }
  )
)