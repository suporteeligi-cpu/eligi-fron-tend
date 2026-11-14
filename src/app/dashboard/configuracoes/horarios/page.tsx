'use client'
// src/app/dashboard/configuracoes/horarios/page.tsx
// @eligi:cfg-horarios-v2 — Horario de funcionamento, lista de 7 dias (ver @eligi:doc-cfg-horarios).
// Uma linha por dia: chave aberto/fechado e o horario; tocar no horario abre a folha
// para escolher abertura e fechamento. Salva a cada mudanca (PUT com os 7 dias).
// Depois de carregar e de cada mudanca, confere quem da equipe atende fora do
// horario da loja (GET /business-hours/team-diff) e avisa, sem mudar nada sozinho.
// Mudar e ver a equipe: so dono e gerente (o back responde 403 para os outros).

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, Copy, TriangleAlert, X } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { typography } from '@/shared/theme'
import TimeStepper from '@/features/business-hours/components/TimeStepper'
import {
  DAY_NAMES, durationLabel, isSlotInvalid, slotMinutes, weeklyMinutes,
  type HourSlot,
} from '@/features/business-hours/types'

/** Segunda primeiro, domingo no fim: e como o dono pensa a semana. */
const ORDER = [1, 2, 3, 4, 5, 6, 0]
const SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const WEEKDAY_LOWER = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']

type Issue =
  | { weekday: number; kind: 'CLOSED_DAY'; startTime: string; endTime: string }
  | { weekday: number; kind: 'OUTSIDE'; startTime: string; endTime: string; storeStart: string; storeEnd: string }
type TeamDiff = { professionals: { id: string; name: string; issues: Issue[] }[] }

const INK = '#111114'
const INK_2 = '#4b4b52'
const INK_3 = '#6b6b73'

