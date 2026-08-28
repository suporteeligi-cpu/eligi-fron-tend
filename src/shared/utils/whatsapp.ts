// src/shared/utils/whatsapp.ts
//
// Helper unico de WhatsApp. Antes duplicado em BookingViewPanel e SideCheckoutPanel
// (divida registrada no CLAUDE.md) — centralizado aqui.
//
// Regra de telefone: <= 11 digitos = nacional (DDD + numero) -> prefixa DDI 55.
// E.164 (13 digitos, ja com 55) passa direto.

// @eligi:wa-firstname-own
// Movido de messageTemplate.ts na faxina do modulo de templates.
// O arquivo de origem foi apagado; esta e a unica implementacao no repo.
/** Primeiro nome, com fallback para a string inteira. */
export function firstName(fullName: string): string {
  const trimmed = fullName.trim()
  return trimmed.split(' ')[0] || trimmed
}

/** Digitos prontos pro wa.me (com DDI). */
export function waDigits(phone: string): string {
  let d = phone.replace(/\D/g, '')
  if (d.length <= 11) d = `55${d}`
  return d
}

/** Link do WhatsApp. Com `message`, ja abre a conversa com o texto preenchido. */
export function waLink(phone: string, message?: string): string {
  const base = `https://wa.me/${waDigits(phone)}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}

/** Mensagem padrao de cobranca do clube (link do checkout hospedado). */
export function clubPaymentMessage(
  clientName: string,
  businessName: string,
  link: string,
): string {
  const first = clientName.trim().split(' ')[0] || clientName
  return `Oi, ${first}! 👋 Aqui é da ${businessName}. Pra ativar sua assinatura do clube, é só cadastrar seu cartão neste link: ${link}\n\nQualquer dúvida, me chama!`
}

// @eligi:msgtpl-wa-share
/**
 * Link de compartilhamento SEM destinatario.
 *
 * Abre o WhatsApp com o texto ja preenchido e deixa o lojista escolher o
 * contato, grupo ou status. Quem aperta enviar e o humano — nao e disparo
 * automatizado, o que evita a exigencia de template aprovado na Meta.
 */
export function waShareLink(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`
}

// @eligi:confirmsg-segments
/** Teto do corpo. 500 nao e estetica: o texto viaja em wa.me?text= depois de
 *  encodeURIComponent, e emoji custa ~12 caracteres codificados. */
export const CONFIRM_BODY_MAX = 500

/** Blocos opcionais da mensagem de confirmacao. Todos ja formatados: este
 *  arquivo nao importa dayjs nem sabe o que e um agendamento. */
export interface ConfirmMessageBlocks {
  price?: string | null
  address?: string | null
  mapsUrl?: string | null
  pix?: { type: string; key: string; holder: string } | null
  rescheduleLabel?: string | null
  policy?: string | null
  note?: string | null
  signature?: string | null
}

export type ConfirmBlockKey =
  | 'price'
  | 'address'
  | 'pix'
  | 'reschedule'
  | 'policy'
  | 'note'
  | 'closing'
  | 'signature'

export interface ConfirmMessageInput {
  clientName: string
  dateLabel: string
  timeLabel: string
  serviceLabel: string
  blocks?: ConfirmMessageBlocks
}

/**
 * Mensagem de confirmacao em PARTES.
 *
 * Existe para que a tela de configuracao desenhe bloco a bloco (cada um
 * clicavel) e o WhatsApp receba o texto inteiro, sem duas formatacoes
 * paralelas que um dia divergiriam. A previa e literalmente o que sai.
 *
 * Ordem fixa e deliberada: dinheiro, onde, como pagar, como remarcar, avisos,
 * despedida, assinatura. Nao e configuravel — ninguem abre a tela querendo o
 * PIX na terceira linha.
 *
 * Emoji aqui e CONTEUDO indo pro WhatsApp, nao interface: a regra de usar
 * Lucide vale para a UI, nao para o texto enviado. O icone de servico e
 * neutro de segmento (a plataforma atende clinica e podologia).
 */
export function confirmMessageSegments(input: ConfirmMessageInput): {
  head: string
  blocks: { key: ConfirmBlockKey; text: string }[]
} {
  const b = input.blocks ?? {}
  const head = [
    `Olá, ${firstName(input.clientName)}! 👋`,
    '',
    'Seu horário está confirmado:',
    '',
    `📅 ${input.dateLabel}`,
    `⏰ ${input.timeLabel}`,
    `📋 ${input.serviceLabel}`,
  ].join('\n')

  const blocks: { key: ConfirmBlockKey; text: string }[] = []

  if (b.price) blocks.push({ key: 'price', text: `💰 ${b.price}` })

  if (b.address) {
    blocks.push({
      key: 'address',
      text: b.mapsUrl ? `📍 ${b.address}\n${b.mapsUrl}` : `📍 ${b.address}`,
    })
  }

  if (b.pix) {
    blocks.push({
      key: 'pix',
      text: `💳 Pagamento por PIX\n${b.pix.type}: ${b.pix.key}\nTitular: ${b.pix.holder}`,
    })
  }

  if (b.rescheduleLabel) {
    blocks.push({ key: 'reschedule', text: `🔗 Remarcar ou cancelar: ${b.rescheduleLabel}` })
  }

  if (b.policy) blocks.push({ key: 'policy', text: `⚠️ ${b.policy}` })
  if (b.note) blocks.push({ key: 'note', text: `📝 ${b.note}` })

  // Despedida sempre presente: mensagem que termina em chave PIX soa cobranca.
  blocks.push({ key: 'closing', text: 'Qualquer imprevisto, é só me avisar por aqui. Até lá!' })

  if (b.signature) blocks.push({ key: 'signature', text: `— ${b.signature}` })

  return { head, blocks }
}

/** Texto final entregue ao wa.me. Join dos mesmos segmentos da previa. */
export function bookingConfirmationMessage(input: ConfirmMessageInput): string {
  const { head, blocks } = confirmMessageSegments(input)
  return [head, ...blocks.map(s => s.text)].join('\n\n')
}
