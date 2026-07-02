#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# FASE 1 / Fatia 2 — AUDIT READ-ONLY do seletor de data do Financeiro/Vendas.
# Nao escreve nada. Rode na raiz do front-end: python3 audit_vendas_range.py

import os, re, sys

ROOTS = [
    'src/app/dashboard/financeiro',
    'src/features/sales-report',
    'src/features/sales',
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
                print(f'  {p}:{i}  {ln.strip()[:130]}'); hit = True
    if not hit: print('  (nenhum match)')
    print()

# 1) arvore de arquivos das telas
print('=' * 70); print('0) ARQUIVOS ENCONTRADOS'); print('=' * 70)
for p in sorted(FILES): print('  ' + p)
print()

# 2) como o usuario escolhe data hoje
grep('1) INPUT DE DATA NATIVO  (<input type="date">)', r'type\s*=\s*["\']date["\']')
grep('2) JA USA CalendarPicker?', r'CalendarPicker')
grep('3) SETAGEM DO RANGE  (setDateFrom / setDateTo / onChange de data)', r'(setDateFrom|setDateTo|dateFrom\s*:|dateTo\s*:|onChange.*date|setRange|setPeriod)')
grep('4) ESTADO DO FILTRO  (useState de data / dayjs / atalhos)', r'(useState[^)]*(date|from|to|range|period)|dayjs\(|startOf|endOf|subtract\(|últim|ultim|hoje|30 dias|7 dias)')
grep('5) DADOS DA TELA  (hook que dispara a busca com dateFrom/dateTo)', r'(useSalesSummary|useSalesReport|useReportData|/sales/report|/sales/summary|params\s*:)')

print('=' * 70); print('FIM — cola a saida aqui'); print('=' * 70)
print('Read-only. Nada foi escrito.')
