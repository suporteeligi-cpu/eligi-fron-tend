// src/features/agenda/components/assistant/assistant.api.ts
// Cliente do endpoint de leitura da agenda.

import api from '@/shared/lib/apiClient'

export interface AssistantAnswer {
  understood: boolean
  answer: string
  intent: string | null
  data: unknown
  denied: boolean
}

interface Envelope {
  success?: boolean
  data?: AssistantAnswer
}

const FALLBACK: AssistantAnswer = {
  understood: false,
  answer: 'Nao consegui consultar a agenda agora. Tente de novo.',
  intent: null,
  data: null,
  denied: false,
}

export async function askAssistant(text: string): Promise<AssistantAnswer> {
  try {
    const res = await api.post<Envelope>('/assistant/ask', { text })
    const payload = res.data?.data
    if (!payload || typeof payload.answer !== 'string') return FALLBACK
    return payload
  } catch {
    return FALLBACK
  }
}
