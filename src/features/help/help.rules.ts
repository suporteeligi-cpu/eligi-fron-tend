// src/features/help/help.rules.ts
// @eligi:help-rules
//
// Regras puras da ajuda do painel: o que cada cargo ve, qual assunto puxar pela
// tela atual, busca e a mensagem que vai para o WhatsApp do suporte. Sem React,
// sem window: o componente so chama.

import type { Role } from '@/app/components/navigation/navigation.config'
import { canAccessRoute } from '@/app/components/navigation/routeAccess'
import type { HelpGuide, HelpTopic } from './helpContent'

/** Evento que abre o chat de ajuda (menu Mais do celular). */
export const HELP_OPEN_EVENT = 'eligi:help-open'

/** WhatsApp do suporte do Eligi (corporativo). */
export const SUPPORT_PHONE = '11918579495'

/** Toques nas respostas antes de oferecer falar com uma pessoa. */
export const HUMAN_AFTER_CLICKS = 5

/** Teto do texto livre que a pessoa escreve antes de mandar. */
export const NOTE_MAX = 500

/** Tira acento e caixa, para busca e comparacao. */
export function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

/**
 * Assuntos e guias que este cargo ve. Guia de outro cargo sai; guia `webOnly`
 * sai dentro do app; link para tela que o cargo nao abre vira guia sem link.
 * Assunto sem guia nenhum some.
 */
export function visibleTopics(topics: HelpTopic[], role: string | undefined, isApp: boolean): HelpTopic[] {
  const out: HelpTopic[] = []
  for (const t of topics) {
    const guides: HelpGuide[] = []
    for (const g of t.guides) {
      if (g.roles && !g.roles.includes(role as Role)) continue
      if (g.webOnly && isApp) continue
      if (g.href && !canAccessRoute(role, g.href.split('?')[0])) {
        guides.push({ ...g, href: undefined, hrefLabel: undefined })
      } else {
        guides.push(g)
      }
    }
    if (guides.length) out.push({ ...t, guides })
  }
  return out
}

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(prefix + '/')
}

/** Assunto da tela atual: o de prefixo mais longo. */
export function topicForPath(topics: HelpTopic[], pathname: string | null): HelpTopic | null {
  if (!pathname) return null
  let best: { t: HelpTopic; len: number } | null = null
  for (const t of topics) {
    for (const p of t.paths) {
      if (matchesPrefix(pathname, p) && (!best || p.length > best.len)) best = { t, len: p.length }
    }
  }
  return best?.t ?? null
}

const SCREENS: [string, string][] = [
  ['/dashboard/agenda', 'Agenda'],
  ['/dashboard/clientes', 'Clientes'],
  ['/dashboard/anamnese', 'Fichas'],
  ['/dashboard/servicos', 'Serviços'],
  ['/dashboard/pacotes', 'Pacotes'],
  ['/dashboard/eligiclub', 'EligiClub'],
  ['/dashboard/equipe', 'Equipe'],
  ['/dashboard/estoque', 'Estoque'],
  ['/dashboard/caixa', 'Caixa'],
  ['/dashboard/financeiro', 'Financeiro'],
  ['/dashboard/financeiro/vendas', 'Financeiro › Vendas'],
  ['/dashboard/financeiro/comissoes', 'Comissões'],
  ['/dashboard/financeiro/despesas', 'Financeiro › Despesas'],
  ['/dashboard/relatorios', 'Relatórios'],
  ['/dashboard/notas-fiscais', 'Notas Fiscais'],
  ['/dashboard/configuracoes', 'Configurações'],
  ['/dashboard/configuracoes/empresa', 'Configurações › Perfil e endereço'],
  ['/dashboard/configuracoes/horarios', 'Configurações › Horário'],
  ['/dashboard/configuracoes/agendamento', 'Configurações › Regras do agendamento'],
  ['/dashboard/configuracoes/mensagens', 'Configurações › Mensagem de confirmação'],
  ['/dashboard/configuracoes/assinatura', 'Configurações › Assinatura'],
  ['/dashboard/configuracoes/eligiclub', 'Configurações › Cobrança do EligiClub'],
  ['/dashboard/configuracoes/notificacoes', 'Configurações › Avisos'],
  ['/dashboard/configuracoes/aparencia', 'Configurações › Aparência'],
  ['/dashboard/conta', 'Minha conta'],
]

