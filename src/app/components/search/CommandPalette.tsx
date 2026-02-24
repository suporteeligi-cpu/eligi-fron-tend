'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
      }

      if (e.key === 'Escape') {
        setOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!open) return null

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={inputWrapper}>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cliente, agendamento, serviço..."
            style={inputStyle}
          />
          <button onClick={() => setOpen(false)} style={closeButton}>
            <X size={18} />
          </button>
        </div>

        <div style={resultsStyle}>
          {query ? (
            <div style={{ opacity: 0.6 }}>
              Nenhum resultado ainda (conectar API depois)
            </div>
          ) : (
            <div style={{ opacity: 0.6 }}>
              Comece digitando para buscar
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
 


//================== Styles ==================//

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.3)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  paddingTop: '120px',
  zIndex: 2000,
}

const modalStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '640px',
  borderRadius: '20px',
  background: 'rgba(255,255,255,0.9)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.6)',
  boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
  overflow: 'hidden',
}

const inputWrapper: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '16px',
  borderBottom: '1px solid rgba(0,0,0,0.06)',
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  border: 'none',
  outline: 'none',
  fontSize: '16px',
  background: 'transparent',
}

const closeButton: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
}

const resultsStyle: React.CSSProperties = {
  padding: '16px',
  maxHeight: '300px',
  overflowY: 'auto',
}

