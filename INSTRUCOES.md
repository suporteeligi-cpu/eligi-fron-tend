# Hub Financeiro · /dashboard/financeiro

Cria a página principal do módulo Financeiro como **hub de submódulos**.

## 🎨 Layout

```
┌─────────────────────────────────────┐
│ Financeiro                          │
│ Gestão financeira completa do seu…  │
└─────────────────────────────────────┘

┌────────────────┐  ┌────────────────┐
│ 💰 Comissões   │  │ 🛒 Vendas      │
│ A PAGAR: R$ X  │  │ Em breve…      │
│ PAGO MÊS: R$ Y │  │ Fase 6.7       │
└────────────────┘  └────────────────┘

┌────────────────┐  ┌────────────────┐
│ 📊 Relatórios  │  │ 📉 Despesas    │
│ Em breve…      │  │ Em breve…      │
│ Fase 6.7       │  │ Fase 7         │
└────────────────┘  └────────────────┘

┌────────────────┐
│ 📄 NCs         │
│ Em breve…      │
│ Fase 7         │
└────────────────┘
```

- **Comissões**: ATIVO, mini-resumo com:
  - "A PAGAR" (soma de comissões pendentes + nº de profissionais)
  - "PAGO ESTE MÊS" (soma de payouts PAID do mês atual + count)
- **Outros**: cards com ícone, descrição e placeholder "Em breve · Fase X"
- **Hover** nos cards ativos: borda vermelha + sobe 2px

## 📦 Aplicar

```bash
cd ~/Documentos/eligi/front-end
unzip -o ~/Downloads/financeiro-hub.zip -d ./
npm run lint && npm run build && npm run deploy
```

## 🗂 Arquivos

```
src/app/dashboard/financeiro/
├── page.tsx                          ← hub principal
└── components/
    ├── ModuleCard.tsx                ← card reutilizável (ativo ou placeholder)
    └── CommissionsSummary.tsx        ← mini-resumo do card de Comissões
```

## ⚠️ Pré-requisito

Backend payout-backend + payouts-routes-fix + frontend payouts-frontend deployados.

## 🧪 Teste

1. `/dashboard/financeiro` → vê grid com 5 cards
2. **Comissões** mostra valores reais (pendentes + pagos do mês)
3. Click em **Comissões** → vai pra `/dashboard/financeiro/comissoes`
4. O botão "← Financeiro" lá agora **não dá mais 404** ✅
5. Outros cards: hover desabilitado, ícone dessaturado, badge "Em breve"
