# Frontend Fase 6.2 — POS / Caixa (Substituição do /caixa antigo)

Substitui completamente o `/caixa` antigo (que usava `/payments/checkout`, `/payments/quick-sale`, etc — endpoints obsoletos) pelo POS novo que consome `/sales/*` deployado na Fase 6.1.

---

## ⚠️ Passo 1 — DELETAR a página antiga

```bash
cd ~/Documentos/eligi/front-end

# Joga fora ~800 linhas da page.tsx antiga (que chama endpoints inexistentes)
rm src/app/dashboard/caixa/page.tsx

# Se tiver outros arquivos antigos em /caixa (provavelmente não tem)
ls src/app/dashboard/caixa/
```

## Passo 2 — Aplicar zip

```bash
unzip -o ~/Downloads/caixa-pos-frontend.zip -d ./

# Build local
npm run lint && npm run build

# Deploy
npm run deploy
```

## Passo 3 — Verificar navigation.config.ts

O item "Caixa" do menu já deve apontar pra `/dashboard/caixa`. Confere se o `href` está certo. Se a rota tinha outro caminho, atualiza pra:

```typescript
{
  label: 'Caixa',
  href:  '/dashboard/caixa',
  icon:  ShoppingBag, // ou outro ícone que você esteja usando
  roles: ['BUSINESS_OWNER'],
},
```

---

## 🏗️ Estrutura final do módulo

```
src/features/sales/
├── types.ts                          ← Sale, SaleItem, SalePayment, CreditNote, etc
├── utils/format.ts                   ← formatBRL, PAYMENT_METHOD_LABEL/ICON
└── hooks/useSalesSummary.ts          ← hook do dashboard

src/app/dashboard/caixa/
├── page.tsx                          ← 3 abas: Abertas | Confirmadas | Resumo
├── [id]/page.tsx                     ← detalhe de venda confirmada
└── components/
    ├── Avatar.tsx
    ├── Toast.tsx
    ├── ClientPicker.tsx              ← busca/seleciona cliente com debounce 280ms
    ├── ProfPicker.tsx                ← dropdown de profissional
    ├── CatalogPanel.tsx              ← toggle Serviços|Produtos + grid de cards visuais
    ├── CartItemRow.tsx               ← linha do carrinho com qty +/- e override de prof
    ├── CartPanel.tsx                 ← orquestra carrinho de UMA venda OPEN
    ├── OpenSalesSwitcher.tsx         ← barra Booksy de carrinhos múltiplos
    ├── PaymentModal.tsx              ← modal full-screen pagamento misto
    ├── SalesSummaryCards.tsx         ← KPIs da aba Resumo
    ├── ConfirmedSalesList.tsx        ← lista vendas CONFIRMED do dia
    └── CreditNoteModal.tsx           ← emite NC pra anular venda confirmada
```

---

## 🎯 Funcionalidades

### Aba "Vendas Abertas"
- **Múltiplas vendas OPEN simultâneas** (estilo Booksy: barra horizontal de carrinhos no topo)
- **Layout 2 colunas no desktop** (catálogo esquerda, carrinho direita) / **empilhado mobile**
- **Catálogo visual em grid**:
  - Toggle Serviços | Produtos
  - Cards com foto/cor + preço
  - Badge de saldo nos produtos (Esgotado/X un.)
  - Click adiciona ao carrinho ativo
  - Se não tem carrinho, cria automaticamente
- **Carrinho**:
  - Cliente opcional (busca com autocompletar)
  - Profissional **global** do carrinho
  - Botão "↻ Aplicar a todos os itens" se mudar global
  - Cada item pode ter **override** de profissional (badge laranja)
  - Stepper +/- de quantidade
  - Desconto inline
  - Notas
  - Total grande em destaque (gradiente dark)
- **Cancelar venda** (só permitido em OPEN)

### Aba "Confirmadas"
- Lista vendas CONFIRMED do dia
- Click leva pra `/dashboard/caixa/[id]`
- Mostra se tem NC e se foi totalmente anulada

### Aba "Resumo"
- 4 KPIs: Vendas, Bruto, Líquido, Comissões
- Breakdown por método de pagamento
- Total serviços vs produtos

### Detalhe de venda `/caixa/[id]`
- Cliente, itens (com comissão), pagamentos (cada um com ícone do método)
- Notas de crédito emitidas
- Botão "Emitir nota de crédito" (se confirmada e não totalmente anulada)

### PaymentModal (Confirmar venda)
- **Pagamento misto** — adicione quantas linhas quiser
- Cada linha: método + valor + referência (NSU/PIX)
- Validação em tempo real: "Falta R$ X" / "Sobra R$ Y" / "✓ Total batido"
- Botão "Preencher" auto-completa última linha com restante
- Desconto adicional no modal (override do desconto do carrinho)

