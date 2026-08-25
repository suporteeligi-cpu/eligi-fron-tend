'use client'
// src/app/dashboard/equipe/components/ProfessionalDetail.tsx
// @eligi:prof-detail
// Detalhe de UM profissional, com abas internas: Perfil / Horários / Comissões.
//
// Substitui a estrutura antiga, em que HORÁRIOS e COMISSÕES eram abas GLOBAIS
// que na verdade mostravam uma pessoa — com um "Voltar" escondido dentro do
// card. Eram dois niveis de navegacao disputando a mesma tela.
//
// Nao reescreve nada de logica: HoursPanel, CategoryList,
// CommissionServicesEditor e CommissionProductsEditor sao reaproveitados como
// estao, com as mesmas props. Os editores de comissao mexem com dinheiro e tem
// auto-save proprio — sao reposicionados, nunca reescritos.
//
// Os produtos so sao buscados quando a aba Comissoes e aberta: quem nunca abre
// essa aba nao paga o GET /products.

import { useState, useEffect } from 'react'
import { ChevronLeft, Trash2, Pencil, UserRound, Clock, Percent } from 'lucide-react'

import api from '@/shared/lib/apiClient'
import { colors, typography } from '@/shared/theme'
import {
  Professional, ServiceItem, ProductLite,
} from '@/features/professionals/types'
import { CommissionCategoryId } from '@/features/professionals/constants/commissionCategories'
import { fmtCommission } from '@/features/professionals/utils/format'

import Avatar                   from './Avatar'
import ServicesReadOnly         from './ServicesReadOnly'
import HoursPanel               from './HoursPanel'
import CategoryList             from './CategoryList'
import CommissionServicesEditor from './CommissionServicesEditor'
import CommissionProductsEditor from './CommissionProductsEditor'
import ProfEditModal            from './ProfEditModal'
import ConfirmModal             from './ConfirmModal'

type Pane = 'perfil' | 'horarios' | 'comissoes'

interface Props {
  prof:        Professional
  allServices: ServiceItem[]
  onBack:      () => void
  onUpdated:   (p: Professional) => void
  onDeleted:   (id: string) => void
  onDelete:    (id: string) => Promise<void>
}

const TAP = 44

const PANES: Array<{
  id:    Pane
  label: string
  Icon:  React.ComponentType<{ size?: number; strokeWidth?: number }>
}> = [
  { id: 'perfil',    label: 'Perfil',    Icon: UserRound },
  { id: 'horarios',  label: 'Horários',  Icon: Clock },
  { id: 'comissoes', label: 'Comissões', Icon: Percent },
]

