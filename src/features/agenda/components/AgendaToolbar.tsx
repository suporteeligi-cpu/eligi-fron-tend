'use client'

import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import { colors, transitions } from '@/shared/theme'
import { useAgendaStore } from '../hooks/useAgendaStore'

dayjs.extend(weekOfYear)
dayjs.locale('pt-br')

const DAYS_PT   = ['DOM','SEG','TER','QUA','QUI','SEX','SÁB']
const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export default function AgendaToolbar() {
  const { selectedDate, setSelectedDate } = useAgendaStore()
  const selected = dayjs(selectedDate)
  const today    = dayjs()
  const startOfWeek = selected.startOf('week')
  const weekDays    = Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'))
  const monthLabel  = `${MONTHS_PT[selected.month()]} ${selected.year()}`
  const todayLabel  = `${DAYS_PT[today.day()]}, ${today.date()} de ${MONTHS_PT[today.month()].toLowerCase()}`

  return (
    <div style={{
      background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)', borderBottom: `1px solid ${colors.gray.border}`,
      padding: '0 0 16px 0', position: 'sticky', top: 0, zIndex: 100, flexShrink: 0,
    }}>
      <style>{`
        .toolbar-day-btn {
          flex: 1 0 auto; min-width: 46px; display: flex; flex-direction: column;
          align-items: center; padding: 10px 4px; border-radius: 14px;
          border: 1px solid ${colors.gray.border}; cursor: pointer;
          background: rgba(255,255,255,0.7); backdrop-filter: blur(8px);
          transition: ${transitions.spring};
        }
        .toolbar-day-btn:hover { transform: translateY(-2px); border-color: ${colors.red.borderHover}; box-shadow: 0 4px 14px ${colors.red.focusRing}; }
        .toolbar-day-btn.active { background: ${colors.red.gradient}; border-color: transparent; box-shadow: 0 4px 18px ${colors.red.glow}; }
        .toolbar-nav-btn {
          width: 30px; height: 30px; border-radius: 50%;
          border: 1px solid ${colors.gray.borderMd}; background: rgba(255,255,255,0.6);
          cursor: pointer; font-size: 16px; display: flex; align-items: center;
          justify-content: center; color: ${colors.gray['700']}; transition: ${transitions.fast};
        }
        .toolbar-nav-btn:hover { background: ${colors.red.subtle}; color: ${colors.red.DEFAULT}; border-color: ${colors.red.border}; transform: scale(1.08); }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', color: colors.gray['900'], fontFamily: '-apple-system, "SF Pro Display", system-ui, sans-serif' }}>
            Minha Agenda
          </h1>
          <p style={{ margin: '3px 0 0', fontSize: 13, color: colors.gray.dimText, textTransform: 'capitalize' }}>
            {todayLabel}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.7)', border: `1px solid ${colors.gray.borderMd}`, borderRadius: 20, padding: '6px 12px', backdropFilter: 'blur(10px)' }}>
          <button className="toolbar-nav-btn" onClick={() => setSelectedDate(selected.subtract(7, 'day').toDate())}>‹</button>
          <span style={{ fontSize: 14, fontWeight: 500, color: colors.gray['800'], minWidth: 110, textAlign: 'center' }}>{monthLabel}</span>
          <button className="toolbar-nav-btn" onClick={() => setSelectedDate(selected.add(7, 'day').toDate())}>›</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, padding: '0 20px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {weekDays.map((day) => {
          const isSelected = day.isSame(selected, 'day')
          const isToday    = day.isSame(today, 'day')
          return (
            <button key={day.format('YYYY-MM-DD')} className={`toolbar-day-btn${isSelected ? ' active' : ''}`} onClick={() => setSelectedDate(day.toDate())}>
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', color: isSelected ? 'rgba(255,255,255,0.7)' : colors.gray.dimText, marginBottom: 4 }}>
                {DAYS_PT[day.day()]}
              </span>
              <span style={{ fontSize: 19, fontWeight: 700, lineHeight: 1, color: isSelected ? '#fff' : isToday ? colors.red.DEFAULT : colors.gray['900'] }}>
                {day.date()}
              </span>
              <div style={{ height: 5, marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isToday && <div style={{ width: 4, height: 4, borderRadius: '50%', background: isSelected ? 'rgba(255,255,255,0.7)' : colors.red.DEFAULT }} />}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
