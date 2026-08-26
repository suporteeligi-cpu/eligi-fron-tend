'use client'
// src/app/dashboard/servicos/components/ServiceModal.tsx
// @eligi:service-modal-v2
// Criar e editar servico. LOGICA DE SALVAMENTO PRESERVADA: mesmo payload,
// mesmas rotas (POST/PUT /services e PUT /services/:id/professionals), mesma
// ordem. So a forma de escolher mudou.
//
// O que sai:
//   - os DOIS <select> de duracao (horas e minutos). No iOS viram roda, no
//     Android viram menu, e escolher "1h" + "30min" eram quatro toques de
//     precisao. Agora sao chips iguais aos do cartao da lista — o lojista
//     aprende uma vez e reconhece nos dois lugares.
//   - o <select> invisivel de categoria (opacity 0 sobreposto ao visual):
//     virou chip, com a cor da categoria a vista.
//   - o <img> cru do avatar do profissional, ultimo warning de lint do modulo.
//     Virou span com background-image: mesma foto, sem a tag que o next
//     reclama, e sem precisar configurar remotePatterns.
//   - `isMobile` decidindo layout: agora e @media.
//
// A PALETA DE CORES NAO MUDA: e a mesma da agenda. Ver ColorPicker.

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Users, Check, Clock } from 'lucide-react'

import api from '@/shared/lib/apiClient'
import { colors, typography, radius } from '@/shared/theme'
import { Service, ServiceCategory } from '@/features/services/types'
import { DEFAULT_SERVICE_COLOR } from '@/features/services/constants/colorPalette'
import { formatDuration } from '@/features/services/utils/format'
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
  onClose:    () => void
  onSaved:    (s: Service, isNew: boolean) => void
}

const TAP = 44

/** Duracoes que cobrem a maioria dos servicos de salao e barbearia. */
const QUICK_DURATIONS = [15, 20, 30, 40, 45, 60, 90, 120]

/** O schema do back exige duracao minima de 5 minutos. */
const MIN_DURATION = 5

function getInitials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w.charAt(0)).join('').toUpperCase()
}

