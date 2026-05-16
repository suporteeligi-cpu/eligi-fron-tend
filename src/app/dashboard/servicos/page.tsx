'use client'
// src/app/(dashboard)/servicos/page.tsx

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, ChevronRight, Clock, Pencil, Trash2, X } from 'lucide-react'
import api from '@/shared/lib/apiClient'

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Service {
  id:          string
  name:        string
  duration:    number
  price:       number | null
  description: string | null
  category:    string | null
  active:      boolean
}

// ─── Utilitários ─────────────────────────────────────────────────────────────
function formatDuration(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h > 0 && m > 0) return `${h}h ${m}min`
  if (h > 0) return `${h}h`
  return `${m}min`
}

function formatPrice(p: number | null): string {
  if (p == null) return '—'
  return `R$ ${p.toFixed(2).replace('.', ',')}`
}

function groupByCategory(services: Service[]): Record<string, Service[]> {
  return services.reduce<Record<string, Service[]>>((acc, s) => {
    const key = s.category?.trim() || 'Sem categoria'
    if (!acc[key]) acc[key] = []
    acc[key].push(s)
    return acc
  }, {})
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div style={{
      position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
      padding: '12px 22px', borderRadius: 14, zIndex: 9999,
      background: type === 'success' ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'linear-gradient(135deg,#dc2626,#b91c1c)',
      color: '#fff', fontSize: 14, fontWeight: 600,
      boxShadow: '0 8px 28px rgba(0,0,0,0.16)',
      fontFamily: '-apple-system,"SF Pro Display",system-ui,sans-serif',
      whiteSpace: 'nowrap', animation: 'toastIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
    }}>
      {message}
    </div>
  )
}

// ─── Modal de serviço (criar / editar) ───────────────────────────────────────
interface ServiceModalProps {
  service:    Service | null   // null = criar
  categories: string[]
  onClose:    () => void
  onSaved:    (s: Service) => void
}

