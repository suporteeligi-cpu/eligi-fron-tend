// src/app/dashboard/caixa/ui.ts
// @eligi:caixa-ui-tokens
//
// Tokens visuais do Caixa (direcao A "Balcao limpo", nov/2026).
// Fonte unica de cor do modulo: branco predominante, grafite para acao e total,
// vermelho so como SINAL (erro, acao destrutiva, valor pendente) e nunca como enfeite.
// Tudo deriva do brand.generated / theme; nenhum hex novo de marca.
import { brand } from '@/shared/brand.generated'
import { inkLight, typography } from '@/shared/theme'

export const C = {
  ink:     brand.surfaceLight.ink,   // #111114 - texto forte, botao principal, selecionado
  ink2:    brand.surfaceLight.ink2,  // #4b4b52 - texto secundario
  ink3:    brand.surfaceLight.ink3,  // #8a8a93 - rotulo, metadado
  onInk:   '#ffffff',
  onInkSoft: 'rgba(255,255,255,0.62)',
  page:    brand.surfaceLight.page,  // #f5f5f7
  card:    '#ffffff',
  sunken:  '#f7f7f8',
  line:    'rgba(17,17,20,0.08)',
  line2:   'rgba(17,17,20,0.14)',

  ok:      brand.successScale.base,   // preenchimento do "confirmar pagamento"
  okStrong: brand.successScale.strong,
  okInk:   brand.successScale.ink,    // texto verde sobre claro (AA)
  okBg:    brand.successScale.bg,

  warn:    inkLight.warn,             // { text, bg, border } - desconto, atencao
  bad:     inkLight.bad,              // { text, bg, border } - erro
  danger:  brand.core.redAction,      // acao destrutiva / valor pendente (unico vermelho)

  display: typography.fontFamilyDisplay,
  body:    typography.fontFamily,
} as const
