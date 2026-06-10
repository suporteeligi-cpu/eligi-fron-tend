'use client'
// src/app/dashboard/servicos/components/CategoryManager.tsx

import { useState } from 'react'
import { Plus, Pencil, Trash2, GripVertical, Check, X } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { colors, typography, radius, shadows } from '@/shared/theme'
import { ServiceCategory } from '@/features/services/types'

interface Props {
  categories: ServiceCategory[]
  onChange:   (cats: ServiceCategory[]) => void
}

const CAT_COLORS = [
  '#dc2626','#ea580c','#d97706','#65a30d',
  '#16a34a','#0891b2','#2563eb','#7c3aed',
  '#db2777','#64748b',
]

export default function CategoryManager({ categories, onChange }: Props) {
  const [adding,    setAdding]    = useState(false)
  const [newName,   setNewName]   = useState('')
  const [newColor,  setNewColor]  = useState(CAT_COLORS[0])
  const [editId,    setEditId]    = useState<string | null>(null)
  const [editName,  setEditName]  = useState('')
  const [editColor, setEditColor] = useState('')
  const [saving,    setSaving]    = useState(false)
  const [dragOver,  setDragOver]  = useState<string | null>(null)
  const [dragId,    setDragId]    = useState<string | null>(null)

  async function handleAdd() {
    if (!newName.trim()) return
    setSaving(true)
    try {
      const res  = await api.post('/services/categories', { name: newName.trim(), color: newColor })
      const data = res.data?.data ?? res.data
      onChange([...categories, data])
      setNewName(''); setAdding(false)
    } finally { setSaving(false) }
  }

  async function handleUpdate(id: string) {
    if (!editName.trim()) return
    setSaving(true)
    try {
      const res  = await api.put(`/services/categories/${id}`, { name: editName.trim(), color: editColor || null })
      const data = res.data?.data ?? res.data
      onChange(categories.map(c => c.id === id ? { ...c, ...data } : c))
      setEditId(null)
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    const cat = categories.find(c => c.id === id)
    if (!cat) return
    const count = cat._count?.services ?? 0
    if (count > 0 && !confirm(`"${cat.name}" tem ${count} serviço(s). Eles ficarão sem categoria. Continuar?`)) return
    await api.delete(`/services/categories/${id}`)
    onChange(categories.filter(c => c.id !== id))
  }

  async function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) { setDragOver(null); setDragId(null); return }
    const from  = categories.findIndex(c => c.id === dragId)
    const to    = categories.findIndex(c => c.id === targetId)
    const next  = [...categories]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(next)
    setDragOver(null); setDragId(null)
    await api.post('/services/categories/reorder', { ids: next.map(c => c.id) })
  }

  const rowStyle = (id: string): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '9px 12px',
    background: dragOver === id ? 'rgba(220,38,38,0.06)' : '#fff',
    borderBottom: `1px solid ${colors.gray.border}`,
    transition: 'background 0.15s',
    cursor: 'default',
  })

  return (
    <div style={{ fontFamily: typography.fontFamily }}>
      {/* Lista */}
      {categories.length > 0 && (
        <div style={{
          border: `1px solid ${colors.gray.border}`,
          borderRadius: radius.lg,
          overflow: 'hidden',
          marginBottom: 10,
          boxShadow: shadows.sm,
        }}>
          {categories.map((cat) => (
            <div
              key={cat.id}
              style={rowStyle(cat.id)}
              draggable
              onDragStart={() => setDragId(cat.id)}
              onDragOver={e => { e.preventDefault(); setDragOver(cat.id) }}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => handleDrop(cat.id)}
            >
              {/* Grip */}
              <GripVertical size={14} color={colors.gray.dimText} style={{ cursor: 'grab', flexShrink: 0 }} />

              {/* Cor */}
              <div style={{
                width: 12, height: 12, borderRadius: '50%',
                background: cat.color ?? colors.gray.dimText,
                flexShrink: 0,
              }} />

              {/* Nome / edit inline */}
              {editId === cat.id ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleUpdate(cat.id); if (e.key === 'Escape') setEditId(null) }}
                    autoFocus
                    style={{
                      flex: 1, padding: '4px 8px', borderRadius: radius.sm,
                      border: `1px solid ${colors.red.DEFAULT}`,
                      fontSize: typography.scale.sm, fontFamily: 'inherit', outline: 'none',
                    }}
                  />
                  {/* Paleta de cores inline */}
                  <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                    {CAT_COLORS.map(c => (
                      <button key={c} onClick={() => setEditColor(c)} style={{
                        width: 14, height: 14, borderRadius: '50%', background: c, border: 'none',
                        cursor: 'pointer', outline: editColor === c ? `2px solid ${c}` : 'none',
                        outlineOffset: 1, flexShrink: 0,
                      }} />
                    ))}
                  </div>
                  <button onClick={() => handleUpdate(cat.id)} disabled={saving} style={iconBtn(colors.red.DEFAULT)}>
                    <Check size={13} color="#fff" />
                  </button>
                  <button onClick={() => setEditId(null)} style={iconBtn(colors.gray.dimText)}>
                    <X size={13} color="#fff" />
                  </button>
                </div>
              ) : (
                <>
                  <span style={{
                    flex: 1, fontSize: typography.scale.sm,
                    fontWeight: typography.weight.semibold, color: typography.color.primary,
                  }}>
                    {cat.name}
                    {(cat._count?.services ?? 0) > 0 && (
                      <span style={{ marginLeft: 6, fontSize: 11, color: typography.color.muted, fontWeight: 400 }}>
                        {cat._count!.services} serviço{cat._count!.services !== 1 ? 's' : ''}
                      </span>
                    )}
                  </span>
                  <button onClick={() => { setEditId(cat.id); setEditName(cat.name); setEditColor(cat.color ?? CAT_COLORS[0]) }}
                    style={iconBtnGhost}>
                    <Pencil size={12} color={colors.gray.dimText} />
                  </button>
                  <button onClick={() => handleDelete(cat.id)} style={iconBtnGhost}>
                    <Trash2 size={12} color={colors.gray.dimText} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Formulário de nova categoria */}
      {adding ? (
        <div style={{
          border: `1px solid ${colors.red.border}`,
          borderRadius: radius.lg, padding: '12px 14px',
          background: 'rgba(220,38,38,0.03)',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') { setAdding(false); setNewName('') } }}
            placeholder="Nome da categoria"
            autoFocus
            style={{
              padding: '8px 12px', borderRadius: radius.sm,
              border: `1px solid ${colors.gray.borderMd}`,
              fontSize: typography.scale.sm, fontFamily: 'inherit', outline: 'none',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: typography.color.muted }}>Cor:</span>
            <div style={{ display: 'flex', gap: 4, flex: 1 }}>
              {CAT_COLORS.map(c => (
                <button key={c} onClick={() => setNewColor(c)} style={{
                  width: 16, height: 16, borderRadius: '50%', background: c, border: 'none',
                  cursor: 'pointer', outline: newColor === c ? `2px solid ${c}` : 'none', outlineOffset: 1,
                }} />
              ))}
            </div>
            <button onClick={handleAdd} disabled={saving || !newName.trim()} style={{
              padding: '6px 14px', borderRadius: radius.sm,
              background: colors.red.gradient, color: '#fff', border: 'none',
              fontSize: typography.scale.xs, fontWeight: typography.weight.bold,
              cursor: saving || !newName.trim() ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', opacity: !newName.trim() ? 0.5 : 1,
            }}>
              {saving ? '...' : 'Criar'}
            </button>
            <button onClick={() => { setAdding(false); setNewName('') }} style={{
              padding: '6px 10px', borderRadius: radius.sm,
              background: 'transparent', border: `1px solid ${colors.gray.borderMd}`,
              fontSize: typography.scale.xs, cursor: 'pointer', fontFamily: 'inherit',
              color: typography.color.muted,
            }}>
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 14px', borderRadius: radius.md,
          border: `1px dashed ${colors.gray.borderMd}`,
          background: 'transparent', cursor: 'pointer',
          fontSize: typography.scale.sm, color: typography.color.muted,
          fontFamily: 'inherit', width: '100%', justifyContent: 'center',
          transition: 'all 0.15s', WebkitTapHighlightColor: 'transparent',
        }}>
          <Plus size={14} />
          Nova categoria
        </button>
      )}
    </div>
  )
}

const iconBtn = (bg: string): React.CSSProperties => ({
  width: 22, height: 22, borderRadius: '50%', border: 'none',
  background: bg, cursor: 'pointer', display: 'flex',
  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  WebkitTapHighlightColor: 'transparent',
})

const iconBtnGhost: React.CSSProperties = {
  width: 24, height: 24, borderRadius: '50%', border: 'none',
  background: 'transparent', cursor: 'pointer', display: 'flex',
  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  WebkitTapHighlightColor: 'transparent',
}
