#!/usr/bin/env python3
"""
PATCH v2 — perfil de cliente quebrando: "Cannot read properties of undefined (reading 'bg')"

CAUSA RAIZ (revisada): não foi "faltou entrada no mapa". O `theme.ts` já exporta
`bookingStatus` com os 4 status (inclusive NO_SHOW, linha 84). O BookingRow mantinha
uma CÓPIA LOCAL de 3 status. A fonte única evoluiu, a cópia não. Cliente com booking
NO_SHOW -> STATUS_CFG['NO_SHOW'] === undefined -> undefined.bg -> error boundary.

O QUE ESTE PATCH FAZ:
  1) BookingRow passa a CONSUMIR `bookingStatus` (label/cor/bg) — cópia local eliminada
  2) Ícone continua local (é apresentação, não estado)
  3) `resolveStatus()` com fallback — status desconhecido vira chip cinza, nunca crash
  4) Tipo do status alinhado ao BookingStatus real do Prisma

Repo: front-end   |   Back-end: intocado

VARIANTE (manter os tons locais em vez do canônico): ver comentário MANTER_TONS_LOCAIS
no fim do arquivo antes de rodar.
"""
import shutil, datetime, pathlib, sys

ROOT = pathlib.Path.home() / "Documentos/eligi/front-end"
TS   = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
BK   = ROOT / ".backup" / TS

REL  = "src/app/dashboard/clientes/[id]/components/BookingRow.tsx"

ok = True


def _backup(f: pathlib.Path, rel: str) -> None:
    dst = BK / rel
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(f, dst)


def patch(rel, anchor, replacement, skip_if, optional=False, count=1):
    """Substituição por âncora única. skip_if OBRIGATÓRIO (idempotência)."""
    global ok
    assert skip_if, "skip_if é obrigatório"
    f = ROOT / rel
    if not f.exists():
        print(f"False  {rel}  (arquivo não existe)")
        if not optional:
            sys.exit(f"abortado: {rel} não encontrado")
        ok = False
        return
    src = f.read_text(encoding="utf-8")
    if skip_if in src:
        print(f"False  {rel}  (já aplicado: {skip_if})")
        return
    n = src.count(anchor)
    if n != count:
        print(f"False  {rel}  (âncora x{n}, esperado {count})")
        if not optional:
            sys.exit(f"abortado: âncora inválida em {rel}")
        ok = False
        return
    _backup(f, rel)
    f.write_text(src.replace(anchor, replacement), encoding="utf-8")
    print(f"True   {rel}  ({skip_if})")


def patch_span(rel, start_anchor, end_anchor, replacement, skip_if, optional=False):
    """Substitui o bloco INTEIRO entre start_anchor e end_anchor (inclusive).
    Imune a variação de espaçamento no miolo do bloco."""
    global ok
    assert skip_if, "skip_if é obrigatório"
    f = ROOT / rel
    if not f.exists():
        print(f"False  {rel}  (arquivo não existe)")
        if not optional:
            sys.exit(f"abortado: {rel} não encontrado")
        ok = False
        return
    src = f.read_text(encoding="utf-8")
    if skip_if in src:
        print(f"False  {rel}  (já aplicado: {skip_if})")
        return
    if src.count(start_anchor) != 1:
        print(f"False  {rel}  (start x{src.count(start_anchor)}, esperado 1)")
        if not optional:
            sys.exit(f"abortado: start ambíguo em {rel}")
        ok = False
        return
    i = src.index(start_anchor)
    j = src.find(end_anchor, i)
    if j == -1:
        print(f"False  {rel}  (end não encontrado após start)")
        if not optional:
            sys.exit(f"abortado: end ausente em {rel}")
        ok = False
        return
    j += len(end_anchor)
    _backup(f, rel)
    f.write_text(src[:i] + replacement + src[j:], encoding="utf-8")
    print(f"True   {rel}  ({skip_if})")


# ── 1. Ícone do NO_SHOW + tipo LucideIcon ────────────────────────────────────
patch(
    REL,
    ", X } from 'lucide-react'",
    ", X, AlertCircle } from 'lucide-react'   // @eligi:bookingrow-icons\n"
    "import type { LucideIcon } from 'lucide-react'",
    skip_if="@eligi:bookingrow-icons",
)

