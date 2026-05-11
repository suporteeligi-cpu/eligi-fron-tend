'use client'
// src/features/agenda/hooks/useAgendaStore.ts

import { create } from 'zustand'
import { AgendaBooking } from '../types'

interface CheckoutState {
  open:           boolean
  mode:           'create' | 'edit'
  time:           string | null
  professionalId: string | null
  booking:        AgendaBooking | null  // necessário para modo edit
}

interface AgendaStore {
  // ── Data ──
  selectedDate:    Date
  setSelectedDate: (date: Date) => void

  // ── Checkout panel ──
  checkout:      CheckoutState
  openCreate:    (time: string, professionalId: string) => void
  openEdit:      (booking: AgendaBooking) => void
  closeCheckout: () => void

  // ── Bookings ──
  bookings:      AgendaBooking[]
  setBookings:   (bookings: AgendaBooking[]) => void
  addBooking:    (booking: AgendaBooking) => void
  updateBooking: (booking: AgendaBooking) => void
  removeBooking: (id: string) => void
}

const CHECKOUT_CLOSED: CheckoutState = {
  open: false, mode: 'create', time: null, professionalId: null, booking: null,
}

export const useAgendaStore = create<AgendaStore>((set) => ({
  // ── Data ──
  selectedDate:    new Date(),
  setSelectedDate: (date) => set({ selectedDate: date }),

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

  // ── Bookings ──
  bookings: [],

  // Substitui tudo ao trocar de data
  setBookings: (bookings) => set({ bookings }),

  // Guard anti-duplicata: ignora se id já existe
  addBooking: (booking) =>
    set((s) => {
      if (s.bookings.some(b => b.id === booking.id)) return s
      return { bookings: [...s.bookings, booking] }
    }),

  // Upsert: atualiza se existe, insere se não existe
  updateBooking: (booking) =>
    set((s) => {
      const idx = s.bookings.findIndex(b => b.id === booking.id)
      if (idx === -1) return { bookings: [...s.bookings, booking] }
      const next = [...s.bookings]
      next[idx] = booking
      return { bookings: next }
    }),

  removeBooking: (id) =>
    set((s) => ({ bookings: s.bookings.filter(b => b.id !== id) })),
}))