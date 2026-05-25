# Frontend Fase 2.3 — Estoque

## ⚠️ Ações manuais

### 1. Adicionar "Estoque" no `navigation.config.ts`

Abra `src/app/components/navigation/navigation.config.ts` e adicione:

```typescript
import { ..., PackageOpen } from 'lucide-react'

// Logo depois do item "Produtos":
{
  label: 'Estoque',
  href:  '/dashboard/estoque',
  icon:  PackageOpen,
  roles: ['BUSINESS_OWNER'],
},
```

### 2. Plugar o sino no `AppNavbar.tsx` (opcional mas recomendado)

Abra `src/app/components/navigation/AppNavbar.tsx` e adicione na parte de ações do navbar (onde já tem o sino existente, se houver):

```typescript
import LowStockBellButton from '@/features/stock/components/LowStockBellButton'

// No JSX, perto dos outros botões da direita:
<LowStockBellButton />
```

Isso vai mostrar um sino com badge vermelho contando produtos em alerta + popover com lista.

Se você já tem outro sino de notificações, pode substituir ou somar — o `LowStockBellButton` é totalmente standalone (faz polling de 60s no `/products/stock/alerts`).

## Aplicar

```bash
cd ~/Documentos/eligi/front-end

# 1. Aplica arquivos
unzip -o ~/Downloads/estoque-frontend.zip -d ./

# 2. Edita navigation.config.ts (manual)
# 3. Edita AppNavbar.tsx (opcional — adicionar LowStockBellButton)

# 4. Build local
npm run lint && npm run build

# 5. Deploy
npm run deploy
```

## O que tem nesse zip

### 🆕 Novos arquivos

**Stock module:**
- `src/features/stock/types.ts`
- `src/features/stock/utils/format.ts`
- `src/features/stock/hooks/useLowStockAlerts.ts` — hook reutilizável
- `src/features/stock/components/LowStockBellButton.tsx` — drop-in pro AppNavbar

**Página /estoque:**
- `src/app/dashboard/estoque/page.tsx`
- `src/app/dashboard/estoque/components/StockSummaryCards.tsx`
- `src/app/dashboard/estoque/components/StockFilterTabs.tsx`
- `src/app/dashboard/estoque/components/StockProductRow.tsx`
- `src/app/dashboard/estoque/components/StockStatusBadge.tsx`
- `src/app/dashboard/estoque/components/MovementModal.tsx`
- `src/app/dashboard/estoque/components/HistoryDrawer.tsx`
- `src/app/dashboard/estoque/components/Toast.tsx`

### ✏️ Atualizados

- `src/features/products/types.ts` — adiciona `trackStock`, `stock`, `stockAlert`
- `src/app/dashboard/produtos/components/ProductModal.tsx` — seção "Controlar estoque" com toggle + campos condicionais

## Como testar

1. **Vai em `/produtos`** → edita um produto:
   - Ativa "Controlar estoque"
   - Define alerta = 5
   - Salva
2. **Vai em `/estoque`** → vê:
   - 4 cards de resumo no topo
   - Filtros (Todos / Estoque baixo / Esgotados)
   - Card do produto com saldo 0 = "Esgotado"
3. **Clica em "Movimentar"** → modal de 4 tipos:
   - Escolhe **Entrada** → quantidade 30 → motivo "Saldo inicial"
   - Vê preview "0 → 30"
   - Salva → toast verde "Movimentação registrada"
   - Saldo no card vira 30
4. **Clica no ícone de histórico** → drawer com a movimentação
5. **Volta em /estoque, vê 30 unidades verde** "Em estoque"
6. **Faz uma saída de 28** → vira 2 (estoque baixo, badge laranja)
7. **Vai num produto qualquer fora do alerta** → sino do navbar mostra "1" se você plugou
8. **Clica no sino** → popover lista o produto → clica → vai pra /estoque
9. **Tenta tirar mais 5** → erro "Estoque insuficiente. Disponível: 2"
10. **No mobile**: tudo funciona com bottom sheets e drill-down igual outras telas

## Visual destaque

- **Cards de KPI** com ícones coloridos (azul/laranja/vermelho/verde)
- **Filter tabs estilo segment control** (iOS) com contadores
- **Status badges**: verde (em estoque), laranja (baixo), vermelho (esgotado)
- **MovementModal**: 4 cards grandes pra escolher tipo + preview "saldo após" em tempo real + valida saldo negativo
- **HistoryDrawer**: timeline de movimentações com badge colorido por tipo + delta com sinal
- **Sino com badge animado** (pulse leve) quando há alertas
