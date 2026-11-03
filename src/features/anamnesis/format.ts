// src/features/anamnesis/format.ts
// @eligi:anamnese-front-format
// Datas sempre no fuso de Sao Paulo (o servidor grava em UTC). Data pura da
// resposta ("AAAA-MM-DD") nao tem fuso: so troca a ordem, nunca passa por Date.

import type { AnswerValue, YesNoAnswer } from './types'

const TZ = 'America/Sao_Paulo'
const DATE = new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric' })
const DATETIME = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
})

export function fmtDate(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : DATE.format(d)
}

export function fmtDateTime(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : DATETIME.format(d).replace(',', ' às')
}

export function fmtDateOnly(v: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : v
}

export function isYesNo(v: AnswerValue | undefined): v is YesNoAnswer {
  return typeof v === 'object' && v !== null && !Array.isArray(v) && typeof (v as YesNoAnswer).value === 'boolean'
}
