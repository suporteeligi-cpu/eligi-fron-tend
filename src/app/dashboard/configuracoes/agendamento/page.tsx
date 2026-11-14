'use client'
// src/app/dashboard/configuracoes/agendamento/page.tsx
// @eligi:cfg-agenda-v2 — Regras do agendamento, direcao B (ver @eligi:doc-cfg-agendamento).
// Cada regra e um cartao com a frase do que vale hoje. Prazo, agenda aberta e
// remarcar abrem uma folha com as opcoes em botoes; CPF e planos sao chaves.
// Salva a cada mudanca, mandando SO o campo que mudou (o PUT aceita parcial):
// autoConfirm e avoidGapsBetweenVisits sairam da tela e nunca sao enviados.

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, Clock, CalendarRange, RefreshCw, IdCard, Gift, Check, X } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { typography } from '@/shared/theme'

interface BookingSettings {
  minBookingNotice:     number
  maxFutureBookingDays: number
  rescheduleNotice:     number
  requireClientCpf:     boolean
  showLoyaltyOnline:    boolean // @eligi:loyalty-online-fe-type
}

type NumKey = 'minBookingNotice' | 'maxFutureBookingDays' | 'rescheduleNotice'
type Opt = { value: number; label: string }

/** O link publico mostra no maximo 90 dias (front-end-public: DateTime e meus). */
const LINK_MAX_DAYS = 90

const NOTICE_OPTIONS: Opt[] = [
  { value: 0, label: 'Sem prazo' }, { value: 15, label: '15 min' }, { value: 30, label: '30 min' },
  { value: 60, label: '1 hora' }, { value: 120, label: '2 horas' }, { value: 180, label: '3 horas' },
  { value: 360, label: '6 horas' }, { value: 720, label: '12 horas' }, { value: 1440, label: '1 dia' },
]
const FUTURE_OPTIONS: Opt[] = [
  { value: 1, label: '1 dia' }, { value: 3, label: '3 dias' }, { value: 7, label: '7 dias' },
  { value: 14, label: '14 dias' }, { value: 30, label: '30 dias' }, { value: 60, label: '60 dias' },
  { value: LINK_MAX_DAYS, label: '90 dias' },
]
const RESCHEDULE_OPTIONS: Opt[] = [
  { value: 0, label: 'Até a hora' }, { value: 30, label: '30 min' }, { value: 60, label: '1 hora' },
  { value: 120, label: '2 horas' }, { value: 180, label: '3 horas' }, { value: 360, label: '6 horas' },
  { value: 720, label: '12 horas' }, { value: 1440, label: '1 dia' },
]

function dur(min: number): string {
  if (min >= 1440 && min % 1440 === 0) return min === 1440 ? '1 dia' : `${min / 1440} dias`
  if (min >= 60 && min % 60 === 0) return min === 60 ? '1 hora' : `${min / 60} horas`
  return `${min} min`
}
/** Valor antigo 365 ("sem limite") vale 90 no link. */
const diasNoLink = (d: number) => Math.min(d, LINK_MAX_DAYS)

type SheetDef = { key: NumKey; title: string; help: string; options: Opt[] }
const SHEETS: Record<NumKey, SheetDef> = {
  minBookingNotice: {
    key: 'minBookingNotice', title: 'Prazo para marcar', options: NOTICE_OPTIONS,
    help: 'Até quanto tempo antes do horário o cliente ainda consegue marcar pelo link.',
  },
  maxFutureBookingDays: {
    key: 'maxFutureBookingDays', title: 'Agenda aberta', options: FUTURE_OPTIONS,
    help: 'Quantos dias para frente o cliente enxerga no link. O máximo é 90 dias.',
  },
  rescheduleNotice: {
    key: 'rescheduleNotice', title: 'Remarcar e cancelar', options: RESCHEDULE_OPTIONS,
    help: 'Até quanto tempo antes o cliente ainda remarca ou cancela sozinho, pelo link.',
  },
}

const CPF_ON_LINES = [ // @eligi:cpf-policy-consequence
  'Cliente novo só conclui o agendamento com um CPF válido.',
  'Cliente que já está no seu cadastro segue agendando sem informar nada.',
  'As notas fiscais desses atendimentos saem no nome do cliente.',
]
const CPF_OFF_LINES = [
  'O cliente informa nome e telefone. O CPF continua no formulário, como opcional.',
  'Sem CPF, a nota fiscal sai sem tomador identificado — e pode ser substituída em até 72h.',
]

