'use client'

import { Booking } from '@/types/booking'
import { durationToHeight } from '@/lib/slotHeight'

interface Props {
  time: string
  booking?: Booking
  openCreateBookingModal: (time: string) => void
}

export default function AgendaSlot({
  time,
  booking,
  openCreateBookingModal
}: Props) {
  const height = booking
    ? durationToHeight(
        booking.service?.duration || booking.duration
      )
    : 64

  const bg = booking
    ? booking.service?.color || '#fee2e2'
    : '#fafafa'

  return (
    <div
      onClick={() => {
        if (!booking) {
          openCreateBookingModal(time)
        }
      }}
      style={{
        height,
        borderRadius: 12,
        border: '1px solid #eee',
        padding: 10,
        cursor: booking ? 'default' : 'pointer',
        background: bg,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: '#888',
          marginBottom: 4
        }}
      >
        {time}
      </div>

      {!booking && (
        <div style={{ fontSize: 12, color: '#aaa' }}>
          horário livre
        </div>
      )}

      {booking && (
        <>
          <div style={{ fontWeight: 600 }}>
            {booking.service?.name}
          </div>

          <div style={{ fontSize: 13 }}>
            {booking.clientName}
          </div>

          <div style={{ fontSize: 12, color: '#555' }}>
            {booking.professional?.name}
          </div>
        </>
      )}
    </div>
  )
}