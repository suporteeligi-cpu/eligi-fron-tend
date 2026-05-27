'use client'
// src/app/dashboard/caixa/components/CatalogPanel.tsx

import { useState, useMemo } from 'react'
import { Search, X, Package, Scissors, Clock, AlertTriangle } from 'lucide-react'
import { colors, typography, transitions } from '@/shared/theme'
import { formatBRL } from '@/features/sales/utils/format'
import { CatalogService, CatalogProduct } from '@/features/sales/types'

type Tab = 'service' | 'product'

interface Props {
  services: CatalogService[]
  products: CatalogProduct[]
  loading:  boolean
  isMobile: boolean
  onAddService: (service: CatalogService) => void
  onAddProduct: (product: CatalogProduct) => void
}

export default function CatalogPanel({
  services, products, loading, isMobile, onAddService, onAddProduct,
}: Props) {
  const [tab,   setTab]   = useState<Tab>('service')
  const [query, setQuery] = useState('')

  // Filtra ativos + busca
  const activeServices = useMemo(() => services.filter(s => s.active !== false), [services])
  const activeProducts = useMemo(() => products.filter(p => p.active !== false), [products])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (tab === 'service') {
      if (!q) return activeServices
      return activeServices.filter(s =>
        s.name.toLowerCase().includes(q) ||
        (s.category ?? '').toLowerCase().includes(q),
      )
    }
    if (!q) return activeProducts
    return activeProducts.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.category ?? '').toLowerCase().includes(q) ||
      (p.sku ?? '').toLowerCase().includes(q),
    )
  }, [tab, query, activeServices, activeProducts])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      gap: 12,
      fontFamily: typography.fontFamily,
      height: '100%',
      minHeight: 0,
    }}>
      {/* Toggle servico/produto */}
      <div style={{
        display: 'flex',
        gap: 4,
        padding: 4,
        background: colors.background.page,
        borderRadius: 11,
        border: `1px solid ${colors.gray.border}`,
        flexShrink: 0,
      }}>
        {([
          { id: 'service' as Tab, label: 'Serviços', count: activeServices.length, icon: Scissors },
          { id: 'product' as Tab, label: 'Produtos', count: activeProducts.length, icon: Package },
        ]).map(t => {
          const Icon = t.icon
          const isActive = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '8px 12px',
                borderRadius: 8,
                border: 'none',
                background: isActive ? '#fff' : 'transparent',
                color: isActive ? colors.gray[900] : colors.gray.dimText,
                fontWeight: isActive ? 700 : 600,
                fontSize: 12,
                cursor: 'pointer',
                transition: `all ${transitions.fast}`,
                boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                fontFamily: 'inherit',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <Icon size={13} strokeWidth={2} />
              {t.label}
              <span style={{
                fontSize: 10, fontWeight: 700,
                padding: '1px 5px',
                borderRadius: 4,
                background: isActive ? colors.red.subtle : colors.gray.hover,
                color: isActive ? colors.red.DEFAULT : colors.gray.dimText,
                fontVariantNumeric: 'tabular-nums',
              }}>{t.count}</span>
            </button>
          )
        })}
      </div>

      {/* Busca */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '9px 12px',
        background: '#fff',
        border: `1px solid ${colors.gray.borderMd}`,
        borderRadius: 10,
        flexShrink: 0,
      }}>
        <Search size={13} color={colors.gray.dimText} strokeWidth={2} />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={tab === 'service' ? 'Buscar serviço...' : 'Buscar produto, SKU...'}
          inputMode="search"
          style={{
            flex: 1, border: 'none', outline: 'none',
            fontSize: 13, background: 'transparent',
            color: colors.gray[900],
            fontFamily: 'inherit',
            minWidth: 0,
          }}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            aria-label="Limpar"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 4, display: 'flex',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <X size={12} color={colors.gray.dimText} />
          </button>
        )}
      </div>

      {/* Grid */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        minHeight: 0,
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: colors.gray.dimText, fontSize: 12 }}>
            Carregando...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '40px 20px',
            color: colors.gray.dimText, fontSize: 12,
          }}>
            {tab === 'service' ? <Scissors size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                               : <Package size={32} style={{ opacity: 0.3, marginBottom: 8 }} />}
            <div>
              {query ? `Nenhum ${tab === 'service' ? 'serviço' : 'produto'} encontrado` :
                       `Nenhum ${tab === 'service' ? 'serviço' : 'produto'} cadastrado`}
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 8,
          }}>
            {tab === 'service' && filtered.map(item => (
              <ServiceCard
                key={item.id}
                service={item as CatalogService}
                onClick={() => onAddService(item as CatalogService)}
              />
            ))}
            {tab === 'product' && filtered.map(item => (
              <ProductCard
                key={item.id}
                product={item as CatalogProduct}
                onClick={() => onAddProduct(item as CatalogProduct)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ServiceCard({ service, onClick }: { service: CatalogService; onClick: () => void }) {
  const dot = service.color ?? colors.red.DEFAULT
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: '10px',
        background: '#fff',
        border: `1px solid ${colors.gray.border}`,
        borderRadius: 11,
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'inherit',
        transition: `all 0.15s ease`,
        WebkitTapHighlightColor: 'transparent',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = dot
        e.currentTarget.style.transform = 'translateY(-1px)'
        e.currentTarget.style.boxShadow = `0 4px 14px ${dot}30`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = colors.gray.border
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Barra de cor lateral */}
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0,
        width: 3, background: dot,
      }} />

      <div style={{
        fontSize: 12, fontWeight: 700,
        color: colors.gray[900],
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        paddingLeft: 6,
      }}>
        {service.name}
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 10, color: colors.gray.dimText,
        paddingLeft: 6,
      }}>
        <Clock size={9} />
        <span>{service.duration}min</span>
      </div>
      <div style={{
        fontSize: 13,
        fontWeight: 700,
        color: dot,
        fontVariantNumeric: 'tabular-nums',
        paddingLeft: 6,
        marginTop: 'auto',
      }}>
        {service.price != null ? formatBRL(service.price) : '—'}
      </div>
    </button>
  )
}

