// src/features/anamnesis/api.ts
// @eligi:anamnese-front-api
// Chamadas de /anamnesis. Toda permissao e decidida no back; a tela so traduz
// o erro para uma frase.

import api from '@/shared/lib/apiClient'
import type { RecordDetail, RecordFilter, RecordPage } from './types'

interface ApiErrorShape {
  response?: { status?: number; data?: { message?: string; error?: string; code?: string } }
}

export function apiStatus(e: unknown): number | null {
  return (e as ApiErrorShape)?.response?.status ?? null
}

export function apiMessage(e: unknown, fallback: string): string {
  const data = (e as ApiErrorShape)?.response?.data
  if (apiStatus(e) === null) return 'Sem conexão com o servidor. Tente de novo.'
  return data?.message ?? data?.error ?? fallback
}

export async function fetchSettings(): Promise<{ enabled: boolean }> {
  const res = await api.get<{ enabled: boolean }>('/anamnesis/settings')
  return { enabled: !!res.data?.enabled }
}

export async function saveSettings(enabled: boolean): Promise<{ enabled: boolean }> {
  const res = await api.put<{ enabled: boolean }>('/anamnesis/settings', { enabled })
  return { enabled: !!res.data?.enabled }
}

export const RECORDS_PAGE = 30

export async function fetchRecords(p: { filter: RecordFilter; q: string; cursor?: string }): Promise<RecordPage> {
  const params: Record<string, string> = { limit: String(RECORDS_PAGE) }
  if (p.q) params.q = p.q
  if (p.filter === 'alert') params.alert = '1'
  if (p.filter === 'expired') params.status = 'expired'
  if (p.cursor) params.cursor = p.cursor
  const res = await api.get<RecordPage>('/anamnesis/records', { params })
  return { items: res.data?.items ?? [], nextCursor: res.data?.nextCursor ?? null }
}

export async function fetchRecord(id: string): Promise<RecordDetail> {
  const res = await api.get<RecordDetail>(`/anamnesis/records/${encodeURIComponent(id)}`)
  return res.data
}

export async function eraseRecord(id: string): Promise<void> {
  await api.delete(`/anamnesis/records/${encodeURIComponent(id)}`)
}
