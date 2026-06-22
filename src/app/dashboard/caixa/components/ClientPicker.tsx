'use client'
// src/app/dashboard/caixa/components/ClientPicker.tsx
//
// FIX: mostra cliente quando tem name (mesmo sem id linkado).
// Caso de uso: Sale criada via /sales/from-booking com cliente avulso
// (booking só tinha clientName, sem clientId).

import { useState, useEffect, useRef } from 'react'
import { User, X } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { colors, typography, transitions } from '@/shared/theme'
import { ClientLite } from '@/features/sales/types'

interface Props {
  value:    { id: string | null; name: string | null; phone: string | null }
  onChange: (client: { id: string | null; name: string | null; phone: string | null }) => void
  disabled?: boolean
}

export default function ClientPicker({ value, onChange, disabled }: Props) {
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState<ClientLite[]>([])
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Busca debounced
  useEffect(() => {
    if (!open || !query.trim()) {
      const tClear = setTimeout(() => setResults([]), 0)
      return () => clearTimeout(tClear)
    }
    const t = setTimeout(async () => {
      try {
        setLoading(true)
        const res = await api.get('/clients', { params: { search: query, limit: 10 } })
        const data = res.data?.data?.clients ?? res.data?.data ?? []
        setResults(Array.isArray(data) ? data : [])
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 280)
    return () => clearTimeout(t)
  }, [query, open])

  function selectClient(c: ClientLite) {
    onChange({ id: c.id, name: c.name, phone: c.phone })
    setQuery('')
    setOpen(false)
  }

  function clear() {
    onChange({ id: null, name: null, phone: null })
    setQuery('')
  }

  // FIX: mostra cliente se tem name (com OU sem id)
  // Caso sem id = cliente avulso anotado (vindo de booking, p.ex.)
  const hasClient = !!value.name

  return (
    <div ref={wrapRef} style={{ position: 'relative', fontFamily: typography.fontFamily }}>
      {hasClient && value.name ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 12px',
          background: colors.red.subtle,
          border: `1px solid ${colors.red.border}`,
          borderRadius: 11,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: colors.red.gradient,
            color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700,
            flexShrink: 0,
          }}>
            {value.name.split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase() || '?'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 700, color: colors.gray[900],
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {value.name}
            </div>
            {value.phone && (
              <div style={{ fontSize: 11, color: colors.gray.dimText }}>
                {value.phone}
              </div>
            )}
          </div>
          {!disabled && (
            <button
              onClick={clear}
              aria-label="Remover cliente"
              style={{
                width: 24, height: 24, borderRadius: '50%',
                border: `1px solid ${colors.gray.borderMd}`,
                background: '#fff',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <X size={11} color={colors.gray.dimText} />
            </button>
          )}
        </div>
      ) : (
        <>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 12px',
            background: colors.background.page,
            border: `1px solid ${colors.gray.borderMd}`,
            borderRadius: 11,
            cursor: disabled ? 'not-allowed' : 'text',
            opacity: disabled ? 0.5 : 1,
          }}>
            <User size={14} color={colors.gray.dimText} />
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); setOpen(true) }}
              onFocus={() => setOpen(true)}
              placeholder="Cliente — buscar por nome"
              disabled={disabled}
              style={{
                flex: 1, border: 'none', outline: 'none',
                fontSize: 13, background: 'transparent',
                color: colors.gray[900],
                fontFamily: 'inherit',
                minWidth: 0,
              }}
            />
            {loading && (
              <div style={{
                width: 12, height: 12, borderRadius: '50%',
                border: '2px solid rgba(220,38,38,0.15)',
                borderTopColor: colors.red.DEFAULT,
                animation: 'pos-spin 0.8s linear infinite',
              }} />
            )}
            <style>{`@keyframes pos-spin { to { transform: rotate(360deg) } }`}</style>
          </div>

          {open && query.trim() && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0, right: 0,
              maxHeight: 280,
              overflowY: 'auto',
              background: '#fff',
              borderRadius: 11,
              border: `1px solid ${colors.gray.border}`,
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              zIndex: 100,
            }}>
              {results.length === 0 && !loading && (
                <div style={{
                  padding: '14px',
                  fontSize: 12,
                  color: colors.gray.dimText,
                  textAlign: 'center',
                }}>
                  Nenhum cliente encontrado
                </div>
              )}
              {results.map(c => (
                <button
                  key={c.id}
                  onClick={() => selectClient(c)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    border: 'none',
                    borderBottom: `1px solid ${colors.gray.border}`,
                    background: 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                    transition: `background ${transitions.fast}`,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = colors.gray.hover)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: colors.red.gradient,
                    color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700,
                    flexShrink: 0,
                  }}>
                    {c.name.split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase() || '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: colors.gray[900] }}>
                      {c.name}
                    </div>
                    <div style={{ fontSize: 11, color: colors.gray.dimText }}>
                      {c.phone}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
