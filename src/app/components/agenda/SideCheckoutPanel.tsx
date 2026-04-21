'use client'

import { useState } from 'react'
import { BookingStatus } from '@/types/agenda'
import api from '@/lib/apiClient'

/* =========================================
   TYPES
========================================= */

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
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [service, setService] = useState('')
  const [status, setStatus] = useState<BookingStatus>('CONFIRMED')

  /* =========================================
     ACTION
  ========================================= */

  async function handleSave() {
    try {
      if (!time || !professionalId) return

      await api.post('/bookings/confirm', {
        serviceId: service, // ⚠️ depois vamos trocar por ID real
        clientName,
        clientPhone,
        clientEmail,
        professionalId,
        time,
        date: new Date().toISOString().split('T')[0]
      })

      onClose()
    } catch (error) {
      console.error('Erro ao salvar booking', error)
    }
  }

  /* =========================================
     RENDER
  ========================================= */

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
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'all 200ms ease'
        }}
      />

      {/* PANEL */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 380,
          height: '100%',
          background: 'rgba(255,255,255,0.8)',
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
        {/* HEADER */}
        <h2 style={{ marginBottom: 20 }}>
          {mode === 'create' ? 'Novo Agendamento' : 'Editar Agendamento'}
        </h2>

        {/* INFO */}
        <p>
          <strong>Horário:</strong> {time}
        </p>

        <p>
          <strong>Profissional:</strong> {professionalId}
        </p>

        {/* CLIENTE */}
        <input
          placeholder='Cliente'
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          style={{ marginTop: 10 }}
        />

        {/* TELEFONE (OBRIGATÓRIO) */}
        <input
          placeholder='Telefone'
          value={clientPhone}
          onChange={(e) => setClientPhone(e.target.value)}
          style={{ marginTop: 10 }}
        />

        {/* EMAIL */}
        <input
          placeholder='Email'
          value={clientEmail}
          onChange={(e) => setClientEmail(e.target.value)}
          style={{ marginTop: 10 }}
        />

        {/* SERVIÇO */}
        <input
          placeholder='Serviço'
          value={service}
          onChange={(e) => setService(e.target.value)}
          style={{ marginTop: 10 }}
        />

        {/* STATUS */}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as BookingStatus)}
          style={{ marginTop: 10 }}
        >
          <option value='CONFIRMED'>Confirmado</option>
          <option value='COMPLETED'>Concluído</option>
          <option value='CANCELED'>Cancelado</option>
        </select>

        {/* ACTION */}
        <button
          onClick={handleSave}
          style={{
            marginTop: 'auto',
            background: '#dc2626',
            color: '#fff',
            border: 'none',
            padding: '12px',
            borderRadius: '10px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {mode === 'create' ? 'Confirmar' : 'Atualizar'}
        </button>
      </div>
    </>
  )
}