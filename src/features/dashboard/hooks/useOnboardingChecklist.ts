'use client'
// src/features/dashboard/hooks/useOnboardingChecklist.ts
// @eligi:checklist-hook
// Fetch + estado do checklist de configuracao (/onboarding/checklist).
//
// Extraido do OnboardingChecklistCard na fatia 2: agora o checklist e uma
// linha da fila de prioridades, e o dado precisa viver fora do card que o
// desenhava. Tipos e fetch em um lugar so — sem duplicar shape.

import { useState, useEffect, useCallback } from 'react'
import api from '@/shared/lib/apiClient'

export type ChecklistGroup = 'essential' | 'recommended'

export interface ChecklistItemMeta {
  trialDaysLeft?: number
  missing?:       number
  current?:       number
  target?:        number
}

export interface ChecklistItem {
  key:   string
  label: string
  done:  boolean
  href:  string
  group: ChecklistGroup
  hint?: string
  meta?: ChecklistItemMeta
}

export interface ChecklistData {
  progress: number
  done:     number
  total:    number
  complete: boolean
  items:    ChecklistItem[]
}

export interface OnboardingChecklistState {
  data:   ChecklistData | null
  failed: boolean
  loaded: boolean
  reload: () => void
}

export function useOnboardingChecklist(): OnboardingChecklistState {
  const [data, setData]     = useState<ChecklistData | null>(null)
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const reload = useCallback(() => {
    // @eligi:checklist-fix-effect
    // Nenhum setState sincrono antes da promise: reload() e chamado no corpo
    // do useEffect e o React Compiler acusa cascading render
    // (react-hooks/set-state-in-effect). Os callbacks abaixo resolvem.
    api
      .get<ChecklistData>('/onboarding/checklist')
      .then((res) => {
        setData(res.data)
        setFailed(false)
      })
      .catch(() => {
        setData(null)
        setFailed(true)
      })
      .finally(() => {
        setLoaded(true)
      })
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  return { data, failed, loaded, reload }
}
