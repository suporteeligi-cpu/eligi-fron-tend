'use client'
// src/app/dashboard/eligiclub/components/ClubPainelTab.tsx
// @eligi:club-painel-tab — aba Painel do EligiClub (out/2026, direcao C).
//
// Responde a pergunta do Jefferson (ZERO9): "quanto do que os membros ja
// pagaram cai na minha conta, e em que dia?". Verde = cobranca PAGA esperando
// liberacao (liquido). Tracejado = renovacao PREVISTA (bruto, pode falhar).
// Os dois nunca sao somados.
//
// Superficie ESCURA fixa (brand.surfaceDark), dentro da pagina clara. Excecao
// consciente a regra "o dashboard e claro" (decisao do Eli, 12/10/2026), com o
// pote do Fechamento como precedente. Nao segue o tema do sistema.
//
// O back corta por papel (scrubPainel): dono ve tudo, gerente sem valores em
// reais, recepcao so "Precisa de voce". A tela decide pela AUSENCIA do dado.
// O olho e so do dono e fica guardado neste aparelho.

import { useCallback, useEffect, useState, useSyncExternalStore, type ComponentProps } from 'react'
import { createPortal } from 'react-dom' // @eligi:club-painel-portal-import
import {
  AlertCircle, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Eye, EyeOff, Lock, RefreshCw, X,
} from 'lucide-react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import api from '@/shared/lib/apiClient'
import { brand } from '@/shared/brand.generated'
import ClubMemberDetailModal from './ClubMemberDetailModal'

// ── contrato (espelha club.painel.rules.ts do back) ──────────────────────────
type Bucket = 'DIA' | 'PROCESSANDO' | 'ANTECIPANDO'
type AtencaoKind = 'MANUAL_VENCIDO' | 'CARTAO_ATRASADO' | 'AGUARDANDO_PAGAMENTO'
interface PainelDia { date: string; cai: number | null; caiCount: number; renova: number | null; renovaCount: number }
interface Recebivel {
  id: string; bucket: Bucket; date: string | null; clientName: string; planName: string
  tipo: string | null; bruto: number; liquido: number; taxa: number | null; paidAt: string
}
interface Renovacao { subId: string; date: string; clientName: string; planName: string; valor: number | null; manual: boolean }
interface Atencao { kind: AtencaoKind; subId: string; clientName: string; planName: string; valor: number | null; since: string }
interface UsoPlano {
  planId: string; nome: string; cor: string | null; membros: number; usosPorMembro: number
  usosPorMembroAnterior: number | null; noLimite: number; limiteTexto: string | null; sinal: 'ALTO' | 'BAIXO' | null
}
interface Painel {
  role: 'OWNER' | 'MANAGER' | 'RECEPTION'
  hoje: string
  dinheiro: null | {
    saldo: number | null; cai7: number; cai30: number
    processando: { total: number; count: number }
    antecipando: { total: number; count: number }
    mrr: number
    pote: { periodKey: string; total: number; fichas: number; aCaminho: number }
  }
  membros: null | { ativos: number; novosMes: number; canceladosMes: number; renovam7: number }
  dias: PainelDia[]
  recebiveis: Recebivel[]
  renovacoes: Renovacao[]
  atencao: Atencao[]
  noLimite: number
  usoPlanos: UsoPlano[]
}
type MemberSub = ComponentProps<typeof ClubMemberDetailModal>['initialSub']

// ── tokens do painel escuro (brand.surfaceDark + escala funcional) ───────────
const D = {
  bg:       brand.surfaceDark.base,
  card:     brand.surfaceDark.card,
  card2:    '#16161F',
  line:     brand.surfaceDark.border,
  ink:      brand.surfaceDark.textPrimary,
  ink2:     '#B4B4BE',
  ink3:     brand.surfaceDark.textMuted,
  green:    '#4ADE80',                 // texto verde sobre escuro (AA)
  greenBar: brand.successScale.base,
  greenBg:  'rgba(22,163,74,0.14)',
  greenLn:  'rgba(74,222,128,0.22)',
  amber:    '#FBBF24',
  amberBg:  'rgba(245,158,11,0.14)',
  red:      brand.core.red,            // marca sobre fundo escuro
  action:   brand.core.redAction,      // botao com texto branco (AA)
  blue:     '#60A5FA',
  blueBg:   'rgba(96,165,250,0.14)',
}

// ── olho: preferencia por aparelho, sem setState em efeito ───────────────────
const HIDE_KEY = 'eligi-club-hide-values'
let hideMem = false
const hideListeners = new Set<() => void>()
function readHide(): boolean {
  try { const v = localStorage.getItem(HIDE_KEY); return v === null ? hideMem : v === '1' } catch { return hideMem }
}
function writeHide(v: boolean) {
  hideMem = v
  try { localStorage.setItem(HIDE_KEY, v ? '1' : '0') } catch { /* modo privado: fica so em memoria */ }
  hideListeners.forEach((l) => l())
}
function subscribeHide(l: () => void) { hideListeners.add(l); return () => { hideListeners.delete(l) } }

