'use client'
// src/app/components/navigation/Sidebar.tsx
// @eligi:sb-v2 — Sidebar direcao A "Rail inteligente" (out/2026).
//
// Computador: trilho de 72px que abre ao passar o mouse (com uma pausa curta,
// para nao abrir so de atravessar) ou com o teclado, e pode ser FIXADO aberto.
// @eligi:sb-push — aberto, --sidebar-width acompanha (256px): a pagina se ajusta
// ao lado do menu em vez de ficar escondida embaixo dele (pedido do Eli, out/2026).
// @eligi:sb-badges — contadores por cargo vindos de GET /dashboard/nav-badges.
// Celular: barra inferior com abas escolhidas por cargo (mobileTabsByRole) e
// folha "Mais" com grade de atalhos e o cartao da conta.
//
// Conta logada: foto (user.avatarUrl, mesmo formato do ProfAvatar) e logo +
// nome do estabelecimento (user.logoUrl / businessName), que o /auth/me ja traz.
// Superficie escura oficial (brand.surfaceDark). Destaque do item ativo desliza
// (posicionado por DOM no layout effect: React Compiler safe).

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type FocusEvent } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid, LogOut, Pin, PinOff } from 'lucide-react'
import { navigationByRole, mobileTabsByRole, activeNavPath, getRoleLabel, type NavItemType, type Role } from './navigation.config'
import { useAuth } from '@/hooks/useAuth'
import api from '@/shared/lib/apiClient'
import ProfAvatar from '@/features/agenda/components/shared/ProfAvatar'
import ConfirmDialog from '@/shared/components/ConfirmDialog'
import { brand } from '@/shared/brand.generated'

const NAVBAR_OFFSET = 104
const BOTTOM_NAV_H  = 64
const RAIL_W        = 72
const OPEN_W        = 256
const DESKTOP_MQ    = '(min-width: 1024px)'
const PIN_KEY       = 'eligi-sidebar-pinned'
const OPEN_DELAY_MS  = 180
const CLOSE_DELAY_MS = 140
const BADGE_MIN_GAP_MS = 20_000
const BADGE_POLL_MS    = 120_000

const D = {
  bg:    brand.surfaceDark.base,
  card:  brand.surfaceDark.card,
  line:  brand.surfaceDark.border,
  ink:   brand.surfaceDark.textPrimary,
  ink2:  '#B4B4BE',
  ink3:  brand.surfaceDark.textMuted,
  red:   brand.core.red,
}

// ── lojas externas (sem setState em efeito) ─────────────────────────────────
function subscribeMq(cb: () => void) {
  const mq = window.matchMedia(DESKTOP_MQ)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}
const readDesktop = () => window.matchMedia(DESKTOP_MQ).matches
const noopSubscribe = () => () => {}

let pinMem = false
const pinListeners = new Set<() => void>()
function readPinned(): boolean {
  try { const v = localStorage.getItem(PIN_KEY); return v === null ? pinMem : v === '1' } catch { return pinMem }
}
function writePinned(v: boolean) {
  pinMem = v
  try { localStorage.setItem(PIN_KEY, v ? '1' : '0') } catch { /* modo privado: so memoria */ }
  pinListeners.forEach((l) => l())
}
function subscribePinned(l: () => void) { pinListeners.add(l); return () => { pinListeners.delete(l) } }

// ── contadores do menu ───────────────────────────────────────────────────────
type BadgeTone = 'neutral' | 'warn' | 'bad'
interface NavBadge { count: number; tone: BadgeTone }
type NavBadges = Record<string, NavBadge>

const BADGE_TEXT: Record<string, (n: number) => string> = {
  '/dashboard/agenda':        (n) => `${n} ${n > 1 ? 'atendimentos ainda hoje' : 'atendimento ainda hoje'}`,
  '/dashboard/eligiclub':     (n) => `${n} ${n > 1 ? 'membros precisam de você' : 'membro precisa de você'}`,
  '/dashboard/notas-fiscais': (n) => `${n} ${n > 1 ? 'notas rejeitadas' : 'nota rejeitada'}`,
}
const badgeText = (path: string, b: NavBadge) => (BADGE_TEXT[path] ?? ((n: number) => `${n} pendentes`))(b.count)
const badgeNum = (n: number) => (n > 99 ? '99+' : String(n))