const CSS = `
.cfh{ max-width:720px; font-family:${typography.fontFamily}; color:${INK}; animation:cfh-in .25s ease; }
@keyframes cfh-in{ from{opacity:0; transform:translateY(6px)} to{opacity:1; transform:none} }
@keyframes cfh-pulse{ 0%,100%{opacity:.5} 50%{opacity:1} }
.cfh *, .cfh-sheet *{ box-sizing:border-box; }
.cfh :where(span, div, b, i, p, h1, h2, strong, li), .cfh-sheet :where(span, div, b, i, p, h2, strong){ color:inherit; } /* vence main span */
.cfh a{ text-decoration:none; color:inherit; }
.cfh button, .cfh-sheet button{ font-family:inherit; cursor:pointer; -webkit-tap-highlight-color:transparent; }
.cfh a:focus-visible, .cfh button:focus-visible, .cfh-sheet button:focus-visible{ outline:2px solid #dc2626; outline-offset:2px; }
.cfh-d{ font-family:${typography.fontFamilyDisplay}; letter-spacing:-.03em; }
.cfh-m{ font-family:${typography.fontFamilyMono}; }
.cfh-back{ display:inline-flex; align-items:center; gap:4px; min-height:44px; padding:0 10px 0 4px; margin-left:-4px; border-radius:12px; font-size:14px; font-weight:500; color:${INK_2}; }
.cfh-h1{ margin:4px 0 0; font-size:28px; font-weight:600; }
.cfh-lead{ margin:6px 0 0; font-size:14px; line-height:1.45; color:${INK_3}; max-width:560px; }
.cfh-sum{ margin-top:18px; display:flex; align-items:baseline; gap:10px; flex-wrap:wrap; }
.cfh-sum .big{ font-size:22px; font-weight:600; }
.cfh-sum .big{ display:flex; flex-wrap:wrap; min-width:0; }
.cfh-sum .part{ white-space:nowrap; }
.cfh-sum .cfh-m{ font-size:12px; color:${INK_3}; font-variant-numeric:tabular-nums; }

.cfh-week{ margin-top:14px; background:#fff; border:1px solid #ececf0; border-radius:18px; overflow:hidden; }
.cfh-day{ display:flex; align-items:center; gap:10px; min-height:60px; padding:6px 8px 6px 16px; border-top:1px solid #f0f0f3; }
.cfh-day:first-child{ border-top:0; }
.cfh-dn{ width:40px; flex-shrink:0; font-size:12.5px; font-weight:500; letter-spacing:.04em; text-transform:uppercase; color:${INK_2}; }
.cfh-time{ flex:1; min-width:0; display:flex; align-items:center; justify-content:space-between; gap:8px; min-height:48px; padding:0 8px 0 12px; border:0; border-radius:12px; background:transparent; text-align:left; }
@media (hover:hover){ .cfh-time:hover:not(:disabled){ background:#f7f7f9; } }
.cfh-time .t{ white-space:nowrap; font-size:16px; font-weight:600; font-variant-numeric:tabular-nums; color:${INK}; }
.cfh-time .h{ font-size:12px; color:${INK_3}; margin-left:8px; font-weight:400; }
.cfh-time .off{ font-size:15px; color:${INK_3}; font-weight:400; }
@media (max-width:379px){ .cfh-time .h{ display:none; } .cfh-dn{ width:34px; } .cfh-day{ padding-left:12px; gap:6px; } }
.cfh-time .chev{ color:#b8b8c0; display:flex; flex-shrink:0; }
.cfh-time:disabled{ cursor:default; }

.cfh-sw{ position:relative; flex-shrink:0; width:52px; height:44px; border:0; background:transparent; padding:0; }
.cfh-sw i{ position:absolute; left:2px; top:8px; width:48px; height:28px; border-radius:99px; background:#d6d6dc; transition:background .18s ease; }
.cfh-sw i::after{ content:''; position:absolute; top:3px; left:3px; width:22px; height:22px; border-radius:50%; background:#fff; box-shadow:0 1px 3px rgba(17,17,20,.25); transition:transform .18s cubic-bezier(.34,1.56,.64,1); }
.cfh-sw[aria-checked="true"] i{ background:${INK}; }
.cfh-sw[aria-checked="true"] i::after{ transform:translateX(20px); }
.cfh-sw:disabled{ opacity:.55; cursor:default; }

.cfh-copy{ margin-top:10px; display:inline-flex; align-items:center; gap:8px; min-height:44px; padding:0 14px; border:1px solid #e3e3e8; border-radius:999px; background:#fff; font-size:14px; font-weight:500; color:${INK}; }
.cfh-copy:disabled{ opacity:.5; cursor:default; }

.cfh-team{ margin-top:16px; padding:14px 16px; border-radius:16px; background:#fffbeb; border:1px solid rgba(180,83,9,.16); }
.cfh-team-t{ display:flex; gap:10px; align-items:flex-start; font-weight:600; font-size:14.5px; color:${INK}; }
.cfh-team-t svg{ color:#b45309; flex-shrink:0; margin-top:1px; }
.cfh-team p{ margin:6px 0 0 28px; font-size:13px; line-height:1.45; color:#7a4a0f; }
.cfh-team ul{ list-style:none; margin:10px 0 0 28px; padding:0; display:flex; flex-direction:column; gap:6px; }
.cfh-team li{ font-size:13.5px; line-height:1.45; color:${INK_2}; }
.cfh-team li b{ color:${INK}; font-weight:600; }
.cfh-team a{ margin:12px 0 0 28px; display:inline-flex; align-items:center; gap:2px; min-height:44px; font-size:14px; font-weight:600; color:${INK}; }

.cfh-note{ margin-top:16px; padding:12px 14px; border-radius:14px; background:#f7f7f9; font-size:13px; line-height:1.5; color:${INK_3}; }
.cfh-note b{ color:${INK_2}; font-weight:600; }
.cfh-skel{ height:420px; margin-top:14px; border-radius:18px; background:#f2f2f5; animation:cfh-pulse 1.2s ease-in-out infinite; }
.cfh-err{ margin-top:22px; padding:16px; border-radius:16px; background:#fff; border:1px solid #ececf0; font-size:14px; color:${INK_2}; }
.cfh-err button{ margin-top:12px; min-height:44px; padding:0 16px; border-radius:12px; border:0; background:${INK}; color:#fff; font-weight:600; font-size:14px; }

.cfh-toast{ position:fixed; left:50%; transform:translateX(-50%); bottom:calc(64px + env(safe-area-inset-bottom) + 14px); z-index:10000; padding:11px 16px; border-radius:12px; font-size:14px; font-weight:500; font-family:${typography.fontFamily}; box-shadow:0 8px 24px rgba(17,17,20,.18); max-width:calc(100vw - 32px); }
.cfh-toast.ok{ background:${INK}; color:#fff; }
.cfh-toast.err{ background:#fff; color:#a32d2d; border:1px solid #f1d0d0; }
@media (min-width:1024px){ .cfh-toast{ bottom:24px; left:calc(50% + var(--sidebar-width, 0px) / 2); } }

.cfh-drop{ position:fixed; inset:0; z-index:9998; background:rgba(17,17,20,.32); animation:cfh-fade .18s ease; }
@keyframes cfh-fade{ from{opacity:0} to{opacity:1} }
@keyframes cfh-up{ from{transform:translateY(24px); opacity:0} to{transform:none; opacity:1} }
.cfh-sheet:focus{ outline:none; }
.cfh-sheet{ position:fixed; z-index:9999; left:0; right:0; bottom:calc(64px + env(safe-area-inset-bottom)); max-height:calc(100dvh - 104px - 64px - env(safe-area-inset-bottom)); overflow:auto; background:#fff; border-radius:22px 22px 0 0; padding:10px 16px 18px; font-family:${typography.fontFamily}; color:${INK}; animation:cfh-up .22s cubic-bezier(.34,1.56,.64,1); }
.cfh-grab{ width:40px; height:4px; border-radius:99px; background:#d6d6dc; margin:0 auto 10px; }
.cfh-sh-top{ display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
.cfh-sh-t{ margin:0; font-size:21px; font-weight:600; }
.cfh-sh-h{ margin:4px 0 0; font-size:13.5px; line-height:1.45; color:${INK_3}; }
.cfh-x{ width:44px; height:44px; flex-shrink:0; border:0; border-radius:12px; background:#f2f2f5; color:${INK_2}; display:flex; align-items:center; justify-content:center; }
.cfh-pair{ display:grid; grid-template-columns:minmax(0,1fr); gap:14px; margin-top:16px; }
@media (min-width:420px){ .cfh-pair{ grid-template-columns:repeat(2,minmax(0,1fr)); } }
.cfh-lb{ font-size:11px; letter-spacing:.06em; text-transform:uppercase; font-weight:500; color:${INK_3}; margin-bottom:6px; }
.cfh-bad{ margin-top:12px; font-size:13px; color:#a32d2d; }
.cfh-use{ width:100%; margin-top:16px; min-height:52px; border:0; border-radius:14px; background:${INK}; color:#fff; font-size:15px; font-weight:600; }
.cfh-use:disabled{ opacity:.45; cursor:default; }
@media (min-width:1024px){
  .cfh-sheet{ left:calc(50% + var(--sidebar-width, 0px) / 2); right:auto; bottom:auto; top:50%; transform:translate(-50%,-50%); width:460px; max-height:calc(100dvh - 160px); border-radius:22px; padding:20px; animation:cfh-fade .18s ease; }
  .cfh-grab{ display:none; }
}
@media (prefers-reduced-motion:reduce){ .cfh, .cfh-skel, .cfh-sheet, .cfh-drop{ animation:none; } .cfh-sw i, .cfh-sw i::after{ transition:none; } }
`