export default function ServiceModal({ service, categories, onClose, onSaved }: Props) {
  const isEdit = !!service

  const [name,        setName]        = useState(service?.name        ?? '')
  const [categoryId,  setCategoryId]  = useState<string>(service?.categoryId ?? '')
  const [duration,    setDuration]    = useState(service?.duration    ?? 30)
  const [price,       setPrice]       = useState<string>(service?.price != null ? String(service.price) : '')
  const [description, setDescription] = useState(service?.description ?? '')
  const [color,       setColor]       = useState<string>(service?.color ?? DEFAULT_SERVICE_COLOR)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  /** Duracao fora da lista de chips abre o campo livre, ja preenchido. */
  const [customOpen, setCustomOpen] = useState(
    () => !QUICK_DURATIONS.includes(service?.duration ?? 30),
  )

  const [allProfs,      setAllProfs]      = useState<ProfLite[]>([])
  const [selectedProfs, setSelectedProfs] = useState<Set<string>>(new Set())
  const [profsLoading,  setProfsLoading]  = useState(false)

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
    if (duration < MIN_DURATION) { setError(`Duração mínima é ${MIN_DURATION} minutos`); return }
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
      const res = isEdit
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
    fontSize:      11,
    fontWeight:    typography.weight.bold,
    color:         colors.gray.dimText,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    marginBottom:  8,
    display:       'block',
  }

  const fieldGap: React.CSSProperties = { marginBottom: 20 }

  return createPortal(
    <>
      <style>{`
        @keyframes svc-fade { from{opacity:0} to{opacity:1} }
        @keyframes svc-up   { from{transform:translateY(100%)} to{transform:translateY(0)} }
        @keyframes svc-in   { from{opacity:0;transform:translate(-50%,-50%) scale(.96)}
                              to{opacity:1;transform:translate(-50%,-50%) scale(1)} }

        .svc-input{
          width:100%; min-height:${TAP}px; padding:0 14px;
          border-radius:${radius.md}px; border:1px solid ${colors.gray.borderMd};
          background:#fff; color:${colors.gray[900]};
          /* 16px evita o zoom automatico do iOS ao focar o campo */
          font-size:16px; outline:none; box-sizing:border-box;
          font-family:${typography.fontFamily};
          transition:border-color .15s, box-shadow .15s;
        }
        textarea.svc-input{ padding:12px 14px; min-height:80px; line-height:1.5; resize:vertical }
        .svc-input:focus{ border-color:${colors.red.borderHover};
                          box-shadow:0 0 0 3px ${colors.red.focusRing} }

        .svc-chips{ display:flex; gap:7px; overflow-x:auto; padding-bottom:4px;
                    scrollbar-width:none; -ms-overflow-style:none }
        .svc-chips::-webkit-scrollbar{ display:none }

        /* Folha por baixo em tela estreita, caixa centrada quando ha espaco.
           Antes isso era decidido por device mode, que classifica ponteiro. */
        .svc-modal{
          position:fixed; left:0; right:0; bottom:0; top:60px; z-index:9999;
          background:#fff; border-radius:24px 24px 0 0;
          box-shadow:0 -8px 40px rgba(0,0,0,0.18);
          display:flex; flex-direction:column;
          animation:svc-up .3s cubic-bezier(0.34,1.2,0.64,1);
        }
        .svc-handle{ width:44px;height:5px;border-radius:3px;background:rgba(0,0,0,.12);margin:10px auto 2px }
        @media (min-width: 640px){
          .svc-modal{
            top:50%; left:50%; right:auto; bottom:auto;
            transform:translate(-50%,-50%);
            width:520px; max-width:94vw; max-height:92vh;
            border-radius:${radius['2xl']}px;
            border:1px solid ${colors.gray.borderMd};
            animation:svc-in .25s cubic-bezier(0.34,1.56,0.64,1);
          }
          .svc-handle{ display:none }
        }
        @media (prefers-reduced-motion: reduce){ .svc-modal{ animation:none } }
      `}</style>

      <div
        onClick={onClose}
        style={{
          position:             'fixed',
          inset:                0,
          background:           'rgba(0,0,0,0.30)',
          backdropFilter:       'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex:               9998,
          animation:            'svc-fade 0.18s ease',
        }}
      />

      <div className="svc-modal" role="dialog" aria-label={isEdit ? 'Editar serviço' : 'Novo serviço'}
        style={{ fontFamily: typography.fontFamily }}>
        <div aria-hidden className="svc-handle" />

        {/* cabecalho */}
        <div style={{
          padding:      '14px 20px',
          borderBottom: `1px solid ${colors.gray.border}`,
          display:      'flex',
          alignItems:   'center',
          gap:          12,
          flexShrink:   0,
        }}>
          <h2 style={{
            margin:        0,
            flex:          1,
            minWidth:      0,
            fontSize:      18,
            fontWeight:    typography.weight.bold,
            color:         colors.gray[900],
            letterSpacing: '-0.02em',
          }}>
            {isEdit ? 'Editar serviço' : 'Novo serviço'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            style={{
              width: TAP, height: TAP, flexShrink: 0,
              display: 'grid', placeItems: 'center',
              border: 'none', borderRadius: 14,
              background: 'rgba(17,17,20,0.05)',
              color: colors.gray.dimText,
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <X size={19} strokeWidth={2.4} />
          </button>
        </div>

        {/* corpo */}
        <div style={{
          flex:                    1,
          overflowY:               'auto',
          WebkitOverflowScrolling: 'touch',
          padding:                 20,
        }}>
          {error && (
            <div style={{
              marginBottom: 16, padding: '11px 14px', borderRadius: radius.sm,
              background: colors.red.subtle, border: `1px solid ${colors.red.border}`,
              color: '#b91c1c', fontSize: 13,
            }}>
              {error}
            </div>
          )}

          {/* nome */}
          <div style={fieldGap}>
            <label style={labelStyle} htmlFor="svc-name">Nome do serviço *</label>
            <input
              id="svc-name"
              className="svc-input"
              placeholder="Ex: Corte Masculino"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          {/* duracao */}
          <div style={fieldGap}>
            <label style={labelStyle}>Duração *</label>
            <div className="svc-chips">
              {QUICK_DURATIONS.map(d => {
                const active = !customOpen && duration === d
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => { setDuration(d); setCustomOpen(false) }}
                    aria-pressed={active}
                    style={chipStyle(active)}
                  >
                    {active && <Check size={13} strokeWidth={2.6} />}
                    {formatDuration(d)}
                  </button>
                )
              })}
              <button
                type="button"
                onClick={() => setCustomOpen(true)}
                aria-pressed={customOpen}
                style={chipStyle(customOpen)}
              >
                <Clock size={13} strokeWidth={2.2} />
                Outro
              </button>
            </div>

            {customOpen && (
              <div style={{
                display:    'flex',
                alignItems: 'center',
                gap:        10,
                marginTop:  10,
              }}>
                <input
                  className="svc-input"
                  type="number"
                  inputMode="numeric"
                  min={MIN_DURATION}
                  step={5}
                  value={duration}
                  onChange={e => setDuration(Number(e.target.value))}
                  aria-label="Duração em minutos"
                  style={{ maxWidth: 130 }}
                />
                <span style={{ fontSize: 13.5, color: colors.gray.dimText }}>
                  minutos {duration >= 60 && `· ${formatDuration(duration)}`}
                </span>
              </div>
            )}
          </div>

          {/* categoria */}
          <div style={fieldGap}>
            <label style={labelStyle}>Categoria</label>
            {categories.length === 0 ? (
              <div style={{
                padding: '12px 14px', borderRadius: radius.md,
                border: `1px dashed ${colors.gray.borderMd}`,
                fontSize: 13, color: colors.gray.dimText,
              }}>
                Nenhuma categoria cadastrada. Crie uma em &quot;Categorias&quot;, na página de serviços.
              </div>
            ) : (
              <div className="svc-chips">
                <button
                  type="button"
                  onClick={() => setCategoryId('')}
                  aria-pressed={categoryId === ''}
                  style={chipStyle(categoryId === '')}
                >
                  Sem categoria
                </button>
                {categories.map(c => {
                  const active = categoryId === c.id
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategoryId(c.id)}
                      aria-pressed={active}
                      style={chipStyle(active)}
                    >
                      <span
                        aria-hidden
                        style={{
                          width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
                          background: c.color ?? colors.gray.dimText,
                        }}
                      />
                      {c.name}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* cor */}
          <div style={fieldGap}>
            <label style={labelStyle}>Cor na agenda</label>
            <ColorPicker selected={color} onSelect={setColor} />
          </div>

          {/* preco */}
          <div style={fieldGap}>
            <label style={labelStyle} htmlFor="svc-price">Preço (R$)</label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 14, top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 14, color: colors.gray.dimText,
                fontWeight: typography.weight.medium,
                pointerEvents: 'none',
              }}>
                R$
              </span>
              <input
                id="svc-price"
                className="svc-input"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={price}
                onChange={e => setPrice(e.target.value)}
                style={{ paddingLeft: 42 }}
              />
            </div>
          </div>

          {/* descricao */}
          <div style={fieldGap}>
            <label style={labelStyle} htmlFor="svc-desc">Descrição (opcional)</label>
            <textarea
              id="svc-desc"
              className="svc-input"
              placeholder="Descreva o serviço para seus clientes…"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          {/* profissionais */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
              <Users size={14} color={colors.gray.dimText} />
              <span style={{ ...labelStyle, marginBottom: 0 }}>Quem executa</span>
            </div>
            <div style={{ fontSize: 12.5, color: colors.gray.dimText, marginBottom: 12, lineHeight: 1.45 }}>
              Selecione quem pode realizar este serviço. Deixe vazio para todos.
            </div>

            {profsLoading ? (
              <div style={{ fontSize: 13, color: colors.gray.dimText, padding: '8px 0' }}>
                Carregando…
              </div>
            ) : allProfs.length === 0 ? (
              <div style={{
                padding: '12px 14px', borderRadius: radius.md,
                border: `1px dashed ${colors.gray.borderMd}`,
                fontSize: 13, color: colors.gray.dimText,
              }}>
                Nenhum profissional cadastrado ainda.
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {allProfs.map(prof => {
                  const selected = selectedProfs.has(prof.id)
                  return (
                    <button
                      key={prof.id}
                      type="button"
                      onClick={() => toggleProf(prof.id)}
                      aria-pressed={selected}
                      style={{
                        display:                 'flex',
                        alignItems:              'center',
                        gap:                     8,
                        minHeight:               TAP,
                        padding:                 '0 14px 0 7px',
                        borderRadius:            999,
                        border:                  `1.5px solid ${selected ? colors.red.DEFAULT : colors.gray.borderMd}`,
                        background:              selected ? colors.red.subtle : '#fff',
                        cursor:                  'pointer',
                        fontFamily:              'inherit',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      {/* background-image no lugar de <img>: mesma foto, sem a
                          tag que o next reclama e sem exigir remotePatterns */}
                      <span
                        aria-hidden
                        style={{
                          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                          display: 'grid', placeItems: 'center',
                          color: '#fff', fontSize: 10, fontWeight: 700,
                          backgroundColor: selected ? colors.red.DEFAULT : colors.gray.dimText,
                          backgroundImage: prof.avatarUrl ? `url(${prof.avatarUrl})` : undefined,
                          backgroundSize:     'cover',
                          backgroundPosition: 'center',
                        }}
                      >
                        {!prof.avatarUrl && getInitials(prof.name)}
                      </span>

                      <span style={{
                        fontSize:   13.5,
                        fontWeight: selected ? typography.weight.bold : typography.weight.medium,
                        color:      selected ? colors.red.DEFAULT : colors.gray[900],
                        whiteSpace: 'nowrap',
                      }}>
                        {prof.name}
                      </span>

                      {selected && <Check size={14} color={colors.red.DEFAULT} strokeWidth={3} />}
                    </button>
                  )
                })}
              </div>
            )}

            {selectedProfs.size > 0 && (
              <div style={{ marginTop: 10, fontSize: 12, color: colors.gray.dimText }}>
                {selectedProfs.size} selecionado{selectedProfs.size !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>

        {/* rodape */}
        <div style={{
          padding:    '14px 20px max(20px, env(safe-area-inset-bottom))',
          borderTop:  `1px solid ${colors.gray.border}`,
          display:    'flex',
          gap:        8,
          flexShrink: 0,
          background: '#fff',
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              minHeight:               TAP,
              padding:                 '0 20px',
              borderRadius:            radius.md,
              border:                  `1px solid ${colors.gray.borderMd}`,
              background:              '#fff',
              color:                   colors.gray[900],
              fontSize:                14,
              fontWeight:              typography.weight.semibold,
              fontFamily:              'inherit',
              cursor:                  'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              flex:                    1,
              minHeight:               TAP,
              borderRadius:            radius.md,
              border:                  'none',
              background:              saving ? 'rgba(220,38,38,0.25)' : colors.red.gradient,
              color:                   '#fff',
              fontSize:                14.5,
              fontWeight:              typography.weight.bold,
              fontFamily:              'inherit',
              cursor:                  saving ? 'not-allowed' : 'pointer',
              boxShadow:               saving ? 'none' : `0 4px 14px ${colors.red.glow}`,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {saving ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Criar serviço'}
          </button>
        </div>
      </div>
    </>,
    document.body,
  )
}

function chipStyle(active: boolean): React.CSSProperties {
  return {
    flexShrink:              0,
    minHeight:               TAP,
    display:                 'inline-flex',
    alignItems:              'center',
    gap:                     6,
    padding:                 '0 15px',
    borderRadius:            999,
    border:                  active
      ? `1.5px solid ${colors.red.DEFAULT}`
      : `1px solid ${colors.gray.borderMd}`,
    background:              active ? colors.red.subtle : '#fff',
    color:                   active ? colors.red.DEFAULT : colors.gray[900],
    fontSize:                13.5,
    fontWeight:              700,
    fontFamily:              'inherit',
    cursor:                  'pointer',
    whiteSpace:              'nowrap',
    WebkitTapHighlightColor: 'transparent',
  }
}