// Loja de modulo (mesmo padrao do fixar): o efeito so pede atualizacao, quem
// guarda o valor e a loja. Busca na montagem, na troca de pagina e ao voltar
// para a aba (no maximo a cada 20s) e de 2 em 2 minutos com a aba visivel.
// Falha = sem contador; o menu nunca quebra por causa disto.
const EMPTY_BADGES: NavBadges = {}
let badgesMem: NavBadges = EMPTY_BADGES
let badgesUser = ''   // dono do cache: trocar de conta na mesma aba nao herda contador
let badgesLast = 0
const badgeListeners = new Set<() => void>()
function subscribeBadges(l: () => void) { badgeListeners.add(l); return () => { badgeListeners.delete(l) } }
const readBadges = () => badgesMem
const readNoBadges = () => EMPTY_BADGES
async function refreshBadges(userId: string, force: boolean) {
  const t = Date.now()
  if (userId !== badgesUser) { badgesUser = userId; badgesMem = EMPTY_BADGES; badgesLast = 0; badgeListeners.forEach((l) => l()) }
  if (!force && t - badgesLast < BADGE_MIN_GAP_MS) return
  badgesLast = t
  try {
    const res = await api.get('/dashboard/nav-badges')
    if (userId !== badgesUser) return
    badgesMem = (res.data?.data ?? EMPTY_BADGES) as NavBadges
    badgeListeners.forEach((l) => l())
  } catch { /* sem contador: segue o menu */ }
}

function useNavBadges(userId: string | null, pathname: string): NavBadges {
  const badges = useSyncExternalStore(subscribeBadges, readBadges, readNoBadges)
  useEffect(() => {
    if (userId) void refreshBadges(userId, false)
  }, [userId, pathname])
  useEffect(() => {
    if (!userId) return
    const onVis = () => { if (document.visibilityState === 'visible') void refreshBadges(userId, false) }
    const id = window.setInterval(() => { if (document.visibilityState === 'visible') void refreshBadges(userId, true) }, BADGE_POLL_MS)
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('focus', onVis)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('focus', onVis)
    }
  }, [userId])
  return userId ? badges : EMPTY_BADGES
}

function Badge({ b }: { b: NavBadge }) {
  return <span className={`esb-bdg ${b.tone}`} aria-hidden>{badgeNum(b.count)}</span>
}

// ── pecas visuais ────────────────────────────────────────────────────────────
function initialsOf(s: string): string {
  return s.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?'
}
function isImage(u: string | null | undefined): u is string {
  return !!u && (u.startsWith('http') || u.startsWith('data:image') || u.startsWith('/'))
}

function BizLogo({ logoUrl, name, size }: { logoUrl: string | null | undefined; name: string; size: number }) {
  const r = Math.round(size * 0.3)
  if (isImage(logoUrl)) {
    return <span aria-hidden className="esb-logo" style={{ width: size, height: size, borderRadius: r, backgroundImage: `url("${logoUrl.replace(/"/g, '%22')}")` }} />
  }
  return <span aria-hidden className="esb-logo" style={{ width: size, height: size, borderRadius: r, fontSize: Math.round(size * 0.36) }}>{initialsOf(name || 'Eligi')}</span>
}

function Me({ name, avatarUrl, size }: { name: string; avatarUrl: string | null | undefined; size: number }) {
  return (
    <span className="esb-me" style={{ width: size, height: size }}>
      <ProfAvatar name={name || '?'} avatarUrl={avatarUrl ?? undefined} size={size} />
    </span>
  )
}

