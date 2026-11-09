// src/features/clients/utils/format.ts

/** Iniciais (até 2 primeiras letras do nome em caixa alta) */
export function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

/** Formata telefone brasileiro: "11999998888" → "(11) 99999-8888".
 *  Telefone é opcional no cadastro — null/undefined/'' retornam ''. */
export function formatPhone(p: string | null | undefined): string {
  if (!p) return ''
  const d = p.replace(/\D/g, '')
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return p
}

/** Mascara progressivamente enquanto digita (para inputs) */
// @eligi:birthday-mask
/** Mascara progressiva DD/MM/AAAA. O ano e OPCIONAL: "23/08" e entrada valida. */
export function maskBirthDate(v: string | null | undefined): string {
  const d = (v ?? '').replace(/\D/g, '').slice(0, 8)
  if (d.length <= 2) return d
  if (d.length <= 4) return d.slice(0, 2) + '/' + d.slice(2)
  return d.slice(0, 2) + '/' + d.slice(2, 4) + '/' + d.slice(4)
}

/** Espelha o formatBirth do back (shared/utils/birthday.ts) para o PUT, que
 *  devolve o registro cru (birthMonthDay/birthYear) e nao o birthLabel. */
export function formatBirthLabel(md: number | null | undefined, year: number | null | undefined): string | null {
  if (md === null || md === undefined || !Number.isInteger(md)) return null
  const month = Math.floor(md / 100)
  const day   = md % 100
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  const dd = String(day).padStart(2, '0')
  const mm = String(month).padStart(2, '0')
  return year ? `${dd}/${mm}/${year}` : `${dd}/${mm}`
}

export function maskPhone(v: string | null | undefined): string {
  const d = (v ?? '').replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return `(${d}`
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

// @eligi:clients-format-v2
const BRL_INT = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })
const BRL_2   = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const MESES   = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ']
const MESES_L = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/** "R$ 1.530" (sem centavos) — linha da lista. Zero vira "R$ 0". */
export function fmtMoneyShort(v: number | null | undefined): string {
  return `R$ ${BRL_INT.format(Math.round(v ?? 0))}`
}

/** "1.530,00" — sem o prefixo, para colunas numericas. */
export function fmtMoney2(v: number | null | undefined): string {
  return BRL_2.format(v ?? 0)
}

/** Parte inteira e centavos separados, para o numero grande da ficha. */
export function splitMoney(v: number | null | undefined): { int: string; cents: string } {
  const [int, cents = '00'] = BRL_2.format(v ?? 0).split(',')
  return { int, cents }
}

/** "02 NOV" — data curta em mono, no fuso de Sao Paulo. */
export function fmtShortDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const parts = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: 'numeric', year: 'numeric' })
    .formatToParts(d)
  const day   = parts.find(p => p.type === 'day')?.value ?? ''
  const month = Number(parts.find(p => p.type === 'month')?.value ?? '1')
  return `${day} ${MESES[month - 1] ?? ''}`
}

/** "mar 2025" — mes e ano, no fuso de Sao Paulo. */
export function fmtMonthYear(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const parts = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', month: 'numeric', year: 'numeric' })
    .formatToParts(d)
  const month = Number(parts.find(p => p.type === 'month')?.value ?? '1')
  const year  = parts.find(p => p.type === 'year')?.value ?? ''
  return `${MESES_L[month - 1] ?? ''} ${year}`
}

/** Ano da data no fuso de Sao Paulo (para separar o historico por ano). */
export function yearOf(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', year: 'numeric' }).format(new Date(iso))
}

export function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}
