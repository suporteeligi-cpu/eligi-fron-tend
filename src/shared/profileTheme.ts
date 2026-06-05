// theme.ts — fundação de personalização do Perfil Público (Eligi)
// Módulo PURO (sem DOM): usado no backend (validação) e nos dois fronts (derivação).
// A extração de cor a partir de imagem é client-only e fica no editor (usa canvas).

/* ============================================================
 * Tipos
 * ========================================================== */

export type WallPattern = 'none' | 'dots' | 'grid';

/** O que fica salvo em `business.theme` (JSON enxuto — só primitivos). */
export interface BusinessTheme {
  /** Cor principal: botão agendar, selects, pills, destaques. */
  primary: string;
  /** Texto sobre a cor principal. 'auto' = calculado por contraste. */
  onPrimary: string | 'auto';
  /** Superfície dos cards/blocos. */
  surface: string;
  /** Cor de fundo da página. */
  bg: string;
  /** Papel de parede aplicado ao fundo. */
  wall: WallPattern;
  /** Painel escuro do Modelo B. 'auto' = derivado da cor principal. */
  panel: string | 'auto';
}

/** Tokens finais já resolvidos, prontos pra virar CSS variables. */
export interface ResolvedTheme {
  '--p-primary': string;
  '--p-primary-2': string;
  '--p-on-primary': string;
  '--p-surface': string;
  '--p-bg': string;
  '--p-bg-img': string;
  '--p-text': string;
  '--p-muted': string;
  '--p-line': string;
  '--p-line-2': string;
  '--p-accent': string;
  '--p-pill': string;
  '--p-panel': string;
}

/* ============================================================
 * Defaults e presets
 * ========================================================== */

export const DEFAULT_THEME: BusinessTheme = {
  primary: '#dc2626',
  onPrimary: 'auto',
  surface: '#ffffff',
  bg: '#f6f6f8',
  wall: 'none',
  panel: 'auto',
};

export interface ThemePreset {
  id: string;
  label: string;
  primary: string;
  bg: string;
  surface: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: 'eligi', label: 'Eligi', primary: '#dc2626', bg: '#f6f6f8', surface: '#ffffff' },
  { id: 'carvao', label: 'Carvão', primary: '#1c1917', bg: '#f5f5f4', surface: '#ffffff' },
  { id: 'areia', label: 'Areia', primary: '#b45309', bg: '#faf6f0', surface: '#fffdf9' },
  { id: 'esmeralda', label: 'Esmeralda', primary: '#047857', bg: '#f2f7f5', surface: '#ffffff' },
  { id: 'oceano', label: 'Oceano', primary: '#0369a1', bg: '#f0f6fa', surface: '#ffffff' },
  { id: 'vinho', label: 'Vinho', primary: '#9d174d', bg: '#faf3f6', surface: '#ffffff' },
];

/* ============================================================
 * Helpers de cor (puros)
 * ========================================================== */

type RGB = [number, number, number];

const clamp = (v: number): number => Math.max(0, Math.min(255, Math.round(v)));
const hx = (n: number): string => clamp(n).toString(16).padStart(2, '0');

const HEX6 = /^#?([0-9a-fA-F]{6})$/;
const HEX3 = /^#?([0-9a-fA-F]{3})$/;

/** Converte qualquer cor aceita (#rgb, #rrggbb, rgb(...)) em RGB. */
export function parseColor(input: string): RGB {
  const c = input.trim();

  const m6 = HEX6.exec(c);
  if (m6) {
    const h = m6[1];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  const m3 = HEX3.exec(c);
  if (m3) {
    const h = m3[1];
    return [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)];
  }

  const nums = c.match(/\d+(\.\d+)?/g);
  if (nums && nums.length >= 3) {
    return [Number(nums[0]), Number(nums[1]), Number(nums[2])];
  }

  // fallback seguro
  return [220, 38, 38];
}

export const toHex = ([r, g, b]: RGB): string => `#${hx(r)}${hx(g)}${hx(b)}`;

/** Escurece uma cor por um fator 0..1. */
export function darken(color: string, factor: number): string {
  const [r, g, b] = parseColor(color);
  return toHex([r * (1 - factor), g * (1 - factor), b * (1 - factor)]);
}

/** Mistura `color` com `target` numa proporção `p` (0..1). */
export function mix(color: string, target: string, p: number): string {
  const [r, g, b] = parseColor(color);
  const [tr, tg, tb] = parseColor(target);
  return toHex([r * (1 - p) + tr * p, g * (1 - p) + tg * p, b * (1 - p) + tb * p]);
}

