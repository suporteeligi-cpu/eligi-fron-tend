#!/usr/bin/env python3
# patch-types-selos.py
# Adiciona fromOnline? e professionalPreference? ao AgendaBooking.
# Cirúrgico, idempotente, com backup.
#
# Uso (raiz do FRONT-END / dashboard):
#   python3 patch-types-selos.py

import os, sys, time, shutil

PATH = "src/features/agenda/types/index.ts"

if not os.path.exists(PATH):
    sys.exit(f"ERRO: {PATH} não encontrado. Rode na raiz do front-end (dashboard).")

src = open(PATH, encoding="utf-8").read()

if "professionalPreference" in src:
    sys.exit("Já está aplicado. Nada a fazer.")

anchor = "  isPaid?:        boolean  // tem venda CONFIRMED ligada (checkout completo)"
if anchor not in src:
    # fallback: tenta achar a linha do isPaid de forma mais frouxa
    import re
    m = re.search(r"^\s*isPaid\?:.*$", src, flags=re.MULTILINE)
    if not m:
        sys.exit("ERRO: não achei a linha 'isPaid?' no AgendaBooking. Me avise pra ajustar a âncora.")
    anchor = m.group(0)

addition = (
    anchor + "\n"
    "  fromOnline?:             boolean  // veio do link público (selo 🚀)\n"
    "  professionalPreference?: boolean  // cliente escolheu o profissional (selo ❤️)"
)

os.makedirs(".backup", exist_ok=True)
bkp = f".backup/agenda-types-index.ts.{time.strftime('%Y%m%d-%H%M%S')}"
shutil.copy(PATH, bkp)

src = src.replace(anchor, addition, 1)
open(PATH, "w", encoding="utf-8").write(src)
print("OK — fromOnline? e professionalPreference? adicionados ao AgendaBooking.")
print(f"Backup: {bkp}")
