'use client'
// src/app/dashboard/configuracoes/modo-dezembro/page.tsx
// @eligi:xh-fe-page — Configuracoes > Modo Dezembro, direcao B (ver @eligi:doc-xh-front).
// Assistente em 3 passos: quando vale, ate que horas, quem participa.
// REGRA: so ativa com o link liberado ate o ultimo dia do periodo. Se a regra
// de agendamento do lojista ja cobre, o interruptor aparece ligado e travado.
// Dono e gerente salvam (o back decide; aqui so mostramos o 403).
// Todo texto tem cor propria: o globals.css pinta `main span` de cinza.

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, Check, Play, Power, Pencil } from 'lucide-react'
import { typography } from '@/shared/theme'
import { FlameIcon, XH, XH_CSS, INK, INK_2, INK_3 } from '@/features/extended-hours/ui'
import XhSimulator from '@/features/extended-hours/XhSimulator'
import {
  fetchXh, saveXh, errorText, errorStatus, daysBetween, addDays, ddmm, linkCovers, linkDays,
  isRunning, initials, avatarSrc, XH_MAX_PERIOD_DAYS, type XhDto, type XhRule,
} from '@/features/extended-hours/api'

type Preset = 'month' | 'xmas' | 'custom'
type Form = { preset: Preset; startDate: string; endDate: string; limit: string; pros: string[]; open: boolean }
type Load = { dto: XhDto | null; failed: boolean; forbidden: boolean }

const LIMITS = ['22:00', '23:00', '23:30', '23:59']
const STEP_TITLES = ['Quando vale', 'Até que horas', 'Quem participa']

function xmasOf(d: XhDto) {
  const y = d.defaults.startDate.slice(0, 4)
  return { startDate: `${y}-12-18`, endDate: `${y}-12-24` }
}

function formFrom(d: XhDto): Form {
  const c = d.config
  if (!c) {
    return {
      preset: 'month', startDate: d.defaults.startDate, endDate: d.defaults.endDate,
      limit: d.defaults.limitTime, pros: d.professionals.map((p) => p.id), open: false,
    }
  }
  // Periodo antigo ja acabou: sugere o do ano, mantendo limite e equipe.
  if (c.endDate < d.today) {
    return {
      preset: 'month', startDate: d.defaults.startDate, endDate: d.defaults.endDate,
      limit: c.limitTime, pros: c.professionalIds, open: false,
    }
  }
  const x = xmasOf(d)
  const preset: Preset =
    c.startDate === d.defaults.startDate && c.endDate === d.defaults.endDate ? 'month'
      : c.startDate === x.startDate && c.endDate === x.endDate ? 'xmas' : 'custom'
  return { preset, startDate: c.startDate, endDate: c.endDate, limit: c.limitTime, pros: c.professionalIds, open: c.openLinkUntilEnd }
}

/** Mesmas regras do back (validateRule), para avisar antes do round-trip. */
function periodError(f: Form, today: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(f.endDate)) return 'Escolha as duas datas.'
  if (f.endDate < f.startDate) return 'O fim do período precisa ser depois do começo.'
  if (daysBetween(f.startDate, f.endDate) + 1 > XH_MAX_PERIOD_DAYS) return `O período pode ter no máximo ${XH_MAX_PERIOD_DAYS} dias.`
  if (f.endDate < today) return 'O período já terminou. Escolha datas a partir de hoje.'
  return null
}

