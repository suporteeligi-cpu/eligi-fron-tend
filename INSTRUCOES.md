# Dashboard v2 — Fase 6.6

Reescrita completa do dashboard executivo com:

- 💰 **Receita REAL** via Sale CONFIRMED − CreditNotes (não mais Payment)
- 🏆 **Top profissionais por RECEITA** (não mais por count)
- 📈 Mini-gráfico SVG dos últimos 7 dias (sem Recharts, leve)
- 📋 Agenda de hoje (próximos primeiro)
- ⚠️ **Alertas tocáveis** que redirecionam pros módulos
  - Comissões pendentes → `/financeiro/comissoes`
  - Estoque baixo → `/estoque`
  - Agendamentos sem profissional → `/agenda`
- 🎯 4 KPIs no topo (Receita, Agendamentos, Ticket Médio, Ocupação)
- 📅 Seletor de período (Hoje / 7d / 30d) com comparação anterior

---

## 📦 Aplicar

### Backend

```bash
cd ~/Documentos/eligi/back-end
unzip -o ~/Downloads/dashboard-v2-backend.zip -d ./
npm run lint && npm run build && npm run deploy
```

### Frontend

```bash
cd ~/Documentos/eligi/front-end
unzip -o ~/Downloads/dashboard-v2-frontend.zip -d ./
npm run lint && npm run build && npm run deploy
```

---

## 🗂 Arquivos

### Backend
```
src/modules/dashboard/
├── dashboard.service.ts    ← REESCRITO usando Sale
└── dashboard.controller.ts ← ajustado pra validar period
```

### Frontend
```
src/features/dashboard/
├── types.ts
└── utils/format.ts

src/app/dashboard/
├── page.tsx                          ← REESCRITO
└── components/
    ├── KpiCard.tsx                   ← card de KPI com growth
    ├── RevenueSparkline.tsx          ← mini-gráfico SVG
    ├── TopProfessionalsCard.tsx      ← ranking por receita
    ├── TodayScheduleCard.tsx         ← agenda do dia
    ├── AlertsCard.tsx                ← alertas tocáveis
    └── PeriodSelector.tsx            ← dropdown Hoje/7d/30d
```

⚠️ **Os componentes antigos** (`DashboardHeader`, `DashboardKPIs`, `RevenueLineChart`, `WeeklyDemandChart`, `TopBarbers`) **não são mais usados**. Você pode deletá-los depois:
```bash
rm src/app/components/dashboard/{DashboardHeader,DashboardKPIs,RevenueLineChart,WeeklyDemandChart,TopBarbers}.tsx
```

---

## 🎯 O que mudou conceitualmente

| Antes | Agora |
|---|---|
| Receita via `Payment.status=PAID` | Receita via `Sale.status=CONFIRMED` − `CreditNote.amount` |
| Top profs por **count de bookings** | Top profs por **R$ de receita** (proporcional, descontando NCs) |
| Sem alertas | 3 alertas tocáveis (comissões, estoque, sem prof) |
| Sem comparação histórica clara | KPI mostra +X% ↑ / -Y% ↓ / "novo" |
| Period query sem validação | Validado: `today`/`7d`/`30d` |
| Layout com gráficos pesados | Visual limpo, mini SVG, sem dependência Recharts |

---

## 🧪 Roteiro de teste

1. Login no `/dashboard`
2. Veja os 4 KPIs no topo com valores reais
3. Mude o período no dropdown (canto superior direito):
   - **Hoje**: vê comparação vs ontem
   - **7d**: vê comparação vs 7d anteriores
   - **30d**: vê comparação vs 30d anteriores
4. Receita líquida = vendas CONFIRMED do período menos NCs emitidas
5. Top profissionais ordenados por R$ gerado
6. **Click nos cards de alerta** → vai pro módulo correspondente:
   - "R$ X em comissões" → `/financeiro/comissoes`
   - "X produtos com estoque baixo" → `/estoque`
   - "X agendamentos sem profissional" → `/agenda`
7. Próximos agendamentos hoje (já passados ficam dim e riscados se COMPLETED)
8. Mobile: layout vira coluna única, KPIs em grid 2x2

---

## 💡 Observações

- **Sem dependência Recharts**: o gráfico é SVG puro (mais leve, sem peso de lib)
- **Sem scroll forçado**: alguma rolagem natural pode acontecer em mobile, mas o conteúdo crítico (KPIs + alertas) cabe no fold
- **Performance**: 1 chamada única (`/dashboard/overview`) traz tudo
- O endpoint `dashboard.routes.ts` continua igual (rota `/dashboard/overview` já estava no `server.ts`)
