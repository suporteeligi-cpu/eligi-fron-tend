# Fase 6.6.1 — Sistema universal de Timezone

Resolve o bug de receita zerando após 21h SP de uma forma **escalável** pra atender o Brasil inteiro (4 fusos) e até clientes internacionais no futuro.

## 🎯 O que muda

### Backend
- ✅ Novo campo `timezone` no `BusinessProfile` (default `America/Sao_Paulo`)
- ✅ Helper compartilhado `getBusinessTimezone(businessId)` com **cache em memória** de 5 min
- ✅ Módulo `business-settings` com endpoints `GET /` e `PATCH /timezone`
- ✅ `dashboard.service.ts` agora **lê o timezone do business** ao invés de chumbar SP
- ✅ Migration adicionando o campo

### Frontend
- ✅ Card "Detalhes da empresa" em `/configuracoes` agora ATIVO
- ✅ Nova página `/dashboard/configuracoes/empresa`
- ✅ Card "Fuso horário" com:
  - **Auto-detect** do navegador (mostra banner amarelo "detectamos que você está em X" se diferente do atual)
  - **Live clock** que mostra a hora atual no fuso selecionado (atualiza a cada 30s)
  - **Dropdown** com fusos do Brasil + internacionais
  - Botão "Salvar" só ativa se mudou

---

## ⚠️ Pré-requisitos

1. **Patch manual no schema.prisma**: adicionar `timezone String @default("America/Sao_Paulo")` no `model BusinessProfile` (veja `SCHEMA_PATCH.md`)
2. **Registrar rotas no `server.ts`**:
   ```typescript
   import businessSettingsRoutes from './modules/business-settings/business-settings.routes'
   app.use('/business-settings', businessSettingsRoutes)
   ```

---

## 📦 Aplicar

### Backend

```bash
cd ~/Documentos/eligi/back-end

# 1. Aplica zip
unzip -o ~/Downloads/timezone-backend.zip -d ./

# 2. Edita schema.prisma adicionando o campo timezone (veja SCHEMA_PATCH.md)
# 3. Edita server.ts adicionando o import e app.use

# 4. Gera Prisma Client
npx prisma generate

# 5. Build + deploy (migration roda automaticamente no Railway)
npm run lint && npm run build && npm run deploy
```

### Frontend

```bash
cd ~/Documentos/eligi/front-end
unzip -o ~/Downloads/timezone-frontend.zip -d ./
npm run lint && npm run build && npm run deploy
```

---

## 🗂 Arquivos

### Backend
```
prisma/migrations/20260528_business_timezone/migration.sql

src/shared/utils/businessTime.ts           ← helper compartilhado (cache 5min)

src/modules/business-settings/
├── business-settings.service.ts
├── business-settings.controller.ts
└── business-settings.routes.ts

src/modules/dashboard/dashboard.service.ts ← REFATORADO usando helper

SCHEMA_PATCH.md                            ← instruções de schema
```

### Frontend
```
src/shared/lib/timezones.ts                ← lista + auto-detect helpers

src/app/dashboard/configuracoes/
├── page.tsx                               ← card "Empresa" agora ativo
└── empresa/
    ├── page.tsx
    └── components/
        └── TimezoneCard.tsx
```

---

## 🧪 Teste

1. Vai pra `/dashboard/configuracoes`
2. Card "Detalhes da empresa" agora está clicável
3. Click → vai pra `/dashboard/configuracoes/empresa`
4. Vê o card "Fuso horário" com:
   - Hora atual no fuso selecionado (live)
   - Banner amarelo se teu browser tem fuso diferente
   - Dropdown com fusos
5. Muda pra outro fuso → click "Salvar" → vê "✓ Salvo"
6. Volta no `/dashboard` → KPIs agora calculam baseado no NOVO fuso
7. **Testa o bug original**: após 21h SP, confirma uma venda → receita aparece (porque dashboard agora lê o timezone correto)

---

## 🔮 Próximos passos (futuro)

Quando precisar refatorar outros módulos pra usar o helper (agenda, sales, payouts), basta:

```typescript
import { getBusinessTimezone } from '@/shared/utils/businessTime'

// Onde tem dayjs chumbado:
const tz = await getBusinessTimezone(businessId)
const now = dayjs().tz(tz)
```

O cache de 5min garante que isso não impacta performance.

---

## ✅ Princípios da implementação

- **Cache de 5 min**: a query do timezone só roda no máximo a cada 5 min por business
- **Cache invalidation**: ao salvar novo timezone, cache do business é limpo
- **Fallback automático**: se algo falhar, usa `America/Sao_Paulo` (não quebra nada)
- **Validação via Intl**: aceita qualquer timezone IANA válido (`Intl.DateTimeFormat`)
- **Tipos compartilhados frontend/backend**: lista `COMMON_TIMEZONES` igual nos dois lados
