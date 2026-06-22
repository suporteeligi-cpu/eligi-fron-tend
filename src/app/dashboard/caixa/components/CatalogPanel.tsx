'use client'
// src/app/dashboard/caixa/components/CatalogPanel.tsx

import { useState, useMemo } from 'react'
import {
  Search, X, Package, ShoppingBag, Scissors, AlertTriangle, Layers, Ticket, Infinity as InfinityIcon,
} from 'lucide-react'
import { colors, typography, transitions } from '@/shared/theme'
import { formatBRL } from '@/features/sales/utils/format'
import { CatalogProduct, CatalogService, CatalogPackage, CatalogMembership } from '@/features/sales/types'

type Tab = 'product' | 'service' | 'package' | 'membership'

interface Props {
  products: CatalogProduct[]
  services: CatalogService[]
  packages: CatalogPackage[]
  memberships: CatalogMembership[]
  loading:  boolean
  isMobile: boolean
  onAddProduct: (product: CatalogProduct) => void
  onAddService: (service: CatalogService) => void
  onAddPackage: (pkg: CatalogPackage) => void
  onAddMembership: (mem: CatalogMembership) => void
}

export default function CatalogPanel({
  products, services, packages, memberships, loading, isMobile,
  onAddProduct, onAddService, onAddPackage, onAddMembership,
}: Props) {
  const [tab,   setTab]   = useState<Tab>('product')
  const [query, setQuery] = useState('')
  const activeProducts = useMemo(() => products.filter(p => p.active !== false), [products])
  const activeServices = useMemo(() => services.filter(s => s.active !== false), [services])
  const activePackages = useMemo(() => packages.filter(p => p.active !== false), [packages])
  const activeMemberships = useMemo(() => memberships.filter(m => m.active !== false), [memberships])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (tab === 'membership') {
      if (!q) return activeMemberships
      return activeMemberships.filter(m =>
        m.name.toLowerCase().includes(q) ||
        (m.description ?? '').toLowerCase().includes(q),
      )
    }
    if (tab === 'package') {
      if (!q) return activePackages
      return activePackages.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q),
      )
    }
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
  }, [tab, query, activeProducts, activeServices, activePackages, activeMemberships])

  const tabs: Array<{ id: Tab; label: string; count: number; icon: typeof Package }> = [
    { id: 'product',    label: 'Produtos',    count: activeProducts.length,    icon: ShoppingBag  },
    { id: 'service',    label: 'Serviços',    count: activeServices.length,    icon: ShoppingBag  },
    { id: 'package',    label: 'Pacotes',     count: activePackages.length,    icon: Layers   },
    { id: 'membership', label: 'Assinaturas', count: activeMemberships.length, icon: Ticket   },
  ]

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      gap: 12,
      fontFamily: typography.fontFamily,
      height: '100%',
      minHeight: 0,
    }}>
      {/* Toggle Produtos/Serviços/Pacotes */}
      <div style={{
        display: 'flex',
        gap: 4,
        padding: 4,
        background: colors.background.page,
        borderRadius: 12,
        border: `1px solid ${colors.gray.border}`,
        flexShrink: 0,
      }}>
        {tabs.map(t => {
          const Icon = t.icon
          const isActive = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: isMobile ? '12px 8px' : '8px 10px',
                borderRadius: 9,
                border: 'none',
                background: isActive ? '#fff' : 'transparent',
                color: isActive ? colors.gray[900] : colors.gray.dimText,
                fontWeight: isActive ? 700 : 600,
                fontSize: isMobile ? 12 : 12,
                cursor: 'pointer',
                transition: `all ${transitions.fast}`,
                boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                fontFamily: 'inherit',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <Icon size={isMobile ? 14 : 13} strokeWidth={2} />
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
        padding: isMobile ? '11px 12px' : '9px 12px',
        background: '#fff',
        border: `1px solid ${colors.gray.borderMd}`,
        borderRadius: 10,
        flexShrink: 0,
      }}>
        <Search size={14} color={colors.gray.dimText} strokeWidth={2} />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={
            tab === 'membership' ? 'Buscar assinatura...' :
            tab === 'package'    ? 'Buscar pacote...'     :
            tab === 'service'    ? 'Buscar serviço...'    :
                                   'Buscar produto, SKU...'
          }
          inputMode="search"
          style={{
            flex: 1, border: 'none', outline: 'none',
            fontSize: isMobile ? 14 : 13, background: 'transparent',
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
            <X size={13} color={colors.gray.dimText} />
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
            {tab === 'membership'
              ? <Ticket   size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
              : tab === 'package'
              ? <Layers   size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
              : tab === 'service'
              ? <Scissors size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
              : <Package  size={32} style={{ opacity: 0.3, marginBottom: 8 }} />}
            <div>
              {(() => {
                const fem  = tab === 'membership'
                const noun = tab === 'membership' ? 'assinatura' : tab === 'package' ? 'pacote' : tab === 'service' ? 'serviço' : 'produto'
                const art  = fem ? 'Nenhuma' : 'Nenhum'
                const verb = fem ? (query ? 'encontrada' : 'cadastrada') : (query ? 'encontrado' : 'cadastrado')
                return `${art} ${noun} ${verb}`
              })()}
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: isMobile ? 10 : 8,
          }}>
            {tab === 'product' && filtered.map(item => (
              <ProductCard
                key={item.id}
                product={item as CatalogProduct}
                isMobile={isMobile}
                onClick={() => onAddProduct(item as CatalogProduct)}
              />
            ))}
            {tab === 'service' && filtered.map(item => (
              <ServiceCard
                key={item.id}
                service={item as CatalogService}
                isMobile={isMobile}
                onClick={() => onAddService(item as CatalogService)}
              />
            ))}
            {tab === 'package' && filtered.map(item => (
              <PackageCardCatalog
                key={item.id}
                pkg={item as CatalogPackage}
                isMobile={isMobile}
                onClick={() => onAddPackage(item as CatalogPackage)}
              />
            ))}
            {tab === 'membership' && filtered.map(item => (
              <MembershipCardCatalog
                key={item.id}
                mem={item as CatalogMembership}
                isMobile={isMobile}
                onClick={() => onAddMembership(item as CatalogMembership)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ProductCard({ product, isMobile, onClick }: { product: CatalogProduct; isMobile: boolean; onClick: () => void }) {
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
        display: 'flex', flexDirection: 'column', gap: 6, padding: 0,
        background: '#fff',
        border: `1px solid ${colors.gray.border}`,
        borderRadius: 11,
        cursor: disabled ? 'not-allowed' : 'pointer',
        textAlign: 'left', fontFamily: 'inherit',
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
      <div style={{
        width: '100%', aspectRatio: '1.2',
        background: hasImage ? '#fff' : dot,
        position: 'relative', overflow: 'hidden',
      }}>
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl!} alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Package size={26} color="#fff" strokeWidth={1.6} />
          </div>
        )}
        {tracking && (
          <div style={{
            position: 'absolute', top: 6, right: 6,
            padding: '2px 6px', borderRadius: 5,
            background: outOfStock ? 'rgba(220,38,38,0.95)'
                      : lowStock   ? 'rgba(245,158,11,0.95)'
                                   : 'rgba(22,163,74,0.9)',
            color: '#fff', fontSize: 9, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 3,
            backdropFilter: 'blur(4px)',
          }}>
            {(outOfStock || lowStock) && <AlertTriangle size={8} strokeWidth={3} />}
            {outOfStock ? 'Esgotado' : `${stock} un.`}
          </div>
        )}
      </div>
      <div style={{ padding: isMobile ? '9px 10px 11px' : '8px 10px 10px', flex: 1 }}>
        <div style={{
          fontSize: isMobile ? 12 : 11, fontWeight: 700,
          color: colors.gray[900],
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          marginBottom: 2,
        }}>{product.name}</div>
        {product.sku && (
          <div style={{
            fontSize: 9, color: colors.gray.dimText,
            fontVariantNumeric: 'tabular-nums', marginBottom: 3,
          }}>{product.sku}</div>
        )}
        <div style={{
          fontSize: isMobile ? 14 : 13, fontWeight: 700,
          color: colors.red.DEFAULT, fontVariantNumeric: 'tabular-nums',
        }}>{formatBRL(product.price)}</div>
      </div>
    </button>
  )
}

function ServiceCard({ service, isMobile, onClick }: { service: CatalogService; isMobile: boolean; onClick: () => void }) {
  const dot = service.color ?? colors.red.DEFAULT
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', gap: 6,
        padding: 0,
        background: '#fff',
        border: `1px solid ${colors.gray.border}`,
        borderRadius: 11,
        cursor: 'pointer',
        textAlign: 'left', fontFamily: 'inherit',
        transition: `all 0.15s ease`,
        WebkitTapHighlightColor: 'transparent',
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
      <div style={{
        width: '100%',
        padding: '14px 12px 12px',
        background: dot,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        <Scissors size={26} color="#fff" strokeWidth={1.8} />
        <div style={{
          position: 'absolute', top: 6, right: 6,
          padding: '2px 6px',
          borderRadius: 5,
          background: 'rgba(255,255,255,0.25)',
          color: '#fff',
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '.04em',
        }}>
          SERVIÇO
        </div>
      </div>
      <div style={{ padding: isMobile ? '9px 10px 11px' : '8px 10px 10px', flex: 1 }}>
        <div style={{
          fontSize: isMobile ? 12 : 11, fontWeight: 700,
          color: colors.gray[900],
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          marginBottom: 3,
        }}>
          {service.name}
        </div>
        <div style={{
          fontSize: 9,
          color: colors.gray.dimText,
          marginBottom: 4,
        }}>
          {service.duration}min
        </div>
        <div style={{
          fontSize: isMobile ? 14 : 13, fontWeight: 700,
          color: dot, fontVariantNumeric: 'tabular-nums',
        }}>
          {formatBRL(service.price ?? 0)}
        </div>
      </div>
    </button>
  )
}

function PackageCardCatalog({ pkg, isMobile, onClick }: { pkg: CatalogPackage; isMobile: boolean; onClick: () => void }) {
  const dot = pkg.color ?? colors.red.DEFAULT
  const totalQty = pkg.items.reduce((s, it) => s + it.quantity, 0)
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', gap: 6,
        padding: 0,
        background: `linear-gradient(135deg, ${dot}15, ${dot}05)`,
        border: `1px solid ${dot}40`,
        borderRadius: 11,
        cursor: 'pointer',
        textAlign: 'left', fontFamily: 'inherit',
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
        e.currentTarget.style.borderColor = `${dot}40`
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Header ícone */}
      <div style={{
        width: '100%',
        padding: '14px 12px 12px',
        background: dot,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        <Layers size={26} color="#fff" strokeWidth={1.8} />
        <div style={{
          position: 'absolute', top: 6, right: 6,
          padding: '2px 6px',
          borderRadius: 5,
          background: 'rgba(255,255,255,0.25)',
          color: '#fff',
          fontSize: 9,
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '.04em',
        }}>
          PACOTE
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: isMobile ? '9px 10px 11px' : '8px 10px 10px', flex: 1 }}>
        <div style={{
          fontSize: isMobile ? 12 : 11, fontWeight: 700,
          color: colors.gray[900],
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          marginBottom: 3,
        }}>
          {pkg.name}
        </div>
        <div style={{
          fontSize: 9,
          color: colors.gray.dimText,
          marginBottom: 4,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {totalQty} crédito{totalQty !== 1 && 's'} · {pkg.items.length} serviço{pkg.items.length !== 1 && 's'}
        </div>
        <div style={{
          fontSize: isMobile ? 14 : 13, fontWeight: 700,
          color: dot, fontVariantNumeric: 'tabular-nums',
        }}>
          {formatBRL(pkg.price)}
        </div>
      </div>
    </button>
  )
}

function MembershipCardCatalog({ mem, isMobile, onClick }: { mem: CatalogMembership; isMobile: boolean; onClick: () => void }) {
  const dot = mem.color ?? colors.red.DEFAULT
  const coverage = mem.allServices
    ? 'Todos os serviços'
    : `${mem.services.length} serviço${mem.services.length !== 1 ? 's' : ''}`
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', gap: 6,
        padding: 0,
        background: `linear-gradient(135deg, ${dot}15, ${dot}05)`,
        border: `1px solid ${dot}40`,
        borderRadius: 11,
        cursor: 'pointer',
        textAlign: 'left', fontFamily: 'inherit',
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
        e.currentTarget.style.borderColor = `${dot}40`
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Header ícone */}
      <div style={{
        width: '100%',
        padding: '14px 12px 12px',
        background: dot,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        <Ticket size={26} color="#fff" strokeWidth={1.8} />
        <div style={{
          position: 'absolute', top: 6, right: 6,
          padding: '2px 6px',
          borderRadius: 5,
          background: 'rgba(255,255,255,0.25)',
          color: '#fff',
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '.04em',
        }}>
          ASSINATURA
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: isMobile ? '9px 10px 11px' : '8px 10px 10px', flex: 1 }}>
        <div style={{
          fontSize: isMobile ? 12 : 11, fontWeight: 700,
          color: colors.gray[900],
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          marginBottom: 3,
        }}>
          {mem.name}
        </div>
        <div style={{
          fontSize: 9,
          color: colors.gray.dimText,
          marginBottom: 4,
          display: 'flex', alignItems: 'center', gap: 3,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          <InfinityIcon size={10} strokeWidth={2.4} />
          {coverage}
        </div>
        <div style={{
          fontSize: isMobile ? 14 : 13, fontWeight: 700,
          color: dot, fontVariantNumeric: 'tabular-nums',
        }}>
          {formatBRL(mem.price)}
        </div>
      </div>
    </button>
  )
}
