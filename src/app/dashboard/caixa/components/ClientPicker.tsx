'use client'
// src/app/dashboard/caixa/components/ClientPicker.tsx
// @eligi:caixa-client-v2
//
// Cliente da venda. Mostra o cliente quando tem nome (com OU sem id: venda vinda
// de agendamento pode ter so o nome anotado).
//
// Telefone: STAFF/BASIC_STAFF recebem a venda SEM telefone (corte no back,
// `clientPhoneMasked: true`). A tela diz "oculto para o seu cargo" em vez de
// deixar o espaco vazio, para ninguem achar que o cadastro esta incompleto.

import { useState, useEffect, useRef } from 'react'
import { Search, X, Lock } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { ClientLite } from '@/features/sales/types'
import { C } from '../ui'

interface Props {
  value:    { id: string | null; name: string | null; phone: string | null; masked?: boolean }
  onChange: (client: { id: string | null; name: string | null; phone: string | null }) => void
  disabled?: boolean
}

function initials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase() || '?'
}

export default function ClientPicker({ value, onChange, disabled }: Props) {
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState<ClientLite[]>([])
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Busca no servidor (debounce). Para STAFF o back busca so por nome.
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

  if (value.name) {
    return (
      <div className="cx-client" style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
        background: C.card, border: `1px solid ${C.line2}`, borderRadius: 12,
        fontFamily: C.body,
      }}>
        <span style={{
          width: 34, height: 34, borderRadius: '50%', background: C.ink, color: C.onInk,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, flexShrink: 0,
        }}>{initials(value.name)}</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{
            display: 'block', fontSize: 14, fontWeight: 700, color: C.ink,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{value.name}</span>
          {value.phone ? (
            <span style={{ display: 'block', fontSize: 12, color: C.ink3, fontVariantNumeric: 'tabular-nums' }}>
              {value.phone}
            </span>
          ) : value.masked ? (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 2,
              fontSize: 11, color: C.ink3, padding: '1px 7px', borderRadius: 6,
              background: C.sunken, border: `1px dashed ${C.line2}`,
            }}>
              <Lock size={10} strokeWidth={2.4} /> Telefone oculto para o seu cargo
            </span>
          ) : null}
        </span>
        {!disabled && (
          <button
            type="button"
            onClick={clear}
            aria-label="Remover cliente da venda"
            style={{
              width: 36, height: 36, borderRadius: '50%', border: `1px solid ${C.line2}`,
              background: C.card, cursor: 'pointer', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={14} color={C.ink2} />
          </button>
        )}
      </div>
    )
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative', fontFamily: C.body }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', minHeight: 46,
        background: C.card, border: `1px solid ${C.line2}`, borderRadius: 12,
        opacity: disabled ? 0.5 : 1,
      }}>
        <Search size={15} color={C.ink3} />
        <input
          id="cx-client-search"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Cliente: buscar por nome"
          aria-label="Buscar cliente"
          disabled={disabled}
          style={{
            flex: 1, border: 'none', outline: 'none', fontSize: 16, minWidth: 0,
            background: 'transparent', color: C.ink, fontFamily: 'inherit',
          }}
        />
        {loading && (
          <span style={{
            width: 14, height: 14, borderRadius: '50%', border: `2px solid ${C.line2}`,
            borderTopColor: C.ink, animation: 'cx-spin 0.8s linear infinite',
          }} />
        )}
      </div>

      {open && query.trim() && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          maxHeight: 280, overflowY: 'auto', background: C.card, borderRadius: 12,
          border: `1px solid ${C.line2}`, boxShadow: '0 12px 28px rgba(17,17,20,0.10)', zIndex: 100,
        }}>
          {results.length === 0 && !loading && (
            <div style={{ padding: 14, fontSize: 13, color: C.ink3, textAlign: 'center' }}>
              Nenhum cliente encontrado
            </div>
          )}
          {results.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => selectClient(c)}
              className="cx-client-opt"
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                minHeight: 48, border: 'none', borderBottom: `1px solid ${C.line}`,
                background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
              }}
            >
              <span style={{
                width: 30, height: 30, borderRadius: '50%', background: C.sunken, color: C.ink,
                border: `1px solid ${C.line2}`, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0,
              }}>{initials(c.name)}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: C.ink }}>{c.name}</span>
                {c.phone && (
                  <span style={{ display: 'block', fontSize: 12, color: C.ink3, fontVariantNumeric: 'tabular-nums' }}>{c.phone}</span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
      <style>{`
        @keyframes cx-spin { to { transform: rotate(360deg) } }
        .cx-client-opt:hover { background: ${C.sunken} !important }
      `}</style>
    </div>
  )
}
