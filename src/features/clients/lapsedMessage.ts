// src/features/clients/lapsedMessage.ts
// @eligi:lapsed-msg — mensagem pronta para chamar um cliente sumido (nov/2026).
// Funcao pura: quem envia e a pessoa, pelo WhatsApp (wa.me). Nunca fala em
// "sumido": o texto vai para o cliente. Sem artigo antes do nome do
// profissional ("o"/"a") nem antes do estabelecimento ("na"/"no"): o
// sistema nao sabe o genero.

import { firstName } from '@/shared/utils/whatsapp'

export interface LapsedMessageInput {
  clientName:   string
  /** profissional de quem o cliente e; null = sem preferencia */
  pro:          { name: string; active: boolean } | null
  /** quem vai atender quando o profissional saiu; null = "nossa equipe" */
  replacement:  string | null
}

export function lapsedMessage({ clientName, pro, replacement }: LapsedMessageInput): string {
  const cliente = firstName(clientName)
  if (pro && pro.active) {
    return `Oi, ${cliente}! Tudo bem? ${firstName(pro.name)} está com horários essa semana. Quer que eu reserve um pra você?`
  }
  if (pro && !pro.active) {
    const quem = replacement ? `${firstName(replacement)} pode te atender` : 'nossa equipe pode te atender'
    return `Oi, ${cliente}! Tudo bem? Sentimos sua falta por aqui. ${firstName(pro.name)} não está mais com a gente, mas ${quem}. Quer que eu veja um horário essa semana?`
  }
  return `Oi, ${cliente}! Tudo bem? Sentimos sua falta por aqui. Temos horários essa semana, quer que eu reserve um pra você?`
}
