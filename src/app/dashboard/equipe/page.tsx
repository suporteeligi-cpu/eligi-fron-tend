'use client'
// src/app/dashboard/equipe/page.tsx

import { useState, useEffect, useRef } from 'react'
import {
  UserCog, Clock, Scissors, ChevronRight, Phone, Mail,
  Search, X, Plus, Trash2, Check, Save, User, AlertTriangle,
} from 'lucide-react'
import { createPortal } from 'react-dom'
import api from '@/shared/lib/apiClient'
import { colors, typography, transitions } from '@/shared/theme'

// ─── Types ────────────────────────────────────────────────────────────────────
interface ProfService {
  service: { id: string; name: string; duration: number; price?: number; color?: string }
}
interface Professional {
  id: string; name: string; phone?: string; email?: string; role?: string
  description?: string; showInCalendar?: boolean; availableOnline?: boolean
  active: boolean; avatarUrl?: string; services?: ProfService[]
}
interface Service {
  id: string; name: string; duration: number; price?: number; color?: string
}
interface HourSlot {
  weekday: number; open: boolean; startTime: string; endTime: string
}

const DAYS_FULL = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado']
const DAYS_SHORT = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

function getInitials(n: string) { return n.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase() }
function fmtDur(m: number) { return m<60?`${m}min`:m%60===0?`${m/60}h`:`${Math.floor(m/60)}h ${m%60}min` }
function fmtPrice(p?: number) { return p!=null?`R$ ${p.toFixed(2).replace('.',',')}`:'' }

