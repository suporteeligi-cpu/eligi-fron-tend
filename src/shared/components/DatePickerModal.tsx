'use client'
// src/shared/components/DatePickerModal.tsx
// Calendário estilizado eligi — compartilhado entre Agenda e Caixa.
// Desktop: modal central. Mobile: bottom sheet.

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronRight } from 'lucide-react'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { colors, typography, radius, shadows } from '@/shared/theme'

dayjs.locale('pt-br')

interface Props {
  date:     dayjs.Dayjs
  onSelect: (d: dayjs.Dayjs) => void
  onClose:  () => void
  isMobile: boolean
  maxDate?: dayjs.Dayjs   // opcional: bloqueia dias após esta data
  minDate?: dayjs.Dayjs   // opcional: bloqueia dias antes desta data
}

export default function DatePickerModal({ date, onSelect, onClose, isMobile, maxDate, minDate }: Props) {
  const today = dayjs()
  const [view, setView] = useState(date.startOf('month'))
  const DAYS_H = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM']
  const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

  function buildGrid(month: dayjs.Dayjs) {
    const first  = month.startOf('month')
    const offset = (first.day() + 6) % 7
    const cells: (dayjs.Dayjs | null)[] = []
    for (let i = 0; i < offset; i++) cells.push(null)
    for (let d = 1; d <= month.daysInMonth(); d++) cells.push(month.date(d))
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }
  const grid = buildGrid(view)

  function isDisabled(day: dayjs.Dayjs): boolean {
    if (maxDate && day.isAfter(maxDate, 'day')) return true
    if (minDate && day.isBefore(minDate, 'day')) return true
    return false
  }

  const content = (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.22)', backdropFilter: 'blur(6px)', zIndex: 10998 }} />
      <div style={isMobile ? {
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(255,255,255,0.99)',
        borderRadius: '24px 24px 0 0',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.15)', zIndex: 10999,
        fontFamily: typography.fontFamily,
        animation: 'dpUp 0.28s cubic-bezier(0.34,1.2,0.64,1)',
        paddingBottom: 'max(20px,env(safe-area-inset-bottom))',
      } : {
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 320, background: 'rgba(255,255,255,0.99)',
        borderRadius: radius['2xl'], boxShadow: shadows.lg, zIndex: 10999,
        fontFamily: typography.fontFamily,
        animation: 'dpIn 0.22s cubic-bezier(0.34,1.56,0.64,1)', overflow: 'hidden',
      }}>
        <style>{`@keyframes dpIn{from{opacity:0;transform:translate(-50%,-50%) scale(0.93)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}@keyframes dpUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
        {isMobile && <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}><div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.12)' }} /></div>}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 10px' }}>
          <button onClick={() => setView(v => v.subtract(1, 'month'))} style={{ width: 32, height: 32, borderRadius: '50%', border: `1px solid ${colors.gray.borderMd}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronRight size={16} color={colors.gray[700]} style={{ transform: 'rotate(180deg)' }} strokeWidth={2.5} />
          </button>
          <span style={{ fontSize: 16, fontWeight: 700, color: colors.gray[900] }}>{MONTHS[view.month()]} {view.year()}</span>
          <button onClick={() => setView(v => v.add(1, 'month'))} style={{ width: 32, height: 32, borderRadius: '50%', border: `1px solid ${colors.gray.borderMd}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronRight size={16} color={colors.gray[700]} strokeWidth={2.5} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', padding: '0 16px 4px' }}>
          {DAYS_H.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: colors.gray.dimText, letterSpacing: '.06em', padding: '4px 0' }}>{d}</div>)}
        </div>

        <div style={{ padding: '0 16px 16px' }}>
          {Array.from({ length: grid.length / 7 }, (_, row) => (
            <div key={row} style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 2 }}>
              {grid.slice(row * 7, row * 7 + 7).map((day, ci) => {
                if (!day) return <div key={ci} />
                const isSel     = day.isSame(date, 'day')
                const isTodayD  = day.isSame(today, 'day')
                const isOther   = day.month() !== view.month()
                const disabled  = isDisabled(day)
                return (
                  <button
                    key={ci}
                    onClick={() => { if (!disabled) { onSelect(day); onClose() } }}
                    disabled={disabled}
                    style={{
                      height: 36, borderRadius: '50%', border: 'none',
                      background: isSel ? colors.red.gradient : 'transparent',
                      color: isSel ? '#fff' : disabled ? 'rgba(0,0,0,0.18)' : isTodayD ? colors.red.DEFAULT : isOther ? 'rgba(0,0,0,0.2)' : colors.gray[900],
                      fontWeight: isSel || isTodayD ? 700 : 500, fontSize: 13,
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      position: 'relative',
                      boxShadow: isSel ? `0 3px 10px ${colors.red.glow}` : 'none',
                    }}
                  >
                    {day.date()}
                    {isTodayD && !isSel && <div style={{ position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', background: colors.red.DEFAULT }} />}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </>
  )
  if (typeof document === 'undefined') return null
  return createPortal(content, document.body)
}
