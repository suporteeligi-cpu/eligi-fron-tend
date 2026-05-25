# Frontend Fase 2.1 + 2.2 — Produtos

## ⚠️ Ação manual no `navigation.config.ts`

Você precisa adicionar o item "Produtos" no menu lateral. Abra:

```
src/app/components/navigation/navigation.config.ts
```

E adicione um item assim (com o ícone `Box` do lucide-react). Provavelmente o seu arquivo tem algo parecido com:

```typescript
import { ..., Box } from 'lucide-react'

export const NAV_ITEMS = [
  // ... outros itens
  {
    label: 'Produtos',
    href:  '/dashboard/produtos',
    icon:  Box,
    roles: ['BUSINESS_OWNER'],  // se você tiver controle de roles
  },
  // ...
]
```

Coloca **logo depois de "Serviços"** pra ficar agrupado conceitualmente.

Se o arquivo for diferente, me manda o conteúdo dele que eu te ajusto.

## Aplicar

```bash
cd ~/Documentos/eligi/front-end

# 1. Aplica os arquivos
unzip -o ~/Downloads/produtos-frontend.zip -d ./

# 2. Edita navigation.config.ts (manual — instrução acima)

# 3. Build local
npm run lint && npm run build

# 4. Deploy
npm run deploy
```

## O que muda

### Novidades
- ✅ Página `/dashboard/produtos` (CRUD completo)
- ✅ Upload de foto com compressão automática (resize 800px + JPEG 85%)
- ✅ Cálculo de margem em tempo real no modal
- ✅ Autocomplete de categoria (sugere categorias existentes)
- ✅ Aba **Comissões** da Equipe: cadeado de **"Produtos" some** + editor funcional
- ✅ Toast de feedback ao criar/editar/apagar

### Sobrescrito (arquivos antigos da Equipe)
- `src/features/professionals/types.ts` — adiciona commissionProduct* + ProductCommissionOverride
- `src/features/professionals/constants/commissionCategories.ts` — destrava 'products'
- `src/app/dashboard/equipe/components/ComissoesTab.tsx` — render condicional

### Novos arquivos da Equipe
- `src/app/dashboard/equipe/components/CommissionProductsEditor.tsx`

### Novos arquivos de Products
- `src/features/products/types.ts`
- `src/features/products/utils/format.ts`
- `src/features/products/utils/imageUpload.ts`
- `src/app/dashboard/produtos/page.tsx`
- `src/app/dashboard/produtos/components/` (8 componentes)

## Como testar

1. **Acessa `/dashboard/produtos`** → adiciona um produto:
   - Nome: "Pomada Modeladora"
   - Categoria: "Cosméticos"
   - Preço: 45,90
   - Custo: 22,00
   - SKU: POM-001
   - Tira uma foto ou usa cor
2. **Vê a margem calculada automaticamente** (52,1%)
3. **Lista mostra agrupado por categoria** (desktop) ou flat (mobile)
4. **Vai em `/dashboard/equipe` → Comissões**:
   - Categoria "Produtos" agora está destravada ✅
   - Clica nela → vê editor de comissão
   - Define 10% padrão + override 15% pra Pomada
   - Vê auto-save funcionando
