// src/shared/utils/whatsapp.ts
//
// Helper unico de WhatsApp. Antes duplicado em BookingViewPanel e SideCheckoutPanel
// (divida registrada no CLAUDE.md) — centralizado aqui.
//
// Regra de telefone: <= 11 digitos = nacional (DDD + numero) -> prefixa DDI 55.
// E.164 (13 digitos, ja com 55) passa direto.

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
