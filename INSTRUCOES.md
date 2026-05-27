# Frontend — Integração Cliente ↔ Bookings ↔ Sales

## 🎯 Objetivo

Fazer `SideCheckoutPanel` passar `clientId` ao criar/editar agendamento, completando a integração com o backend.

---

## ⚠️ Pré-requisito

Backend (`clients-integration-backend.zip`) precisa estar deployado primeiro.

---

## 📦 Aplicar

```bash
cd ~/Documentos/eligi/front-end

unzip -o ~/Downloads/clients-integration-frontend.zip -d ./

npm run lint && npm run build
npm run deploy
```

---

## 🗂 Arquivos modificados

```
src/features/booking/components/
└── SideCheckoutPanel.tsx               ← envia clientId no POST e PATCH

src/app/dashboard/caixa/components/
└── ClientPicker.tsx                    ← remove badge "AVULSO" (agora todo cliente
                                          está linkado de verdade)
```

---

## 🧪 Teste

1. Vai pra `/dashboard/agenda`
2. Clica num horário vazio → abre SideCheckoutPanel
3. Busca um cliente cadastrado (digita nome ou telefone)
4. Seleciona, escolhe serviço, profissional, horário
5. Clica em **CONFIRMAR**
6. Volta pra `/dashboard/clientes`
7. **Resultado esperado**:
   - O cliente agora mostra **+1 agendamento** na coluna de bookings
   - Ao clicar no cliente, o histórico mostra esse agendamento
   - Stats bar no topo da página de clientes reflete o número correto

8. Faz checkout do booking → confirma venda no `/caixa`
9. Volta no cliente → **totalRevenue** agora mostra o valor pago

---

## ✅ O fluxo completo agora

```
SideCheckoutPanel
   ↓ POST /bookings/confirm { clientId, ... }
Booking criado com clientId linkado
   ↓ aparece em /clientes/{id}
   
[CHECKOUT do booking]
   ↓
Sale OPEN criada com clientId herdado
   ↓
[Confirma pagamento]
   ↓
Sale CONFIRMED → entra no totalRevenue do cliente
   ↓ Booking → COMPLETED
```

---

## 🐛 Bonus

- Removeu o badge **AVULSO** do `ClientPicker` (poluição visual, não fazia sentido — clientes vão estar sempre cadastrados agora)
- Mostra só nome + telefone, limpo

---

## 📊 O que vai funcionar agora

- ✅ `/dashboard/clientes` mostra `totalBookings`, `completed`, `canceled` corretos
- ✅ `totalRevenue` = soma de Sales CONFIRMED − CreditNotes (receita real paga)
- ✅ Stats bar com números corretos
- ✅ Tela detalhe do cliente (`/clientes/{id}`) mostra histórico completo
- ✅ Bookings antigos foram linkados pela migration fuzzy match
- ✅ Bookings novos serão linkados via clientId direto
