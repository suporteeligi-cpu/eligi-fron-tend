# Frontend Fase 6.3 — BookingViewPanel + SideCheckoutPanel integrados ao /caixa

Refator dos painéis da agenda pra usar a API nova de Sales.

---

## ⚠️ Pré-requisito

O **Backend Fase 6.3** (`bookings-sales-integration.zip`) PRECISA estar deployado e funcionando.

Endpoints obrigatórios:
- `GET /bookings/:id`
- `PATCH /bookings/:id`
- `PATCH /bookings/:id/no-show`
- `POST /sales/from-booking`

---

## Aplicar

```bash
cd ~/Documentos/eligi/front-end

unzip -o ~/Downloads/booking-checkout-frontend.zip -d ./

npm run lint && npm run build
npm run deploy
```

---

## 🗂 Arquivos modificados

```
src/features/booking/components/
├── BookingViewPanel.tsx       ← REFATOR COMPLETO (remove /payments/*, adiciona CHECKOUT real)
└── SideCheckoutPanel.tsx      ← Suporte a modo 'edit' (busca booking + PATCH ao salvar)

src/features/agenda/components/
└── AgendaBoard.tsx            ← Passa existingBooking pro SideCheckoutPanel
```

Nenhum outro arquivo é mexido.

---

## 🎯 Fluxo completo agora

### 1. Click num booking na agenda
```
BookingCard.click → store.openView(booking)
                  → BookingViewPanel abre
```

### 2. BookingViewPanel busca detalhe
```
GET /bookings/:id
  → { service, professional, client, sale (se houver), status }
```

### 3. Ações disponíveis no painel

| Status | Botões disponíveis |
|---|---|
| `CONFIRMED` (sem Sale OPEN) | **FECHAR** • **CHECKOUT** + dropdown ALTERAR (Editar / Não compareceu / Cancelar) |
| `CONFIRMED` (com Sale OPEN) | **FECHAR** • **CONTINUAR CHECKOUT** + ALTERAR limitado |
| `COMPLETED` | **FECHAR** • **VER VENDA →** (vai pra `/caixa/[saleId]`) |
| `CANCELED` / `NO_SHOW` | **FECHAR** apenas |

### 4. Clicar **EDITAR** (no dropdown ALTERAR)
```
BookingViewPanel fecha
   ↓ (200ms delay pra animação)
store.openEdit(booking)
   ↓
SideCheckoutPanel abre em modo 'edit'
   ↓
GET /bookings/:id → popula form com dados atuais
   ↓
Usuário muda algo → ATUALIZAR
   ↓
PATCH /bookings/:id (backend cancela Sale OPEN automática)
```

### 5. Clicar **CHECKOUT** (com agendamento ainda CONFIRMED)
```
POST /sales/from-booking { bookingId }
   ↓
Backend cria Sale OPEN linkada + adiciona serviço
   ↓
Front redireciona pra /dashboard/caixa/[saleId]
   ↓
Usuário adiciona produtos extras, desconto, etc
   ↓
Confirma pagamento no PaymentModal
   ↓
Backend: Sale CONFIRMED + Booking → COMPLETED (automaticamente!)
```

### 6. Cobrança antecipada
Se o booking é pra **amanhã 14h** mas você quer cobrar **hoje**:
- Botão CHECKOUT aparece normalmente
- Badge **"ANTECIPADO"** no header do painel (indicador visual)
- Fluxo é idêntico — cria Sale, cobra, booking vira COMPLETED

### 7. Não compareceu (Não tem botão CHECKOUT já)
- Botão "Cliente não compareceu" só aparece se horário já passou (validação visual)
- `PATCH /bookings/:id/no-show`
- Cancela Sale OPEN linkada automaticamente

---

## 🧪 Roteiro de teste

1. **Login** → vai pra `/agenda`
2. **Cria booking** novo (fluxo já funciona) — anota o cliente, horário e profissional
3. **Click no booking** → BookingViewPanel abre
   - Header verde "CONFIRMADO"
   - Botão "CHECKOUT" no rodapé
   - Click em "ALTERAR" → vê dropdown com Editar / Cancelar / (Não compareceu se passado)
4. **Click "Editar"** → SideCheckoutPanel abre em modo edit
   - Loader 1-2s buscando detalhe
   - Form pré-preenchido com cliente, serviço, horário, profissional
   - Mensagem "✏️ Modo edição: 1 serviço por agendamento" no final
   - Botão "ADICIONAR OUTRO SERVIÇO" sumiu (correto pra edit)
   - Botão final é "ATUALIZAR" (não "SALVAR")
5. **Muda horário** → ATUALIZAR
   - Booking atualizado na grade via socket
6. **Click no booking de novo** → CHECKOUT
   - Loading 1s
   - Redireciona pra `/caixa/[saleId]`
   - Vê carrinho com o serviço já adicionado
   - Adiciona um produto, confirma com pagamento PIX R$ X
7. **Volta na agenda** → click no mesmo booking
   - Agora aparece "FINALIZADO" em preto
   - Botão "VER VENDA →" leva pra detalhe
   - "Pago em DD/MM HH:mm" no canto

---

## ⚠️ Detalhes importantes

### Em modo edit, **só 1 serviço**
Backend `PATCH /bookings/:id` aceita só 1 serviço por chamada. Se o cliente precisa de múltiplos serviços, **criar outro booking** (que é o fluxo padrão da agenda).

### Backend cancela Sale OPEN automaticamente
Se você criou um checkout (Sale OPEN), voltou e editou o booking, **a Sale OPEN é cancelada pelo backend** (decisão arquitetural). Você terá que clicar CHECKOUT de novo pra abrir uma nova Sale com os dados atualizados.

### Edição bloqueada se já tem Sale OPEN
O dropdown "Editar" fica desabilitado quando há Sale OPEN linkada. Mensagem: "Cancele o checkout primeiro".
Pra cancelar: ir no `/caixa/[saleId]` e clicar no botão de cancelar (X) do CartPanel.

---

## 🐛 Pontos de atenção

### Endpoints obsoletos REMOVIDOS
- `GET /payments/booking/:id` → substituído por `GET /bookings/:id`
- `PATCH /payments/booking/:id/action` → substituído por `PATCH /bookings/:id/cancel` e `PATCH /bookings/:id/no-show`
- `/dashboard/checkout?bookingId=X` (rota inexistente) → substituído por `/dashboard/caixa/[saleId]`

### Tipo `AgendaBooking` ainda está minimalista
Não inclui `serviceId`, `clientId`, etc — por isso o SideCheckoutPanel busca o booking completo via `GET /bookings/:id` quando entra em modo edit. Funciona, mas se ficar lento podemos passar dados pré-carregados pelo store no futuro.

---

## 🗺️ Próximas sub-fases

| Sub-fase | Escopo |
|---|---|
| **6.4** | Refator do SideCheckoutPanel pra aceitar **produtos** (ALTO RISCO) |
| **6.5** | Relatórios visuais de comissões + dashboard visão geral atualizado |
| 7+ | Pacotes, Cartões Presente, Assinaturas |
