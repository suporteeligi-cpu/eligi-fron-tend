// src/shared/utils/whatsapp.ts
//
// Helper unico de WhatsApp. Antes duplicado em BookingViewPanel e SideCheckoutPanel
// (divida registrada no CLAUDE.md) — centralizado aqui.
//
// Regra de telefone: <= 11 digitos = nacional (DDD + numero) -> prefixa DDI 55.
// E.164 (13 digitos, ja com 55) passa direto.

import { firstName } from './messageTemplate' // @eligi:wa-firstname-import

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

// @eligi:wa-booking-confirm-msg
/**
 * Mensagem de confirmacao de horario, pre-preenchida no botao do
 * BookingViewPanel.
 *
 * Recebe rotulos JA formatados de proposito: este helper nao importa dayjs.
 * A formatacao de data mora no painel, que ja carrega utc + timezone e o
 * locale pt-br. Aqui fica so a composicao do texto, que e a parte que
 * precisa de fonte unica.
 *
 * Sem link publico de agendamento: o cliente ja esta agendado, convidar de
 * novo e ruido. Por isso NAO passa pelo renderTemplate, que anexa {link}
 * no fim por regra dura.
 */
export function bookingConfirmationMessage(input: {
  clientName: string
  dateLabel: string
  timeLabel: string
  serviceLabel: string
}): string {
  return [
    `Olá, ${firstName(input.clientName)}! 👋`,
    '',
    'Seu horário está confirmado:',
    '',
    `📅 ${input.dateLabel}`,
    `⏰ ${input.timeLabel}`,
    `📋 ${input.serviceLabel}`,
    '',
    'Qualquer imprevisto, é só me avisar por aqui. Até lá!',
  ].join('\n')
}