export default function ProfessionalDetail({
  prof, allServices, onBack, onUpdated, onDeleted, onDelete,
}: Props) {
  const [pane, setPane]         = useState<Pane>('perfil')
  const [category, setCategory] = useState<CommissionCategoryId>('services')

  const [editing, setEditing]       = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const [deleting, setDeleting]     = useState(false)

  const [products, setProducts]         = useState<ProductLite[]>([])
  const [productsAsked, setProductsAsked] = useState(false)

  // Produtos so quando a aba Comissoes abre pela primeira vez.
  useEffect(() => {
    if (pane !== 'comissoes' || productsAsked) return
    setProductsAsked(true)

    let cancelled = false
    api.get('/products')
      .then(res => {
        if (cancelled) return
        const data = res.data?.data ?? res.data
        const list = Array.isArray(data) ? data : data.products ?? []
        setProducts(list.filter((p: ProductLite & { active?: boolean }) => p.active !== false))
      })
      .catch(() => { if (!cancelled) setProducts([]) })

    return () => { cancelled = true }
  }, [pane, productsAsked])

  async function handleDelete() {
    try {
      setDeleting(true)
      await onDelete(prof.id)
      onDeleted(prof.id)
      setConfirmDel(false)
    } catch {
      // o erro fica visivel pela ausencia de mudanca na lista
    } finally {
      setDeleting(false)
    }
  }

  const profServices = (prof.services ?? []).map(ps => ps.service)

  const summaries: Partial<Record<CommissionCategoryId, string>> = {
    services: prof.commissionType && prof.commissionValue != null
      ? `${fmtCommission(prof.commissionType, prof.commissionValue)} padrão`
      : 'Não definido',
    products: prof.commissionProductType && prof.commissionProductValue != null
      ? `${fmtCommission(prof.commissionProductType, prof.commissionProductValue)} padrão`
      : 'Não definido',
  }

  return (
    <>
      {editing && (
        <ProfEditModal
          prof={prof}
          allServices={allServices}
          isMobile={false}
          onSaved={onUpdated}
          onClose={() => setEditing(false)}
        />
      )}
      {confirmDel && (
        <ConfirmModal
          title="Apagar profissional?"
          body="Será apagado permanentemente. Agendamentos existentes ficam no histórico (sem vínculo)."
          confirmLabel="Sim, apagar"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDel(false)}
          confirming={deleting}
          isMobile={false}
        />
      )}

      <div style={{
        background:     'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(16px)',
        border:         '1px solid rgba(17,17,20,0.07)',
        borderRadius:   24,
        boxShadow:      '0 4px 20px rgba(17,17,20,0.05)',
        overflow:       'hidden',
        fontFamily:     typography.fontFamily,
        display:        'flex',
        flexDirection:  'column',
        minHeight:      0,
      }}>
        <style>{`
          .eq-pane-tabs{ display:flex; gap:6px; overflow-x:auto; padding:0 12px 12px;
                         scrollbar-width:none; -ms-overflow-style:none; }
          .eq-pane-tabs::-webkit-scrollbar{ display:none; }
          /* Voltar so existe quando lista e detalhe nao cabem lado a lado.
             Acima de 900px a lista continua visivel a esquerda. */
          @media (min-width: 900px){ .eq-detail-back{ display:none !important; } }
        `}</style>

        {/* cabecalho */}
        <div style={{
          display:    'flex',
          alignItems: 'center',
          gap:        10,
          padding:    '12px 12px 12px 8px',
          background: 'linear-gradient(135deg, rgba(220,38,38,0.06), transparent 60%)',
        }}>
          <button
            type="button"
            onClick={onBack}
            aria-label="Voltar para a lista"
            className="eq-detail-back"
            style={{
              width:                   TAP,
              height:                  TAP,
              flexShrink:              0,
              display:                 'grid',
              placeItems:              'center',
              border:                  'none',
              borderRadius:            14,
              background:              'transparent',
              color:                   colors.red.DEFAULT,
              cursor:                  'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <ChevronLeft size={22} strokeWidth={2.4} />
          </button>

          <Avatar name={prof.name} size={44} url={prof.avatarUrl} />

          <div style={{ flex: 1, minWidth: 0, paddingLeft: 2 }}>
            <div style={{
              display:    'flex',
              alignItems: 'center',
              gap:        7,
              minWidth:   0,
            }}>
              <span style={{
                fontSize:      17,
                fontWeight:    700,
                color:         colors.gray[900],
                letterSpacing: '-0.02em',
                overflow:      'hidden',
                textOverflow:  'ellipsis',
                whiteSpace:    'nowrap',
              }}>
                {prof.name}
              </span>
              {!prof.active && (
                <span style={{
                  flexShrink:   0,
                  fontSize:     10,
                  fontWeight:   700,
                  borderRadius: 999,
                  padding:      '2px 8px',
                  background:   'rgba(17,17,20,0.06)',
                  color:        colors.gray.dimText,
                }}>
                  Inativo
                </span>
              )}
            </div>
            <div style={{
              fontSize:     12.5,
              color:        colors.gray.dimText,
              marginTop:    1,
              overflow:     'hidden',
              textOverflow: 'ellipsis',
              whiteSpace:   'nowrap',
            }}>
              {prof.role ?? 'Profissional'}
              {prof.phone ? ` · ${prof.phone}` : ''}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Editar profissional"
            style={{
              width:                   TAP,
              height:                  TAP,
              flexShrink:              0,
              display:                 'grid',
              placeItems:              'center',
              border:                  '1px solid rgba(17,17,20,0.08)',
              borderRadius:            14,
              background:              '#fff',
              color:                   colors.gray[900],
              cursor:                  'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Pencil size={17} strokeWidth={2.2} />
          </button>

          <button
            type="button"
            onClick={() => setConfirmDel(true)}
            aria-label="Apagar profissional"
            style={{
              width:                   TAP,
              height:                  TAP,
              flexShrink:              0,
              display:                 'grid',
              placeItems:              'center',
              border:                  '1px solid rgba(220,38,38,0.18)',
              borderRadius:            14,
              background:              'rgba(220,38,38,0.06)',
              color:                   colors.red.DEFAULT,
              cursor:                  'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Trash2 size={16} strokeWidth={2.2} />
          </button>
        </div>

        {/* abas internas */}
        <div className="eq-pane-tabs">
          {PANES.map(p => {
            const active = pane === p.id
            const Icon = p.Icon
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPane(p.id)}
                aria-pressed={active}
                style={{
                  flexShrink:              0,
                  minHeight:               TAP,
                  display:                 'inline-flex',
                  alignItems:              'center',
                  gap:                     7,
                  padding:                 '0 16px',
                  borderRadius:            999,
                  border:                  'none',
                  background:              active ? colors.gray[900] : 'rgba(17,17,20,0.05)',
                  color:                   active ? '#fff' : colors.gray.dimText,
                  fontSize:                13.5,
                  fontWeight:              700,
                  fontFamily:              'inherit',
                  cursor:                  'pointer',
                  whiteSpace:              'nowrap',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <Icon size={15} strokeWidth={2.2} />
                {p.label}
              </button>
            )
          })}
        </div>

        {/* painel */}
        <div style={{
          flex:                    1,
          minHeight:               0,
          overflowY:               'auto',
          WebkitOverflowScrolling: 'touch',
          padding:                 '4px 16px 20px',
          borderTop:               '1px solid rgba(17,17,20,0.06)',
        }}>
          {pane === 'perfil' && (
            <div style={{ paddingTop: 12 }}>
              <ServicesReadOnly services={profServices} isMobile />
            </div>
          )}

          {pane === 'horarios' && (
            <div style={{ paddingTop: 14 }}>
              <HoursPanel
                key={prof.id}
                profId={prof.id}
                profName={prof.name}
                isMobile
              />
            </div>
          )}

          {pane === 'comissoes' && (
            <div style={{ paddingTop: 6 }}>
              <div style={{ margin: '0 -16px 12px' }}>
                <CategoryList
                  selected={category}
                  onSelect={setCategory}
                  summaries={summaries}
                  variant="mobile"
                />
              </div>

              {category === 'services' && (
                <CommissionServicesEditor
                  key={`${prof.id}-services`}
                  prof={prof}
                  allServices={allServices}
                  isMobile
                  onChanged={onUpdated}
                />
              )}

              {category === 'products' && (
                <CommissionProductsEditor
                  key={`${prof.id}-products`}
                  prof={prof}
                  allProducts={products}
                  isMobile
                  onChanged={onUpdated}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