/** Luminância relativa (WCAG). */
function relativeLuminance([r, g, b]: RGB): number {
  const lin = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

/** Razão de contraste WCAG entre duas cores (1..21). */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(parseColor(a));
  const lb = relativeLuminance(parseColor(b));
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

/** Escolhe branco ou quase-preto pra melhor leitura sobre `bg`. */
export function bestTextOn(bg: string): string {
  const white = contrastRatio(bg, '#ffffff');
  const ink = contrastRatio(bg, '#0c0c12');
  if (white >= ink) return '#ffffff';
  return '#0c0c12';
}

/* ============================================================
 * Guard-rail de legibilidade
 * ========================================================== */

export interface ReadabilityCheck {
  ok: boolean;
  ratio: number;
  suggestedOnPrimary: string;
}

/** Verifica se o texto do botão tem contraste suficiente (limite 3.2:1). */
export function checkReadability(theme: BusinessTheme): ReadabilityCheck {
  const onPrimary = theme.onPrimary === 'auto' ? bestTextOn(theme.primary) : theme.onPrimary;
  const ratio = contrastRatio(theme.primary, onPrimary);
  return {
    ok: ratio >= 3.2,
    ratio,
    suggestedOnPrimary: bestTextOn(theme.primary),
  };
}

/* ============================================================
 * Papel de parede
 * ========================================================== */

/** Monta o `background-image` do papel de parede já tingido. */
export function wallImage(wall: WallPattern, dotColor: string): string {
  if (wall === 'dots') {
    return `radial-gradient(${dotColor} 1.3px, transparent 1.3px)`;
  }
  if (wall === 'grid') {
    return `linear-gradient(${dotColor} 1px, transparent 1px), linear-gradient(90deg, ${dotColor} 1px, transparent 1px)`;
  }
  return 'none';
}

/* ============================================================
 * Derivação — single source of truth
 * ========================================================== */

/**
 * Recebe o tema salvo e devolve TODOS os tokens resolvidos.
 * O front aplica como CSS variables; o painel escuro (Modelo B) sai daqui.
 */
export function deriveTheme(theme: BusinessTheme): ResolvedTheme {
  const primary = theme.primary;
  const onPrimary = theme.onPrimary === 'auto' ? bestTextOn(primary) : theme.onPrimary;

  // Painel escuro do Modelo B: preto levemente tingido pela cor principal
  // (≈10% da marca) — coeso sem gritar. 'auto' = derivado; senão respeita o valor.
  const panel = theme.panel === 'auto' ? mix('#0c0c12', primary, 0.1) : theme.panel;

  const dotColor = mix(theme.bg, primary, 0.12);

  return {
    '--p-primary': primary,
    '--p-primary-2': darken(primary, 0.14),
    '--p-on-primary': onPrimary,
    '--p-surface': theme.surface,
    '--p-bg': theme.bg,
    '--p-bg-img': wallImage(theme.wall, dotColor),
    '--p-text': '#0c0c12',
    '--p-muted': '#71717a',
    '--p-line': mix(theme.bg, '#000000', 0.1),
    '--p-line-2': mix(theme.bg, '#000000', 0.05),
    '--p-accent': primary,
    '--p-pill': mix(primary, '#ffffff', 0.88),
    '--p-panel': panel,
  };
}

/** Aplica os tokens resolvidos num elemento (helper de front). */
export function applyTheme(el: { style: { setProperty(k: string, v: string): void } }, theme: BusinessTheme): void {
  const vars = deriveTheme(theme);
  (Object.keys(vars) as Array<keyof ResolvedTheme>).forEach((k) => {
    el.style.setProperty(k, vars[k]);
  });
}

/* ============================================================
 * Validação (uso no backend antes de salvar)
 * ========================================================== */

const HEX_OK = /^#[0-9a-fA-F]{6}$/;
const WALLS: WallPattern[] = ['none', 'dots', 'grid'];

/** Normaliza/valida o tema recebido do cliente; cai no default em campo inválido. */
export function sanitizeTheme(input: Partial<BusinessTheme> | null | undefined): BusinessTheme {
  const t = input ?? {};
  const okHex = (v: unknown, fallback: string): string =>
    typeof v === 'string' && HEX_OK.test(v) ? v : fallback;

  const onPrimary =
    t.onPrimary === 'auto' || (typeof t.onPrimary === 'string' && HEX_OK.test(t.onPrimary))
      ? t.onPrimary
      : DEFAULT_THEME.onPrimary;

  const panel =
    t.panel === 'auto' || (typeof t.panel === 'string' && HEX_OK.test(t.panel))
      ? t.panel
      : DEFAULT_THEME.panel;

  const wall = typeof t.wall === 'string' && WALLS.includes(t.wall as WallPattern)
    ? (t.wall as WallPattern)
    : DEFAULT_THEME.wall;

  return {
    primary: okHex(t.primary, DEFAULT_THEME.primary),
    onPrimary,
    surface: okHex(t.surface, DEFAULT_THEME.surface),
    bg: okHex(t.bg, DEFAULT_THEME.bg),
    wall,
    panel,
  };
}
