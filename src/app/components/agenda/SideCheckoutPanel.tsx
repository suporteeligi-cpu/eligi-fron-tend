'use client'

import { useState } from 'react'
import dayjs from 'dayjs'
import { createBooking } from '../services/bookings'
import { BookingStatus } from '@/types/agenda'

/* =========================================
   TYPES
========================================= */

type Service = {
  id: string
  name: string
  duration: number
}

interface Props {
  open: boolean
  mode: 'create' | 'edit'
  time: string | null
  professionalId: string | null
  onClose: () => void
}

/* =========================================
   COMPONENT
========================================= */

export default function SideCheckoutPanel({
  open,
  mode,
  time,
  professionalId,
  onClose
}: Props) {
  /* =========================================
     STATE
  ========================================= */

  const [clientName, setClientName] = useState('')
  const [selectedService, setSelectedService] = useState<Service | null>(null)

  const [status, setStatus] = useState<BookingStatus>('CONFIRMED')
  const [loading, setLoading] = useState(false)

  /* =========================================
     HANDLE SAVE (PROFISSIONAL)
  ========================================= */

  async function handleSave() {
    try {
      if (!professionalId || !time || !selectedService) {
        console.warn('Dados incompletos')
        return
      }

      setLoading(true)

      await createBooking({
        clientName,
        serviceId: selectedService.id,
        professionalId,
        date: dayjs().format('YYYY-MM-DD'),
        time
      })

      onClose()
    } catch (err) {
      console.error('Erro ao criar booking', err)
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <>
      {/* OVERLAY */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.2)',
          backdropFilter: 'blur(4px)',
          zIndex: 9998
        }}
      />

      {/* PANEL */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 420,
          height: '100%',
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(20px)',
          boxShadow: '-10px 0 40px rgba(0,0,0,0.15)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 250ms ease',
          zIndex: 9999,
          padding: 20,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <h2 style={{ marginBottom: 20 }}>
          {mode === 'create' ? 'Novo Agendamento' : 'Editar Agendamento'}
        </h2>

        {/* INFO */}
        <p><strong>Horário:</strong> {time}</p>
        <p><strong>Profissional:</strong> {professionalId}</p>

        {/* CLIENTE */}
        <input
          placeholder='Nome do cliente'
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          style={{
            marginTop: 10,
            padding: 12,
            borderRadius: 10,
            border: '1px solid #ddd'
          }}
        />

        {/* SERVIÇO (TEMPORÁRIO MOCK) */}
        <div style={{ marginTop: 15 }}>
          <p style={{ fontSize: 12, marginBottom: 5 }}>Serviço</p>

          {/* ⚠️ Aqui depois vira SELECT real vindo do backend */}
          <button
            onClick={() =>
              setSelectedService({
                id: '1',
                name: 'Corte',
                duration: 30
              })
            }
            style={{
              width: '100%',
              padding: 12,
              borderRadius: 10,
              border: '1px solid #ddd',
              textAlign: 'left',
              background: '#fff'
            }}
          >
            {selectedService
              ? `${selectedService.name} (${selectedService.duration}min)`
              : 'Selecionar serviço'}
          </button>
        </div>

        {/* STATUS */}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as BookingStatus)}
          style={{
            marginTop: 15,
            padding: 12,
            borderRadius: 10,
            border: '1px solid #ddd'
          }}
        >
          <option value='CONFIRMED'>Confirmado</option>
          <option value='COMPLETED'>Concluído</option>
          <option value='CANCELED'>Cancelado</option>
        </select>

        {/* ACTIONS */}
        <div style={{ marginTop: 'auto' }}>
          <button
            onClick={handleSave}
            disabled={loading || !selectedService}
            style={{
              width: '100%',
              padding: 14,
              background: '#dc2626',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontWeight: 600,
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading
              ? 'Salvando...'
              : mode === 'create'
              ? 'Confirmar'
              : 'Atualizar'}
          </button>

          <button
            onClick={onClose}
            style={{
              marginTop: 10,
              width: '100%',
              padding: 12,
              background: '#eee',
              borderRadius: 12,
              border: 'none'
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </>
  )
}