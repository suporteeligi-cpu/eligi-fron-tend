'use client'
// src/app/dashboard/equipe/components/HoursPanel.tsx

import { useState, useEffect, useRef, useCallback } from 'react'
import { Loader2, Check } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { colors, typography } from '@/shared/theme'
import { HourSlot } from '@/features/professionals/types'

import HoursEditor from './HoursEditor'
// @eligi:lunch-panel-import
import LunchCard, { LunchRule } from './LunchCard'

interface Props {
  profId:   string
  profName: string
  isMobile: boolean
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'
const SAVE_DEBOUNCE_MS = 700

export default function HoursPanel({ profId, profName }: Props) {
  const [slots,     setSlots]     = useState<HourSlot[]>([])
  const [loading,   setLoading]   = useState(true)
  const [saveState, setSaveState] = useState<SaveState>('idle')

  const saveTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastPushed = useRef<string>('')
  const isMountedRef = useRef(false)

  // Fetch ao montar (key={profId} no parent garante remount quando troca prof)
  useEffect(() => {
    let cancelled = false
    api.get(`/equipe/${profId}/availability`)
      .then(res => {
        if (cancelled) return
        const data = res.data?.data ?? res.data
        const arr: HourSlot[] = Array.isArray(data) ? data : []
        setSlots(arr)
        lastPushed.current = JSON.stringify(arr)
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) {
          setSlots([])
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [profId])

  const triggerSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const serialized = JSON.stringify(slots)
      if (serialized === lastPushed.current) return
      try {
        setSaveState('saving')
        const res = await api.put(`/equipe/${profId}/availability`, { slots })
        const updated = res.data?.data ?? res.data
        if (Array.isArray(updated)) {
          setSlots(updated)
          lastPushed.current = JSON.stringify(updated)
        } else {
          lastPushed.current = serialized
        }
        setSaveState('saved')
        setTimeout(() => setSaveState('idle'), 1400)
      } catch {
        setSaveState('error')
      }
    }, SAVE_DEBOUNCE_MS)
  }, [profId, slots])

  useEffect(() => {
    if (loading) return
    if (!isMountedRef.current) {
      isMountedRef.current = true
      return
    }
    triggerSave()
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [slots, loading, triggerSave])

  /* =========================================
     @eligi:lunch-panel-state — pausa para almoco

     Mesmo padrao do bloco acima, com timer e lastPushed proprios: horario de
     trabalho e almoco vao para endpoints diferentes, e salvar os dois quando
     so um mudou seria uma requisicao jogada fora. O SaveState e compartilhado
     de proposito — um unico indicador na tela.
  ========================================= */
  const [lunch, setLunch] = useState<LunchRule | null>(null)
  const [lunchLoading, setLunchLoading] = useState(true)

  const lunchTimer   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lunchPushed  = useRef<string>('')
  const lunchMounted = useRef(false)

  useEffect(() => {
    let cancelled = false
    api.get(`/equipe/${profId}/lunch`)
      .then(res => {
        if (cancelled) return
        const data = (res.data?.data ?? null) as LunchRule | null
        setLunch(data)
        lunchPushed.current = JSON.stringify(data)
        setLunchLoading(false)
      })
      .catch(() => {
        if (!cancelled) {
          setLunch(null)
          setLunchLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [profId])

  const triggerLunchSave = useCallback(() => {
    if (lunchTimer.current) clearTimeout(lunchTimer.current)
    lunchTimer.current = setTimeout(async () => {
      const serialized = JSON.stringify(lunch)
      if (serialized === lunchPushed.current) return

      // Guarda de estado incompleto: o back recusa com 400 e o indicador ficaria
      // vermelho enquanto a pessoa ainda esta escolhendo os dias.
      if (lunch && (lunch.weekdays.length === 0 || lunch.startTime >= lunch.endTime)) return

      try {
        setSaveState('saving')
        if (lunch === null) {
          await api.delete(`/equipe/${profId}/lunch`)
        } else {
          await api.put(`/equipe/${profId}/lunch`, lunch)
        }
        lunchPushed.current = serialized
        setSaveState('saved')
        setTimeout(() => setSaveState('idle'), 1400)
      } catch {
        setSaveState('error')
      }
    }, SAVE_DEBOUNCE_MS)
  }, [profId, lunch])

  useEffect(() => {
    if (lunchLoading) return
    if (!lunchMounted.current) {
      lunchMounted.current = true
      return
    }
    triggerLunchSave()
    return () => {
      if (lunchTimer.current) clearTimeout(lunchTimer.current)
    }
  }, [lunch, lunchLoading, triggerLunchSave])

  // Dias com expediente, para apagar os de folga no card de almoco. Sai do
  // estado que o painel ja tem — nenhuma requisicao a mais.
  const workingWeekdays = Array.from(new Set(slots.map(s => s.weekday))).sort((a, b) => a - b)

  if (loading) return (
    <div style={{
      padding: '40px 20px', textAlign: 'center',
      fontFamily: typography.fontFamily,
    }}>
      <Loader2 size={20} color={colors.gray.dimText} style={{
        animation: 'eq-spin 0.8s linear infinite',
      }} />
      <div style={{ fontSize: 12, color: colors.gray.dimText, marginTop: 8 }}>
        Carregando horários...
      </div>
    </div>
  )

  return (
    <div style={{ fontFamily: typography.fontFamily }}>
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        marginBottom: 12, gap: 12,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            margin: 0,
            fontSize: 15, fontWeight: 700,
            color: colors.gray[900],
            letterSpacing: '-0.01em',
          }}>
            Horário de trabalho
          </h3>
          <p style={{
            margin: '2px 0 0',
            fontSize: 12,
            color: colors.gray.dimText,
            lineHeight: 1.4,
          }}>
            Define os dias e horários que {profName.split(' ')[0]} atende.
          </p>
        </div>
        <SaveIndicator state={saveState} />
      </div>

      <HoursEditor slots={slots} onChange={setSlots} />

      {/* @eligi:lunch-panel-render */}
      {!lunchLoading && (
        <LunchCard
          value={lunch}
          onChange={setLunch}
          workingWeekdays={workingWeekdays}
          profName={profName}
        />
      )}
    </div>
  )
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === 'idle') return null
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      fontSize: 11, fontWeight: 600,
      color: state === 'error' ? colors.red.DEFAULT
        : state === 'saved' ? '#15803d'
        : colors.gray.dimText,
      flexShrink: 0,
    }}>
      {state === 'saving' && (
        <>
          <Loader2 size={12} strokeWidth={2.5} style={{
            animation: 'eq-spin 0.8s linear infinite',
          }} />
          Salvando
        </>
      )}
      {state === 'saved' && (
        <>
          <Check size={12} strokeWidth={3} />
          Salvo
        </>
      )}
      {state === 'error' && 'Erro ao salvar'}
    </div>
  )
}
