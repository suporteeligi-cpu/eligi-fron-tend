'use client'

import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import api from '@/lib/apiClient'

dayjs.extend(utc)
import { Professional } from './AgendaBoard'

/* =========================================
   TYPES
========================================= */

type Service = {
  id: string
  name: string
  duration: number
  price?: number
}

interface Props {
  open: boolean
  mode: 'create' | 'edit'
  time: string | null
  professionalId: string | null
  professionals: Professional[]
  selectedDate: Date
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
  professionals,
  selectedDate,
  onClose
}: Props) {
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const profName = professionals.find(p => p.id === professionalId)?.name ?? 'Profissional'

  /* =========================================
     LOAD SERVICES FROM BACKEND
  ========================================= */

  useEffect(() => {
    if (!open) return
    setLoading(true)
    api.get<{ data: Service[] }>('/services')
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : res.data?.data ?? []
        setServices(list)
      })
      .catch(() => setServices([]))
      .finally(() => setLoading(false))
  }, [open])

  /* =========================================
     RESET on open
  ========================================= */

  useEffect(() => {
    if (open) {
      setClientName('')
      setClientPhone('')
      setSelectedService(null)
      setError(null)
    }
  }, [open])

  /* =========================================
     SAVE
  ========================================= */

  async function handleSave() {
    if (!professionalId || !time || !selectedService || !clientName.trim()) {
      setError('Preencha todos os campos obrigatórios.')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const dateStr = dayjs(selectedDate).format('YYYY-MM-DD')
      const startAt = dayjs.utc(`${dateStr} ${time}`).toISOString()

      await api.post('/bookings', {
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim() || undefined,
        serviceId: selectedService.id,
        professionalId,
        startAt
      })

      onClose()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })
          ?.response?.data?.error ?? 'Erro ao salvar agendamento.'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  /* =========================================
     COMPUTED
  ========================================= */

  const endTime = selectedService && time
    ? dayjs(`2000-01-01 ${time}`).add(selectedService.duration, 'minute').format('HH:mm')
    : null

  /* =========================================
     RENDER
  ========================================= */

  if (!open) return null

  return (
    <>
      {/* OVERLAY */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.18)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 9998,
          animation: 'fadeIn 0.2s ease'
        }}
      />

      {/* PANEL */}
      <div style={{
        position: 'fixed', top: 0, right: 0,
        width: 420, maxWidth: '100vw', height: '100%',
        background: 'var(--bg-elevated)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        borderLeft: '1px solid var(--border-soft)',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 9999,
        display: 'flex', flexDirection: 'column',
        animation: 'slideIn 0.25s var(--ease)',
        fontFamily: 'var(--font-sans)'
      }}>
        <style>{`
          @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
          @keyframes slideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }
          .panel-input {
            width: 100%;
            padding: 12px 14px;
            border-radius: var(--radius-sm);
            border: 1px solid var(--border-soft);
            background: var(--bg-glass);
            color: var(--text);
            font-family: var(--font-sans);
            font-size: 14px;
            outline: none;
            box-sizing: border-box;
            transition: border-color 0.15s;
          }
          .panel-input:focus { border-color: var(--brand); }
          .service-btn {
            width: 100%; padding: 11px 14px;
            border-radius: var(--radius-sm);
            border: 1px solid var(--border-soft);
            background: var(--bg-glass);
            color: var(--text);
            font-family: var(--font-sans);
            font-size: 13px;
            text-align: left;
            cursor: pointer;
            display: flex; align-items: center; justify-content: space-between;
            transition: all 0.15s;
          }
          .service-btn:hover { border-color: var(--brand); background: rgba(225,6,0,0.04); }
          .service-btn.active {
            border-color: var(--brand);
            background: rgba(225,6,0,0.06);
            color: var(--brand);
            font-weight: 600;
          }
        `}</style>

        {/* Header */}
        <div style={{
          padding: '22px 22px 18px',
          borderBottom: '1px solid var(--border-soft)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{
                margin: 0, fontSize: 18, fontWeight: 700,
                letterSpacing: '-0.4px', color: 'var(--text)'
              }}>
                {mode === 'create' ? 'Novo Agendamento' : 'Editar Agendamento'}
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                {time && endTime
                  ? `${time}${endTime ? ' – ' + endTime : ''} · ${profName}`
                  : profName}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                border: '1px solid var(--border-soft)',
                background: 'var(--bg-glass)',
                cursor: 'pointer', fontSize: 16, color: 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-glass)'}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px' }}>

          {/* Error */}
          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 'var(--radius-sm)',
              background: 'rgba(220,38,38,0.08)',
              border: '1px solid rgba(220,38,38,0.2)',
              color: '#dc2626', fontSize: 13, marginBottom: 16
            }}>
              {error}
            </div>
          )}

          {/* Cliente */}
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block', fontSize: 12, fontWeight: 600,
              color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.04em'
            }}>
              NOME DO CLIENTE *
            </label>
            <input
              className="panel-input"
              placeholder="Ex: Lucas Mendes"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
            />
          </div>

          {/* Telefone */}
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block', fontSize: 12, fontWeight: 600,
              color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.04em'
            }}>
              TELEFONE
            </label>
            <input
              className="panel-input"
              placeholder="(11) 99999-9999"
              value={clientPhone}
              onChange={e => setClientPhone(e.target.value)}
            />
          </div>

          {/* Serviços */}
          <div>
            <label style={{
              display: 'block', fontSize: 12, fontWeight: 600,
              color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.04em'
            }}>
              SERVIÇO *
            </label>

            {loading ? (
              <div style={{
                padding: '20px', textAlign: 'center',
                color: 'var(--text-muted)', fontSize: 13
              }}>
                Carregando serviços...
              </div>
            ) : services.length === 0 ? (
              <div style={{
                padding: '16px', textAlign: 'center',
                color: 'var(--text-muted)', fontSize: 13,
                border: '1px dashed var(--border-soft)',
                borderRadius: 'var(--radius-sm)'
              }}>
                Nenhum serviço cadastrado
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {services.map(s => (
                  <button
                    key={s.id}
                    className={`service-btn${selectedService?.id === s.id ? ' active' : ''}`}
                    onClick={() => setSelectedService(
                      selectedService?.id === s.id ? null : s
                    )}
                  >
                    <span>
                      {s.name}
                      <span style={{
                        marginLeft: 8, fontSize: 11,
                        color: selectedService?.id === s.id ? 'var(--brand)' : 'var(--text-muted)'
                      }}>
                        {s.duration}min
                      </span>
                    </span>
                    {s.price != null && (
                      <span style={{ fontWeight: 600, fontSize: 13 }}>
                        R$ {s.price.toFixed(2).replace('.', ',')}
                      </span>
                    )}
                    {selectedService?.id === s.id && (
                      <span style={{ marginLeft: 4 }}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 22px 22px',
          borderTop: '1px solid var(--border-soft)',
          flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8
        }}>
          <button
            onClick={handleSave}
            disabled={saving || !selectedService || !clientName.trim()}
            style={{
              width: '100%', padding: '14px',
              background: saving || !selectedService || !clientName.trim()
                ? 'rgba(225,6,0,0.3)'
                : 'var(--brand)',
              color: '#fff', border: 'none',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600, fontSize: 15,
              cursor: saving || !selectedService || !clientName.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s var(--ease)',
              fontFamily: 'var(--font-sans)'
            }}
          >
            {saving ? 'Salvando...' : mode === 'create' ? 'Confirmar agendamento' : 'Atualizar'}
          </button>

          <button
            onClick={onClose}
            style={{
              width: '100%', padding: '12px',
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-soft)',
              borderRadius: 'var(--radius-md)',
              fontSize: 14, cursor: 'pointer', color: 'var(--text-muted)',
              fontFamily: 'var(--font-sans)',
              transition: 'all 0.15s'
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </>
  )
}