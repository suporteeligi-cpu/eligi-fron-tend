#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# FASE 1 / Fatia 3 — AUDIT READ-ONLY do seletor de MÊS (Despesas + Relatorios).
# Nao escreve nada. Rode na raiz do front-end: python3 audit_month_picker.py

import os, re, sys

ROOTS = [
    'src/app/dashboard/financeiro/despesas',
    'src/app/dashboard/relatorios',
    'src/features/reports',
]
EXTS = ('.ts', '.tsx')
SKIP = re.compile(r'(\.backup|_backup)', re.I)

def files():
    for base in ROOTS:
        if not os.path.isdir(base):
            print(f'[aviso] pasta ausente: {base}')
            continue
        for dp, dns, fns in os.walk(base):
            dns[:] = [d for d in dns if not SKIP.search(d)]
            for fn in fns:
                if fn.endswith(EXTS):
                    yield os.path.join(dp, fn)

FILES = {p: open(p, encoding='utf-8', errors='ignore').read() for p in files()}
print(f'[scan] {len(FILES)} arquivos\n')

def grep(label, pattern):
    rx = re.compile(pattern, re.I)
    print('=' * 70); print(label); print('=' * 70)
    hit = False
    for p, txt in FILES.items():
        for i, ln in enumerate(txt.splitlines(), 1):
            if rx.search(ln):
                print(f'  {p}:{i}  {ln.strip()[:135]}'); hit = True
    if not hit: print('  (nenhum match)')
    print()

print('=' * 70); print('0) ARQUIVOS'); print('=' * 70)
for p in sorted(FILES): print('  ' + p)
print()

grep('1) ESTADO DO MES  (currentMonth / period useState)', r'useState[^\n]*(period|currentMonth|month|mes)')
grep('2) TROCA DE MES  (setPeriod / setCurrentMonth / add|subtract month)', r'(setPeriod|setCurrentMonth|\.add\(1,\s*[\'"]month|\.subtract\(1,\s*[\'"]month)')
grep('3) LABEL DO MES  (format MMMM / YYYY-MM)', r'(format\([\'"][^\'"]*(MMMM|YYYY-MM)|monthLabel|MONTHS_PT\[)')
grep('4) CONTROLE DE UI  (setas prev/next, ChevronLeft/Right perto de mes)', r'(ChevronLeft|ChevronRight|prevMonth|nextMonth|onPrev|onNext|‹|›)')
grep('5) CONSUMO  (useReportData / period passado adiante)', r'(useReportData|period\s*=|period\s*:|period\s*}|\{\s*period\s*\})')
grep('6) JA IMPORTA CalendarPicker?', r'CalendarPicker')

print('=' * 70); print('FIM — cola a saida aqui'); print('=' * 70)
print('Read-only. Nada foi escrito.')
