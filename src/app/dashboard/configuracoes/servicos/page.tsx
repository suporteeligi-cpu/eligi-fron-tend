'use client'
// src/app/(dashboard)/configuracoes/servicos/page.tsx
// Versão com seletor de cor do serviço

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Scissors, Plus, Search, Clock, Pencil, Trash2, X, ChevronRight } from 'lucide-react'
import api from '@/shared/lib/apiClient'

// ─── Paleta de cores ──────────────────────────────────────────────────────────
const SERVICE_COLORS = [
  '#e8622a','#e84242','#c084e8','#6dd44a','#a78fe8','#7de8e8','#94b8e8','#4a94e8','#3d3dba','#9c3dba','#4aba6d',
  '#cce84a','#e87d2a','#8b6b42','#4a6de8','#e8a094','#e84aab','#e83d3d','#b8e8f8','#c084d4','#f8a0c0','#bae84a',
  '#1a8b8b','#f8a0d4','#ba1a5e','#e8b42a','#f8e42a','#a0e8d4','#8b5e2a','#1a8b42','#e89c2a','#d4e82a','#2ababa',
]
const DEFAULT_COLOR = '#dc2626'

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Service {
  id: string; name: string; duration: number; price: number | null
  description: string | null; category: string | null; color: string | null; active: boolean
}

function formatDuration(min: number): string {
  const h = Math.floor(min / 60), m = min % 60
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

// ─── Seletor de cor ───────────────────────────────────────────────────────────
function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ position: 'relative' }}>
      {/* Botão trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 14px', borderRadius: 10,
          border: '1px solid rgba(0,0,0,0.1)',
          background: 'rgba(255,255,255,0.8)',
          cursor: 'pointer', transition: 'border-color .15s',
        }}
      >
        <div style={{ width: 22, height: 22, borderRadius: 6, background: value, boxShadow: '0 1px 4px rgba(0,0,0,0.18)', flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>Cor do serviço</span>
        <span style={{ fontSize: 10, color: 'rgba(0,0,0,0.3)' }}>▾</span>
      </button>

      {/* Dropdown da paleta */}
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 100 }} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', left: 0,
            background: '#fff', borderRadius: 16,
            border: '1px solid rgba(0,0,0,0.09)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
            padding: 16, zIndex: 101,
            width: 280,
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Cor do serviço</span>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <X size={14} color="rgba(0,0,0,0.4)" />
              </button>
            </div>

            {/* Cor padrão */}
            <div
              onClick={() => { onChange(DEFAULT_COLOR); setOpen(false) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 10, cursor: 'pointer',
                background: value === DEFAULT_COLOR ? 'rgba(220,38,38,0.06)' : 'transparent',
                border: value === DEFAULT_COLOR ? '1px solid rgba(220,38,38,0.2)' : '1px solid transparent',
                marginBottom: 12, transition: 'all .15s',
              }}
            >
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#dc2626,#b91c1c)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>Cor padrão Eligi</div>
                <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)' }}>Vermelho padrão do sistema</div>
              </div>
              {value === DEFAULT_COLOR && <span style={{ marginLeft: 'auto', color: '#dc2626', fontSize: 16 }}>✓</span>}
            </div>

            {/* Grade de cores */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(11, 1fr)', gap: 5 }}>
              {SERVICE_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => { onChange(color); setOpen(false) }}
                  style={{
                    width: 20, height: 20, borderRadius: 5,
                    background: color,
                    border: value === color ? '2px solid #111827' : '2px solid transparent',
                    cursor: 'pointer', position: 'relative',
                    transition: 'transform .12s, border-color .12s',
                    outline: 'none',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.2)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  {value === color && (
                    <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 700 }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
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
      whiteSpace: 'nowrap', animation: 'toastIn .25s cubic-bezier(0.34,1.56,0.64,1)',
    }}>{message}</div>
  )
}

