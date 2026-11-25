'use client'
// src/app/dashboard/eligiclub/components/ClubHojeTab.tsx
// @eligi:club-hoje-tab — aba Painel do EligiClub, direcao A "Fila primeiro" (nov/2026).
//
// Substitui o painel escuro (ClubPainelTab). A tela abre em quem precisa pagar
// hoje: vence hoje (manual), atrasados e quem ainda nao fez o 1o pagamento. Cada
// linha tem Cobrar e WhatsApp; os dois abrem a mesma folha, que pede ao back o
// link (fatura em aberto no cartao, Pix avulso no manual) e a mensagem pronta.
//
// Dados: GET /club-subscriptions/cobrar (fila) e GET /club-subscriptions/painel
// (numeros, pagaram hoje, renovacoes). O back corta por papel; a tela decide
// pela AUSENCIA do dado (valor null = esconde).

import { useCallback, useEffect, useState, type ComponentProps } from 'react'
import { AlertCircle, Bell, Check, RefreshCw, Send } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import ClubMemberDetailModal from './ClubMemberDetailModal'
import CobrarSheet, { brl, chargeChip, type CobrarItem, type CobrarList } from './CobrarSheet' // @eligi:club-hoje-usa-sheet

// ── contrato (espelha club.cobrar.ts e club.painel.rules.ts do back) ─────────
interface PainelDia { date: string; renova: number | null; renovaCount: number }
interface PagoHoje { subId: string; clientName: string; planName: string; valor: number | null; forma: string; paidAt: string }
interface UsoPlano { planId: string; nome: string; membros: number; usosPorMembro: number; limiteTexto: string | null; sinal: 'ALTO' | 'BAIXO' | null }
interface Painel {
  role: 'OWNER' | 'MANAGER' | 'RECEPTION'
  hoje: string
  dinheiro: null | { saldo: number | null; cai7: number; cai30: number; mrr: number; pote: { total: number } }
  membros: null | { ativos: number; novosMes: number; canceladosMes: number; renovam7: number }
  dias: PainelDia[]
  usoPlanos: UsoPlano[]
  pagosHoje?: PagoHoje[]
}
type MemberSub = ComponentProps<typeof ClubMemberDetailModal>['initialSub']

// ── formatacao ───────────────────────────────────────────────────────────────
const WD = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
const ddmm = (s: string) => `${s.slice(8, 10)}/${s.slice(5, 7)}`
const addDays = (s: string, n: number) => new Date(new Date(`${s}T12:00:00Z`).getTime() + n * 86_400_000).toISOString().slice(0, 10)
function relDay(date: string, hoje: string): string {
  if (date === hoje) return 'hoje'
  if (date === addDays(hoje, 1)) return 'amanhã'
  return `${WD[new Date(`${date}T12:00:00Z`).getUTCDay()]} ${ddmm(date)}`
}
const hora = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
const iniciais = (n: string) => n.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('')

function comoPaga(i: CobrarItem): string {
  const forma = i.manual ? 'Manual' : 'Cartão'
  if (i.state === 'AGUARDANDO_1O') return `${forma} · assinatura nova`
  if (i.dueDay && i.state !== 'VENCE_HOJE') return `${forma} · venceu ${ddmm(i.dueDay)}`
  return forma
}

