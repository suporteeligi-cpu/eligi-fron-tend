// src/features/anamnesis/types.ts
// @eligi:anamnese-front-types
// Contratos de /anamnesis (back-end, src/modules/anamnesis). Espelho de leitura:
// quem valida e decide e o back.

export type AnamnesisQuestionType = 'text' | 'longtext' | 'yes_no' | 'single_choice' | 'multi_choice' | 'date'

export interface AnamnesisQuestion {
  id: string
  type: AnamnesisQuestionType
  label: string
  required: boolean
  helpText?: string
  options?: string[]
  detailLabel?: string
  isAlert?: boolean
  alertLabel?: string
}

export interface YesNoAnswer {
  value: boolean
  detail?: string
}

export type AnswerValue = string | string[] | YesNoAnswer

export type RecordStatus = 'VALID' | 'EXPIRED'
export type FilledBy = 'CLIENT' | 'STAFF'

export interface RecordListItem {
  id: string
  client: { id: string; name: string }
  templateId: string
  templateName: string
  templateVersion: number
  completedAt: string
  expiresAt: string
  status: RecordStatus
  filledBy: FilledBy
  /** Ausente para quem nao ve conteudo (recepcao): o selo ja e dado de saude. */
  hasAlert?: boolean
}

export interface RecordPage {
  items: RecordListItem[]
  nextCursor: string | null
}

export interface AnamnesisAlert {
  questionId: string
  label: string
  detail: string | null
}

export interface RecordDetail {
  id: string
  client: { id: string; name: string; phone: string | null }
  templateId: string
  templateName: string
  templateVersion: number
  bookingId: string | null
  questions: AnamnesisQuestion[]
  answers: Record<string, AnswerValue>
  alerts: AnamnesisAlert[]
  consentText: string | null
  consentAt: string
  consentIp: string | null
  filledBy: FilledBy
  filledByName: string | null
  completedAt: string
  expiresAt: string
  status: RecordStatus
}

/** Filtros da lista: "com alerta" so existe para quem ve conteudo. */
export type RecordFilter = 'all' | 'alert' | 'expired'

/* @eligi:anamnese-front-types-modelos -------------------------------------
   Modelos (Fatia 2b). O banco de perguntas vem do back (GET /anamnesis/catalog):
   o front nao guarda copia dele. */

export type SectionKey = string
export type SegmentKey = string

export interface BankQuestion extends AnamnesisQuestion {
  section: SectionKey
}

export interface CatalogSegment {
  key: SegmentKey
  name: string
  description: string
  recommended: string[]
  consentClause: string
}

export interface Catalog {
  sections: { key: SectionKey; name: string }[]
  questions: BankQuestion[]
  segments: CatalogSegment[]
  consentOpening: string
  consentClosing: string
}

export interface Template {
  id: string
  name: string
  segments: SegmentKey[]
  questions: AnamnesisQuestion[]
  consentText: string
  version: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  services: { id: string; name: string }[]
  stats: { questions: number; alerts: number; records: number }
}

export interface TemplateCreatePayload {
  name: string
  segments: SegmentKey[]
  questions: AnamnesisQuestion[]
  consentText: string
  serviceIds: string[]
}

/** Servico do estabelecimento como o GET /services devolve (so o que a ficha usa). */
export interface ServiceLite {
  id: string
  name: string
  anamnesisTemplateId: string | null
  categoryName: string | null
}
