# Patch — features/sales/types.ts

Tua `src/features/sales/types.ts` provavelmente tem `SaleItem`, `Sale`, `CatalogService`, `CatalogProduct`, `ProfLite`, `SaleItemType`.

**Adicione/atualize 3 coisas:**

## 1. SaleItemType — adicionar 'PACKAGE'

```typescript
export type SaleItemType = 'SERVICE' | 'PRODUCT' | 'PACKAGE'
```

## 2. SaleItem — adicionar campos appliedPackage*

Localize seu tipo `SaleItem` e adicione estes campos:

```typescript
export interface SaleItem {
  // ... campos existentes (id, type, serviceId, productId, name, etc)
  packageId?:            string | null   // ⭐ ref ao template do pacote (item de venda PACKAGE)
  appliedPackageCardId?: string | null   // ⭐ se item tá sendo pago via cartão
  appliedPackageUseId?:  string | null   // ⭐ id do PackageUse criado quando aplicou
  appliedPackageCard?:   {               // snapshot incluído pela API
    id:          string
    cardNumber:  string
    packageName: string
    status:      'ACTIVE' | 'DEPLETED' | 'EXPIRED' | 'CANCELED'
  } | null
  package?:              {               // snapshot do template (item PACKAGE)
    id:    string
    name:  string
    color: string | null
  } | null
}
```

## 3. CatalogPackage — NOVO

```typescript
export interface CatalogPackage {
  id:              string
  name:            string
  description:     string | null
  price:           number
  color:           string | null
  imageUrl:        string | null
  active:          boolean
  validityType:    'NEVER' | 'DAYS' | 'MONTHS' | 'END_OF_MONTH' | 'END_OF_YEAR'
  validityValue:   number | null
  earnsCommission: boolean
  lockProfessionalId: string | null
  items: Array<{
    serviceId: string
    quantity:  number
    unitPrice: number
    service?:  { id: string; name: string; duration: number; price: number | null; color: string | null }
  }>
}
```

## 4. PackageCardLite — NOVO (pra mostrar cartões do cliente no modal "Usar pacote")

```typescript
export interface PackageCardLite {
  id:          string
  cardNumber:  string
  packageName: string
  validUntil:  string | null
  status:      'ACTIVE' | 'DEPLETED' | 'EXPIRED' | 'CANCELED'
  package?:    { id: string; name: string; color: string | null; lockProfessionalId?: string | null }
  balances:    Array<{
    id:          string
    serviceId:   string
    serviceName: string
    initialQty:  number
    usedQty:     number
    unitPrice:   number
    service?:    { id: string; name: string; color: string | null }
  }>
}
```
