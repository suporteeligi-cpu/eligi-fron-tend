'use client'
// src/app/(dashboard)/configuracoes/page.tsx

import Link from 'next/link'
import { useState } from 'react'
import LegalModal from '@/shared/legal/LegalModal'
import {
  Calendar, Building2, CreditCard, Users,
  Sliders, Bell, Shield, ChevronRight, Scissors, Sparkles,
  FileText, Lock, Globe,
} from 'lucide-react'

type ModuleItem = {
  href?:       string
  modal?:      'termos' | 'privacidade'
  icon:        React.ElementType
  label:       string
  description: string
  available:   boolean
}
type ModuleGroup = { group: string; items: ModuleItem[] }

const MODULES: ModuleGroup[] = [
  {
    group: 'Agendamento',
    items: [
      {
        href:        '/dashboard/configuracoes/agendamento',
        icon:        Calendar,
        label:       'Configurações de agendamento',
        description: 'Confirmação automática, limites de tempo e regras de remarcação.',
        available:   true,
      },
      {
        href:        '/dashboard/configuracoes/horarios',
        icon:        Sliders,
        label:       'Horários de funcionamento',
        description: 'Defina os dias e horários em que seu negócio aceita agendamentos.',
        available:   true,
      },
    ],
  },
  {
    group: 'Financeiro',
    items: [
      {
        href:        '/dashboard/configuracoes/assinatura',
        icon:        Sparkles,
        label:       'Sua Assinatura Eligi',
        description: 'Seu plano, valor mensal e situacao da cobranca.',
        available:   true,
      },
      {
        href:        '/dashboard/configuracoes/eligiclub',
        icon:        Globe,
        label:       'EligiClub — Cobrança recorrente',
        description: 'Conecte sua conta Asaas para cobrar as mensalidades do clube automaticamente.',
        available:   true,
      },
      {
        href:        '/dashboard/configuracoes/pagamentos',
        icon:        CreditCard,
        label:       'Pagamentos e checkout',
        description: 'Formas de pagamento aceitas e configurações de cobrança.',
        available:   false,
      },
    ],
  },
  {
    group: 'Serviços',
    items: [
      {
        href:        '/dashboard/configuracoes/servicos',
        icon:        Scissors,
        label:       'Configurações de serviços',
        description: 'Crie, edite e organize os serviços oferecidos pelo seu negócio.',
        available:   true,
      },
    ],
  },
  {
    group: 'Negócio',
    items: [
      {
        href:        '/dashboard/configuracoes/empresa',
        icon:        Building2,
        label:       'Detalhes da empresa',
        description: 'Nome, endereço, fuso horário e informações do seu estabelecimento.',
        available:   true,   // ⭐ HABILITADO
      },
      {
        href:        '/dashboard/configuracoes/equipe',
        icon:        Users,
        label:       'Equipe e profissionais',
        description: 'Gerencie permissões e configurações individuais de cada profissional.',
        available:   false,
      },
    ],
  },
  {
    group: 'Sistema',
    items: [
      {
        href:        '/dashboard/configuracoes/notificacoes',
        icon:        Bell,
        label:       'Notificações',
        description: 'Escolha o que te avisa e como o pop-up aparece.',
        available:   true,
      },
      {
        href:        '/dashboard/configuracoes/privacidade',
        icon:        Shield,
        label:       'Privacidade e segurança',
        description: 'Controle de dados, LGPD e configurações de acesso.',
        available:   false,
      },
    ],
  },
  {
    group: 'Legal',
    items: [
      {
        modal:       'termos',
        icon:        FileText,
        label:       'Termos de Uso',
        description: 'Condições de uso da plataforma, assinatura e responsabilidades.',
        available:   true,
      },
      {
        modal:       'privacidade',
        icon:        Lock,
        label:       'Política de Privacidade',
        description: 'Como tratamos seus dados e os dados dos seus clientes (LGPD).',
        available:   true,
      },
    ],
  },
]

function ModuleCard({
  href, icon: Icon, label, description, available, modal, onOpenModal,
}: {
  href?: string; icon: React.ElementType; label: string
  description: string; available: boolean
  modal?: 'termos' | 'privacidade'
  onOpenModal?: (kind: 'termos' | 'privacidade') => void
}) {
  const inner = (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '18px 20px',
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(20px)',
        borderRadius: 14,
        border: `1px solid ${available ? 'rgba(0,0,0,0.07)' : 'rgba(0,0,0,0.05)'}`,
        boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
        cursor: available ? 'pointer' : 'default',
        opacity: available ? 1 : 0.6,
        transition: 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease, border-color 0.18s ease',
        position: 'relative', overflow: 'hidden',
      }}
      onMouseEnter={e => {
        if (!available) return
        const el = e.currentTarget as HTMLDivElement
        el.style.transform   = 'translateY(-2px)'
        el.style.boxShadow   = '0 8px 24px rgba(220,38,38,0.10)'
        el.style.borderColor = 'rgba(220,38,38,0.20)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.transform   = 'translateY(0)'
        el.style.boxShadow   = '0 1px 6px rgba(0,0,0,0.04)'
        el.style.borderColor = available ? 'rgba(0,0,0,0.07)' : 'rgba(0,0,0,0.05)'
      }}
    >
      <div style={{
        width: 42, height: 42, borderRadius: 12, flexShrink: 0,
        background: available
          ? 'linear-gradient(135deg,rgba(220,38,38,0.10),rgba(185,28,28,0.06))'
          : 'rgba(0,0,0,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: available ? '1px solid rgba(220,38,38,0.12)' : '1px solid rgba(0,0,0,0.06)',
      }}>
        <Icon size={20} color={available ? '#dc2626' : 'rgba(0,0,0,0.3)'} strokeWidth={1.8} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: available ? '#111827' : 'rgba(0,0,0,0.4)' }}>
            {label}
          </span>
          {!available && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
              background: 'rgba(0,0,0,0.06)', color: 'rgba(0,0,0,0.35)',
              letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>
              Em breve
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', lineHeight: 1.5 }}>
          {description}
        </div>
      </div>

      {available && (
        <ChevronRight size={16} color="rgba(0,0,0,0.25)" strokeWidth={2} style={{ flexShrink: 0 }} />
      )}
    </div>
  )

  if (!available) return inner
  if (modal) {
    return (
      <div onClick={() => onOpenModal?.(modal)} style={{ display: 'block', cursor: 'pointer' }}>
        {inner}
      </div>
    )
  }
  return (
    <Link href={href!} style={{ textDecoration: 'none', display: 'block' }}>
      {inner}
    </Link>
  )
}

export default function ConfiguracoesPage() {
  const [legal, setLegal] = useState<null | 'termos' | 'privacidade'>(null)
  return (
    <>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }`}</style>
      <div style={{ maxWidth: 720, animation: 'fadeUp 0.3s ease', fontFamily: '-apple-system,"SF Pro Display",system-ui,sans-serif' }}>
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em', color: '#0f0f14' }}>Configurações</h2>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'rgba(0,0,0,0.45)' }}>Personalize o comportamento do seu negócio no Eligi.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {MODULES.map(group => (
            <div key={group.group}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10, paddingLeft: 2 }}>
                {group.group}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {group.items.map(item => (
                  <ModuleCard key={item.href ?? item.modal ?? item.label} {...item} onOpenModal={setLegal} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {legal && <LegalModal kind={legal} onClose={() => setLegal(null)} />}
    </>
  )
}
