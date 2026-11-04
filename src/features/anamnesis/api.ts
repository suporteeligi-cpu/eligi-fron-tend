// src/features/anamnesis/api.ts
// @eligi:anamnese-front-api
// Chamadas de /anamnesis. Toda permissao e decidida no back; a tela so traduz
// o erro para uma frase.

import api from '@/shared/lib/apiClient'
import type {
  AnamnesisQuestion, Catalog, RecordDetail, RecordFilter, RecordPage, ServiceLite, Template, TemplateCreatePayload,
} from './types'

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

/* @eligi:anamnese-front-api-modelos ---------------------------------------- */

export async function fetchCatalog(): Promise<Catalog> {
  const res = await api.get<Catalog>('/anamnesis/catalog')
  return res.data
}

export async function fetchTemplates(): Promise<Template[]> {
  const res = await api.get<Template[]>('/anamnesis/templates')
  return Array.isArray(res.data) ? res.data : []
}

export async function createTemplate(payload: TemplateCreatePayload): Promise<Template> {
  const res = await api.post<Template>('/anamnesis/templates', payload)
  return res.data
}

export async function setTemplateActive(id: string, isActive: boolean): Promise<Template> {
  const res = await api.patch<Template>(`/anamnesis/templates/${encodeURIComponent(id)}/active`, { isActive })
  return res.data
}

export async function deleteTemplate(id: string): Promise<void> {
  await api.delete(`/anamnesis/templates/${encodeURIComponent(id)}`)
}

interface RawService {
  id: string
  name: string
  anamnesisTemplateId?: string | null
  serviceCategory?: { name?: string | null } | null
}

/** Servicos ativos do estabelecimento (a mesma rota da tela de Servicos). */
export async function fetchServices(): Promise<ServiceLite[]> {
  const res = await api.get('/services')
  const raw: unknown = res.data?.data ?? res.data
  if (!Array.isArray(raw)) return []
  return (raw as RawService[]).map((s) => ({
    id: s.id,
    name: s.name,
    anamnesisTemplateId: s.anamnesisTemplateId ?? null,
    categoryName: s.serviceCategory?.name ?? null,
  }))
}

/* @eligi:anamnese-front-api-editor ----------------------------------------- */

export interface TemplateUpdatePayload {
  name?: string
  questions?: AnamnesisQuestion[]
  consentText?: string
}

export async function updateTemplate(id: string, payload: TemplateUpdatePayload): Promise<Template> {
  const res = await api.put<Template>(`/anamnesis/templates/${encodeURIComponent(id)}`, payload)
  return res.data
}

export async function setTemplateServices(id: string, serviceIds: string[]): Promise<Template> {
  const res = await api.put<Template>(`/anamnesis/templates/${encodeURIComponent(id)}/services`, { serviceIds })
  return res.data
}
