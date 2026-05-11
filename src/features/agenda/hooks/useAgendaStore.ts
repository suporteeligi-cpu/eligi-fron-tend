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
  setBookings:   (bookings: AgendaBooking[]) => void
  addBooking:    (booking: AgendaBooking) => void
  updateBooking: (booking: AgendaBooking) => void
  removeBooking: (id: string) => void
}

export const useAgendaStore = create<AgendaStore>((set) => ({
  selectedDate: new Date(),
  setSelectedDate: (date) => set({ selectedDate: date }),

  checkout: { open:false, mode:'create', time:null, professionalId:null },
  openCreate: (time, professionalId) =>
    set({ checkout: { open:true, mode:'create', time, professionalId } }),
  openEdit: (booking) =>
    set({ checkout: { open:true, mode:'edit', time:booking.start, professionalId:booking.professionalId } }),
  closeCheckout: () =>
    set({ checkout: { open:false, mode:'create', time:null, professionalId:null } }),

  bookings: [],

  // Substitui a lista inteira — usado ao trocar de data
  setBookings: (bookings) => set({ bookings }),

  // Só insere se não existe (guard anti-duplicata)
  addBooking: (booking) =>
    set((s) => {
      if (s.bookings.some(b => b.id === booking.id)) return s
      return { bookings: [...s.bookings, booking] }
    }),

  // Upsert: atualiza se existe, insere se não existe
  updateBooking: (booking) =>
    set((s) => {
      const exists = s.bookings.some(b => b.id === booking.id)
      if (exists) return { bookings: s.bookings.map(b => b.id === booking.id ? booking : b) }
      return { bookings: [...s.bookings, booking] }
    }),

  removeBooking: (id) =>
    set((s) => ({ bookings: s.bookings.filter(b => b.id !== id) })),
}))