function generateTimeOptions() {
  const opts: string[] = []
  for (let h=0;h<24;h++) for (let m=0;m<60;m+=30)
    opts.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`)
  return opts
}
const TIME_OPTS = generateTimeOptions()

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, size=40, url }: { name:string; size?:number; url?:string }) {
  const isColor = url?.startsWith('color:')
  const colorBg = isColor ? url!.replace('color:','') : null
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', flexShrink:0,
      background: colorBg ?? (url && !isColor ? 'transparent' : colors.red.gradient),
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:size*0.33, fontWeight:700, color:'#fff',
      boxShadow:`0 3px 10px ${colors.red.glow}`, overflow:'hidden',
    }}>
      {url && !isColor
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={url} alt={name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
        : getInitials(name)
      }
    </div>
  )
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────
function ConfirmModal({ title, body, confirmLabel, onConfirm, onCancel }: {
  title:string; body:string; confirmLabel:string; onConfirm:()=>void; onCancel:()=>void
}) {
  if (typeof document==='undefined') return null
  return createPortal(
    <>
      <div onClick={onCancel} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.28)',backdropFilter:'blur(8px)',zIndex:10998}}/>
      <div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:340,maxWidth:'88vw',background:'rgba(255,255,255,0.99)',borderRadius:22,boxShadow:'0 32px 72px rgba(0,0,0,0.18)',zIndex:10999,padding:'32px 24px 22px',textAlign:'center',fontFamily:typography.fontFamily,animation:'cmIn 0.22s cubic-bezier(0.34,1.56,0.64,1)'}}>
        <style>{`@keyframes cmIn{from{opacity:0;transform:translate(-50%,-50%) scale(0.93)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}`}</style>
        <div style={{width:52,height:52,borderRadius:'50%',background:'rgba(220,38,38,0.08)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px'}}>
          <AlertTriangle size={24} color={colors.red.DEFAULT}/>
        </div>
        <h3 style={{margin:'0 0 8px',fontSize:17,fontWeight:700,color:'#0f0f14'}}>{title}</h3>
        <p style={{margin:'0 0 22px',fontSize:14,color:colors.gray.dimText,lineHeight:1.5}}>{body}</p>
        <button onClick={onConfirm} style={{width:'100%',padding:'13px',marginBottom:8,background:colors.red.gradient,color:'#fff',border:'none',borderRadius:13,fontWeight:700,fontSize:14,cursor:'pointer',letterSpacing:'.04em',textTransform:'uppercase' as const}}>
          {confirmLabel}
        </button>
        <button onClick={onCancel} style={{width:'100%',padding:'12px',background:'transparent',border:`1px solid ${colors.gray.borderMd}`,borderRadius:13,fontSize:14,cursor:'pointer',color:colors.gray.dimText}}>
          Cancelar
        </button>
      </div>
    </>,
    document.body
  )
}

// ─── Avatar Picker ────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  { bg: 'linear-gradient(145deg,#ef4444,#dc2626)', label: 'Vermelho' },
  { bg: 'linear-gradient(145deg,#3b82f6,#2563eb)', label: 'Azul' },
  { bg: 'linear-gradient(145deg,#8b5cf6,#7c3aed)', label: 'Roxo' },
  { bg: 'linear-gradient(145deg,#10b981,#059669)', label: 'Verde' },
  { bg: 'linear-gradient(145deg,#f59e0b,#d97706)', label: 'Âmbar' },
  { bg: 'linear-gradient(145deg,#ec4899,#db2777)', label: 'Rosa' },
  { bg: 'linear-gradient(145deg,#06b6d4,#0891b2)', label: 'Ciano' },
  { bg: 'linear-gradient(145deg,#64748b,#475569)', label: 'Cinza' },
]

function AvatarPicker({ name, current, onChange }: {
  name: string; current?: string; onChange: (url: string|null) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string|null>(current??null)
  const [loading, setLoading] = useState(false)
  const initials = getInitials(name||'?')

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { alert('Imagem muito grande. Máximo 2MB.'); return }
    setLoading(true)
    const reader = new FileReader()
    reader.onload = ev => {
      const b64 = ev.target?.result as string
      setPreview(b64)
      onChange(b64)
      setLoading(false)
    }
    reader.readAsDataURL(file)
  }

  function handleColor(bg: string) {
    setPreview(null)
    onChange(null)
    // Salva a cor como avatarUrl especial
    onChange(`color:${bg}`)
  }

  function handleRemove() {
    setPreview(null)
    onChange(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const isColor = preview?.startsWith('color:')
  const colorBg = isColor ? preview!.replace('color:','') : null

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
      {/* Preview atual */}
      <div style={{ position:'relative' }}>
        <div style={{
          width:80, height:80, borderRadius:'50%',
          background: colorBg ?? (preview && !isColor ? 'transparent' : colors.red.gradient),
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:28, fontWeight:700, color:'#fff',
          boxShadow:`0 4px 16px rgba(0,0,0,0.12)`, overflow:'hidden',
          border:'3px solid rgba(255,255,255,0.9)',
        }}>
          {preview && !isColor
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={preview} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
            : initials
          }
          {loading && <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:'#fff'}}>...</div>}
        </div>
        {preview && (
          <button onClick={handleRemove} style={{position:'absolute',top:-4,right:-4,width:22,height:22,borderRadius:'50%',background:'#fff',border:`1.5px solid ${colors.gray.borderMd}`,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 6px rgba(0,0,0,0.12)'}}>
            <X size={11} color={colors.gray.dimText} strokeWidth={2.5}/>
          </button>
        )}
      </div>

      {/* Upload de foto */}
      <div style={{width:'100%'}}>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{display:'none'}}/>
        <button onClick={()=>fileRef.current?.click()} style={{width:'100%',padding:'9px',borderRadius:10,border:`1.5px dashed ${colors.gray.borderMd}`,background:'transparent',cursor:'pointer',fontSize:13,fontWeight:600,color:colors.gray[700],display:'flex',alignItems:'center',justifyContent:'center',gap:7,transition:`all ${transitions.fast}`}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=colors.red.DEFAULT;e.currentTarget.style.color=colors.red.DEFAULT;e.currentTarget.style.background=colors.red.subtle}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=colors.gray.borderMd;e.currentTarget.style.color=colors.gray[700];e.currentTarget.style.background='transparent'}}
        >
          <User size={14} strokeWidth={2}/>Enviar foto
        </button>
        <div style={{fontSize:11,color:colors.gray.dimText,textAlign:'center',marginTop:5}}>JPG, PNG ou WEBP · máx 2MB</div>
      </div>

      {/* Cores pré-definidas */}
      <div style={{width:'100%'}}>
        <div style={{fontSize:11,fontWeight:700,color:colors.gray.dimText,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:8}}>Ou escolha uma cor</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(8,1fr)',gap:6}}>
          {AVATAR_COLORS.map(c=>{
            const isSel = preview===`color:${c.bg}`
            return (
              <button key={c.bg} onClick={()=>handleColor(c.bg)} title={c.label} style={{width:'100%',aspectRatio:'1',borderRadius:'50%',background:c.bg,border:isSel?`3px solid ${colors.gray[900]}`:'3px solid transparent',cursor:'pointer',transition:`transform ${transitions.fast}, border ${transitions.fast}`,boxShadow:'0 2px 6px rgba(0,0,0,0.15)'}}
                onMouseEnter={e=>e.currentTarget.style.transform='scale(1.15)'}
                onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
function ServicesPicker({ selected, allServices, onChange }: {
  selected: string[]; allServices: Service[]; onChange:(ids:string[])=>void
}) {
  const [q, setQ] = useState('')
  const filtered = allServices.filter(s=>s.name.toLowerCase().includes(q.toLowerCase()))
  const toggle = (id: string) => onChange(selected.includes(id)?selected.filter(x=>x!==id):[...selected,id])
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:8,padding:'9px 12px',borderRadius:10,background:colors.background.page,border:`1px solid ${colors.gray.borderMd}`,marginBottom:10}}>
        <Search size={13} color={colors.gray.dimText}/>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Pesquisar serviços..." style={{flex:1,border:'none',outline:'none',fontSize:13,background:'transparent',fontFamily:typography.fontFamily,color:colors.gray[900]}}/>
      </div>
      <div style={{maxHeight:260,overflowY:'auto',border:`1px solid ${colors.gray.border}`,borderRadius:10,overflow:'hidden'}}>
        {filtered.length===0
          ? <div style={{padding:'20px',textAlign:'center',color:colors.gray.dimText,fontSize:13}}>Nenhum serviço encontrado</div>
          : filtered.map(s=>{
            const isSel = selected.includes(s.id)
            return (
              <button key={s.id} onClick={()=>toggle(s.id)} style={{width:'100%',display:'flex',alignItems:'center',gap:12,padding:'12px 14px',border:'none',borderBottom:`1px solid ${colors.gray.border}`,background:isSel?colors.red.subtle:'transparent',cursor:'pointer',textAlign:'left',transition:`background ${transitions.fast}`}}>
                <div style={{width:3,height:32,borderRadius:2,background:s.color??colors.red.DEFAULT,flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:colors.gray[900]}}>{s.name}</div>
                  <div style={{fontSize:11,color:colors.gray.dimText,marginTop:1,display:'flex',alignItems:'center',gap:4}}>
                    <Clock size={10} strokeWidth={2}/>{fmtDur(s.duration)}{s.price!=null&&<> · {fmtPrice(s.price)}</>}
                  </div>
                </div>
                <div style={{width:20,height:20,borderRadius:6,border:isSel?'none':`1.5px solid ${colors.gray.borderMd}`,background:isSel?colors.red.DEFAULT:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  {isSel&&<Check size={12} color="#fff" strokeWidth={3}/>}
                </div>
              </button>
            )
          })
        }
      </div>
      <div style={{marginTop:8,fontSize:12,color:colors.gray.dimText}}>{selected.length} serviço{selected.length!==1?'s':''} selecionado{selected.length!==1?'s':''}</div>
    </div>
  )
}

// ─── Hours Editor ─────────────────────────────────────────────────────────────
function HoursEditor({ slots, onChange }: { slots:HourSlot[]; onChange:(s:HourSlot[])=>void }) {
  const ordered = [1,2,3,4,5,6,0]
  const update = (wd:number, patch:Partial<HourSlot>) => {
    onChange(slots.map(s=>s.weekday===wd?{...s,...patch}:s))
  }
  return (
    <div>
      {ordered.map(wd => {
        const slot = slots.find(s=>s.weekday===wd)??{weekday:wd,open:false,startTime:'09:00',endTime:'18:00'}
        return (
          <div key={wd} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderBottom:`1px solid ${colors.gray.border}`}}>
            {/* Toggle */}
            <button onClick={()=>update(wd,{open:!slot.open})} style={{width:40,height:22,borderRadius:11,border:'none',cursor:'pointer',padding:0,background:slot.open?colors.red.DEFAULT:colors.gray.borderMd,transition:`background ${transitions.fast}`,flexShrink:0,position:'relative'}}>
              <div style={{width:18,height:18,borderRadius:'50%',background:'#fff',position:'absolute',top:2,left:slot.open?'calc(100% - 20px)':2,transition:`left ${transitions.fast}`,boxShadow:'0 1px 4px rgba(0,0,0,0.2)'}}/>
            </button>
            <span style={{width:100,fontSize:13,fontWeight:600,color:slot.open?colors.gray[900]:colors.gray.dimText,flexShrink:0}}>
              {DAYS_FULL[wd]}
            </span>
            {slot.open ? (
              <div style={{display:'flex',alignItems:'center',gap:8,flex:1}}>
                <select value={slot.startTime} onChange={e=>update(wd,{startTime:e.target.value})} style={{flex:1,height:34,padding:'0 8px',borderRadius:8,border:`1px solid ${colors.gray.borderMd}`,fontSize:13,outline:'none',background:colors.background.page,fontFamily:typography.fontFamily,cursor:'pointer'}}>
                  {TIME_OPTS.map(t=><option key={t} value={t}>{t}</option>)}
                </select>
                <span style={{color:colors.gray.dimText,fontSize:12}}>–</span>
                <select value={slot.endTime} onChange={e=>update(wd,{endTime:e.target.value})} style={{flex:1,height:34,padding:'0 8px',borderRadius:8,border:`1px solid ${colors.gray.borderMd}`,fontSize:13,outline:'none',background:colors.background.page,fontFamily:typography.fontFamily,cursor:'pointer'}}>
                  {TIME_OPTS.filter(t=>t>slot.startTime).map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            ) : (
              <span style={{fontSize:13,color:colors.gray.dimText,fontStyle:'italic',flex:1}}>Folga</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Professional Panel ───────────────────────────────────────────────────────
function ProfessionalPanel({
  prof, allServices, onClose, onUpdated, onDeleted,
}: {
  prof:        Professional
  allServices: Service[]
  onClose:     () => void
  onUpdated:   (p:Professional) => void
  onDeleted:   (id:string) => void
}) {
  const [tab,        setTab]        = useState<'services'|'hours'>('services')
  const [editing,    setEditing]    = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [savingHrs,  setSavingHrs]  = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const [hours,      setHours]      = useState<HourSlot[]>([])
  const [hoursLoaded,setHoursLoaded]= useState(false)

  // Campos editáveis
  const [name,            setName]            = useState(prof.name)
  const [phone,           setPhone]           = useState(prof.phone??'')
  const [email,           setEmail]           = useState(prof.email??'')
  const [role,            setRole]            = useState(prof.role??'')
  const [description,     setDescription]     = useState(prof.description??'')
  const [showInCalendar,  setShowInCalendar]  = useState(prof.showInCalendar??true)
  const [availableOnline, setAvailableOnline] = useState(prof.availableOnline??true)
  const [selectedSvcs,    setSelectedSvcs]    = useState<string[]>((prof.services??[]).map(ps=>ps.service.id))
  const [avatarUrl,       setAvatarUrl]       = useState<string|null>(prof.avatarUrl??null)

  // Carrega horários ao abrir aba
  useEffect(() => {
    if (tab!=='hours'||hoursLoaded) return
    let cancelled = false
    api.get(`/equipe/${prof.id}/availability`)
      .then(res => {
        if (cancelled) return
        const data = res.data?.data??res.data
        setHours(Array.isArray(data)?data:[])
        setHoursLoaded(true)
      })
      .catch(()=>{ if (!cancelled) setHours([]) })
    return () => { cancelled = true }
  }, [tab, hoursLoaded, prof.id])

  async function handleSave() {
    if (!name.trim()) return
    try {
      setSaving(true)
      const res = await api.patch(`/equipe/${prof.id}`, {
        name:name.trim(), phone:phone||null, email:email||null,
        role:role||null, description:description||null,
        avatarUrl: avatarUrl||null,
        showInCalendar, availableOnline, serviceIds: selectedSvcs,
      })
      const updated = res.data?.data??res.data
      onUpdated(updated)
      setEditing(false)
    } catch { /* silencioso */ }
    finally { setSaving(false) }
  }

  async function handleSaveHours() {
    try {
      setSavingHrs(true)
      const res = await api.put(`/equipe/${prof.id}/availability`, { slots: hours })
      const updated = res.data?.data??res.data
      if (Array.isArray(updated)) setHours(updated)
    } catch { /* silencioso */ }
    finally { setSavingHrs(false) }
  }

  async function handleDelete() {
    try {
      await api.delete(`/equipe/${prof.id}`)
      onDeleted(prof.id)
      onClose()
    } catch { /* silencioso */ }
    finally { setConfirmDel(false) }
  }

  const inputStyle: React.CSSProperties = {
    width:'100%', padding:'9px 12px', borderRadius:9, fontSize:13,
    border:`1px solid ${colors.gray.borderMd}`, outline:'none',
    fontFamily:typography.fontFamily, color:colors.gray[900],
    background:colors.background.page, boxSizing:'border-box',
    transition:`border-color ${transitions.fast}`,
  }
  const labelStyle: React.CSSProperties = {
    display:'block', fontSize:11, fontWeight:700,
    color:colors.gray.dimText, textTransform:'uppercase',
    letterSpacing:'.07em', marginBottom:5,
  }

  return (
    <>
      {confirmDel && (
        <ConfirmModal
          title="Remover profissional?"
          body="O profissional será desativado e não aparecerá mais na agenda. Agendamentos existentes não são afetados."
          confirmLabel="Sim, remover"
          onConfirm={handleDelete}
          onCancel={()=>setConfirmDel(false)}
        />
      )}

      <div style={{display:'flex',flexDirection:'column',height:'100%',animation:'slideIn 0.22s cubic-bezier(0.25,0.46,0.45,0.94)'}}>
        <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:translateX(0)}}`}</style>

        {/* Header */}
        <div style={{padding:'20px 24px 0',borderBottom:`1px solid ${colors.gray.border}`,flexShrink:0}}>
          {/* Ações */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
            <button onClick={onClose} style={{display:'flex',alignItems:'center',gap:6,background:'none',border:'none',cursor:'pointer',fontSize:13,fontWeight:600,color:colors.gray.dimText,padding:0}} className="eq-back-btn">
              ← Voltar
            </button>
            <div style={{display:'flex',gap:8}}>
              {editing ? (
                <>
                  <button onClick={()=>setEditing(false)} style={{padding:'7px 14px',borderRadius:9,border:`1px solid ${colors.gray.borderMd}`,background:'transparent',fontSize:13,cursor:'pointer',color:colors.gray.dimText,fontWeight:600}}>
                    Cancelar
                  </button>
                  <button onClick={handleSave} disabled={saving||!name.trim()} style={{padding:'7px 16px',borderRadius:9,border:'none',background:saving?colors.gray.borderMd:colors.red.gradient,color:saving?colors.gray.dimText:'#fff',fontSize:13,cursor:saving?'not-allowed':'pointer',fontWeight:700,display:'flex',alignItems:'center',gap:6,boxShadow:saving?'none':`0 3px 10px ${colors.red.glow}`}}>
                    <Save size={13} strokeWidth={2}/>{saving?'Salvando...':'Salvar'}
                  </button>
                </>
              ) : (
                <>
                  <button onClick={()=>setConfirmDel(true)} style={{padding:'7px 12px',borderRadius:9,border:`1px solid rgba(220,38,38,0.2)`,background:'rgba(220,38,38,0.06)',color:colors.red.DEFAULT,fontSize:13,cursor:'pointer',display:'flex',alignItems:'center',gap:5}}>
                    <Trash2 size={13} strokeWidth={2}/>
                  </button>
                  <button onClick={()=>setEditing(true)} style={{padding:'7px 16px',borderRadius:9,border:`1px solid ${colors.gray.borderMd}`,background:'transparent',color:colors.gray[700],fontSize:13,cursor:'pointer',fontWeight:600}}>
                    Editar
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Perfil */}
          <div style={{display:'flex',alignItems:'flex-start',gap:16,marginBottom:16}}>
            <div style={{flexShrink:0}}>
              {editing
                ? <AvatarPicker name={name} current={avatarUrl??undefined} onChange={v=>setAvatarUrl(v)}/>
                : <Avatar name={prof.name} size={64} url={prof.avatarUrl??undefined}/>
              }
            </div>
            <div style={{flex:1,minWidth:0}}>
              {editing ? (
                <input value={name} onChange={e=>setName(e.target.value)} style={{...inputStyle,fontSize:16,fontWeight:700,marginBottom:6}} placeholder="Nome do profissional"/>
              ) : (
                <div style={{fontSize:18,fontWeight:700,color:colors.gray[900],letterSpacing:'-0.02em',marginBottom:4}}>{prof.name}</div>
              )}
              <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'3px 10px',borderRadius:20,background:prof.active?'rgba(22,163,74,0.08)':'rgba(0,0,0,0.05)',border:`1px solid ${prof.active?'rgba(22,163,74,0.2)':'rgba(0,0,0,0.08)'}`}}>
                <div style={{width:6,height:6,borderRadius:'50%',background:prof.active?'#16a34a':colors.gray.dimText}}/>
                <span style={{fontSize:12,fontWeight:600,color:prof.active?'#15803d':colors.gray.dimText}}>{prof.active?'Ativo':'Inativo'}</span>
              </div>
            </div>
          </div>

          {/* Campos extras em modo edição */}
          {editing && (
            <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:16,padding:'14px',borderRadius:12,background:colors.background.page,border:`1px solid ${colors.gray.border}`}}>
              <div style={{display:'flex',gap:10}}>
                <div style={{flex:1}}>
                  <label style={labelStyle}>Cargo</label>
                  <input value={role} onChange={e=>setRole(e.target.value)} style={inputStyle} placeholder="Ex: Barbeiro, Recepcionista"/>
                </div>
              </div>
              <div style={{display:'flex',gap:10}}>
                <div style={{flex:1}}>
                  <label style={labelStyle}>Telefone</label>
                  <input value={phone} onChange={e=>setPhone(e.target.value)} style={inputStyle} placeholder="(11) 99999-9999"/>
                </div>
                <div style={{flex:1}}>
                  <label style={labelStyle}>E-mail</label>
                  <input value={email} onChange={e=>setEmail(e.target.value)} style={inputStyle} placeholder="email@exemplo.com"/>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Descrição</label>
                <textarea value={description} onChange={e=>setDescription(e.target.value)} rows={2} placeholder="Descrição do profissional..." style={{...inputStyle,resize:'none',minHeight:60}}/>
              </div>
              {/* Checkboxes */}
              <div style={{display:'flex',flexDirection:'column',gap:8,paddingTop:4}}>
                {[
                  {label:'Mostrar no calendário',sub:'O profissional aparece na agenda',val:showInCalendar,set:setShowInCalendar},
                  {label:'Disponível para agendamentos online',sub:'Clientes podem agendar pelo link público',val:availableOnline,set:setAvailableOnline},
                ].map(({label,sub,val,set})=>(
                  <button key={label} onClick={()=>set(!val)} style={{display:'flex',alignItems:'flex-start',gap:10,background:'none',border:'none',cursor:'pointer',padding:0,textAlign:'left'}}>
                    <div style={{width:20,height:20,borderRadius:6,border:val?'none':`1.5px solid ${colors.gray.borderMd}`,background:val?colors.red.DEFAULT:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:2,boxShadow:val?`0 2px 6px ${colors.red.glow}`:'none',transition:`all ${transitions.fast}`}}>
                      {val&&<Check size={12} color="#fff" strokeWidth={3}/>}
                    </div>
                    <div>
                      <div style={{fontSize:13,fontWeight:600,color:colors.gray[900]}}>{label}</div>
                      <div style={{fontSize:11,color:colors.gray.dimText,marginTop:1}}>{sub}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Contatos (modo leitura) */}
          {!editing && (prof.phone||prof.email||prof.role) && (
            <div style={{display:'flex',flexDirection:'column',gap:5,marginBottom:14}}>
              {prof.role&&<div style={{fontSize:13,color:colors.gray.dimText,fontWeight:600}}>{prof.role}</div>}
              {prof.phone&&<div style={{display:'flex',alignItems:'center',gap:6,fontSize:13,color:colors.gray.dimText}}><Phone size={12} strokeWidth={2}/>{prof.phone}</div>}
              {prof.email&&<div style={{display:'flex',alignItems:'center',gap:6,fontSize:13,color:colors.gray.dimText}}><Mail size={12} strokeWidth={2}/>{prof.email}</div>}
            </div>
          )}

          {/* Tabs */}
          <div style={{display:'flex',gap:0,marginBottom:-1}}>
            {(['services','hours'] as const).map(t=>(
              <button key={t} onClick={()=>setTab(t)} style={{padding:'10px 16px',border:'none',background:'transparent',cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:typography.fontFamily,color:tab===t?colors.red.DEFAULT:colors.gray.dimText,borderBottom:tab===t?`2px solid ${colors.red.DEFAULT}`:'2px solid transparent',transition:`all ${transitions.fast}`,letterSpacing:'.03em'}}>
                {t==='services'?`SERVIÇOS (${(prof.services??[]).length})`:'HORÁRIO DE TRABALHO'}
              </button>
            ))}
          </div>
        </div>

        {/* Conteúdo */}
        <div style={{flex:1,overflowY:'auto',padding:'16px 24px'}}>
          {tab==='services' && (
            editing
              ? <ServicesPicker selected={selectedSvcs} allServices={allServices} onChange={setSelectedSvcs}/>
              : <ServicesReadOnly services={(prof.services??[]).map(ps=>ps.service)}/>
          )}
          {tab==='hours' && (
            <div>
              <HoursEditor slots={hours} onChange={setHours}/>
              <div style={{marginTop:16,display:'flex',justifyContent:'flex-end'}}>
                <button onClick={handleSaveHours} disabled={savingHrs} style={{padding:'10px 22px',borderRadius:10,border:'none',background:savingHrs?colors.gray.borderMd:colors.red.gradient,color:savingHrs?colors.gray.dimText:'#fff',fontSize:13,cursor:savingHrs?'not-allowed':'pointer',fontWeight:700,display:'flex',alignItems:'center',gap:7,boxShadow:savingHrs?'none':`0 3px 10px ${colors.red.glow}`}}>
                  <Save size={13} strokeWidth={2}/>{savingHrs?'Salvando...':'Salvar horários'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function ServicesReadOnly({ services }: { services: Service[] }) {
  const [q, setQ] = useState('')
  const filtered = services.filter(s=>s.name.toLowerCase().includes(q.toLowerCase()))
  if (services.length===0) return (
    <div style={{padding:'32px 0',textAlign:'center'}}>
      <Scissors size={28} color={colors.gray.dimText} style={{opacity:0.3,marginBottom:10}}/>
      <div style={{fontSize:14,color:colors.gray.dimText}}>Nenhum serviço vinculado</div>
    </div>
  )
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:8,padding:'9px 12px',borderRadius:10,background:colors.background.page,border:`1px solid ${colors.gray.borderMd}`,marginBottom:12}}>
        <Search size={13} color={colors.gray.dimText}/>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Pesquisar serviços..." style={{flex:1,border:'none',outline:'none',fontSize:13,background:'transparent',fontFamily:typography.fontFamily,color:colors.gray[900]}}/>
      </div>
      {filtered.map(s=>(
        <div key={s.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderBottom:`1px solid ${colors.gray.border}`}}>
          <div style={{width:3,height:34,borderRadius:2,background:s.color??colors.red.DEFAULT,flexShrink:0}}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:600,color:colors.gray[900]}}>{s.name}</div>
            <div style={{fontSize:11,color:colors.gray.dimText,marginTop:1,display:'flex',alignItems:'center',gap:4}}>
              <Clock size={10} strokeWidth={2}/>{fmtDur(s.duration)}
            </div>
          </div>
          {s.price!=null&&<span style={{fontSize:13,fontWeight:700,color:colors.gray[900],fontVariantNumeric:'tabular-nums',flexShrink:0}}>{fmtPrice(s.price)}</span>}
        </div>
      ))}
    </div>
  )
}

