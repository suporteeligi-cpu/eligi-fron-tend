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
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export default function AgendaToolbar({ selectedDate, onDateChange }: Props) {
  const selected = dayjs(selectedDate)
  const today = dayjs()

  const startOfWeek = selected.startOf('week')
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    startOfWeek.add(i, 'day')
  )

  const monthLabel = `${MONTHS_PT[selected.month()]} ${selected.year()}`
  const todayLabel = `${DAYS_PT[today.day()]}, ${today.date()} de ${MONTHS_PT[today.month()].toLowerCase()}`

  function prevWeek() {
    onDateChange(selected.subtract(7, 'day').toDate())
  }
  function nextWeek() {
    onDateChange(selected.add(7, 'day').toDate())
  }

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
        padding: '0 0 16px 0',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        flexShrink: 0,
      }}
    >
      <style>{`
        .toolbar-day-btn {
          flex: 1 0 auto;
          min-width: 46px;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 10px 4px;
          border-radius: 14px;
          border: 1px solid rgba(0,0,0,0.07);
          cursor: pointer;
          background: rgba(255,255,255,0.7);
          backdrop-filter: blur(8px);
          transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease, border-color 0.18s;
        }
        .toolbar-day-btn:hover {
          transform: translateY(-2px);
          border-color: rgba(220,38,38,0.3);
          box-shadow: 0 4px 14px rgba(220,38,38,0.1);
        }
        .toolbar-day-btn.active {
          background: linear-gradient(135deg, #dc2626, #b91c1c);
          border-color: transparent;
          box-shadow: 0 4px 18px rgba(220,38,38,0.3);
        }
        .toolbar-nav-btn {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 1px solid rgba(0,0,0,0.09);
          background: rgba(255,255,255,0.6);
          cursor: pointer;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #374151;
          transition: background 0.15s, transform 0.15s;
        }
        .toolbar-nav-btn:hover {
          background: rgba(220,38,38,0.08);
          color: #dc2626;
          border-color: rgba(220,38,38,0.2);
          transform: scale(1.08);
        }
      `}</style>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 20px 16px',
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: '-0.5px',
              color: '#111827',
              fontFamily: '-apple-system, "SF Pro Display", system-ui, sans-serif',
            }}
          >
            Minha Agenda
          </h1>
          <p
            style={{
              margin: '3px 0 0',
              fontSize: 13,
              color: 'rgba(0,0,0,0.42)',
              fontFamily: '-apple-system, system-ui, sans-serif',
              textTransform: 'capitalize',
            }}
          >
            {todayLabel}
          </p>
        </div>

        {/* Month nav */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(255,255,255,0.7)',
            border: '1px solid rgba(0,0,0,0.09)',
            borderRadius: 20,
            padding: '6px 12px',
            backdropFilter: 'blur(10px)',
          }}
        >
          <button className="toolbar-nav-btn" onClick={prevWeek}>
            ‹
          </button>
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: '#1f2937',
              minWidth: 110,
              textAlign: 'center',
              fontFamily: '-apple-system, system-ui, sans-serif',
            }}
          >
            {monthLabel}
          </span>
          <button className="toolbar-nav-btn" onClick={nextWeek}>
            ›
          </button>
        </div>
      </div>

      {/* Week strip */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          padding: '0 20px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {weekDays.map((day) => {
          const isSelected = day.isSame(selected, 'day')
          const isToday = day.isSame(today, 'day')

          return (
            <button
              key={day.format('YYYY-MM-DD')}
              className={`toolbar-day-btn${isSelected ? ' active' : ''}`}
              onClick={() => onDateChange(day.toDate())}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  color: isSelected
                    ? 'rgba(255,255,255,0.7)'
                    : 'rgba(0,0,0,0.38)',
                  marginBottom: 4,
                  fontFamily: '-apple-system, system-ui, sans-serif',
                }}
              >
                {DAYS_PT[day.day()]}
              </span>
              <span
                style={{
                  fontSize: 19,
                  fontWeight: 700,
                  lineHeight: 1,
                  color: isSelected
                    ? '#fff'
                    : isToday
                    ? '#dc2626'
                    : '#111827',
                  fontFamily:
                    '-apple-system, "SF Pro Display", system-ui, sans-serif',
                }}
              >
                {day.date()}
              </span>
              {/* today dot */}
              <div
                style={{
                  height: 5,
                  marginTop: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isToday && (
                  <div
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      background: isSelected
                        ? 'rgba(255,255,255,0.7)'
                        : '#dc2626',
                    }}
                  />
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}