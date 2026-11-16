'use client'
// src/features/help/HelpWidget.tsx
// @eligi:help-widget
//
// Botao flutuante "Ajuda" + chat da Gi (direcao A com a busca da B, 16/11/2026).
// - Conversa com "digitando", respostas em frases inteiras e passo a passo com
//   atalho para a tela certa (conteudo em helpContent.ts).
// - Falar com uma pessoa (WhatsApp do suporte) so depois de 5 toques sem
//   resolver; a mensagem vai pronta com assunto, negocio, nome, cargo e tela.
// - Celular: folha entre a navbar (104px) e a barra de baixo.
// - O botao some na agenda e no caixa; ali a ajuda abre pelo menu da conta ou
//   pelo "Mais" (evento eligi:help-open).
// - Computador: janela no canto inferior direito, sem cobrir a pagina toda.

import { useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageCircle, RotateCcw, Search, X } from 'lucide-react'
import { getRoleLabel } from '@/app/components/navigation/navigation.config'
import { firstName as firstNameOf, waLink } from '@/shared/utils/whatsapp'
import HelpBotAvatar from './HelpBotAvatar'
import { HELP_TOPICS } from './helpContent'
import { HELP_OPEN_EVENT, NOTE_MAX, SUPPORT_PHONE, screenLabel, searchGuides, supportMessage, topicForPath, visibleTopics } from './help.rules'
import { chatReducer, findGuide, initialChat, typingDelay, type ChatCtx, type ChatMsg, type ChatOption } from './help.chat'

interface Props {
  userName?: string | null
  role?: string
  businessName?: string | null
}

const noop = () => () => {}
const readIsApp = () => typeof window !== 'undefined' && !!(window as unknown as { __ELIGI_APP__?: unknown }).__ELIGI_APP__
const RM = '(prefers-reduced-motion: reduce)'
const subscribeRM = (cb: () => void) => {
  const mq = window.matchMedia(RM)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}
const readRM = () => window.matchMedia(RM).matches
const isWide = () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches

