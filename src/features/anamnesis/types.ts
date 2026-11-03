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
