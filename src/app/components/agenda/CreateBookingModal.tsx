'use client'

import { useState, useEffect } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  time: string | null
  professionalId: string | null
}

export default function CreateBookingModal({
  open,
  onClose,
  time,
  professionalId
}: Props) {
  const [clientName, setClientName] = useState('')
  const [serviceName, setServiceName] = useState('')

  useEffect(() => {
    if (open) {
      console.log('MODAL ABERTO', time, professionalId)
    }
  }, [open])

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999 // 🔥 MUITO IMPORTANTE
      }}
    >
      <div
        style={{
          width: 400,
          background: '#fff',
          borderRadius: 16,
          padding: 20,
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          position: 'relative'
        }}
      >
        <h2 style={{ marginBottom: 16 }}>
          Novo Agendamento
        </h2>

        <p style={{ fontSize: 12, marginBottom: 10 }}>
          Horário: <strong>{time}</strong>
        </p>

        <input
          placeholder='Nome do cliente'
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          style={{
            width: '100%',
            marginBottom: 10,
            padding: 10,
            borderRadius: 8,
            border: '1px solid #ddd'
          }}
        />

        <input
          placeholder='Serviço'
          value={serviceName}
          onChange={(e) => setServiceName(e.target.value)}
          style={{
            width: '100%',
            marginBottom: 20,
            padding: 10,
            borderRadius: 8,
            border: '1px solid #ddd'
          }}
        />

        <button
          onClick={() => {
            console.log({
              clientName,
              serviceName,
              time,
              professionalId
            })

            onClose()
          }}
          style={{
            width: '100%',
            padding: 12,
            background: '#dc2626',
            color: '#fff',
            borderRadius: 10,
            border: 'none',
            fontWeight: 600
          }}
        >
          Salvar
        </button>

        {/* BOTÃO FECHAR */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            border: 'none',
            background: 'transparent',
            fontSize: 18,
            cursor: 'pointer'
          }}
        >
          ✕
        </button>
      </div>
    </div>
  )
}