// ── formatacao ───────────────────────────────────────────────────────────────
const HIDDEN = 'R$ ••••'
const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const brlK = (n: number) => (n >= 1000
  ? `R$ ${(n / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k`
  : `R$ ${Math.round(n).toLocaleString('pt-BR')}`)
const WD = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
const ymd = (s: string) => { const [y, m, d] = s.split('-').map(Number); return { y, m, d } }
const weekday = (s: string) => new Date(`${s}T12:00:00Z`).getUTCDay()
const ddmm = (s: string) => { const { m, d } = ymd(s); return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}` }
const addDays = (s: string, n: number) => new Date(new Date(`${s}T12:00:00Z`).getTime() + n * 86_400_000).toISOString().slice(0, 10)
function relDay(date: string, hoje: string): string {
  if (date === hoje) return 'Hoje'
  if (date === addDays(hoje, 1)) return 'Amanhã'
  const w = WD[weekday(date)]
  return `${w[0].toUpperCase()}${w.slice(1)} ${ddmm(date)}`
}
const TIPO: Record<string, string> = { CREDIT_CARD: 'Crédito', DEBIT_CARD: 'Débito', PIX: 'Pix', BOLETO: 'Boleto' }
const ATENCAO: Record<AtencaoKind, { color: string; text: (a: Atencao) => string; cta: string }> = {
  MANUAL_VENCIDO:       { color: D.amber, cta: 'Cobrar',      text: (a) => `Manual · venceu ${ddmm(a.since.slice(0, 10))}` },
  CARTAO_ATRASADO:      { color: D.red,   cta: 'Enviar link', text: (a) => `Cartão não passou · desde ${ddmm(a.since.slice(0, 10))}` },
  AGUARDANDO_PAGAMENTO: { color: D.blue,  cta: 'Enviar link', text: (a) => `Ainda não pagou o link · desde ${ddmm(a.since.slice(0, 10))}` },
}

const CSS = `
.cp{background:${D.bg};color:${D.ink};border-radius:22px;padding:14px;box-shadow:0 18px 48px rgba(0,0,0,.18);font-family:var(--font-sans);animation:club-panel 300ms cubic-bezier(.22,1,.36,1) both}
@media(min-width:900px){.cp{padding:18px}}
.cp *{box-sizing:border-box}
.cp .num{font-variant-numeric:tabular-nums}
.cp .disp{font-family:var(--font-display);letter-spacing:-.035em}
.cp .lbl{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:${D.ink3}}
.cp .card{background:${D.card};border:1px solid ${D.line};border-radius:16px;padding:14px;min-width:0}
@media(min-width:900px){.cp .card{padding:16px}}
.cp .head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}
.cp .head h3{margin:0;font-family:var(--font-display);font-size:18px;font-weight:600;letter-spacing:-.02em}
.cp .head small{display:block;color:${D.ink3};font-size:12px;font-weight:500;margin-top:2px}
.cp .ghost{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:44px;min-width:44px;padding:0 12px;border-radius:12px;border:1px solid ${D.line};background:${D.card};color:${D.ink};font:600 13px var(--font-sans);cursor:pointer;white-space:nowrap;-webkit-tap-highlight-color:transparent}
.cp .ghost .t{display:none}
@media(min-width:900px){.cp .ghost .t{display:inline}}
.cp .kpis{display:grid;gap:10px;grid-template-columns:repeat(2,minmax(0,1fr))}
@media(min-width:900px){.cp .kpis{grid-template-columns:repeat(4,minmax(0,1fr))}}
.cp .kv{font-family:var(--font-display);font-size:20px;font-weight:600;letter-spacing:-.035em;margin-top:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
@media(min-width:900px){.cp .kv{font-size:24px}}
.cp .kh{color:${D.ink3};font-size:12px;margin-top:2px}
.cp .hero{background:linear-gradient(160deg,#0F2A1A 0%,${D.card} 72%);border-color:${D.greenLn}}
.cp .hero .kv{color:${D.green}}
.cp .mt{margin-top:10px}
.cp .sec{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px}
.cp .strip{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px}
.cp .strip::-webkit-scrollbar{display:none}
.cp .sday{flex:0 0 86px;min-height:96px;border-radius:14px;border:1px solid ${D.line};padding:10px;background:${D.card2};cursor:pointer;text-align:left;font-family:inherit;color:inherit;-webkit-tap-highlight-color:transparent}
.cp .sday.on{background:${D.greenBg};border-color:${D.greenLn}}
.cp .sday .w{font-size:10.5px;color:${D.ink3};font-weight:700;text-transform:uppercase;letter-spacing:.07em}
.cp .sday .d{font-family:var(--font-display);font-size:20px;font-weight:600}
.cp .sday .c{font-family:var(--font-display);font-weight:600;font-size:14px;margin-top:6px;white-space:nowrap}
.cp .sday .k{font-size:11px;color:${D.ink3}}
.cp .note{margin-top:10px;font-size:12px;color:${D.ink2};display:flex;gap:8px;align-items:center}
.cp .dot{width:10px;height:10px;border-radius:3px;flex-shrink:0}
.cp .cols{display:grid;gap:10px;grid-template-columns:minmax(0,1fr)}
@media(min-width:900px){.cp .cols{grid-template-columns:minmax(0,1.6fr) minmax(0,1fr)}}
.cp .stack{display:grid;gap:10px;align-content:start;min-width:0}
.cp .side{order:-1}
@media(min-width:900px){.cp .side{order:0}}
.cp .row{display:flex;gap:12px;align-items:center;padding:12px 0;border-bottom:1px solid ${D.line}}
.cp .row:last-child{border-bottom:0;padding-bottom:0}
.cp .bar{width:4px;align-self:stretch;border-radius:4px;flex-shrink:0}
.cp .rt{flex:1;min-width:0}
.cp .rt b{display:block;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cp .rt span{color:${D.ink3};font-size:12px}
.cp .btn{min-height:44px;padding:0 14px;border-radius:11px;border:1px solid ${D.line};background:${D.card2};color:${D.ink};font:600 13px var(--font-sans);cursor:pointer;white-space:nowrap;flex-shrink:0}
.cp .btn.p{background:${D.action};border-color:${D.action};color:#fff}
.cp .btn:disabled{opacity:.5;cursor:default}
.cp .count{font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;background:${D.amberBg};color:${D.amber}}
.cp .legend{display:flex;flex-wrap:wrap;gap:12px;font-size:12px;color:${D.ink2}}
.cp .legend span{display:inline-flex;align-items:center;gap:6px}
.cp .sw{width:11px;height:11px;border-radius:3px;display:inline-block}
.cp .meter{height:8px;border-radius:999px;background:${D.card2};overflow:hidden;margin:10px 0 6px}
.cp .meter i{display:block;height:100%;background:linear-gradient(90deg,${brand.core.redDeep},${D.red});border-radius:999px}
.cp .sk{background:${D.card};border-radius:16px;animation:cp-pulse 1.2s ease-in-out infinite alternate}
@keyframes cp-pulse{from{opacity:.55}to{opacity:1}}
/* @eligi:club-painel-sheet-css — folha vai pro body (portal): o painel tem animacao com
   transform, que prende position:fixed dentro dele. Mobile respeita navbar (104) e
   bottom nav (64); no computador o calendario abre maior, centralizado na tela. */
.cp-scrim{position:fixed;left:0;right:0;top:104px;bottom:calc(64px + env(safe-area-inset-bottom,0px));background:rgba(0,0,0,.55);display:flex;align-items:flex-end;justify-content:center;z-index:11000}
@media(min-width:900px){.cp-scrim{top:0;bottom:0;align-items:center;padding:24px}}
.cp-sheet{background:${D.card};color:${D.ink};width:100%;max-width:560px;max-height:100%;/* @eligi:club-painel-sheet-max */overflow:auto;border:1px solid ${D.line};border-radius:22px 22px 0 0;padding:18px 16px calc(24px + env(safe-area-inset-bottom,0px));font-family:var(--font-sans);animation:club-panel 220ms cubic-bezier(.22,1,.36,1) both}
@media(min-width:900px){.cp-sheet{border-radius:22px;padding:24px 24px 28px}.cp-sheet.big{max-width:820px}.cp-sheet.big .cd{min-height:84px;padding:8px}.cp-sheet.big .cd .d{font-size:13px}.cp-sheet.big .cd .c{font-size:15px}.cp-sheet.big .cal{gap:6px}} /* @eligi:club-painel-sheet-size */
.cp-sheet .lbl{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:${D.ink3}}
/* @eligi:club-painel-h4-cor — o globals.css pinta h1-h6 e 'main p/span/li' de escuro
   (feito pro dashboard claro). Aqui tudo herda a tinta clara do painel; regras com
   classe (.lbl, .chip, .rt span...) continuam mandando por especificidade. */
.cp-sheet h4{font-family:var(--font-display);font-size:20px;font-weight:600;letter-spacing:-.03em;margin:2px 0 0}
.cp h3,.cp h4,.cp p,.cp span,.cp li,.cp-sheet h4,.cp-sheet p,.cp-sheet span,.cp-sheet li{color:inherit}
.cp-sheet .x{float:right;width:44px;height:44px;border-radius:12px;border:1px solid ${D.line};background:${D.card2};color:${D.ink};cursor:pointer;display:flex;align-items:center;justify-content:center;margin:-4px 0 0 8px}
.cp-sheet .ss{margin:16px 0 4px;display:flex;justify-content:space-between;align-items:baseline;gap:8px}
.cp-sheet .row{display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid ${D.line}}
.cp-sheet .row:last-child{border-bottom:0}
.cp-sheet .rt{flex:1;min-width:0}
.cp-sheet .rt b{display:block;font-weight:600}
.cp-sheet .rt span{color:${D.ink3};font-size:12px}
.cp-sheet .val{text-align:right;font-family:var(--font-display);font-weight:600;font-variant-numeric:tabular-nums;white-space:nowrap}
.cp-sheet .val small{display:block;font-family:var(--font-sans);font-size:11px;color:${D.ink3};font-weight:500}
.cp-sheet .chip{display:inline-flex;font-size:10.5px;font-weight:600;padding:1px 7px;border-radius:999px;background:${D.card2};color:${D.ink2};margin-left:4px}
.cp-sheet .av{width:34px;height:34px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:#fff}
.cp-sheet .cal{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;margin-top:12px}
.cp-sheet .wd{text-align:center;font-size:10.5px;font-weight:700;color:${D.ink3}}
.cp-sheet .cd{min-height:56px;border-radius:10px;background:${D.card2};border:1px solid transparent;padding:4px 5px;display:flex;flex-direction:column;cursor:pointer;font-family:inherit;color:inherit;text-align:left}
.cp-sheet .cd:disabled{cursor:default;opacity:.4}
.cp-sheet .cd.today{border-color:${D.ink}}
.cp-sheet .cd.on{background:${D.greenBg}}
.cp-sheet .cd .d{font-size:11px;font-weight:600;color:${D.ink2}}
.cp-sheet .cd .c{font-family:var(--font-display);font-weight:600;font-size:12px;color:${D.green};margin-top:auto;white-space:nowrap;overflow:hidden}
.cp-sheet .nav{display:flex;align-items:center;justify-content:space-between;margin-top:10px}
.cp-sheet .nav button{width:44px;height:44px;border-radius:12px;border:1px solid ${D.line};background:${D.card2};color:${D.ink};cursor:pointer;display:flex;align-items:center;justify-content:center}
.cp-sheet .nav button:disabled{opacity:.3;cursor:default}
.cp :focus-visible,.cp-sheet :focus-visible{outline:2px solid #fff;outline-offset:2px}
`

const HUES = ['#ef4444', '#2563eb', '#059669', '#d97706', '#7c3aed', '#0891b2', '#db2777']
const hue = (s: string) => HUES[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % HUES.length]

// ═══════════════════════════════════════════════════════════════════════════
export default function ClubPainelTab({ isMobile, onOpenMembers }: { isMobile: boolean; onOpenMembers: () => void }) {
  const [state, setState] = useState<{ data: Painel | null; loading: boolean; error: string | null }>({ data: null, loading: true, error: null })
  const [reload, setReload] = useState(0)
  const [sheet, setSheet] = useState<{ kind: 'day'; date: string } | { kind: 'month'; ym: string } | null>(null)
  const [member, setMember] = useState<MemberSub | null>(null)
  const [opening, setOpening] = useState<string | null>(null)
  const [verTodos, setVerTodos] = useState(false)
  const hide = useSyncExternalStore(subscribeHide, readHide, () => false)

  useEffect(() => {
    let alive = true
    async function run() {
      try {
        const res = await api.get('/club-subscriptions/painel')
        if (alive) setState({ data: res.data?.data as Painel, loading: false, error: null })
      } catch (err) {
        console.error('[club-painel] falha ao carregar', err)
        if (alive) setState((s) => ({ data: s.data, loading: false, error: 'Não foi possível carregar o painel.' }))
      }
    }
    void run()
    return () => { alive = false }
  }, [reload])

  const openMember = useCallback(async (subId: string) => {
    setOpening(subId)
    try {
      const res = await api.get(`/club-subscriptions/${subId}`)
      setMember(res.data?.data as MemberSub)
    } catch (err) {
      console.error('[club-painel] falha ao abrir membro', err)
    } finally {
      setOpening(null)
    }
  }, [])

  useEffect(() => {
    if (!sheet) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSheet(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sheet])

  const { data, loading, error } = state
  if (loading && !data) return <Skeleton />
  if (!data) {
    return (
      <div className="cp">
        <style>{CSS}</style>
        <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <AlertCircle size={20} color={D.amber} />
          <span style={{ flex: 1 }}>{error ?? 'Painel indisponível.'}</span>
          <button className="btn" onClick={() => setReload((n) => n + 1)}>Tentar de novo</button>
        </div>
      </div>
    )
  }

  const dono = data.dinheiro !== null
  const m = (n: number) => (hide ? HIDDEN : brl(n))
  const { y: ano, m: mes, d: diaHoje } = ymd(data.hoje)
  const diasNoMes = new Date(Date.UTC(ano, mes, 0)).getUTCDate()

  return (
    <div className="cp">
      <style>{CSS}</style>

      <div className="head">
        <h3>Visão do clube<small>{MONTHS[mes - 1]} · hoje {ddmm(data.hoje)}</small></h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="ghost" aria-label="Atualizar" onClick={() => setReload((n) => n + 1)}><RefreshCw size={17} /></button>
          {dono && (
            <button className="ghost" aria-pressed={hide} aria-label={hide ? 'Mostrar valores' : 'Ocultar valores'} onClick={() => writeHide(!hide)}>
              {hide ? <EyeOff size={18} /> : <Eye size={18} />}<span className="t">{hide ? 'Mostrar' : 'Ocultar'}</span>
            </button>
          )}
        </div>
      </div>

      {data.role === 'RECEPTION' ? (
        <>
          <AtencaoCard data={data} money={m} dono={false} opening={opening} onOpen={openMember} onOpenMembers={onOpenMembers} verTodos={verTodos} setVerTodos={setVerTodos} />
          <div className="card mt" style={{ display: 'flex', gap: 10, alignItems: 'center', color: D.ink2, fontSize: 13 }}>
            <Lock size={17} color={D.ink3} />Recebíveis, saldo e pote ficam com o dono do estabelecimento.
          </div>
        </>
      ) : (
        <>
          <Kpis data={data} money={m} />
          <Strip data={data} hide={hide} onDay={(date) => setSheet({ kind: 'day', date })} onMonth={() => setSheet({ kind: 'month', ym: data.hoje.slice(0, 7) })} money={m} />
          <div className="cols mt">
            <div className="stack">
              <Chart data={data} hide={hide} />
              <UsoCard data={data} />
            </div>
            <div className="stack side">
              <AtencaoCard data={data} money={m} dono={dono} opening={opening} onOpen={openMember} onOpenMembers={onOpenMembers} verTodos={verTodos} setVerTodos={setVerTodos} />
              {data.dinheiro && (
                <div className="card">
                  <div className="lbl">Pote da equipe · {MONTHS[mes - 1]}</div>
                  <div className="disp num" style={{ fontSize: 26, fontWeight: 600, marginTop: 6 }}>{m(data.dinheiro.pote.total)}</div>
                  <div className="meter"><i style={{ width: `${Math.round((diaHoje / diasNoMes) * 100)}%` }} /></div>
                  <div style={{ color: D.ink3, fontSize: 12 }}>
                    dia {diaHoje} de {diasNoMes} · {data.dinheiro.pote.fichas} fichas · fecha em {diasNoMes}/{String(mes).padStart(2, '0')}
                    {data.dinheiro.pote.aCaminho > 0 && <> · {m(data.dinheiro.pote.aCaminho)} ainda a caminho</>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* @eligi:club-painel-folha-body */}
      {sheet && createPortal(
        <div className="cp-scrim" onClick={(e) => { if (e.target === e.currentTarget) setSheet(null) }}>
          <div className={`cp-sheet ${sheet.kind === 'month' ? 'big' : ''}`} role="dialog" aria-modal="true" aria-label={sheet.kind === 'day' ? 'Detalhes do dia' : 'Calendário do mês'}>
            <button className="x" aria-label="Fechar" onClick={() => setSheet(null)}><X size={18} /></button>
            {sheet.kind === 'day'
              ? <DayView data={data} date={sheet.date} money={m} hide={hide} />
              : <MonthView data={data} ym={sheet.ym} hide={hide} onYm={(ym) => setSheet({ kind: 'month', ym })} onDay={(date) => setSheet({ kind: 'day', date })} />}
          </div>
        </div>,
        document.body,
      )} {/* @eligi:club-painel-portal-fim */}

      {member && (
        <ClubMemberDetailModal
          initialSub={member}
          isMobile={isMobile}
          onUpdated={() => setReload((n) => n + 1)}
          onClose={() => { setMember(null); setReload((n) => n + 1) }}
        />
      )}
    </div>
  )
}

// ── blocos ───────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="cp" aria-busy="true" aria-label="Carregando painel">
      <style>{CSS}</style>
      <div className="sk" style={{ height: 44, width: 180, marginBottom: 12 }} />
      <div className="kpis">{[0, 1, 2, 3].map((i) => <div key={i} className="sk" style={{ height: 96 }} />)}</div>
      <div className="sk mt" style={{ height: 150 }} />
      <div className="sk mt" style={{ height: 220 }} />
    </div>
  )
}

function Kpis({ data, money }: { data: Painel; money: (n: number) => string }) {
  const d = data.dinheiro
  const mb = data.membros
  const vencidos = data.atencao.filter((a) => a.kind !== 'AGUARDANDO_PAGAMENTO').length
  if (d) {
    const prox = data.dias.find((x) => (x.cai ?? 0) > 0)
    return (
      <div className="kpis">
        <div className="card hero">
          <div className="lbl">Cai em 7 dias</div>
          <div className="kv num">{money(d.cai7)}</div>
          <div className="kh">{prox ? `${relDay(prox.date, data.hoje).toLowerCase()} ${money(prox.cai ?? 0)}` : 'nada previsto'}</div>
        </div>
        <div className="card">
          <div className="lbl">Disponível agora</div>
          <div className="kv num">{d.saldo === null ? '—' : money(d.saldo)}</div>
          <div className="kh">{d.saldo === null ? 'saldo indisponível agora' : 'saldo no Asaas'}</div>
        </div>
        <div className="card">
          <div className="lbl">Cai em 30 dias</div>
          <div className="kv num">{money(d.cai30)}</div>
          <div className="kh">já pago · líquido</div>
        </div>
        <div className="card">
          <div className="lbl">Membros ativos</div>
          <div className="kv num">{mb?.ativos ?? 0}</div>
          <div className="kh">{money(d.mrr)}/mês{mb ? ` · +${mb.novosMes} · ${mb.canceladosMes} saiu` : ''}</div>
        </div>
      </div>
    )
  }
  return (
    <div className="kpis">
      <div className="card"><div className="lbl">Membros ativos</div><div className="kv num">{mb?.ativos ?? 0}</div><div className="kh">+{mb?.novosMes ?? 0} este mês · {mb?.canceladosMes ?? 0} saiu</div></div>
      <div className="card"><div className="lbl">Renovam em 7 dias</div><div className="kv num">{mb?.renovam7 ?? 0}</div><div className="kh">membros</div></div>
      <div className="card"><div className="lbl">Vencidos</div><div className="kv num">{vencidos}</div><div className="kh">precisam de cobrança</div></div>
      <div className="card"><div className="lbl">No limite</div><div className="kv num">{data.noLimite}</div><div className="kh">membros este mês</div></div>
    </div>
  )
}

function Strip({ data, hide, onDay, onMonth, money }: {
  data: Painel; hide: boolean; onDay: (d: string) => void; onMonth: () => void; money: (n: number) => string
}) {
  const dono = data.dinheiro !== null
  const dias = data.dias.slice(0, 14)
  return (
    <div className="card mt">
      <div className="sec">
        <span className="lbl">{dono ? 'Quanto cai · próximos 14 dias' : 'Renovações · próximos 14 dias'}</span>
        <button className="ghost" onClick={onMonth} style={{ minHeight: 40 }}><CalendarDays size={16} />Ver mês</button>
      </div>
      <div className="strip">
        {dias.map((d, i) => {
          const cai = d.cai ?? 0
          const w = i === 0 ? 'hoje' : i === 1 ? 'amanhã' : WD[weekday(d.date)]
          return (
            <button key={d.date} className={`sday ${dono && cai > 0 ? 'on' : ''}`} onClick={() => onDay(d.date)}
              aria-label={`${relDay(d.date, data.hoje)}: ${dono ? (hide ? 'valor oculto' : brl(cai)) : `${d.renovaCount} renovações`}`}>
              <div className="w">{w}</div>
              <div className="d">{ymd(d.date).d}</div>
              {dono
                ? <div className="c num" style={{ color: cai > 0 ? D.green : D.ink3 }}>{cai > 0 ? (hide ? '••••' : brlK(cai)) : '—'}</div>
                : <div className="c num">{d.renovaCount || '—'}</div>}
              <div className="k">{d.renovaCount > 0 ? `${dono ? `${d.renovaCount} ` : ''}renova${d.renovaCount > 1 ? 'm' : ''}` : ' '}</div>
            </button>
          )
        })}
      </div>
      {data.dinheiro && data.dinheiro.processando.count > 0 && (
        <div className="note"><span className="dot" style={{ background: D.amber }} />
          {money(data.dinheiro.processando.total)} em processamento · {data.dinheiro.processando.count} pagamento{data.dinheiro.processando.count > 1 ? 's' : ''} ainda sem data de liberação
        </div>
      )}
      {data.dinheiro && data.dinheiro.antecipando.count > 0 && (
        <div className="note"><span className="dot" style={{ background: D.blue }} />
          {money(data.dinheiro.antecipando.total)} em antecipação · cai em até 2 dias úteis
        </div>
      )}
    </div>
  )
}

function Chart({ data, hide }: { data: Painel; hide: boolean }) {
  const dono = data.dinheiro !== null
  const rows = data.dias.slice(0, 30).map((d) => ({
    label: ddmm(d.date), cai: d.cai ?? 0, renova: dono ? (d.renova ?? 0) : d.renovaCount,
  }))
  return (
    <div className="card">
      <div className="sec">
        <span className="lbl">Próximos 30 dias</span>
        <span className="legend">
          {dono && <span><i className="sw" style={{ background: D.greenBar }} />cai</span>}
          <span><i className="sw" style={{ border: `1.5px dashed ${D.ink3}` }} />{dono ? 'renova' : 'renovações'}</span>
        </span>
      </div>
      <div style={{ height: 150 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 4, right: 0, left: 0, bottom: 0 }} barGap={2}>
            <XAxis dataKey="label" interval={6} tick={{ fill: D.ink3, fontSize: 11 }} axisLine={false} tickLine={false} padding={{ left: 14, right: 4 }} />
            {!hide && (
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ background: D.card2, border: `1px solid ${D.line}`, borderRadius: 10, color: D.ink, fontSize: 12 }}
                labelStyle={{ color: D.ink3 }}
                formatter={(value, name) => {
                  const v = typeof value === 'number' ? value : 0
                  if (!dono) return [`${v}`, 'renovações']
                  return [brl(v), name === 'cai' ? 'cai' : 'renova']
                }}
              />
            )}
            <Bar dataKey="renova" fill="transparent" stroke={D.ink3} strokeDasharray="3 2" radius={[3, 3, 0, 0]} isAnimationActive={false} />
            {dono && <Bar dataKey="cai" fill={D.greenBar} radius={[3, 3, 0, 0]} isAnimationActive={false} />}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function UsoCard({ data }: { data: Painel }) {
  if (data.usoPlanos.length === 0) return null
  return (
    <div className="card">
      <div className="sec"><span className="lbl">Uso dos planos · este mês</span></div>
      {data.usoPlanos.map((u) => (
        <div key={u.planId} className="row">
          <span className="bar" style={{ background: u.cor ?? D.ink3 }} />
          <div className="rt">
            <b>{u.nome}</b>
            <span>
              {u.limiteTexto ?? 'sem limite'} · {u.usosPorMembro.toLocaleString('pt-BR')} por membro
              {u.noLimite > 0 && ` · ${u.noLimite} no limite`}
              {u.sinal === 'ALTO' && ' · apertado'}
              {u.sinal === 'BAIXO' && ' · folgado'}
            </span>
          </div>
          <div className="num" style={{ textAlign: 'right' }}>
            <b style={{ fontSize: 16 }}>{u.membros}</b>
            <div style={{ color: D.ink3, fontSize: 12 }}>membros</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function AtencaoCard({ data, money, dono, opening, onOpen, onOpenMembers, verTodos, setVerTodos }: {
  data: Painel; money: (n: number) => string; dono: boolean; opening: string | null
  onOpen: (subId: string) => void; onOpenMembers: () => void; verTodos: boolean; setVerTodos: (v: boolean) => void
}) {
  const total = data.atencao.length + (data.noLimite > 0 ? 1 : 0)
  const lista = verTodos ? data.atencao : data.atencao.slice(0, 5)
  return (
    <div className="card">
      <div className="sec">
        <span className="lbl">Precisa de você</span>
        {total > 0 && <span className="count">{total}</span>}
      </div>
      {total === 0 && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: D.ink2, fontSize: 13 }}>
          <CheckCircle2 size={18} color={D.green} />Nada pendente. Todo mundo em dia.
        </div>
      )}
      {lista.map((a, i) => {
        const cfg = ATENCAO[a.kind]
        return (
          <div key={a.subId} className="row">
            <span className="bar" style={{ background: cfg.color }} />
            <div className="rt">
              <b>{a.clientName}{dono && a.valor !== null ? ` · ${money(a.valor)}` : ''}</b>
              <span>{a.planName} · {cfg.text(a)}</span>
            </div>
            <button className={`btn ${i === 0 ? 'p' : ''}`} disabled={opening === a.subId} onClick={() => onOpen(a.subId)}>
              {opening === a.subId ? 'Abrindo…' : cfg.cta}
            </button>
          </div>
        )
      })}
      {!verTodos && data.atencao.length > 5 && (
        <button className="btn" style={{ width: '100%', marginTop: 10 }} onClick={() => setVerTodos(true)}>
          Ver mais {data.atencao.length - 5}
        </button>
      )}
      {data.noLimite > 0 && (
        <div className="row">
          <span className="bar" style={{ background: D.blue }} />
          <div className="rt">
            <b>{data.noLimite} {data.noLimite > 1 ? 'membros' : 'membro'} no limite</b>
            <span>O próximo atendimento é cobrado no preço normal</span>
          </div>
          <button className="btn" onClick={onOpenMembers}>Ver</button>
        </div>
      )}
    </div>
  )
}

function Avatar({ name }: { name: string }) {
  return <span className="av" style={{ background: hue(name) }}>{(name || '?').slice(0, 1).toUpperCase()}</span>
}

function DayView({ data, date, money, hide }: { data: Painel; date: string; money: (n: number) => string; hide: boolean }) {
  const dono = data.dinheiro !== null
  const cai = data.recebiveis.filter((r) => r.bucket === 'DIA' && r.date === date)
  const ren = data.renovacoes.filter((r) => r.date === date)
  const { m, d } = ymd(date)
  return (
    <>
      <div className="lbl">{WD[weekday(date)]} · {d} de {MONTHS[m - 1]}</div>
      <h4>{relDay(date, data.hoje)}</h4>
      {dono && cai.length > 0 && (
        <>
          <div className="ss"><span className="lbl">Cai na conta</span><b className="num">{money(cai.reduce((a, r) => a + r.liquido, 0))}</b></div>
          {cai.map((r) => (
            <div key={r.id} className="row">
              <Avatar name={r.clientName} />
              <div className="rt">
                <b>{r.clientName}</b>
                <span>{r.planName} · pago {ddmm(r.paidAt.slice(0, 10))}{r.tipo && <span className="chip">{TIPO[r.tipo] ?? r.tipo}</span>}</span>
              </div>
              <div className="val">{money(r.liquido)}<small>{r.taxa === null ? 'taxa a confirmar' : `taxa ${hide ? '••' : brl(r.taxa)}`}</small></div>
            </div>
          ))}
        </>
      )}
      {ren.length > 0 && (
        <>
          <div className="ss">
            <span className="lbl">Renova (previsão)</span>
            {dono ? <b className="num" style={{ color: D.ink2 }}>{money(ren.reduce((a, r) => a + (r.valor ?? 0), 0))}</b> : <b>{ren.length}</b>}
          </div>
          {ren.map((r) => (
            <div key={r.subId} className="row">
              <Avatar name={r.clientName} />
              <div className="rt">
                <b>{r.clientName}</b>
                <span>{r.planName} · {r.manual ? 'manual · cobrar no balcão' : 'cartão, cobra sozinho'}</span>
              </div>
              {dono && r.valor !== null && <div className="val" style={{ color: D.ink2 }}>{money(r.valor)}<small>bruto</small></div>}
            </div>
          ))}
        </>
      )}
      {(!dono || cai.length === 0) && ren.length === 0 && (
        <p style={{ color: D.ink3, marginTop: 16 }}>{dono ? 'Nada cai nem renova neste dia.' : 'Nenhuma renovação neste dia.'}</p>
      )}
      {ren.some((r) => !r.manual) && (
        <p style={{ color: D.ink3, fontSize: 12, marginTop: 14 }}>
          Renovação no cartão aprovada cai na conta cerca de 32 dias depois no crédito, ou 3 dias no débito.
        </p>
      )}
    </>
  )
}

function MonthView({ data, ym, hide, onYm, onDay }: {
  data: Painel; ym: string; hide: boolean; onYm: (ym: string) => void; onDay: (d: string) => void
}) {
  const dono = data.dinheiro !== null
  const [y, mo] = ym.split('-').map(Number)
  const first = new Date(Date.UTC(y, mo - 1, 1)).getUTCDay()
  const n = new Date(Date.UTC(y, mo, 0)).getUTCDate()
  const byDate = new Map(data.dias.map((d) => [d.date, d]))
  const ultimo = data.dias[data.dias.length - 1]?.date ?? data.hoje
  const prevYm = mo === 1 ? `${y - 1}-12` : `${y}-${String(mo - 1).padStart(2, '0')}`
  const nextYm = mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, '0')}`
  const noMes = data.dias.filter((d) => d.date.startsWith(ym))
  const total = dono ? noMes.reduce((a, d) => a + (d.cai ?? 0), 0) : noMes.reduce((a, d) => a + d.renovaCount, 0)
  return (
    <>
      <div className="lbl">{dono ? 'Calendário de recebíveis' : 'Calendário de renovações'}</div>
      <h4>{dono ? `Ainda cai em ${MONTHS[mo - 1]}: ${hide ? HIDDEN : brl(total)}` : `${total} renovações em ${MONTHS[mo - 1]}`}</h4>
      <div className="nav">
        <button aria-label="Mês anterior" disabled={prevYm < data.hoje.slice(0, 7)} onClick={() => onYm(prevYm)}><ChevronLeft size={18} /></button>
        <b className="disp" style={{ fontSize: 16 }}>{MONTHS[mo - 1][0].toUpperCase()}{MONTHS[mo - 1].slice(1)} {y}</b>
        <button aria-label="Próximo mês" disabled={nextYm > ultimo.slice(0, 7)} onClick={() => onYm(nextYm)}><ChevronRight size={18} /></button>
      </div>
      <div className="cal">
        {WD.map((w) => <div key={w} className="wd">{w[0].toUpperCase()}</div>)}
        {Array.from({ length: first }, (_, i) => <div key={`v${i}`} />)}
        {Array.from({ length: n }, (_, i) => {
          const date = `${ym}-${String(i + 1).padStart(2, '0')}`
          const d = byDate.get(date)
          const cai = d?.cai ?? 0
          const v = dono ? (cai > 0 ? (hide ? '••' : brlK(cai).replace('R$ ', '')) : '') : (d && d.renovaCount > 0 ? String(d.renovaCount) : '')
          return (
            <button key={date} className={`cd ${date === data.hoje ? 'today' : ''} ${dono && cai > 0 ? 'on' : ''}`} disabled={!d} onClick={() => onDay(date)}
              aria-label={`${i + 1} de ${MONTHS[mo - 1]}`}>
              <span className="d">{i + 1}</span>
              <span className="c num" style={dono ? undefined : { color: D.ink }}>{v}</span>
            </button>
          )
        })}
      </div>
      <p style={{ color: D.ink3, fontSize: 12, marginTop: 12 }}>
        {dono ? 'Verde: cobrança já paga, esperando liberação. Toque no dia para ver quem.' : 'Número de renovações previstas por dia.'}
      </p>
    </>
  )
}