const CSS = `
.esb{font-family:var(--font-sans);color:${D.ink}}
.esb *{box-sizing:border-box}
.esb-logo{flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;background:#0E0E12 center/cover no-repeat;color:#fff;font-family:var(--font-display);font-weight:700;letter-spacing:-.02em;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)}
.esb-me{position:relative;flex-shrink:0;display:inline-flex}
.esb-me::after{content:'';position:absolute;right:-1px;bottom:-1px;width:10px;height:10px;border-radius:50%;background:#22C55E;box-shadow:0 0 0 2px ${D.bg}}
/* rail */
.esb-rail{position:fixed;top:0;left:0;height:100dvh;z-index:50;display:flex;flex-direction:column;background:${D.bg};border-right:1px solid ${D.line};width:${RAIL_W}px;overflow:hidden;transition:width 260ms cubic-bezier(.22,1,.36,1);animation:esb-in 320ms cubic-bezier(.22,1,.36,1) both}
.esb-rail.open{width:${OPEN_W}px}
@keyframes esb-in{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:none}}
.esb-scroll{flex:1;overflow-y:auto;overflow-x:hidden;scrollbar-width:none;padding:${NAVBAR_OFFSET + 12}px 14px 12px}
.esb-scroll::-webkit-scrollbar{display:none}
.esb-list{position:relative}
.esb-ind{position:absolute;left:0;right:0;top:0;height:40px;border-radius:12px;background:rgba(254,0,0,.14);border:1px solid rgba(254,0,0,.28);opacity:0;pointer-events:none;transition:transform 380ms cubic-bezier(.34,1.56,.64,1),height 200ms ease,opacity 200ms ease}
.esb-ind::before{content:'';position:absolute;left:-1px;top:11px;bottom:11px;width:3px;border-radius:0 3px 3px 0;background:${D.red};box-shadow:0 0 10px rgba(254,0,0,.7)}
.esb-sec{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${D.ink3};padding:14px 12px 6px;white-space:nowrap;transition:opacity 160ms}
.esb-rail:not(.open) .esb-sec{height:13px;padding:0;margin:6px 4px;overflow:hidden;color:transparent;border-top:1px solid ${D.line}}
.esb-rail:not(.open) .esb-sec.first{border-top:0;height:0;margin:0}
.esb-item{position:relative;z-index:1;display:flex;align-items:center;gap:12px;height:40px;margin-bottom:2px;padding:0 12px;border-radius:12px;color:${D.ink2};font-size:13.5px;font-weight:500;letter-spacing:-.01em;text-decoration:none;white-space:nowrap;transition:color 160ms,background 160ms;-webkit-tap-highlight-color:transparent}
.esb-item:hover{color:${D.ink};background:rgba(255,255,255,.05)}
.esb-item.on{color:#fff;font-weight:600}
.esb-item.on:hover{background:transparent}
.esb-item svg{flex-shrink:0;transition:transform 250ms cubic-bezier(.34,1.56,.64,1)}
.esb-item:hover svg{transform:scale(1.08)}
.esb-item:active{transform:scale(.97)}
.esb-lbl{transition:opacity 160ms ease,transform 220ms cubic-bezier(.22,1,.36,1)}
.esb-rail:not(.open) .esb-lbl{opacity:0;transform:translateX(-4px)}
.esb-foot{padding:10px;border-top:1px solid ${D.line};display:flex;flex-direction:column;gap:4px}
.esb-acct{display:flex;align-items:center;gap:10px;padding:8px;border-radius:16px;border:1px solid transparent;min-width:0;transition:background 200ms,border-color 200ms}
.esb-rail.open .esb-acct{background:${D.card};border-color:${D.line}}
.esb-acct .meta{min-width:0;flex:1;transition:opacity 160ms}
.esb-rail:not(.open) .esb-acct .meta,.esb-rail:not(.open) .esb-pin{opacity:0;pointer-events:none}
.esb-acct b{display:block;font-size:13px;font-weight:600;color:${D.ink};white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.esb-acct small{display:flex;align-items:center;gap:6px;font-size:11.5px;color:${D.ink3};white-space:nowrap;overflow:hidden}
.esb-acct small span{overflow:hidden;text-overflow:ellipsis}
.esb-pin{flex-shrink:0;width:34px;height:34px;border-radius:10px;border:1px solid ${D.line};background:transparent;color:${D.ink3};display:inline-flex;align-items:center;justify-content:center;cursor:pointer;transition:opacity 160ms,color 160ms,background 160ms}
.esb-pin:hover{color:${D.ink}}
.esb-pin.on{color:#fff;background:rgba(254,0,0,.14);border-color:rgba(254,0,0,.28)}
.esb-out{display:flex;align-items:center;gap:12px;height:42px;padding:0 15px;border:0;border-radius:12px;background:transparent;color:${D.ink3};font:500 13px var(--font-sans);cursor:pointer;white-space:nowrap;transition:color 160ms,background 160ms}
.esb-out:hover{color:#ff6b6b;background:rgba(254,0,0,.08)}
/* contadores: pilula ao lado do rotulo; com o trilho fechado, sobe para o canto do icone */
.esb-bdg{margin-left:auto;flex-shrink:0;min-width:20px;height:20px;padding:0 6px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;font:700 11px var(--font-sans);font-variant-numeric:tabular-nums;line-height:1;background:${D.card};color:${D.ink};border:1px solid ${D.line};animation:esb-pop 360ms cubic-bezier(.34,1.56,.64,1) both}
.esb-bdg.warn{background:#3a2a06;color:#FBBF24;border-color:rgba(251,191,36,.35)}
.esb-bdg.bad{background:${D.red};color:#fff;border-color:transparent}
@keyframes esb-pop{from{transform:scale(.4);opacity:0}to{transform:none;opacity:1}}
.esb-rail:not(.open) .esb-item .esb-bdg{position:absolute;left:30px;top:3px;min-width:16px;height:16px;padding:0 4px;font-size:9.5px;box-shadow:0 0 0 2px ${D.bg}}
.esb-ico{position:relative;display:inline-flex}
.esb-ico .esb-bdg{position:absolute;left:14px;top:-6px;min-width:16px;height:16px;padding:0 4px;font-size:9.5px;margin:0;box-shadow:0 0 0 2px ${D.bg}}
.esb-dot{position:absolute;left:17px;top:-3px;width:8px;height:8px;border-radius:50%;background:#FBBF24;box-shadow:0 0 0 2px ${D.bg}}
.esb-dot.bad{background:${D.red}}
.esb-tile{position:relative}
.esb-tile .esb-bdg{position:absolute;top:8px;right:8px;margin:0}
/* celular */
.esb-bar{position:fixed;left:0;right:0;bottom:0;z-index:60;height:calc(${BOTTOM_NAV_H}px + env(safe-area-inset-bottom,0px));padding-bottom:env(safe-area-inset-bottom,0px);display:flex;align-items:stretch;background:rgba(7,7,11,.95);backdrop-filter:blur(20px) saturate(160%);-webkit-backdrop-filter:blur(20px) saturate(160%);border-top:1px solid rgba(255,255,255,.06)}
.esb-mind{position:absolute;top:0;left:0;width:28px;height:3px;border-radius:0 0 3px 3px;background:${D.red};box-shadow:0 0 12px rgba(254,0,0,.8);opacity:0;transition:transform 380ms cubic-bezier(.34,1.56,.64,1),opacity 200ms}
.esb-tab{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;border:0;background:transparent;color:${D.ink3};font:600 10.5px var(--font-sans);text-decoration:none;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;transition:color 200ms}
.esb-tab svg{transition:transform 300ms cubic-bezier(.34,1.56,.64,1)}
.esb-tab.on{color:#fff}
.esb-tab.on svg{transform:translateY(-1px) scale(1.06)}
.esb-tab:active svg{transform:scale(.86)}
.esb-tab .esb-tl{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:0 2px}
.esb-scrim{position:fixed;inset:0;z-index:58;background:rgba(0,0,0,.5);animation:esb-fade 200ms both}
@keyframes esb-fade{from{opacity:0}}
.esb-sheet{position:fixed;left:0;right:0;bottom:calc(${BOTTOM_NAV_H}px + env(safe-area-inset-bottom,0px));z-index:59;max-height:calc(100dvh - ${NAVBAR_OFFSET}px - ${BOTTOM_NAV_H}px - 8px);overflow-y:auto;background:${D.bg};border-radius:26px 26px 0 0;border-top:1px solid ${D.line};padding:10px 16px 16px;animation:esb-up 340ms cubic-bezier(.22,1,.36,1) both;scrollbar-width:none}
@keyframes esb-up{from{transform:translateY(100%)}to{transform:none}}
.esb-grab{width:40px;height:5px;border-radius:5px;background:rgba(255,255,255,.18);margin:4px auto 14px}
.esb-mhead{display:flex;align-items:center;gap:12px;padding:12px;border-radius:18px;background:${D.card};border:1px solid ${D.line};margin-bottom:14px;min-width:0}
.esb-mhead .meta{flex:1;min-width:0}
.esb-mhead b{display:block;font-size:15px;color:${D.ink};white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.esb-mhead small{display:block;font-size:12px;color:${D.ink3};white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.esb-tiles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.esb-tile{aspect-ratio:1/1;border-radius:18px;background:${D.card};border:1px solid ${D.line};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:6px;color:${D.ink2};font-size:12px;font-weight:600;text-align:center;text-decoration:none;animation:esb-tile 400ms cubic-bezier(.34,1.56,.64,1) both;-webkit-tap-highlight-color:transparent}
.esb-tile.on{background:rgba(254,0,0,.14);border-color:rgba(254,0,0,.28);color:#fff}
.esb-tile:active{transform:scale(.94)}
@keyframes esb-tile{from{opacity:0;transform:translateY(10px) scale(.96)}to{opacity:1;transform:none}}
.esb-mout{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;height:48px;margin-top:14px;border-radius:14px;border:1px solid ${D.line};background:transparent;color:#ff6b6b;font:600 14px var(--font-sans);cursor:pointer}
.esb span,.esb small,.esb b{color:inherit}
@media (prefers-reduced-motion: reduce){.esb *,.esb{animation:none!important;transition:none!important}}
`

