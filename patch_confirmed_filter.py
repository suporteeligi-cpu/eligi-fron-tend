
path = 'src/app/dashboard/caixa/components/ConfirmedSalesList.tsx'
c = open(path).read()

# ── 1. Define a filterBar logo antes do "if (loading)" ──
# Âncora: o início do bloco de loading
anchor_loading = "  if (loading) {"
filter_bar_def = """  const CATEGORIES: Array<{ key: SaleItemType | null; label: string }> = [
    { key: null,      label: 'Todos'    },
    { key: 'SERVICE', label: 'Serviços' },
    { key: 'PRODUCT', label: 'Produtos' },
    { key: 'PACKAGE', label: 'Pacotes'  },
  ]

  const filterBar = (
    <div style={{
      display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap',
      fontFamily: typography.fontFamily,
    }}>
      {CATEGORIES.map(cat => {
        const active = category === cat.key
        return (
          <button
            key={cat.label}
            onClick={() => setCategory(cat.key)}
            style={{
              padding: '6px 14px', borderRadius: 18, cursor: 'pointer',
              fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
              border: active ? '1px solid transparent' : `1px solid ${colors.gray.borderMd}`,
              background: active ? colors.red.gradient : colors.background.surface,
              color: active ? '#fff' : colors.gray[700],
              boxShadow: active ? `0 3px 10px ${colors.red.glow}` : 'none',
              transition: `all ${transitions.fast}`,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {cat.label}
          </button>
        )
      })}
    </div>
  )

"""
c = c.replace(anchor_loading, filter_bar_def + anchor_loading, 1)

# ── 2. Loading: inclui filterBar acima do spinner ──
c = c.replace(
  """  if (loading) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center',
        padding: 60,
      }}>""",
  """  if (loading) {
    return (
      <div style={{ fontFamily: typography.fontFamily }}>
        {filterBar}
      <div style={{
        display: 'flex', justifyContent: 'center',
        padding: 60,
      }}>"""
)
# fecha a div extra do loading (após o </style> do spinner)
c = c.replace(
  """        <style>{`@keyframes pos-spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }""",
  """        <style>{`@keyframes pos-spin { to { transform: rotate(360deg) } }`}</style>
      </div>
      </div>
    )
  }"""
)

# ── 3. Vazio: inclui filterBar acima ──
c = c.replace(
  """  if (sales.length === 0) {
    return (
      <div style={{
        background: '#fff',
        borderRadius: 14,
        border: `1px solid ${colors.gray.border}`,
        padding: '48px 24px',
        textAlign: 'center',
        fontFamily: typography.fontFamily,
      }}>""",
  """  if (sales.length === 0) {
    return (
      <div style={{ fontFamily: typography.fontFamily }}>
        {filterBar}
      <div style={{
        background: '#fff',
        borderRadius: 14,
        border: `1px solid ${colors.gray.border}`,
        padding: '48px 24px',
        textAlign: 'center',
      }}>"""
)
# fecha a div extra do vazio
c = c.replace(
  """        <div style={{ fontSize: 12, color: colors.gray.dimText }}>
          Vendas que você fechar hoje aparecerão aqui.
        </div>
      </div>
    )
  }""",
  """        <div style={{ fontSize: 12, color: colors.gray.dimText }}>
          {category ? 'Nenhuma venda dessa categoria hoje.' : 'Vendas que você fechar hoje aparecerão aqui.'}
        </div>
      </div>
      </div>
    )
  }"""
)

# ── 4. Lista normal: inclui filterBar no topo ──
c = c.replace(
  """  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 8,
      fontFamily: typography.fontFamily,
    }}>
      {sales.map(sale => {""",
  """  return (
    <div style={{ fontFamily: typography.fontFamily }}>
      {filterBar}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
      {sales.map(sale => {"""
)

open(path,'w').write(c)
print('CATEGORIES:', 'CATEGORIES' in c)
print('filterBar:', c.count('{filterBar}'))  # esperado 3


# ── 5. Fecha a div extra do filterBar no fim da lista normal ──
# O final atual: "      })}\n    </div>\n  )\n}"
c = open(path).read()
c = c.replace(
  """      })}
    </div>
  )
}""",
  """      })}
      </div>
    </div>
  )
}"""
)
open(path,'w').write(c)
print('fechamento final:', c.endswith('      })}\n      </div>\n    </div>\n  )\n}\n') or '</div>\n    </div>' in c)
