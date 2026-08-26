'use client'
// src/app/dashboard/servicos/components/CategoryManager.tsx
// @eligi:category-manager-v2
// Gerenciar categorias de servico. ROTAS PRESERVADAS: mesmos POST/PUT/DELETE e
// o mesmo POST /services/categories/reorder com { ids }.
//
// O que sai:
//   - ARRASTAR PARA REORDENAR. `draggable` + onDragStart/onDrop e desenho de
//     desktop: no celular o gesto compete com o scroll da pagina e quase sempre
//     rola a tela em vez de mover a linha. Agora sao setas para cima e para
//     baixo, com 44px de alvo, que funcionam igual nos dois.
//   - o confirm() nativo ao apagar. Em PWA no iOS o dialogo nativo e
//     inconsistente e destoa do painel; virou confirmacao inline, na propria
//     linha, dizendo quantos servicos ficam sem categoria.
//   - alvos de 22 e 24px nos botoes de acao, abaixo dos 44 minimos.
//
// Correcao de robustez: se o reorder falhar no servidor, a ordem volta ao que
// era. Antes a lista ficava reordenada na tela e o banco nao — e so um F5
// revelava a divergencia.

import { useState } from 'react'
import {
  Plus, Pencil, Trash2, Check, X, ChevronUp, ChevronDown, TriangleAlert,
} from 'lucide-react'

import api from '@/shared/lib/apiClient'
import { colors, typography, radius } from '@/shared/theme'
import { ServiceCategory } from '@/features/services/types'

interface Props {
  categories: ServiceCategory[]
  onChange:   (cats: ServiceCategory[]) => void
}

const TAP = 44

const CAT_COLORS = [
  '#dc2626', '#ea580c', '#d97706', '#65a30d',
  '#16a34a', '#0891b2', '#2563eb', '#7c3aed',
  '#db2777', '#64748b',
]