interface Account { name: string; avatarUrl: string | null | undefined; roleLabel: string; bizName: string; logoUrl: string | null | undefined }

const SECTIONS: { key: NavItemType['section']; label: string }[] = [
  { key: 'principal',  label: 'Principal'  },
  { key: 'financeiro', label: 'Financeiro' },
  { key: 'gestao',     label: 'Gestão'     },
  { key: 'admin',      label: 'Admin'      },
]

// ═══════════════════════════════════════════════════════════════════════════
export default function Sidebar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false)
  const desktop  = useSyncExternalStore(subscribeMq, readDesktop, () => false)
  const pinned   = useSyncExternalStore(subscribePinned, readPinned, () => false)
  const [hover, setHover] = useState(false)
  const open = pinned || hover
  const badges = useNavBadges(hydrated && user?.id ? user.id : null, pathname)

  // largura que o CONTEUDO respeita: menu aberto (mouse, teclado ou fixado) = 256px,
  // fechado = trilho de 72px. A pagina anda junto (transicao no <main>).
  useEffect(() => {
    const root = document.documentElement.style
    root.setProperty('--sidebar-width', desktop ? `${open ? OPEN_W : RAIL_W}px` : '0px')
    root.setProperty('--navbar-offset', `${NAVBAR_OFFSET}px`)
  }, [desktop, open])

  if (!hydrated || !user) return null

  const role = (user.role in navigationByRole ? user.role : 'BASIC_STAFF') as Role
  const items: NavItemType[] = navigationByRole[role]
  const active = activeNavPath(items, pathname)
  const account: Account = {
    name: user.name ?? '',
    avatarUrl: user.avatarUrl,
    roleLabel: getRoleLabel(user.role),
    bizName: user.businessName ?? '',
    logoUrl: user.logoUrl,
  }

  return (
    <div className="esb eligi-sidebar">
      <style>{CSS}</style>
      {desktop
        ? <Rail items={items} active={active} pinned={pinned} open={open} setHover={setHover} badges={badges} account={account} onLogout={() => setConfirmOpen(true)} />
        : <MobileBar role={role} items={items} active={active} badges={badges} account={account} onLogout={() => setConfirmOpen(true)} />}
      <ConfirmDialog
        open={confirmOpen}
        title="Sair da conta?"
        message="Você precisará fazer login novamente."
        confirmLabel="Sair"
        cancelLabel="Cancelar"
        onConfirm={() => { setConfirmOpen(false); logout() }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}

// ── computador ───────────────────────────────────────────────────────────────
function Rail({ items, active, pinned, open, setHover, badges, account, onLogout }: {
  items: NavItemType[]; active: string | null; pinned: boolean; open: boolean
  setHover: (v: boolean) => void; badges: NavBadges; account: Account; onLogout: () => void
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const indRef = useRef<HTMLDivElement>(null)

  const clear = () => { if (timer.current) { clearTimeout(timer.current); timer.current = null } }
  // mouse: pausa curta antes de abrir, para nao empurrar a pagina so de atravessar o menu
  const onMouseEnter = useCallback(() => {
    clear(); timer.current = setTimeout(() => setHover(true), OPEN_DELAY_MS)
  }, [setHover])
  // teclado: abre na hora. Foco de clique (sem :focus-visible) nao abre: senao
  // voltar para a aba com o link ainda focado empurraria a pagina sozinho.
  const onFocusIn = useCallback((e: FocusEvent<HTMLElement>) => {
    const t = e.target as HTMLElement
    if (typeof t.matches === 'function' && !t.matches(':focus-visible')) return
    clear(); setHover(true)
  }, [setHover])
  const onLeave = useCallback(() => {
    clear(); timer.current = setTimeout(() => setHover(false), CLOSE_DELAY_MS)
  }, [setHover])
  useEffect(() => () => clear(), [])

  // destaque que desliza ate o item ativo (rotulos de secao mudam de altura ao abrir)
  useLayoutEffect(() => {
    const list = listRef.current
    const ind = indRef.current
    if (!list || !ind) return
    const on = list.querySelector<HTMLElement>('.esb-item.on')
    if (!on) { ind.style.opacity = '0'; return }
    ind.style.opacity = '1'
    ind.style.height = `${on.offsetHeight}px`
    ind.style.transform = `translateY(${on.offsetTop}px)`
  }, [active, open])

  const present = SECTIONS.filter((s) => items.some((i) => i.section === s.key))

  return (
    <aside
      aria-label="Navegação lateral"
      className={`esb-rail${open ? ' open' : ''}${pinned ? ' pinned' : ''}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onLeave}
      onFocus={onFocusIn}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) onLeave() }}
    >
      <div className="esb-scroll">
        <div className="esb-list" ref={listRef}>
          <div className="esb-ind" ref={indRef} aria-hidden />
          {present.map((s, si) => (
            <div key={s.key}>
              <div className={`esb-sec${si === 0 ? ' first' : ''}`}>{s.label}</div>
              {items.filter((i) => i.section === s.key).map((it) => {
                const Icon = it.icon
                const on = it.path === active
                const b = badges[it.path]
                return (
                  <Link key={it.path} href={it.path} className={`esb-item${on ? ' on' : ''}`}
                    aria-current={on ? 'page' : undefined} aria-label={b ? `${it.label}, ${badgeText(it.path, b)}` : it.label}
                    title={b && !open ? badgeText(it.path, b) : undefined}>
                    <Icon size={20} strokeWidth={1.9} />
                    <span className="esb-lbl">{it.label}</span>
                    {b && <Badge b={b} />}
                  </Link>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="esb-foot">
        <div className="esb-acct">
          <Me name={account.name} avatarUrl={account.avatarUrl} size={38} />
          <div className="meta">
            <b>{account.name}</b>
            <small><span>{account.roleLabel}{account.bizName ? ` · ${account.bizName}` : ''}</span></small>
          </div>
          <button type="button" className={`esb-pin${pinned ? ' on' : ''}`} onClick={() => writePinned(!pinned)}
            aria-pressed={pinned} aria-label={pinned ? 'Soltar menu' : 'Fixar menu aberto'} title={pinned ? 'Soltar menu' : 'Fixar menu aberto'}>
            {pinned ? <PinOff size={15} /> : <Pin size={15} />}
          </button>
        </div>
        <button type="button" className="esb-out" onClick={onLogout} aria-label="Sair da conta">
          <LogOut size={18} style={{ flexShrink: 0 }} />
          <span className="esb-lbl">Sair da conta</span>
        </button>
      </div>
    </aside>
  )
}

// ── celular ──────────────────────────────────────────────────────────────────
function MobileBar({ role, items, active, badges, account, onLogout }: {
  role: Role; items: NavItemType[]; active: string | null; badges: NavBadges; account: Account; onLogout: () => void
}) {
  const [sheet, setSheet] = useState(false)
  const barRef = useRef<HTMLElement>(null)
  const indRef = useRef<HTMLSpanElement>(null)

  const wanted = mobileTabsByRole[role]
  const tabs = wanted
    ? wanted.map((p) => items.find((i) => i.path === p)).filter((i): i is NavItemType => !!i)
    : items.slice(0, 4)
  const rest = items.filter((i) => !tabs.includes(i))
  const restActive = rest.some((i) => i.path === active)
  // o que esta dentro do "Mais" e pede acao vira um ponto no proprio "Mais"
  const restTones = rest.map((i) => badges[i.path]?.tone).filter((t): t is BadgeTone => t === 'warn' || t === 'bad')
  const restDot: BadgeTone | null = restTones.includes('bad') ? 'bad' : restTones.length ? 'warn' : null

  useEffect(() => {
    document.documentElement.style.setProperty('--bottom-nav-h', `${BOTTOM_NAV_H}px`)
    return () => { document.documentElement.style.removeProperty('--bottom-nav-h') }
  }, [])

  useEffect(() => {
    if (!sheet) return
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSheet(false) }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey) }
  }, [sheet])

  // indicador que desliza ate a aba ativa (ou ate o "Mais" quando o ativo mora la)
  useLayoutEffect(() => {
    const bar = barRef.current
    const ind = indRef.current
    if (!bar || !ind) return
    const on = bar.querySelector<HTMLElement>('.esb-tab.on')
    if (!on) { ind.style.opacity = '0'; return }
    ind.style.opacity = '1'
    ind.style.transform = `translateX(${on.offsetLeft + on.offsetWidth / 2 - 14}px)`
  }, [active, sheet])

  return (
    <>
      {sheet && <div className="esb-scrim" onClick={() => setSheet(false)} />}
      {sheet && (
        <div className="esb-sheet" role="dialog" aria-modal="true" aria-label="Mais opções">
          <div className="esb-grab" aria-hidden />
          <div className="esb-mhead">
            <Me name={account.name} avatarUrl={account.avatarUrl} size={46} />
            <div className="meta">
              <b>{account.name}</b>
              <small>{account.roleLabel}{account.bizName ? ` · ${account.bizName}` : ''}</small>
            </div>
            {account.bizName && <BizLogo logoUrl={account.logoUrl} name={account.bizName} size={38} />}
          </div>
          {rest.length > 0 && (
            <div className="esb-tiles">
              {rest.map((it, i) => {
                const Icon = it.icon
                const on = it.path === active
                const b = badges[it.path]
                return (
                  <Link key={it.path} href={it.path} className={`esb-tile${on ? ' on' : ''}`} aria-current={on ? 'page' : undefined}
                    aria-label={b ? `${it.label}, ${badgeText(it.path, b)}` : undefined}
                    onClick={() => setSheet(false)} style={{ animationDelay: `${i * 25}ms` }}>
                    <Icon size={24} strokeWidth={1.9} />
                    {it.label}
                    {b && <Badge b={b} />}
                  </Link>
                )
              })}
            </div>
          )}
          <button type="button" className="esb-mout" onClick={() => { setSheet(false); onLogout() }}>
            <LogOut size={18} />Sair da conta
          </button>
        </div>
      )}

      <nav aria-label="Navegação inferior" className="esb-bar" ref={barRef}>
        <span className="esb-mind" ref={indRef} aria-hidden />
        {tabs.map((it) => {
          const Icon = it.icon
          const on = !sheet && it.path === active
          const b = badges[it.path]
          return (
            <Link key={it.path} href={it.path} className={`esb-tab${on ? ' on' : ''}`} aria-current={on ? 'page' : undefined}
              aria-label={b ? `${it.label}, ${badgeText(it.path, b)}` : undefined}
              onClick={() => setSheet(false)}>
              <span className="esb-ico"><Icon size={23} strokeWidth={1.9} />{b && <Badge b={b} />}</span>
              <span className="esb-tl">{it.short ?? it.label}</span>
            </Link>
          )
        })}
        {rest.length > 0 && (
          <button type="button" className={`esb-tab${sheet || restActive ? ' on' : ''}`} onClick={() => setSheet((v) => !v)}
            aria-expanded={sheet} aria-label={restDot ? 'Mais opções, há pendências' : 'Mais opções'}>
            <span className="esb-ico"><LayoutGrid size={23} strokeWidth={1.9} />{restDot && <span className={`esb-dot${restDot === 'bad' ? ' bad' : ''}`} aria-hidden />}</span>
            <span className="esb-tl">Mais</span>
          </button>
        )}
        {rest.length === 0 && (
          <button type="button" className="esb-tab" onClick={onLogout} aria-label="Sair da conta">
            <LogOut size={23} strokeWidth={1.9} />
            <span className="esb-tl">Sair</span>
          </button>
        )}
      </nav>
    </>
  )
}
