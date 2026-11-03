// src/features/anamnesis/hooks/useAnamnesisSettings.ts
// @eligi:anamnese-front-settings
// Liga/desliga do modulo. O resultado guarda a "versao" que o gerou: assim o
// efeito nunca precisa de setState sincrono (React Compiler) e uma resposta
// velha nunca sobrescreve uma nova.
'use client'

import { useCallback, useEffect, useState } from 'react'
import { apiMessage, fetchSettings, saveSettings } from '../api'

interface Loaded {
  version: number
  enabled: boolean
  error: string | null
}

export function useAnamnesisSettings() {
  const [version, setVersion] = useState(0)
  const [data, setData] = useState<Loaded | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    fetchSettings().then(
      (s) => { if (alive) setData({ version, enabled: s.enabled, error: null }) },
      (e) => { if (alive) setData({ version, enabled: false, error: apiMessage(e, 'Não foi possível carregar as fichas.') }) },
    )
    return () => { alive = false }
  }, [version])

  const current = data && data.version === version ? data : null

  const retry = useCallback(() => setVersion((v) => v + 1), [])

  const activate = useCallback(async () => {
    setSaving(true)
    setSaveError(null)
    try {
      const s = await saveSettings(true)
      setData((d) => ({ version: d?.version ?? version, enabled: s.enabled, error: null }))
    } catch (e) {
      setSaveError(apiMessage(e, 'Não foi possível ativar agora. Tente de novo.'))
    } finally {
      setSaving(false)
    }
  }, [version])

  return {
    loading: !current,
    enabled: current?.enabled ?? false,
    error: current?.error ?? null,
    retry,
    activate,
    saving,
    saveError,
  }
}