// ─── Adicionar Profissional Modal ─────────────────────────────────────────────
function AddProfessionalModal({ onCreated, onClose }: {
  onCreated:(p:Professional)=>void; onClose:()=>void
}) {
  const [name,  setName]  = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [role,  setRole]  = useState('')
  const [saving,setSaving]= useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(()=>{ setTimeout(()=>inputRef.current?.focus(),80) },[])

  async function handleCreate() {
    if (!name.trim()) return
    try {
      setSaving('saving')
      const res = await api.post('/equipe', { name:name.trim(), phone:phone||null, email:email||null, role:role||null })
      const p   = res.data?.data??res.data
      onCreated(p); onClose()
    } catch { setSaving('error') }
    finally  { setSaving('') }
  }

  const inputStyle: React.CSSProperties = {
    width:'100%', padding:'10px 12px', borderRadius:9, fontSize:13,
    border:`1px solid ${colors.gray.borderMd}`, outline:'none',
    fontFamily:typography.fontFamily, color:colors.gray[900],
    background:colors.background.page, boxSizing:'border-box',
  }

  if (typeof document==='undefined') return null
  return createPortal(
    <>
      <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.25)',backdropFilter:'blur(8px)',zIndex:10998}}/>
      <div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:400,maxWidth:'92vw',background:'rgba(255,255,255,0.99)',borderRadius:22,boxShadow:'0 32px 72px rgba(0,0,0,0.15)',zIndex:10999,fontFamily:typography.fontFamily,animation:'cmIn 0.22s cubic-bezier(0.34,1.56,0.64,1)',overflow:'hidden'}}>
        <style>{`@keyframes cmIn{from{opacity:0;transform:translate(-50%,-50%) scale(0.93)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}`}</style>
        {/* Header modal */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 20px 14px',borderBottom:`1px solid ${colors.gray.border}`}}>
          <h3 style={{margin:0,fontSize:16,fontWeight:700,color:colors.gray[900]}}>Adicionar profissional</h3>
          <button onClick={onClose} style={{width:28,height:28,borderRadius:'50%',border:`1px solid ${colors.gray.borderMd}`,background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <X size={14} color={colors.gray.dimText}/>
          </button>
        </div>
        {/* Campos */}
        <div style={{padding:'16px 20px',display:'flex',flexDirection:'column',gap:12}}>
          {/* Avatar placeholder */}
          <div style={{display:'flex',justifyContent:'center',marginBottom:4}}>
            <div style={{width:64,height:64,borderRadius:'50%',background:colors.background.page,border:`2px dashed ${colors.gray.borderMd}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <User size={24} color={colors.gray.dimText} strokeWidth={1.5}/>
            </div>
          </div>
          <div>
            <label style={{display:'block',fontSize:11,fontWeight:700,color:colors.gray.dimText,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:5}}>Nome *</label>
            <input ref={inputRef} value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleCreate()} placeholder="Nome completo" style={inputStyle}/>
          </div>
          <div style={{display:'flex',gap:10}}>
            <div style={{flex:1}}>
              <label style={{display:'block',fontSize:11,fontWeight:700,color:colors.gray.dimText,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:5}}>Cargo</label>
              <input value={role} onChange={e=>setRole(e.target.value)} placeholder="Ex: Barbeiro" style={inputStyle}/>
            </div>
          </div>
          <div style={{display:'flex',gap:10}}>
            <div style={{flex:1}}>
              <label style={{display:'block',fontSize:11,fontWeight:700,color:colors.gray.dimText,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:5}}>Telefone</label>
              <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="(11) 99999-9999" style={inputStyle}/>
            </div>
            <div style={{flex:1}}>
              <label style={{display:'block',fontSize:11,fontWeight:700,color:colors.gray.dimText,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:5}}>E-mail</label>
              <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="email@exemplo.com" style={inputStyle}/>
            </div>
          </div>
          {email&&(
            <div style={{padding:'10px 12px',borderRadius:9,background:'rgba(59,130,246,0.06)',border:'1px solid rgba(59,130,246,0.15)',fontSize:12,color:'#1d4ed8',display:'flex',alignItems:'center',gap:7}}>
              <Mail size={13} strokeWidth={2}/> Um convite de primeiro acesso será enviado para este e-mail.
            </div>
          )}
          {saving==='error'&&<div style={{fontSize:12,color:colors.red.DEFAULT,padding:'8px 12px',borderRadius:9,background:'rgba(220,38,38,0.06)',border:`1px solid ${colors.red.border}`}}>Erro ao criar. Tente novamente.</div>}
        </div>
        {/* Footer */}
        <div style={{padding:'0 20px 20px',display:'flex',gap:8}}>
          <button onClick={onClose} style={{flex:1,padding:'12px',borderRadius:10,border:`1px solid ${colors.gray.borderMd}`,background:'transparent',fontSize:13,cursor:'pointer',color:colors.gray[700],fontWeight:600}}>Cancelar</button>
          <button onClick={handleCreate} disabled={!name.trim()||saving==='saving'} style={{flex:2,padding:'12px',borderRadius:10,border:'none',background:!name.trim()||saving==='saving'?colors.gray.borderMd:colors.red.gradient,color:!name.trim()||saving==='saving'?colors.gray.dimText:'#fff',fontSize:13,cursor:!name.trim()||saving==='saving'?'not-allowed':'pointer',fontWeight:700,boxShadow:!name.trim()||saving==='saving'?'none':`0 3px 10px ${colors.red.glow}`}}>
            {saving==='saving'?'Criando...':'Adicionar profissional'}
          </button>
        </div>
      </div>
    </>,
    document.body
  )
}

// ─── Sidebar Item ─────────────────────────────────────────────────────────────
function ProfItem({ prof, selected, onClick }: { prof:Professional; selected:boolean; onClick:()=>void }) {
  return (
    <button onClick={onClick} style={{width:'100%',display:'flex',alignItems:'center',gap:12,padding:'13px 20px',border:'none',textAlign:'left',cursor:'pointer',background:selected?colors.red.subtle:'transparent',borderLeft:selected?`3px solid ${colors.red.DEFAULT}`:'3px solid transparent',borderBottom:`1px solid ${colors.gray.border}`,transition:`all ${transitions.fast}`}}
      onMouseEnter={e=>{ if(!selected) e.currentTarget.style.background=colors.gray.hover }}
      onMouseLeave={e=>{ if(!selected) e.currentTarget.style.background='transparent' }}
    >
      <Avatar name={prof.name} size={42} url={prof.avatarUrl??undefined}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:700,color:selected?colors.red.DEFAULT:colors.gray[900],whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{prof.name}</div>
        <div style={{fontSize:12,color:colors.gray.dimText,marginTop:1}}>{prof.role??'Profissional'}</div>
      </div>
      {!prof.active&&<span style={{fontSize:10,fontWeight:700,color:colors.gray.dimText,background:colors.background.page,border:`1px solid ${colors.gray.borderMd}`,borderRadius:6,padding:'2px 6px',flexShrink:0}}>INATIVO</span>}
      <ChevronRight size={15} color={selected?colors.red.DEFAULT:colors.gray.dimText} strokeWidth={2}/>
    </button>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function EquipePage() {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [allServices,   setAllServices]   = useState<Service[]>([])
  const [loading,       setLoading]       = useState(true)
  const [selected,      setSelected]      = useState<Professional|null>(null)
  const [showPanel,     setShowPanel]     = useState(false)
  const [showAdd,       setShowAdd]       = useState(false)
  const [q,             setQ]             = useState('')

  useEffect(() => {
    let cancelled = false
    // Busca profissionais
    api.get('/equipe')
      .then(res => {
        if (cancelled) return
        const data = res.data?.data??res.data
        const list: Professional[] = Array.isArray(data)?data:data.professionals??[]
        setProfessionals(list)
        if (list.length>0) setSelected(prev=>prev??list[0])
      })
      .catch(()=>{ if (!cancelled) setProfessionals([]) })
      .finally(()=>{ if (!cancelled) setLoading(false) })
    // Busca todos os serviços para o picker
    api.get('/services')
      .then(res => {
        if (cancelled) return
        const data = res.data?.data??res.data
        setAllServices(Array.isArray(data)?data:data.services??[])
      })
      .catch(()=>{ if (!cancelled) setAllServices([]) })
    return () => { cancelled = true }
  }, [])

  const filtered = professionals.filter(p =>
    p.name.toLowerCase().includes(q.toLowerCase()) ||
    (p.role??'').toLowerCase().includes(q.toLowerCase())
  )
  const activeCount = professionals.filter(p=>p.active).length

  function handleUpdated(updated: Professional) {
    setProfessionals(prev => prev.map(p => p.id===updated.id ? updated : p))
    setSelected(updated)
  }
  function handleDeleted(id: string) {
    setProfessionals(prev => prev.filter(p => p.id!==id))
    setSelected(prev => prev?.id===id ? (professionals.find(p=>p.id!==id)??null) : prev)
  }
  function handleCreated(prof: Professional) {
    setProfessionals(prev => [...prev, prof])
    setSelected(prof); setShowPanel(true)
  }

  return (
    <>
      <style>{`
        @keyframes eligi-fade-up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .eq-layout{display:grid;grid-template-columns:280px 1fr;height:calc(100vh - 140px);animation:eligi-fade-up 380ms cubic-bezier(0.22,1,0.36,1) both}
        .eq-sidebar{border-right:1px solid ${colors.gray.border};display:flex;flex-direction:column;background:rgba(255,255,255,0.80);backdrop-filter:blur(20px);overflow:hidden}
        .eq-panel-wrap{overflow:hidden;display:flex;flex-direction:column}
        .eq-back-btn{display:none!important}
        @media(max-width:768px){
          .eq-layout{grid-template-columns:1fr;height:auto}
          .eq-sidebar{border-right:none}
          .eq-panel-wrap{display:none}
          .eq-panel-wrap.visible{display:flex!important;flex-direction:column;position:fixed;inset:0;z-index:200;background:#fff;overflow-y:auto}
          .eq-back-btn{display:flex!important}
        }
      `}</style>

      {showAdd && <AddProfessionalModal onCreated={handleCreated} onClose={()=>setShowAdd(false)}/>}

      {/* Page Header */}
      <div style={{marginBottom:20,animation:'eligi-fade-up 300ms cubic-bezier(0.22,1,0.36,1) both',display:'flex',alignItems:'flex-end',justifyContent:'space-between'}}>
        <div>
          <h2 style={{fontSize:22,fontWeight:700,letterSpacing:'-0.025em',color:'var(--text-primary,#0f0f14)',margin:0,lineHeight:1.2}}>Equipe</h2>
          <p style={{fontSize:14,color:'var(--text-secondary,#6b7280)',marginTop:4}}>
            {loading?'Carregando...':`${activeCount} ativo${activeCount!==1?'s':''}`}
          </p>
        </div>
        <button onClick={()=>setShowAdd(true)} style={{display:'flex',alignItems:'center',gap:7,padding:'9px 18px',borderRadius:12,border:'none',background:colors.red.gradient,color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',boxShadow:`0 4px 14px ${colors.red.glow}`,letterSpacing:'.02em'}}>
          <Plus size={15} strokeWidth={2.5}/>Adicionar
        </button>
      </div>

      {/* Container */}
      <div style={{background:'rgba(255,255,255,0.72)',backdropFilter:'blur(20px) saturate(160%)',WebkitBackdropFilter:'blur(20px) saturate(160%)',borderRadius:20,border:'1px solid rgba(255,255,255,0.60)',boxShadow:'0 2px 0 rgba(255,255,255,0.85) inset, 0 8px 28px rgba(0,0,0,0.06)',overflow:'hidden',animation:'eligi-fade-up 380ms cubic-bezier(0.22,1,0.36,1) both'}}>
        <div className="eq-layout">

          {/* Sidebar */}
          <div className="eq-sidebar">
            <div style={{padding:'14px 16px 10px',borderBottom:`1px solid ${colors.gray.border}`,flexShrink:0}}>
              <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',borderRadius:10,background:colors.background.page,border:`1px solid ${colors.gray.borderMd}`}}>
                <Search size={13} color={colors.gray.dimText} strokeWidth={2}/>
                <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Procurar profissional..." style={{flex:1,border:'none',outline:'none',fontSize:13,background:'transparent',color:colors.gray[900],fontFamily:typography.fontFamily}}/>
                {q&&<button onClick={()=>setQ('')} style={{background:'none',border:'none',cursor:'pointer',padding:0,display:'flex'}}><X size={12} color={colors.gray.dimText}/></button>}
              </div>
            </div>
            <div style={{flex:1,overflowY:'auto'}}>
              {loading ? (
                <div style={{padding:'40px 20px',textAlign:'center',color:colors.gray.dimText,fontSize:14}}>Carregando equipe...</div>
              ) : filtered.length===0 ? (
                <div style={{padding:'40px 20px',textAlign:'center'}}>
                  <UserCog size={26} color={colors.gray.dimText} style={{opacity:0.25,marginBottom:10}}/>
                  <div style={{fontSize:13,color:colors.gray.dimText}}>{q?<>Nenhum resultado para &ldquo;{q}&rdquo;</>:'Nenhum profissional'}</div>
                </div>
              ) : (
                filtered.map(p=>(
                  <ProfItem key={p.id} prof={p} selected={selected?.id===p.id}
                    onClick={()=>{ setSelected(p); setShowPanel(true) }}
                  />
                ))
              )}
            </div>
          </div>

          {/* Painel */}
          <div className={`eq-panel-wrap${showPanel?' visible':''}`}>
            {selected ? (
              <ProfessionalPanel key={selected.id} prof={selected} allServices={allServices}
                onClose={()=>setShowPanel(false)} onUpdated={handleUpdated} onDeleted={handleDeleted}
              />
            ) : (
              <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12,color:colors.gray.dimText,padding:40}}>
                <UserCog size={36} style={{opacity:0.18}}/>
                <span style={{fontSize:14}}>Selecione um profissional</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  )
}