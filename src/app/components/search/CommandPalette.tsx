'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { X, Search, ArrowRight } from 'lucide-react'

/* ── Quick actions ── */
interface Action {
  label:       string
  description: string
  href:        string
  icon:        string
}

const ACTIONS: Action[] = [
  { label: 'Dashboard',      description: 'Ir para o painel',           href: '/dashboard',                    icon: '📊' },
  { label: 'Agenda',         description: 'Ver agenda do dia',           href: '/dashboard/agenda',             icon: '📅' },
  { label: 'Clientes',       description: 'Gerenciar clientes',          href: '/dashboard/clientes',           icon: '👥' },
  { label: 'Serviços',       description: 'Configurar serviços',         href: '/dashboard/servicos',           icon: '✂️' },
  { label: 'Equipe',         description: 'Gerenciar profissionais',     href: '/dashboard/equipe',             icon: '👤' },
  { label: 'Financeiro',     description: 'Ver relatório financeiro',    href: '/dashboard/financeiro',         icon: '💰' },
  { label: 'Configurações',  description: 'Ajustes da conta',            href: '/dashboard/configuracoes',      icon: '⚙️' },
]

export default function CommandPalette() {
  const [open,     setOpen]     = useState(false)
  const [query,    setQuery]    = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef  = useRef<HTMLInputElement>(null)
  const router    = useRouter()

  const filtered = query.trim()
    ? ACTIONS.filter(a =>
        a.label.toLowerCase().includes(query.toLowerCase()) ||
        a.description.toLowerCase().includes(query.toLowerCase())
      )
    : ACTIONS

  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
    setSelected(0)
  }, [])

  const navigate = useCallback((href: string) => {
    close()
    router.push(href)
  }, [close, router])

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
        return
      }
      if (!open) return

      if (e.key === 'Escape') { close(); return }

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelected(prev => (prev + 1) % filtered.length)
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelected(prev => (prev - 1 + filtered.length) % filtered.length)
      }
      if (e.key === 'Enter' && filtered[selected]) {
        navigate(filtered[selected].href)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, close, navigate, filtered, selected])

  // Focus input when opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  if (!open) return null

  return (
    <>
      <style>{`
        @keyframes eligi-palette-in {
          from { opacity: 0; transform: translateY(-10px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)     scale(1); }
        }
        @keyframes eligi-overlay-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      {/* Overlay */}
      <div
        onClick={close}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.40)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 2000,
          animation: 'eligi-overlay-in 180ms ease',
        }}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal
        aria-label="Paleta de comandos"
        style={{
          position: 'fixed',
          top: '18vh',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '620px',
          zIndex: 2001,
          animation: 'eligi-palette-in 200ms cubic-bezier(0.22,1,0.36,1)',
          padding: '0 16px',
        }}
      >
        <div style={{
          borderRadius: '20px',
          background: 'rgba(255,255,255,0.90)',
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.70)',
          boxShadow:
            '0 2px 0 rgba(255,255,255,0.90) inset, 0 24px 60px rgba(0,0,0,0.18)',
          overflow: 'hidden',
        }}>

          {/* Input row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 18px',
            borderBottom: '1px solid rgba(0,0,0,0.07)',
          }}>
            <Search size={18} style={{ color: '#9ca3af', flexShrink: 0 }} />
            <input
              ref={inputRef}
              value={query}
              onChange={e => { setQuery(e.target.value); setSelected(0) }}
              placeholder="Buscar página, cliente, agendamento..."
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: '15px',
                background: 'transparent',
                color: '#0f0f14',
                letterSpacing: '-0.01em',
              }}
            />
            <button
              onClick={close}
              aria-label="Fechar"
              style={{
                background: 'rgba(0,0,0,0.06)',
                border: 'none',
                borderRadius: '8px',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#6b7280',
                flexShrink: 0,
                transition: 'background 150ms ease',
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Results */}
          <div
            role="listbox"
            style={{
              maxHeight: '320px',
              overflowY: 'auto',
              padding: '8px',
              scrollbarWidth: 'none',
            }}
          >
            {filtered.length === 0 ? (
              <div style={{
                padding: '24px 16px',
                textAlign: 'center',
                color: '#9ca3af',
                fontSize: '14px',
              }}>
                Nenhum resultado para &quot;{query}&quot;
              </div>
            ) : (
              filtered.map((action, index) => (
                <button
                  key={action.href}
                  role="option"
                  aria-selected={selected === index}
                  onClick={() => navigate(action.href)}
                  onMouseEnter={() => setSelected(index)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    border: 'none',
                    background: selected === index
                      ? 'rgba(220,38,38,0.08)'
                      : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 120ms ease',
                  }}
                >
                  <span style={{
                    fontSize: '20px',
                    lineHeight: 1,
                    flexShrink: 0,
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    background: selected === index
                      ? 'rgba(220,38,38,0.10)'
                      : 'rgba(0,0,0,0.04)',
                  }}>
                    {action.icon}
                  </span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: selected === index ? '#dc2626' : '#0f0f14',
                      letterSpacing: '-0.01em',
                    }}>
                      {action.label}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#9ca3af',
                      marginTop: '1px',
                    }}>
                      {action.description}
                    </div>
                  </div>

                  {selected === index && (
                    <ArrowRight size={14} style={{ color: '#dc2626', flexShrink: 0 }} />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer hint */}
          <div style={{
            padding: '10px 18px',
            borderTop: '1px solid rgba(0,0,0,0.06)',
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
          }}>
            {[
              { keys: ['↑', '↓'], label: 'navegar' },
              { keys: ['↵'],       label: 'abrir'   },
              { keys: ['Esc'],     label: 'fechar'  },
            ].map(({ keys, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {keys.map(k => (
                  <kbd key={k} style={{
                    fontSize: '11px',
                    padding: '2px 5px',
                    borderRadius: '5px',
                    background: 'rgba(0,0,0,0.06)',
                    border: '1px solid rgba(0,0,0,0.10)',
                    color: '#6b7280',
                    fontFamily: 'inherit',
                  }}>
                    {k}
                  </kbd>
                ))}
                <span style={{ fontSize: '11px', color: '#9ca3af' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}