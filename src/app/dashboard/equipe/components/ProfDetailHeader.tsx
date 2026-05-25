'use client'
// src/app/dashboard/equipe/components/ProfDetailHeader.tsx

import { Trash2, Phone, Mail, ChevronLeft } from 'lucide-react'
import { colors, typography } from '@/shared/theme'
import { Professional } from '@/features/professionals/types'
import Avatar from './Avatar'

interface Props {
  prof:     Professional
  isMobile: boolean
  onEdit:   () => void
  onDelete: () => void
  onBack?:  () => void  // mobile only
}

export default function ProfDetailHeader({
  prof, isMobile, onEdit, onDelete, onBack,
}: Props) {
  if (isMobile) {
    return (
      <div style={{
        padding: '14px 16px 0',
        background: 'rgba(255,255,255,0.5)',
        fontFamily: typography.fontFamily,
      }}>
        {/* Actions */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 14,
        }}>
          <button
            onClick={onBack}
            style={{
              display: 'flex', alignItems: 'center', gap: 2,
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600,
              color: colors.gray.dimText,
              padding: 0,
              WebkitTapHighlightColor: 'transparent',
              fontFamily: 'inherit',
            }}
          >
            <ChevronLeft size={18} strokeWidth={2.5} />
            Voltar
          </button>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={onDelete}
              aria-label="Apagar"
              style={{
                padding: '6px 10px', borderRadius: 8,
                border: `1px solid rgba(220,38,38,0.2)`,
                background: 'rgba(220,38,38,0.06)',
                color: colors.red.DEFAULT,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center',
              }}
            >
              <Trash2 size={13} strokeWidth={2} />
            </button>
            <button
              onClick={onEdit}
              style={{
                padding: '6px 14px', borderRadius: 8,
                border: `1px solid ${colors.gray.borderMd}`,
                background: 'transparent',
                color: colors.gray[700],
                fontSize: 12, cursor: 'pointer', fontWeight: 600,
                fontFamily: 'inherit',
              }}
            >
              Editar
            </button>
          </div>
        </div>

        {/* Profile centered */}
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <div style={{ display: 'inline-block', marginBottom: 10 }}>
            <Avatar name={prof.name} size={72} url={prof.avatarUrl} />
          </div>
          <div style={{
            fontSize: 18, fontWeight: 700,
            color: colors.gray[900],
            letterSpacing: '-0.02em',
            marginBottom: 4,
          }}>
            {prof.name}
          </div>
          <div style={{
            fontSize: 12,
            color: colors.gray.dimText,
            marginBottom: 8,
          }}>
            {prof.role ?? 'Profissional'}
            {prof.phone && <> · {prof.phone}</>}
          </div>
          <StatusBadge active={prof.active} />
        </div>
      </div>
    )
  }

  // Desktop
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '16px 20px',
      borderBottom: `1px solid ${colors.gray.border}`,
      fontFamily: typography.fontFamily,
    }}>
      <Avatar name={prof.name} size={52} url={prof.avatarUrl} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2,
        }}>
          <span style={{
            fontSize: 17, fontWeight: 700,
            color: colors.gray[900],
            letterSpacing: '-0.02em',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {prof.name}
          </span>
          <StatusBadge active={prof.active} compact />
        </div>
        <div style={{
          fontSize: 13,
          color: colors.gray.dimText,
          display: 'flex', alignItems: 'center', gap: 10,
          flexWrap: 'wrap',
        }}>
          {prof.role && <span>{prof.role}</span>}
          {prof.phone && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Phone size={11} strokeWidth={2} />
              {prof.phone}
            </span>
          )}
          {prof.email && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Mail size={11} strokeWidth={2} />
              {prof.email}
            </span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button
          onClick={onDelete}
          aria-label="Apagar"
          style={{
            padding: '6px 12px', borderRadius: 8,
            border: `1px solid rgba(220,38,38,0.2)`,
            background: 'rgba(220,38,38,0.06)',
            color: colors.red.DEFAULT,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center',
          }}
        >
          <Trash2 size={13} strokeWidth={2} />
        </button>
        <button
          onClick={onEdit}
          style={{
            padding: '6px 14px', borderRadius: 8,
            border: `1px solid ${colors.gray.borderMd}`,
            background: 'transparent',
            color: colors.gray[700],
            fontSize: 12, cursor: 'pointer', fontWeight: 600,
            fontFamily: 'inherit',
          }}
        >
          Editar
        </button>
      </div>
    </div>
  )
}

function StatusBadge({ active, compact }: { active: boolean; compact?: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: compact ? '2px 8px' : '3px 10px',
      borderRadius: 20,
      background: active ? 'rgba(22,163,74,0.08)' : 'rgba(0,0,0,0.05)',
      border: `1px solid ${active ? 'rgba(22,163,74,0.2)' : 'rgba(0,0,0,0.08)'}`,
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: '50%',
        background: active ? '#16a34a' : colors.gray.dimText,
      }} />
      <span style={{
        fontSize: compact ? 10 : 11,
        fontWeight: 600,
        color: active ? '#15803d' : colors.gray.dimText,
      }}>
        {active ? 'Ativo' : 'Inativo'}
      </span>
    </span>
  )
}
