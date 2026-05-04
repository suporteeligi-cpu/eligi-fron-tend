// Design System — Eligi
// Identidade visual oficial: Branco · Vermelho · Cinza
// Fonte da verdade — nunca hardcode valores fora daqui

export const colors = {
  background: {
    page:         '#f5f5f7',
    surface:      'rgba(255,255,255,0.88)',
    surfaceLight: 'rgba(255,255,255,0.70)',
    surfaceDim:   'rgba(255,255,255,0.50)',
    overlay:      'rgba(0,0,0,0.18)',
  },
  red: {
    DEFAULT:      '#dc2626',
    dark:         '#b91c1c',
    light:        '#ef4444',
    subtle:       'rgba(220,38,38,0.06)',
    border:       'rgba(220,38,38,0.18)',
    borderHover:  'rgba(220,38,38,0.30)',
    focusRing:    'rgba(220,38,38,0.08)',
    glow:         'rgba(220,38,38,0.25)',
    gradient:     'linear-gradient(135deg, #dc2626, #b91c1c)',
  },
  gray: {
    900:           '#111827',
    800:           '#1f2937',
    700:           '#374151',
    500:           '#6b7280',
    border:        'rgba(0,0,0,0.07)',
    borderMd:      'rgba(0,0,0,0.09)',
    hover:         'rgba(0,0,0,0.04)',
    dimText:       'rgba(0,0,0,0.35)',
    dimTextLight:  'rgba(0,0,0,0.28)',
  },
  slate: {
    DEFAULT:  '#475569',
    dark:     '#334155',
    subtle:   'rgba(71,85,105,0.05)',
    border:   'rgba(71,85,105,0.15)',
    glow:     'rgba(71,85,105,0.12)',
    gradient: 'linear-gradient(135deg, #475569, #334155)',
  },
  muted: {
    DEFAULT:  '#94a3b8',
    light:    '#cbd5e1',
    subtle:   'rgba(148,163,184,0.06)',
    border:   'rgba(148,163,184,0.20)',
    glow:     'rgba(148,163,184,0.10)',
    gradient: 'linear-gradient(135deg, #94a3b8, #cbd5e1)',
  },
} as const

export const bookingStatus = {
  CONFIRMED: {
    gradient:   colors.red.gradient,
    bg:         colors.red.subtle,
    border:     colors.red.border,
    text:       '#991b1b',
    glow:       colors.red.glow,
    label:      'Confirmado',
    labelBg:    'rgba(220,38,38,0.08)',
    labelColor: '#b91c1c',
  },
  COMPLETED: {
    gradient:   colors.slate.gradient,
    bg:         colors.slate.subtle,
    border:     colors.slate.border,
    text:       colors.slate.dark,
    glow:       colors.slate.glow,
    label:      'Concluído',
    labelBg:    'rgba(71,85,105,0.10)',
    labelColor: colors.slate.dark,
  },
  CANCELED: {
    gradient:   colors.muted.gradient,
    bg:         colors.muted.subtle,
    border:     colors.muted.border,
    text:       '#64748b',
    glow:       colors.muted.glow,
    label:      'Cancelado',
    labelBg:    'rgba(148,163,184,0.10)',
    labelColor: '#64748b',
  },
} as const

export const glass = {
  blur: { sm:'blur(8px)', md:'blur(16px)', lg:'blur(20px)', xl:'blur(32px)' },
  surface: {
    default: {
      background:     colors.background.surface,
      backdropFilter: 'blur(20px)',
      border:         `1px solid ${colors.gray.border}`,
    },
    modal: {
      background:     'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(32px)',
      border:         `1px solid ${colors.gray.borderMd}`,
      boxShadow:      '0 24px 64px rgba(0,0,0,0.14)',
    },
    toolbar: {
      background:     'rgba(255,255,255,0.88)',
      backdropFilter: 'blur(24px)',
      borderBottom:   `1px solid ${colors.gray.border}`,
    },
  },
} as const

export const typography = {
  fontFamily: '-apple-system, "SF Pro Display", system-ui, sans-serif',
  scale: { xs:9, sm:11, base:13, md:14, lg:16, xl:17, '2xl':22 },
  weight: { normal:400, medium:500, semibold:600, bold:700 },
  color: {
    primary:   colors.gray['900'],
    secondary: colors.gray['700'],
    muted:     colors.gray.dimText,
    dimmer:    colors.gray.dimTextLight,
    accent:    colors.red.DEFAULT,
  },
} as const

export const radius = {
  sm:8, md:12, lg:14, xl:16, '2xl':20, '3xl':24, full:9999,
} as const

export const shadows = {
  sm:    '0 1px 6px rgba(0,0,0,0.05)',
  md:    '0 4px 16px rgba(0,0,0,0.09)',
  lg:    '0 20px 60px rgba(0,0,0,0.13)',
  redSm: '0 3px 10px rgba(220,38,38,0.22)',
  redMd: '0 4px 16px rgba(220,38,38,0.28)',
  redLg: '0 4px 18px rgba(220,38,38,0.30)',
} as const

export const transitions = {
  fast:   '0.15s ease',
  base:   '0.18s ease',
  spring: '0.18s cubic-bezier(0.34, 1.56, 0.64, 1)',
  modal:  '0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const

export const agendaLayout = {
  slotHeight:   64,
  timeColWidth: 64,
  startHour:    8,
  endHour:      20,
  minColWidth:  140,
  headerHeight: 56,
} as const