// Buscas puras: o setState fica no .then de quem chama (regra do React Compiler).
function fetchHours(): Promise<HourSlot[]> {
  return api.get('/business-hours').then((r) => (r.data?.data ?? r.data) as HourSlot[])
}
function fetchTeamDiff(): Promise<TeamDiff> {
  return api.get('/business-hours/team-diff').then((r) => (r.data?.data ?? r.data) as TeamDiff)
}

function errMsg(e: unknown, fallback: string): string {
  const r = (e as { response?: { status?: number; data?: { error?: string } } })?.response
  if (r?.status === 403) return 'Só o dono e o gerente mudam o horário da loja.'
  return r?.data?.error ?? fallback
}

/** "Seg a sex 09:00–19:00 · sáb 09:00–14:00": dias seguidos com o mesmo horario viram um bloco. */
function resumo(slots: HourSlot[]): string {
  const by = new Map(slots.map((s) => [s.weekday, s]))
  const blocos: { de: number; ate: number; txt: string }[] = []
  for (const w of ORDER) {
    const s = by.get(w)
    if (!s?.open) continue
    const txt = `${s.startTime}–${s.endTime}`
    const last = blocos[blocos.length - 1]
    if (last && last.txt === txt && ORDER.indexOf(last.ate) === ORDER.indexOf(w) - 1) last.ate = w
    else blocos.push({ de: w, ate: w, txt })
  }
  if (blocos.length === 0) return 'Fechado todos os dias'
  const parte = (b: { de: number; ate: number; txt: string }, i: number) => {
    const dias = b.de === b.ate ? SHORT[b.de] : `${SHORT[b.de]} a ${SHORT[b.ate].toLowerCase()}`
    return `${i === 0 ? dias : dias.toLowerCase()} ${b.txt}`
  }
  return blocos.map(parte).join(' · ')
}

