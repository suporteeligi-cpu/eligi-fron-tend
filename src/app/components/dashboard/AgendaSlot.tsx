'use client'

import { Booking } from '@/types/booking'

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
  return (
    <div
      onClick={() => {
        if (!booking) {
          openCreateBookingModal(time)
        }
      }}
      style={{
        minHeight: 64,
        borderRadius: 12,
        border: '1px solid #eee',
        padding: 10,
        cursor: booking ? 'default' : 'pointer',
        background: booking ? '#fff1f2' : '#fafafa'
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

          <div style={{ fontSize: 12, color: '#666' }}>
            {booking.professional?.name}
          </div>
        </>
      )}
    </div>
  )
}