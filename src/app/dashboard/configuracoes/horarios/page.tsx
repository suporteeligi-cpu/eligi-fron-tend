'use client'
// src/app/dashboard/configuracoes/horarios/page.tsx
// @eligi:horarios-cards-v1
//
// Redesign direcao B: cada dia da semana e um cartao.
//
// O que a versao anterior fazia de errado:
//   - linha em flex rigido estourava 390px: o horario de fechamento aparecia
//     cortado e "Copiar para todos" nao existia no celular;
//   - doze <select> nativos, com alvo de toque abaixo de 44px;
//   - "Copiar para todos" repetido em cada linha, empurrando o conteudo pra fora;
//   - largura travada em 640px, deixando dois tercos do desktop vazios.
//
// O grid abaixo resolve os quatro: o cartao empilha no mobile e se multiplica
// em coluna no desktop, decidido por media query -- nunca por JavaScript.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Clock, Lightbulb } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import DayCard from '@/features/business-hours/components/DayCard'
import {
  DAY_NAMES, durationLabel, isSlotInvalid, weeklyMinutes,
  type HourSlot,
} from '@/features/business-hours/types'

type ToastState = { message: string; type: 'success' | 'error' } | null

export default function HorariosPage() {
  const router = useRouter()
  const [slots,    setSlots]    = useState<HourSlot[]>([])
  const [original, setOriginal] = useState<HourSlot[]>([])
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [toast,    setToast]    = useState<ToastState>(null)
  const [error,    setError]    = useState<string | null>(null)

  const isDirty = JSON.stringify(slots) !== JSON.stringify(original)

  const openCount = useMemo(() => slots.filter(s => s.open).length, [slots])
  const weekLabel = useMemo(() => durationLabel(weeklyMinutes(slots)), [slots])

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2800)
  }, [])

  useEffect(() => {
    let alive = true
    const run = async () => {
      try {
        const res  = await api.get('/business-hours')
        const data = (res.data?.data ?? res.data) as HourSlot[]
        if (!alive) return
        setSlots(data)
        setOriginal(data)
      } catch {
        if (alive) showToast('Erro ao carregar horários', 'error')
      } finally {
        if (alive) setLoading(false)
      }
    }
    void run()
    return () => { alive = false }
  }, [showToast])

  const updateSlot = useCallback((weekday: number, patch: Partial<HourSlot>) => {
    setError(null)
    setSlots(prev => prev.map(s => (s.weekday === weekday ? { ...s, ...patch } : s)))
  }, [])

  /** Aplica o horario deste dia em todos os outros dias abertos. */
  const replicate = useCallback((weekday: number) => {
    setError(null)
    setSlots(prev => {
      const source = prev.find(s => s.weekday === weekday)
      if (!source) return prev
      return prev.map(s =>
        s.open ? { ...s, startTime: source.startTime, endTime: source.endTime } : s,
      )
    })
  }, [])

  const handleSave = useCallback(async () => {
    const broken = slots.find(isSlotInvalid)
    if (broken) {
      setError(`${DAY_NAMES[broken.weekday]}: o horário de início deve ser antes do fim.`)
      return
    }
    try {
      setSaving(true)
      setError(null)
      const res  = await api.put('/business-hours', { slots })
      const data = (res.data?.data ?? res.data) as HourSlot[]
      setSlots(data)
      setOriginal(data)
      showToast('Horários salvos com sucesso!', 'success')
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
      showToast(msg ?? 'Erro ao salvar horários', 'error')
    } finally {
      setSaving(false)
    }
  }, [slots, showToast])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <style>{'@keyframes bh-spin { to { transform: rotate(360deg) } }'}</style>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '3px solid rgba(220,38,38,0.15)', borderTopColor: '#dc2626',
          animation: 'bh-spin 0.8s linear infinite',
        }} />
      </div>
    )
  }

  const canSave = isDirty && !saving

  return (
    <>
      <style>{`
        @keyframes bh-toast { from { opacity:0; transform:translateX(-50%) translateY(10px) } to { opacity:1; transform:translateX(-50%) translateY(0) } }
        @keyframes bh-fade  { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }

        .bh-grid { display:grid; gap:12px; grid-template-columns:1fr; }
        @media (min-width: 760px)  { .bh-grid { grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); } }

        .bh-head { display:flex; align-items:flex-start; gap:12px; margin-bottom:18px; flex-wrap:wrap; }
        .bh-save { order:3; width:100%; }
        @media (min-width: 760px) { .bh-save { order:0; width:auto; margin-left:auto; } }

        .bh-ghost {
          display:inline-flex; align-items:center; gap:6px; margin-left:auto;
          min-height:34px; padding:0 10px; border:none; border-radius:9px;
          background:transparent; color:rgba(0,0,0,0.40);
          font-size:12.5px; font-weight:600; cursor:pointer;
          transition:background 0.15s, color 0.15s; white-space:nowrap;
          touch-action:manipulation;
        }
        .bh-ghost:hover { background:rgba(220,38,38,0.06); color:#dc2626; }

        .bh-stepper button:hover:not(:disabled) { background:#fff; color:#0f0f14; }
        .bh-back:hover { background:rgba(220,38,38,0.06); }
        .bh-back:hover svg { stroke:#dc2626; }
      `}</style>

      {toast && (
        <div style={{
          position: 'fixed', bottom: 'calc(28px + var(--bottom-nav-h, 0px))', left: '50%',
          transform: 'translateX(-50%)', padding: '12px 22px', borderRadius: 14, zIndex: 9999,
          background: toast.type === 'success'
            ? 'linear-gradient(135deg,#22c55e,#16a34a)'
            : 'linear-gradient(135deg,#dc2626,#b91c1c)',
          color: '#fff', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap',
          boxShadow: '0 8px 28px rgba(0,0,0,0.16)',
          animation: 'bh-toast 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          {toast.message}
        </div>
      )}

      <div style={{ maxWidth: 1180, animation: 'bh-fade 0.3s ease' }}>
        <div className="bh-head">
          <button
            type="button"
            className="bh-back"
            onClick={() => router.push('/dashboard/configuracoes')}
            aria-label="Voltar para Configurações"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 40, height: 40, borderRadius: 12, flexShrink: 0,
              border: '1px solid rgba(0,0,0,0.09)', background: 'rgba(255,255,255,0.85)',
              cursor: 'pointer', transition: 'background 0.15s',
            }}
          >
            <ChevronLeft size={19} color="rgba(0,0,0,0.5)" strokeWidth={2} />
          </button>

          <div style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            background: 'linear-gradient(135deg,#dc2626,#b91c1c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(220,38,38,0.28)',
          }}>
            <Clock size={20} color="#fff" strokeWidth={1.9} />
          </div>

          <div style={{ minWidth: 0, flex: '1 1 200px' }}>
            <h2 style={{
              margin: 0, fontSize: 20, fontWeight: 700,
              letterSpacing: '-0.025em', color: '#0f0f14', lineHeight: 1.15,
            }}>
              Horários de funcionamento
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'rgba(0,0,0,0.40)' }}>
              {openCount} dia{openCount === 1 ? '' : 's'} aberto{openCount === 1 ? '' : 's'} · {weekLabel} por semana
            </p>
          </div>

          <button
            type="button"
            className="bh-save"
            onClick={handleSave}
            disabled={!canSave}
            style={{
              minHeight: 44, padding: '0 22px', borderRadius: 13, border: 'none',
              background: canSave ? 'linear-gradient(135deg,#dc2626,#b91c1c)' : 'rgba(0,0,0,0.07)',
              color: canSave ? '#fff' : 'rgba(0,0,0,0.30)',
              fontSize: 14.5, fontWeight: 700, letterSpacing: '-0.01em',
              cursor: canSave ? 'pointer' : 'not-allowed',
              boxShadow: canSave ? '0 6px 18px rgba(220,38,38,0.25)' : 'none',
              transition: 'all 0.2s', whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>

        {error && (
          <div role="alert" style={{
            marginBottom: 14, padding: '12px 16px', borderRadius: 12,
            background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.18)',
            color: '#b91c1c', fontSize: 13.5, fontWeight: 600,
          }}>
            {error}
          </div>
        )}

        <div className="bh-grid">
          {slots.map(slot => (
            <DayCard
              key={slot.weekday}
              slot={slot}
              replicateTargets={openCount - (slot.open ? 1 : 0)}
              onToggle={open => updateSlot(slot.weekday, { open })}
              onStart={startTime => updateSlot(slot.weekday, { startTime })}
              onEnd={endTime => updateSlot(slot.weekday, { endTime })}
              onReplicate={() => replicate(slot.weekday)}
            />
          ))}
        </div>

        <div style={{
          marginTop: 16, padding: '14px 18px', borderRadius: 14,
          background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(0,0,0,0.07)',
          display: 'flex', gap: 11, alignItems: 'flex-start',
        }}>
          <Lightbulb size={17} color="rgba(0,0,0,0.32)" strokeWidth={1.9} style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ margin: 0, fontSize: 13.5, color: 'rgba(0,0,0,0.48)', lineHeight: 1.6 }}>
            Esses horários controlam a disponibilidade no <strong>link público de agendamento</strong>.
            Um dia fechado não aparece para o cliente. Use <strong>Replicar</strong> para aplicar o
            horário de um dia nos demais dias abertos.
          </p>
        </div>
      </div>
    </>
  )
}
