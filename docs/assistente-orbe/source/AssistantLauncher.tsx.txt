'use client'
// src/features/agenda/components/assistant/AssistantLauncher.tsx
// Ponto unico de montagem do Assistente Eligi. Vive no AgendaBoard, portanto
// serve os tres layouts (desktop, iPad e mobile) sem duplicacao.

import { useCallback, useState } from 'react'
import AssistantFab from './AssistantFab'
import AssistantSheet from './AssistantSheet'

export default function AssistantLauncher() {
  const [open, setOpen] = useState(false)
  const handleOpen  = useCallback(() => setOpen(true), [])
  const handleClose = useCallback(() => setOpen(false), [])

  return (
    <>
      <AssistantFab onOpen={handleOpen} hidden={open} />
      <AssistantSheet open={open} onClose={handleClose} />
    </>
  )
}
