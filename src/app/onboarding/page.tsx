'use client'
// src/app/onboarding/page.tsx
// Index do onboarding: redireciona pro step salvo (retoma de onde parou).
// Resolve o 404 de quem aponta pra /onboarding puro (guard, useAuth, cadastro).

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getMe } from '@/lib/auth.api'

const STEP_ROUTES = [
  '/onboarding/steps/01-identity',
  '/onboarding/steps/02-location',
  '/onboarding/steps/03-hours',
  '/onboarding/steps/04-services',
  '/onboarding/steps/05-plan',
]

export default function OnboardingIndex() {
  const router = useRouter()

  useEffect(() => {
    let cancelled = false

    getMe()
      .then((me) => {
        if (cancelled) return
        if (me.onboardingDone) {
          router.replace('/dashboard')
          return
        }
        const step = me.onboardingStep ?? 1
        const idx = Math.min(Math.max(step - 1, 0), STEP_ROUTES.length - 1)
        router.replace(STEP_ROUTES[idx])
      })
      .catch(() => {
        if (!cancelled) router.replace('/login')
      })

    return () => { cancelled = true }
  }, [router])

  return null
}
