'use client'
// src/app/dashboard/clientes/page.tsx

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, UserPlus, Phone, Calendar, ChevronRight } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { colors, typography, radius, shadows, transitions, glass } from '@/shared/theme'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
dayjs.locale('pt-br')

interface ClientItem {
  id:            string
  name:          string
  phone:         string
  createdAt:     string
  totalBookings: number
  lastVisit:     string | null
  lastStatus:    string | null
}

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function formatPhone(p: string): string {
  const d = p.replace(/\D/g, '')
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
  return p
}

const AVATAR_COLORS = [
  colors.red.gradient,
  'linear-gradient(135deg,#475569,#334155)',
  'linear-gradient(135deg,#7c3aed,#6d28d9)',
  'linear-gradient(135deg,#0891b2,#0e7490)',
  'linear-gradient(135deg,#059669,#047857)',
  'linear-gradient(135deg,#d97706,#b45309)',
]

function avatarColor(name: string): string {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

export default function ClientesPage() {
  const router  = useRouter()
  const [clients, setClients]   = useState<ClientItem[]>([])
  const [total,   setTotal]     = useState(0)
  const [page,    setPage]      = useState(1)
  const [pages,   setPages]     = useState(1)
  const [search,  setSearch]    = useState('')
  const [loading, setLoading]   = useState(true)
  const [query,   setQuery]     = useState('')

  const fetchClients = useCallback(async (q: string, p: number) => {
    try {
      setLoading(true)
      const res  = await api.get('/clients', { params: { search: q || undefined, page: p, limit: 30 } })
      const data = res.data?.data ?? res.data
      setClients(data.clients ?? [])
      setTotal(data.total ?? 0)
      setPage(data.page ?? 1)
      setPages(data.pages ?? 1)
    } catch { setClients([]) }
    finally  { setLoading(false) }
  }, [])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchClients(search, 1) }, 350)
    return () => clearTimeout(t)
  }, [search, fetchClients])

  useEffect(() => { fetchClients(query, page) }, [page, fetchClients, query])

  return (
    <>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .cl-row{display:flex;align-items:center;gap:14px;padding:14px 20px;cursor:pointer;transition:background ${transitions.fast};border-bottom:1px solid ${colors.gray.border}}
        .cl-row:last-child{border-bottom:none}
        .cl-row:hover{background:${colors.red.subtle}}
        .cl-row:hover .cl-arrow{opacity:1}
        .cl-arrow{opacity:0;transition:opacity ${transitions.fast}}
        .pg-btn{padding:6px 12px;border-radius:${radius.sm}px;border:1px solid ${colors.gray.borderMd};background:${colors.background.surface};font-size:${typography.scale.sm}px;font-weight:${typography.weight.semibold};cursor:pointer;color:${colors.gray[700]};transition:all ${transitions.fast}}
        .pg-btn:hover:not(:disabled){border-color:${colors.red.borderHover};color:${colors.red.DEFAULT}}
        .pg-btn:disabled{opacity:0.4;cursor:not-allowed}
      `}</style>

      <div style={{ maxWidth:800, animation:'fadeUp 0.3s ease', fontFamily:typography.fontFamily }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, gap:12 }}>
          <div>
            <h2 style={{ margin:0, fontSize:typography.scale['2xl'], fontWeight:typography.weight.bold, letterSpacing:'-0.025em', color:typography.color.primary }}>
              Clientes
            </h2>
            <p style={{ margin:'4px 0 0', fontSize:typography.scale.base, color:typography.color.muted }}>
              {total > 0 ? `${total} cliente${total !== 1 ? 's' : ''} cadastrado${total !== 1 ? 's' : ''}` : 'Nenhum cliente ainda'}
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard/clientes/novo')}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 16px', borderRadius:radius.md, border:'none', background:colors.red.gradient, color:'#fff', fontSize:typography.scale.base, fontWeight:typography.weight.semibold, cursor:'pointer', boxShadow:shadows.redMd, flexShrink:0 }}
          >
            <UserPlus size={15} strokeWidth={2.5} /> Novo cliente
          </button>
        </div>

        {/* Busca */}
        <div style={{ position:'relative', marginBottom:20 }}>
          <Search size={15} color={colors.gray.dimText} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome ou telefone..."
            style={{ width:'100%', padding:'11px 14px 11px 40px', borderRadius:radius.md, border:`1px solid ${colors.gray.borderMd}`, background:glass.surface.default.background, backdropFilter:glass.surface.default.backdropFilter, fontSize:typography.scale.base, outline:'none', boxSizing:'border-box', fontFamily:typography.fontFamily, boxShadow:shadows.sm, color:typography.color.primary }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center' }}>
              <X size={14} color={colors.gray.dimText} />
            </button>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display:'flex', justifyContent:'center', padding:48 }}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{ width:28, height:28, borderRadius:'50%', border:`3px solid ${colors.red.subtle}`, borderTopColor:colors.red.DEFAULT, animation:'spin 0.8s linear infinite' }} />
          </div>
        )}

        {/* Lista */}
        {!loading && (
          clients.length === 0 ? (
            <div style={{ textAlign:'center', padding:'64px 32px', background:glass.surface.default.background, backdropFilter:glass.surface.default.backdropFilter, borderRadius:radius.xl, border:`1px solid ${colors.gray.border}` }}>
              <div style={{ fontSize:40, marginBottom:12 }}>👥</div>
              <div style={{ fontSize:16, fontWeight:typography.weight.semibold, color:typography.color.primary, marginBottom:6 }}>
                {search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
              </div>
              <div style={{ fontSize:typography.scale.base, color:typography.color.muted, marginBottom:20 }}>
                {search ? 'Tente outro termo.' : 'Adicione seu primeiro cliente.'}
              </div>
              {!search && (
                <button onClick={() => router.push('/dashboard/clientes/novo')} style={{ padding:'10px 20px', borderRadius:radius.sm, background:colors.red.gradient, color:'#fff', border:'none', fontWeight:typography.weight.semibold, cursor:'pointer', fontSize:typography.scale.base, boxShadow:shadows.redSm }}>
                  + Novo cliente
                </button>
              )}
            </div>
          ) : (
            <>
              <div style={{ background:glass.surface.default.background, backdropFilter:glass.surface.default.backdropFilter, borderRadius:radius.xl, border:`1px solid ${colors.gray.border}`, boxShadow:shadows.sm, overflow:'hidden' }}>
                {clients.map(c => (
                  <div key={c.id} className="cl-row" onClick={() => router.push(`/dashboard/clientes/${c.id}`)}>
                    {/* Avatar */}
                    <div style={{ width:42, height:42, borderRadius:radius.full, background:avatarColor(c.name), color:'#fff', fontSize:typography.scale.base, fontWeight:typography.weight.bold, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:shadows.sm }}>
                      {getInitials(c.name)}
                    </div>

                    {/* Info */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:typography.scale.md, fontWeight:typography.weight.semibold, color:typography.color.primary, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                        {c.name}
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:2, flexWrap:'wrap' }}>
                        <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:typography.scale.sm, color:typography.color.muted }}>
                          <Phone size={11} color={colors.gray.dimText} />
                          {formatPhone(c.phone)}
                        </span>
                        {c.lastVisit && (
                          <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:typography.scale.sm, color:typography.color.muted }}>
                            <Calendar size={11} color={colors.gray.dimText} />
                            {dayjs(c.lastVisit).format('DD MMM YYYY')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Agendamentos */}
                    <div style={{ textAlign:'center', flexShrink:0 }}>
                      <div style={{ fontSize:typography.scale.lg, fontWeight:typography.weight.bold, color:typography.color.primary }}>{c.totalBookings}</div>
                      <div style={{ fontSize:typography.scale.xs, color:typography.color.muted }}>agend.</div>
                    </div>

                    <ChevronRight size={15} color={colors.gray.dimText} className="cl-arrow" />
                  </div>
                ))}
              </div>

              {/* Paginação */}
              {pages > 1 && (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:20 }}>
                  <button className="pg-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Anterior</button>
                  <span style={{ fontSize:typography.scale.sm, color:typography.color.muted, padding:'0 8px' }}>{page} / {pages}</span>
                  <button className="pg-btn" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Próxima →</button>
                </div>
              )}
            </>
          )
        )}
      </div>
    </>
  )
}