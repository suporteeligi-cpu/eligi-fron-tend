'use client'
// src/app/dashboard/servicos/components/ServiceModal.tsx

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronDown, Users } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { colors, typography, radius, shadows, glass } from '@/shared/theme'
import { Service, ServiceCategory } from '@/features/services/types'
import { DEFAULT_SERVICE_COLOR } from '@/features/services/constants/colorPalette'
import ColorPicker from './ColorPicker'

interface ProfLite {
  id:        string
  name:      string
  avatarUrl: string | null
  active:    boolean
}

interface Props {
  service:    Service | null
  categories: ServiceCategory[]
  isMobile:   boolean
  onClose:    () => void
  onSaved:    (s: Service, isNew: boolean) => void
}

const HOUR_OPTIONS   = Array.from({ length: 13 }, (_, i) => i)
const MINUTE_OPTIONS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export default function ServiceModal({ service, categories, isMobile, onClose, onSaved }: Props) {
  const isEdit = !!service

  const [name,        setName]        = useState(service?.name        ?? '')
  const [categoryId,  setCategoryId]  = useState<string>(service?.categoryId ?? '')
  const [duration,    setDuration]    = useState(service?.duration    ?? 30)
  const [price,       setPrice]       = useState<string>(service?.price != null ? String(service.price) : '')
  const [description, setDescription] = useState(service?.description ?? '')
  const [color,       setColor]       = useState<string>(service?.color ?? DEFAULT_SERVICE_COLOR)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  const [allProfs,      setAllProfs]      = useState<ProfLite[]>([])
  const [selectedProfs, setSelectedProfs] = useState<Set<string>>(new Set())
  const [profsLoading,  setProfsLoading]  = useState(false)

  const durationH = Math.floor(duration / 60)
  const durationM = duration % 60
  function setDurationHM(h: number, m: number) { setDuration(h * 60 + m) }

  useEffect(() => {
    let cancelled = false
    async function load() {
      setProfsLoading(true)
      try {
        const [profsRes, linkedRes] = await Promise.all([
          api.get('/equipe'),
          isEdit
            ? api.get(`/services/${service!.id}/professionals`)
            : Promise.resolve({ data: { data: [] } }),
        ])
        if (cancelled) return
        const profs  = (profsRes.data?.data  ?? profsRes.data)  as ProfLite[]
        const linked = (linkedRes.data?.data ?? linkedRes.data) as ProfLite[]
        setAllProfs(Array.isArray(profs) ? profs.filter(p => p.active) : [])
        setSelectedProfs(new Set(Array.isArray(linked) ? linked.map(p => p.id) : []))
      } catch {
        if (!cancelled) { setAllProfs([]); setSelectedProfs(new Set()) }
      } finally {
        if (!cancelled) setProfsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [isEdit, service])

  function toggleProf(id: string) {
    setSelectedProfs(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  async function handleSave() {
    if (!name.trim()) { setError('Nome é obrigatório'); return }
    if (duration < 5) { setError('Duração mínima é 5 minutos'); return }
    try {
      setSaving(true); setError(null)
      const selectedCat = categories.find(c => c.id === categoryId)
      const payload = {
        name:        name.trim(),
        duration,
        price:       price !== '' ? Number(price) : undefined,
        description: description.trim() || undefined,
        categoryId:  categoryId || null,
        category:    selectedCat?.name ?? undefined,
        color,
      }
      const res  = isEdit
        ? await api.put(`/services/${service!.id}`, payload)
        : await api.post('/services', payload)
      const saved = res.data?.data ?? res.data

      await api.put(`/services/${saved.id}/professionals`, {
        professionalIds: Array.from(selectedProfs),
      })

      onSaved(saved, !isEdit)
      onClose()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg ?? 'Erro ao salvar serviço')
    } finally { setSaving(false) }
  }

  if (typeof document === 'undefined') return null

  const labelStyle: React.CSSProperties = {
    fontSize: typography.scale.xs, fontWeight: typography.weight.bold,
    color: typography.color.muted, letterSpacing: '0.06em',
    textTransform: 'uppercase', marginBottom: 6, display: 'block',
  }
  const fieldGap: React.CSSProperties = { marginBottom: isMobile ? 18 : 16 }
  const selectedCat = categories.find(c => c.id === categoryId)

  return createPortal(
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.30)',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        zIndex: 9998, animation: 'svc-mod-fade 0.18s ease',
      }} />

      <div style={isMobile ? {
        position: 'fixed', bottom: 0, left: 0, right: 0, top: 60,
        background: 'rgba(255,255,255,0.99)', borderRadius: '24px 24px 0 0',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.18)', zIndex: 9999,
        display: 'flex', flexDirection: 'column', fontFamily: typography.fontFamily,
        animation: 'svc-mod-up 0.30s cubic-bezier(0.34, 1.2, 0.64, 1)',
      } : {
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: 500, maxWidth: '94vw', maxHeight: '92vh',
        background: 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
        borderRadius: radius['2xl'], border: `1px solid ${colors.gray.borderMd}`,
        boxShadow: shadows.lg, zIndex: 9999,
        display: 'flex', flexDirection: 'column', fontFamily: typography.fontFamily,
        animation: 'svc-mod-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
        <style>{`
          @keyframes svc-mod-fade { from{opacity:0} to{opacity:1} }
          @keyframes svc-mod-in   { from{opacity:0;transform:translate(-50%,-50%) scale(.95)} to{opacity:1;transform:translate(-50%,-50%) scale(1)} }
          @keyframes svc-mod-up   { from{transform:translateY(100%)} to{transform:translateY(0)} }
          .svc-input{
            width:100%; padding:${isMobile ? '12px 14px' : '10px 14px'};
            border-radius:${radius.md}px; border:1px solid ${colors.gray.borderMd};
            background:${colors.background.surface}; color:${typography.color.primary};
            font-size:${typography.scale.base}px; outline:none; box-sizing:border-box;
            font-family:${typography.fontFamily}; transition:border-color .15s,box-shadow .15s;
          }
          .svc-input:focus{ border-color:${colors.red.borderHover}; box-shadow:0 0 0 3px ${colors.red.focusRing}; }
          .svc-select{ appearance:none; cursor:pointer }
          .svc-handle{ width:40px;height:4px;border-radius:2px;background:rgba(0,0,0,.12);margin:12px auto 4px }
          .prof-chip:hover{ border-color:${colors.red.DEFAULT} !important; background:${colors.red.subtle} !important; }
        `}</style>

        {isMobile && <div aria-hidden className="svc-handle" />}

        {/* Header */}
        <div style={{
          padding: isMobile ? '16px 20px 14px' : '20px 20px 16px',
          borderBottom: `1px solid ${colors.gray.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <h2 style={{ margin: 0, fontSize: isMobile ? 19 : 17, fontWeight: typography.weight.bold, color: typography.color.primary, letterSpacing: '-0.3px' }}>
            {isEdit ? 'Editar serviço' : 'Novo serviço'}
          </h2>
          <button onClick={onClose} aria-label="Fechar" style={{
            width: 32, height: 32, borderRadius: '50%',
            border: `1px solid ${colors.gray.borderMd}`,
            background: glass.surface.default.background,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            WebkitTapHighlightColor: 'transparent',
          }}>
            <X size={15} color={colors.gray.dimText} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, WebkitOverflowScrolling: 'touch' }}>
          {error && (
            <div style={{
              marginBottom: 16, padding: '10px 14px', borderRadius: radius.sm,
              background: colors.red.subtle, border: `1px solid ${colors.red.border}`,
              color: '#b91c1c', fontSize: typography.scale.sm,
            }}>{error}</div>
          )}

          {/* Nome */}
          <div style={fieldGap}>
            <label style={labelStyle}>Nome do serviço *</label>
            <input className="svc-input" placeholder="Ex: Corte Masculino" value={name}
              onChange={e => setName(e.target.value)} autoFocus={!isEdit && !isMobile} />
          </div>

          {/* Cor */}
          <div style={fieldGap}>
            <label style={labelStyle}>Cor</label>
            <ColorPicker selected={color} onSelect={setColor} />
          </div>

          {/* Categoria */}
          <div style={fieldGap}>
            <label style={labelStyle}>Categoria</label>
            {categories.length === 0 ? (
              <div style={{
                padding: '10px 14px', borderRadius: radius.md,
                border: `1px dashed ${colors.gray.borderMd}`,
                fontSize: typography.scale.sm, color: typography.color.muted,
              }}>
                Nenhuma categoria cadastrada. Crie uma clicando em &quot;Categorias&quot; na página de serviços.
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: isMobile ? '12px 14px' : '10px 14px',
                  borderRadius: radius.md, border: `1px solid ${colors.gray.borderMd}`,
                  background: colors.background.surface, cursor: 'pointer', position: 'relative',
                }}>
                  {selectedCat && (
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: selectedCat.color ?? colors.gray.dimText, flexShrink: 0 }} />
                  )}
                  <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
                    className="svc-select"
                    style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', cursor: 'pointer' }}>
                    <option value="">Sem categoria</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <span style={{ flex: 1, fontSize: typography.scale.base, color: selectedCat ? typography.color.primary : typography.color.muted }}>
                    {selectedCat?.name ?? 'Sem categoria'}
                  </span>
                  <ChevronDown size={14} color={colors.gray.dimText} style={{ flexShrink: 0 }} />
                </div>
              </div>
            )}
          </div>

          {/* Duração */}
          <div style={fieldGap}>
            <label style={labelStyle}>Duração *</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { opts: HOUR_OPTIONS,   val: durationH, set: (v: number) => setDurationHM(v, durationM), fmt: (v: number) => `${v}h` },
                { opts: MINUTE_OPTIONS, val: durationM, set: (v: number) => setDurationHM(durationH, v), fmt: (v: number) => `${v}min` },
              ].map((sel, i) => (
                <div key={i} style={{ position: 'relative', flex: 1 }}>
                  <select className="svc-input svc-select" value={sel.val} onChange={e => sel.set(Number(e.target.value))}>
                    {sel.opts.map((o: number) => <option key={o} value={o}>{sel.fmt(o)}</option>)}
                  </select>
                  <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: 10, color: colors.gray.dimText }}>▾</div>
                </div>
              ))}
            </div>
          </div>

          {/* Preço */}
          <div style={fieldGap}>
            <label style={labelStyle}>Preço (R$)</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: typography.scale.sm, color: colors.gray.dimText, fontWeight: typography.weight.medium }}>R$</span>
              <input className="svc-input" type="number" inputMode="decimal" min="0" step="0.01"
                placeholder="0,00" value={price} onChange={e => setPrice(e.target.value)} style={{ paddingLeft: 40 }} />
            </div>
          </div>

          {/* Descrição */}
          <div style={fieldGap}>
            <label style={labelStyle}>Descrição (opcional)</label>
            <textarea className="svc-input" placeholder="Descreva o serviço para seus clientes..."
              value={description} onChange={e => setDescription(e.target.value)}
              rows={isMobile ? 3 : 2} style={{ resize: 'vertical', lineHeight: 1.5 }} />
          </div>

          {/* Profissionais */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Users size={13} color={typography.color.muted} />
              <label style={{ ...labelStyle, marginBottom: 0 }}>Profissionais que executam</label>
            </div>
            <div style={{ fontSize: typography.scale.xs, color: typography.color.muted, marginBottom: 10 }}>
              Selecione quem pode realizar este serviço. Deixe vazio para todos.
            </div>

            {profsLoading ? (
              <div style={{ fontSize: typography.scale.sm, color: typography.color.muted, padding: '8px 0' }}>Carregando...</div>
            ) : allProfs.length === 0 ? (
              <div style={{
                padding: '10px 14px', borderRadius: radius.md,
                border: `1px dashed ${colors.gray.borderMd}`,
                fontSize: typography.scale.sm, color: typography.color.muted,
              }}>
                Nenhum profissional cadastrado ainda.
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {allProfs.map(prof => {
                  const selected = selectedProfs.has(prof.id)
                  return (
                    <button key={prof.id} type="button" className="prof-chip"
                      onClick={() => toggleProf(prof.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 7,
                        padding: '6px 12px 6px 6px', borderRadius: 99,
                        border: `1.5px solid ${selected ? colors.red.DEFAULT : colors.gray.borderMd}`,
                        background: selected ? colors.red.subtle : '#fff',
                        cursor: 'pointer', fontFamily: 'inherit',
                        transition: 'all 0.15s', WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      {prof.avatarUrl ? (
                        <img src={prof.avatarUrl} alt={prof.name} style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                          background: selected ? colors.red.DEFAULT : colors.gray.dimText,
                          color: '#fff', fontSize: 9, fontWeight: 700,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {getInitials(prof.name)}
                        </div>
                      )}
                      <span style={{
                        fontSize: typography.scale.sm,
                        fontWeight: selected ? typography.weight.semibold : typography.weight.medium,
                        color: selected ? colors.red.DEFAULT : typography.color.primary,
                        whiteSpace: 'nowrap',
                      }}>
                        {prof.name}
                      </span>
                      {selected && (
                        <svg viewBox="0 0 12 12" width="10" height="10" style={{ flexShrink: 0 }}>
                          <path d="M2 6.5L5 9L10 3" stroke={colors.red.DEFAULT} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {selectedProfs.size > 0 && (
              <div style={{ marginTop: 8, fontSize: typography.scale.xs, color: typography.color.muted }}>
                {selectedProfs.size} profissional{selectedProfs.size !== 1 ? 'is' : ''} selecionado{selectedProfs.size !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: isMobile ? '14px 20px max(20px, env(safe-area-inset-bottom))' : '14px 20px 20px',
          borderTop: `1px solid ${colors.gray.border}`,
          display: 'flex', gap: 8, flexShrink: 0, background: 'rgba(255,255,255,0.95)',
        }}>
          <button onClick={handleSave} disabled={saving} style={{
            flex: 1, padding: isMobile ? 14 : 13,
            background: saving ? 'rgba(220,38,38,0.25)' : colors.red.gradient,
            color: '#fff', border: 'none', borderRadius: radius.md,
            fontWeight: typography.weight.semibold, fontSize: isMobile ? 15 : 14,
            cursor: saving ? 'not-allowed' : 'pointer',
            boxShadow: saving ? 'none' : shadows.redMd, transition: 'all 0.2s',
          }}>
            {saving ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar serviço'}
          </button>
          <button onClick={onClose} style={{
            padding: isMobile ? '14px 20px' : '13px 20px',
            background: 'rgba(0,0,0,0.05)', border: `1px solid ${colors.gray.borderMd}`,
            borderRadius: radius.md, fontSize: typography.scale.base,
            cursor: 'pointer', color: typography.color.muted,
          }}>
            Cancelar
          </button>
        </div>
      </div>
    </>,
    document.body
  )
}
