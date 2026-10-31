'use client'
// src/app/dashboard/financeiro/page.tsx
// @eligi:fin-hub-page — painel do Financeiro, direcao A + "Precisa de voce" da C (out/2026).
//
// Topo: o que sobrou no mes (entradas - saidas, consolidado do fluxo de caixa).
// Depois: o que pede acao (comissoes a pagar) e os modulos com numero do mes.
// Mesma linguagem da tela de Despesas: botao principal preto, vermelho fora da tela,
// layout por @media (sem isMobile em JS). Notas de credito segue bloqueada
// (decisao do Eli: sem listagem no back ainda).

import { useRef, useState } from 'react'
import Link from 'next/link'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import {
  ArrowRight, ChevronLeft, ChevronRight, Coins, Lock, Plus, ReceiptText, ShoppingCart, TrendingDown,
} from 'lucide-react'
import { useExpenses, useMonthTotal } from '@/features/expenses/hooks/useExpenses'
import type { CreateExpensePayload } from '@/features/expenses/types'
import { useFinanceHub } from '@/features/finance-hub/useFinanceHub'
import QuickExpense from '@/features/finance-hub/QuickExpense'

dayjs.locale('pt-br')

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function splitBRL(v: number): [string, string] {
  const s = BRL.format(v)
  const i = s.lastIndexOf(',')
  return i < 0 ? [s, ''] : [s.slice(0, i), s.slice(i)]
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}