export default function CategoryManager({ categories, onChange }: Props) {
  const [adding,    setAdding]    = useState(false)
  const [newName,   setNewName]   = useState('')
  const [newColor,  setNewColor]  = useState(CAT_COLORS[0])
  const [editId,    setEditId]    = useState<string | null>(null)
  const [editName,  setEditName]  = useState('')
  const [editColor, setEditColor] = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')

  async function handleAdd() {
    if (!newName.trim()) return
    try {
      setSaving(true); setError('')
      const res  = await api.post('/services/categories', { name: newName.trim(), color: newColor })
      const data = res.data?.data ?? res.data
      onChange([...categories, data])
      setNewName(''); setAdding(false)
    } catch {
      setError('Não foi possível criar a categoria.')
    } finally { setSaving(false) }
  }

  async function handleUpdate(id: string) {
    if (!editName.trim()) return
    try {
      setSaving(true); setError('')
      const res  = await api.put(`/services/categories/${id}`, {
        name:  editName.trim(),
        color: editColor || null,
      })
      const data = res.data?.data ?? res.data
      onChange(categories.map(c => (c.id === id ? { ...c, ...data } : c)))
      setEditId(null)
    } catch {
      setError('Não foi possível salvar a categoria.')
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    try {
      setSaving(true); setError('')
      await api.delete(`/services/categories/${id}`)
      onChange(categories.filter(c => c.id !== id))
      setConfirmId(null)
    } catch {
      setError('Não foi possível apagar a categoria.')
    } finally { setSaving(false) }
  }

  /** Move uma posicao para cima (-1) ou para baixo (+1). */
  async function move(index: number, delta: number) {
    const target = index + delta
    if (target < 0 || target >= categories.length) return

    const previous = categories
    const next = [...categories]
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    onChange(next)

    try {
      setError('')
      await api.post('/services/categories/reorder', { ids: next.map(c => c.id) })
    } catch {
      // Sem isso a tela ficava reordenada e o banco nao.
      onChange(previous)
      setError('Não foi possível salvar a nova ordem.')
    }
  }

  return (
    <div style={{ fontFamily: typography.fontFamily }}>
      <style>{`
        .cat-row + .cat-row{ border-top: 1px solid ${colors.gray.border}; }
        .cat-swatch{ width:${TAP}px; height:${TAP}px; display:grid; place-items:center;
                     border:none; background:transparent; padding:0; cursor:pointer;
                     -webkit-tap-highlight-color: transparent; }
        .cat-swatch > span{ width:24px; height:24px; border-radius:50%;
                            transition: box-shadow .15s ease; }
        @media (prefers-reduced-motion: reduce){ .cat-swatch > span{ transition:none } }
      `}</style>

      {error && (
        <div style={{
          marginBottom: 10, padding: '10px 13px', borderRadius: radius.sm,
          background: colors.red.subtle, border: `1px solid ${colors.red.border}`,
          color: '#b91c1c', fontSize: 12.5,
        }}>
          {error}
        </div>
      )}

      {categories.length > 0 && (
        <div style={{
          border:       `1px solid ${colors.gray.border}`,
          borderRadius: radius.lg,
          overflow:     'hidden',
          marginBottom: 10,
          background:   '#fff',
        }}>
          {categories.map((cat, index) => {
            const count      = cat._count?.services ?? 0
            const isEditing  = editId === cat.id
            const isConfirm  = confirmId === cat.id

            return (
              <div key={cat.id} className="cat-row">
                <div style={{
                  display:    'flex',
                  alignItems: 'center',
                  gap:        6,
                  padding:    '6px 8px 6px 4px',
                }}>
                  {/* setas: substituem o arraste, que no celular virava scroll */}
                  <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      aria-label={`Mover ${cat.name} para cima`}
                      style={arrowBtn(index === 0)}
                    >
                      <ChevronUp size={17} strokeWidth={2.4} />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, +1)}
                      disabled={index === categories.length - 1}
                      aria-label={`Mover ${cat.name} para baixo`}
                      style={arrowBtn(index === categories.length - 1)}
                    >
                      <ChevronDown size={17} strokeWidth={2.4} />
                    </button>
                  </div>

                  <span
                    aria-hidden
                    style={{
                      width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
                      background: cat.color ?? colors.gray.dimText,
                    }}
                  />

                  {isEditing ? (
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter')  handleUpdate(cat.id)
                        if (e.key === 'Escape') setEditId(null)
                      }}
                      autoFocus
                      aria-label="Nome da categoria"
                      style={{
                        flex: 1, minWidth: 0, minHeight: 38,
                        padding: '0 10px', borderRadius: radius.sm,
                        border: `1.5px solid ${colors.red.DEFAULT}`,
                        // 16px evita o zoom automatico do iOS ao focar
                        fontSize: 16, fontFamily: 'inherit', outline: 'none',
                      }}
                    />
                  ) : (
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{
                        display:      'block',
                        fontSize:     14,
                        fontWeight:   typography.weight.semibold,
                        color:        colors.gray[900],
                        overflow:     'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace:   'nowrap',
                      }}>
                        {cat.name}
                      </span>
                      <span style={{ display: 'block', fontSize: 11.5, color: colors.gray.dimText, marginTop: 1 }}>
                        {count} {count === 1 ? 'serviço' : 'serviços'}
                      </span>
                    </span>
                  )}

                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleUpdate(cat.id)}
                        disabled={saving}
                        aria-label="Salvar"
                        style={{ ...iconTap, color: '#fff', background: colors.red.DEFAULT }}
                      >
                        <Check size={17} strokeWidth={2.6} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditId(null)}
                        aria-label="Cancelar edição"
                        style={iconTap}
                      >
                        <X size={17} strokeWidth={2.4} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setEditId(cat.id)
                          setEditName(cat.name)
                          setEditColor(cat.color ?? CAT_COLORS[0])
                          setConfirmId(null)
                        }}
                        aria-label={`Editar ${cat.name}`}
                        style={iconTap}
                      >
                        <Pencil size={16} strokeWidth={2.2} />
                      </button>
                      <button
                        type="button"
                        onClick={() => { setConfirmId(cat.id); setEditId(null) }}
                        aria-label={`Apagar ${cat.name}`}
                        style={{ ...iconTap, color: colors.red.DEFAULT }}
                      >
                        <Trash2 size={16} strokeWidth={2.2} />
                      </button>
                    </>
                  )}
                </div>

                {/* paleta da edicao, em linha propria para nao espremer o nome */}
                {isEditing && (
                  <div style={{
                    display:    'flex',
                    flexWrap:   'wrap',
                    gap:        2,
                    padding:    '0 8px 8px 52px',
                  }}>
                    {CAT_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        className="cat-swatch"
                        onClick={() => setEditColor(c)}
                        aria-label={`Cor ${c}`}
                        aria-pressed={editColor === c}
                      >
                        <span style={{
                          background: c,
                          boxShadow: editColor === c
                            ? `0 0 0 2.5px #fff, 0 0 0 4.5px ${c}`
                            : 'none',
                        }} />
                      </button>
                    ))}
                  </div>
                )}

                {/* confirmacao inline, no lugar do confirm() nativo */}
                {isConfirm && (
                  <div style={{
                    display:      'flex',
                    alignItems:   'flex-start',
                    gap:          9,
                    flexWrap:     'wrap',
                    padding:      '10px 12px 12px 52px',
                    background:   colors.red.subtle,
                  }}>
                    <TriangleAlert
                      size={16}
                      color={colors.red.DEFAULT}
                      strokeWidth={2.3}
                      style={{ flexShrink: 0, marginTop: 2 }}
                    />
                    <span style={{ flex: 1, minWidth: 140, fontSize: 12.5, color: '#b91c1c', lineHeight: 1.45 }}>
                      Apagar &quot;{cat.name}&quot;?
                      {count > 0 && ` ${count} ${count === 1 ? 'serviço fica' : 'serviços ficam'} sem categoria.`}
                    </span>
                    <span style={{ display: 'flex', gap: 7 }}>
                      <button
                        type="button"
                        onClick={() => setConfirmId(null)}
                        style={{
                          minHeight: 36, padding: '0 13px', borderRadius: 999,
                          border: `1px solid ${colors.gray.borderMd}`, background: '#fff',
                          color: colors.gray[900], fontSize: 12.5, fontWeight: 700,
                          fontFamily: 'inherit', cursor: 'pointer',
                          WebkitTapHighlightColor: 'transparent',
                        }}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(cat.id)}
                        disabled={saving}
                        style={{
                          minHeight: 36, padding: '0 13px', borderRadius: 999,
                          border: 'none', background: colors.red.DEFAULT, color: '#fff',
                          fontSize: 12.5, fontWeight: 700, fontFamily: 'inherit',
                          cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1,
                          WebkitTapHighlightColor: 'transparent',
                        }}
                      >
                        {saving ? 'Apagando…' : 'Apagar'}
                      </button>
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* nova categoria */}
      {adding ? (
        <div style={{
          border:        `1px solid ${colors.red.border}`,
          borderRadius:  radius.lg,
          padding:       '13px 14px',
          background:    colors.red.subtle,
          display:       'flex',
          flexDirection: 'column',
          gap:           11,
        }}>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter')  handleAdd()
              if (e.key === 'Escape') { setAdding(false); setNewName('') }
            }}
            placeholder="Nome da categoria"
            autoFocus
            aria-label="Nome da nova categoria"
            style={{
              minHeight: TAP, padding: '0 13px', borderRadius: radius.sm,
              border: `1px solid ${colors.gray.borderMd}`, background: '#fff',
              // 16px evita o zoom automatico do iOS ao focar
              fontSize: 16, fontFamily: 'inherit', outline: 'none',
            }}
          />

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: colors.gray.dimText, marginBottom: 4 }}>
              COR
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {CAT_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className="cat-swatch"
                  onClick={() => setNewColor(c)}
                  aria-label={`Cor ${c}`}
                  aria-pressed={newColor === c}
                >
                  <span style={{
                    background: c,
                    boxShadow: newColor === c ? `0 0 0 2.5px #fff, 0 0 0 4.5px ${c}` : 'none',
                  }} />
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => { setAdding(false); setNewName('') }}
              style={{
                minHeight: TAP, padding: '0 16px', borderRadius: 999,
                border: `1px solid ${colors.gray.borderMd}`, background: '#fff',
                color: colors.gray[900], fontSize: 13.5, fontWeight: 700,
                fontFamily: 'inherit', cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={saving || !newName.trim()}
              style={{
                flex: 1, minHeight: TAP, borderRadius: 999, border: 'none',
                background: colors.red.gradient, color: '#fff',
                fontSize: 13.5, fontWeight: 700, fontFamily: 'inherit',
                cursor: saving || !newName.trim() ? 'not-allowed' : 'pointer',
                opacity: !newName.trim() ? 0.5 : 1,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {saving ? 'Criando…' : 'Criar categoria'}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          style={{
            display:                 'flex',
            alignItems:              'center',
            justifyContent:          'center',
            gap:                     7,
            width:                   '100%',
            minHeight:               TAP,
            borderRadius:            radius.md,
            border:                  `1px dashed ${colors.gray.borderMd}`,
            background:              'transparent',
            color:                   colors.gray.dimText,
            fontSize:                13.5,
            fontWeight:              600,
            fontFamily:              'inherit',
            cursor:                  'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Plus size={16} strokeWidth={2.4} />
          Nova categoria
        </button>
      )}
    </div>
  )
}

function arrowBtn(disabled: boolean): React.CSSProperties {
  return {
    width:                   TAP,
    height:                  22,
    display:                 'grid',
    placeItems:              'center',
    border:                  'none',
    background:              'transparent',
    padding:                 0,
    color:                   disabled ? 'rgba(17,17,20,0.16)' : '#8a8a93',
    cursor:                  disabled ? 'default' : 'pointer',
    WebkitTapHighlightColor: 'transparent',
  }
}

const iconTap: React.CSSProperties = {
  width:                   TAP,
  height:                  TAP,
  flexShrink:              0,
  display:                 'grid',
  placeItems:              'center',
  border:                  'none',
  borderRadius:            14,
  background:              'transparent',
  color:                   '#8a8a93',
  cursor:                  'pointer',
  WebkitTapHighlightColor: 'transparent',
}