function ProductCard({ product, onClick }: { product: CatalogProduct; onClick: () => void }) {
  const hasImage = !!product.imageUrl
  const dot = product.color ?? colors.red.DEFAULT
  const tracking = product.trackStock ?? false
  const stock    = product.stock ?? 0
  const lowStock = tracking && stock <= 5 && stock > 0
  const outOfStock = tracking && stock <= 0
  const disabled = outOfStock

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: 0,
        background: '#fff',
        border: `1px solid ${colors.gray.border}`,
        borderRadius: 11,
        cursor: disabled ? 'not-allowed' : 'pointer',
        textAlign: 'left',
        fontFamily: 'inherit',
        transition: `all 0.15s ease`,
        WebkitTapHighlightColor: 'transparent',
        opacity: disabled ? 0.55 : 1,
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        if (disabled) return
        e.currentTarget.style.borderColor = dot
        e.currentTarget.style.transform = 'translateY(-1px)'
        e.currentTarget.style.boxShadow = `0 4px 14px ${dot}30`
      }}
      onMouseLeave={e => {
        if (disabled) return
        e.currentTarget.style.borderColor = colors.gray.border
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Foto ou cor */}
      <div style={{
        width: '100%',
        aspectRatio: '1.2',
        background: hasImage ? '#fff' : dot,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl!}
            alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Package size={26} color="#fff" strokeWidth={1.6} />
          </div>
        )}

        {/* Badge de stock */}
        {tracking && (
          <div style={{
            position: 'absolute', top: 6, right: 6,
            padding: '2px 6px',
            borderRadius: 5,
            background: outOfStock ? 'rgba(220,38,38,0.95)'
                      : lowStock   ? 'rgba(245,158,11,0.95)'
                                   : 'rgba(22,163,74,0.9)',
            color: '#fff',
            fontSize: 9,
            fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 3,
            backdropFilter: 'blur(4px)',
          }}>
            {(outOfStock || lowStock) && <AlertTriangle size={8} strokeWidth={3} />}
            {outOfStock ? 'Esgotado' : `${stock} un.`}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '8px 10px 10px', flex: 1 }}>
        <div style={{
          fontSize: 11, fontWeight: 700,
          color: colors.gray[900],
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          marginBottom: 2,
        }}>
          {product.name}
        </div>
        {product.sku && (
          <div style={{
            fontSize: 9,
            color: colors.gray.dimText,
            fontVariantNumeric: 'tabular-nums',
            marginBottom: 3,
          }}>
            {product.sku}
          </div>
        )}
        <div style={{
          fontSize: 13,
          fontWeight: 700,
          color: colors.red.DEFAULT,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {formatBRL(product.price)}
        </div>
      </div>
    </button>
  )
}
