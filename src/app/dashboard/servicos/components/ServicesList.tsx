'use client'
// src/app/dashboard/servicos/components/ServicesList.tsx
// @eligi:services-list-v2
// Lista de servicos — uma so, responsiva por @media.
//
// Substitui ServiceRow + ServicesListMobile + ServicesListDesktop. O ServiceRow
// tinha DUAS arvores completas no mesmo arquivo (card mobile e linha desktop),
// e a page escolhia a lista por device mode: tres arquivos para manter o mesmo
// conteudo.
//
// O nome do servico e o protagonista:
//   - a bolinha de 38px virou faixa de 4px (cor e metadado, nao protagonista)
//   - a categoria saiu da linha: ja esta no chip de filtro, logo acima
//   - o nome ganha ate 2 linhas em vez de "Corte + barba co..."
//   - preco em tom neutro forte: vermelho no Eligi e marca e alerta, nao preco
//
// Categorias viram CHIPS DE FILTRO no lugar do accordion: um toque troca a
// lista inteira, sem abrir e fechar secao.
//
// Ajuste rapido: tocar no cartao abre chips de duracao que salvam direto,
// sem abrir o modal. Mudar a duracao de um servico vira 2 toques.

import { useState } from 'react'
import {
  Clock, Users, TriangleAlert, Pencil, Trash2, Check, Loader2,
} from 'lucide-react'

import api from '@/shared/lib/apiClient'
import { colors, typography } from '@/shared/theme'
import { Service } from '@/features/services/types'
import { formatDuration, formatPrice } from '@/features/services/utils/format'
import { colorHexToGradient } from '@/features/services/constants/colorPalette'

interface Props {
  services:  Service[]
  onEdit:    (s: Service) => void
  onDelete:  (s: Service) => void
  onUpdated: (s: Service) => void
  onError:   (message: string) => void
}

/** Alvo minimo de toque. */
const TAP = 44

/** Duracoes que cobrem a maioria dos servicos de salao e barbearia. */
const QUICK_DURATIONS = [15, 20, 30, 40, 45, 60, 90, 120]