/** Nome da tela para a mensagem do suporte. */
export function screenLabel(pathname: string | null): string {
  if (!pathname) return 'Painel'
  if (pathname === '/dashboard') return 'Visão geral'
  let best: { label: string; len: number } | null = null
  for (const [p, label] of SCREENS) {
    if (matchesPrefix(pathname, p) && (!best || p.length > best.len)) best = { label, len: p.length }
  }
  return best?.label ?? 'Painel'
}

export interface GuideHit { topic: HelpTopic; guide: HelpGuide }

const STOP = new Set(['de', 'da', 'do', 'das', 'dos', 'um', 'uma', 'o', 'a', 'os', 'as', 'e', 'para', 'pra', 'com', 'no', 'na', 'em', 'meu', 'minha', 'que', 'como', 'quero', 'eu'])

/**
 * Busca por palavra (sem acento). Cada palavra pesa mais na palavra-chave e na
 * pergunta do que no passo a passo; guia que nao acerta nenhuma palavra sai.
 */
export function searchGuides(topics: HelpTopic[], query: string, limit = 6): GuideHit[] {
  const words = normalize(query).split(/[^a-z0-9]+/).filter((w) => w.length >= 2 && !STOP.has(w))
  if (!words.length) return []
  const scored: { hit: GuideHit; score: number; order: number }[] = []
  let order = 0
  for (const topic of topics) {
    for (const guide of topic.guides) {
      const head = normalize(`${guide.ask} ${guide.title} ${topic.title}`)
      const keys = normalize((guide.keywords ?? []).join(' '))
      const body = normalize(guide.steps.join(' '))
      let score = 0
      let matched = 0
      for (const w of words) {
        const k = keys.includes(w) ? 3 : 0
        const h = head.includes(w) ? 2 : 0
        const b = body.includes(w) ? 1 : 0
        if (k + h + b > 0) matched++
        score += k + h + b
      }
      if (matched > 0 && matched * 2 >= words.length) scored.push({ hit: { topic, guide }, score, order: order++ })
    }
  }
  scored.sort((a, b) => b.score - a.score || a.order - b.order)
  return scored.slice(0, limit).map((s) => s.hit)
}

export interface SupportContext {
  topicTitle?: string
  guideTitle?: string
  /** A pessoa viu o passo a passo e disse que nao resolveu. */
  triedGuide: boolean
  note?: string
  businessName?: string | null
  userName?: string | null
  roleLabel?: string
  screen: string
}

/** Mensagem que abre no WhatsApp do suporte. Sem dado de cliente, so da conta. */
export function supportMessage(c: SupportContext): string {
  const lines: string[] = ['Olá! Vim pela ajuda do painel do Eligi.', '']
  const assunto = [c.topicTitle, c.guideTitle].filter(Boolean).join(' › ')
  lines.push(`Assunto: ${assunto || 'ainda não sei dizer'}`)
  if (c.triedGuide) lines.push('Já tentei o passo a passo e não resolveu.')
  const note = (c.note ?? '').trim().slice(0, NOTE_MAX)
  if (note) lines.push('', note)
  lines.push('')
  const quem = [c.businessName?.trim(), c.userName?.trim() ? `${c.userName.trim()}${c.roleLabel ? ` (${c.roleLabel})` : ''}` : null]
    .filter(Boolean).join(' · ')
  if (quem) lines.push(quem)
  lines.push(`Tela: ${c.screen}`)
  return lines.join('\n')
}