### CreditNoteModal
- Motivo obrigatório
- Opção "Devolver produtos ao estoque" (gera StockMovement IN automático)
- Calcula valor restante se já houve NCs anteriores

---

## 🧪 Roteiro de teste

1. Acessa `/caixa` → vê 3 abas, aba "Vendas Abertas" selecionada
2. Click em "+ Nova" → cria carrinho OPEN
3. Click num serviço no grid → adiciona ao carrinho
4. Click num produto → adiciona ao carrinho
5. Seleciona cliente (busca) → atualiza
6. Seleciona profissional global → aplica
7. Muda profissional de UM item → vê badge "Override" laranja
8. Click "↻ Aplicar a todos" → todos voltam pro global
9. Click "+ Nova" → cria segundo carrinho, switcher mostra 2 abas
10. Volta na primeira venda → continua de onde parou
11. Click "Confirmar · R$ XX,XX" → abre PaymentModal full-screen
12. Adiciona desconto, dois métodos de pagamento (Pix + Dinheiro)
13. Confirma → animação success → some da lista de abertas
14. Vai na aba "Confirmadas" → vê a venda
15. Click → vai pra `/caixa/[id]` → vê tudo
16. Click "Emitir nota de crédito" → motivo + opção de devolver estoque
17. Emite → recarrega → vê NC listada, badge ANULADA se for total
18. Vai na aba "Resumo" → KPIs atualizados

---

## 🛡️ Validações que o backend enforça (e que o front trata)

| Operação | Erro possível | Como o front trata |
|---|---|---|
| Adicionar produto esgotado | "Produto inativo" / estoque insuficiente | Card desabilitado, toast de erro |
| Confirmar venda sem itens | "Venda sem itens" | Botão desabilitado |
| Pagamentos != total | "Soma dos pagamentos ≠ total" | Aviso em tempo real, botão desabilitado se diferente |
| Cancelar venda confirmada | "Emita nota de crédito" | Botão Cancel só aparece em OPEN |
| Estoque insuficiente ao confirmar | "Estoque insuficiente de X" | Toast de erro, venda continua OPEN pra ajustar |

---

## ⚠️ Avisos importantes pro Eli

1. **As tabs antigas "Para Cobrar" e "Transações" SUMIRAM** — elas usavam endpoints `/payments/*` que estão obsoletos. Próxima sessão migramos a lógica delas pro modelo `Sale`.

2. **Bookings com pagamento pendente** (vindos da agenda) **não aparecem mais aqui**. Próxima sub-fase (6.3) adiciona botão "Cobrar" no booking que cria uma `Sale` automaticamente vinculada.

3. **Métodos de pagamento limitados** aos 6 do enum do backend:
   - CASH, PIX, CREDIT, DEBIT, TRANSFER, OTHER
   - Pacote, Cartão Presente, Assinatura virão nas Fases 7+

4. **O componente `SideCheckoutPanel` da agenda NÃO foi mexido** — ele continua agendando normalmente. A integração agenda↔caixa vem na Fase 6.4.

---

## 📦 Endpoints consumidos

```
GET    /sales?status=OPEN              → lista carrinhos abertos
GET    /sales?status=CONFIRMED         → lista vendas confirmadas
GET    /sales/:id                      → detalhe (recarrega após mudanças)
GET    /sales/summary                  → KPIs do dia

POST   /sales                          → cria novo carrinho
PATCH  /sales/:id                      → atualiza cliente, desconto, notas
POST   /sales/:id/cancel               → cancela (só OPEN)

POST   /sales/:id/items                → adiciona item
PATCH  /sales/:id/items/:itemId        → atualiza qty/prof
DELETE /sales/:id/items/:itemId        → remove

POST   /sales/:id/confirm              → CHECKOUT atômico (estoque + comissão + pagamentos)
POST   /sales/:id/credit-notes         → emite NC

GET    /services                       → catálogo de serviços
GET    /products                       → catálogo de produtos
GET    /equipe                         → profissionais
GET    /clients?search=...&limit=10    → busca de clientes
```

---

## 🗺️ Próximas sub-fases (próximas sessões)

| Sub-fase | Escopo |
|---|---|
| 6.3 | Migrar lógica "Para Cobrar" — botão "Cobrar" no booking cria Sale com bookingId |
| 6.4 | Refator do `SideCheckoutPanel` da agenda pra aceitar produtos (ALTO RISCO) |
| 6.5 | Relatórios visuais detalhados de comissões + filtros por período |
| 7 | Pacotes |
| 8 | Cartões Presente |
| 9 | Assinaturas |
