// src/features/agenda/constants/serviceColors.ts
// Paleta de cores para serviços — mesma lógica do Booksy

export const SERVICE_COLORS = [
  // Linha 1
  '#e8622a', '#e84242', '#c084e8', '#6dd44a', '#a78fe8',
  '#7de8e8', '#94b8e8', '#4a94e8', '#3d3dba', '#9c3dba',
  '#4aba6d',
  // Linha 2
  '#cce84a', '#e87d2a', '#8b6b42', '#4a6de8', '#e8a094',
  '#e84aab', '#e83d3d', '#b8e8f8', '#c084d4', '#f8a0c0',
  '#bae84a',
  // Linha 3
  '#1a8b8b', '#f8a0d4', '#ba1a5e', '#e8b42a', '#f8e42a',
  '#a0e8d4', '#8b5e2a', '#1a8b42', '#e89c2a', '#d4e82a',
  '#2ababa',
]

export const DEFAULT_SERVICE_COLOR = '#dc2626'

// Gera gradiente a partir de uma cor hex
export function colorToGradient(hex: string): string {
  return `linear-gradient(135deg, ${hex}, ${darken(hex, 0.15)})`
}

// Escurece uma cor hex
function darken(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r   = Math.max(0, (num >> 16) - Math.round(255 * amount))
  const g   = Math.max(0, ((num >> 8) & 0xff) - Math.round(255 * amount))
  const b   = Math.max(0, (num & 0xff) - Math.round(255 * amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

// Gera glow a partir de uma cor hex
export function colorToGlow(hex: string): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r   = (num >> 16) & 0xff
  const g   = (num >> 8)  & 0xff
  const b   =  num        & 0xff
  return `rgba(${r},${g},${b},0.28)`
}
