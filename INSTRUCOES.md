# Frontend — Módulo Estoque UNIFICADO

Refator que une `/produtos` e `/estoque` numa página única `/estoque`.
Modal de produto tem 2 tabs: **Dados** e **Estoque**.

---

## ⚠️ Passo 1 — DELETAR arquivos antigos

Antes de aplicar o zip, **deleta esses arquivos/pastas** do projeto:

```bash
cd ~/Documentos/eligi/front-end

# 1. Deletar a pasta inteira de produtos (página antiga)
rm -rf src/app/dashboard/produtos

# 2. Deletar componentes antigos do estoque que viraram parte do modal
rm src/app/dashboard/estoque/components/StockProductRow.tsx
rm src/app/dashboard/estoque/components/StockStatusBadge.tsx
rm src/app/dashboard/estoque/components/MovementModal.tsx
rm src/app/dashboard/estoque/components/HistoryDrawer.tsx
```

## ⚠️ Passo 2 — Editar `navigation.config.ts`

**Remover** o item "Produtos" (ou só "Estoque" — qualquer um dos dois que esteja lá):

```typescript
// ❌ REMOVER
{
  label: 'Produtos',
  href:  '/dashboard/produtos',
  icon:  Box,
  ...
},
```

**Manter** só o item "Estoque":

```typescript
import { ..., PackageOpen } from 'lucide-react'

{
  label: 'Estoque',
  href:  '/dashboard/estoque',
  icon:  PackageOpen,
  roles: ['BUSINESS_OWNER'],
},
```

## Passo 3 — Aplicar zip

```bash
unzip -o ~/Downloads/estoque-unified.zip -d ./

# Build
npm run lint && npm run build

# Deploy
npm run deploy
```

---

## Estrutura final do módulo

```
src/app/dashboard/estoque/
├── page.tsx                         ← lista unificada
└── components/
    ├── ProductRow.tsx               ← linha com badge condicional
    ├── ProductModal.tsx             ← modal com tabs Dados | Estoque
    ├── StockTab.tsx                 ← conteúdo da aba Estoque (toggle + saldo + movimentações inline)
    ├── ProductImagePicker.tsx
    ├── StockSummaryCards.tsx        ← 4 KPIs (sempre visíveis)
    ├── StockFilterTabs.tsx          ← 5 filtros (Todos | Em estoque | Baixo | Esgotado | Sem controle)
    └── Toast.tsx
```

---

## O que mudou em UX

### ANTES (2 páginas separadas)
- `/produtos` → CRUD básico, sem visão de estoque
- `/estoque` → só produtos com trackStock=true, com KPIs, movimentações, histórico
- Movimentar = botão na linha → MovementModal → fecha → reabre p/ histórico via HistoryDrawer
- 2 itens no menu lateral

### DEPOIS (1 página só)
- `/estoque` → **TODOS** os produtos, agrupados por categoria
- KPIs sempre visíveis no topo
- 5 filtros (incluindo "Sem controle de estoque")
- Cada linha mostra preço + badge de saldo (se trackStock=true)
- Click no produto → modal com 2 tabs:
  - **Dados** → nome, preço, custo, foto, SKU, etc + toggle ativo
  - **Estoque** → toggle controle + alerta + form de movimentação inline + histórico embaixo
- 1 item no menu lateral

---

## Roteiro de teste

1. **Vai em `/estoque`** → vê todos os produtos (anteriormente em /produtos também)
2. **4 KPIs no topo** mostram contagem real
3. **Filtra por "Sem controle"** → mostra só os que não controlam estoque
4. **Filtra por "Em estoque"** → só verdes (trackStock=true + stock > alerta)
5. **Clica em qualquer produto** → modal abre na tab **Dados**
6. **Tab "Estoque"**:
   - Se trackStock=false → vê só o toggle + mensagem "Não controla estoque"
   - Ativa → aparecem campos de alerta + form de movimentação
7. **Registra entrada de 30** → vê histórico aparecer imediatamente abaixo
8. **Saldo atualiza no header da tab Estoque** (badge vermelho com número)
9. **Fecha o modal, volta na lista** → linha do produto mostra novo saldo
10. **KPIs atualizam**

---

## Backend

**Nada muda no backend**. Os endpoints continuam:
- `GET/POST/PATCH/DELETE /products`
- `GET /products/stock/summary`
- `GET /products/stock/alerts`
- `GET /products/:id/movements`
- `POST /products/:id/movements`

---

## O que NÃO foi mexido

- `features/stock/types.ts` ✅ (continua igual)
- `features/stock/utils/format.ts` ✅
- `features/stock/hooks/useLowStockAlerts.ts` ✅
- `features/stock/components/LowStockBellButton.tsx` ✅ (continua plugado no AppNavbar)
- `features/products/types.ts` ✅
- `features/products/utils/format.ts` ✅
- `features/products/utils/imageUpload.ts` ✅