export default function FinanceiroPage() {
  // ── mes ────────────────────────────────────────────────────────────────
  // relogio lido so na montagem (render puro para o React Compiler)
  const [currentMonth] = useState(() => dayjs().format('YYYY-MM'))
  const [month, setMonth] = useState(currentMonth)
  const isCurrent = month >= currentMonth
  const prevMonth = dayjs(`${month}-01`).subtract(1, 'month').format('YYYY-MM')
  const monthRaw = dayjs(`${month}-01`).format('MMMM [de] YYYY')
  const monthLabel = monthRaw.charAt(0).toUpperCase() + monthRaw.slice(1)
  const monthName = dayjs(`${month}-01`).format('MMMM')

  // ── dados ──────────────────────────────────────────────────────────────
  const hub = useFinanceHub(month)
  const exp = useExpenses(month)
  const prevExpTotal = useMonthTotal(prevMonth)
  const data = hub.data

  const expDelta = !exp.loading && !exp.error && prevExpTotal != null && prevExpTotal > 0
    ? (exp.kpis.total - prevExpTotal) / prevExpTotal
    : null

  // ── nova despesa ───────────────────────────────────────────────────────
  const [quickOpen, setQuickOpen] = useState(false)
  const [quickSeq, setQuickSeq] = useState(0)
  async function handleSaveExpense(payload: CreateExpensePayload) {
    await exp.create(payload)
    hub.refetch() // saida nova muda o resultado do mes
    showToast('Despesa adicionada')
  }

  // ── toast ──────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  function showToast(msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(msg)
    toastTimer.current = setTimeout(() => setToast(null), 2800)
  }

  const result = data?.result ?? null
  const [whole, cents] = splitBRL(result?.saldo ?? 0)
  const semMovimento = result != null && result.entradas === 0 && result.saidas === 0
  const toPay = data?.toPay ?? null

  return (
    <div className="fh">
      <style>{CSS}</style>

      {/* ── cabecalho ─────────────────────────────────────────────────── */}
      <header className="fh-head">
        <div style={{ minWidth: 0 }}>
          <h1 className="fh-h1">Financeiro</h1>
          <div className="fh-month">
            <button type="button" className="fh-mbtn" aria-label="Mês anterior"
              onClick={() => setMonth(prevMonth)}><ChevronLeft size={17} /></button>
            <div className="fh-mlbl" aria-live="polite">{monthLabel}</div>
            <button type="button" className="fh-mbtn" aria-label="Próximo mês" disabled={isCurrent}
              onClick={() => setMonth(dayjs(`${month}-01`).add(1, 'month').format('YYYY-MM'))}><ChevronRight size={17} /></button>
          </div>
        </div>
        <button type="button" className="fh-new" aria-label="Nova despesa"
          onClick={() => { setQuickSeq(s => s + 1); setQuickOpen(true) }}>
          <Plus size={18} /><span className="fh-newl">Nova despesa</span>
        </button>
      </header>

      {/* ── resultado do mes ──────────────────────────────────────────── */}
      {hub.loading ? (
        <div className="fh-hero" aria-busy="true">
          <div className="fh-skel" style={{ width: 160, height: 12 }} />
          <div className="fh-skel" style={{ width: 230, height: 46, marginTop: 14 }} />
          <div className="fh-skel" style={{ width: '100%', height: 10, marginTop: 22 }} />
        </div>
      ) : result == null ? (
        <div className="fh-hero fh-state">
          <div className="fh-st">Não foi possível carregar o resultado do mês.</div>
          <button type="button" className="fh-ghost" onClick={hub.refetch}>Tentar de novo</button>
        </div>
      ) : (
        <Link href="/dashboard/relatorios" className="fh-hero fh-hero-link">
          <div className="fh-hero-main">
            <div className="fh-eyerow">
              <div className="fh-eyebrow">SOBROU EM {monthName.toUpperCase()}</div>
              {result.parcial && <div className="fh-chip">Parcial</div>}
            </div>
            <div className="fh-total"><span className="fh-total-w">{whole}</span><span className="fh-cents">{cents}</span></div>
            {semMovimento ? (
              <div className="fh-note">Nenhuma entrada ou saída em {monthName}.</div>
            ) : result.saldo >= 0 ? (
              <div className="fh-note is-ok">Margem de {Math.round(result.margem)}%</div>
            ) : (
              <div className="fh-note is-warn">Saiu mais do que entrou neste mês</div>
            )}
          </div>
          <div className="fh-hero-side">
            {!semMovimento && (
              <div className="fh-bar" aria-hidden="true">
                <div className="fh-bar-in" style={{ flexGrow: Math.max(result.entradas, 0) }} />
                <div className="fh-bar-out" style={{ flexGrow: Math.max(result.saidas, 0) }} />
              </div>
            )}
            <div className="fh-io">
              <div>
                <div className="fh-io-l"><i className="fh-dot is-in" />Entradas</div>
                <div className="fh-io-v">{BRL.format(result.entradas)}</div>
              </div>
              <div>
                <div className="fh-io-l"><i className="fh-dot is-out" />Saídas</div>
                <div className="fh-io-v">{BRL.format(result.saidas)}</div>
              </div>
            </div>
            <div className="fh-more">Ver relatórios <ArrowRight size={14} /></div>
          </div>
        </Link>
      )}

      {/* ── precisa de voce ───────────────────────────────────────────── */}
      {toPay != null && toPay.total > 0 && (
        <section className="fh-sec">
          <h2 className="fh-lbl">Precisa de você</h2>
          <div className="fh-alert">
            <div className="fh-alert-tx">
              <div className="fh-alert-t">Comissões a pagar</div>
              <div className="fh-alert-s">
                <strong className="fh-num">{BRL.format(toPay.total)}</strong> para {plural(toPay.profs, 'profissional', 'profissionais')}
              </div>
            </div>
            <Link href="/dashboard/financeiro/comissoes" className="fh-dark">Revisar e pagar</Link>
          </div>
        </section>
      )}

      {/* ── modulos ───────────────────────────────────────────────────── */}
      <section className="fh-sec">
        <h2 className="fh-lbl">Módulos</h2>
        <div className="fh-mods">
          <Link href="/dashboard/financeiro/vendas" className="fh-mod">
            <div className="fh-ico"><ShoppingCart size={19} /></div>
            <div className="fh-mt">
              <div className="fh-mn">Vendas</div>
              {hub.loading ? <div className="fh-skel" style={{ width: 120, height: 11, marginTop: 4 }} />
                : data?.sales ? <div className="fh-ms">{plural(data.sales.count, 'venda', 'vendas')} · ticket {BRL.format(data.sales.ticket)}</div>
                : <div className="fh-ms">Não carregou</div>}
            </div>
            <div className="fh-mv">{hub.loading ? <div className="fh-skel" style={{ width: 84, height: 16 }} /> : data?.sales ? BRL.format(data.sales.gross) : '—'}</div>
            <ChevronRight className="fh-chev" size={16} aria-hidden="true" />
          </Link>

          <Link href="/dashboard/financeiro/despesas" className="fh-mod">
            <div className="fh-ico"><TrendingDown size={19} /></div>
            <div className="fh-mt">
              <div className="fh-mn">Despesas</div>
              {exp.loading ? <div className="fh-skel" style={{ width: 110, height: 11, marginTop: 4 }} />
                : exp.error ? <div className="fh-ms">Não carregou</div>
                : expDelta != null ? (
                  <div className={`fh-ms ${expDelta > 0 ? 'is-warn' : 'is-ok'}`}>
                    {expDelta > 0 ? '▲' : '▼'} {Math.abs(Math.round(expDelta * 100))}% vs {dayjs(`${prevMonth}-01`).format('MMM')}
                  </div>
                ) : <div className="fh-ms">Custos do negócio</div>}
            </div>
            <div className="fh-mv">{exp.loading ? <div className="fh-skel" style={{ width: 84, height: 16 }} /> : exp.error ? '—' : BRL.format(exp.kpis.total)}</div>
            <ChevronRight className="fh-chev" size={16} aria-hidden="true" />
          </Link>

          <Link href="/dashboard/financeiro/comissoes" className="fh-mod">
            <div className="fh-ico"><Coins size={19} /></div>
            <div className="fh-mt">
              <div className="fh-mn">Comissões</div>
              {hub.loading ? <div className="fh-skel" style={{ width: 120, height: 11, marginTop: 4 }} />
                : toPay != null && toPay.total > 0 ? <div className="fh-ms is-warn">{BRL.format(toPay.total)} a pagar</div>
                : data?.paid ? <div className={`fh-ms ${toPay != null ? 'is-ok' : ''}`}>{toPay != null ? 'Nada a pagar · ' : ''}{plural(data.paid.count, 'paga', 'pagas')} no mês</div>
                : <div className="fh-ms">Não carregou</div>}
            </div>
            <div className="fh-mv">{hub.loading ? <div className="fh-skel" style={{ width: 84, height: 16 }} /> : data?.paid ? BRL.format(data.paid.total) : '—'}</div>
            <ChevronRight className="fh-chev" size={16} aria-hidden="true" />
          </Link>

          <div className="fh-mod is-locked" aria-disabled="true">
            <div className="fh-ico"><ReceiptText size={19} /></div>
            <div className="fh-mt">
              <div className="fh-mn">Notas de crédito <Lock size={12} aria-hidden="true" /></div>
              <div className="fh-ms">Anulações e reembolsos</div>
            </div>
            <div className="fh-mv"><div className="fh-chip">Em breve</div></div>
          </div>
        </div>
      </section>

      {quickOpen && (
        <QuickExpense
          key={quickSeq}
          onSave={handleSaveExpense}
          onClose={() => setQuickOpen(false)}
        />
      )}

      {toast && <div className="fh-toast" role="status">{toast}</div>}
    </div>
  )
}

