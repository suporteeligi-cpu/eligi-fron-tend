'use client'
// src/app/dashboard/financeiro/components/ModuleCard.tsx

import { useRouter } from 'next/navigation'
import { ChevronRight, Lock } from 'lucide-react'
import { colors, typography, radius, shadows } from '@/shared/theme'

interface Props {
  title:       string
  description: string
  href?:       string            // se passou, é ativo e leva pra essa rota
  Icon:        React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>
  gradient:    string             // gradient do ícone
  phaseLabel?: string             // "Fase 6.6", "Fase 6.7" etc (só aparece se não tem href)
  children?:   React.ReactNode    // conteúdo opcional do card (resumo)
}

export default function ModuleCard({
  title, description, href, Icon, gradient, phaseLabel, children,
}: Props) {
  const router = useRouter()
  const isLocked = !href

  function handleClick() {
    if (href) router.push(href)
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLocked}
      style={{
        background: '#fff',
        border: `1px solid ${colors.gray.border}`,
        borderRadius: radius.lg,
        boxShadow: shadows.sm,
        padding: '18px 18px 16px',
        textAlign: 'left',
        cursor: isLocked ? 'not-allowed' : 'pointer',
        opacity: isLocked ? 0.7 : 1,
        fontFamily: typography.fontFamily,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minHeight: 140,
        transition: 'all 0.18s ease',
        WebkitTapHighlightColor: 'transparent',
        position: 'relative',
      }}
      onMouseEnter={e => {
        if (!isLocked) {
          e.currentTarget.style.borderColor = colors.red.borderHover
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = shadows.md
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = colors.gray.border
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = shadows.sm
      }}
    >
      {/* Header com ícone + título */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}>
        <div style={{
          width: 42, height: 42, borderRadius: 11,
          background: gradient,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          filter: isLocked ? 'saturate(0.5)' : 'none',
        }}>
          <Icon size={20} color="#fff" strokeWidth={2.2} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 2,
          }}>
            <span style={{
              fontSize: typography.scale.lg,
              fontWeight: typography.weight.bold,
              color: typography.color.primary,
              letterSpacing: '-0.01em',
            }}>
              {title}
            </span>
            {isLocked && (
              <Lock size={11} color={colors.gray.dimText} strokeWidth={2.2} style={{ marginTop: 2 }} />
            )}
          </div>
          <div style={{
            fontSize: typography.scale.sm,
            color: typography.color.muted,
            lineHeight: 1.35,
          }}>
            {description}
          </div>
        </div>

        {!isLocked && (
          <ChevronRight
            size={18}
            color={colors.gray.dimTextLight}
            style={{ flexShrink: 0, marginTop: 4 }}
          />
        )}
      </div>

      {/* Conteúdo opcional (resumo do módulo ativo OU "Em breve" placeholder) */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
        {children ?? (
          <div style={{
            width: '100%',
            padding: '8px 12px',
            background: colors.background.page,
            border: `1px dashed ${colors.gray.borderMd}`,
            borderRadius: radius.sm,
            fontSize: typography.scale.xs,
            fontWeight: typography.weight.bold,
            color: typography.color.muted,
            textTransform: 'uppercase',
            letterSpacing: '.07em',
            textAlign: 'center',
          }}>
            Em breve · {phaseLabel ?? 'próxima fase'}
          </div>
        )}
      </div>
    </button>
  )
}
