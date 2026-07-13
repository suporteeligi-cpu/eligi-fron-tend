'use client'
// src/app/dashboard/caixa/components/CatalogStrip.tsx
//
// Modo TIRA do caixa mobile (Fatia 2). Abas (ícone) + busca + botão grid +
// scroll horizontal de mini-cards. Compacto e denso — coexiste com o carrinho
// numa tela só. O botão grid dispara onExpand() → OpenTab troca pelo CatalogPanel
// (grade completa). Não substitui o CatalogPanel; é o estado colapsado.

import { useState, useMemo } from 'react'
import { Search, X, Package, Tag, Layers, Ticket, LayoutGrid } from 'lucide-react'
import { colors, typography, transitions } from '@/shared/theme'
import { formatBRL } from '@/features/sales/utils/format'
import { CatalogProduct, CatalogService, CatalogPackage, CatalogMembership } from '@/features/sales/types'

type Tab = 'product' | 'service' | 'package' | 'membership'

interface Props {
  products:    CatalogProduct[]
  services:    CatalogService[]
  packages:    CatalogPackage[]
  memberships: CatalogMembership[]
  loading:     boolean
  onExpand:    () => void
  onAddProduct:    (p: CatalogProduct) => void
  onAddService:    (s: CatalogService) => void
  onAddPackage:    (pkg: CatalogPackage) => void
  onAddMembership: (m: CatalogMembership) => void
}

const TABS: Array<{ id: Tab; label: string; icon: typeof Package }> = [
  { id: 'product',    label: 'Produtos',    icon: Package },
  { id: 'service',    label: 'Serviços',    icon: Tag     },
  { id: 'package',    label: 'Planos',      icon: Layers  },
  { id: 'membership', label: 'Assin.',      icon: Ticket  },
]

export default function CatalogStrip({
  products, services, packages, memberships, loading, onExpand,
  onAddProduct, onAddService, onAddPackage, onAddMembership,
}: Props) {
  const [tab,   setTab]   = useState<Tab>('product')
  const [query, setQuery] = useState('')

  const items = useMemo(() => {
    const q = query.trim().toLowerCase()
    const match = (name: string, extra?: string | null) =>
      !q || name.toLowerCase().includes(q) || (extra ?? '').toLowerCase().includes(q)
    if (tab === 'product')    return products.filter(p => p.active !== false && match(p.name, p.sku))
    if (tab === 'service')    return services.filter(s => s.active !== false && match(s.name, s.category))
    if (tab === 'package')    return packages.filter(p => p.active !== false && match(p.name, p.description))
    return memberships.filter(m => m.active !== false && match(m.name, m.description))
  }, [tab, query, products, services, packages, memberships])

  function priceOf(it: CatalogProduct | CatalogService | CatalogPackage | CatalogMembership): number {
    const p = (it as { price: number | null }).price
    return p ?? 0
  }
  function colorOf(it: { color?: string | null }): string {
    return it.color ?? colors.red.DEFAULT
  }
  function addOf(it: CatalogProduct | CatalogService | CatalogPackage | CatalogMembership) {
    if (tab === 'product')    return onAddProduct(it as CatalogProduct)
    if (tab === 'service')    return onAddService(it as CatalogService)
    if (tab === 'package')    return onAddPackage(it as CatalogPackage)
    return onAddMembership(it as CatalogMembership)
  }

  const placeholder =
    tab === 'membership' ? 'Buscar assinatura...' :
    tab === 'package'    ? 'Buscar plano...'      :
    tab === 'service'    ? 'Buscar serviço...'    :
                           'Buscar produto...'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontFamily: typography.fontFamily, minHeight: 0 }}>
      {/* Abas */}
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        {TABS.map(t => {
          const Icon = t.icon
          const isActive = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                padding: '7px 2px',
                borderRadius: 9,
                border: 'none',
                background: isActive ? colors.red.subtle : 'transparent',
                color: isActive ? colors.red.DEFAULT : colors.gray.dimText,
                fontWeight: isActive ? 700 : 600,
                fontSize: 11,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: `all ${transitions.fast}`,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <Icon size={15} strokeWidth={2} />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Busca + botão grid */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div style={{
          flex: 1,
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '9px 11px',
          background: colors.background.page,
          border: `1px solid ${colors.gray.borderMd}`,
          borderRadius: 9,
          minWidth: 0,
        }}>
          <Search size={13} color={colors.gray.dimText} strokeWidth={2} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={placeholder}
            inputMode="search"
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontSize: 13, background: 'transparent',
              color: colors.gray[900], fontFamily: 'inherit', minWidth: 0,
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              aria-label="Limpar"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}
            >
              <X size={13} color={colors.gray.dimText} />
            </button>
          )}
        </div>
        <button
          onClick={onExpand}
          aria-label="Ver em grade"
          style={{
            flexShrink: 0,
            width: 36, height: 36,
            borderRadius: 9,
            border: `1px solid ${colors.gray.borderMd}`,
            background: colors.background.page,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <LayoutGrid size={16} color={colors.gray[700]} strokeWidth={2} />
        </button>
      </div>

      {/* Tira horizontal */}
      <div style={{
        display: 'flex', gap: 8,
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        paddingBottom: 2,
        flexShrink: 0,
        scrollbarWidth: 'none',
      }}>
        {loading ? (
          <div style={{ padding: '18px 0', color: colors.gray.dimText, fontSize: 12 }}>Carregando...</div>
        ) : items.length === 0 ? (
          <div style={{ padding: '18px 4px', color: colors.gray.dimText, fontSize: 12 }}>
            Nada encontrado
          </div>
        ) : items.map(it => {
          const dot = colorOf(it as { color?: string | null })
          const img = (it as { imageUrl?: string | null }).imageUrl
          return (
            <button
              key={it.id}
              onClick={() => addOf(it)}
              style={{
                flexShrink: 0,
                width: 92,
                display: 'flex', flexDirection: 'column',
                padding: 0,
                background: '#fff',
                border: `1px solid ${colors.gray.border}`,
                borderRadius: 10,
                cursor: 'pointer',
                textAlign: 'left', fontFamily: 'inherit',
                overflow: 'hidden',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <div style={{
                width: '100%', height: 40,
                background: img ? '#fff' : dot,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
              }}>
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt={it.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  tab === 'product'    ? <Package size={17} color="#fff" strokeWidth={1.8} /> :
                  tab === 'service'    ? <Tag     size={17} color="#fff" strokeWidth={1.8} /> :
                  tab === 'package'    ? <Layers  size={17} color="#fff" strokeWidth={1.8} /> :
                                         <Ticket  size={17} color="#fff" strokeWidth={1.8} />
                )}
              </div>
              <div style={{ padding: '7px 8px 8px' }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: colors.gray[900],
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  marginBottom: 2,
                }}>{it.name}</div>
                <div style={{
                  fontSize: 11, fontWeight: 700,
                  color: colors.red.DEFAULT, fontVariantNumeric: 'tabular-nums',
                }}>{formatBRL(priceOf(it))}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
