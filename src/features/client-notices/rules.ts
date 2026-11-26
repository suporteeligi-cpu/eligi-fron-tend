// src/features/client-notices/rules.ts
// @eligi:cnot-rules — funcoes puras da tela de Promocoes e avisos (nov/2026).
// Nenhuma le o relogio sozinha: quem chama passa a data (pureza do React Compiler).

import { firstName } from '@/shared/utils/whatsapp'
import type { Audience, Data, Kind, Week } from './types'

export const TITLE_MAX = 40
export const BODY_MAX = 178
/** Igual ao PIN_MAX_DAYS do back: a faixa fica no maximo 30 dias depois do envio. */
export const PIN_MAX_DAYS = 30

export const len = (s: string) => [...s].length
export const needsRef = (a: Audience) => a === 'SERVICE' || a === 'PROFESSIONAL'
export const exemplo = (s: string) => s.replace(/\{\s*nome\s*\}/gi, 'Ana')

/** Semana do tipo. Back antigo sem `weeks`: promocao usa `week`, aviso fica 0 de 3. */
export function weekOf(d: Data, kind: Kind): Week {
  if (d.weeks?.[kind]) return d.weeks[kind]
  return kind === 'PROMO' ? d.week : { used: 0, max: 3, resetsAt: d.week.resetsAt }
}

export function dataHora(iso: string): string {
  const d = new Date(iso)
  const dia = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).replace('.', '')
  return `${dia} · ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}

const pad = (n: number) => String(n).padStart(2, '0')

/** "YYYY-MM-DD" do dia local de uma data. */
export function ymd(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Soma dias a um "YYYY-MM-DD" (meio-dia, nunca escorrega de dia). */
export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split('-').map(Number)
  const x = new Date(y, m - 1, d, 12)
  x.setDate(x.getDate() + n)
  return ymd(x)
}

/** "21/11" a partir de "2026-11-21". */
export function diaMes(day: string): string {
  const [, m, d] = day.split('-')
  return `${d}/${m}`
}

/** Dia do envio: hoje, ou o dia escolhido no "datetime-local" ("YYYY-MM-DDTHH:mm"). */
export function sendDay(when: 'now' | 'later', at: string, today: string): string {
  if (when === 'later' && /^\d{4}-\d{2}-\d{2}/.test(at)) return at.slice(0, 10)
  return today
}

/** Como a faixa aparece no link: sem {nome} e sem a pontuacao que sobra (igual ao bannerOf do back). */
export function semNome(s: string, capitalizeAlways = false): string {
  const sem = s.replace(/\{\s*nome\s*\}/gi, '')
  const limpo = sem.replace(/^[\s,;:.!?-]+/, '')
  const mudou = limpo !== sem || capitalizeAlways
  return mudou && limpo ? limpo.charAt(0).toLocaleUpperCase('pt-BR') + limpo.slice(1) : limpo
}

/** Faixa valida para o dia de envio (mesma regra do back, so para avisar antes). */
export function pinProblem(pinUntil: string, envio: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(pinUntil)) return 'Escolha até que dia a faixa fica.'
  if (pinUntil < envio) return 'A faixa tem que ficar até o dia do envio ou depois.'
  if (pinUntil > addDays(envio, PIN_MAX_DAYS)) return `A faixa fica no máximo ${PIN_MAX_DAYS} dias depois do envio.`
  return null
}

/**
 * Convite pelo WhatsApp para quem nao tem o app. Sem artigo antes do nome do lugar
 * (o sistema nao sabe o genero) e sem falar em "promocao": o convite e para marcar.
 */
export function inviteMessage(clientName: string, businessName: string, link: string): string {
  const nome = firstName(clientName)
  const oi = nome && nome !== 'Cliente' ? `Oi, ${nome}! Tudo bem?` : 'Oi! Tudo bem?'
  return `${oi} ${businessName} agora tem agendamento pelo app Eligi Cliente. Por lá você marca seu horário e recebe nossos avisos no celular, como horário de feriado. É só abrir: ${link}`
}

/** "há 12 dias", "há 3 meses" a partir da ultima visita; `now` vem de quem chama. */
export function haQuanto(iso: string | null, now: Date): string {
  if (!iso) return 'Nunca veio'
  const dias = Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000))
  if (dias === 0) return 'Veio hoje'
  if (dias < 60) return `Veio há ${dias} ${dias === 1 ? 'dia' : 'dias'}`
  const meses = Math.floor(dias / 30)
  return `Veio há ${meses} meses`
}
