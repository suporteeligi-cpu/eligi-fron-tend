// src/features/services/constants/colorPalette.ts
//
// Paleta de cores para serviços.
// REUSA a paleta oficial da agenda (`@/features/agenda/constants/serviceColors`)
// para garantir que a cor escolhida aqui renderize idêntica no card da agenda.

import {
  SERVICE_COLORS,
  DEFAULT_SERVICE_COLOR,
  colorToGradient,
  colorToGlow,
} from '@/features/agenda/constants/serviceColors'

// Re-exporta tudo pra que o módulo Serviços tenha uma API estável
// (se um dia a paleta mudar de lugar, só ajusta este arquivo)
export {
  SERVICE_COLORS,
  DEFAULT_SERVICE_COLOR,
  colorToGradient,
  colorToGlow,
}

/**
 * Retorna o hex (valor canônico) com fallback pra cor padrão.
 * Usado quando você quer garantir que sempre há uma cor.
 */
export function resolveColorHex(hex: string | null | undefined): string {
  if (!hex) return DEFAULT_SERVICE_COLOR
  // Garante que a cor existe na paleta — senão usa default
  const exists = SERVICE_COLORS.some(c => c.toLowerCase() === hex.toLowerCase())
  return exists ? hex : DEFAULT_SERVICE_COLOR
}

/** Helper conveniente: hex → gradient com fallback */
export function colorHexToGradient(hex: string | null | undefined): string {
  return colorToGradient(resolveColorHex(hex))
}