const INK = '#111114'
const INK_2 = '#4b4b52'
const INK_3 = '#6b6b73'

const CSS = `
.cfa{ max-width:720px; font-family:${typography.fontFamily}; color:${INK}; animation:cfa-in .25s ease; }
@keyframes cfa-in{ from{opacity:0; transform:translateY(6px)} to{opacity:1; transform:none} }
@keyframes cfa-pulse{ 0%,100%{opacity:.5} 50%{opacity:1} }
.cfa *, .cfa-sheet *{ box-sizing:border-box; }
.cfa :where(span, div, b, i, p, h1, h2, strong), .cfa-sheet :where(span, div, b, i, p, h2, strong){ color:inherit; } /* vence main span */
.cfa a{ text-decoration:none; color:inherit; }
.cfa button, .cfa-sheet button{ font-family:inherit; cursor:pointer; -webkit-tap-highlight-color:transparent; }
.cfa a:focus-visible, .cfa button:focus-visible, .cfa-sheet button:focus-visible{ outline:2px solid #dc2626; outline-offset:2px; }
.cfa-d{ font-family:${typography.fontFamilyDisplay}; letter-spacing:-.03em; }
.cfa-m{ font-family:${typography.fontFamilyMono}; }
.cfa-back{ display:inline-flex; align-items:center; gap:4px; min-height:44px; padding:0 10px 0 4px; margin-left:-4px; border-radius:12px; font-size:14px; font-weight:500; color:${INK_2}; }
.cfa-h1{ margin:4px 0 0; font-size:28px; font-weight:600; }
.cfa-lead{ margin:6px 0 0; font-size:14px; line-height:1.45; color:${INK_3}; max-width:560px; }
.cfa-list{ display:flex; flex-direction:column; gap:10px; margin-top:22px; }
.cfa-card{ background:#fff; border:1px solid #ececf0; border-radius:18px; padding:16px; }
.cfa-row{ display:flex; align-items:flex-start; gap:12px; }
.cfa-tile{ width:38px; height:38px; border-radius:11px; background:#f2f2f5; color:#3c3c43; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.cfa-body{ flex:1; min-width:0; }
.cfa-cap{ font-size:11px; letter-spacing:.06em; text-transform:uppercase; font-weight:500; color:${INK_3}; }
.cfa-now{ font-size:16px; line-height:1.4; margin-top:3px; color:${INK_2}; }
.cfa-now strong{ color:${INK}; font-weight:600; }
.cfa-help{ font-size:13px; line-height:1.45; color:${INK_3}; margin-top:4px; }
.cfa-btn{ flex-shrink:0; min-height:44px; padding:0 16px; border-radius:12px; border:1px solid #e3e3e8; background:#fff; font-size:14px; font-weight:600; color:${INK}; }
@media (hover:hover){ .cfa-btn:hover{ border-color:#cfcfd6; background:#fafafb; } }
.cfa-sw{ position:relative; flex-shrink:0; width:52px; height:44px; border:0; background:transparent; padding:0; }
.cfa-sw i{ position:absolute; left:2px; top:8px; width:48px; height:28px; border-radius:99px; background:#d6d6dc; transition:background .18s ease; }
.cfa-sw i::after{ content:''; position:absolute; top:3px; left:3px; width:22px; height:22px; border-radius:50%; background:#fff; box-shadow:0 1px 3px rgba(17,17,20,.25); transition:transform .18s cubic-bezier(.34,1.56,.64,1); }
.cfa-sw[aria-checked="true"] i{ background:${INK}; }
.cfa-sw[aria-checked="true"] i::after{ transform:translateX(20px); }
.cfa-sw:disabled{ opacity:.55; cursor:default; }
.cfa-cons{ margin-top:14px; padding-top:12px; border-top:1px dashed #e6e6ea; display:flex; flex-direction:column; gap:8px; }
.cfa-cons div{ display:flex; gap:10px; align-items:flex-start; font-size:13px; line-height:1.45; color:${INK_2}; }
.cfa-cons i{ width:6px; height:6px; border-radius:50%; background:#9a9aa3; margin-top:7px; flex-shrink:0; }
.cfa-note{ margin-top:16px; padding:12px 14px; border-radius:14px; background:#f7f7f9; font-size:13px; line-height:1.5; color:${INK_3}; }
.cfa-skel{ height:92px; border-radius:18px; background:#f2f2f5; animation:cfa-pulse 1.2s ease-in-out infinite; }
.cfa-err{ margin-top:22px; padding:16px; border-radius:16px; background:#fff; border:1px solid #ececf0; font-size:14px; color:${INK_2}; }
.cfa-err button{ margin-top:12px; min-height:44px; padding:0 16px; border-radius:12px; border:0; background:${INK}; color:#fff; font-weight:600; font-size:14px; }

.cfa-toast{ position:fixed; left:50%; transform:translateX(-50%); bottom:calc(64px + env(safe-area-inset-bottom) + 14px); z-index:10000; padding:11px 16px; border-radius:12px; font-size:14px; font-weight:500; font-family:${typography.fontFamily}; box-shadow:0 8px 24px rgba(17,17,20,.18); max-width:calc(100vw - 32px); }
.cfa-toast.ok{ background:${INK}; color:#fff; }
.cfa-toast.err{ background:#fff; color:#a32d2d; border:1px solid #f1d0d0; }
@media (min-width:1024px){ .cfa-toast{ bottom:24px; left:calc(50% + var(--sidebar-width, 0px) / 2); } }

.cfa-back-drop{ position:fixed; inset:0; z-index:9998; background:rgba(17,17,20,.32); animation:cfa-fade .18s ease; }
@keyframes cfa-fade{ from{opacity:0} to{opacity:1} }
@keyframes cfa-up{ from{transform:translateY(24px); opacity:0} to{transform:none; opacity:1} }
.cfa-sheet{ position:fixed; z-index:9999; left:0; right:0; bottom:calc(64px + env(safe-area-inset-bottom)); max-height:calc(100dvh - 104px - 64px - env(safe-area-inset-bottom)); overflow:auto; background:#fff; border-radius:22px 22px 0 0; padding:10px 16px 18px; font-family:${typography.fontFamily}; color:${INK}; animation:cfa-up .22s cubic-bezier(.34,1.56,.64,1); }
.cfa-grab{ width:40px; height:4px; border-radius:99px; background:#d6d6dc; margin:0 auto 10px; }
.cfa-sh-top{ display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
.cfa-sh-t{ margin:0; font-size:21px; font-weight:600; }
.cfa-sh-h{ margin:4px 0 0; font-size:13.5px; line-height:1.45; color:${INK_3}; }
.cfa-x{ width:44px; height:44px; flex-shrink:0; border:0; border-radius:12px; background:#f2f2f5; color:${INK_2}; display:flex; align-items:center; justify-content:center; }
.cfa-grid{ display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; margin-top:16px; }
.cfa-opt{ min-height:52px; border-radius:14px; border:1px solid #e3e3e8; background:#fff; font-size:15px; font-weight:500; color:${INK}; display:flex; align-items:center; justify-content:center; gap:6px; padding:0 6px; text-align:center; }
.cfa-opt[aria-pressed="true"]{ background:${INK}; border-color:${INK}; color:#fff; font-weight:600; }
.cfa-use{ width:100%; margin-top:16px; min-height:52px; border:0; border-radius:14px; background:${INK}; color:#fff; font-size:15px; font-weight:600; }
.cfa-use:disabled{ opacity:.45; cursor:default; }
@media (min-width:1024px){
  .cfa-sheet{ left:calc(50% + var(--sidebar-width, 0px) / 2); right:auto; bottom:auto; top:50%; transform:translate(-50%,-50%); width:440px; max-height:calc(100dvh - 160px); border-radius:22px; padding:20px; animation:cfa-fade .18s ease; }
  .cfa-grab{ display:none; }
}
@media (prefers-reduced-motion:reduce){ .cfa, .cfa-skel, .cfa-sheet, .cfa-back-drop{ animation:none; } .cfa-sw i, .cfa-sw i::after{ transition:none; } }
`