const CSS = `
.xh-root{ max-width:1000px; font-family:${typography.fontFamily}; color:${INK}; animation:xhc-in .25s ease; }
@keyframes xhc-in{ from{opacity:0; transform:translateY(6px)} to{opacity:1; transform:none} }
@keyframes xhc-pulse{ 0%,100%{opacity:.5} 50%{opacity:1} }
.xhc-back{ display:inline-flex; align-items:center; gap:4px; min-height:44px; padding:0 10px 0 4px; margin-left:-4px; border-radius:12px; font-size:14px; font-weight:500; color:${INK_2}; }
.xhc-h1{ margin:4px 0 0; font-size:28px; font-weight:600; display:flex; align-items:center; gap:10px; }
.xhc-lead{ margin:6px 0 0; font-size:14px; line-height:1.45; color:${INK_3}; max-width:600px; }
.xhc-how{ display:inline-flex; align-items:center; gap:6px; margin-top:10px; min-height:44px; padding:0 14px; border-radius:999px; border:1px solid ${XH.border}; background:${XH.bg}; color:${XH.ink}; font-size:14px; font-weight:600; }
.xhc-layout{ display:grid; grid-template-columns:minmax(0,1fr); gap:20px; margin-top:20px; align-items:start; }
@media (min-width:1024px){ .xhc-layout{ grid-template-columns:250px minmax(0,1fr); } }
.xhc-steps{ display:none; flex-direction:column; gap:6px; }
@media (min-width:1024px){ .xhc-steps{ display:flex; } .xhc-bars{ display:none !important; } }
.xhc-step{ min-height:60px; border-radius:14px; border:1px solid #ececf0; background:#fff; padding:8px 12px; display:flex; align-items:center; gap:12px; text-align:left; }
.xhc-step[aria-current="step"]{ border-color:${INK}; }
.xhc-dot{ width:28px; height:28px; border-radius:50%; background:#f2f2f5; color:${INK_3}; font-family:${typography.fontFamilyDisplay}; font-weight:600; font-size:13px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.xhc-dot.on{ background:${INK}; color:#fff; }
.xhc-step-t{ display:block; font-weight:600; font-size:14px; }
.xhc-step-v{ display:block; font-size:11.5px; color:${INK_3}; }
.xhc-help{ margin-top:10px; padding:12px 14px; border-radius:14px; background:#fff; border:1px solid #ececf0; font-size:12.5px; line-height:1.5; color:${INK_2}; }
.xhc-help ol{ margin:6px 0 0; padding-left:18px; }
.xhc-card{ background:#fff; border:1px solid #ececf0; border-radius:22px; padding:20px 18px; display:flex; flex-direction:column; min-height:440px; }
@media (min-width:1024px){ .xhc-card{ padding:28px; min-height:520px; } }
.xhc-bars{ display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:6px; margin-bottom:14px; }
.xhc-bars i{ height:4px; border-radius:99px; background:#e3e3e8; }
.xhc-bars i.on{ background:${INK}; }
.xhc-cap{ font-size:11px; letter-spacing:.08em; text-transform:uppercase; font-weight:600; color:${XH.ink}; }
.xhc-q{ margin:8px 0 0; font-size:30px; font-weight:700; line-height:1.06; }
@media (min-width:1024px){ .xhc-q{ font-size:36px; } }
.xhc-sub{ margin:6px 0 0; font-size:14px; line-height:1.45; color:${INK_3}; }
.xhc-opts{ display:grid; grid-template-columns:minmax(0,1fr); gap:10px; margin-top:20px; }
@media (min-width:720px){ .xhc-opts.three{ grid-template-columns:repeat(3,minmax(0,1fr)); } }
.xhc-opt{ min-height:64px; border-radius:16px; border:1.5px solid #e3e3e8; background:#fff; padding:12px 16px; text-align:left; display:flex; flex-direction:column; justify-content:center; gap:3px; }
.xhc-opt[aria-pressed="true"]{ border-color:${INK}; background:#f5f5f7; }
.xhc-opt-t{ font-weight:600; font-size:15px; }
.xhc-opt-s{ font-size:12.5px; color:${INK_3}; }
.xhc-dates{ display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; margin-top:12px; }
.xhc-dates label{ display:flex; flex-direction:column; gap:6px; font-size:12px; font-weight:500; color:${INK_3}; }
.xhc-dates input{ min-height:48px; border-radius:12px; border:1px solid #d6d6dc; padding:0 12px; font-size:16px; font-family:inherit; color:${INK}; background:#fff; width:100%; }
.xhc-link{ margin-top:16px; border-radius:16px; border:1.5px solid #e3e3e8; padding:14px 16px; }
.xhc-link.need{ border-color:rgba(180,83,9,.35); }
.xhc-link-row{ display:flex; align-items:center; gap:12px; }
.xhc-link-t{ font-weight:600; font-size:15px; }
.xhc-link-s{ font-size:13px; line-height:1.45; color:${INK_3}; margin-top:3px; }
.xhc-sw{ position:relative; flex-shrink:0; width:52px; height:44px; border:0; background:transparent; padding:0; }
.xhc-sw i{ position:absolute; left:2px; top:8px; width:48px; height:28px; border-radius:99px; background:#d6d6dc; transition:background .18s ease; }
.xhc-sw i::after{ content:''; position:absolute; top:3px; left:3px; width:22px; height:22px; border-radius:50%; background:#fff; box-shadow:0 1px 3px rgba(17,17,20,.25); transition:transform .18s cubic-bezier(.34,1.56,.64,1); }
.xhc-sw[aria-checked="true"] i{ background:${INK}; }
.xhc-sw[aria-checked="true"] i::after{ transform:translateX(20px); }
.xhc-sw:disabled{ opacity:.6; cursor:default; }
.xhc-confirm{ margin-top:12px; padding:14px; border-radius:14px; background:#f5f5f7; }
.xhc-confirm-t{ font-weight:600; font-size:15px; }
.xhc-confirm ul{ margin:6px 0 0; padding-left:18px; font-size:13px; line-height:1.5; color:${INK_2}; }
.xhc-confirm-acts{ display:flex; gap:8px; margin-top:12px; flex-wrap:wrap; }
.xhc-hours{ display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; margin-top:20px; }
@media (min-width:720px){ .xhc-hours{ grid-template-columns:repeat(4,minmax(0,1fr)); } }
.xhc-hour{ height:72px; border-radius:16px; border:1.5px solid #e3e3e8; background:#fff; font-family:${typography.fontFamilyDisplay}; font-size:26px; font-weight:600; letter-spacing:-.03em; color:${INK}; font-variant-numeric:tabular-nums; }
.xhc-hour[aria-pressed="true"]{ background:${INK}; border-color:${INK}; color:#fff; }
.xhc-pros{ display:grid; grid-template-columns:minmax(0,1fr); gap:10px; margin-top:20px; }
@media (min-width:720px){ .xhc-pros{ grid-template-columns:repeat(2,minmax(0,1fr)); } }
@media (min-width:1180px){ .xhc-pros{ grid-template-columns:repeat(3,minmax(0,1fr)); } }
.xhc-pro{ min-height:68px; border-radius:16px; border:1.5px solid #e3e3e8; background:#fff; padding:10px 14px; display:flex; align-items:center; gap:12px; text-align:left; }
.xhc-pro[aria-pressed="true"]{ border-color:${INK}; }
.xhc-av{ width:38px; height:38px; border-radius:50%; background:#f2f2f5; color:${INK_2}; font-size:12px; font-weight:600; display:flex; align-items:center; justify-content:center; flex-shrink:0; overflow:hidden; }
.xhc-av img{ width:100%; height:100%; object-fit:cover; }
.xhc-pro-b{ flex:1; min-width:0; }
.xhc-pro-n{ display:block; font-weight:600; font-size:15px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.xhc-pro-s{ display:block; font-size:12.5px; color:${INK_3}; margin-top:1px; }
.xhc-pro-s.on{ color:${XH.ink}; }
.xhc-pro-s.warn{ color:#b45309; }
.xhc-check{ width:24px; height:24px; border-radius:7px; border:1.5px solid #c9c9d0; display:flex; align-items:center; justify-content:center; flex-shrink:0; color:#fff; }
.xhc-pro[aria-pressed="true"] .xhc-check{ background:${INK}; border-color:${INK}; }
.xhc-err{ margin-top:14px; padding:12px 14px; border-radius:12px; background:#fff; border:1px solid #f1d0d0; color:#a32d2d; font-size:13.5px; line-height:1.45; }
.xhc-foot{ margin-top:auto; padding-top:24px; display:flex; flex-direction:column; gap:10px; }
@media (min-width:720px){ .xhc-foot{ flex-direction:row; align-items:center; justify-content:space-between; } }
.xhc-summary{ font-size:13px; color:${INK_3}; }
.xhc-summary.lock{ color:#7a4a0f; }
.xhc-lockbtn{ border:0; background:transparent; padding:0; font-size:13px; color:#7a4a0f; text-decoration:underline; text-underline-offset:3px; min-height:44px; text-align:left; }
.xhc-acts{ display:flex; gap:10px; }
.xhc-acts .xh-btn{ flex:1; }
@media (min-width:720px){ .xhc-acts .xh-btn{ flex:none; } }
.xhc-status{ background:#fff; border:1px solid ${XH.border}; border-radius:22px; padding:20px 18px; margin-top:20px; }
@media (min-width:1024px){ .xhc-status{ padding:26px 28px; } }
.xhc-status-big{ margin:8px 0 0; font-size:34px; font-weight:700; line-height:1.05; }
.xhc-status-lines{ display:flex; flex-direction:column; gap:8px; margin-top:14px; }
.xhc-status-lines div{ display:flex; gap:10px; align-items:baseline; font-size:14px; line-height:1.45; color:${INK_2}; }
.xhc-status-lines b{ color:${INK}; font-weight:600; }
.xhc-status-lines .k{ width:96px; flex-shrink:0; font-size:11px; letter-spacing:.06em; text-transform:uppercase; color:${INK_3}; }
.xhc-status-acts{ display:flex; gap:10px; flex-wrap:wrap; margin-top:18px; }
.xhc-off{ color:#a32d2d !important; }
.xhc-skel{ height:120px; border-radius:22px; background:#f2f2f5; margin-top:20px; animation:xhc-pulse 1.2s ease-in-out infinite; }
.xhc-msg{ margin-top:20px; padding:16px; border-radius:16px; background:#fff; border:1px solid #ececf0; font-size:14px; line-height:1.5; color:${INK_2}; }
.xhc-toast{ position:fixed; left:50%; transform:translateX(-50%); bottom:calc(64px + env(safe-area-inset-bottom) + 14px); z-index:10000; padding:11px 16px; border-radius:12px; font-size:14px; font-weight:500; font-family:${typography.fontFamily}; box-shadow:0 8px 24px rgba(17,17,20,.18); background:${INK}; color:#fff; max-width:calc(100vw - 32px); }
@media (min-width:1024px){ .xhc-toast{ bottom:24px; left:calc(50% + var(--sidebar-width, 0px) / 2); } }
@media (prefers-reduced-motion:reduce){ .xh-root, .xhc-skel{ animation:none; } .xhc-sw i, .xhc-sw i::after{ transition:none; } }
`

