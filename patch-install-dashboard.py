#!/usr/bin/env python3
# patch-install-dashboard.py
# Monta o ServiceWorkerRegister (global) + InstallAppBar (escopado em /dashboard
# pela própria barra via usePathname) no layout raiz. Os arquivos novos
# (public/sw.js, src/app/sw-register.tsx, src/app/components/InstallAppBar.tsx)
# vêm no zip. Cirúrgico, idempotente, backup. Roda na raiz do FRONT-END (dashboard).

import os, sys, time, shutil

PATH = "src/app/layout.tsx"

if not os.path.exists(PATH):
    sys.exit(f"ERRO: {PATH} não encontrado. Rode na raiz do front-end (dashboard).")

src = open(PATH, encoding="utf-8").read()

if "ServiceWorkerRegister" in src:
    sys.exit("Já está aplicado. Nada a fazer.")

edits = [
    # 1) imports logo após o import de Providers
    (
        "import { Providers } from './providers'",
        "import { Providers } from './providers'\n"
        "import { ServiceWorkerRegister } from './sw-register'\n"
        "import { InstallAppBar } from './components/InstallAppBar'",
    ),
    # 2) montar no body
    (
        "      <body>\n"
        "        <Providers>{children}</Providers>\n"
        "      </body>",
        "      <body>\n"
        "        <Providers>{children}</Providers>\n"
        "        <ServiceWorkerRegister />\n"
        "        <InstallAppBar />\n"
        "      </body>",
    ),
]

for old, _ in edits:
    n = src.count(old)
    if n != 1:
        sys.exit(f"ERRO: âncora não bateu ({n}x, esperado 1):\n---\n{old[:90]}...\n---")

os.makedirs(".backup", exist_ok=True)
bkp = f".backup/layout.tsx.{time.strftime('%Y%m%d-%H%M%S')}"
shutil.copy(PATH, bkp)

for old, new in edits:
    src = src.replace(old, new, 1)

open(PATH, "w", encoding="utf-8").write(src)
print("OK — ServiceWorkerRegister + InstallAppBar montados no layout raiz.")
print(f"Backup: {bkp}")
print("Confirme: public/sw.js, src/app/sw-register.tsx e src/app/components/InstallAppBar.tsx existem (vêm no zip).")
print("Agora: npm run lint && npm run build && npm run deploy")