// Busca pura: o setState fica no .then de quem chama (regra do React Compiler).
function fetchSettings(): Promise<BookingSettings> {
  return api.get('/booking-settings').then((r) => r.data?.data ?? r.data)
}

function OptionSheet({ def, value, onClose, onPick }: {
  def: SheetDef
  value: number
  onClose: () => void
  onPick: (v: number) => void
}) {
  const [sel, setSel] = useState(value)
  const ref = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  useEffect(() => { closeRef.current = onClose })

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    ref.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus()
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

  const label = def.options.find((o) => o.value === sel)?.label ?? ''

  return createPortal(
    <>
      <style>{CSS}</style>
      <div className="cfa-back-drop" onClick={onClose} aria-hidden />
      <div className="cfa-sheet" role="dialog" aria-modal="true" aria-labelledby="cfa-sh-t" ref={ref}>
        <div className="cfa-grab" aria-hidden />
        <div className="cfa-sh-top">
          <div>
            <h2 id="cfa-sh-t" className="cfa-sh-t cfa-d">{def.title}</h2>
            <p className="cfa-sh-h">{def.help}</p>
          </div>
          <button type="button" className="cfa-x" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
        </div>
        <div className="cfa-grid" role="group" aria-label={def.title}>
          {def.options.map((o) => (
            <button key={o.value} type="button" className="cfa-opt" aria-pressed={o.value === sel} onClick={() => setSel(o.value)}>
              {o.value === sel && <Check size={15} aria-hidden />}{o.label}
            </button>
          ))}
        </div>
        <button type="button" className="cfa-use" disabled={sel === value} onClick={() => onPick(sel)}>
          {sel === value ? 'É o que vale hoje' : `Usar ${label.toLowerCase()}`}
        </button>
      </div>
    </>,
    document.body,
  )
}

