'use client'

import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import weekOfYear from 'dayjs/plugin/weekOfYear'

dayjs.extend(weekOfYear)
dayjs.locale('pt-br')

interface Props {
  selectedDate: Date
  onDateChange: (d: Date) => void
}

const DAYS_PT = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']
const MONTHS_PT = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
]

export default function AgendaToolbar({ selectedDate, onDateChange }: Props) {
  const selected = dayjs(selectedDate)
  const today = dayjs()

  // Gera os 7 dias da semana atual baseado no dia selecionado
  const startOfWeek = selected.startOf('week')
  const weekDays = Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'))

  const monthLabel = `${MONTHS_PT[selected.month()]} ${selected.year()}`
  const todayLabel = `${DAYS_PT[today.day()]}, ${today.date()} de ${MONTHS_PT[today.month()].toLowerCase()}`

  function prevWeek() {
    onDateChange(selected.subtract(7, 'day').toDate())
  }

  function nextWeek() {
    onDateChange(selected.add(7, 'day').toDate())
  }

  return (
    <div style={{
      background: 'var(--bg-elevated)',
      backdropFilter: 'blur(var(--blur-lg))',
      WebkitBackdropFilter: 'blur(var(--blur-lg))',
      borderBottom: '1px solid var(--border-soft)',
      padding: '0 0 16px 0',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      flexShrink: 0
    }}>
      {/* Header row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 24px 16px'
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '-0.5px',
            color: 'var(--text)'
          }}>
            Minha Agenda
          </h1>
          <p style={{
            margin: '2px 0 0',
            fontSize: 13,
            color: 'var(--text-muted)',
            textTransform: 'capitalize'
          }}>
            {todayLabel}
          </p>
        </div>

        {/* Month nav */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--bg-glass)',
          border: '1px solid var(--border-soft)',
          borderRadius: 'var(--radius-md)',
          padding: '6px 14px',
          backdropFilter: 'blur(10px)'
        }}>
          <button
            onClick={prevWeek}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: 16, padding: '0 4px',
              lineHeight: 1, transition: 'color 0.15s'
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            ‹
          </button>
          <span style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--text)',
            minWidth: 110,
            textAlign: 'center'
          }}>
            {monthLabel}
          </span>
          <button
            onClick={nextWeek}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: 16, padding: '0 4px',
              lineHeight: 1, transition: 'color 0.15s'
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            ›
          </button>
        </div>
      </div>

      {/* Week strip */}
      <div style={{
        display: 'flex',
        gap: 8,
        padding: '0 24px',
        overflowX: 'auto',
        scrollbarWidth: 'none'
      }}>
        {weekDays.map((day) => {
          const isSelected = day.isSame(selected, 'day')
          const isToday = day.isSame(today, 'day')

          // dot count: simula agendamentos (em produção virá do hook)
          const dots = isToday ? 3 : isSelected ? 1 : 0

          return (
            <button
              key={day.format('YYYY-MM-DD')}
              onClick={() => onDateChange(day.toDate())}
              style={{
                flex: '1 0 auto',
                minWidth: 52,
                maxWidth: 72,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '10px 6px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s var(--ease)',
                background: isSelected
                  ? 'var(--brand)'
                  : isToday
                  ? 'rgba(225,6,0,0.08)'
                  : 'var(--bg-glass)',
                backdropFilter: 'blur(10px)',
                boxShadow: isSelected ? 'var(--shadow-sm)' : 'none'
              }}
            >
              <span style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.06em',
                color: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)',
                marginBottom: 4
              }}>
                {DAYS_PT[day.day()]}
              </span>
              <span style={{
                fontSize: 20,
                fontWeight: 700,
                lineHeight: 1,
                color: isSelected ? '#fff' : 'var(--text)'
              }}>
                {day.date()}
              </span>
              {/* dots */}
              <div style={{
                display: 'flex', gap: 3, marginTop: 6, height: 5, alignItems: 'center'
              }}>
                {Array.from({ length: Math.min(dots, 3) }).map((_, i) => (
                  <div key={i} style={{
                    width: 4, height: 4, borderRadius: '50%',
                    background: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--brand)',
                    opacity: isSelected ? 1 : 0.6
                  }} />
                ))}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}