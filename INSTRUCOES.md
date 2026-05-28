# Polish Estoque — KPIs compactos + atalho rápido de movimentação

## 🎯 O que muda

### 1. KPIs em chips (mobile)
- **Mobile**: os 4 KPIs viram chips coloridos numa faixa scrollável horizontal (~50px vs ~180px antes)
- **Desktop**: mantém os 4 cards grandes (inalterado)
- Libera muito espaço pra lista

### 2. Atalho rápido de movimentação ⭐ NOVO
- Cada produto **com controle de estoque** ganha um botão de atalho (ícone ↕) na lista
- Toca → abre `QuickStockSheet` (bottom-sheet no mobile, modal no desktop)
- **SEM precisar abrir o ProductModal completo + trocar de aba**
- Tem:
  - Cards de tipo grandes (Entrada/Saída/Ajuste/Perda)
  - **Teclado numérico touch** no mobile (input gigante estilo calculadora)
  - Preview "saldo após" destacado (card escuro)
  - Botão "Registrar" fixo no rodapé

### 3. ProductRow ajustado
- Área de toque dividida: corpo abre edição, botão ↕ abre movimentação rápida

## 📦 Aplicar

```bash
cd ~/Documentos/eligi/front-end
unzip -o ~/Downloads/estoque-polish.zip -d ./
npm run lint && npm run build && npm run deploy
```

## 🗂 Arquivos

```
src/app/dashboard/estoque/
├── page.tsx                          ← integra QuickStockSheet
└── components/
    ├── StockSummaryCards.tsx         ← chips no mobile
    ├── ProductRow.tsx                ← botão de atalho ↕
    └── QuickStockSheet.tsx           ← NOVO: movimentação rápida touch
```

⚠️ **StockTab.tsx e ProductModal.tsx NÃO foram alterados** — continuam funcionando. O QuickStockSheet é um caminho alternativo (mais rápido), não substitui o modal completo.

## 🧪 Teste

### Mobile
1. `/dashboard/estoque` → KPIs agora são chips compactos no topo (rola horizontal)
2. Lista de produtos respira mais (menos espaço gasto em cima)
3. Num produto com estoque, toca no botão **↕** (à direita)
4. Abre o sheet: escolhe Entrada/Saída, digita no teclado numérico, vê preview "12 → 17"
5. "Registrar movimentação" → fecha e atualiza o saldo na lista

### Desktop
1. KPIs continuam 4 cards grandes
2. Botão ↕ abre modal centrado com o mesmo fluxo

## ✅ Resolve

- ❌ Filtros/KPIs ocupavam muito espaço → ✅ chips compactos
- ❌ Lista pouco intuitiva → ✅ atalho de movimentação direto na linha
- ❌ Adicionar/editar estoque confuso → ✅ QuickStockSheet touch-first
