// src/features/anamnesis/catalog.ts
// @eligi:anamnese-front-catalogo
// Montagem da ficha a partir do banco de perguntas que o back serve.
// Mesma regra de anamnesis.catalog.ts (back): perguntas na ordem das secoes e,
// dentro da secao, na ordem do banco; termo = abertura + clausulas + fecho.
// Os DADOS vem do servidor; aqui so mora a ordenacao, para a previa da tela.

import type { AnamnesisQuestion, BankQuestion, Catalog, SegmentKey } from './types'

/** Ids sugeridos pelos segmentos escolhidos, sem repeticao. */
export function recommendedIds(catalog: Catalog, segments: readonly SegmentKey[]): string[] {
  const ids = new Set<string>()
  for (const key of segments) {
    for (const id of catalog.segments.find((s) => s.key === key)?.recommended ?? []) ids.add(id)
  }
  return [...ids]
}

function toQuestion(q: BankQuestion): AnamnesisQuestion {
  const out: AnamnesisQuestion = { id: q.id, type: q.type, label: q.label, required: q.required }
  if (q.helpText) out.helpText = q.helpText
  if (q.options) out.options = [...q.options]
  if (q.detailLabel) out.detailLabel = q.detailLabel
  if (q.isAlert) {
    out.isAlert = true
    out.alertLabel = q.alertLabel
  }
  return out
}

/** Perguntas escolhidas, na ordem das secoes. Id desconhecido e ignorado. */
export function buildQuestions(catalog: Catalog, ids: ReadonlySet<string>): AnamnesisQuestion[] {
  const order = new Map(catalog.sections.map((s, i) => [s.key, i]))
  return catalog.questions
    .map((q, i) => ({ q, i }))
    .filter(({ q }) => ids.has(q.id))
    .sort((a, b) => (order.get(a.q.section) ?? 0) - (order.get(b.q.section) ?? 0) || a.i - b.i)
    .map(({ q }) => toQuestion(q))
}

export function buildConsentText(catalog: Catalog, segments: readonly SegmentKey[]): string {
  const clauses = segments
    .map((k) => catalog.segments.find((s) => s.key === k)?.consentClause)
    .filter((c): c is string => Boolean(c))
  return [catalog.consentOpening, ...clauses, catalog.consentClosing].join(' ')
}

export function suggestName(catalog: Catalog, segments: readonly SegmentKey[]): string {
  const names = segments
    .map((k) => catalog.segments.find((s) => s.key === k)?.name)
    .filter((n): n is string => Boolean(n))
  return names.length ? names.join(' + ') : 'Ficha de anamnese'
}

/** Nomes dos segmentos de uma ficha, para mostrar no cartao. */
export function segmentNames(catalog: Catalog | null, keys: readonly SegmentKey[]): string[] {
  if (!catalog) return []
  return keys.map((k) => catalog.segments.find((s) => s.key === k)?.name).filter((n): n is string => Boolean(n))
}

/* @eligi:anamnese-front-ficha-propria ---------------------------------------
   Ficha de "Outro tipo de servico" (nome livre, nenhum segmento do banco):
   nasce com as perguntas gerais de saude e alergia marcadas. Id que o back
   deixar de servir e ignorado, entao tirar uma pergunta do banco nao quebra. */
const GENERAL_IDS = ['gestante', 'lactante', 'medicamentos', 'alergia_geral', 'alergia_cosmeticos', 'observacoes']

export function generalIds(catalog: Catalog): string[] {
  const known = new Set(catalog.questions.map((q) => q.id))
  return GENERAL_IDS.filter((id) => known.has(id))
}