const CSS = `
.ch{display:flex;flex-direction:column;gap:16px;font-family:var(--font-sans);color:#111114}
.ch :where(span,div,b,p,small,strong){color:inherit}
.ch *{box-sizing:border-box}
.ch .num{font-family:var(--font-display);font-variant-numeric:tabular-nums;letter-spacing:-.03em;font-weight:600}
.ch .mono{font-family:var(--font-mono);font-size:11px;letter-spacing:.06em;text-transform:uppercase;font-weight:600;color:#5b5b63}
.ch .sub{font-size:13px;color:#5b5b63}
.ch .card{background:#fff;border:1px solid rgba(17,17,20,.08);border-radius:18px;box-shadow:0 1px 2px rgba(17,17,20,.04),0 6px 20px rgba(17,17,20,.04);min-width:0}
.ch .kpis{display:grid;gap:10px;grid-template-columns:repeat(2,minmax(0,1fr))}
@media(min-width:900px){.ch .kpis{grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}}
.ch .kpi{padding:14px 16px;display:flex;flex-direction:column;gap:4px}
@media(min-width:900px){.ch .kpi{padding:18px 20px}}
.ch .kv{font-size:22px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
@media(min-width:900px){.ch .kv{font-size:30px}}
.ch .grid{display:grid;gap:16px;grid-template-columns:minmax(0,1fr);align-items:start}
@media(min-width:1100px){.ch .grid{grid-template-columns:minmax(0,1fr) 320px}}
.ch .side{display:flex;flex-direction:column;gap:16px}
.ch .fh{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:16px 18px;border-bottom:1px solid rgba(17,17,20,.07)}
.ch .fh h2{margin:0;font-family:var(--font-display);font-size:20px;font-weight:600;letter-spacing:-.03em;display:flex;align-items:center;gap:10px}
.ch .row{display:grid;grid-template-columns:40px minmax(0,1fr) auto;grid-template-areas:"av who val" "chips chips chips" "act act act";gap:10px 12px;align-items:center;padding:14px 16px;border-bottom:1px solid rgba(17,17,20,.07)}
.ch .row:last-child{border-bottom:0}
@media(min-width:900px){.ch .row{grid-template-columns:40px minmax(0,1fr) 180px 104px auto;grid-template-areas:"av who chips val act";padding:14px 18px}}
.ch .av{grid-area:av;width:40px;height:40px;border-radius:999px;background:#f0f0f3;display:flex;align-items:center;justify-content:center;font:600 14px var(--font-sans);border:0;cursor:pointer}
.ch .who{grid-area:who;min-width:0;display:flex;flex-direction:column;gap:2px;text-align:left;background:none;border:0;padding:0;cursor:pointer;font:inherit}
.ch .who b{font-weight:600;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ch .chips{grid-area:chips;display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.ch .val{grid-area:val;font-size:16px;text-align:right}
.ch .act{grid-area:act;display:flex;gap:8px}
.ch .act .btn{flex:1}
@media(min-width:900px){.ch .act .btn{flex:none}}
.ch .chip{display:inline-flex;align-items:center;gap:5px;height:26px;padding:0 10px;border-radius:999px;font:600 12px var(--font-sans);white-space:nowrap}
.ch .c-hoje{background:#f0f0f3;color:#111114}
.ch .c-atraso{background:#fffbeb;color:#92400e;box-shadow:inset 0 0 0 1px #fde68a}
.ch .c-cartao{background:#fef2f2;color:#991b1b;box-shadow:inset 0 0 0 1px #fecaca}
.ch .c-aguarda{background:#eff6ff;color:#1e40af;box-shadow:inset 0 0 0 1px #bfdbfe}
.ch .c-ok{background:#ecfdf5;color:#0f6e56;box-shadow:inset 0 0 0 1px #a7f3d0}
.ch .app{display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:#0f6e56}
.ch .note{font-size:12px;color:#92400e}
.ch .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:0 16px;border-radius:12px;font:600 14px var(--font-sans);border:1px solid rgba(17,17,20,.12);background:#fff;color:#111114;cursor:pointer;text-decoration:none;-webkit-tap-highlight-color:transparent}
.ch .btn-ink{background:#111114;color:#fff;border-color:#111114}
.ch .btn:disabled{opacity:.55;cursor:default}
.ch .side .card{padding:16px 18px}
.ch .li{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid rgba(17,17,20,.07)}
.ch .li:last-child{border-bottom:0}
.ch .empty{padding:28px 18px;display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center}
`

// ── tela ─────────────────────────────────────────────────────────────────────
interface Loaded { fila: CobrarList | null; painel: Painel | null; error: string | null; loading: boolean }

