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

  const startOfWeek = selected.startOf('week')
  const weekDays = Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'))

  const monthLabel = `${MONTHS_PT[selected.month()]} ${selected.year()}`
  const todayLabel = `${DAYS_PT[today.day()]}, ${today.date()} de ${MONTHS_PT[today.month()].toLowerCase()}`

  function prevWeek() { onDateChange(selected.subtract(7, 'day').toDate()) }
  function nextWeek() { onDateChange(selected.add(7, 'day').toDate()) }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.72)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.35)',
      padding: '0 0 16px 0',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      flexShrink: 0
    }}>
      <style>{`
        .toolbar-day-btn {
          flex: 1 0 auto;
          min-width: 46px;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 10px 4px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.35);
          cursor: pointer;
          background: rgba(255,255,255,0.18);
          backdrop-filter: blur(10px);
          transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease, border-color 0.18s;
        }
        .toolbar-day-btn:hover {
          transform: translateY(-2px);
          border-color: rgba(255, 43, 43, 0.45);
          box-shadow: 0 4px 16px rgba(255, 43, 43, 0.12);
        }
        .toolbar-day-btn.active {
          background: linear-gradient(135deg, #ff2b2b, #e65c5c);
          border-color: transparent;
          box-shadow: 0 4px 18px rgba(255, 43, 43, 0.35);
        }
        .toolbar-nav-btn {
          width: 30px; height: 30px;
          border-radius: 50%;
          border: 1px solid rgba(0,0,0,0.08);
          background: rgba(255,255,255,0.5);
          cursor: pointer;
          font-size: 16px;
          display: flex; align-items: center; justify-content: center;
          color: #1a1a2e;
          transition: background 0.15s, transform 0.15s;
        }
        .toolbar-nav-btn:hover {
          background: rgba(43,125,255,0.1);
          transform: scale(1.08);
        }
      `}</style>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 20px 16px'
      }}>
        <div>
          <h1 style={{
            margin: 0, fontSize: 22, fontWeight: 600,
            letterSpacing: '-0.5px', color: '#1a1a2e',
            fontFamily: '-apple-system, "SF Pro Display", system-ui, sans-serif'
          }}>
            Minha Agenda
          </h1>
          <p style={{
            margin: '2px 0 0', fontSize: 13,
            color: 'rgba(26,26,46,0.5)',
            fontFamily: '-apple-system, system-ui, sans-serif',
            textTransform: 'capitalize'
          }}>
            {todayLabel}
          </p>
        </div>

        {/* Month nav */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,0.5)',
          border: '1px solid rgba(255,255,255,0.35)',
          borderRadius: 20, padding: '6px 12px',
          backdropFilter: 'blur(10px)'
        }}>
          <button className="toolbar-nav-btn" onClick={prevWeek}>‹</button>
          <span style={{
            fontSize: 14, fontWeight: 500, color: '#1a1a2e',
            minWidth: 110, textAlign: 'center',
            fontFamily: '-apple-system, system-ui, sans-serif'
          }}>
            {monthLabel}
          </span>
          <button className="toolbar-nav-btn" onClick={nextWeek}>›</button>
        </div>
      </div>

      {/* Week strip */}
      <div style={{
        display: 'flex', gap: 6, padding: '0 20px',
        overflowX: 'auto', scrollbarWidth: 'none'
      }}>
        {weekDays.map((day) => {
          const isSelected = day.isSame(selected, 'day')
          const isToday = day.isSame(today, 'day')
          const dots = isToday ? 3 : isSelected ? 1 : 0

          return (
            <button
              key={day.format('YYYY-MM-DD')}
              className={`toolbar-day-btn${isSelected ? ' active' : ''}`}
              onClick={() => onDateChange(day.toDate())}
            >
              <span style={{
                fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
                color: isSelected ? 'rgba(255,255,255,0.75)' : 'rgba(26,26,46,0.45)',
                marginBottom: 4, fontFamily: '-apple-system, system-ui, sans-serif'
              }}>
                {DAYS_PT[day.day()]}
              </span>
              <span style={{
                fontSize: 19, fontWeight: 600, lineHeight: 1,
                color: isSelected ? '#fff' : isToday ? '#ff0000' : '#1a1a2e',
                fontFamily: '-apple-system, "SF Pro Display", system-ui, sans-serif'
              }}>
                {day.date()}
              </span>
              <div style={{
                display: 'flex', gap: 3, marginTop: 6, height: 5, alignItems: 'center'
              }}>
                {Array.from({ length: Math.min(Math.floor(dots), 3) }).map((_, i) => (
                  <div key={i} style={{
                    width: 4, height: 4, borderRadius: '50%',
                    background: isSelected ? 'rgba(255,255,255,0.7)' : '#ff2b2b',
                    opacity: isSelected ? 1 : 0.55
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