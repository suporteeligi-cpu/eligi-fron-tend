#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# migrate-agenda.sh — Migração gradual da feature Agenda · Eligi
# Execução: bash migrate-agenda.sh (na raiz do projeto front-end)
# ─────────────────────────────────────────────────────────────────────────────
set -e  # para imediatamente se qualquer comando falhar

ROOT="$(pwd)"
SRC="$ROOT/src"
BACKUP="$ROOT/_backup_agenda_$(date +%Y%m%d_%H%M%S)"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║       Eligi — Migração Gradual: Feature Agenda       ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ── PASSO 0: Backup ──────────────────────────────────────────────────────────
echo "→ [0/6] Criando backup em $_BACKUP_AGENDA_..."
mkdir -p "$BACKUP"
cp -r "$SRC/app/components/agenda"   "$BACKUP/agenda-components"   2>/dev/null || true
cp -r "$SRC/hooks"                   "$BACKUP/hooks"                2>/dev/null || true
cp -r "$SRC/types"                   "$BACKUP/types"                2>/dev/null || true
cp -r "$SRC/lib"                     "$BACKUP/lib"                  2>/dev/null || true
cp    "$ROOT/tsconfig.json"          "$BACKUP/tsconfig.json"        2>/dev/null || true
echo "   ✓ Backup salvo em: $BACKUP"
echo ""

# ── PASSO 1: Criar estrutura de pastas ───────────────────────────────────────
echo "→ [1/6] Criando estrutura de pastas..."

mkdir -p "$SRC/shared/theme"
mkdir -p "$SRC/shared/types"
mkdir -p "$SRC/shared/lib"
mkdir -p "$SRC/features/agenda/components"
mkdir -p "$SRC/features/agenda/hooks"
mkdir -p "$SRC/features/agenda/types"
mkdir -p "$SRC/features/booking/components"
mkdir -p "$SRC/features/booking/hooks"

echo "   ✓ Pastas criadas"
echo ""

# ── PASSO 2: Criar shared/theme/index.ts ─────────────────────────────────────
echo "→ [2/6] Criando shared/theme/index.ts..."

cat > "$SRC/shared/theme/index.ts" << 'THEME'
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
THEME

echo "   ✓ shared/theme/index.ts criado"

# ── PASSO 3: Criar shared/types/index.ts ─────────────────────────────────────
echo "→ [3/6] Criando shared/types/index.ts..."

cat > "$SRC/shared/types/index.ts" << 'TYPES'
// Tipos globais compartilhados entre features

export type BookingStatus = 'CONFIRMED' | 'COMPLETED' | 'CANCELED'

export interface Professional {
  id: string
  name: string
}

export interface Service {
  id: string
  name: string
  duration: number
  price?: number
}
TYPES

echo "   ✓ shared/types/index.ts criado"

# ── PASSO 4: Criar shared/lib/apiClient.ts (re-exporta o existente) ───────────
echo "→ [4/6] Criando shared/lib/apiClient.ts..."

cat > "$SRC/shared/lib/apiClient.ts" << 'APICLIENT'
// Re-exporta o apiClient existente para que features usem @/shared/lib/apiClient
// Quando quiser consolidar, mova a lógica para cá e delete src/lib/apiClient.ts
export { default } from '@/lib/apiClient'
APICLIENT

echo "   ✓ shared/lib/apiClient.ts criado"

# ── PASSO 5: Criar feature agenda ────────────────────────────────────────────
echo "→ [5/6] Criando features/agenda/..."

# types
cat > "$SRC/features/agenda/types/index.ts" << 'AGENDATYPES'
import { BookingStatus, Professional } from '@/shared/types'

export interface AgendaBooking {
  id: string
  clientName: string
  serviceName: string
  professionalId: string
  status: BookingStatus
  start: string
  end: string
}

export interface AgendaProfessional extends Professional {}
AGENDATYPES

# useAgendaStore (Zustand — substitui useCheckoutPanel)
cat > "$SRC/features/agenda/hooks/useAgendaStore.ts" << 'STORE'
'use client'

