'use client'

import { useDashboard } from '@/app/dashboard/DashboardContext'

type Period = 'today' | '7d' | '30d'

const PERIODS: { value: Period; label: string }[] = [
  { value: 'today', label: 'Hoje'    },
  { value: '7d',    label: '7 dias'  },
  { value: '30d',   label: '30 dias' },
]

export default function DashboardHeader() {
  const { period, setPeriod } = useDashboard()

  return (
    <>
      <style>{`
        .eligi-filter-btn {
          padding: 7px 16px;
          border-radius: 10px;
          border: 1px solid rgba(0,0,0,0.09);
          background: rgba(255,255,255,0.70);
          backdrop-filter: blur(10px);
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary, #6b7280);
          transition: all 150ms ease;
          letter-spacing: -0.01em;
        }
        .eligi-filter-btn:hover {
          background: rgba(255,255,255,0.90);
          color: var(--text-primary, #111827);
          border-color: rgba(0,0,0,0.14);
        }
        .eligi-filter-btn.active {
          background: rgba(220,38,38,0.09);
          border-color: rgba(220,38,38,0.25);
          color: #dc2626;
          font-weight: 600;
        }
        html.dark .eligi-filter-btn {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.09);
          color: rgba(255,255,255,0.48);
        }
        html.dark .eligi-filter-btn:hover {
          background: rgba(255,255,255,0.10);
          color: rgba(255,255,255,0.88);
        }
        html.dark .eligi-filter-btn.active {
          background: rgba(220,38,38,0.16);
          border-color: rgba(220,38,38,0.28);
          color: #f87171;
        }
      `}</style>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div>
          <h2 style={{
            fontSize: '22px',
            fontWeight: 700,
            letterSpacing: '-0.025em',
            color: 'var(--text-primary, #0f0f14)',
            margin: 0,
            lineHeight: 1.2,
          }}>
            Visão Geral
          </h2>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-secondary, #6b7280)',
            marginTop: '4px',
            fontWeight: 400,
          }}>
            Acompanhe o crescimento do seu negócio em tempo real.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          {PERIODS.map(p => (
            <button
              key={p.value}
              className={`eligi-filter-btn${period === p.value ? ' active' : ''}`}
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}