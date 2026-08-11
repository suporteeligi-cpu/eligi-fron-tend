// src/features/fiscal/hooks/useFiscalSummary.ts
'use client'

import { useEffect, useState } from 'react'
import api from '@/shared/lib/apiClient'
import type { FiscalSummary } from '../types'

interface State {
  summary: FiscalSummary | null
  loading: boolean
}

export function useFiscalSummary(year: number) {
  // ⚠️ estado ÚNICO: setLoading + setSummary separados obrigariam duas
  // chamadas, e a primeira cairia no corpo do effect (set-state-in-effect).
  const [state, setState] = useState<State>({ summary: null, loading: true })

  useEffect(() => {
    let alive = true

    // padrão da casa: run() async, setState só dentro dele
    async function run() {
      try {
        const res = await api.get<FiscalSummary>('/fiscal/summary', { params: { year } })
        if (alive) setState({ summary: res.data, loading: false })
      } catch {
        if (alive) setState({ summary: null, loading: false })
      }
    }

    void run()
    return () => {
      alive = false
    }
  }, [year])

  return state
}