import { create } from 'zustand'
import { AgendaBooking } from '../types'

interface CheckoutState {
  open: boolean
  mode: 'create' | 'edit'
  time: string | null
  professionalId: string | null
}

interface AgendaStore {
  selectedDate: Date
  setSelectedDate: (date: Date) => void

  checkout: CheckoutState
  openCreate: (time: string, professionalId: string) => void
  openEdit: (booking: AgendaBooking) => void
  closeCheckout: () => void

  bookings: AgendaBooking[]
  addBooking: (booking: AgendaBooking) => void
  updateBooking: (booking: AgendaBooking) => void
  removeBooking: (id: string) => void
}

export const useAgendaStore = create<AgendaStore>((set) => ({
  selectedDate: new Date(),
  setSelectedDate: (date) => set({ selectedDate: date }),

  checkout: { open: false, mode: 'create', time: null, professionalId: null },
  openCreate: (time, professionalId) =>
    set({ checkout: { open: true, mode: 'create', time, professionalId } }),
  openEdit: (booking) =>
    set({ checkout: { open: true, mode: 'edit', time: booking.start, professionalId: booking.professionalId } }),
  closeCheckout: () =>
    set({ checkout: { open: false, mode: 'create', time: null, professionalId: null } }),

  bookings: [],
  addBooking: (booking) =>
    set((s) => ({ bookings: [...s.bookings, booking] })),
  updateBooking: (booking) =>
    set((s) => ({ bookings: s.bookings.map((b) => b.id === booking.id ? booking : b) })),
  removeBooking: (id) =>
    set((s) => ({ bookings: s.bookings.filter((b) => b.id !== id) })),
}))
STORE

# useAgendaSocket (wrapper do existente)
cat > "$SRC/features/agenda/hooks/useAgendaSocket.ts" << 'SOCKET'
'use client'
// Re-exporta o hook existente enquanto a migração não está completa
// Quando quiser consolidar, mova a lógica de src/hooks/useAgendaSocket.ts para cá
export { useAgendaSocket } from '@/hooks/useAgendaSocket'
SOCKET

# barrel index
cat > "$SRC/features/agenda/index.ts" << 'BARRELAGENDA'
export { default as AgendaBoard }       from './components/AgendaBoard'
export { default as AgendaToolbar }     from './components/AgendaToolbar'
export { default as AgendaGrid }        from './components/AgendaGrid'
export { default as AgendaMobileList }  from './components/AgendaMobileList'
export { default as BookingCard }       from './components/BookingCard'
export { useAgendaStore }               from './hooks/useAgendaStore'
export { useAgendaSocket }              from './hooks/useAgendaSocket'
export type { AgendaBooking, AgendaProfessional } from './types'
BARRELAGENDA

echo "   ✓ features/agenda/ criada (types, hooks, index)"

# ── PASSO 6: Copiar componentes e atualizar imports ───────────────────────────
echo "→ [6/6] Copiando componentes e atualizando imports..."

COMPONENTS_SRC="$SRC/app/components/agenda"
FEAT_COMP="$SRC/features/agenda/components"
BOOK_COMP="$SRC/features/booking/components"
BOOK_HOOKS="$SRC/features/booking/hooks"

# Função: copia arquivo e substitui imports antigos pelos novos
copy_and_fix() {
  local from="$1"
  local to="$2"
  cp "$from" "$to"
  # corrige imports de tipos
  sed -i "s|@/types/agenda|@/features/agenda/types|g"     "$to"
  sed -i "s|'../types/agenda'|'../types'|g"               "$to"
  sed -i "s|'../../types/agenda'|'@/features/agenda/types'|g" "$to"
  # corrige imports de hooks
  sed -i "s|@/hooks/useCheckoutPanel|@/features/agenda/hooks/useAgendaStore|g" "$to"
  sed -i "s|@/hooks/useAgendaSocket|@/features/agenda/hooks/useAgendaSocket|g" "$to"
  # corrige imports de lib
  sed -i "s|@/lib/apiClient|@/shared/lib/apiClient|g"     "$to"
  echo "   ✓ $(basename $to)"
}

