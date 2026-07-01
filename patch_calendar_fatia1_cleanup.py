#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# eligi-codeflow / Fatia 1 (cleanup) — remove EASE_SMOOTH orfa do CalendarPicker.
# Rode na raiz do front-end: python3 patch_calendar_fatia1_cleanup.py

import os, sys, shutil, datetime

TARGET = sys.argv[1] if len(sys.argv) > 1 else 'src/shared/components/CalendarPicker.tsx'

ANCHOR = "const EASE_SHEET  = 'cubic-bezier(0.34,1.2,0.64,1)'\nconst EASE_SMOOTH = 'cubic-bezier(0.4,0,0.2,1)'\n"
REPLACE = "const EASE_SHEET  = 'cubic-bezier(0.34,1.2,0.64,1)'\n"

def main():
    if not os.path.isfile(TARGET):
        print(f'False  arquivo nao encontrado: {TARGET}')
        sys.exit(1)
    cur = open(TARGET, encoding='utf-8').read()
    if 'EASE_SMOOTH' not in cur:
        print('True   ja limpo (idempotente): EASE_SMOOTH ausente')
        return
    n = cur.count(ANCHOR)
    if n != 1:
        print(f'False  ancora encontrada {n}x (esperado 1) — abortado, nada escrito')
        sys.exit(1)
    ts = datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
    bdir = os.path.join('.backup', ts)
    os.makedirs(bdir, exist_ok=True)
    shutil.copy2(TARGET, os.path.join(bdir, 'CalendarPicker.tsx'))
    print(f'backup -> {os.path.join(bdir, "CalendarPicker.tsx")}')
    new = cur.replace(ANCHOR, REPLACE)
    with open(TARGET, 'w', encoding='utf-8') as f:
        f.write(new)
    ok = 'EASE_SMOOTH' not in open(TARGET, encoding='utf-8').read()
    print(f'{ok}   limpo: {TARGET}')

main()