/** Mesmo resumo, em pedacos que nao quebram no meio do horario. */
function resumoPartes(slots: HourSlot[]): string[] {
  return resumo(slots).split(' · ')
}

function issueText(i: Issue): string {
  const dia = WEEKDAY_LOWER[i.weekday]
  if (i.kind === 'CLOSED_DAY') return `atende ${dia} (${i.startTime}–${i.endTime}) e a loja está fechada`
  return `atende ${dia} ${i.startTime}–${i.endTime} e a loja abre ${i.storeStart}–${i.storeEnd}`
}

function DaySheet({ slot, onClose, onUse }: {
  slot: HourSlot
  onClose: () => void
  onUse: (startTime: string, endTime: string) => void
}) {
  const [start, setStart] = useState(slot.startTime)
  const [end, setEnd] = useState(slot.endTime)
  const ref = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  useEffect(() => { closeRef.current = onClose })

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    ref.current?.focus() // foca a folha, nao um botao: sem anel no toque
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeRef.current() }
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      prev?.focus()
    }
  }, [])

  const draft: HourSlot = { ...slot, open: true, startTime: start, endTime: end }
  const bad = isSlotInvalid(draft)
  const same = start === slot.startTime && end === slot.endTime

  return createPortal(
    <>
      <style>{CSS}</style>
      <div className="cfh-drop" onClick={onClose} aria-hidden />
      <div className="cfh-sheet" role="dialog" aria-modal="true" aria-labelledby="cfh-sh-t" ref={ref} tabIndex={-1}>
        <div className="cfh-grab" aria-hidden />
        <div className="cfh-sh-top">
          <div>
            <h2 id="cfh-sh-t" className="cfh-sh-t cfh-d">{DAY_NAMES[slot.weekday]}</h2>
            <p className="cfh-sh-h">Que horas a loja abre e fecha neste dia. Toque no número para digitar.</p>
          </div>
          <button type="button" className="cfh-x" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
        </div>
        <div className="cfh-pair">
          <div>
            <div className="cfh-lb cfh-m">Abre</div>
            <TimeStepper value={start} onChange={setStart} label="abertura" step={15} editable block size="md" invalid={bad} />
          </div>
          <div>
            <div className="cfh-lb cfh-m">Fecha</div>
            <TimeStepper value={end} onChange={setEnd} label="fechamento" step={15} editable block size="md" invalid={bad} />
          </div>
        </div>
        {bad && <div className="cfh-bad" role="alert">A abertura precisa ser antes do fechamento.</div>}
        <button type="button" className="cfh-use" disabled={bad || same} onClick={() => onUse(start, end)}>
          {same ? 'É o que vale hoje' : `Usar ${start}–${end} · ${durationLabel(slotMinutes(draft))}`}
        </button>
      </div>
    </>,
    document.body,
  )
}

