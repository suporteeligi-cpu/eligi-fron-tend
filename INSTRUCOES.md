# Fix CartPanel + ClientPicker

## 🐛 Bugs corrigidos

### 1. Nome do cliente não aparece quando vem de booking
**Causa**: ClientPicker só mostrava o cliente quando tinha **id E name** preenchidos. Mas booking pode ter `clientName` sem `clientId` (cliente avulso anotado direto na agenda).
**Fix**: agora mostra se tem `name` (com ou sem id). Quando não tem id, exibe badge "AVULSO" pra indicar.

### 2. Total em preto no card escuro
**Causa**: spans do total/subtotal não tinham `color` explícito, herdavam do pai (`#fff`). Algum estilo global estava sobrescrevendo.
**Fix**: forçado `color` explícito em todos os textos do card escuro (`#fff` para destaques, `rgba(255,255,255,0.55)` para textos secundários).

---

## Aplicar

```bash
cd ~/Documentos/eligi/front-end

unzip -o ~/Downloads/cartpanel-fix.zip -d ./

npm run lint && npm run build
npm run deploy
```

---

## 🧪 Teste

1. Cria booking com cliente (sem precisar estar cadastrado na base)
2. Click no booking → CHECKOUT → vai pro `/caixa?active=...`
3. **Resultado esperado**:
   - Campo "Cliente" no topo do carrinho mostra o nome do cliente com badge "AVULSO" se não tem id
   - Card escuro do total: texto **branco** legível, valor R$ XX,XX bem contrastado