export default function ClubHojeTab({ isMobile, onOpenMembers }: { isMobile: boolean; onOpenMembers: () => void }) {
  const [state, setState] = useState<Loaded>({ fila: null, painel: null, error: null, loading: true })
  const [reload, setReload] = useState(0)
  const [cobrando, setCobrando] = useState<CobrarItem | null>(null)
  const [member, setMember] = useState<MemberSub | null>(null)
  const [opening, setOpening] = useState<string | null>(null)
  const [verTodos, setVerTodos] = useState(false)

  useEffect(() => {
    let alive = true
    async function run() {
      const [f, p] = await Promise.allSettled([
        api.get('/club-subscriptions/cobrar'),
        api.get('/club-subscriptions/painel'),
      ])
      if (!alive) return
      const fila = f.status === 'fulfilled' ? (f.value.data?.data as CobrarList) : null
      const painel = p.status === 'fulfilled' ? (p.value.data?.data as Painel) : null
      if (f.status === 'rejected') console.error('[club-hoje] fila falhou', f.reason)
      if (p.status === 'rejected') console.error('[club-hoje] painel falhou', p.reason)
      setState({ fila, painel, loading: false, error: !fila && !painel ? 'Não foi possível carregar o EligiClub.' : null })
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
      console.error('[club-hoje] falha ao abrir membro', err)
    } finally {
      setOpening(null)
    }
  }, [])

  const closeSheet = useCallback(() => setCobrando(null), [])
  const refresh = useCallback(() => setReload((n) => n + 1), [])

  const { fila, painel, loading, error } = state
  if (loading && !fila && !painel) {
    return (
      <div className="ch" aria-busy="true">
        <style>{CSS}</style>
        <div className="kpis">{[0, 1, 2].map((k) => <div key={k} className="card kpi" style={{ height: 96 }} />)}</div>
        <div className="card" style={{ height: 320 }} />
      </div>
    )
  }
  if (error) {
    return (
      <div className="ch">
        <style>{CSS}</style>
        <div className="card empty">
          <AlertCircle size={22} color="#92400e" />
          <div style={{ fontWeight: 600 }}>{error}</div>
          <button className="btn" onClick={refresh}>Tentar de novo</button>
        </div>
      </div>
    )
  }

  const itens = fila?.items ?? []
  const visiveis = verTodos || isMobile === false ? itens : itens.slice(0, 4)
  const dinheiro = painel?.dinheiro ?? null
  const membros = painel?.membros ?? null
  const hoje = painel?.hoje ?? ''
  const renovam = (painel?.dias ?? []).filter((d) => d.date !== hoje && d.renovaCount > 0).slice(0, 5)
  const pagos = painel?.pagosHoje ?? []
  const resumo = fila ? [
    fila.totals.hoje ? `${fila.totals.hoje} ${fila.totals.hoje === 1 ? 'vence' : 'vencem'} hoje` : null,
    fila.totals.atrasados ? `${fila.totals.atrasados} ${fila.totals.atrasados === 1 ? 'atrasado' : 'atrasados'}` : null,
    fila.totals.aguardando ? `${fila.totals.aguardando} sem o 1º pagamento` : null,
  ].filter(Boolean).join(' · ') : ''

  return (
    <div className="ch">
      <style>{CSS}</style>

      {(membros || dinheiro) && (
        <div className="kpis">
          {membros && (
            <div className="card kpi">
              <div className="mono">Membros ativos</div>
              <div className="num kv">{membros.ativos}</div>
              <div className="sub">{membros.novosMes > 0 ? `+${membros.novosMes} este mês` : 'nenhum novo este mês'}</div>
            </div>
          )}
          {dinheiro && (
            <div className="card kpi">
              <div className="mono">Recorrente por mês</div>
              <div className="num kv">{brl(dinheiro.mrr)}</div>
              <div className="sub">membros em dia</div>
            </div>
          )}
          {dinheiro && (
            <div className="card kpi">
              <div className="mono">Cai na conta em 7 dias</div>
              <div className="num kv" style={{ color: '#0f6e56' }}>{brl(dinheiro.cai7)}</div>
              <div className="sub">já pago, esperando liberar</div>
            </div>
          )}
        </div>
      )}

      <div className="grid">
        <section className="card" aria-labelledby="ch-fila" style={{ overflow: 'hidden' }}>
          <div className="fh">
            <h2 id="ch-fila">Precisa de você hoje{itens.length > 0 && <span className="chip c-hoje">{itens.length}</span>}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {resumo && <span className="sub">{resumo}</span>}
              <button className="btn" style={{ minWidth: 44, padding: 0 }} aria-label="Atualizar" onClick={refresh}><RefreshCw size={17} /></button>
            </div>
          </div>

          {!fila && <div className="empty"><span className="sub">A lista de cobrança não carregou agora.</span><button className="btn" onClick={refresh}>Tentar de novo</button></div>}

          {fila && itens.length === 0 && (
            <div className="empty">
              <span className="chip c-ok"><Check size={14} />Tudo em dia</span>
              <span className="sub">Ninguém vence hoje nem está atrasado.</span>
            </div>
          )}

          {visiveis.map((i) => {
            const chip = chargeChip(i)
            const nota = i.cpfMissing && fila?.canPix
              ? 'Sem CPF: vai só a mensagem'
              : i.lastCharge ? `Cobrado ${hora(i.lastCharge.at)}` : null
            return (
              <div key={i.subId} className="row">
                <button className="av" aria-label={`Abrir ${i.clientName}`} disabled={opening === i.subId} onClick={() => void openMember(i.subId)}>{iniciais(i.clientName)}</button>
                <button className="who" onClick={() => void openMember(i.subId)}>
                  <b>{i.clientName}</b>
                  <span className="sub">{i.planName} · {comoPaga(i)}</span>
                  {nota && <span className="note">{nota}</span>}
                </button>
                <div className="chips">
                  <span className={`chip ${chip.cls}`}>{chip.text}</span>
                  {i.hasApp && <span className="app"><Bell size={13} aria-hidden="true" />tem o app</span>}
                </div>
                <div className="num val">{i.value != null ? brl(i.value) : ''}</div>
                <div className="act">
                  <button className="btn" aria-label={`WhatsApp de ${i.clientName}`} onClick={() => setCobrando(i)}><Send size={17} />WhatsApp</button>
                  <button className="btn btn-ink" onClick={() => setCobrando(i)}>Cobrar</button>
                </div>
              </div>
            )
          })}

          {isMobile && itens.length > 4 && (
            <button className="btn" style={{ width: '100%', border: 0, borderTop: '1px solid rgba(17,17,20,.07)', borderRadius: 0 }} onClick={() => setVerTodos(!verTodos)}>
              {verTodos ? 'Ver menos' : `Ver os ${itens.length}`}
            </button>
          )}
        </section>

        <div className="side">
          {pagos.length > 0 && (
            <section className="card" aria-labelledby="ch-pagos">
              <div id="ch-pagos" className="mono">Pagaram hoje</div>
              {pagos.slice(0, 6).map((p, k) => (
                <div key={`${p.subId}-${k}`} className="li">
                  <span className="chip c-ok"><Check size={13} aria-hidden="true" />{p.forma}</span>
                  <span style={{ flex: 1, minWidth: 0, fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.clientName}</span>
                  <span className="num" style={{ fontSize: 15 }}>{p.valor != null ? brl(p.valor) : hora(p.paidAt)}</span>
                </div>
              ))}
            </section>
          )}

          {renovam.length > 0 && (
            <section className="card" aria-labelledby="ch-renovam">
              <div id="ch-renovam" className="mono">Renovam nos próximos dias</div>
              {renovam.map((d) => (
                <div key={d.date} className="li">
                  <span className="mono" style={{ width: 64 }}>{relDay(d.date, hoje)}</span>
                  <span style={{ flex: 1, fontSize: 14 }}>{d.renovaCount} {d.renovaCount === 1 ? 'renova' : 'renovam'}</span>
                  {d.renova != null && <span className="num" style={{ fontSize: 15 }}>{brl(d.renova)}</span>}
                </div>
              ))}
              <button className="btn" style={{ width: '100%', marginTop: 8 }} onClick={onOpenMembers}>Ver membros</button>
            </section>
          )}

          {dinheiro && (
            <section className="card" aria-labelledby="ch-dinheiro">
              <div id="ch-dinheiro" className="mono">Dinheiro do clube</div>
              {dinheiro.saldo != null && (
                <div className="li"><span style={{ flex: 1, fontSize: 14 }}>Saldo na conta</span><span className="num" style={{ fontSize: 15 }}>{brl(dinheiro.saldo)}</span></div>
              )}
              <div className="li"><span style={{ flex: 1, fontSize: 14 }}>Cai em 30 dias</span><span className="num" style={{ fontSize: 15 }}>{brl(dinheiro.cai30)}</span></div>
              <div className="li"><span style={{ flex: 1, fontSize: 14 }}>Pote da equipe no mês</span><span className="num" style={{ fontSize: 15 }}>{brl(dinheiro.pote.total)}</span></div>
            </section>
          )}

          {(painel?.usoPlanos ?? []).length > 0 && (
            <section className="card" aria-labelledby="ch-uso">
              <div id="ch-uso" className="mono">Uso dos planos no mês</div>
              {(painel?.usoPlanos ?? []).map((u) => (
                <div key={u.planId} className="li">
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontWeight: 600, fontSize: 14 }}>{u.nome}</span>
                    <span className="sub">{u.membros} {u.membros === 1 ? 'membro' : 'membros'}{u.limiteTexto ? ` · ${u.limiteTexto}` : ''}</span>
                  </span>
                  <span className="num" style={{ fontSize: 15 }}>{u.usosPorMembro.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}<span className="sub" style={{ fontFamily: 'var(--font-sans)', marginLeft: 4 }}>por membro</span></span>
                </div>
              ))}
            </section>
          )}
        </div>
      </div>

      {cobrando && <CobrarSheet item={cobrando} onClose={closeSheet} onDone={refresh} />}

      {member && (
        <ClubMemberDetailModal
          initialSub={member}
          isMobile={isMobile}
          charge={(fila?.items ?? []).find((x) => x.subId === member.id) ?? null}
          onCharged={refresh}
          onUpdated={refresh}
          onClose={() => { setMember(null); refresh() }}
        />
      )}
    </div>
  )
}
