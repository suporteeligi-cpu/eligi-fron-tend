/* =========================================
   @eligi:raiox-config
   Configuracao do funil "Raio-X" (/comece).

   Os valores de `segment` sao os SEGMENTS canonicos do back-end
   (onboarding.schemas). Os 6 cards do quiz mapeiam pros 8 do banco: nao
   inventamos um segundo vocabulario pro mesmo conceito.

   WEEKS_PER_MONTH espelha a constante do signup-express.service. O numero
   exibido aqui e ilustrativo; o gravado no LeadIntake e sempre o recalculado
   no servidor.
========================================= */
import {
  Scissors,
  Sparkles,
  Eye,
  Hand,
  Heart,
  Store,
  MessageCircle,
  NotebookPen,
  LayoutGrid,
  Smartphone,
  type LucideIcon,
} from 'lucide-react'

export const WEEKS_PER_MONTH = 4.3

export type Segment =
  | 'BARBEARIA'
  | 'SALAO_BELEZA'
  | 'CLINICA_ESTETICA'
  | 'SOBRANCELHAS_CILIOS'
  | 'ESMALTERIA'
  | 'STUDIO'

export type CurrentTool = 'whatsapp' | 'paper' | 'booksy' | 'other_app'

export interface SegmentOption {
  value: Segment
  label: string
  icon: LucideIcon
  /** Prefixo do nome sugerido do estabelecimento na ultima tela. */
  namePrefix: string
}

export const SEGMENT_OPTIONS: SegmentOption[] = [
  { value: 'BARBEARIA', label: 'Barbearia', icon: Scissors, namePrefix: 'Barbearia' },
  { value: 'SALAO_BELEZA', label: 'Salão', icon: Sparkles, namePrefix: 'Salão' },
  { value: 'SOBRANCELHAS_CILIOS', label: 'Lash designer', icon: Eye, namePrefix: 'Studio' },
  { value: 'ESMALTERIA', label: 'Manicure', icon: Hand, namePrefix: 'Studio' },
  { value: 'CLINICA_ESTETICA', label: 'Estética', icon: Heart, namePrefix: 'Studio' },
  { value: 'STUDIO', label: 'Outro', icon: Store, namePrefix: 'Studio' },
]

export interface ToolOption {
  value: CurrentTool
  label: string
  icon: LucideIcon
}

export const TOOL_OPTIONS: ToolOption[] = [
  { value: 'whatsapp', label: 'WhatsApp / Direct', icon: MessageCircle },
  { value: 'paper', label: 'Papel / caderno', icon: NotebookPen },
  { value: 'booksy', label: 'Booksy', icon: LayoutGrid },
  { value: 'other_app', label: 'Outro app', icon: Smartphone },
]

/* ── Faixas dos sliders ── */
export const APPOINTMENTS = { min: 5, max: 200, step: 5, initial: 40 }
export const TICKET = { min: 20, max: 500, step: 5, initial: 60 }
export const NO_SHOWS = { min: 0, max: 30, step: 1, initial: 3 }

/* ── Passos ── */
export type StepId =
  | 'segment'
  | 'team'
  | 'volume'
  | 'ticket'
  | 'tool'
  | 'noshows'
  | 'result'
  | 'form'

/** Ordem da variante A. `result` nao consome numero na barra de progresso. */
export const STEPS: StepId[] = [
  'segment',
  'team',
  'volume',
  'ticket',
  'tool',
  'noshows',
  'result',
  'form',
]

/** Quantas perguntas o usuario ve (usado no "01 / 07"). */
export const TOTAL_QUESTIONS = 7

export function questionNumber(step: StepId): number {
  const map: Record<StepId, number> = {
    segment: 1,
    team: 2,
    volume: 3,
    ticket: 4,
    tool: 5,
    noshows: 6,
    result: 6,
    form: 7,
  }
  return map[step]
}

export function estimatedRevenue(weeklyAppointments: number, avgTicket: number): number {
  return weeklyAppointments * avgTicket * WEEKS_PER_MONTH
}

export function estimatedLoss(weeklyNoShows: number, avgTicket: number): number {
  return weeklyNoShows * avgTicket * WEEKS_PER_MONTH
}

export function formatBRL(value: number): string {
  return Math.round(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  })
}

/** Mascara BR progressiva: (11) 98765-4321 */
export function maskPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits.length ? '(' + digits : ''
  if (digits.length <= 7) return '(' + digits.slice(0, 2) + ') ' + digits.slice(2)
  return '(' + digits.slice(0, 2) + ') ' + digits.slice(2, 7) + '-' + digits.slice(7)
}

/** Previa do slug — mesma normalizacao do slugify(strict) do back-end. */
export function previewSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'seu-negocio'
  )
}
