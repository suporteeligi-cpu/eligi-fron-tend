# Fase 6.7 — Aba Vendas (Relatório)

Histórico completo de vendas com filtros e export CSV/Excel.

## 🎯 Funcionalidades

- 📊 **4 cards de resumo**: Receita Líquida, Ticket Médio, Notas de Crédito, Bruto
- 🔍 **Filtros**: período (de/até), status, profissional, método de pagamento, busca por cliente
- 📋 **Lista expansível**: cada venda mostra itens, profissionais, métodos ao clicar
- 📥 **Export CSV + Excel (.xlsx)** com todos os dados filtrados
- 📄 **Paginação** (30 por página)

---

## 📦 Aplicar

### Backend

```bash
cd ~/Documentos/eligi/back-end
unzip -o ~/Downloads/vendas-backend.zip -d ./

# Edita sales.routes.ts adicionando as rotas do report (veja ROUTES_PATCH.md)

npm run lint && npm run build && npm run deploy
```

### Frontend

```bash
cd ~/Documentos/eligi/front-end
unzip -o ~/Downloads/vendas-frontend.zip -d ./

# Instala SheetJS pra export Excel (se ainda não tiver)
npm install xlsx

npm run lint && npm run build && npm run deploy
```

---

## ⚠️ Passo manual: rotas (ROUTES_PATCH.md)

No `sales.routes.ts`, adicione **ANTES das rotas com :id**:

```typescript
import { report, reportExport } from './sales-report.controller'

router.get('/report',        asyncHandler(report))
router.get('/report/export', asyncHandler(reportExport))
```

⚠️ Tem que vir antes de `router.get('/:id', ...)` senão o Express acha que "report" é um id.

---

## 🗂 Arquivos

### Backend
```
src/modules/sales/
├── sales-report.service.ts      ← lógica de relatório (NOVO, não mexe no existente)
└── sales-report.controller.ts   ← handlers (NOVO)

ROUTES_PATCH.md                   ← instruções pra adicionar 2 rotas
```

### Frontend
```
src/features/sales-report/
├── types.ts
└── utils/index.ts                ← format + export CSV/Excel

src/app/dashboard/financeiro/
├── page.tsx                      ← card "Vendas" agora ATIVO
└── vendas/
    ├── page.tsx                  ← página principal
    └── components/
        ├── SummaryBar.tsx        ← 4 cards de resumo
        ├── FiltersBar.tsx        ← filtros
        ├── SaleRow.tsx           ← linha expansível
        └── ExportButton.tsx      ← dropdown CSV/Excel
```

---

## 📥 Dependência: xlsx (SheetJS)

O export Excel usa SheetJS via import dinâmico (`await import('xlsx')`).
Instala antes do build:

```bash
npm install xlsx
```

Se não quiser Excel, o CSV funciona sem nenhuma dependência (é nativo).

---

## 🧪 Teste

1. `/dashboard/financeiro` → card "Vendas" agora clicável
2. Click → `/dashboard/financeiro/vendas`
3. Vê 4 cards de resumo no topo
4. Testa filtros:
   - Período: escolhe de/até
   - Status: Confirmadas / Canceladas
   - Profissional: dropdown
   - Método: PIX, Dinheiro, etc
   - Cliente: digita nome (busca com debounce)
5. Click numa venda → expande mostrando itens + resumo financeiro
6. Click "Exportar" → escolhe Excel ou CSV → baixa arquivo
7. Abre o arquivo: tem todas as colunas (data, cliente, itens, métodos, valores)

---

## 🔢 Cálculo de valores

- **Receita Líquida** = Sales CONFIRMED − Notas de Crédito
- **Ticket Médio** = Líquido / nº de vendas confirmadas
- **Bruto** = soma de Sale.total (sem descontar NC)
- **Líquido por venda** = sale.total − créditos daquela venda

Tudo respeitando o **timezone do negócio** (usa o helper `getBusinessTimezone`).