export default function ServicesList({
  services, onEdit, onDelete, onUpdated, onError,
}: Props) {
  const [openId, setOpenId] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)

  async function quickDuration(s: Service, duration: number) {
    if (duration === s.duration) return
    try {
      setSaving(s.id)
      // O schema de update tem todos os campos opcionais e o service so grava
      // o que vier definido, entao mandar apenas a duracao e seguro.
      const res = await api.put(`/services/${s.id}`, { duration })
      const saved = res.data?.data ?? res.data
      onUpdated(saved && saved.id ? saved : { ...s, duration })
    } catch {
      onError('Não foi possível salvar a duração')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div style={{ fontFamily: typography.fontFamily }}>
      <style>{`
        .svc-card{ transition: box-shadow .18s ease; }
        @media (hover:hover){ .svc-card:hover{ box-shadow: 0 6px 20px rgba(17,17,20,.08); } }
        .svc-quick{ display:flex; gap:7px; overflow-x:auto; padding-bottom:4px;
                    scrollbar-width:none; -ms-overflow-style:none; }
        .svc-quick::-webkit-scrollbar{ display:none; }
        @media (prefers-reduced-motion: reduce){ .svc-card{ transition:none } }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {services.map(s => {
          const open   = openId === s.id
          const busy   = saving === s.id
          const profs  = s._count?.professionals ?? null
          const noProf = profs === 0

          return (
            <div
              key={s.id}
              className="svc-card"
              style={{
                background:     'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(16px)',
                border:         '1px solid rgba(17,17,20,0.07)',
                borderLeft:     `4px solid transparent`,
                borderImage:    'none',
                borderRadius:   18,
                boxShadow:      '0 2px 12px rgba(17,17,20,0.04)',
                overflow:       'hidden',
                position:       'relative',
              }}
            >
              {/* faixa de cor: 4px, no lugar da bolinha de 38px */}
              <span
                aria-hidden
                style={{
                  position:   'absolute',
                  left:       0,
                  top:        0,
                  bottom:     0,
                  width:      4,
                  background: colorHexToGradient(s.color),
                }}
              />

              <button
                type="button"
                onClick={() => setOpenId(open ? null : s.id)}
                aria-expanded={open}
                style={{
                  width:                   '100%',
                  display:                 'flex',
                  alignItems:              'flex-start',
                  gap:                     12,
                  padding:                 '13px 14px 13px 18px',
                  minHeight:               TAP + 18,
                  border:                  'none',
                  background:              'transparent',
                  textAlign:               'left',
                  cursor:                  'pointer',
                  fontFamily:              'inherit',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{
                    display:           '-webkit-box',
                    WebkitLineClamp:   2,
                    WebkitBoxOrient:   'vertical',
                    overflow:          'hidden',
                    fontSize:          15.5,
                    fontWeight:        700,
                    lineHeight:        1.28,
                    letterSpacing:     '-0.01em',
                    color:             colors.gray[900],
                  }}>
                    {s.name}
                  </span>

                  <span style={{
                    display:   'flex',
                    alignItems:'center',
                    gap:       6,
                    flexWrap:  'wrap',
                    marginTop: 6,
                  }}>
                    <span style={metaChip}>
                      <Clock size={11} strokeWidth={2.2} />
                      {formatDuration(s.duration)}
                    </span>

                    {noProf ? (
                      <span style={{ ...metaChip, background: 'rgba(220,38,38,0.08)', color: colors.red.DEFAULT }}>
                        <TriangleAlert size={11} strokeWidth={2.3} />
                        ninguém atende
                      </span>
                    ) : profs !== null && (
                      <span style={metaChip}>
                        <Users size={11} strokeWidth={2.2} />
                        {profs} {profs === 1 ? 'profissional' : 'profissionais'}
                      </span>
                    )}
                  </span>
                </span>

                {/* @eligi:pricemode-list — piso declarado fica visivel na lista.
                    Coluna em vez de chip: a linha de metadados ja carrega duracao
                    e contagem de profissionais. */}
                <span style={{
                  flexShrink:         0,
                  display:            'flex',
                  flexDirection:      'column',
                  alignItems:         'flex-end',
                  lineHeight:         1.15,
                  fontFamily:         "'Space Grotesk', " + typography.fontFamily,
                  fontSize:           16,
                  fontWeight:         700,
                  letterSpacing:      '-0.02em',
                  fontVariantNumeric: 'tabular-nums',
                  color:              s.price != null && s.price > 0
                    ? colors.gray[900]
                    : colors.gray.dimText,
                  whiteSpace:         'nowrap',
                  paddingTop:         1,
                }}>
                  {s.priceMode === 'FROM' && s.price != null && (
                    <span style={{
                      fontFamily:    typography.fontFamily,
                      fontSize:      9,
                      fontWeight:    700,
                      letterSpacing: '.04em',
                      color:         colors.gray.dimText,
                    }}>
                      a partir de
                    </span>
                  )}
                  {formatPrice(s.price)}
                </span>
              </button>

              {open && (
                <div style={{
                  borderTop: '1px solid rgba(17,17,20,0.07)',
                  padding:   '12px 14px 14px 18px',
                }}>
                  <div style={{
                    display:      'flex',
                    alignItems:   'center',
                    gap:          7,
                    fontSize:     11,
                    fontWeight:   700,
                    letterSpacing:'.12em',
                    color:        colors.gray.dimText,
                    marginBottom: 9,
                  }}>
                    DURAÇÃO
                    {busy && <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} />}
                  </div>

                  <div className="svc-quick">
                    {QUICK_DURATIONS.map(d => {
                      const active = s.duration === d
                      return (
                        <button
                          key={d}
                          type="button"
                          disabled={busy}
                          onClick={() => quickDuration(s, d)}
                          aria-pressed={active}
                          style={{
                            flexShrink:              0,
                            minHeight:               40,
                            padding:                 '0 14px',
                            borderRadius:            999,
                            border:                  active
                              ? `1.5px solid ${colors.red.DEFAULT}`
                              : '1px solid rgba(17,17,20,0.09)',
                            background:              active ? 'rgba(220,38,38,0.07)' : '#fff',
                            color:                   active ? colors.red.DEFAULT : colors.gray[900],
                            fontSize:                13,
                            fontWeight:              700,
                            fontFamily:              'inherit',
                            cursor:                  busy ? 'default' : 'pointer',
                            opacity:                 busy ? 0.6 : 1,
                            display:                 'inline-flex',
                            alignItems:              'center',
                            gap:                     5,
                            whiteSpace:              'nowrap',
                            WebkitTapHighlightColor: 'transparent',
                          }}
                        >
                          {active && <Check size={13} strokeWidth={2.6} />}
                          {formatDuration(d)}
                        </button>
                      )
                    })}
                  </div>

                  <div style={{ display: 'flex', gap: 7, marginTop: 12, flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => onEdit(s)} style={actionBtn}>
                      <Pencil size={13} strokeWidth={2.2} />
                      Editar tudo
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(s)}
                      style={{ ...actionBtn, background: 'rgba(220,38,38,0.07)', color: colors.red.DEFAULT }}
                    >
                      <Trash2 size={13} strokeWidth={2.2} />
                      Excluir
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const metaChip: React.CSSProperties = {
  display:      'inline-flex',
  alignItems:   'center',
  gap:          4,
  fontSize:     11.5,
  fontWeight:   600,
  padding:      '4px 9px',
  borderRadius: 999,
  background:   'rgba(17,17,20,0.05)',
  color:        '#4b4b52',
  whiteSpace:   'nowrap',
}

const actionBtn: React.CSSProperties = {
  minHeight:               36,
  display:                 'inline-flex',
  alignItems:              'center',
  gap:                     6,
  padding:                 '0 13px',
  borderRadius:            999,
  border:                  'none',
  background:              'rgba(17,17,20,0.05)',
  color:                   '#4b4b52',
  fontSize:                12.5,
  fontWeight:              700,
  fontFamily:              'inherit',
  cursor:                  'pointer',
  whiteSpace:              'nowrap',
  WebkitTapHighlightColor: 'transparent',
}
