'use client'

import { useMemo, useState } from 'react'

type Mode = 'create' | 'edit'

type Props = {
  open: boolean
  mode: Mode
  time: string | null
  professionalId: string | null
  onClose: () => void
}

type BookingStatus = 'CONFIRMED' | 'COMPLETED' | 'CANCELED'

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
  const [service, setService] = useState('')
  const [status, setStatus] = useState<BookingStatus>('CONFIRMED')

  /* =========================================
     RESET AUTOMÁTICO (via key do parent)
  ========================================= */

  const start = time || '10:00'

  const end = useMemo(() => {
    const [h, m] = start.split(':').map(Number)
    const date = new Date()
    date.setHours(h)
    date.setMinutes(m + 30)
    return date.toTimeString().slice(0, 5)
  }, [start])

  if (!open) return null

  /* =========================================
     HANDLERS
  ========================================= */

  function handleSave() {
    console.log({
      clientName,
      service,
      status,
      start,
      end,
      professionalId
    })

    onClose()
  }

  /* =========================================
     RENDER
  ========================================= */

  return (
    <div style={overlay}>
      <div style={panel}>
        {/* HEADER */}
        <div style={header}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>
            Novo agendamento
          </h2>

          <button onClick={onClose} style={closeBtn}>
            ✕
          </button>
        </div>

        {/* CLIENTE */}
        <div style={card}>
          <div style={avatar} />
          <input
            placeholder="Selecione um cliente ou deixe em branco"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            style={inputClean}
          />
        </div>

        {/* TABS */}
        <div style={tabs}>
          <span style={tabActive}>AGENDAMENTO</span>
          <span style={tab}>INFORMAÇÕES</span>
        </div>

        {/* DATA */}
        <div style={rowBetween}>
          <strong>Hoje</strong>
          <div style={chip}>Agende para + alguém</div>
        </div>

        {/* SERVIÇO */}
        <div style={selectBox}>
          {service || 'Selecione o serviço'}
        </div>

        {/* HORÁRIOS */}
        <div style={row}>
          <div style={field}>
            <label>Início</label>
            <div style={inputBox}>{start}</div>
          </div>

          <div style={field}>
            <label>Fim</label>
            <div style={inputBox}>{end}</div>
          </div>
        </div>

        {/* FUNCIONÁRIO / RECURSO */}
        <div style={row}>
          <div style={field}>
            <label>Funcionário</label>
            <div style={inputBox}>
              {professionalId || 'Qualquer'}
            </div>
          </div>

          <div style={field}>
            <label>Recurso</label>
            <div style={inputBox}>Sem recurso</div>
          </div>
        </div>

        {/* ADD SERVICE */}
        <div style={addService}>
          + Adicionar outro serviço
        </div>

        {/* TOTAL */}
        <div style={total}>
          <div>
            <span>Total</span>
            <strong>R$ 0,00</strong>
          </div>

          <div>
            <span>A pagar</span>
            <strong>R$ 0,00</strong>
          </div>
        </div>

        {/* FOOTER */}
        <div style={footer}>
          <button style={btnGhost} onClick={onClose}>
            Descartar
          </button>

          <button style={btnPrimary} onClick={handleSave}>
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}

/* =========================================
   STYLES (ELIGI STYLE)
========================================= */

const overlay = {
  position: 'fixed' as const,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  background: 'rgba(0,0,0,0.25)',
  display: 'flex',
  justifyContent: 'flex-end',
  zIndex: 999
}

const panel = {
  width: 420,
  height: '100%',
  background: '#fff',
  display: 'flex',
  flexDirection: 'column' as const,
  padding: 20,
  gap: 16,
  boxShadow: '-10px 0 40px rgba(0,0,0,0.1)'
}

const header = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}

const closeBtn = {
  border: 'none',
  background: 'transparent',
  cursor: 'pointer'
}

const card = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: 12,
  border: '1px solid #eee',
  borderRadius: 12
}

const avatar = {
  width: 36,
  height: 36,
  borderRadius: '50%',
  background: '#eee'
}

const inputClean = {
  border: 'none',
  outline: 'none',
  flex: 1
}

const tabs = {
  display: 'flex',
  gap: 20,
  fontSize: 13
}

const tabActive = {
  fontWeight: 600,
  borderBottom: '2px solid #111'
}

const tab = {
  opacity: 0.6
}

const rowBetween = {
  display: 'flex',
  justifyContent: 'space-between'
}

const chip = {
  background: '#f3f4f6',
  padding: '4px 10px',
  borderRadius: 20,
  fontSize: 12
}

const selectBox = {
  padding: 12,
  border: '1px solid #eee',
  borderRadius: 12
}

const row = {
  display: 'flex',
  gap: 10
}

const field = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 4
}

const inputBox = {
  padding: 10,
  border: '1px solid #eee',
  borderRadius: 10
}

const addService = {
  color: '#dc2626',
  fontWeight: 500,
  cursor: 'pointer'
}

const total = {
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: 'auto'
}

const footer = {
  display: 'flex',
  gap: 10
}

const btnPrimary = {
  flex: 1,
  background: '#dc2626',
  color: '#fff',
  border: 'none',
  padding: 12,
  borderRadius: 10,
  cursor: 'pointer'
}

const btnGhost = {
  flex: 1,
  background: 'transparent',
  border: '1px solid #ddd',
  padding: 12,
  borderRadius: 10,
  cursor: 'pointer'
}