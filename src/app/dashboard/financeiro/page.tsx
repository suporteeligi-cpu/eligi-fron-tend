'use client'
// src/app/dashboard/financeiro/page.tsx

import {
  DollarSign, ShoppingCart, BarChart3, TrendingDown, ReceiptText,
} from 'lucide-react'
import { typography } from '@/shared/theme'
import { useDeviceMode } from '@/features/agenda/hooks/useDeviceMode'

import ModuleCard          from './components/ModuleCard'
import CommissionsSummary  from './components/CommissionsSummary'

export default function FinanceiroPage() {
  const mode     = useDeviceMode()
  const isMobile = mode === 'mobile'

  const cols = isMobile ? 1 : 2

  return (
    <>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)}}
      `}</style>

      <div style={{
        maxWidth: 900,
        padding: isMobile ? '0 12px' : 0,
        animation: 'fadeUp 0.3s ease',
        fontFamily: typography.fontFamily,
      }}>
        {/* Header */}
        <div style={{ marginBottom: 22 }}>
          <h1 style={{
            fontSize: isMobile ? 24 : 28,
            fontWeight: typography.weight.bold,
            color: typography.color.primary,
            margin: 0,
            letterSpacing: '-0.02em',
          }}>
            Financeiro
          </h1>
          <p style={{
            fontSize: typography.scale.base,
            color: typography.color.muted,
            marginTop: 4, marginBottom: 0,
          }}>
            Gestão financeira completa do seu negócio
          </p>
        </div>

        {/* Grid de módulos */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 12,
        }}>
          {/* Relatórios — em breve */}
          <ModuleCard
            title="Relatórios"
            description="Análises, gráficos e exportações"
            Icon={BarChart3}
            gradient="linear-gradient(135deg, #0891b2, #0e7490)"
            phaseLabel="Fase 7"
          />

          {/* Vendas — ATIVO */}
          <ModuleCard
            title="Vendas"
            description="Histórico completo de vendas e receita"
            href="/dashboard/financeiro/vendas"
            Icon={ShoppingCart}
            gradient="linear-gradient(135deg, #475569, #334155)"
          />

          {/* Despesas — em breve */}
          <ModuleCard
            title="Despesas"
            description="Custos operacionais e fluxo de caixa"
            Icon={TrendingDown}
            gradient="linear-gradient(135deg, #d97706, #b45309)"
            phaseLabel="Fase 7"
          />

          {/* ⭐ Comissões — ATIVO */}
          <ModuleCard
            title="Comissões"
            description="Pagamentos da equipe (serviços e produtos)"
            href="/dashboard/financeiro/comissoes"
            Icon={DollarSign}
            gradient="linear-gradient(135deg, #dc2626, #b91c1c)"
          >
            <CommissionsSummary />
          </ModuleCard>

          {/* Notas de Crédito — em breve */}
          <ModuleCard
            title="Notas de Crédito"
            description="Anulações e reembolsos emitidos"
            Icon={ReceiptText}
            gradient="linear-gradient(135deg, #7c3aed, #6d28d9)"
            phaseLabel="Fase 7"
          />
        </div>
      </div>
    </>
  )
}