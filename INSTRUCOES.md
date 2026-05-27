# Frontend Fase 6.4 — 1 Sale OPEN por vez no /caixa

Refator do POS pra implementar a regra "1 venda OPEN por vez" e corrigir o redirect do botão CHECKOUT do BookingViewPanel.

---

## ⚠️ Pré-requisito

O **Pacote 1 (Backend single-open-sale)** PRECISA estar deployado primeiro.

---

## Aplicar

```bash
cd ~/Documentos/eligi/front-end

unzip -o ~/Downloads/single-open-sale-frontend.zip -d ./

npm run lint && npm run build
npm run deploy
```

---

## 🗂 Arquivos modificados

```
src/app/dashboard/caixa/
├── page.tsx                                  ← lê ?active=, detecta múltiplas OPEN, remove switcher
├── [id]/page.tsx                             ← guarda: redireciona se Sale é OPEN
└── components/
    └── OpenSalesCleanupModal.tsx             ← NOVO: modal de limpeza

src/features/booking/components/
└── BookingViewPanel.tsx                      ← muda URL pra /caixa?active=X
```

⚠️ **Não esquece**: o componente `OpenSalesSwitcher.tsx` continua no projeto (não é deletado), mas não é mais importado. Você pode deletar manualmente se quiser, ou deixar como código morto.

---

## 🎯 Mudanças no fluxo

### Botão CHECKOUT do BookingViewPanel

**Antes**:
- Click CHECKOUT → cria Sale → `router.push('/caixa/<saleId>')` → tela detalhe (read-only) 😞

**Agora**:
- Click CHECKOUT → cria Sale OPEN → `router.push('/caixa?active=<saleId>')` → POS ativo com carrinho editável 🎯

### Tela /caixa principal

**Antes**:
- Múltiplas vendas OPEN exibidas no `OpenSalesSwitcher` (barra horizontal)
- Trocava entre carrinhos

**Agora**:
- 1 venda OPEN por vez (regra de negócio)
- Sem switcher
- Estado vazio → botão "+ Nova Venda"
- Estado com venda → catálogo + carrinho ativo

### Tela /caixa/[id]

**Antes**:
- Mostrava qualquer Sale (mas o conteúdo era de venda CONFIRMED)
- Se Sale era OPEN → tela vazia/quebrada

**Agora**:
- Se Sale é OPEN → auto-redireciona pra `/caixa?active=<id>` (POS)
- Se Sale é CONFIRMED → mostra detalhe da venda paga + emissão de NC (como antes)

---

## 🪟 Modal de limpeza (NOVO)

Quando entrar no `/caixa` e o backend retornar **mais de 1 Sale OPEN**, abre automaticamente um modal:

```
⚠️ 3 vendas em aberto

Você só pode ter 1 venda em aberto por vez.
Escolha qual manter ou cancele todas.

#A1B2 João Silva
2 item(s) • R$ 50,00            [Manter esta]

#C3D4 Maria Santos
1 item(s) • R$ 30,00            [Manter esta]

#E5F6 Pedro Costa
0 item(s) • R$ 0,00             [Manter esta]

──────────────────────────────────────
[ Cancelar TODAS ]
```

Ações:
- **Manter esta** → cancela todas as outras, mantém só essa
- **Cancelar TODAS** → cancela todas (chama `POST /sales/cancel-all-open`)

O modal só aparece **uma vez por sessão** (controlado por `cleanupShownRef`).

---

## 🧪 Roteiro de teste

### Fluxo 1: Booking → Checkout direto
1. Cria booking na agenda
2. Click no booking → vê BookingViewPanel
3. Click **CHECKOUT**
4. Backend cria Sale OPEN
5. **Resultado**: redireciona pra `/caixa?active=<saleId>` → vê POS ativo com:
   - Sidebar de categorias
   - Catálogo de serviços/produtos
   - **Carrinho à direita já com o serviço do booking adicionado**
   - Botão "Confirmar pagamento"

### Fluxo 2: Cleanup de vendas antigas
1. Entra direto em `/dashboard/caixa`
2. Se você tem várias OPEN de testes anteriores → **modal de limpeza aparece automaticamente**
3. Click "Cancelar TODAS" → todas viram CANCELED, modal fecha
4. Cria nova venda do zero pra continuar

### Fluxo 3: Nova venda quando já tem 1 ativa
1. Tem Sale OPEN do booking A no /caixa
2. Volta na agenda, click em outro booking B
3. Click CHECKOUT no B
4. Backend **automaticamente cancela** a Sale de A
5. Cria nova Sale de B
6. `/caixa?active=` mostra Sale de B com seu serviço

### Fluxo 4: Acesso direto via URL
1. Cola na URL `/dashboard/caixa/<saleId>` de uma Sale OPEN
2. **Auto-redireciona** pra `/dashboard/caixa?active=<saleId>` (sem flash da tela errada)

### Fluxo 5: Acesso ao histórico
1. Booking COMPLETED → click "VER VENDA →"
2. Redireciona pra `/dashboard/caixa/<saleId>` (Sale CONFIRMED)
3. Vê detalhe da venda paga, histórico de NC, etc

---

## 🐛 Pontos de atenção

### O `OpenSalesSwitcher.tsx` virou código morto
Não é mais importado nem usado. Você pode:
- Deletar manualmente: `rm src/app/dashboard/caixa/components/OpenSalesSwitcher.tsx`
- OU deixar lá (next.js não inclui arquivos não importados no bundle)

### Modal de limpeza aparece **só na primeira carga** da sessão
Se você recarregar a página, ele aparece de novo se ainda houver múltiplas OPEN. Se for um caso de erro real (impossível com backend novo), use o modal pra limpar.

### Botão "+ Nova venda" só aparece quando NÃO há venda ativa
Pra criar nova venda quando já tem uma, **cancela a atual** primeiro (botão X no carrinho).
Ou simplesmente vai em outro booking → CHECKOUT (backend cancela auto).

---

## ✅ Validação rápida pós-deploy

```bash
# Console do browser na /caixa
# 1. Verifica que API foi atualizada
fetch('/sales/cancel-all-open', { method: 'POST', credentials: 'include' })
  .then(r => r.json()).then(console.log)
# → { data: { canceledCount: 0, sales: [] } } (se não tinha nenhuma)

# 2. Cria 3 vendas — só a última deve ficar OPEN
await fetch('/sales', { method: 'POST', credentials: 'include', headers: {'Content-Type':'application/json'}, body: '{}' })
await fetch('/sales', { method: 'POST', credentials: 'include', headers: {'Content-Type':'application/json'}, body: '{}' })
await fetch('/sales', { method: 'POST', credentials: 'include', headers: {'Content-Type':'application/json'}, body: '{}' })
fetch('/sales?status=OPEN', { credentials: 'include' }).then(r => r.json()).then(d => console.log(d.length))
# → 1
```

---

## 🗺️ Próximas fases

| Fase | Escopo |
|---|---|
| **6.5** | Refator SideCheckoutPanel pra aceitar **produtos** (ALTO RISCO) |
| 6.6 | Relatórios visuais de comissões + dashboard atualizado |
| 7+ | Pacotes, Cartões Presente, Assinaturas |