// ─── Modal de serviço ─────────────────────────────────────────────────────────
function ServiceModal({ service, categories, onClose, onSaved }: {
  service: Service | null; categories: string[]
  onClose: () => void; onSaved: (s: Service) => void
}) {
  const isEdit = !!service
  const [name,        setName]        = useState(service?.name        ?? '')
  const [category,    setCategory]    = useState(service?.category    ?? '')
  const [duration,    setDuration]    = useState(service?.duration    ?? 30)
  const [price,       setPrice]       = useState<string>(service?.price != null ? String(service.price) : '')
  const [description, setDescription] = useState(service?.description ?? '')
  const [color,       setColor]       = useState(service?.color       ?? DEFAULT_COLOR)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  const durationH = Math.floor(duration / 60)
  const durationM = duration % 60
  const HOUR_OPTS = Array.from({ length: 13 }, (_, i) => i)
  const MIN_OPTS  = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

  async function handleSave() {
    if (!name.trim()) { setError('Nome é obrigatório'); return }
    if (duration < 5)  { setError('Duração mínima é 5 minutos'); return }
    try {
      setSaving(true); setError(null)
      const payload = {
        name: name.trim(), duration, color,
        price: price !== '' ? Number(price) : undefined,
        description: description.trim() || undefined,
        category: category.trim() || undefined,
      }
      const res = isEdit
        ? await api.put(`/services/${service!.id}`, payload)
        : await api.post('/services', payload)
      onSaved(res.data?.data ?? res.data)
      onClose()
    } catch (e: unknown) {
      setError((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Erro ao salvar')
    } finally { setSaving(false) }
  }

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.25)', backdropFilter:'blur(6px)', zIndex:9998 }} />
      <div style={{
        position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
        width:480, maxWidth:'94vw', maxHeight:'90vh',
        background:'rgba(255,255,255,0.96)', backdropFilter:'blur(32px)',
        borderRadius:20, border:'1px solid rgba(0,0,0,0.08)',
        boxShadow:'0 24px 64px rgba(0,0,0,0.14)',
        zIndex:9999, display:'flex', flexDirection:'column',
        fontFamily:'-apple-system,"SF Pro Display",system-ui,sans-serif',
        animation:'modalIn .25s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <style>{`
          @keyframes modalIn{from{opacity:0;transform:translate(-50%,-50%) scale(0.95)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
          .si{width:100%;padding:10px 14px;border-radius:10px;border:1px solid rgba(0,0,0,0.1);background:rgba(255,255,255,0.8);color:#111827;font-size:14px;outline:none;box-sizing:border-box;font-family:-apple-system,system-ui,sans-serif;transition:border-color .15s,box-shadow .15s}
          .si:focus{border-color:rgba(220,38,38,0.4);box-shadow:0 0 0 3px rgba(220,38,38,0.08)}
          .sl{font-size:10px;font-weight:700;color:rgba(0,0,0,0.38);letter-spacing:.08em;text-transform:uppercase;margin-bottom:6px;display:block}
        `}</style>

        {/* Header com preview da cor */}
        <div style={{ height: 6, background: `linear-gradient(90deg, ${color}, ${color}cc)`, borderRadius: '20px 20px 0 0' }} />
        <div style={{ padding:'16px 20px 14px', borderBottom:'1px solid rgba(0,0,0,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:'#111827' }}>{isEdit ? 'Editar serviço' : 'Novo serviço'}</h2>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:'50%', border:'1px solid rgba(0,0,0,0.09)', background:'rgba(255,255,255,0.6)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X size={14} color="rgba(0,0,0,0.4)" />
          </button>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:20 }}>
          {error && <div style={{ marginBottom:16, padding:'10px 14px', borderRadius:10, background:'rgba(220,38,38,0.06)', border:'1px solid rgba(220,38,38,0.18)', color:'#b91c1c', fontSize:13 }}>{error}</div>}

          <div style={{ marginBottom:16 }}>
            <label className="sl">Nome *</label>
            <input className="si" placeholder="Ex: Corte Masculino" value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div style={{ marginBottom:16 }}>
            <label className="sl">Categoria</label>
            <input className="si" placeholder="Ex: Cabelo e Barba" value={category} onChange={e => setCategory(e.target.value)} list="cats" />
            <datalist id="cats">{categories.map(c => <option key={c} value={c} />)}</datalist>
          </div>

          <div style={{ marginBottom:16 }}>
            <label className="sl">Duração *</label>
            <div style={{ display:'flex', gap:8 }}>
              {[
                { val: durationH, opts: HOUR_OPTS,  suffix: 'h',   set: (v: number) => setDuration(v * 60 + durationM) },
                { val: durationM, opts: MIN_OPTS,   suffix: 'min', set: (v: number) => setDuration(durationH * 60 + v) },
              ].map(({ val, opts, suffix, set }) => (
                <div key={suffix} style={{ position:'relative', flex:1 }}>
                  <select className="si" value={val} onChange={e => set(Number(e.target.value))} style={{ appearance:'none', cursor:'pointer' }}>
                    {opts.map(o => <option key={o} value={o}>{o}{suffix}</option>)}
                  </select>
                  <div style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none', fontSize:10, color:'rgba(0,0,0,0.3)' }}>▾</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom:16 }}>
            <label className="sl">Preço (R$)</label>
            <div style={{ position:'relative' }}>
              <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:13, color:'rgba(0,0,0,0.4)', fontWeight:500 }}>R$</span>
              <input className="si" type="number" min="0" step="0.01" placeholder="0,00" value={price} onChange={e => setPrice(e.target.value)} style={{ paddingLeft:36 }} />
            </div>
          </div>

          {/* Seletor de cor */}
          <div style={{ marginBottom:16 }}>
            <label className="sl">Cor na agenda</label>
            <ColorPicker value={color} onChange={setColor} />
          </div>

          <div>
            <label className="sl">Descrição (opcional)</label>
            <textarea className="si" placeholder="Descreva o serviço..." value={description} onChange={e => setDescription(e.target.value)} rows={3} style={{ resize:'vertical', lineHeight:1.5 }} />
          </div>
        </div>

        <div style={{ padding:'14px 20px 20px', borderTop:'1px solid rgba(0,0,0,0.07)', display:'flex', gap:8, flexShrink:0 }}>
          <button onClick={handleSave} disabled={saving} style={{ flex:1, padding:13, background:saving?'rgba(220,38,38,0.25)':`linear-gradient(135deg,${color},${color}cc)`, color:'#fff', border:'none', borderRadius:12, fontWeight:600, fontSize:15, cursor:saving?'not-allowed':'pointer', transition:'all .2s' }}>
            {saving ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar serviço'}
          </button>
          <button onClick={onClose} style={{ padding:'13px 20px', background:'rgba(0,0,0,0.05)', border:'1px solid rgba(0,0,0,0.08)', borderRadius:12, fontSize:14, cursor:'pointer', color:'rgba(0,0,0,0.5)' }}>Cancelar</button>
        </div>
      </div>
    </>
  )
}

// ─── Modal de exclusão ────────────────────────────────────────────────────────
function DeleteModal({ service, onConfirm, onCancel }: { service: Service; onConfirm: () => void; onCancel: () => void }) {
  return (
    <>
      <div onClick={onCancel} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.25)', backdropFilter:'blur(6px)', zIndex:9998 }} />
      <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:320, maxWidth:'90vw', background:'#fff', borderRadius:20, boxShadow:'0 24px 64px rgba(0,0,0,0.18)', zIndex:9999, padding:'28px 24px 20px', textAlign:'center', fontFamily:'-apple-system,"SF Pro Display",system-ui,sans-serif' }}>
        <div style={{ fontSize:36, marginBottom:12 }}>🗑️</div>
        <h3 style={{ margin:'0 0 8px', fontSize:17, fontWeight:700, color:'#111827' }}>Excluir serviço</h3>
        <p style={{ margin:'0 0 20px', fontSize:13, color:'#6b7280', lineHeight:1.5 }}>Tem certeza que deseja excluir <strong>{service.name}</strong>?</p>
        <button onClick={onConfirm} style={{ width:'100%', padding:12, marginBottom:8, background:'linear-gradient(135deg,#dc2626,#b91c1c)', color:'#fff', border:'none', borderRadius:12, fontWeight:600, fontSize:14, cursor:'pointer' }}>Sim, excluir</button>
        <button onClick={onCancel} style={{ width:'100%', padding:10, background:'rgba(0,0,0,0.04)', border:'1px solid rgba(0,0,0,0.08)', borderRadius:12, fontSize:14, cursor:'pointer', color:'rgba(0,0,0,0.5)' }}>Cancelar</button>
      </div>
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ConfigServicosPage() {
  const router = useRouter()
  const [services, setServices] = useState<Service[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [modal,    setModal]    = useState<'create' | Service | null>(null)
  const [deleting, setDeleting] = useState<Service | null>(null)
  const [toast,    setToast]    = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2800)
  }

  const fetchServices = useCallback(async () => {
    try {
      const res  = await api.get('/services')
      const data = res.data?.data ?? res.data
      setServices(Array.isArray(data) ? data : [])
    } catch { showToast('Erro ao carregar serviços', 'error') }
    finally  { setLoading(false) }
  }, [])

  useEffect(() => { fetchServices() }, [fetchServices])

  async function handleDelete(s: Service) {
    try {
      await api.delete(`/services/${s.id}`)
      setServices(prev => prev.filter(p => p.id !== s.id))
      showToast(`"${s.name}" excluído`, 'success')
    } catch { showToast('Erro ao excluir', 'error') }
    finally  { setDeleting(null) }
  }

  function handleSaved(saved: Service) {
    setServices(prev => {
      const idx = prev.findIndex(s => s.id === saved.id)
      if (idx >= 0) { const n = [...prev]; n[idx] = saved; return n }
      return [...prev, saved]
    })
    showToast(modal === 'create' ? 'Serviço criado!' : 'Serviço atualizado!', 'success')
  }

  const filtered   = services.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.category ?? '').toLowerCase().includes(search.toLowerCase())
  )
  const grouped    = groupByCategory(filtered)
  const categories = [...new Set(services.map(s => s.category?.trim()).filter(Boolean) as string[])]

  return (
    <>
      <style>{`
        @keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .svc-row{display:flex;align-items:center;gap:12px;padding:14px 20px;cursor:pointer;transition:background .12s;border-bottom:1px solid rgba(0,0,0,0.05)}
        .svc-row:last-child{border-bottom:none}
        .svc-row:hover{background:rgba(220,38,38,0.03)}
        .svc-row:hover .svc-acts{opacity:1}
        .svc-acts{opacity:0;display:flex;gap:4px;transition:opacity .15s}
        .ib{width:30px;height:30px;border-radius:8px;border:1px solid rgba(0,0,0,0.08);background:rgba(255,255,255,0.8);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s}
        .ib:hover{background:rgba(220,38,38,0.08);border-color:rgba(220,38,38,0.2)}
        .back-btn:hover{background:rgba(220,38,38,0.06)!important}
        .back-btn:hover svg{stroke:#dc2626!important}
      `}</style>

      {toast    && <Toast message={toast.message} type={toast.type} />}
      {modal === 'create' && <ServiceModal service={null} categories={categories} onClose={() => setModal(null)} onSaved={handleSaved} />}
      {modal && modal !== 'create' && <ServiceModal service={modal as Service} categories={categories} onClose={() => setModal(null)} onSaved={handleSaved} />}
      {deleting && <DeleteModal service={deleting} onConfirm={() => handleDelete(deleting)} onCancel={() => setDeleting(null)} />}

      <div style={{ maxWidth:760, animation:'fadeUp 0.3s ease', fontFamily:'-apple-system,"SF Pro Display",system-ui,sans-serif' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button className="back-btn" onClick={() => router.push('/dashboard/configuracoes')} style={{ display:'flex', alignItems:'center', justifyContent:'center', width:34, height:34, borderRadius:10, border:'1px solid rgba(0,0,0,0.09)', background:'rgba(255,255,255,0.8)', cursor:'pointer', flexShrink:0, transition:'background .15s' }}>
              <ChevronLeft size={18} color="rgba(0,0,0,0.5)" strokeWidth={2} />
            </button>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#dc2626,#b91c1c)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(220,38,38,0.28)', flexShrink:0 }}>
                <Scissors size={18} color="#fff" strokeWidth={1.8} />
              </div>
              <div>
                <h2 style={{ margin:0, fontSize:18, fontWeight:700, letterSpacing:'-0.02em', color:'#0f0f14' }}>Configurações de serviços</h2>
                <p style={{ margin:0, fontSize:12, color:'rgba(0,0,0,0.4)' }}>Configurações › Serviços</p>
              </div>
            </div>
          </div>
          <button onClick={() => setModal('create')} style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 16px', borderRadius:12, border:'none', background:'linear-gradient(135deg,#dc2626,#b91c1c)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', boxShadow:'0 4px 14px rgba(220,38,38,0.28)', flexShrink:0 }}>
            <Plus size={15} strokeWidth={2.5} /> Novo serviço
          </button>
        </div>

        {/* Busca */}
        <div style={{ position:'relative', marginBottom:20 }}>
          <Search size={15} color="rgba(0,0,0,0.3)" style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar serviços..." style={{ width:'100%', padding:'11px 14px 11px 38px', borderRadius:12, border:'1px solid rgba(0,0,0,0.09)', background:'rgba(255,255,255,0.88)', fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'-apple-system,system-ui,sans-serif', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }} />
          {search && <button onClick={() => setSearch('')} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center' }}><X size={14} color="rgba(0,0,0,0.3)" /></button>}
        </div>

        {loading && (
          <div style={{ display:'flex', justifyContent:'center', padding:48 }}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{ width:32, height:32, borderRadius:'50%', border:'3px solid rgba(220,38,38,0.15)', borderTopColor:'#dc2626', animation:'spin 0.8s linear infinite' }} />
          </div>
        )}

        {!loading && (
          Object.keys(grouped).length === 0 ? (
            <div style={{ textAlign:'center', padding:'64px 32px', background:'rgba(255,255,255,0.85)', borderRadius:16, border:'1px solid rgba(0,0,0,0.07)' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>✂️</div>
              <div style={{ fontSize:16, fontWeight:600, color:'#111827', marginBottom:6 }}>{search ? 'Nenhum serviço encontrado' : 'Nenhum serviço cadastrado'}</div>
              <div style={{ fontSize:13, color:'rgba(0,0,0,0.4)', marginBottom:20 }}>{search ? 'Tente outro termo.' : 'Crie seu primeiro serviço.'}</div>
              {!search && <button onClick={() => setModal('create')} style={{ padding:'10px 20px', borderRadius:10, background:'linear-gradient(135deg,#dc2626,#b91c1c)', color:'#fff', border:'none', fontWeight:600, cursor:'pointer', fontSize:14 }}>+ Criar serviço</button>}
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {Object.entries(grouped).map(([cat, items]) => (
                <div key={cat} style={{ background:'rgba(255,255,255,0.88)', backdropFilter:'blur(20px)', borderRadius:16, border:'1px solid rgba(0,0,0,0.07)', boxShadow:'0 2px 12px rgba(0,0,0,0.05)', overflow:'hidden' }}>
                  <div style={{ padding:'12px 20px', borderBottom:'1px solid rgba(0,0,0,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <span style={{ fontSize:11, fontWeight:700, color:'rgba(0,0,0,0.35)', letterSpacing:'0.08em', textTransform:'uppercase' }}>{cat}</span>
                    <span style={{ fontSize:11, color:'rgba(0,0,0,0.3)' }}>{items.length} serviço{items.length !== 1 ? 's' : ''}</span>
                  </div>
                  {items.map(s => (
                    <div key={s.id} className="svc-row" onClick={() => setModal(s)}>
                      {/* Barra colorida com a cor do serviço */}
                      <div style={{ width:3, height:36, borderRadius:2, background: s.color ?? DEFAULT_COLOR, flexShrink:0 }} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:14, fontWeight:600, color:'#111827', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{s.name}</div>
                        <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:2 }}>
                          <Clock size={11} color="rgba(0,0,0,0.35)" />
                          <span style={{ fontSize:12, color:'rgba(0,0,0,0.4)' }}>{formatDuration(s.duration)}</span>
                        </div>
                      </div>
                      <span style={{ fontSize:14, fontWeight:600, color:'#111827', minWidth:80, textAlign:'right' }}>{formatPrice(s.price)}</span>
                      <div className="svc-acts" onClick={e => e.stopPropagation()}>
                        <button className="ib" onClick={() => setModal(s)} title="Editar"><Pencil size={13} color="rgba(0,0,0,0.5)" /></button>
                        <button className="ib" onClick={() => setDeleting(s)} title="Excluir"><Trash2 size={13} color="#dc2626" /></button>
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