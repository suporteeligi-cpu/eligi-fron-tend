'use client'
// src/app/dashboard/clientes/page.tsx

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, UserPlus, Phone, Calendar, ChevronRight, Users, ArrowUpDown, TrendingUp, CheckCircle, XCircle } from 'lucide-react'
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
  completed:     number
  canceled:      number
  totalRevenue:  number
  lastVisit:     string | null
  lastStatus:    string | null
}

const AVATAR_COLORS = [
  colors.red.gradient,
  'linear-gradient(135deg,#475569,#334155)',
  'linear-gradient(135deg,#7c3aed,#6d28d9)',
  'linear-gradient(135deg,#0891b2,#0e7490)',
  'linear-gradient(135deg,#059669,#047857)',
  'linear-gradient(135deg,#d97706,#b45309)',
]
function avatarColor(name: string) { return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length] }
function getInitials(name: string) { return name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase() }
function formatPhone(p: string) {
  const d = p.replace(/\D/g,'')
  if (d.length===11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
  if (d.length===10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
  return p
}
function fmtRevenue(v: number) {
  if (v === 0) return '—'
  return `R$ ${v.toFixed(2).replace('.',',')}`
}

const ORDER_OPTIONS = [
  { value:'createdAt:desc', label:'Mais recentes'       },
  { value:'createdAt:asc',  label:'Mais antigos'        },
  { value:'name:asc',       label:'Nome A–Z'            },
  { value:'name:desc',      label:'Nome Z–A'            },
  { value:'bookings:desc',  label:'Mais agendamentos'   },
]

export default function ClientesPage() {
  const router = useRouter()
  const [clients,  setClients]  = useState<ClientItem[]>([])
  const [total,    setTotal]    = useState(0)
  const [totalAll, setTotalAll] = useState(0)
  const [page,     setPage]     = useState(1)
  const [pages,    setPages]    = useState(1)
  const [search,   setSearch]   = useState('')
  const [sort,     setSort]     = useState('createdAt:desc')
  const [loading,  setLoading]  = useState(true)

  const fetchClients = useCallback(async (q: string, p: number, s: string) => {
    try {
      setLoading(true)
      const [orderBy, order] = s.split(':')
      const res  = await api.get('/clients', { params: { search: q || undefined, page: p, limit: 30, orderBy, order } })
      const data = res.data?.data ?? res.data
      setClients(data.clients ?? [])
      setTotal(data.total ?? 0)
      setTotalAll(data.stats?.totalClients ?? data.total ?? 0)
      setPage(data.page ?? 1)
      setPages(data.pages ?? 1)
    } catch { setClients([]) }
    finally  { setLoading(false) }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchClients(search, 1, sort) }, 350)
    return () => clearTimeout(t)
  }, [search, sort, fetchClients])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchClients(search, page, sort) }, [page])

  // Métricas agregadas da página atual
  const totalRevenuePage  = clients.reduce((s, c) => s + c.totalRevenue, 0)
  const totalCompletedPage= clients.reduce((s, c) => s + c.completed, 0)
  const totalCanceledPage = clients.reduce((s, c) => s + c.canceled, 0)

  return (
    <>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .cl-row{display:flex;align-items:center;gap:14px;padding:13px 20px;cursor:pointer;transition:background ${transitions.fast};border-bottom:1px solid ${colors.gray.border}}
        .cl-row:last-child{border-bottom:none}
        .cl-row:hover{background:${colors.red.subtle}}
        .cl-row:hover .cl-arrow{opacity:1;transform:translateX(2px)}
        .cl-arrow{opacity:0;transition:all ${transitions.fast}}
        .pg-btn{padding:7px 14px;border-radius:${radius.sm}px;border:1px solid ${colors.gray.borderMd};background:${colors.background.surface};font-size:${typography.scale.sm}px;font-weight:${typography.weight.semibold};cursor:pointer;color:${colors.gray[700]};transition:all ${transitions.fast}}
        .pg-btn:hover:not(:disabled){border-color:${colors.red.borderHover};color:${colors.red.DEFAULT}}
        .pg-btn:disabled{opacity:0.35;cursor:not-allowed}
        .sort-sel{padding:8px 12px 8px 30px;border-radius:${radius.sm}px;border:1px solid ${colors.gray.borderMd};background:${colors.background.surface};font-size:${typography.scale.sm}px;font-weight:${typography.weight.semibold};cursor:pointer;color:${colors.gray[700]};outline:none;appearance:none;font-family:${typography.fontFamily}}
      `}</style>

      <div style={{ maxWidth:900, animation:'fadeUp 0.3s ease', fontFamily:typography.fontFamily }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, gap:12 }}>
          <div>
            <h2 style={{ margin:0, fontSize:typography.scale['2xl'], fontWeight:typography.weight.bold, letterSpacing:'-0.025em', color:typography.color.primary }}>
              Clientes
            </h2>
            <p style={{ margin:'3px 0 0', fontSize:typography.scale.sm, color:typography.color.muted }}>
              {totalAll} cliente{totalAll!==1?'s':''} cadastrado{totalAll!==1?'s':''}
            </p>
          </div>
          <button onClick={() => router.push('/dashboard/clientes/novo')}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 16px', borderRadius:radius.md, border:'none', background:colors.red.gradient, color:'#fff', fontSize:typography.scale.base, fontWeight:typography.weight.semibold, cursor:'pointer', boxShadow:shadows.redMd, flexShrink:0 }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow=shadows.redLg }}
            onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=shadows.redMd }}
          >
            <UserPlus size={15} strokeWidth={2.5}/> Novo cliente
          </button>
        </div>

        {/* Cards de métricas */}
        {totalAll > 0 && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 }}>
            {[
              { label:'Total de clientes', value:String(totalAll), sub:'cadastrados', icon:Users, color:typography.color.primary },
              { label:'Concluídos',  value:String(totalCompletedPage),  sub:'nesta página', icon:CheckCircle,  color:'#16a34a' },
              { label:'Cancelados',  value:String(totalCanceledPage),   sub:'nesta página', icon:XCircle,  color:colors.gray.dimText },
              { label:'Receita',     value:fmtRevenue(totalRevenuePage), sub:'nesta página', icon:TrendingUp,  color:colors.red.DEFAULT },
            ].map(s => (
              <div key={s.label} style={{ padding:'13px 16px', borderRadius:radius.lg, background:glass.surface.default.background, backdropFilter:glass.surface.default.backdropFilter, border:`1px solid ${colors.gray.border}`, boxShadow:shadows.sm }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
                  <s.icon size={13} color={s.color} strokeWidth={2}/>
                  <span style={{ fontSize:typography.scale.xs, fontWeight:typography.weight.bold, color:typography.color.muted, textTransform:'uppercase', letterSpacing:'.07em' }}>{s.label}</span>
                </div>
                <div style={{ fontSize:20, fontWeight:typography.weight.bold, color:s.color, fontVariantNumeric:'tabular-nums' }}>{s.value}</div>
                <div style={{ fontSize:typography.scale.xs, color:typography.color.muted, marginTop:2 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        )}

        {/* Busca + Ordenação */}
        <div style={{ display:'flex', gap:10, marginBottom:20 }}>
          <div style={{ flex:1, position:'relative' }}>
            <Search size={15} color={colors.gray.dimText} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }}/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou telefone..."
              style={{ width:'100%', padding:'10px 14px 10px 38px', borderRadius:radius.sm, border:`1px solid ${colors.gray.borderMd}`, background:colors.background.surface, fontSize:typography.scale.base, outline:'none', boxSizing:'border-box', fontFamily:typography.fontFamily, color:typography.color.primary }}
            />
            {search && <button onClick={() => setSearch('')} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', display:'flex' }}><X size={14} color={colors.gray.dimText}/></button>}
          </div>
          <div style={{ position:'relative', flexShrink:0 }}>
            <ArrowUpDown size={13} color={colors.gray.dimText} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
            <select className="sort-sel" value={sort} onChange={e => setSort(e.target.value)}>
              {ORDER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <div style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', pointerEvents:'none', fontSize:10, color:colors.gray.dimText }}>▾</div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display:'flex', justifyContent:'center', padding:48 }}>
            <div style={{ width:28, height:28, borderRadius:'50%', border:`3px solid ${colors.red.subtle}`, borderTopColor:colors.red.DEFAULT, animation:'spin 0.8s linear infinite' }}/>
          </div>
        )}

        {!loading && (clients.length === 0 ? (
          <div style={{ textAlign:'center', padding:'56px 32px', background:glass.surface.default.background, backdropFilter:glass.surface.default.backdropFilter, borderRadius:radius.xl, border:`1px solid ${colors.gray.border}` }}>
            <div style={{ fontSize:40, marginBottom:12 }}>👥</div>
            <div style={{ fontSize:16, fontWeight:typography.weight.semibold, color:typography.color.primary, marginBottom:6 }}>
              {search ? 'Nenhum cliente encontrado' : 'Nenhum cliente ainda'}
            </div>
            <div style={{ fontSize:typography.scale.base, color:typography.color.muted, marginBottom:20 }}>
              {search ? `Sem resultados para "${search}"` : 'Comece adicionando seu primeiro cliente.'}
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

              {/* Cabeçalho da tabela */}
              <div style={{ padding:'9px 20px', borderBottom:`1px solid ${colors.gray.border}`, display:'flex', alignItems:'center', gap:14, background:'rgba(245,245,247,0.6)' }}>
                <div style={{ width:42, flexShrink:0 }}/>
                <div style={{ flex:1, fontSize:typography.scale.xs, fontWeight:typography.weight.bold, color:typography.color.muted, textTransform:'uppercase', letterSpacing:'.07em' }}>Cliente</div>
                <div style={{ width:70, textAlign:'center', fontSize:typography.scale.xs, fontWeight:typography.weight.bold, color:typography.color.muted, textTransform:'uppercase', letterSpacing:'.07em' }}>Agend.</div>
                <div style={{ width:70, textAlign:'center', fontSize:typography.scale.xs, fontWeight:typography.weight.bold, color:'#16a34a', textTransform:'uppercase', letterSpacing:'.07em' }}>Concl.</div>
                <div style={{ width:70, textAlign:'center', fontSize:typography.scale.xs, fontWeight:typography.weight.bold, color:colors.gray.dimText, textTransform:'uppercase', letterSpacing:'.07em' }}>Canc.</div>
                <div style={{ width:110, textAlign:'right', fontSize:typography.scale.xs, fontWeight:typography.weight.bold, color:colors.red.DEFAULT, textTransform:'uppercase', letterSpacing:'.07em' }}>Receita</div>
                <div style={{ width:90, fontSize:typography.scale.xs, fontWeight:typography.weight.bold, color:typography.color.muted, textTransform:'uppercase', letterSpacing:'.07em' }}>Última visita</div>
                <div style={{ width:16 }}/>
              </div>

              {clients.map(c => (
                <div key={c.id} className="cl-row" onClick={() => router.push(`/dashboard/clientes/${c.id}`)}>
                  {/* Avatar */}
                  <div style={{ width:42, height:42, borderRadius:radius.full, background:avatarColor(c.name), color:'#fff', fontSize:typography.scale.base, fontWeight:typography.weight.bold, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:shadows.sm }}>
                    {getInitials(c.name)}
                  </div>

                  {/* Nome e telefone */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:typography.scale.md, fontWeight:typography.weight.semibold, color:typography.color.primary, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {c.name}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:2 }}>
                      <Phone size={11} color={colors.gray.dimText}/>
                      <span style={{ fontSize:typography.scale.sm, color:typography.color.muted }}>{formatPhone(c.phone)}</span>
                    </div>
                  </div>

                  {/* Total agend. */}
                  <div style={{ width:70, textAlign:'center' }}>
                    <span style={{ fontSize:typography.scale.lg, fontWeight:typography.weight.bold, color:c.totalBookings>0?typography.color.primary:typography.color.muted }}>
                      {c.totalBookings}
                    </span>
                  </div>

                  {/* Concluídos */}
                  <div style={{ width:70, textAlign:'center' }}>
                    <span style={{ fontSize:typography.scale.base, fontWeight:typography.weight.semibold, color:c.completed>0?'#16a34a':typography.color.muted }}>
                      {c.completed}
                    </span>
                  </div>

                  {/* Cancelados */}
                  <div style={{ width:70, textAlign:'center' }}>
                    <span style={{ fontSize:typography.scale.base, fontWeight:typography.weight.semibold, color:c.canceled>0?colors.gray.dimText:typography.color.muted }}>
                      {c.canceled}
                    </span>
                  </div>

                  {/* Receita */}
                  <div style={{ width:110, textAlign:'right' }}>
                    <span style={{ fontSize:typography.scale.base, fontWeight:typography.weight.bold, color:c.totalRevenue>0?colors.red.DEFAULT:typography.color.muted, fontVariantNumeric:'tabular-nums' }}>
                      {fmtRevenue(c.totalRevenue)}
                    </span>
                  </div>

                  {/* Última visita */}
                  <div style={{ width:90 }}>
                    <span style={{ fontSize:typography.scale.sm, color:typography.color.muted }}>
                      {c.lastVisit ? dayjs(c.lastVisit).format('DD MMM YY') : '—'}
                    </span>
                  </div>

                  <ChevronRight size={15} color={colors.gray.dimText} className="cl-arrow"/>
                </div>
              ))}
            </div>

            {/* Paginação */}
            {pages > 1 && (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:16, padding:'0 4px' }}>
                <span style={{ fontSize:typography.scale.sm, color:typography.color.muted }}>
                  Mostrando {(page-1)*30+1}–{Math.min(page*30,total)} de {total}
                </span>
                <div style={{ display:'flex', gap:6 }}>
                  <button className="pg-btn" disabled={page<=1}     onClick={() => setPage(p=>p-1)}>← Anterior</button>
                  <span style={{ padding:'7px 12px', fontSize:typography.scale.sm, color:typography.color.muted }}>{page} / {pages}</span>
                  <button className="pg-btn" disabled={page>=pages} onClick={() => setPage(p=>p+1)}>Próxima →</button>
                </div>
              </div>
            )}
          </>
        ))}
      </div>
    </>
  )
}