function ConfirmOff({ onCancel, onConfirm, busy }: { onCancel: () => void; onConfirm: () => void; busy: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const cancelRef = useRef(onCancel)
  useEffect(() => { cancelRef.current = onCancel })
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    ref.current?.querySelector<HTMLButtonElement>('button')?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') cancelRef.current() }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); prev?.focus() }
  }, [])
  return createPortal(
    <>
      <style>{XH_CSS}</style>
      <div className="xh-drop" onClick={onCancel} aria-hidden />
      <div className="xh-sheet small" role="alertdialog" aria-modal="true" aria-labelledby="xhc-off-t" ref={ref}>
        <h2 id="xhc-off-t" className="xh-d" style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Desligar o Modo Dezembro?</h2>
        <ul style={{ margin: '10px 0 0', paddingLeft: 18, fontSize: 14, lineHeight: 1.5, color: INK_2 }}>
          <li>Os horários já marcados na fila continuam na agenda.</li>
          <li>O link volta a mostrar só o horário normal.</li>
          <li>A antecedência do link volta à sua regra de agendamento.</li>
        </ul>
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button type="button" className="xh-btn ghost" onClick={onCancel}>Manter ligado</button>
          <button type="button" className="xh-btn" style={{ flex: 1 }} disabled={busy} onClick={onConfirm}>
            {busy ? 'Desligando…' : 'Desligar'}
          </button>
        </div>
      </div>
    </>,
    document.body,
  )
}

