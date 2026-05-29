# 🚀 Caixa + Pacotes — Frontend Completo (Etapa C)

Tudo alinhado, sem necessidade de edição manual. Cole, descompacte, builde.

---

## 📋 ZERO EDIÇÃO MANUAL

Tudo o que era patch foi consolidado em arquivos completos:

| Arquivo | Status |
|---|---|
| `src/features/sales/types.ts` | ✅ Reescrito completo (com `CatalogPackage`, `PackageCardLite`, `SaleItemType` expandido) |
| `src/app/components/navigation/navigation.config.ts` | ✅ Reescrito (ícone Package em Pacotes, sem warnings) |
| `src/app/dashboard/caixa/page.tsx` | ✅ Reescrito (fetch /packages + handler addPackage) |
| `src/app/dashboard/caixa/components/CatalogPanel.tsx` | ✅ Reescrito (3 abas: Produtos, Serviços, Pacotes) |
| `src/app/dashboard/caixa/components/CartPanel.tsx` | ✅ Reescrito (botão "Usar pacote" + handler removePackage) |
| `src/app/dashboard/caixa/components/CartItemRow.tsx` | ✅ Reescrito (badge "pago via pacote") |
| `src/app/dashboard/caixa/components/UsePackageModal.tsx` | ✅ Novo (busca e aplica cartão) |

---

## 🚀 Aplicar (1 sequência única)

```bash
cd ~/Documentos/eligi/front-end
unzip -o ~/Downloads/caixa-packages-final.zip -d ./
npm run lint && npm run build && npm run deploy
```

**É isso.** Não tem edição manual. Não tem patch. Não tem nada pra ajustar à mão.

---

## ✅ Pré-requisitos (já estão prontos no teu sistema)

Tudo isso **já está deployado** pelo que conversamos:

- ✅ Backend: rotas `/packages` e `/package-cards` funcionando
- ✅ Backend: `applyPackage` endpoints funcionando (`POST/DELETE /sales/:id/items/:itemId/apply-package`)
- ✅ Backend: hook em `confirmSale` gera `PackageCard` automaticamente quando vende pacote
- ✅ Backend: schema com `SaleItem.packageId`, `appliedPackageCardId`, `appliedPackageUseId`
- ✅ Frontend: página `/dashboard/pacotes` com CRUD de templates e listagem de cards

---

## 🎯 O que o usuário vai ver após o deploy

### No catálogo do caixa
- **3ª aba "Pacotes"** com ícone Layers
- Cards com gradiente colorido + badge "PACOTE" no topo
- Tocar adiciona ao carrinho como SaleItem PACKAGE

### No carrinho
- Item PACKAGE: ícone Layers + badge "PACOTE" no nome
- Quando tem cliente vinculado E o cliente tem cards ativos:
  - **Botão "Usar pacote"** (vermelho com gradiente, ícone Layers)
- Tocar abre modal com cartões ativos do cliente
- Selecionar cartão → mostra itens elegíveis → "Aplicar"
- Item aplicado: visual verde + "PAGO VIA PACOTE #cardNumber" + botão X pra desfazer

### Sidebar
- Item "Pacotes" entre Serviços e Equipe com ícone Package (ícone correto)

---

## 🧪 Roteiro de teste depois do deploy

### Fluxo 1: Vender pacote
1. `/dashboard/pacotes` → aba "Gerenciar" → cria pacote "Combo Top" (R$ 300, 3 cortes a R$ 90 cada, 30 dias)
2. `/dashboard/caixa` → aba "Pacotes" → toca em "Combo Top" → vai pro carrinho com badge PACOTE
3. **Vincula cliente** (obrigatório pra vender pacote)
4. "Confirmar · R$ 300" → paga → confirma
5. `/dashboard/pacotes` → aba "Adquiridos" → cartão novo aparece pro cliente

### Fluxo 2: Usar pacote
1. `/dashboard/caixa` → seleciona o mesmo cliente do Fluxo 1
2. **Botão "Usar pacote" aparece** ✨
3. Adiciona "Corte" no carrinho (preço normal R$ 70)
4. Toca "Usar pacote" → modal abre com o cartão
5. Toca no cartão → vê "Corte" com botão "Aplicar"
6. Aplica → item fica verde, R$ 0
7. Confirma venda → vai em `/dashboard/pacotes` → saldo decrementou (2/3)

### Fluxo 3: Desfazer aplicação
1. Item com pacote aplicado (verde)
2. Toca no X no badge verde "PAGO VIA PACOTE"
3. Item volta ao preço normal · saldo do cartão restaurado

---

## ⚠️ Comportamentos importantes

### Validações que o backend faz (já implementadas)
- ❌ Confirmar venda com pacote sem cliente → erro
- ❌ Aplicar pacote em produto (só serviços aceitam)
- ❌ Aplicar pacote de outro cliente
- ❌ Saldo insuficiente
- ❌ Pacote com `lockProfessionalId` ≠ profissional do item
- ❌ Cartão cancelado/expirado

### Comportamentos especiais do UI
- ✏️ Item com pacote aplicado: qty fica travada (não pode mudar sem desfazer)
- 🚫 Botão "Usar pacote" só aparece se há cartões ativos (não polui interface)
- 🔄 Remover item com pacote aplicado: estorna automaticamente o crédito (backend)
- 🔄 Cancelar venda com pacote aplicado: estorna automaticamente todos os créditos (backend)

---

## 🐛 Se algo der errado

| Erro | O que significa |
|---|---|
| `Cannot find name 'CatalogPackage'` | types.ts não foi atualizado — verifica que o zip foi descompactado |
| `Property 'packageId' does not exist on type 'SaleItem'` | Mesma coisa, types.ts antigo |
| `404 /packages` | Backend não tem a rota — confirma que o backend de pacotes está deployado |
| `404 /package-cards/client/...` | Mesma coisa |
| `set-state-in-effect` no lint | Avisa que eu corrija (já corrigi todos os encontrados) |

Se aparecer qualquer outro erro, cola pra eu resolver.
