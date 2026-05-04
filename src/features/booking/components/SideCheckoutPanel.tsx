'use client'

import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import api from '@/shared/lib/apiClient'
import { Professional } from '@/shared/types'

dayjs.extend(utc)

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

export default function SideCheckoutPanel({
  open,
  mode,
  time,
  professionalId,
  professionals,
  selectedDate,
  onClose,
}: Props) {
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(time)
  const [selectedProf, setSelectedProf] = useState<string | null>(professionalId)
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const profName =
    professionals.find((p) => p.id === (selectedProf ?? professionalId))
      ?.name ?? 'Profissional'

  const timeChips: string[] = []
  for (let h = 8; h < 20; h++) {
    timeChips.push(`${String(h).padStart(2, '0')}:00`)
    timeChips.push(`${String(h).padStart(2, '0')}:30`)
  }

  useEffect(() => {
    if (!open) return
    setLoading(true)
    api
      .get<{ data: Service[] }>('/services')
      .then((res) => {
        const list = Array.isArray(res.data)
          ? res.data
          : (res.data as { data: Service[] })?.data ?? []
        setServices(list)
      })
      .catch(() => setServices([]))
      .finally(() => setLoading(false))
  }, [open])

  useEffect(() => {
    if (open) {
      setClientName('')
      setClientPhone('')
      setSelectedService(null)
      setSelectedTime(time)
      setSelectedProf(professionalId)
      setError(null)
      setSuccess(false)
    }
  }, [open, time, professionalId])

  const endTime =
    selectedService && selectedTime
      ? dayjs(`2000-01-01 ${selectedTime}`)
          .add(selectedService.duration, 'minute')
          .format('HH:mm')
      : null

  async function handleSave() {
    if (
      !selectedProf ||
      !selectedTime ||
      !selectedService ||
      !clientName.trim()
    ) {
      setError('Preencha todos os campos obrigatórios.')
      return
    }
    try {
      setSaving(true)
      setError(null)
      const dateStr = dayjs(selectedDate).format('YYYY-MM-DD')
      const startAt = dayjs.utc(`${dateStr} ${selectedTime}`).toISOString()

      await api.post('/bookings/confirm', {
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim() || undefined,
        serviceId: selectedService.id,
        professionalId: selectedProf,
        startAt,
      })

      setSuccess(true)
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? 'Erro ao salvar agendamento.'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  const isDisabled =
    saving || success || !selectedService || !clientName.trim() || !selectedTime

  return (
    <>
      {/* overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.18)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          zIndex: 9998,
          animation: 'glFadeIn 0.2s ease',
        }}
      />

      {/* modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          width: 340,
          maxWidth: '94vw',
          maxHeight: '88vh',
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          borderRadius: 24,
          border: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.14)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          animation: 'glSlideIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
          fontFamily: '-apple-system, "SF Pro Display", system-ui, sans-serif',
          overflow: 'hidden',
        }}
      >
        <style>{`
          @keyframes glFadeIn { from { opacity:0 } to { opacity:1 } }
          @keyframes glSlideIn {
            from { opacity:0; transform:translate(-50%,-50%) scale(0.93) }
            to   { opacity:1; transform:translate(-50%,-50%) scale(1) }
          }
          .gl-input {
            width: 100%; padding: 11px 14px; border-radius: 12px;
            border: 1px solid rgba(0,0,0,0.1);
            background: rgba(255,255,255,0.7);
            color: #111827; font-size: 14px; outline: none;
            box-sizing: border-box;
            transition: border-color 0.15s, box-shadow 0.15s;
            font-family: -apple-system, system-ui, sans-serif;
          }
          .gl-input:focus {
            border-color: rgba(220,38,38,0.45);
            box-shadow: 0 0 0 3px rgba(220,38,38,0.08);
          }
          .gl-input::placeholder { color: rgba(0,0,0,0.28); }

          .svc-btn {
            padding: 10px 14px; border-radius: 12px;
            border: 1px solid rgba(0,0,0,0.08);
            background: rgba(255,255,255,0.6);
            color: #1f2937; font-size: 13px;
            display: flex; align-items: center; justify-content: space-between;
            cursor: pointer; transition: all 0.15s;
            font-family: -apple-system, system-ui, sans-serif;
          }
          .svc-btn:hover {
            border-color: rgba(220,38,38,0.25);
            background: rgba(220,38,38,0.03);
          }
          .svc-btn.sel {
            background: rgba(220,38,38,0.06);
            border-color: rgba(220,38,38,0.35);
            color: #b91c1c;
            font-weight: 600;
          }

          .time-chip {
            padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 500;
            border: 1px solid rgba(0,0,0,0.08); cursor: pointer;
            background: rgba(255,255,255,0.6); color: #374151;
            transition: all 0.15s;
            font-family: -apple-system, system-ui, sans-serif;
            font-variant-numeric: tabular-nums;
          }
          .time-chip:hover {
            border-color: rgba(220,38,38,0.28);
            background: rgba(220,38,38,0.04);
          }
          .time-chip.sel {
            background: linear-gradient(135deg, #dc2626, #b91c1c);
            color: #fff; border-color: transparent;
            box-shadow: 0 3px 10px rgba(220,38,38,0.25);
          }

          .prof-sel {
            flex: 1; padding: 8px 12px; border-radius: 12px;
            border: 1px solid rgba(0,0,0,0.08);
            background: rgba(255,255,255,0.6); color: #374151;
            font-size: 13px; cursor: pointer; transition: all 0.15s; text-align: center;
            font-family: -apple-system, system-ui, sans-serif;
          }
          .prof-sel:hover { border-color: rgba(220,38,38,0.25); }
          .prof-sel.sel {
            background: linear-gradient(135deg, #dc2626, #b91c1c);
            color: #fff; border-color: transparent;
            box-shadow: 0 3px 10px rgba(220,38,38,0.22);
          }

          .close-btn {
            width: 30px; height: 30px; border-radius: 50%;
            border: 1px solid rgba(0,0,0,0.09);
            background: rgba(255,255,255,0.6);
            cursor: pointer; font-size: 13px; color: rgba(0,0,0,0.4);
            display: flex; align-items: center; justify-content: center;
            transition: all 0.15s;
          }
          .close-btn:hover {
            background: rgba(220,38,38,0.08);
            color: #dc2626;
            border-color: rgba(220,38,38,0.2);
          }
          .cancel-btn {
            width: 100%; padding: 11px;
            background: rgba(0,0,0,0.04);
            border: 1px solid rgba(0,0,0,0.08);
            border-radius: 12px; font-size: 14px; cursor: pointer;
            color: rgba(0,0,0,0.45);
            font-family: -apple-system, system-ui, sans-serif;
            transition: all 0.15s;
          }
          .cancel-btn:hover {
            background: rgba(0,0,0,0.07);
          }
        `}</style>

        {/* header */}
        <div
          style={{
            padding: '20px 20px 14px',
            borderBottom: '1px solid rgba(0,0,0,0.07)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 17,
                  fontWeight: 700,
                  color: '#111827',
                  letterSpacing: '-0.3px',
                }}
              >
                {mode === 'create' ? 'Novo Agendamento' : 'Editar Agendamento'}
              </h2>
              <p
                style={{
                  margin: '3px 0 0',
                  fontSize: 12,
                  color: 'rgba(0,0,0,0.4)',
                }}
              >
                {selectedTime && endTime
                  ? `${selectedTime} – ${endTime} · ${profName}`
                  : profName}
              </p>
            </div>
            <button className="close-btn" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {/* body */}
        <div
          style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}
        >
          {/* success */}
          {success && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 12,
                background: 'rgba(100,116,139,0.08)',
                border: '1px solid rgba(100,116,139,0.2)',
                color: '#334155',
                fontSize: 13,
                marginBottom: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ fontSize: 15, color: '#dc2626' }}>✓</span>{' '}
              Agendamento confirmado!
            </div>
          )}

          {/* error */}
          {error && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 12,
                background: 'rgba(220,38,38,0.06)',
                border: '1px solid rgba(220,38,38,0.18)',
                color: '#b91c1c',
                fontSize: 13,
                marginBottom: 14,
              }}
            >
              {error}
            </div>
          )}

          {/* cliente */}
          <div style={{ marginBottom: 14 }}>
            <label
              style={{
                display: 'block',
                fontSize: 10,
                fontWeight: 700,
                color: 'rgba(0,0,0,0.35)',
                marginBottom: 6,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Nome do cliente *
            </label>
            <input
              className="gl-input"
              placeholder="Ex: Lucas Mendes"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </div>

          {/* telefone */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: 'block',
                fontSize: 10,
                fontWeight: 700,
                color: 'rgba(0,0,0,0.35)',
                marginBottom: 6,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Telefone
            </label>
            <input
              className="gl-input"
              placeholder="(11) 99999-9999"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
            />
          </div>

          {/* serviços */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: 'block',
                fontSize: 10,
                fontWeight: 700,
                color: 'rgba(0,0,0,0.35)',
                marginBottom: 8,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Serviço *
            </label>
            {loading ? (
              <div
                style={{
                  padding: '14px',
                  textAlign: 'center',
                  color: 'rgba(0,0,0,0.35)',
                  fontSize: 13,
                }}
              >
                Carregando...
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                {services.map((s) => (
                  <button
                    key={s.id}
                    className={`svc-btn${selectedService?.id === s.id ? ' sel' : ''}`}
                    onClick={() =>
                      setSelectedService(
                        selectedService?.id === s.id ? null : s
                      )
                    }
                  >
                    <span>
                      {s.name}
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 11,
                          opacity: 0.55,
                        }}
                      >
                        {s.duration}min
                      </span>
                    </span>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      {s.price != null && (
                        <span style={{ fontWeight: 600, fontSize: 13 }}>
                          R$ {s.price.toFixed(2).replace('.', ',')}
                        </span>
                      )}
                      {selectedService?.id === s.id && (
                        <span style={{ color: '#dc2626' }}>✓</span>
                      )}
                    </span>
                  </button>
                ))}
                {services.length === 0 && (
                  <div
                    style={{
                      padding: '14px',
                      textAlign: 'center',
                      color: 'rgba(0,0,0,0.32)',
                      fontSize: 13,
                      border: '1px dashed rgba(0,0,0,0.1)',
                      borderRadius: 12,
                    }}
                  >
                    Nenhum serviço cadastrado
                  </div>
                )}
              </div>
            )}
          </div>

          {/* profissional */}
          {professionals.length > 1 && (
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'rgba(0,0,0,0.35)',
                  marginBottom: 8,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Profissional
              </label>
              <div
                style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}
              >
                {professionals.map((p) => (
                  <button
                    key={p.id}
                    className={`prof-sel${selectedProf === p.id ? ' sel' : ''}`}
                    onClick={() => setSelectedProf(p.id)}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* horário */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 10,
                fontWeight: 700,
                color: 'rgba(0,0,0,0.35)',
                marginBottom: 8,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Horário *
            </label>
            <div
              style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}
            >
              {timeChips.map((t) => (
                <button
                  key={t}
                  className={`time-chip${selectedTime === t ? ' sel' : ''}`}
                  onClick={() => setSelectedTime(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* footer */}
        <div
          style={{
            padding: '14px 20px 20px',
            borderTop: '1px solid rgba(0,0,0,0.07)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <button
            onClick={handleSave}
            disabled={isDisabled}
            style={{
              width: '100%',
              padding: '14px',
              background: success
                ? 'linear-gradient(135deg, #475569, #334155)'
                : isDisabled
                ? 'rgba(220,38,38,0.25)'
                : 'linear-gradient(135deg, #dc2626, #b91c1c)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 15,
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              boxShadow: isDisabled
                ? 'none'
                : '0 4px 16px rgba(220,38,38,0.28)',
              transition: 'all 0.2s',
              fontFamily: '-apple-system, system-ui, sans-serif',
            }}
          >
            {success
              ? '✓ Confirmado!'
              : saving
              ? 'Salvando...'
              : mode === 'create'
              ? 'Confirmar agendamento'
              : 'Atualizar'}
          </button>
          <button className="cancel-btn" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </>
  )
}