type Load = { slots: HourSlot[] | null; failed: boolean }

export default function HorariosPage() {
  const [load, setLoad] = useState<Load | null>(null)
  const [team, setTeam] = useState<TeamDiff | null>(null)
  const [sheet, setSheet] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let vivo = true
    fetchHours()
      .then((slots) => { if (vivo) setLoad({ slots, failed: false }) })
      .catch((e) => {
        console.error('[configuracoes/horarios] carregar', e)
        if (vivo) setLoad({ slots: null, failed: true })
      })
    // Aviso da equipe: falhou (ou cargo sem acesso), simplesmente nao aparece.
    fetchTeamDiff()
      .then((t) => { if (vivo) setTeam(t) })
      .catch((e) => console.warn('[configuracoes/horarios] equipe', e))
    return () => { vivo = false }
  }, [])

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current) }, [])

  function avisar(text: string, ok: boolean) {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ text, ok })
    toastTimer.current = setTimeout(() => setToast(null), 2600)
  }

  function recarregar() {
    setLoad(null)
    fetchHours()
      .then((slots) => setLoad({ slots, failed: false }))
      .catch((e) => {
        console.error('[configuracoes/horarios] carregar', e)
        setLoad({ slots: null, failed: true })
      })
  }

  const slots = load?.slots ?? null

  // Mostra na hora; falhou, volta ao que era e avisa. O PUT leva os 7 dias.
  function salvar(next: HourSlot[], ok: string) {
    if (!slots || busy) return
    const antes = slots
    setLoad({ slots: next, failed: false })
    setBusy(true)
    api.put('/business-hours', { slots: next })
      .then((r) => {
        const data = (r.data?.data ?? r.data) as HourSlot[]
        setLoad({ slots: data, failed: false })
        avisar(ok, true)
        return fetchTeamDiff().then(setTeam).catch((e) => console.warn('[configuracoes/horarios] equipe', e))
      })
      .catch((e) => {
        console.error('[configuracoes/horarios] salvar', e)
        setLoad({ slots: antes, failed: false })
        avisar(errMsg(e, 'Não salvou. Tente de novo.'), false)
      })
      .finally(() => setBusy(false))
  }

  const patch = (weekday: number, p: Partial<HourSlot>) =>
    (slots ?? []).map((s) => (s.weekday === weekday ? { ...s, ...p } : s))

  const seg = slots?.find((s) => s.weekday === 1)
  const outrosAbertos = (slots ?? []).filter((s) => s.open && s.weekday !== 1)
  const copiaMuda = !!seg?.open && outrosAbertos.some((s) => s.startTime !== seg.startTime || s.endTime !== seg.endTime)

  const pros = team?.professionals ?? []
  const sheetSlot = sheet === null ? null : slots?.find((s) => s.weekday === sheet) ?? null

  return (
    <>
      <style>{CSS}</style>
      <div className="cfh">
        <Link href="/dashboard/configuracoes" className="cfh-back"><ChevronLeft size={18} aria-hidden />Configurações</Link>
        <h1 className="cfh-h1 cfh-d">Horário de funcionamento</h1>
        <p className="cfh-lead">Quando a loja abre. Toque no horário para mudar; a chave abre ou fecha o dia. Salva na hora.</p>

        {load === null && <div className="cfh-skel" aria-busy="true" aria-label="Carregando" />}

        {load?.failed && (
          <div className="cfh-err" role="alert">
            Não deu para abrir o horário agora.
            <div><button type="button" onClick={recarregar}>Tentar de novo</button></div>
          </div>
        )}

        {slots && (
          <>
            <div className="cfh-sum">
              <span className="big cfh-d">
                {resumoPartes(slots).map((p, i) => <span key={p} className="part">{i > 0 ? ' · ' : ''}{p}</span>)}
              </span>
              <span className="cfh-m">{durationLabel(weeklyMinutes(slots))} por semana</span>
            </div>

            <div className="cfh-week">
              {ORDER.map((w) => {
                const s = slots.find((x) => x.weekday === w)
                if (!s) return null
                return (
                  <div key={w} className="cfh-day">
                    <span className="cfh-dn cfh-m">{SHORT[w]}</span>
                    <button
                      type="button"
                      className="cfh-time"
                      disabled={!s.open || busy}
                      onClick={() => setSheet(w)}
                      aria-label={s.open ? `${DAY_NAMES[w]}, ${s.startTime} às ${s.endTime}. Mudar` : `${DAY_NAMES[w]}, fechado`}
                    >
                      {s.open
                        ? <span><span className="t">{s.startTime} – {s.endTime}</span><span className="h cfh-m">{durationLabel(slotMinutes(s))}</span></span>
                        : <span className="off">Fechado</span>}
                      {s.open && <span className="chev" aria-hidden><ChevronRight size={18} /></span>}
                    </button>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={s.open}
                      aria-label={`${DAY_NAMES[w]} aberto`}
                      className="cfh-sw"
                      disabled={busy}
                      onClick={() => salvar(patch(w, { open: !s.open }), s.open ? `${DAY_NAMES[w]}: fechado` : `${DAY_NAMES[w]}: aberto`)}
                    >
                      <i aria-hidden />
                    </button>
                  </div>
                )
              })}
            </div>

            {seg?.open && outrosAbertos.length > 0 && (
              <button
                type="button"
                className="cfh-copy"
                disabled={busy || !copiaMuda}
                onClick={() => salvar(slots.map((s) => (s.open ? { ...s, startTime: seg.startTime, endTime: seg.endTime } : s)), 'Horário de segunda copiado')}
              >
                <Copy size={16} aria-hidden />
                {copiaMuda ? 'Copiar segunda para os dias abertos' : 'Todos os dias abertos iguais à segunda'}
              </button>
            )}

            {pros.length > 0 && (
              <section className="cfh-team" aria-label="Equipe fora do horário da loja">
                <div className="cfh-team-t">
                  <TriangleAlert size={18} aria-hidden />
                  {pros.length === 1 ? '1 profissional atende fora deste horário' : `${pros.length} profissionais atendem fora deste horário`}
                </div>
                <p>O link oferece horário pelo que cada profissional atende. Se a loja não abre nesses momentos, ajuste o horário dele na Equipe.</p>
                <ul>
                  {pros.map((p) => (
                    <li key={p.id}><b>{p.name}</b>: {p.issues.map(issueText).join('; ')}.</li>
                  ))}
                </ul>
                <Link href="/dashboard/equipe">Ajustar na Equipe <ChevronRight size={16} aria-hidden /></Link>
              </section>
            )}

            <p className="cfh-note">
              Este horário aparece no seu link como <b>aberto agora</b>, define o tamanho da agenda e é o horário com que cada <b>profissional novo</b> começa.
              O horário de cada profissional fica na Equipe e não muda quando você muda este.
            </p>
          </>
        )}
      </div>

      {sheetSlot && (
        <DaySheet
          slot={sheetSlot}
          onClose={() => setSheet(null)}
          onUse={(startTime, endTime) => {
            const w = sheetSlot.weekday
            setSheet(null)
            salvar(patch(w, { startTime, endTime }), `${DAY_NAMES[w]}: ${startTime}–${endTime}`)
          }}
        />
      )}

      {toast && <div className={`cfh-toast ${toast.ok ? 'ok' : 'err'}`} role="status">{toast.text}</div>}
    </>
  )
}
