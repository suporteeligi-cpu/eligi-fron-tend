#!/usr/bin/env python3
"""
PATCH — perfil de cliente quebrando com "Cannot read properties of undefined (reading 'bg')"

Causa raiz: BookingRow.tsx tipa status como 'CONFIRMED'|'COMPLETED'|'CANCELED',
mas o BookingStatus do Prisma tem NO_SHOW. STATUS_CFG[b.status] -> undefined -> undefined.bg.

Camadas:
  1) tipo do status alinhado ao enum real
  2) entrada NO_SHOW no mapa (âmbar)
  3) fallback no lookup + Record<string, StatusCfg|undefined> (TS passa a EXIGIR o fallback)

Repo: front-end   |   Back-end: intocado
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

# ── 2. Tipo do status alinhado ao BookingStatus real do Prisma ───────────────
patch(
    REL,
    "'CONFIRMED' | 'COMPLETED' | 'CANCELED'",
    "'CONFIRMED' | 'COMPLETED' | 'CANCELED' | 'NO_SHOW'   // @eligi:bookingrow-statustype",
    skip_if="@eligi:bookingrow-statustype",
)

# ── 3. Mapa de status: NO_SHOW + fallback + tipagem que exige o fallback ─────
NEW_CFG = """// @eligi:bookingrow-cfgmap
interface StatusCfg {
  label: string
  color: string
  bg:    string
  Icon:  LucideIcon
}

/** Usado quando o status vier de fora do mapa (enum novo no back, dado legado).
 *  Degradação elegante > página inteira no error boundary. */
const STATUS_FALLBACK: StatusCfg = {
  label: 'Agendado', color: colors.gray.dimText, bg: 'rgba(0,0,0,0.04)', Icon: Clock,
}

/** `| undefined` é DE PROPÓSITO: obriga o `??` no lookup e impede que um
 *  status desconhecido volte a derrubar o render. */
const STATUS_CFG: Record<string, StatusCfg | undefined> = {
  CONFIRMED: { label: 'Confirmado', color: colors.red.DEFAULT,   bg: colors.red.subtle,       Icon: Clock       },
  COMPLETED: { label: 'Concluído',  color: colors.slate.DEFAULT, bg: colors.slate.subtle,     Icon: CheckCircle },
  CANCELED:  { label: 'Cancelado',  color: colors.gray.dimText,  bg: 'rgba(0,0,0,0.04)',      Icon: X           },
  NO_SHOW:   { label: 'Não veio',   color: '#b45309',            bg: 'rgba(245,158,11,0.14)', Icon: AlertCircle },
}"""

patch_span(
    REL,
    start_anchor="const STATUS_CFG = {",
    end_anchor="} as const",
    replacement=NEW_CFG,
    skip_if="@eligi:bookingrow-cfgmap",
)

# ── 4. Lookup com fallback ───────────────────────────────────────────────────
patch(
    REL,
    "= STATUS_CFG[b.status]",
    "= STATUS_CFG[b.status] ?? STATUS_FALLBACK   // @eligi:bookingrow-lookup",
    skip_if="@eligi:bookingrow-lookup",
)

print(f"\nBackup em {BK}")
print("OK" if ok else "CONCLUÍDO COM AVISOS — revisar acima")