function ServiceModal({ service, categories, onClose, onSaved }: ServiceModalProps) {
  const isEdit = !!service

  const [name,        setName]        = useState(service?.name        ?? '')
  const [category,    setCategory]    = useState(service?.category    ?? '')
  const [duration,    setDuration]    = useState(service?.duration    ?? 30)
  const [price,       setPrice]       = useState<string>(service?.price != null ? String(service.price) : '')
  const [description, setDescription] = useState(service?.description ?? '')
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  // Duração: horas + minutos separados
  const durationH = Math.floor(duration / 60)
  const durationM = duration % 60

  function setDurationHM(h: number, m: number) {
    setDuration(h * 60 + m)
  }

  async function handleSave() {
    if (!name.trim()) { setError('Nome é obrigatório'); return }
    if (duration < 5) { setError('Duração mínima é 5 minutos'); return }

    try {
      setSaving(true)
      setError(null)
      const payload = {
        name:        name.trim(),
        duration,
        price:       price !== '' ? Number(price) : undefined,
        description: description.trim() || undefined,
        category:    category.trim()    || undefined,
      }
      const res = isEdit
        ? await api.put(`/services/${service!.id}`, payload)
        : await api.post('/services', payload)

      const data = res.data?.data ?? res.data
      onSaved(data)
      onClose()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg ?? 'Erro ao salvar serviço')
    } finally {
      setSaving(false)
    }
  }

  const HOUR_OPTIONS   = Array.from({ length: 13 }, (_, i) => i)
  const MINUTE_OPTIONS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(6px)', zIndex: 9998 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 480, maxWidth: '94vw', maxHeight: '90vh',
        background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(32px)',
        borderRadius: 20, border: '1px solid rgba(0,0,0,0.08)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.14)',
        zIndex: 9999, display: 'flex', flexDirection: 'column',
        fontFamily: '-apple-system,"SF Pro Display",system-ui,sans-serif',
        animation: 'modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <style>{`
          @keyframes modalIn { from { opacity:0; transform:translate(-50%,-50%) scale(0.95) } to { opacity:1; transform:translate(-50%,-50%) scale(1) } }
          .svc-input { width:100%; padding:10px 14px; border-radius:10px; border:1px solid rgba(0,0,0,0.1); background:rgba(255,255,255,0.8); color:#111827; font-size:14px; outline:none; box-sizing:border-box; font-family:-apple-system,system-ui,sans-serif; transition:border-color 0.15s,box-shadow 0.15s; }
          .svc-input:focus { border-color:rgba(220,38,38,0.4); box-shadow:0 0 0 3px rgba(220,38,38,0.08); }
          .svc-select { appearance:none; cursor:pointer; }
          .svc-label { font-size:10px; font-weight:700; color:rgba(0,0,0,0.38); letter-spacing:0.08em; text-transform:uppercase; margin-bottom:6px; display:block; }
        `}</style>

        {/* Header */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#111827', letterSpacing: '-0.3px' }}>
            {isEdit ? 'Editar serviço' : 'Novo serviço'}
          </h2>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid rgba(0,0,0,0.09)', background: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={14} color="rgba(0,0,0,0.4)" />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {error && (
            <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 10, background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.18)', color: '#b91c1c', fontSize: 13 }}>
              {error}
            </div>
          )}

          {/* Nome */}
          <div style={{ marginBottom: 16 }}>
            <label className="svc-label">Nome do serviço *</label>
            <input className="svc-input" placeholder="Ex: Corte Masculino" value={name} onChange={e => setName(e.target.value)} />
          </div>

          {/* Categoria */}
          <div style={{ marginBottom: 16 }}>
            <label className="svc-label">Categoria</label>
            <input
              className="svc-input"
              placeholder="Ex: Cabelo e Barba"
              value={category}
              onChange={e => setCategory(e.target.value)}
              list="cat-suggestions"
            />
            <datalist id="cat-suggestions">
              {categories.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>

          {/* Duração */}
          <div style={{ marginBottom: 16 }}>
            <label className="svc-label">Duração *</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <select className="svc-input svc-select" value={durationH} onChange={e => setDurationHM(Number(e.target.value), durationM)}>
                  {HOUR_OPTIONS.map(h => <option key={h} value={h}>{h}h</option>)}
                </select>
                <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: 10, color: 'rgba(0,0,0,0.3)' }}>▾</div>
              </div>
              <div style={{ position: 'relative', flex: 1 }}>
                <select className="svc-input svc-select" value={durationM} onChange={e => setDurationHM(durationH, Number(e.target.value))}>
                  {MINUTE_OPTIONS.map(m => <option key={m} value={m}>{m}min</option>)}
                </select>
                <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: 10, color: 'rgba(0,0,0,0.3)' }}>▾</div>
              </div>
            </div>
          </div>

          {/* Preço */}
          <div style={{ marginBottom: 16 }}>
            <label className="svc-label">Preço (R$)</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'rgba(0,0,0,0.4)', fontWeight: 500 }}>R$</span>
              <input
                className="svc-input"
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={price}
                onChange={e => setPrice(e.target.value)}
                style={{ paddingLeft: 36 }}
              />
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="svc-label">Descrição (opcional)</label>
            <textarea
              className="svc-input"
              placeholder="Descreva o serviço para seus clientes..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              style={{ resize: 'vertical', lineHeight: 1.5 }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px 20px', borderTop: '1px solid rgba(0,0,0,0.07)', display: 'flex', gap: 8, flexShrink: 0 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1, padding: '13px',
              background: saving ? 'rgba(220,38,38,0.25)' : 'linear-gradient(135deg,#dc2626,#b91c1c)',
              color: '#fff', border: 'none', borderRadius: 12,
              fontWeight: 600, fontSize: 15, cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: saving ? 'none' : '0 4px 16px rgba(220,38,38,0.28)',
              transition: 'all 0.2s',
            }}
          >
            {saving ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar serviço'}
          </button>
          <button onClick={onClose} style={{ padding: '13px 20px', background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, fontSize: 14, cursor: 'pointer', color: 'rgba(0,0,0,0.5)' }}>
            Cancelar
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Modal de confirmação de exclusão ─────────────────────────────────────────
function DeleteModal({ service, onConfirm, onCancel }: { service: Service; onConfirm: () => void; onCancel: () => void }) {
  return (
    <>
      <div onClick={onCancel} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(6px)', zIndex: 9998 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 320, maxWidth: '90vw', background: '#fff', borderRadius: 20,
        boxShadow: '0 24px 64px rgba(0,0,0,0.18)', zIndex: 9999,
        padding: '28px 24px 20px', textAlign: 'center',
        fontFamily: '-apple-system,"SF Pro Display",system-ui,sans-serif',
      }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
        <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 700, color: '#111827' }}>Excluir serviço</h3>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>
          Tem certeza que deseja excluir <strong>{service.name}</strong>?<br />Esta ação não pode ser desfeita.
        </p>
        <button onClick={onConfirm} style={{ width: '100%', padding: '12px', marginBottom: 8, background: 'linear-gradient(135deg,#dc2626,#b91c1c)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
          Sim, excluir
        </button>
        <button onClick={onCancel} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, fontSize: 14, cursor: 'pointer', color: 'rgba(0,0,0,0.5)' }}>
          Cancelar
        </button>
      </div>
    </>
  )
}

// ─── Page principal ───────────────────────────────────────────────────────────
export default function ServicosPage() {
  const [services,  setServices]  = useState<Service[]>([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [modal,     setModal]     = useState<'create' | Service | null>(null)
  const [deleting,  setDeleting]  = useState<Service | null>(null)
  const [toast,     setToast]     = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2800)
  }

  const fetchServices = useCallback(async () => {
    try {
      const res  = await api.get('/services')
      const data = res.data?.data ?? res.data
      setServices(Array.isArray(data) ? data : [])
    } catch {
      showToast('Erro ao carregar serviços', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchServices() }, [fetchServices])

  async function handleDelete(service: Service) {
    try {
      await api.delete(`/services/${service.id}`)
      setServices(prev => prev.filter(s => s.id !== service.id))
      showToast(`"${service.name}" excluído`, 'success')
    } catch {
      showToast('Erro ao excluir serviço', 'error')
    } finally {
      setDeleting(null)
    }
  }

  function handleSaved(saved: Service) {
    setServices(prev => {
      const idx = prev.findIndex(s => s.id === saved.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = saved
        return next
      }
      return [...prev, saved]
    })
    showToast(modal === 'create' ? 'Serviço criado!' : 'Serviço atualizado!', 'success')
  }

  // Filtro e agrupamento
  const filtered = services.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.category ?? '').toLowerCase().includes(search.toLowerCase())
  )
  const grouped    = groupByCategory(filtered)
  const categories = [...new Set(services.map(s => s.category?.trim()).filter(Boolean) as string[])]

  return (
    <>
      <style>{`
        @keyframes toastIn { from { opacity:0; transform:translateX(-50%) translateY(10px) } to { opacity:1; transform:translateX(-50%) translateY(0) } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        .svc-row { display:flex; align-items:center; gap:12px; padding:14px 20px; cursor:pointer; transition:background 0.12s; border-bottom:1px solid rgba(0,0,0,0.05); }
        .svc-row:last-child { border-bottom:none; }
        .svc-row:hover { background:rgba(220,38,38,0.03); }
        .svc-row:hover .svc-actions { opacity:1; }
        .svc-actions { opacity:0; display:flex; gap:4px; transition:opacity 0.15s; }
        .icon-btn { width:30px; height:30px; border-radius:8px; border:1px solid rgba(0,0,0,0.08); background:rgba(255,255,255,0.8); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.15s; }
        .icon-btn:hover { background:rgba(220,38,38,0.08); border-color:rgba(220,38,38,0.2); }
        .icon-btn.del:hover { background:rgba(220,38,38,0.1); }
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} />}
      {modal === 'create' && <ServiceModal service={null} categories={categories} onClose={() => setModal(null)} onSaved={handleSaved} />}
      {modal && modal !== 'create' && <ServiceModal service={modal as Service} categories={categories} onClose={() => setModal(null)} onSaved={handleSaved} />}
      {deleting && <DeleteModal service={deleting} onConfirm={() => handleDelete(deleting)} onCancel={() => setDeleting(null)} />}

      <div style={{ maxWidth: 760, animation: 'fadeUp 0.3s ease', fontFamily: '-apple-system,"SF Pro Display",system-ui,sans-serif' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em', color: '#0f0f14' }}>
              Serviços
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: 'rgba(0,0,0,0.45)' }}>
              {services.length} serviço{services.length !== 1 ? 's' : ''} cadastrado{services.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setModal('create')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 18px', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg,#dc2626,#b91c1c)',
              color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(220,38,38,0.28)', flexShrink: 0,
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            Novo serviço
          </button>
        </div>

        {/* Busca */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <Search size={15} color="rgba(0,0,0,0.3)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Pesquisar serviços..."
            style={{
              width: '100%', padding: '11px 14px 11px 38px', borderRadius: 12,
              border: '1px solid rgba(0,0,0,0.09)', background: 'rgba(255,255,255,0.88)',
              fontSize: 14, outline: 'none', boxSizing: 'border-box',
              fontFamily: '-apple-system,system-ui,sans-serif',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <X size={14} color="rgba(0,0,0,0.3)" />
            </button>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(220,38,38,0.15)', borderTopColor: '#dc2626', animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}

        {/* Lista agrupada por categoria */}
        {!loading && (
          Object.keys(grouped).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 32px', background: 'rgba(255,255,255,0.85)', borderRadius: 16, border: '1px solid rgba(0,0,0,0.07)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✂️</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 6 }}>
                {search ? 'Nenhum serviço encontrado' : 'Nenhum serviço cadastrado'}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.4)', marginBottom: 20 }}>
                {search ? 'Tente outro termo de busca.' : 'Crie seu primeiro serviço para começar.'}
              </div>
              {!search && (
                <button onClick={() => setModal('create')} style={{ padding: '10px 20px', borderRadius: 10, background: 'linear-gradient(135deg,#dc2626,#b91c1c)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
                  + Criar serviço
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {Object.entries(grouped).map(([cat, items]) => (
                <div key={cat} style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(20px)', borderRadius: 16, border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                  {/* Header da categoria */}
                  <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      {cat}
                    </span>
                    <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.3)' }}>{items.length} serviço{items.length !== 1 ? 's' : ''}</span>
                  </div>

                  {/* Linhas de serviço */}
                  {items.map(s => (
                    <div key={s.id} className="svc-row" onClick={() => setModal(s)}>
                      {/* Barra colorida */}
                      <div style={{ width: 3, height: 36, borderRadius: 2, background: 'linear-gradient(135deg,#dc2626,#b91c1c)', flexShrink: 0 }} />

                      {/* Nome + duração */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <Clock size={11} color="rgba(0,0,0,0.35)" />
                          <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)' }}>{formatDuration(s.duration)}</span>
                        </div>
                      </div>

                      {/* Preço */}
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#111827', minWidth: 80, textAlign: 'right' }}>
                        {formatPrice(s.price)}
                      </span>

                      {/* Ações */}
                      <div className="svc-actions" onClick={e => e.stopPropagation()}>
                        <button className="icon-btn" onClick={() => setModal(s)} title="Editar">
                          <Pencil size={13} color="rgba(0,0,0,0.5)" />
                        </button>
                        <button className="icon-btn del" onClick={() => setDeleting(s)} title="Excluir">
                          <Trash2 size={13} color="#dc2626" />
                        </button>
                      </div>

                      <ChevronRight size={15} color="rgba(0,0,0,0.2)" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </>
  )
}