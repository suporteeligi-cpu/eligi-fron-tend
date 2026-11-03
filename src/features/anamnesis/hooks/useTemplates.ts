// src/features/anamnesis/hooks/useTemplates.ts
// @eligi:anamnese-front-modelos-hook
// Modelos do estabelecimento + banco de perguntas, carregados juntos.
// Mesmo padrao do useRecords: o resultado guarda a versao que o gerou, entao o
// efeito nunca faz setState sincrono e resposta velha nao sobrescreve nova.
'use client'

import { useCallback, useEffect, useState } from 'react'
import { apiMessage, fetchCatalog, fetchTemplates } from '../api'
import type { Catalog, Template } from '../types'

interface Loaded {
  version: number
  templates: Template[]
  catalog: Catalog | null
  error: string | null
}

export function useTemplates() {
  const [version, setVersion] = useState(0)
  const [data, setData] = useState<Loaded | null>(null)

  useEffect(() => {
    let alive = true
    Promise.all([fetchTemplates(), fetchCatalog()]).then(
      ([templates, catalog]) => { if (alive) setData({ version, templates, catalog, error: null }) },
      (e) => { if (alive) setData({ version, templates: [], catalog: null, error: apiMessage(e, 'Não foi possível carregar as fichas.') }) },
    )
    return () => { alive = false }
  }, [version])

  const current = data && data.version === version ? data : null

  const reload = useCallback(() => setVersion((v) => v + 1), [])

  /** Troca um modelo na lista sem recarregar tudo (ativar/desativar). */
  const replace = useCallback((t: Template) => {
    setData((d) => (d ? { ...d, templates: d.templates.map((x) => (x.id === t.id ? t : x)) } : d))
  }, [])

  const remove = useCallback((id: string) => {
    setData((d) => (d ? { ...d, templates: d.templates.filter((x) => x.id !== id) } : d))
  }, [])

  return {
    loading: !current,
    templates: current?.templates ?? [],
    catalog: current?.catalog ?? null,
    error: current?.error ?? null,
    reload,
    replace,
    remove,
  }
}