export default function HelpWidget({ userName, role, businessName }: Props) {
  const pathname = usePathname()
  const isApp = useSyncExternalStore(noop, readIsApp, () => false)
  const reduced = useSyncExternalStore(subscribeRM, readRM, () => false)
  const topics = useMemo(() => visibleTopics(HELP_TOPICS, role, isApp), [role, isApp])

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [note, setNote] = useState('')
  const [state, dispatch] = useReducer(chatReducer, initialChat)
  const listRef = useRef<HTMLDivElement>(null)

  const first = userName ? firstNameOf(userName) : ''
  const screen = screenLabel(pathname)
  const ctx: ChatCtx = { topics, firstName: first, pathTopicId: topicForPath(topics, pathname)?.id ?? null, screen }

  const openPanel = () => {
    setOpen(true)
    dispatch({ t: 'start', ctx })
  }

  // "Ajuda e suporte" do menu Mais (celular) abre o mesmo chat
  const ctxRef = useRef(ctx)
  useLayoutEffect(() => { ctxRef.current = ctx })
  useEffect(() => {
    const onOpen = () => {
      setOpen(true)
      dispatch({ t: 'start', ctx: ctxRef.current })
    }
    window.addEventListener(HELP_OPEN_EVENT, onOpen)
    return () => window.removeEventListener(HELP_OPEN_EVENT, onOpen)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // a Gi "digita" a proxima mensagem da fila
  const head = state.queue[0]
  useEffect(() => {
    if (!head) return
    const t = window.setTimeout(() => dispatch({ t: 'tick' }), typingDelay(head, reduced))
    return () => window.clearTimeout(t)
  }, [head, reduced])

  const typing = state.queue.length > 0
  const searching = query.trim().length > 0
  const hits = useMemo(() => (searching ? searchGuides(topics, query) : []), [searching, topics, query])

  useLayoutEffect(() => {
    const el = listRef.current
    if (el && !searching) el.scrollTop = el.scrollHeight
  }, [state.msgs.length, state.options.length, typing, searching, open])

  const pick = (option: ChatOption) => dispatch({ t: 'pick', option, ctx })

  const pickHit = (topicId: string, guideId: string, label: string) => {
    setQuery('')
    pick({ id: `search:${topicId}:${guideId}`, label, action: { t: 'guide', topicId, guideId } })
  }

  const askHuman = () => pick({ id: 'human', label: 'Quero falar com uma pessoa', action: { t: 'human' } })

  const restart = () => {
    setQuery('')
    setNote('')
    dispatch({ t: 'restart', ctx })
  }

  // navegar pelo passo a passo: no celular a folha cobre a tela, entao fecha
  const onGoTo = () => { if (!isWide()) setOpen(false) }

  const current = state.topicId && state.guideId ? findGuide({ topics }, state.topicId, state.guideId) : null
  const currentTopic = state.topicId ? topics.find((t) => t.id === state.topicId) ?? null : null
  const waHref = waLink(SUPPORT_PHONE, supportMessage({
    topicTitle: current?.topic.title ?? currentTopic?.title,
    guideTitle: current?.guide.title,
    triedGuide: state.triedGuide,
    note,
    businessName,
    userName,
    roleLabel: role ? getRoleLabel(role).toLowerCase() : undefined,
    screen,
  }))

  // agenda e caixa usam a tela toda (grade e rodape do carrinho): ali a ajuda abre
  // pelo menu da conta (computador) ou pelo Mais (celular)
  const hideFab = !!pathname && ['/dashboard/agenda', '/dashboard/caixa'].some((p) => pathname === p || pathname.startsWith(p + '/'))

  const renderMsg = (m: ChatMsg) => {
    if (m.kind === 'text') {
      return <div key={m.id} className={`ehw-b ${m.from === 'me' ? 'me' : 'bot'}`}>{m.text}</div>
    }
    if (m.kind === 'guide') {
      const found = findGuide({ topics }, m.topicId, m.guideId)
      if (!found) return null
      const g = found.guide
      return (
        <div key={m.id} className="ehw-card">
          <div className="ehw-card-t">{g.title}</div>
          <ol className="ehw-steps">
            {g.steps.map((s, i) => (
              <li key={i}><span className="ehw-n" aria-hidden>{i + 1}</span><span>{s}</span></li>
            ))}
          </ol>
          {g.href && (
            <Link href={g.href} className="ehw-go" onClick={onGoTo}>{g.hrefLabel ?? 'Abrir a tela'}</Link>
          )}
        </div>
      )
    }
    return (
      <div key={m.id} className="ehw-card ehw-human">
        <label className="ehw-lab" htmlFor="ehw-note">Quer contar mais alguma coisa? (opcional)</label>
        <textarea id="ehw-note" className="ehw-note" rows={3} maxLength={NOTE_MAX} value={note}
          onChange={(e) => setNote(e.target.value)} placeholder="Ex.: aparece um erro quando salvo o serviço" />
        <a className="ehw-wa" href={waHref} target="_blank" rel="noopener noreferrer">
          <MessageCircle size={18} strokeWidth={2.2} aria-hidden />Abrir o WhatsApp do suporte
        </a>
        <div className="ehw-fine">Vai com o assunto, o nome do seu negócio e a tela em que você está.</div>
      </div>
    )
  }

  return (
    <>
      <style>{CSS}</style>
      {!open && !hideFab && (
        <button type="button" className="ehw-fab" onClick={openPanel} aria-label="Ajuda">
          <HelpBotAvatar size={36} />
          <span className="ehw-fab-t">Ajuda</span>
        </button>
      )}

      {open && (
        <section className="ehw-panel" role="dialog" aria-modal="false" aria-labelledby="ehw-title">
          <header className="ehw-head">
            <HelpBotAvatar size={42} online />
            <div className="ehw-who">
              <b id="ehw-title">Gi · ajuda do Eligi</b>
              <small>{typing ? 'digitando…' : 'Responde na hora'}</small>
            </div>
            <button type="button" className="ehw-ib" onClick={restart} aria-label="Recomeçar conversa" title="Recomeçar">
              <RotateCcw size={17} strokeWidth={2.1} />
            </button>
            <button type="button" className="ehw-ib" onClick={() => setOpen(false)} aria-label="Fechar ajuda">
              <X size={19} strokeWidth={2.1} />
            </button>
          </header>

          <label className="ehw-search">
            <Search size={17} strokeWidth={2.1} aria-hidden />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar ajuda"
              aria-label="Buscar ajuda" enterKeyHint="search" />
            {query && (
              <button type="button" className="ehw-clear" onClick={() => setQuery('')} aria-label="Limpar busca"><X size={15} /></button>
            )}
          </label>

          <div className="ehw-list" ref={listRef} aria-live="polite">
            {searching ? (
              <div className="ehw-hits">
                {hits.length === 0 ? (
                  <div className="ehw-empty">Não achei nada com essas palavras. Tente outras ou escolha um assunto na conversa.</div>
                ) : (
                  <>
                    <div className="ehw-cap">RESULTADOS</div>
                    {hits.map(({ topic, guide }) => (
                      <button key={`${topic.id}:${guide.id}`} type="button" className="ehw-hit" onClick={() => pickHit(topic.id, guide.id, guide.ask)}>
                        <span className="ehw-hit-t">{guide.ask}</span>
                        <span className="ehw-hit-s">{topic.title}</span>
                      </button>
                    ))}
                  </>
                )}
              </div>
            ) : (
              <>
                {state.msgs.map(renderMsg)}
                {typing && (
                  <div className="ehw-b bot ehw-typing" aria-label="Gi está digitando">
                    <i /><i /><i />
                  </div>
                )}
                {!typing && state.options.length > 0 && (
                  <div className="ehw-opts">
                    {state.options.map((o) => (
                      <button key={o.id} type="button" className="ehw-opt" onClick={() => pick(o)}>{o.label}</button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {state.humanOffered && !state.options.some((o) => o.action.t === 'human') && !state.msgs.some((m) => m.kind === 'human') && (
            <footer className="ehw-foot">
              <button type="button" className="ehw-person" onClick={askHuman} disabled={typing}>
                <MessageCircle size={17} strokeWidth={2.2} aria-hidden />Falar com uma pessoa
              </button>
            </footer>
          )}
        </section>
      )}
    </>
  )
}

const CSS = `
.ehw-fab{position:fixed;z-index:800;right:16px;bottom:calc(var(--bottom-nav-h,0px) + 16px + env(safe-area-inset-bottom,0px));display:flex;align-items:center;gap:8px;height:52px;min-width:52px;padding:0 8px;border:none;border-radius:999px;background:#fff;color:#111114;box-shadow:0 10px 28px rgba(17,17,20,.16),0 1px 3px rgba(17,17,20,.08);cursor:pointer;font:600 15px var(--font-sans,Inter,system-ui,sans-serif);animation:ehw-pop .45s cubic-bezier(.34,1.56,.64,1) both}
.ehw-fab-t{display:none;padding-right:6px}
.ehw-fab:hover{box-shadow:0 14px 34px rgba(17,17,20,.2),0 1px 3px rgba(17,17,20,.08)}
.ehw-fab:focus-visible,.ehw-panel :focus-visible{outline:2px solid #dc2626;outline-offset:2px}
@media (min-width:1024px){.ehw-fab{right:24px;bottom:24px;padding:0 16px 0 8px}.ehw-fab-t{display:inline}}

.ehw-panel{position:fixed;z-index:9000;left:0;right:0;top:var(--navbar-offset,104px);bottom:calc(var(--bottom-nav-h,0px) + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;background:#fff;border-radius:22px 22px 0 0;box-shadow:0 -10px 40px rgba(17,17,20,.14);overflow:hidden;font-family:var(--font-sans,Inter,system-ui,sans-serif);color:#111114;animation:ehw-up .32s cubic-bezier(.22,1,.36,1) both}
@media (min-width:1024px){.ehw-panel{left:auto;top:auto;right:24px;bottom:24px;width:400px;height:min(660px,calc(100dvh - 104px - 48px));border-radius:22px;box-shadow:0 24px 60px rgba(17,17,20,.18),0 2px 8px rgba(17,17,20,.06);transform-origin:bottom right;animation:ehw-in .28s cubic-bezier(.22,1,.36,1) both}}

.ehw-head{display:flex;align-items:center;gap:10px;padding:12px 12px 12px 16px;border-bottom:1px solid rgba(17,17,20,.07)}
.ehw-who{flex:1;min-width:0;display:flex;flex-direction:column}
.ehw-who b{font:600 15px var(--font-sans,Inter,system-ui,sans-serif);color:#111114}
.ehw-who small{font:500 12px var(--font-sans,Inter,system-ui,sans-serif);color:#4b4b52}
.ehw-ib{width:44px;height:44px;border:none;border-radius:12px;background:#f5f5f7;color:#111114;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0}
.ehw-ib:hover{background:#ececf0}

.ehw-search{display:flex;align-items:center;gap:8px;margin:10px 12px 0;height:44px;padding:0 6px 0 12px;border-radius:12px;background:#f5f5f7;color:#4b4b52}
.ehw-search input{flex:1;min-width:0;border:none;background:none;outline:none;font:400 16px var(--font-sans,Inter,system-ui,sans-serif);color:#111114}
.ehw-search input::placeholder{color:#8a8a93}
.ehw-clear{width:32px;height:32px;border:none;border-radius:9px;background:#e6e6eb;color:#111114;display:flex;align-items:center;justify-content:center;cursor:pointer}

.ehw-list{flex:1;overflow-y:auto;overscroll-behavior:contain;padding:14px 14px 16px;display:flex;flex-direction:column;gap:8px}
.ehw-b{max-width:86%;padding:10px 14px;font:400 15px/1.42 var(--font-sans,Inter,system-ui,sans-serif);white-space:pre-line;animation:ehw-rise .35s cubic-bezier(.22,1,.36,1) both}
.ehw-b.bot{align-self:flex-start;background:#f0f0f3;color:#111114;border-radius:18px 18px 18px 6px}
.ehw-b.me{align-self:flex-end;background:#111114;color:#fff;border-radius:18px 18px 6px 18px}
.ehw-typing{display:flex;gap:5px;padding:14px 16px}
.ehw-typing i{width:7px;height:7px;border-radius:50%;background:#4b4b52;animation:ehw-dot 1.2s infinite}
.ehw-typing i:nth-child(2){animation-delay:.15s}.ehw-typing i:nth-child(3){animation-delay:.3s}

.ehw-card{align-self:flex-start;width:92%;background:#fff;border:1px solid rgba(17,17,20,.1);border-radius:16px;padding:12px 14px;display:flex;flex-direction:column;gap:10px;animation:ehw-rise .4s cubic-bezier(.22,1,.36,1) both}
.ehw-card-t{font:600 15px var(--font-display,'Space Grotesk',Inter,sans-serif);letter-spacing:-.01em}
.ehw-steps{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:9px}
.ehw-steps li{display:flex;gap:10px;font:400 14px/1.45 var(--font-sans,Inter,system-ui,sans-serif);color:#111114}
.ehw-n{flex-shrink:0;width:22px;height:22px;border-radius:50%;background:#111114;color:#fff;font:600 11px var(--font-mono,ui-monospace,monospace);display:flex;align-items:center;justify-content:center;margin-top:1px}
.ehw-go{height:44px;display:flex;align-items:center;justify-content:center;border-radius:12px;background:#f5f5f7;color:#111114;font:600 14px var(--font-sans,Inter,system-ui,sans-serif);text-decoration:none}
.ehw-go:hover{background:#ececf0}

.ehw-opts{display:flex;flex-direction:column;gap:8px;margin-top:2px}
.ehw-opt{align-self:flex-end;max-width:92%;min-height:46px;text-align:left;padding:10px 14px;border:1px solid rgba(17,17,20,.16);background:#fff;border-radius:16px;font:500 15px/1.35 var(--font-sans,Inter,system-ui,sans-serif);color:#111114;cursor:pointer;animation:ehw-rise .3s cubic-bezier(.22,1,.36,1) both}
.ehw-opt:nth-child(2){animation-delay:.04s}.ehw-opt:nth-child(3){animation-delay:.08s}.ehw-opt:nth-child(4){animation-delay:.12s}.ehw-opt:nth-child(n+5){animation-delay:.16s}
.ehw-opt:hover{background:#f5f5f7;border-color:rgba(17,17,20,.28)}

.ehw-human{gap:8px}
.ehw-lab{font:500 13px var(--font-sans,Inter,system-ui,sans-serif);color:#4b4b52}
.ehw-note{width:100%;box-sizing:border-box;border:1px solid rgba(17,17,20,.16);border-radius:12px;padding:10px 12px;font:400 16px var(--font-sans,Inter,system-ui,sans-serif);color:#111114;resize:none}
.ehw-wa{height:50px;display:flex;align-items:center;justify-content:center;gap:8px;border-radius:12px;background:#111114;color:#fff;font:600 15px var(--font-sans,Inter,system-ui,sans-serif);text-decoration:none}
.ehw-wa svg{color:#4ade80}
.ehw-fine{font:400 12px var(--font-sans,Inter,system-ui,sans-serif);color:#4b4b52;text-align:center}

.ehw-hits{display:flex;flex-direction:column;gap:6px}
.ehw-cap{font:500 11px var(--font-mono,ui-monospace,monospace);letter-spacing:.06em;color:#4b4b52;padding:2px 2px 4px}
.ehw-hit{display:flex;flex-direction:column;gap:2px;text-align:left;min-height:52px;padding:10px 14px;border:1px solid rgba(17,17,20,.08);border-radius:14px;background:#fff;cursor:pointer}
.ehw-hit:hover{background:#f5f5f7}
.ehw-hit-t{font:500 15px/1.35 var(--font-sans,Inter,system-ui,sans-serif);color:#111114}
.ehw-hit-s{font:400 12.5px var(--font-sans,Inter,system-ui,sans-serif);color:#4b4b52}
.ehw-empty{font:400 14px/1.45 var(--font-sans,Inter,system-ui,sans-serif);color:#4b4b52;padding:8px 4px}

.ehw-foot{padding:10px 14px 12px;border-top:1px solid rgba(17,17,20,.07)}
.ehw-person{width:100%;height:48px;display:flex;align-items:center;justify-content:center;gap:8px;border-radius:12px;border:1px solid rgba(17,17,20,.16);background:#fff;color:#111114;font:600 14px var(--font-sans,Inter,system-ui,sans-serif);cursor:pointer}
.ehw-person svg{color:#16a34a}
.ehw-person:disabled{opacity:.5;cursor:default}

.ehb{position:relative;display:block;flex-shrink:0;border-radius:50%;background:#07070b url('/images/help/gi.webp') center/cover no-repeat;box-shadow:0 0 0 1px rgba(17,17,20,.08)}
.ehb-on{position:absolute;right:-1px;bottom:-1px;width:12px;height:12px;border-radius:50%;background:#16a34a;border:2px solid #fff;animation:ehb-pulse 2.4s ease-in-out infinite}

@keyframes ehw-pop{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:none}}
@keyframes ehw-up{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
@keyframes ehw-in{from{opacity:0;transform:translateY(12px) scale(.96)}to{opacity:1;transform:none}}
@keyframes ehw-rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes ehw-dot{0%,80%,100%{opacity:.25;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}
@keyframes ehb-pulse{0%,100%{opacity:1}50%{opacity:.45}}
@media (prefers-reduced-motion: reduce){
  .ehw-fab,.ehw-panel,.ehw-b,.ehw-card,.ehw-opt,.ehb-on,.ehw-typing i{animation:none!important}
}
`
