// src/shared/utils/messageTemplate.ts
// @eligi:msgtpl-render
//
// Renderizacao dos modelos de mensagem. FONTE UNICA.
// Qualquer superficie que dispare mensagem (tela de configuracao, botao no
// card do cliente, lembretes) tem que passar por aqui. Replace inline
// espalhado pelas telas = varias verdades, que foi exatamente o problema do
// waLink duplicado.

export const TEMPLATE_TITLE_MAX = 40

/**
 * O corpo viaja em `wa.me?text=` depois de encodeURIComponent, e emoji custa
 * cerca de 12 caracteres codificados. 500 protege contra truncamento em
 * clientes antigos de WhatsApp.
 */
export const TEMPLATE_BODY_MAX = 500

export const TOKEN_CLIENTE = '{cliente}'
export const TOKEN_NEGOCIO = '{negocio}'
export const TOKEN_LINK = '{link}'

export const TEMPLATE_TOKENS = [TOKEN_CLIENTE, TOKEN_NEGOCIO, TOKEN_LINK] as const

export interface TemplateVars {
  /** Nome do cliente. So o primeiro nome e usado. */
  cliente: string
  /** Nome do estabelecimento. */
  negocio: string
  /** URL publica de agendamento ja montada. */
  link: string
}

/** Primeiro nome, com fallback para a string inteira. */
export function firstName(fullName: string): string {
  const trimmed = fullName.trim()
  return trimmed.split(' ')[0] || trimmed
}

/**
 * Substitui os tokens do corpo.
 *
 * REGRA DURA: se o corpo nao contiver {link}, o link e anexado no fim.
 * Mensagem de convite sem link e um botao decorativo — o lojista nao pode
 * quebrar isso por esquecimento.
 */
export function renderTemplate(body: string, vars: TemplateVars): string {
  const raw = body ?? ''
  const hasLink = raw.includes(TOKEN_LINK)

  const filled = raw
    .split(TOKEN_CLIENTE)
    .join(firstName(vars.cliente))
    .split(TOKEN_NEGOCIO)
    .join(vars.negocio)
    .split(TOKEN_LINK)
    .join(vars.link)

  return hasLink ? filled : `${filled.trimEnd()}\n\n${vars.link}`
}
