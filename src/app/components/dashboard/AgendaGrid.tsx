'use client'

import { useEffect, useRef } from 'react'
import { generateTimeSlots } from '@/lib/timeSlots'
import { Booking } from '@/types/booking'
import { Professional } from '@/hooks/useProfessionals'
import AgendaProfessionalColumn from './AgendaProfessionalColumn'

interface Props {
  bookings: Booking[]
  professionals: Professional[]
  openCreateBookingModal: (time: string) => void
}

export default function AgendaGrid({
  bookings,
  professionals,
  openCreateBookingModal
}: Props) {
  const slots = generateTimeSlots()

  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const hour = new Date().getHours()

    const scroll = hour * 64

    containerRef.current?.scrollTo({
      top: scroll,
      behavior: 'smooth'
    })
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        maxHeight: '80vh',
        overflowY: 'auto'
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `80px repeat(${professionals.length}, 1fr)`,
          gap: 8
        }}
      >
        <div />

        {professionals.map((p) => (
          <div
            key={p.id}
            style={{
              fontWeight: 600
            }}
          >
            {p.name}
          </div>
        ))}

        {slots.map((slot) => (
          <div
            key={slot}
            style={{ display: 'contents' }}
          >
            <div
              style={{
                fontSize: 12,
                paddingTop: 8
              }}
            >
              {slot}
            </div>

            {professionals.map((p) => {
              const booking = bookings.find(
                (b) =>
                  b.time === slot &&
                  b.professional?.id === p.id
              )

              return (
                <AgendaProfessionalColumn
                  key={p.id + slot}
                  bookings={booking ? [booking] : []}
                  slots={[slot]}
                  openCreateBookingModal={
                    openCreateBookingModal
                  }
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}