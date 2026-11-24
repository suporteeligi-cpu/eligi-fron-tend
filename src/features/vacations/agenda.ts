// src/features/vacations/agenda.ts
// @eligi:vac-fe-agenda — Modo Ferias na agenda do painel (fatia 3).
// O /agenda/day ja manda `vacation` em cada profissional que esta de ferias no
// dia pedido. Aqui ficam as regras de tela, puras, usadas pelas 3 visoes.
import { ddmm } from './api'

export type AgendaVacation = { startDate: string; endDate: string; returnDate: string }

type WithVacation = { name: string; vacation?: AgendaVacation | null }

function firstName(n: string): string {
  return n.trim().split(/\s+/)[0] || n
}

/** "Férias · volta 05/01" (rotulo na coluna listrada). */
export function vacationLabel(v: AgendaVacation | null | undefined): string | undefined {
  return v ? `Férias · volta ${ddmm(v.returnDate)}` : undefined
}

/** As ferias cobrem o dia "YYYY-MM-DD"? (as duas pontas contam) */
export function vacationCovers(v: AgendaVacation | null | undefined, day: string): boolean {
  return !!v && v.startDate <= day && day <= v.endDate
}

/** Frase para a confirmacao de encaixe: "Ana está de férias até 15/12." */
export function vacationNote(p: WithVacation | null | undefined): string | null {
  if (!p?.vacation) return null
  return `${firstName(p.name)} está de férias até ${ddmm(p.vacation.endDate)}.`
}
