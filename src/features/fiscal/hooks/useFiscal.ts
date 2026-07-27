// src/features/fiscal/hooks/useFiscal.ts
'use client'

import { useCallback, useEffect, useState } from 'react'
import api from '@/shared/lib/apiClient'
import type { FiscalOverview, BillingSubscriptionView } from '../types'
import { apiErrorMessage } from '../utils'

interface BillingSubscriptionResponse {
  success: boolean
  data: { hasSubscription: boolean; nfseAddon?: boolean }
}

/** Carrega perfil fiscal + estado do add-on. Compiler-safe: setState só nos callbacks. */
export function useFiscal() {
  const [overview, setOverview] = useState<FiscalOverview | null>(null)
  const [billing, setBilling] = useState<BillingSubscriptionView>({
    hasSubscription: false,
    nfseAddon: false,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let alive = true
    Promise.all([
      api.get<FiscalOverview>('/fiscal/profile'),
      api.get<BillingSubscriptionResponse>('/billing/subscription'),
    ])
      .then(([fiscalRes, billingRes]) => {
        if (!alive) return
        setOverview(fiscalRes.data)
        setBilling({
          hasSubscription: billingRes.data.data?.hasSubscription ?? false,
          nfseAddon: billingRes.data.data?.nfseAddon ?? false,
        })
        setError(null)
      })
      .catch((err: unknown) => {
        if (alive) setError(apiErrorMessage(err))
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [tick])

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  return { overview, billing, loading, error, refetch }
}