# ── 2. Importar a fonte única de status do tema ──────────────────────────────
patch(
    REL,
    "import { colors, typography, radius } from '@/shared/theme'",
    "import { colors, typography, radius, bookingStatus } from '@/shared/theme'   // @eligi:bookingrow-themeimport",
    skip_if="@eligi:bookingrow-themeimport",
)

# ── 3. Tipo do status alinhado ao BookingStatus real do Prisma ───────────────
patch(
    REL,
    "'CONFIRMED' | 'COMPLETED' | 'CANCELED'",
    "'CONFIRMED' | 'COMPLETED' | 'CANCELED' | 'NO_SHOW'   // @eligi:bookingrow-statustype",
    skip_if="@eligi:bookingrow-statustype",
)

# ── 4. Cópia local -> consumo da fonte única + fallback ──────────────────────
NEW_CFG = """// @eligi:bookingrow-cfgmap
/** Ícone é APRESENTAÇÃO local. Cor e label vêm da fonte única `bookingStatus`
 *  (`src/shared/theme.ts`). Não redeclarar token de cor aqui: foi exatamente a
 *  cópia local desatualizada (sem NO_SHOW) que derrubou este perfil em produção. */
const STATUS_ICON: Record<string, LucideIcon | undefined> = {
  CONFIRMED: Clock,
  COMPLETED: CheckCircle,
  CANCELED:  X,
  NO_SHOW:   AlertCircle,
}

interface StatusCfg {
  label: string
  color: string
  bg:    string
  Icon:  LucideIcon
}

/** Vista estreita da fonte única. `| undefined` é DE PROPÓSITO: obriga o
 *  tratamento de status desconhecido em vez de estourar no render. */
const STATUS_TONE: Record<string, { label: string; labelBg: string; labelColor: string } | undefined> = bookingStatus

/** Degradação elegante > página inteira no error boundary. */
const STATUS_FALLBACK: StatusCfg = {
  label: 'Agendado', color: colors.gray.dimText, bg: 'rgba(0,0,0,0.04)', Icon: Clock,
}

function resolveStatus(status: string): StatusCfg {
  const tone = STATUS_TONE[status]
  if (!tone) return STATUS_FALLBACK
  return {
    label: tone.label,
    color: tone.labelColor,
    bg:    tone.labelBg,
    Icon:  STATUS_ICON[status] ?? Clock,
  }
}"""

patch_span(
    REL,
    start_anchor="const STATUS_CFG = {",
    end_anchor="} as const",
    replacement=NEW_CFG,
    skip_if="@eligi:bookingrow-cfgmap",
)

# ── 5. Lookup direto -> resolver com fallback ────────────────────────────────
patch(
    REL,
    "= STATUS_CFG[b.status]",
    "= resolveStatus(b.status)   // @eligi:bookingrow-lookup",
    skip_if="@eligi:bookingrow-lookup",
)

print(f"\nBackup em {BK}")
print("OK" if ok else "CONCLUÍDO COM AVISOS — revisar acima")

# ─────────────────────────────────────────────────────────────────────────────
# MANTER_TONS_LOCAIS
# Se preferir NÃO alterar o tom dos badges que já funcionavam, troque o corpo de
# resolveStatus (dentro de NEW_CFG, acima) por:
#
#   const LOCAL_TONE: Record<string, { color: string; bg: string } | undefined> = {
#     CONFIRMED: { color: colors.red.DEFAULT,   bg: colors.red.subtle   },
#     COMPLETED: { color: colors.slate.DEFAULT, bg: colors.slate.subtle },
#     CANCELED:  { color: colors.gray.dimText,  bg: 'rgba(0,0,0,0.04)'  },
#   }
#   function resolveStatus(status: string): StatusCfg {
#     const tone = STATUS_TONE[status]
#     if (!tone) return STATUS_FALLBACK
#     const local = LOCAL_TONE[status]
#     return {
#       label: tone.label,
#       color: local?.color ?? tone.labelColor,
#       bg:    local?.bg    ?? tone.labelBg,
#       Icon:  STATUS_ICON[status] ?? Clock,
#     }
#   }
#
# Corrige o crash e preserva o visual atual, ao custo de manter tokens duplicados.
# ─────────────────────────────────────────────────────────────────────────────
