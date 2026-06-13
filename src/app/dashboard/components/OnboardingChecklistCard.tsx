'use client'
// src/app/dashboard/components/OnboardingChecklistCard.tsx
// Card "Configure seu negócio" — fixo no topo do dashboard até 100%.
// Busca GET /onboarding/checklist; some sozinho quando completo (ou sem dados).
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Circle, ChevronRight, ListChecks } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { colors, typography } from '@/shared/theme'

interface ChecklistItem {
  key:   string
  label: string
  done:  boolean
  href:  string
  meta?: { trialDaysLeft?: number }
}
interface ChecklistData {
  progress: number
  done:     number
  total:    number
  complete: boolean
  items:    ChecklistItem[]
}

const GREEN = '#16a34a'

export default function OnboardingChecklistCard() {
  const router = useRouter()
  const [data, setData]     = useState<ChecklistData | null>(null)
  const [loaded, setLoaded] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await api.get<ChecklistData>('/onboarding/checklist')
      setData(res.data)
    } catch {
      setData(null)
    } finally {
      setLoaded(true)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // card fixo até 100%: some quando completo, sem dados ou se a chamada falhar
  if (!loaded || !data || data.complete) return null

  return (
    <div style={{
      background:   '#fff',
      border:       `0.5px solid ${colors.gray.borderMd}`,
      borderLeft:   `2.5px solid ${colors.red.DEFAULT}`,
      borderRadius: 14,
      boxShadow:    '0 1px 3px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.07)',
      padding:      '18px 22px',
      fontFamily:   typography.fontFamily,
      marginBottom: 16,
      animation:    'fadeUp 0.4s ease both',
    }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ListChecks size={20} color={colors.red.DEFAULT} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 15, fontWeight: typography.weight.bold, color: typography.color.primary }}>
              Configure seu negócio
            </span>
            <span style={{ fontSize: 12, color: typography.color.muted }}>
              {data.done} de {data.total} concluídos
            </span>
          </div>
        </div>
        <span style={{ fontSize: 17, fontWeight: typography.weight.bold, color: colors.red.DEFAULT }}>
          {data.progress}%
        </span>
      </div>

      {/* barra de progresso */}
      <div style={{
        marginTop: 12, height: 6, width: '100%',
        background: 'rgba(0,0,0,0.06)', borderRadius: 999, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${data.progress}%`,
          background: colors.red.DEFAULT, borderRadius: 999,
          transition: 'width 0.4s ease',
        }} />
      </div>

      {/* itens */}
      <div style={{ marginTop: 10 }}>
        {data.items.map((item) => {
          const trial = item.meta?.trialDaysLeft
          return (
            <div
              key={item.key}
              onClick={item.done ? undefined : () => router.push(item.href)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 6px', borderRadius: 8,
                cursor: item.done ? 'default' : 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!item.done) (e.currentTarget as HTMLDivElement).style.background = 'rgba(0,0,0,0.03)'
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = 'transparent'
              }}
            >
              {item.done
                ? <CheckCircle2 size={20} color={GREEN} style={{ flexShrink: 0 }} />
                : <Circle size={20} color="rgba(0,0,0,0.25)" style={{ flexShrink: 0 }} />}

              <span style={{
                flex: 1, fontSize: 14,
                color: item.done ? typography.color.muted : typography.color.primary,
              }}>
                {item.label}
              </span>

              {!item.done && typeof trial === 'number' && trial > 0 && (
                <span style={{
                  fontSize: 11, padding: '3px 9px', borderRadius: 8,
                  background: 'rgba(234,179,8,0.14)', color: '#a16207', whiteSpace: 'nowrap',
                }}>
                  {trial} {trial === 1 ? 'dia' : 'dias'} de trial
                </span>
              )}

              {!item.done && <ChevronRight size={18} color="rgba(0,0,0,0.3)" style={{ flexShrink: 0 }} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
