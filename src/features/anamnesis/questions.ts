// src/features/anamnesis/questions.ts
// @eligi:anamnese-front-perguntas
// Regras de uma pergunta da ficha, para o editor avisar ANTES de salvar.
// Espelha o questionSchema do back (anamnesis.schemas.ts): duplicacao
// consciente, igual ao missingContent das mensagens. Quem decide e o back;
// mudou a regra la, muda aqui.

import type { AnamnesisQuestion, AnamnesisQuestionType } from './types'

export const TYPE_LABEL: Record<AnamnesisQuestionType, string> = {
  yes_no: 'Sim ou não',
  text: 'Texto curto',
  longtext: 'Texto longo',
  single_choice: 'Uma opção',
  multi_choice: 'Várias opções',
  date: 'Data',
}

/** Ordem dos tipos no editor: Sim/Nao primeiro, e o mais usado em anamnese. */
export const TYPE_ORDER: AnamnesisQuestionType[] = ['yes_no', 'text', 'longtext', 'single_choice', 'multi_choice', 'date']

/** Mesmos tetos do back. */
export const MAX_QUESTIONS = 60
export const LABEL_MAX = 300
export const HELP_MAX = 300
export const OPTION_MAX = 100
export const OPTIONS_MAX = 20
export const DETAIL_MAX = 120
export const ALERT_MAX = 60

export function isChoice(t: AnamnesisQuestionType): boolean {
  return t === 'single_choice' || t === 'multi_choice'
}

/**
 * Identificador de pergunta propria: "p_" + o texto sem acento. O prefixo
 * impede colisao com o banco (que nunca usa "p_"), e o id fica legivel no JSON
 * gravado. Regex do back: ^[a-z0-9_]{1,48}$.
 */
export function newQuestionId(label: string, taken: ReadonlySet<string>): string {
  const slug = label
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 36)
  const base = `p_${slug || 'pergunta'}`
  if (!taken.has(base)) return base
  for (let i = 2; i < 1000; i++) {
    const id = `${base}_${i}`
    if (!taken.has(id)) return id
  }
  return `p_${taken.size + 1}_${slug.slice(0, 20)}`
}

/** O que impede salvar esta pergunta, em portugues de tela. null = ok. */
export function questionProblem(q: AnamnesisQuestion): string | null {
  const label = q.label.trim()
  if (label.length < 3) return 'Escreva a pergunta.'
  if (label.length > LABEL_MAX) return 'Pergunta muito longa.'
  if (isChoice(q.type)) {
    const opts = (q.options ?? []).map((o) => o.trim()).filter(Boolean)
    if (opts.length < 2) return 'Coloque pelo menos 2 opções.'
    if (new Set(opts).size !== opts.length) return 'Há opções repetidas.'
  }
  if (q.type === 'yes_no' && q.isAlert && !(q.alertLabel ?? '').trim()) return 'Escreva o texto do alerta.'
  return null
}

/** Remove o que nao se aplica ao tipo, como o back faz ao gravar. */
export function cleanQuestion(q: AnamnesisQuestion): AnamnesisQuestion {
  const out: AnamnesisQuestion = { id: q.id, type: q.type, label: q.label.trim(), required: q.required }
  const help = (q.helpText ?? '').trim()
  if (help) out.helpText = help
  if (isChoice(q.type)) out.options = (q.options ?? []).map((o) => o.trim()).filter(Boolean)
  if (q.type === 'yes_no') {
    const detail = (q.detailLabel ?? '').trim()
    if (detail) out.detailLabel = detail
    if (q.isAlert) {
      out.isAlert = true
      out.alertLabel = (q.alertLabel ?? '').trim()
    }
  }
  return out
}

/** Mesma pergunta, mesmo conteudo? (para saber se ha alteracao nao salva) */
export function sameQuestions(a: readonly AnamnesisQuestion[], b: readonly AnamnesisQuestion[]): boolean {
  return JSON.stringify(a.map(cleanQuestion)) === JSON.stringify(b.map(cleanQuestion))
}
