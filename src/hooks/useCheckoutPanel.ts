'use client'

import { useState, useCallback } from 'react'
import { AgendaBooking } from '@/types/agenda'

type Mode = 'create' | 'edit'

interface CheckoutState {
  open: boolean
  mode: Mode
  booking: AgendaBooking | null
  time: string | null
  professionalId: string | null
}

export function useCheckoutPanel() {
  const [state, setState] = useState<CheckoutState>({
    open: false,
    mode: 'create',
    booking: null,
    time: null,
    professionalId: null
  })

  const openCreate = useCallback(
    (time: string, professionalId: string) => {
      setState({
        open: true,
        mode: 'create',
        booking: null,
        time,
        professionalId
      })
    },
    []
  )

  const openEdit = useCallback((booking: AgendaBooking) => {
    setState({
      open: true,
      mode: 'edit',
      booking,
      time: booking.start,
      professionalId: booking.professionalId || null
    })
  }, [])

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }))
  }, [])

  return {
    ...state,
    openCreate,
    openEdit,
    close
  }
}