# Copia componentes da agenda
copy_and_fix "$COMPONENTS_SRC/AgendaBoard.tsx"      "$FEAT_COMP/AgendaBoard.tsx"
copy_and_fix "$COMPONENTS_SRC/AgendaToolbar.tsx"    "$FEAT_COMP/AgendaToolbar.tsx"
copy_and_fix "$COMPONENTS_SRC/AgendaGrid.tsx"       "$FEAT_COMP/AgendaGrid.tsx"
copy_and_fix "$COMPONENTS_SRC/AgendaMobileList.tsx" "$FEAT_COMP/AgendaMobileList.tsx"
copy_and_fix "$COMPONENTS_SRC/BookingCard.tsx"      "$FEAT_COMP/BookingCard.tsx"
copy_and_fix "$COMPONENTS_SRC/AgendaColumn.tsx"     "$FEAT_COMP/AgendaColumn.tsx"     2>/dev/null || true

# Copia componentes de booking
copy_and_fix "$COMPONENTS_SRC/SideCheckoutPanel.tsx"   "$BOOK_COMP/SideCheckoutPanel.tsx"
copy_and_fix "$COMPONENTS_SRC/CreateBookingModal.tsx"  "$BOOK_COMP/CreateBookingModal.tsx"

# barrel de booking
cat > "$SRC/features/booking/index.ts" << 'BARRELBOOKING'
export { default as SideCheckoutPanel }  from './components/SideCheckoutPanel'
export { default as CreateBookingModal } from './components/CreateBookingModal'
BARRELBOOKING

echo "   ✓ features/booking/ criada"

# ── PASSO 7: Criar shim nos componentes antigos (sem quebrar resto do projeto) ─
echo ""
echo "→ [+] Criando shims nos arquivos antigos (evita quebrar imports existentes)..."

for FILE in AgendaBoard AgendaGrid AgendaMobileList AgendaToolbar BookingCard AgendaColumn; do
  TARGET="$COMPONENTS_SRC/${FILE}.tsx"
  if [ -f "$TARGET" ]; then
    # preserva original como .bak e substitui pelo shim
    cp "$TARGET" "${TARGET}.bak"
    cat > "$TARGET" << SHIM
// SHIM DE MIGRAÇÃO — este arquivo será removido após migração completa
// Todos os imports novos devem usar: @/features/agenda
export { default } from '@/features/agenda/components/${FILE}'
SHIM
    echo "   ✓ shim criado: app/components/agenda/${FILE}.tsx"
  fi
done

for FILE in SideCheckoutPanel CreateBookingModal; do
  TARGET="$COMPONENTS_SRC/${FILE}.tsx"
  if [ -f "$TARGET" ]; then
    cp "$TARGET" "${TARGET}.bak"
    cat > "$TARGET" << SHIM
// SHIM DE MIGRAÇÃO — este arquivo será removido após migração completa
// Todos os imports novos devem usar: @/features/booking
export { default } from '@/features/booking/components/${FILE}'
SHIM
    echo "   ✓ shim criado: app/components/agenda/${FILE}.tsx"
  fi
done

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║                  ✓ Migração concluída!               ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "Próximos passos:"
echo ""
echo "  1. Substitua o tsconfig.json pela versão em outputs/tsconfig.json"
echo "     cp outputs/tsconfig.json tsconfig.json    (ajuste o caminho)"
echo ""
echo "  2. Rode o projeto e confirme que nada quebrou:"
echo "     npm run dev"
echo ""
echo "  3. Atualize src/app/dashboard/agenda/page.tsx para importar de:"
echo "     @/features/agenda  em vez de  @/app/components/agenda"
echo ""
echo "  4. Backup salvo em: $BACKUP"
echo "     Se algo quebrar: cp -r $BACKUP/agenda-components src/app/components/agenda"
echo ""
echo "  ⚠️  Os arquivos originais em app/components/agenda foram substituídos"
echo "     por shims (redirecionamento). Os .bak têm o conteúdo original."
echo ""