// Cores: mesmas da tela de Despesas (grafite #111114, verde-tinta #0f6e56, ambar #b45309).
// Todo texto leva classe propria: o globals.css pinta `main span/p` de cinza.
const CSS = `
.fh{max-width:1080px;margin:0 auto;padding:4px 16px 96px;font-family:var(--font-sans);color:#111114;display:flex;flex-direction:column;gap:18px}
@media (min-width:720px){.fh{padding:8px 24px 64px;gap:22px}}
.fh-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
.fh-h1{font-family:var(--font-display);font-size:28px;font-weight:700;letter-spacing:-.04em;margin:0;color:#111114;line-height:1.1}
@media (min-width:720px){.fh-h1{font-size:32px}}
.fh-month{display:flex;align-items:center;gap:2px;margin-top:6px;margin-left:-8px}
.fh-mbtn{width:36px;height:36px;border-radius:10px;border:0;background:none;color:#4b4b52;display:grid;place-items:center;cursor:pointer}
.fh-mbtn:hover:not(:disabled){background:#ececf0}
.fh-mbtn:disabled{opacity:.35;cursor:not-allowed}
.fh-mlbl{min-height:36px;padding:0 6px;display:flex;align-items:center;font-size:14.5px;font-weight:600;color:#111114;white-space:nowrap}
.fh-new{min-height:44px;min-width:44px;padding:0 16px;border-radius:12px;border:0;background:#111114;color:#fff;font-family:inherit;font-size:14px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;gap:7px;cursor:pointer;flex-shrink:0}
.fh-new:hover{background:#26262c}
.fh-new .fh-newl{color:#fff}
@media (max-width:639px){.fh-new{width:44px;padding:0;border-radius:50%}.fh-newl{display:none}}
.fh-ghost{min-height:44px;padding:0 14px;border-radius:12px;border:1px solid rgba(17,17,20,.12);background:#fff;color:#111114;font-family:inherit;font-size:14px;font-weight:600;cursor:pointer}
.fh-ghost:hover{background:#f5f5f7}

.fh-hero{display:flex;flex-direction:column;gap:18px;background:#fff;border:1px solid rgba(17,17,20,.08);border-radius:20px;padding:20px;color:#111114;text-decoration:none}
.fh-hero-link{transition:border-color .15s ease}
.fh-hero-link:hover{border-color:rgba(17,17,20,.2)}
@media (min-width:960px){.fh-hero{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:40px;align-items:center;padding:28px 32px}}
.fh-hero-main{display:flex;flex-direction:column;gap:10px;min-width:0}
.fh-hero-side{display:flex;flex-direction:column;gap:14px;min-width:0}
.fh-eyerow{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.fh-eyebrow{font-family:var(--font-mono);font-size:11px;font-weight:600;letter-spacing:.1em;color:#6b6b74}
.fh-chip{display:inline-flex;align-items:center;font-size:11.5px;font-weight:600;color:#4b4b52;background:#f1f1f4;border-radius:999px;padding:3px 9px;white-space:nowrap}
.fh-total{font-family:var(--font-display);font-size:44px;font-weight:700;letter-spacing:-.05em;line-height:1.02;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
.fh-total .fh-total-w{color:#111114}
.fh-total .fh-cents{font-size:24px;color:#6b6b74;letter-spacing:-.03em}
@media (min-width:720px){.fh-total{font-size:60px}.fh-total .fh-cents{font-size:32px}}
.fh-note{font-size:13.5px;font-weight:600;color:#4b4b52}
.fh-note.is-ok{color:#0f6e56}
.fh-note.is-warn{color:#b45309}
.fh-bar{display:flex;height:10px;border-radius:999px;overflow:hidden;gap:2px;background:#f1f1f4}
.fh-bar-in{background:#16a34a;flex-basis:0}
.fh-bar-out{background:#c4c4cc;flex-basis:0}
.fh-io{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.fh-io-l{display:flex;align-items:center;gap:6px;font-size:12.5px;color:#6b6b74}
.fh-dot{width:8px;height:8px;border-radius:2px;display:inline-block}
.fh-dot.is-in{background:#16a34a}
.fh-dot.is-out{background:#c4c4cc}
.fh-io-v{font-family:var(--font-display);font-size:18px;font-weight:600;letter-spacing:-.02em;font-variant-numeric:tabular-nums;color:#111114;margin-top:2px}
@media (min-width:720px){.fh-io-v{font-size:22px}}
.fh-more{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:#4b4b52}

.fh-state{align-items:flex-start}
.fh-st{font-size:14.5px;font-weight:600;color:#111114}

.fh-sec{display:flex;flex-direction:column;gap:8px}
.fh-lbl{font-family:var(--font-mono);font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#6b6b74;margin:0;padding-left:4px}

.fh-alert{display:flex;align-items:center;gap:12px;background:#fffbeb;border:1px solid rgba(245,158,11,.35);border-radius:18px;padding:14px 16px;flex-wrap:wrap}
.fh-alert-tx{flex:1 1 200px;min-width:0;display:flex;flex-direction:column;gap:3px}
.fh-alert-t{font-size:15px;font-weight:600;color:#111114}
.fh-alert-s{font-size:13px;color:#92400e}
.fh-alert-s .fh-num{font-variant-numeric:tabular-nums;color:#92400e}
.fh-dark{min-height:44px;padding:0 16px;border-radius:12px;background:#111114;color:#fff;font-size:14px;font-weight:700;display:inline-flex;align-items:center;text-decoration:none;white-space:nowrap}
.fh-dark:hover{background:#26262c;color:#fff}

/* modulos: lista agrupada no celular, cartoes a partir de 720px */
.fh-mods{background:#fff;border:1px solid rgba(17,17,20,.08);border-radius:20px;overflow:hidden;display:flex;flex-direction:column}
.fh-mod{display:flex;align-items:center;gap:12px;padding:14px 16px;min-height:68px;color:#111114;text-decoration:none;border-bottom:1px solid rgba(17,17,20,.07)}
.fh-mod:last-child{border-bottom:0}
a.fh-mod:hover{background:#fafafb}
.fh-ico{width:40px;height:40px;border-radius:12px;background:#f1f1f4;color:#111114;display:grid;place-items:center;flex-shrink:0}
.fh-mt{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.fh-mn{display:flex;align-items:center;gap:6px;font-size:15px;font-weight:600;color:#111114}
.fh-ms{font-size:12.5px;color:#6b6b74;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-variant-numeric:tabular-nums}
.fh-ms.is-ok{color:#0f6e56}
.fh-ms.is-warn{color:#b45309}
.fh-mv{font-family:var(--font-display);font-size:16px;font-weight:600;letter-spacing:-.02em;font-variant-numeric:tabular-nums;color:#111114;white-space:nowrap;flex-shrink:0}
.fh-chev{color:#9a9aa3;flex-shrink:0}
.fh-mod.is-locked .fh-ico,.fh-mod.is-locked .fh-mn{opacity:.55}
@media (min-width:720px){
  .fh-mods{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;background:none;border:0;border-radius:0;overflow:visible}
  .fh-mod{display:grid;grid-template-columns:auto minmax(0,1fr);grid-template-areas:"ico ico" "mt mt" "mv mv";align-items:start;row-gap:12px;padding:20px;min-height:0;background:#fff;border:1px solid rgba(17,17,20,.08);border-radius:18px;transition:border-color .15s ease,transform .15s ease}
  .fh-mod:last-child{border-bottom:1px solid rgba(17,17,20,.08)}
  a.fh-mod:hover{background:#fff;border-color:rgba(17,17,20,.2);transform:translateY(-2px)}
  .fh-ico{grid-area:ico}
  .fh-mt{grid-area:mt}
  .fh-mv{grid-area:mv;font-size:24px;font-weight:700}
  .fh-chev{display:none}
  .fh-mn{font-size:16px}
}
@media (min-width:1100px){.fh-mods{grid-template-columns:repeat(4,minmax(0,1fr))}}

.fh-skel{background:linear-gradient(90deg,#ececf0 25%,#f5f5f7 50%,#ececf0 75%);background-size:200% 100%;animation:fh-sh 1.2s infinite;border-radius:8px;max-width:100%}
@keyframes fh-sh{from{background-position:200% 0}to{background-position:-200% 0}}
.fh-toast{position:fixed;left:50%;bottom:calc(var(--bottom-nav-h,0px) + 20px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:10010;background:#111114;color:#fff;padding:11px 18px;border-radius:12px;font-size:13.5px;font-weight:600;box-shadow:0 8px 24px rgba(17,17,20,.25);white-space:nowrap;animation:fh-toast .2s ease}
@keyframes fh-toast{from{opacity:0;transform:translate(-50%,8px)}}
@media (prefers-reduced-motion:reduce){.fh-skel,.fh-toast{animation:none}a.fh-mod:hover{transform:none}}
`
