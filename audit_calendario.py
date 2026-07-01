#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
FASE 1 (eligi-codeflow) — AUDIT READ-ONLY do calendario.
Nao escreve nada. So le e imprime. Rode na raiz do repo front-end:

    python3 audit_calendario.py
    # ou apontando o caminho:
    python3 audit_calendario.py /caminho/para/front-end

Objetivos:
  1. Achar O componente do calendario (quem renderiza "PULAR POR SEMANA").
  2. Confirmar a causa do desalinhamento (header fora do grid de 7 col / flex / box-sizing).
  3. Mapear herança vs duplicacao (quem importa o componente + telas que usam).
  4. Responder a granularidade: que controle de data financeiro/relatorios usam hoje.
"""
import os, re, sys

ROOTS = sys.argv[1:] or ["."]
SKIP_DIRS = {"node_modules", ".next", ".git", "dist", "build", "coverage"}
SKIP_RE = re.compile(r"(^\.backup|^_backup|\.backup$|_backup)", re.I)
EXTS = (".ts", ".tsx", ".js", ".jsx", ".css", ".mjs")

def walk_files():
    for root in ROOTS:
        for dp, dns, fns in os.walk(root):
            dns[:] = [d for d in dns if d not in SKIP_DIRS and not SKIP_RE.search(d)]
            for fn in fns:
                if fn.endswith(EXTS):
                    yield os.path.join(dp, fn)

def read(p):
    try:
        with open(p, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    except Exception:
        return ""

FILES = {p: read(p) for p in walk_files()}

def grep(pattern, flags=re.I):
    rx = re.compile(pattern, flags)
    hits = []
    for p, txt in FILES.items():
        for i, line in enumerate(txt.splitlines(), 1):
            if rx.search(line):
                hits.append((p, i, line.strip()[:140]))
    return hits

def section(title):
    print("\n" + "=" * 72)
    print(title)
    print("=" * 72)

def dump(hits, limit=60):
    if not hits:
        print("  (nenhum match)")
        return
    for p, i, line in hits[:limit]:
        print(f"  {p}:{i}  {line}")
    if len(hits) > limit:
        print(f"  ... +{len(hits)-limit} matches")

# ---------------------------------------------------------------------------
section("1) COMPONENTE DO CALENDARIO  (marcador unico: 'pular por semana')")
cal_hits = grep(r"pular\s+por\s+semana")
dump(cal_hits)
cal_files = sorted({p for p, _, _ in cal_hits})
if not cal_files:
    print("  >> Nao achei pelo texto. Tentando por nome de arquivo...")
    cal_files = sorted({p for p in FILES if re.search(r"(calendar|calendario|datepicker|monthpicker|daypicker)", os.path.basename(p), re.I)})
    for p in cal_files:
        print(f"  candidato: {p}")

# ---------------------------------------------------------------------------
section("2) CAUSA DO DESALINHAMENTO  (header dos dias da semana vs grid)")
print("[grid de 7 colunas]")
dump(grep(r"grid-template-columns[^;]*(repeat\(\s*7|7\s*,)"))
print("\n[dias da semana renderizados como flex / linha separada do grid]")
dump(grep(r"(display:\s*flex)[^}]*?(seg|dom|weekday|dias|SEG|DOM)"))
print("\n[array de labels dos dias — SEG/DOM etc.]")
dump(grep(r"\[\s*['\"](SEG|DOM|Seg|Dom|seg|dom)['\"]"))
print("\n[box-sizing (ausencia = chips estouram, como no +6)]")
bs = grep(r"box-sizing")
dump(bs)
if not bs:
    print("  >> ATENCAO: nenhum box-sizing global achado nos arquivos scaneados.")

# ---------------------------------------------------------------------------
section("3) HERANCA vs DUPLICACAO  (quem importa o componente)")
for cf in cal_files:
    comp = os.path.splitext(os.path.basename(cf))[0]
    print(f"\n-- componente '{comp}'  ({cf})")
    imp = grep(r"(import[^\n]*\b%s\b|from\s+['\"][^'\"]*%s['\"]|<\s*%s[\s/>])" % (re.escape(comp), re.escape(comp), re.escape(comp)))
    imp = [h for h in imp if h[0] != cf]
    dump(imp, limit=40)
    telas = sorted({os.path.dirname(p) for p, _, _ in imp
                    if re.search(r"(agenda|caixa|financeiro|vendas|relatorio|report|estatistic)", p, re.I)})
    if telas:
        print("   telas-alvo que tocam esse componente:")
        for t in telas:
            print(f"     - {t}")

# ---------------------------------------------------------------------------
section("4) GRANULARIDADE  (que controle de data cada tela usa hoje)")
for label, needle in [
    ("FINANCEIRO / VENDAS", r"financeiro|/sales/report|sales-report|vendas"),
    ("RELATORIOS / ESTATISTICAS", r"relatorio|report|useReportData|estatistic"),
    ("CAIXA", r"caixa|/sales\b|getSalesSummary"),
    ("AGENDA", r"agenda"),
]:
    print(f"\n-- {label}")
    files = [p for p in FILES if re.search(needle, p, re.I)]
    ranges = [(p, i, ln) for p in files for i, ln in enumerate(FILES[p].splitlines(), 1)
              if re.search(r"(dateFrom|dateTo|startDate|endDate|from.*to|range|periodo|period|month|mes|<input[^>]*type=['\"]date)", ln, re.I)]
    dump(ranges, limit=25)

section("FIM — cole a saida aqui que eu monto o patch da Fase 2")
print("Nada foi escrito. Este script e read-only.")
