# Polish Caixa/POS — 2 telas no mobile

## 🎯 O que muda

### Mobile (< 768px)
- Caixa agora tem **2 telas separadas**: Catálogo ⇄ Carrinho
- **Tela Catálogo**: cards grandes, fáceis de tocar + barra inferior fixa "N itens · R$ X · Ver carrinho →"
- **Tela Carrinho**: botão "← Voltar ao catálogo" + CartPanel completo (cliente, itens, total, confirmar)
- **Produtos vêm primeiro**, Serviços ao lado (nas tabs do catálogo)
- Áreas de toque maiores (tabs, busca, cards)

### Desktop/Tablet (≥ 768px)
- **Nada muda** — continua catálogo + carrinho lado a lado

## 📦 Aplicar

```bash
cd ~/Documentos/eligi/front-end
unzip -o ~/Downloads/caixa-mobile.zip -d ./
npm run lint && npm run build && npm run deploy
```

## 🗂 Arquivos alterados

```
src/app/dashboard/caixa/
├── page.tsx                       ← OpenTab com 2 telas no mobile
└── components/
    └── CatalogPanel.tsx           ← Produtos primeiro + tabs maiores
```

⚠️ **CartPanel.tsx NÃO foi alterado** — continua funcionando igual. As 2 telas são orquestradas só no page.tsx.

## 🧪 Teste

### Mobile (abre no celular ou DevTools modo mobile)
1. `/dashboard/caixa` → aba Vendas Abertas
2. Vê o **Catálogo** ocupando a tela inteira (não mais espremido)
3. Tabs: **Produtos** primeiro (selecionado), Serviços ao lado
4. Toca num produto → adiciona ao carrinho → barra inferior atualiza "1 item · R$ X"
5. Toca em **"Ver carrinho →"** → vai pra tela do carrinho
6. Tela carrinho: cliente, itens com [− N +], total, confirmar
7. Toca em **"← Voltar ao catálogo"** → volta pro catálogo
8. Confirma venda → volta automaticamente pro catálogo

### Desktop
1. Continua igual: catálogo à esquerda, carrinho à direita (380px)

## ✅ Resolve

- ❌ Catálogo espremido (maxHeight 400) → ✅ tela inteira
- ❌ Carrinho embaixo com scroll gigante → ✅ tela dedicada
- ❌ Botões pequenos → ✅ áreas de toque maiores
- ✅ Total sempre visível (barra inferior)
- ✅ Fluxo direto: produto → carrinho → confirma
- ✅ Premium fullscreen mantido
