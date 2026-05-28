# Frontend Pacotes — Aplicação

## 🎯 O que entrega

- ⭐ Nova rota **`/dashboard/pacotes`** no sidebar (ícone Package)
- 📋 Aba **"Gerenciar pacotes"** — CRUD de templates (criar/editar/listar)
- 💳 Aba **"Adquiridos"** — lista de cartões com busca e status
- 🎴 Modal de criar/editar template (estilo Booksy: nome, descrição, preço, validade, taxa, profissional, serviços com qty + preço com desconto)
- 🔄 Modal de detalhe do cartão com **flip frente/verso**:
  - **Frente**: QR code escaneável + número + botão "copiar"
  - **Verso**: cartão estilo Booksy (saldo, validade, proprietário)
- 🧾 Cancelamento configurável (com/sem Nota de Crédito)
- 📱 Mobile responsivo (bottom-sheets, scroll otimizado, touch-friendly)

## 📦 Aplicar

```bash
cd ~/Documentos/eligi/front-end
unzip -o ~/Downloads/packages-frontend.zip -d ./
npm run lint && npm run build && npm run deploy
```

## 🗂 Arquivos

```
src/
├── app/
│   ├── components/navigation/
│   │   └── navigation.config.ts        ← SUBSTITUIU (adiciona "Pacotes" entre Serviços e Equipe)
│   └── dashboard/pacotes/
│       ├── page.tsx                    ← 2 abas: Gerenciar + Adquiridos
│       └── components/
│           ├── PackageEditorModal.tsx  ← Criar/editar template
│           ├── CardDetailModal.tsx     ← Detalhe cartão (flip QR/info)
│           └── Toast.tsx
└── features/packages/
    ├── types.ts
    └── utils/format.ts
```

## 🧪 Como testar

1. Abre `/dashboard/pacotes` — vê o item "Pacotes" no sidebar
2. **Aba Gerenciar**:
   - Toca "+ Novo pacote"
   - Preenche: nome "Pacote Premium", preço 300, validade 30 dias
   - Adiciona 2 serviços com quantidade e preço com desconto
   - Salva → aparece na lista
3. **Aba Adquiridos**: vazia até vender pacote no Caixa (próxima etapa)
4. Pode editar um template clicando nele

## ⚠️ Dependências

- Endpoints já existentes (deployados):
  - `GET/POST/PATCH/DELETE /packages`
  - `GET /package-cards`
  - `GET /package-cards/:id`
  - `POST /package-cards/:id/cancel`
- Endpoints que o modal já consome:
  - `GET /services` (listagem de serviços do business)
  - `GET /equipe` (listagem de profissionais)

⚠️ Se `/services` ou `/equipe` retornarem em estrutura diferente do esperado, o picker de serviço/profissional fica vazio — me avisa que ajusto.

## 🎨 QR Code

Usa `api.qrserver.com` (público, gratuito, sem chave). Se quiser self-host depois, troca a função `qrUrl()` em `CardDetailModal.tsx`.

## 🔮 Próximo passo

**Etapa C — Integração no Caixa**:
- Catálogo do Caixa ganha aba "Pacotes" junto com Produtos/Serviços
- Botão "Usar Pacote" no carrinho → modal busca cartão por número ou cliente → mostra saldos → consome crédito
- Itens viram R$ 0 (já pago via pacote)

Aplica esse frontend, testa criar um pacote, e me chama pra fazer a integração!