function Switch({ on, busy, label, onChange }: { on: boolean; busy: boolean; label: string; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} className="cfa-sw" disabled={busy} onClick={() => onChange(!on)}>
      <i aria-hidden />
    </button>
  )
}

type Load = { data: BookingSettings | null; failed: boolean }

export default function AgendamentoConfigPage() {
  const [load, setLoad] = useState<Load | null>(null)
  const [sheet, setSheet] = useState<NumKey | null>(null)
  const [busy, setBusy] = useState<keyof BookingSettings | null>(null)
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let vivo = true
    fetchSettings()
      .then((data) => { if (vivo) setLoad({ data, failed: false }) })
      .catch((e) => {
        console.error('[configuracoes/agendamento] carregar', e)
        if (vivo) setLoad({ data: null, failed: true })
      })
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
    fetchSettings()
      .then((data) => setLoad({ data, failed: false }))
      .catch((e) => {
        console.error('[configuracoes/agendamento] carregar', e)
        setLoad({ data: null, failed: true })
      })
  }

  const s = load?.data ?? null

  // Mostra na hora; falhou, volta ao valor anterior e avisa.
  function salvar<K extends keyof BookingSettings>(key: K, value: BookingSettings[K]) {
    if (!s || busy) return
    const antes = s[key]
    setLoad({ data: { ...s, [key]: value }, failed: false })
    setBusy(key)
    api.put('/booking-settings', { [key]: value })
      .then(() => avisar('Salvo', true))
      .catch((e) => {
        console.error('[configuracoes/agendamento] salvar', key, e)
        setLoad((l) => (l?.data ? { data: { ...l.data, [key]: antes }, failed: false } : l))
        avisar('Não salvou. Tente de novo.', false)
      })
      .finally(() => setBusy(null))
  }

  const fecharSheet = () => setSheet(null)

  return (
    <>
      <style>{CSS}</style>
      <div className="cfa">
        <Link href="/dashboard/configuracoes" className="cfa-back"><ChevronLeft size={18} aria-hidden />Configurações</Link>
        <h1 className="cfa-h1 cfa-d">Regras do agendamento</h1>
        <p className="cfa-lead">Como o cliente marca, remarca e se identifica pelo seu link. Toque em Mudar e escolha. Salva na hora.</p>

        {load === null && (
          <div className="cfa-list" aria-busy="true" aria-label="Carregando">
            {[0, 1, 2, 3].map((i) => <div key={i} className="cfa-skel" />)}
          </div>
        )}

        {load?.failed && (
          <div className="cfa-err" role="alert">
            Não deu para abrir as regras agora.
            <div><button type="button" onClick={recarregar}>Tentar de novo</button></div>
          </div>
        )}

        {s && (
          <>
            <div className="cfa-list">
              <section className="cfa-card">
                <div className="cfa-row">
                  <span className="cfa-tile"><Clock size={18} aria-hidden /></span>
                  <div className="cfa-body">
                    <div className="cfa-cap cfa-m">Prazo para marcar</div>
                    <div className="cfa-now">
                      {s.minBookingNotice > 0
                        ? <>O cliente marca <strong>até {dur(s.minBookingNotice)} antes</strong> do horário.</>
                        : <>O cliente marca <strong>até a hora</strong>, sem prazo mínimo.</>}
                    </div>
                  </div>
                  <button type="button" className="cfa-btn" disabled={busy !== null} onClick={() => setSheet('minBookingNotice')}>Mudar</button>
                </div>
              </section>

              <section className="cfa-card">
                <div className="cfa-row">
                  <span className="cfa-tile"><CalendarRange size={18} aria-hidden /></span>
                  <div className="cfa-body">
                    <div className="cfa-cap cfa-m">Agenda aberta</div>
                    <div className="cfa-now">
                      O link mostra <strong>{diasNoLink(s.maxFutureBookingDays)} {diasNoLink(s.maxFutureBookingDays) === 1 ? 'dia' : 'dias'} à frente</strong>.
                    </div>
                  </div>
                  <button type="button" className="cfa-btn" disabled={busy !== null} onClick={() => setSheet('maxFutureBookingDays')}>Mudar</button>
                </div>
              </section>

              <section className="cfa-card">
                <div className="cfa-row">
                  <span className="cfa-tile"><RefreshCw size={18} aria-hidden /></span>
                  <div className="cfa-body">
                    <div className="cfa-cap cfa-m">Remarcar e cancelar</div>
                    <div className="cfa-now">
                      {s.rescheduleNotice > 0
                        ? <>O cliente remarca ou cancela <strong>até {dur(s.rescheduleNotice)} antes</strong>.</>
                        : <>O cliente remarca ou cancela <strong>até a hora</strong>.</>}
                    </div>
                    <div className="cfa-help">Agendamento já pago não muda pelo link.</div>
                  </div>
                  <button type="button" className="cfa-btn" disabled={busy !== null} onClick={() => setSheet('rescheduleNotice')}>Mudar</button>
                </div>
              </section>

              {/* @eligi:cpf-policy-card */}
              <section className="cfa-card">
                <div className="cfa-row">
                  <span className="cfa-tile"><IdCard size={18} aria-hidden /></span>
                  <div className="cfa-body">
                    <div className="cfa-cap cfa-m">CPF no link</div>
                    <div className="cfa-now">
                      {s.requireClientCpf ? <><strong>Obrigatório</strong> para cliente novo.</> : <><strong>Opcional</strong> para todos.</>}
                    </div>
                  </div>
                  <Switch on={s.requireClientCpf} busy={busy !== null} label="Exigir CPF no link" onChange={(v) => salvar('requireClientCpf', v)} />
                </div>
                <div className="cfa-cons">
                  {(s.requireClientCpf ? CPF_ON_LINES : CPF_OFF_LINES).map((t) => <div key={t}><i aria-hidden />{t}</div>)}
                </div>
              </section>

              {/* @eligi:loyalty-online-card */}
              <section className="cfa-card">
                <div className="cfa-row">
                  <span className="cfa-tile"><Gift size={18} aria-hidden /></span>
                  <div className="cfa-body">
                    <div className="cfa-cap cfa-m">Planos no link</div>
                    <div className="cfa-now">{s.showLoyaltyOnline ? <><strong>Aparecem</strong> no link.</> : <><strong>Não aparecem</strong> no link.</>}</div>
                    <div className="cfa-help">Clube, assinaturas e pacotes ativos numa vitrine, com um botão para o cliente falar com você no WhatsApp do seu perfil.</div>
                  </div>
                  <Switch on={s.showLoyaltyOnline} busy={busy !== null} label="Mostrar planos no link" onChange={(v) => salvar('showLoyaltyOnline', v)} />
                </div>
              </section>
            </div>

            <p className="cfa-note">Estas regras valem só para quem marca pelo link. Na agenda, você marca, remarca e cancela como quiser.</p>
          </>
        )}
      </div>

      {sheet && s && (
        <OptionSheet
          def={SHEETS[sheet]}
          value={sheet === 'maxFutureBookingDays' ? diasNoLink(s[sheet]) : s[sheet]}
          onClose={fecharSheet}
          onPick={(v) => { setSheet(null); salvar(sheet, v) }}
        />
      )}

      {toast && <div className={`cfa-toast ${toast.ok ? 'ok' : 'err'}`} role="status">{toast.text}</div>}
    </>
  )
}
