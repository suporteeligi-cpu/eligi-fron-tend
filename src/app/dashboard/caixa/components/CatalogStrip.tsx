'use client'
// src/app/dashboard/caixa/components/CatalogStrip.tsx
// @eligi:caixa-strip-v2
//
// Catalogo em FAIXA do caixa no celular (direcao C, nov/2026).
// Uma linha de abas (com busca e grade a direita) + uma faixa de cartoes que rola
// para o lado. Mais baixo que a versao anterior (sem a faixa colorida de 40px e
// sem a linha de busca fixa): a lista do carrinho fica com o resto da tela.
// O botao de grade chama onExpand() e o OpenTab troca pelo CatalogPanel completo.

import { useState, useMemo } from 'react'
import type { CSSProperties } from 'react'
import { Search, X, LayoutGrid } from 'lucide-react'
import { formatBRL } from '@/features/sales/utils/format'
import { CatalogProduct, CatalogService, CatalogPackage, CatalogMembership } from '@/features/sales/types'
import { C } from '../ui'

type Tab = 'product' | 'service' | 'package' | 'membership'
type AnyItem = CatalogProduct | CatalogService | CatalogPackage | CatalogMembership

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

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'product',    label: 'Produtos' },
  { id: 'service',    label: 'Serviços' },
  { id: 'package',    label: 'Planos'   },
  { id: 'membership', label: 'Assin.'   }, // nomes curtos: cabem em 320px
]

const PLACEHOLDER: Record<Tab, string> = {
  product: 'Buscar produto', service: 'Buscar serviço', package: 'Buscar plano', membership: 'Buscar assinatura',
}

export default function CatalogStrip({
  products, services, packages, memberships, loading, onExpand,
  onAddProduct, onAddService, onAddPackage, onAddMembership,
}: Props) {
  const [tab,    setTab]    = useState<Tab>('product')
  const [query,  setQuery]  = useState('')
  const [search, setSearch] = useState(false)

  const items = useMemo<AnyItem[]>(() => {
    const q = query.trim().toLowerCase()
    const match = (name: string, extra?: string | null) =>
      !q || name.toLowerCase().includes(q) || (extra ?? '').toLowerCase().includes(q)
    if (tab === 'product')    return products.filter(p => p.active !== false && match(p.name, p.sku))
    if (tab === 'service')    return services.filter(s => s.active !== false && match(s.name, s.category))
    if (tab === 'package')    return packages.filter(p => p.active !== false && match(p.name, p.description))
    return memberships.filter(m => m.active !== false && match(m.name, m.description))
  }, [tab, query, products, services, packages, memberships])

  function addOf(it: AnyItem) {
    if (tab === 'product')    return onAddProduct(it as CatalogProduct)
    if (tab === 'service')    return onAddService(it as CatalogService)
    if (tab === 'package')    return onAddPackage(it as CatalogPackage)
    return onAddMembership(it as CatalogMembership)
  }

  return (
    <div className="cx-strip" style={{ display: 'flex', flexDirection: 'column', gap: 8, fontFamily: C.body }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {search ? (
          <label style={{
            flex: 1, minWidth: 0, height: 40, display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px',
            border: `1px solid ${C.line2}`, borderRadius: 10, background: C.card,
          }}>
            <Search size={15} color={C.ink3} />
            <input
              id="cx-strip-search"
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={PLACEHOLDER[tab]}
              inputMode="search"
              aria-label={PLACEHOLDER[tab]}
              style={{
                flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent',
                fontSize: 16, color: C.ink, fontFamily: 'inherit',
              }}
            />
          </label>
        ) : (
          <div role="tablist" aria-label="Catálogo" style={{
            flex: 1, minWidth: 0, display: 'flex', gap: 0, padding: 3, borderRadius: 11,
            background: C.sunken, border: `1px solid ${C.line}`,
          }}>
            {TABS.map(t => {
              const on = tab === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setTab(t.id)}
                  style={{
                    flex: 1, minWidth: 0, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: on ? C.card : 'transparent', color: on ? C.ink : C.ink3,
                    boxShadow: on ? '0 1px 3px rgba(17,17,20,0.08)' : 'none',
                    fontSize: 12, fontWeight: 700, fontFamily: 'inherit', padding: 0, letterSpacing: '-0.01em',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >{t.label}</button>
              )
            })}
          </div>
        )}
        <button
          type="button"
          onClick={() => { if (search) setQuery(''); setSearch(s => !s) }}
          aria-label={search ? 'Fechar busca' : 'Buscar no catálogo'}
          style={iconBtn}
        >
          {search ? <X size={16} color={C.ink2} /> : <Search size={16} color={C.ink2} />}
        </button>
        <button type="button" onClick={onExpand} aria-label="Ver catálogo em grade" style={iconBtn}>
          <LayoutGrid size={16} color={C.ink2} />
        </button>
      </div>

      <div style={{
        display: 'flex', gap: 8, overflowX: 'auto', WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none', paddingBottom: 2, scrollSnapType: 'x proximity',
      }}>
        {loading ? (
          [0, 1, 2].map(i => (
            <div key={i} style={{ ...cardBox, background: C.sunken, border: `1px solid ${C.line}` }} />
          ))
        ) : items.length === 0 ? (
          <div style={{ padding: '22px 4px', color: C.ink3, fontSize: 13 }}>
            {query ? 'Nada encontrado' : 'Nada cadastrado nesta aba'}
          </div>
        ) : items.map(it => {
          const color = (it as { color?: string | null }).color ?? C.ink3
          const price = (it as { price: number | null }).price ?? 0
          const prod  = tab === 'product' ? (it as CatalogProduct) : null
          const out   = !!prod?.trackStock && (prod.stock ?? 0) <= 0
          const low   = !!prod?.trackStock && !out && (prod.stock ?? 0) <= 5
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => addOf(it)}
              disabled={out}
              aria-label={`Adicionar ${it.name}, ${formatBRL(price)}`}
              style={{
                ...cardBox, background: C.card, border: `1px solid ${C.line2}`,
                cursor: out ? 'not-allowed' : 'pointer', opacity: out ? 0.5 : 1,
              }}
            >
              <span style={{ width: 24, height: 4, borderRadius: 3, background: color, flexShrink: 0 }} />
              <span style={{
                fontSize: 13, fontWeight: 700, color: C.ink, lineHeight: 1.25,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>{it.name}</span>
              <span style={{ marginTop: 'auto', display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontFamily: C.display, fontSize: 15, fontWeight: 700, color: C.ink, fontVariantNumeric: 'tabular-nums' }}>
                  {formatBRL(price)}
                </span>
                {out && <span style={{ fontSize: 10.5, fontWeight: 700, color: C.bad.text }}>Esgotado</span>}
                {low && <span style={{ fontSize: 10.5, fontWeight: 700, color: C.warn.text }}>{prod?.stock} un.</span>}
              </span>
            </button>
          )
        })}
      </div>
      <style>{`.cx-strip button:focus-visible, .cx-strip input:focus-visible { outline: 2px solid ${C.ink}; outline-offset: 2px }`}</style>
    </div>
  )
}

const iconBtn: CSSProperties = {
  width: 38, height: 40, borderRadius: 10, border: `1px solid ${C.line2}`, background: C.card,
  flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  WebkitTapHighlightColor: 'transparent',
}

const cardBox: CSSProperties = {
  flex: '0 0 132px', minHeight: 84, borderRadius: 12, padding: '10px 10px 9px',
  display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'left', fontFamily: 'inherit',
  scrollSnapAlign: 'start', WebkitTapHighlightColor: 'transparent',
}
