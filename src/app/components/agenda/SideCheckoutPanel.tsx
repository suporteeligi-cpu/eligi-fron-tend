'use client'

import { useState, useEffect } from 'react'
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

interface Service {
  id: string
  name: string
  duration: number
  price?: number
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

  const [serviceId, setServiceId] = useState('')
  const [services, setServices] = useState<Service[]>([])

  const [status, setStatus] = useState<BookingStatus>('CONFIRMED')
  const [loading, setLoading] = useState(false)

  /* =========================================
     LOAD SERVICES
  ========================================= */

  useEffect(() => {
    async function loadServices() {
      try {
        const res = await api.get<Service[]>('/services')
        setServices(res.data)
      } catch (err) {
        console.error('Erro ao carregar serviços', err)
      }
    }

    if (open) {
      loadServices()
    }
  }, [open])

  /* =========================================
     SAVE
  ========================================= */

  async function handleSave() {
    try {
      if (!time || !professionalId) return

      if (!serviceId) {
        alert('Selecione um serviço')
        return
      }

      if (!clientName || !clientPhone) {
        alert('Preencha nome e telefone')
        return
      }

      setLoading(true)

      await api.post('/bookings/confirm', {
        serviceId,
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
    } finally {
      setLoading(false)
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
        {/* HEADER */}
        <h2 style={{ marginBottom: 20 }}>
          {mode === 'create' ? 'Novo Agendamento' : 'Editar Agendamento'}
        </h2>

        {/* INFO */}
        <p><strong>Horário:</strong> {time}</p>
        <p><strong>Profissional:</strong> {professionalId}</p>

        {/* CLIENTE */}
        <input
          placeholder='Cliente'
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          style={{ marginTop: 10 }}
        />

        {/* TELEFONE */}
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

        {/* SERVIÇO (🔥 AGORA REAL) */}
        <select
          value={serviceId}
          onChange={(e) => setServiceId(e.target.value)}
          style={{ marginTop: 10 }}
        >
          <option value=''>Selecione um serviço</option>

          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.duration}min)
            </option>
          ))}
        </select>

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
          disabled={loading}
          style={{
            marginTop: 'auto',
            background: loading ? '#9ca3af' : '#dc2626',
            color: '#fff',
            border: 'none',
            padding: '12px',
            borderRadius: '10px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading
            ? 'Salvando...'
            : mode === 'create'
            ? 'Confirmar'
            : 'Atualizar'}
        </button>
      </div>
    </>
  )
}