export default function ModoDezembroPage() {
  const [load, setLoad] = useState<Load | null>(null)
  const [form, setForm] = useState<Form | null>(null)
  const [editing, setEditing] = useState(false)
  const [step, setStep] = useState(0)
  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [askOff, setAskOff] = useState(false)
  const [sim, setSim] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function carregar() {
    fetchXh()
      .then((dto) => { setLoad({ dto, failed: false, forbidden: false }); setForm(formFrom(dto)) })
      .catch((e) => {
        const forbidden = errorStatus(e) === 403
        if (!forbidden) console.error('[modo-dezembro] carregar', e)
        setLoad({ dto: null, failed: !forbidden, forbidden })
      })
  }

  useEffect(() => {
    let vivo = true
    fetchXh()
      .then((dto) => { if (vivo) { setLoad({ dto, failed: false, forbidden: false }); setForm(formFrom(dto)) } })
      .catch((e) => {
        const forbidden = errorStatus(e) === 403
        if (!forbidden) console.error('[modo-dezembro] carregar', e)
        if (vivo) setLoad({ dto: null, failed: !forbidden, forbidden })
      })
    return () => { vivo = false }
  }, [])

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current) }, [])

  function avisar(text: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(text)
    toastTimer.current = setTimeout(() => setToast(null), 2800)
  }

  const dto = load?.dto ?? null
  const running = dto ? isRunning(dto) : false
  const showWizard = !!dto && !!form && (editing || !running)

  function patch(p: Partial<Form>) {
    setErr(null)
    setForm((f) => (f ? { ...f, ...p } : f))
  }

  function pickPreset(p: Preset) {
    if (!dto || !form) return
    setConfirming(false)
    if (p === 'month') patch({ preset: p, startDate: dto.defaults.startDate, endDate: dto.defaults.endDate, open: false })
    else if (p === 'xmas') patch({ preset: p, ...xmasOf(dto), open: false })
    else patch({ preset: p })
  }

  function enviar(active: boolean) {
    if (!dto || !form || saving) return
    const covered = linkCovers(dto, form.endDate)
    const rule: XhRule = {
      active,
      startDate: form.startDate,
      endDate: form.endDate,
      limitTime: form.limit,
      professionalIds: form.pros,
      openLinkUntilEnd: covered || form.open,
    }
    setSaving(true)
    setErr(null)
    saveXh(rule)
      .then((next) => {
        setLoad({ dto: next, failed: false, forbidden: false })
        setForm(formFrom(next))
        setEditing(false)
        setStep(0)
        setAskOff(false)
        avisar(active ? 'Modo Dezembro ligado' : 'Modo Dezembro desligado')
      })
      .catch((e) => {
        console.error('[modo-dezembro] salvar', e)
        const msg = errorStatus(e) === 403 ? 'Só o dono ou o gerente mudam o Modo Dezembro.' : errorText(e)
        setErr(msg)
        setAskOff(false)
        if (!active) avisar(msg)
      })
      .finally(() => setSaving(false))
  }

  // ── derivados do formulario ─────────────────────────────────────────────
  const covered = dto && form ? linkCovers(dto, form.endDate) : false
  const linkOk = covered || !!form?.open
  const pErr = dto && form ? periodError(form, dto.today) : null
  const nPros = form?.pros.length ?? 0
  const baseDays = dto ? linkDays(dto.baseMaxFutureDays) : 0
  const backDay = form ? ddmm(addDays(form.endDate, 1)) : ''
  const periodLabel = form ? `${ddmm(form.startDate)} – ${ddmm(form.endDate)}` : ''
  const locked = !linkOk || nPros === 0 || !!pErr
  const lockText = pErr
    ? pErr
    : !linkOk
      ? `Para ativar, libere o link até ${form ? ddmm(form.endDate) : ''} (passo 1).`
      : nPros === 0 ? 'Escolha pelo menos um profissional.' : null
  const alreadyOn = !!dto?.config?.active && running

  const firstPro = dto?.professionals.find((p) => form?.pros.includes(p.id)) ?? dto?.professionals[0] ?? null
  const proNames = dto && dto.config
    ? dto.professionals.filter((p) => dto.config!.professionalIds.includes(p.id)).map((p) => p.name.split(' ')[0])
    : []

  const limits = form && !LIMITS.includes(form.limit) ? [...LIMITS, form.limit].sort() : LIMITS
  const stepValues = form
    ? [form.preset === 'month' ? 'Dezembro inteiro' : form.preset === 'xmas' ? 'Semana do Natal' : periodLabel, `até ${form.limit}`, `${nPros} de ${dto?.professionals.length ?? 0} profissionais`]
    : ['', '', '']

  function irPara(s: number) {
    setErr(null)
    setStep(Math.max(0, Math.min(2, s)))
  }

  return (
    <>
      <style>{XH_CSS}</style>
      <style>{CSS}</style>
      <div className="xh-root">
        <Link href="/dashboard/configuracoes" className="xhc-back"><ChevronLeft size={18} aria-hidden />Configurações</Link>
        <h1 className="xhc-h1 xh-d"><FlameIcon size={26} />Modo Dezembro</h1>
        <p className="xhc-lead">
          No fim de ano, a agenda não fica com buraco. Depois do fechamento, o link oferece só o horário
          logo depois do último atendimento, até o limite que você escolher. O horário normal não muda.
        </p>
        {dto && (
          <button type="button" className="xhc-how" onClick={() => setSim(true)}>
            <Play size={15} aria-hidden /> Ver como a fila funciona
          </button>
        )}

        {load === null && <div className="xhc-skel" aria-busy="true" aria-label="Carregando" />}

        {load?.forbidden && (
          <div className="xhc-msg" role="alert">Só o dono ou o gerente configuram o Modo Dezembro.</div>
        )}

        {load?.failed && (
          <div className="xhc-msg" role="alert">
            Não deu para abrir o Modo Dezembro agora.
            <div><button type="button" className="xh-btn" style={{ marginTop: 12 }} onClick={() => { setLoad(null); carregar() }}>Tentar de novo</button></div>
          </div>
        )}

        {/* @eligi:xh-fe-status — ligado: resumo + editar/desligar */}
        {dto && dto.config && running && !editing && (
          <section className="xhc-status" aria-label="Modo Dezembro ligado">
            <span className="xh-eyebrow"><FlameIcon size={14} className="xh-flame" />Ligado</span>
            <p className="xhc-status-big xh-d">Fila até {dto.config.limitTime}</p>
            <div className="xhc-status-lines">
              <div><span className="k xh-m">Período</span><span><b>{ddmm(dto.config.startDate)} a {ddmm(dto.config.endDate)}</b></span></div>
              <div><span className="k xh-m">Na fila</span><span><b>{proNames.length > 0 ? proNames.join(', ') : 'ninguém'}</b></span></div>
              <div>
                <span className="k xh-m">Link</span>
                <span>
                  {linkCovers(dto, dto.config.endDate)
                    ? <>Sua regra já cobre até <b>{ddmm(dto.config.endDate)}</b>.</>
                    : <>Liberado até <b>{ddmm(dto.config.endDate)}</b>. Em {ddmm(addDays(dto.config.endDate, 1))} volta a {linkDays(dto.baseMaxFutureDays)} dias.</>}
                </span>
              </div>
            </div>
            <div className="xhc-status-acts">
              <button type="button" className="xh-btn" onClick={() => { setForm(formFrom(dto)); setEditing(true); setStep(0) }}>
                <Pencil size={15} aria-hidden style={{ marginRight: 6, verticalAlign: -2 }} />Editar
              </button>
              <button type="button" className="xh-btn ghost xhc-off" onClick={() => setAskOff(true)}>
                <Power size={15} aria-hidden style={{ marginRight: 6, verticalAlign: -2 }} />Desligar
              </button>
            </div>
            {err && <div className="xhc-err" role="alert">{err}</div>}
          </section>
        )}

        {/* @eligi:xh-fe-wizard — assistente em 3 passos */}
        {showWizard && dto && form && (
          <div className="xhc-layout">
            <nav className="xhc-steps" aria-label="Passos">
              {STEP_TITLES.map((t, i) => (
                <button key={t} type="button" className="xhc-step" aria-current={i === step ? 'step' : undefined} onClick={() => irPara(i)}>
                  <span className={`xhc-dot${i <= step ? ' on' : ''}`}>{i < step ? <Check size={14} aria-hidden /> : i + 1}</span>
                  <span><span className="xhc-step-t">{t}</span><span className="xhc-step-v xh-m">{stepValues[i]}</span></span>
                </button>
              ))}
              <div className="xhc-help">
                <b>Como a fila anda</b>
                <ol>
                  <li>O dia normal termina no horário de cada profissional.</li>
                  <li>O link mostra só o próximo horário livre depois do último atendimento.</li>
                  <li>Cada cliente que marca empurra a fila. Para no limite.</li>
                </ol>
              </div>
            </nav>

            <section className="xhc-card" aria-labelledby="xhc-q">
              <div className="xhc-bars" aria-hidden>{[0, 1, 2].map((i) => <i key={i} className={i <= step ? 'on' : ''} />)}</div>
              <span className="xhc-cap xh-m">Passo {step + 1} de 3</span>

              {step === 0 && (
                <>
                  <h2 id="xhc-q" className="xhc-q xh-d">Quando vale?</h2>
                  <p className="xhc-sub">Fora desse período a agenda volta ao normal sozinha.</p>
                  <div className="xhc-opts three" role="group" aria-label="Período">
                    {([
                      ['month', 'Dezembro inteiro', `${ddmm(dto.defaults.startDate)} – ${ddmm(dto.defaults.endDate)}`],
                      ['xmas', 'Semana do Natal', `${ddmm(xmasOf(dto).startDate)} – ${ddmm(xmasOf(dto).endDate)}`],
                      ['custom', 'Escolher as datas', form.preset === 'custom' ? periodLabel : 'dd/mm – dd/mm'],
                    ] as const).map(([k, t, s]) => (
                      <button key={k} type="button" className="xhc-opt" aria-pressed={form.preset === k} onClick={() => pickPreset(k)}>
                        <span className="xhc-opt-t">{t}</span><span className="xhc-opt-s xh-m">{s}</span>
                      </button>
                    ))}
                  </div>
                  {form.preset === 'custom' && (
                    <div className="xhc-dates">
                      <label>Começa em
                        <input type="date" value={form.startDate} min={dto.today} onChange={(e) => patch({ startDate: e.target.value, open: false })} />
                      </label>
                      <label>Termina em
                        <input type="date" value={form.endDate} min={form.startDate || dto.today} onChange={(e) => { setConfirming(false); patch({ endDate: e.target.value, open: false }) }} />
                      </label>
                    </div>
                  )}
                  {pErr && <div className="xhc-err" role="alert">{pErr}</div>}

                  {/* @eligi:xh-fe-link — REGRA: so ativa com o link liberado ate o fim */}
                  {!pErr && (
                    <div className={`xhc-link${linkOk ? '' : ' need'}`}>
                      <div className="xhc-link-row">
                        <div style={{ flex: 1 }}>
                          <div className="xhc-link-t">Liberar o período inteiro no link</div>
                          <div className="xhc-link-s">
                            {covered
                              ? <>Já está liberado: sua regra aceita {baseDays} dias à frente e cobre até {ddmm(form.endDate)}.</>
                              : form.open
                                ? <>O link aceita marcação até {ddmm(form.endDate)}. Em {backDay} volta sozinho para {baseDays} dias.</>
                                : <>Hoje seu link mostra só {baseDays} {baseDays === 1 ? 'dia' : 'dias'} à frente. O cliente ainda não consegue marcar até {ddmm(form.endDate)}.</>}
                          </div>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          className="xhc-sw"
                          aria-checked={linkOk}
                          aria-label="Liberar o período inteiro no link"
                          disabled={covered}
                          onClick={() => { if (form.open) patch({ open: false }); else setConfirming(true) }}
                        >
                          <i aria-hidden />
                        </button>
                      </div>
                      {confirming && !covered && !form.open && (
                        <div className="xhc-confirm" role="alertdialog" aria-labelledby="xhc-confirm-t">
                          <div id="xhc-confirm-t" className="xhc-confirm-t">Liberar marcação até {ddmm(form.endDate)}?</div>
                          <ul>
                            <li>Hoje seu link aceita só <b>{baseDays} {baseDays === 1 ? 'dia' : 'dias'} à frente</b>.</li>
                            <li>Ligando, o cliente marca qualquer horário até {ddmm(form.endDate)}, não só a fila.</li>
                            <li>Em {backDay} volta sozinho para {baseDays} dias. Sua regra não muda.</li>
                          </ul>
                          <div className="xhc-confirm-acts">
                            <button type="button" className="xh-btn ghost" onClick={() => setConfirming(false)}>Manter {baseDays} {baseDays === 1 ? 'dia' : 'dias'}</button>
                            <button type="button" className="xh-btn" style={{ flex: 1 }} onClick={() => { setConfirming(false); patch({ open: true }) }}>Sim, liberar</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {step === 1 && (
                <>
                  <h2 id="xhc-q" className="xhc-q xh-d">Até que horas a fila vai?</h2>
                  <p className="xhc-sub">A fila começa no fim do horário de cada profissional. O último serviço precisa terminar até aqui.</p>
                  <div className="xhc-hours" role="group" aria-label="Limite">
                    {limits.map((t) => (
                      <button key={t} type="button" className="xhc-hour" aria-pressed={form.limit === t} onClick={() => patch({ limit: t })}>{t}</button>
                    ))}
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <h2 id="xhc-q" className="xhc-q xh-d">Quem entra na fila?</h2>
                  <p className="xhc-sub">Quem ficar de fora segue o horário normal.</p>
                  {dto.professionals.length === 0 && <div className="xhc-msg">Nenhum profissional ativo na equipe.</div>}
                  <div className="xhc-pros" role="group" aria-label="Profissionais">
                    {dto.professionals.map((p) => {
                      const on = form.pros.includes(p.id)
                      const src = avatarSrc(p.avatarUrl)
                      const noRoom = !!p.closesAt && p.closesAt >= form.limit
                      const sub = !on
                        ? 'Horário normal'
                        : !p.closesAt
                          ? `Fila depois do fechamento, até ${form.limit}`
                          : noRoom ? `Fecha às ${p.closesAt}: não sobra fila` : `Fila das ${p.closesAt} às ${form.limit}`
                      return (
                        <button
                          key={p.id}
                          type="button"
                          className="xhc-pro"
                          aria-pressed={on}
                          onClick={() => patch({ pros: on ? form.pros.filter((x) => x !== p.id) : [...form.pros, p.id] })}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <span className="xhc-av" aria-hidden>{src ? <img src={src} alt="" /> : initials(p.name)}</span>
                          <span className="xhc-pro-b">
                            <span className="xhc-pro-n">{p.name}</span>
                            <span className={`xhc-pro-s${on ? (noRoom ? ' warn' : ' on') : ''}`}>{sub}</span>
                          </span>
                          <span className="xhc-check" aria-hidden>{on && <Check size={15} strokeWidth={2.6} />}</span>
                        </button>
                      )
                    })}
                  </div>
                </>
              )}

              {err && <div className="xhc-err" role="alert">{err}</div>}

              <div className="xhc-foot">
                {step === 2 && lockText
                  ? <button type="button" className="xhc-lockbtn" onClick={() => irPara(0)}>{lockText}</button>
                  : <span className="xhc-summary">{stepValues[0]} · {stepValues[1]} · {nPros} na fila</span>}
                <div className="xhc-acts">
                  {step > 0 && <button type="button" className="xh-btn ghost" onClick={() => irPara(step - 1)}>Voltar</button>}
                  {step === 0 && editing && <button type="button" className="xh-btn ghost" onClick={() => { setEditing(false); setForm(formFrom(dto)); setErr(null) }}>Cancelar</button>}
                  {step < 2 && (
                    <button type="button" className="xh-btn" disabled={step === 0 && !!pErr} onClick={() => irPara(step + 1)}>Continuar</button>
                  )}
                  {step === 2 && (
                    <button type="button" className="xh-btn red" disabled={locked || saving} onClick={() => enviar(true)}>
                      {saving ? 'Salvando…' : alreadyOn ? 'Salvar alterações' : 'Ativar Modo Dezembro'}
                    </button>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}
      </div>

      {askOff && <ConfirmOff busy={saving} onCancel={() => setAskOff(false)} onConfirm={() => enviar(false)} />}

      {sim && dto && (
        <XhSimulator
          closeAt={firstPro?.closesAt ?? '20:00'}
          limit={form?.limit ?? dto.defaults.limitTime}
          proName={firstPro ? firstPro.name.split(' ')[0] : null}
          onClose={() => setSim(false)}
          onActivate={() => { setSim(false); if (running) { setForm(formFrom(dto)); setEditing(true) } setStep(0) }}
          activateLabel={running ? 'Editar a fila' : 'Configurar agora'}
        />
      )}

      {toast && <div className="xhc-toast" role="status">{toast}</div>}
    </>
  )
}
