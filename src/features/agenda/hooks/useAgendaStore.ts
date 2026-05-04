'use client'

import { create } from 'zustand'
import { AgendaBooking } from '../types'

interface CheckoutState {
  open: boolean
  mode: 'create' | 'edit'
  time: string | null
  professionalId: string | null
}

interface AgendaStore {
  selectedDate: Date
  setSelectedDate: (date: Date) => void

  checkout: CheckoutState
  openCreate: (time: string, professionalId: string) => void
  openEdit: (booking: AgendaBooking) => void
  closeCheckout: () => void

  bookings: AgendaBooking[]
  addBooking: (booking: AgendaBooking) => void
  updateBooking: (booking: AgendaBooking) => void
  removeBooking: (id: string) => void
}

export const useAgendaStore = create<AgendaStore>((set) => ({
  selectedDate: new Date(),
  setSelectedDate: (date) => set({ selectedDate: date }),

  checkout: { open: false, mode: 'create', time: null, professionalId: null },
  openCreate: (time, professionalId) =>
    set({ checkout: { open: true, mode: 'create', time, professionalId } }),
  openEdit: (booking) =>
    set({ checkout: { open: true, mode: 'edit', time: booking.start, professionalId: booking.professionalId } }),
  closeCheckout: () =>
    set({ checkout: { open: false, mode: 'create', time: null, professionalId: null } }),

  bookings: [],
  addBooking: (booking) =>
    set((s) => ({ bookings: [...s.bookings, booking] })),
  updateBooking: (booking) =>
    set((s) => ({ bookings: s.bookings.map((b) => b.id === booking.id ? booking : b) })),
  removeBooking: (id) =>
    set((s) => ({ bookings: s.bookings.filter((b) => b.id !== id) })),
}))
