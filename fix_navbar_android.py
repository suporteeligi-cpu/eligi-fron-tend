#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fix Android: navbar 'flutuando' no load (position:fixed + transform).

OPCAO A:
  1) Remove a animacao 'eligi-navbar-in' do <div> fixo (que tinha transform via
     fill-mode 'both' e quebrava o position:fixed no Chrome Android).
  2) Move essa mesma animacao para o <header> interno (position:relative),
     onde o transform e' inofensivo. Entrada visual continua identica.

Uso:
    python3 fix_navbar_android.py
    python3 fix_navbar_android.py /caminho/para/AppNavbar.tsx
"""
import sys, os, shutil
from datetime import datetime

DEFAULT = "src/app/components/navigation/AppNavbar.tsx"

WRAP_OLD = "pointerEvents:'none', animation:'eligi-navbar-in 380ms cubic-bezier(.22,1,.36,1) both' }}>"
WRAP_NEW = "pointerEvents:'none' }}>"

HEADER_OLD = (
    "          transition:'all 280ms cubic-bezier(.4,0,.2,1)',\n"
    "          overflow:'hidden',"
)
HEADER_NEW = (
    "          transition:'all 280ms cubic-bezier(.4,0,.2,1)',\n"
    "          animation:'eligi-navbar-in 380ms cubic-bezier(.22,1,.36,1) both',\n"
    "          overflow:'hidden',"
)


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT
    if not os.path.isfile(path):
        print(f"ERRO: arquivo nao encontrado: {path}")
        print("Rode a partir da raiz do front-end, ou passe o caminho como argumento.")
        sys.exit(1)

    with open(path, "r", encoding="utf-8") as f:
        src = f.read()

    # ---- checagem de anchors (1x cada) ----
    n_wrap = src.count(WRAP_OLD)
    n_head = src.count(HEADER_OLD)
    print(f"anchor wrapper (animation no div fixo) encontrado 1x : {n_wrap == 1}")
    print(f"anchor header  (transition + overflow)   encontrado 1x : {n_head == 1}")

    if n_wrap != 1 or n_head != 1:
        # idempotencia: ja aplicado?
        if "          animation:'eligi-navbar-in 380ms cubic-bezier(.22,1,.36,1) both',\n          overflow:'hidden'," in src \
           and WRAP_OLD not in src:
            print(">> Parece que o patch JA foi aplicado. Nada a fazer.")
            sys.exit(0)
        print(">> Anchors inesperados. NAO modifiquei nada. Confira o arquivo.")
        sys.exit(2)

    # ---- backup ----
    bdir = ".backup"
    os.makedirs(bdir, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    bpath = os.path.join(bdir, f"AppNavbar.tsx.{stamp}.bak")
    shutil.copy2(path, bpath)
    print(f"backup salvo em: {bpath}")

    # ---- aplica ----
    out = src.replace(WRAP_OLD, WRAP_NEW, 1)
    out = out.replace(HEADER_OLD, HEADER_NEW, 1)

    ok_wrap = (WRAP_OLD not in out) and (WRAP_NEW in out)
    ok_head = ("          animation:'eligi-navbar-in 380ms cubic-bezier(.22,1,.36,1) both',\n          overflow:'hidden'," in out)
    print(f"wrapper limpo (sem transform/animation)   : {ok_wrap}")
    print(f"header com animacao de entrada            : {ok_head}")

    if not (ok_wrap and ok_head):
        print(">> Verificacao pos-edit falhou. NAO escrevi o arquivo.")
        sys.exit(3)

    with open(path, "w", encoding="utf-8") as f:
        f.write(out)

    print("OK: patch aplicado com sucesso.")
    print("Proximo passo: npm run lint && npm run build && npm run deploy")


if __name__ == "__main__":
    main()
