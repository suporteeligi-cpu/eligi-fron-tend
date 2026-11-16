'use client'

// src/features/settings/components/BusinessPreview.tsx
//
// @eligi:business-preview-v2
// Espelho do link publico (app.eligi.com.br/<slug>) como ele aparece HOJE no
// celular: capa curta, logo grande sobreposto, nome em tipografia de vitrine,
// status, nota, numeros da casa, acoes, Galeria, servicos e as secoes recolhidas.
// Copia o desenho de front-end-public/src/components/profile/ProfileHero.tsx,
// PortfolioHighlights.tsx e ProfileSections.tsx. Mudou la, muda aqui.
//
// O que e do rascunho (logo, capa, cores, sobre, fotos, redes, endereco) vem do
// editor e muda na hora. O que nao se edita aqui (servicos, equipe, horario,
// nota) vem do proprio link (`GET /public/:slug`), entao a previa nao inventa
// nota nem servico de exemplo.
//
// DOIS MODOS
// - LEITURA (sem `onEditSlot`).
// - EDICAO (com `onEditSlot`): cada regiao ganha um lapis, e regiao vazia vira
//   um alvo pontilhado "Adicionar ...".
//
// Componente PURO: tudo por prop, sem fetch, sem relogio (o status chega pronto).

import { Pencil, Plus } from 'lucide-react'
import {
  type BusinessTheme,
  type BusinessSocials,
  coverBackground,
  isMonogramCover,
  pageStyleVars,
} from '@/shared/profileTheme'

/** Regioes editaveis do preview. */
export type PreviewSlot = 'logo' | 'cover' | 'appearance' | 'about' | 'address' | 'socials' | 'photos'

/** Iniciais do negocio, usadas sem logo e na marca-d'agua do monograma. */
export function initialsOf(name: string): string {
  const t = (name || '').trim()
  if (!t) return 'E'
  return t.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export interface PreviewStatus {
  open: boolean
  label: string
  sub: string
}

/** O que vem do link publico. `null` = nao carregou; o resto da previa segue. */
export interface PreviewLive {
  hours: Array<{ weekday: number; startTime: string; endTime: string }>
  services: Array<{ id: string; name: string; duration: number; price: number | null; priceMode?: string | null }>
  professionals: Array<{ id: string; name: string; avatarUrl: string | null }>
  rating: { count: number; average: number | null } | null
  discoverable: boolean
  status: PreviewStatus | null
}

interface Props {
  businessName: string
  theme: BusinessTheme
  logoUrl: string | null
  coverUrl: string | null
  about?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  hasPin?: boolean
  socials?: BusinessSocials | null
  gallery?: string[] | null
  /** Profissional de cada foto, chaveado pela URL. */
  galleryPros?: Record<string, string | null>
  /** Nome de quem pode ser creditado nas fotos. */
  pros?: Array<{ id: string; name: string }>
  /** `undefined` = carregando, `null` = falhou. */
  live?: PreviewLive | null
  onEditSlot?: (slot: PreviewSlot) => void
}

/** "Hoje · 09:00–18:00 · fecha às 18:00" vira "Aberto · até 18:00". Igual ao link. */
function statusLine(s: PreviewStatus): string {
  if (s.open) {
    const m = s.sub.match(/fecha às (\d{2}:\d{2})/)
    return m ? `Aberto · até ${m[1]}` : s.label
  }
  return s.sub ? `Fechado · ${s.sub.charAt(0).toLowerCase()}${s.sub.slice(1)}` : s.label
}

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
function priceLabel(price: number | null, mode?: string | null): string {
  if (price == null || price <= 0) return 'Sob consulta'
  const v = BRL.format(price)
  return mode === 'FROM' ? `a partir de ${v}` : v
}
function durationLabel(min: number): string {
  if (!min) return ''
  const h = Math.floor(min / 60)
  const m = min % 60
  if (!h) return `${m} min`
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`
}
function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name
}

const ICON_SHARE = (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 3v13M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
  </svg>
)
const ICON_BACK = (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M15 6l-6 6 6 6" />
  </svg>
)
const ICON_PIN = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden style={{ flex: 'none' }}>
    <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
  </svg>
)
const ICON_WHATSAPP = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 2a10 10 0 0 0-8.6 15l-1.4 5 5.1-1.3A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20zm4.4-5.6c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.1-.2 0-.4.1-.5l.4-.5.2-.4v-.4l-.7-1.7c-.2-.4-.4-.4-.5-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2c0 1.3 1 2.6 1.1 2.8.1.2 1.9 2.9 4.6 4 .6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1z" />
  </svg>
)
const ICON_ROUTE = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 11l18-8-8 18-2-7-8-3z" />
  </svg>
)
const ICON_PLAY = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M8 5l12 7-12 7z" />
  </svg>
)
const ICON_CHEVRON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
    <path d="M6 9l6 6 6-6" />
  </svg>
)

/** Lapis de edicao: alvo de 44px com o disco de 28px dentro. */
function EditPin({ onClick, label, style }: { onClick: () => void; label: string; style: React.CSSProperties }) {
  return (
    <button type="button" className="bp-pin" onClick={onClick} aria-label={label} style={style}>
      <span><Pencil size={13} aria-hidden /></span>
    </button>
  )
}

/** Regiao ainda vazia: mostra o que falta e oferece o caminho. */
function EmptySlot({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" className="bp-empty" onClick={onClick}>
      <Plus size={15} aria-hidden /> {label}
    </button>
  )
}

const CSS = `
.bp{ --bp-display: var(--font-display); border-radius:22px; overflow:hidden; border:1px solid #dfdfe4;
  box-shadow:0 1px 2px rgba(12,12,18,.04),0 24px 60px -30px rgba(12,12,18,.3); }
.bp :where(span,div,p,b,strong,i){ color:inherit; }
.bp-page{ position:relative; padding:16px 16px 22px; color:#18181b; font-family:var(--font-sans); }
.bp-glass{ background:var(--glass-bg); border:1px solid var(--glass-line); } /* @eligi:preview-style */
.bp-cover{ position:relative; margin:-16px -16px 0; height:188px; overflow:hidden; }
.bp-wm{ position:absolute; right:-16px; bottom:-40px; font-family:var(--bp-display); font-weight:700; font-size:210px; line-height:1; opacity:.16; pointer-events:none; user-select:none; }
.bp-topbar{ position:absolute; inset:0 0 auto 0; display:flex; justify-content:space-between; padding:16px; }
.bp-round{ width:44px; height:44px; border-radius:50%; display:grid; place-items:center; background:rgba(0,0,0,.35); color:#fff; }
.bp-logo-wrap{ position:relative; z-index:2; margin-top:-48px; width:96px; }
.bp-logo{ width:96px; height:96px; border-radius:28px; overflow:hidden; background:#fff; box-shadow:0 10px 30px rgba(12,12,18,.18); outline:4px solid #fff;
  display:grid; place-items:center; font-family:var(--bp-display); font-size:30px; font-weight:700; background-size:cover; background-position:center; }
.bp-name{ margin:16px 0 0; font-family:var(--bp-display); font-weight:700; font-size:38px; line-height:.98; letter-spacing:-.045em; color:#18181b; overflow-wrap:anywhere; }
.bp-lines{ margin-top:12px; display:flex; flex-direction:column; gap:6px; }
.bp-status{ display:flex; align-items:center; gap:8px; font-size:15px; font-weight:600; }
.bp-dot{ width:10px; height:10px; border-radius:50%; flex:none; }
.bp-loc{ display:flex; align-items:center; gap:8px; font-size:14px; color:#737373; min-width:0; }
.bp-loc span:last-child{ overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.bp-rating{ align-self:flex-start; margin-top:6px; display:inline-flex; align-items:center; gap:6px; height:32px; padding:0 12px; border-radius:999px; font-size:13px; font-weight:600; background:#f0f0f3; color:#4b4b52; }
.bp-rating.has{ height:36px; padding:0 14px; font-size:14px; background:#fff; border:1px solid rgba(0,0,0,.12); color:#111114; }
.bp-rating .st{ color:#f59e0b; }
.bp-rating .mu{ font-weight:400; color:#6b6b73; }
.bp-stats{ margin-top:20px; display:grid; gap:8px; }
.bp-stat{ border-radius:16px; padding:12px; min-width:0; }
.bp-stat b{ display:block; font-family:var(--bp-display); font-size:26px; font-weight:700; line-height:1; letter-spacing:-.04em; color:#18181b; font-variant-numeric:tabular-nums; }
.bp-stat span{ display:block; margin-top:6px; font-size:12.5px; color:#737373; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.bp-actions{ margin-top:16px; display:flex; gap:8px; }
.bp-book{ flex:1; min-height:56px; border-radius:16px; display:grid; place-items:center; font-size:16px; font-weight:700; color:#fff; }
.bp-sq{ width:56px; height:56px; flex:none; border-radius:16px; display:grid; place-items:center; }
.bp-h2{ margin:0; font-family:var(--bp-display); font-size:26px; font-weight:700; letter-spacing:-.04em; color:#18181b; }
.bp-sec{ position:relative; margin-top:32px; }
.bp-gal-head{ display:flex; align-items:baseline; justify-content:space-between; gap:12px; }
.bp-gal-head span{ font-size:13px; font-weight:500; color:#737373; }
.bp-circles{ display:flex; gap:16px; overflow:hidden; padding:8px 0; margin-top:8px; }
.bp-circle{ width:88px; flex:none; display:flex; flex-direction:column; align-items:center; gap:6px; }
.bp-ring{ position:relative; width:84px; height:84px; display:grid; place-items:center; }
.bp-ring > i{ position:absolute; inset:0; border-radius:50%; }
.bp-ring > span{ position:relative; width:72px; height:72px; border-radius:50%; overflow:hidden; background:#e5e5e5 center/cover; box-shadow:0 0 0 3px #fff; }
.bp-circle b{ width:100%; text-align:center; font-size:13px; font-weight:600; color:#18181b; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.bp-circle small{ margin-top:-4px; font-size:11.5px; color:#737373; }
.bp-reel{ position:relative; margin-top:12px; height:128px; border-radius:22px; background:#0c0c12; color:#fff; display:flex; align-items:center; padding:0 20px; overflow:hidden; }
.bp-reel .glow{ position:absolute; right:-40px; top:-64px; width:192px; height:192px; border-radius:50%; opacity:.4; filter:blur(48px); }
.bp-reel .txt{ position:relative; z-index:1; flex:1; min-width:0; }
.bp-reel .txt b{ display:block; font-family:var(--bp-display); font-size:34px; font-weight:700; line-height:1; letter-spacing:-.045em; color:#fff; }
.bp-reel .txt span{ display:block; margin-top:8px; font-size:13.5px; color:rgba(255,255,255,.65); }
.bp-fan{ position:relative; z-index:1; width:118px; height:96px; flex:none; display:grid; place-items:center; }
.bp-fan i{ position:absolute; width:58px; height:78px; border-radius:12px; background:#333 center/cover; box-shadow:0 0 0 2px rgba(255,255,255,.8); }
.bp-fan .play{ position:absolute; z-index:5; width:48px; height:48px; border-radius:50%; display:grid; place-items:center; color:#fff; }
.bp-svcs{ margin-top:12px; display:flex; flex-direction:column; gap:8px; }
.bp-svc{ position:relative; overflow:hidden; border-radius:12px; border:1px solid #e5e5e5; background:rgba(255,255,255,.7); padding:14px 14px 14px 16px; }
.bp-svc .bar{ position:absolute; inset:0 auto 0 0; width:4px; }
.bp-svc .top{ display:flex; justify-content:space-between; gap:12px; align-items:flex-start; }
.bp-svc .nm{ font-family:var(--bp-display); font-weight:700; font-size:14px; color:#18181b; min-width:0; }
.bp-svc .pr{ font-family:var(--bp-display); font-weight:700; font-size:15px; letter-spacing:-.02em; flex:none; font-variant-numeric:tabular-nums; }
.bp-svc .du{ margin-top:4px; font-size:12px; color:#737373; }
.bp-more{ margin-top:2px; font-size:12.5px; color:#737373; }
.bp-note{ margin-top:12px; border-radius:12px; padding:14px; font-size:13px; color:#737373; background:rgba(255,255,255,.6); text-align:center; }
.bp-sections{ margin-top:24px; display:flex; flex-direction:column; gap:12px; }
.bp-acc{ position:relative; border-radius:16px; display:flex; align-items:center; justify-content:space-between; gap:12px; padding:16px 20px; min-height:52px; width:100%; text-align:left; font:inherit; cursor:default; }
.bp-acc.can{ cursor:pointer; }
.bp-acc b{ font-family:var(--bp-display); font-size:11.5px; font-weight:700; letter-spacing:.09em; text-transform:uppercase; color:#737373; }
.bp-acc .r{ display:flex; align-items:center; gap:6px; color:#a3a3a3; }
.bp-acc .hint{ font-size:12px; font-weight:500; color:#a3a3a3; max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.bp-pin{ position:absolute; z-index:6; width:44px; height:44px; padding:0; border:none; background:transparent; display:grid; place-items:center; cursor:pointer; touch-action:manipulation; -webkit-tap-highlight-color:transparent; }
.bp-pin > span{ width:28px; height:28px; border-radius:50%; display:grid; place-items:center; background:#111114; color:#fff; box-shadow:0 2px 10px rgba(12,12,18,.3); }
.bp-pin:focus-visible{ outline:2px solid #dc2626; outline-offset:-4px; border-radius:50%; }
.bp-empty{ display:flex; align-items:center; justify-content:center; gap:7px; width:100%; min-height:48px; margin-top:12px; padding:10px 12px; border-radius:14px; border:1.5px dashed #d4d4d8;
  background:rgba(255,255,255,.55); color:#4b4b52; font:inherit; font-size:13px; font-weight:600; cursor:pointer; }
.bp-empty:hover{ border-color:#a1a1aa; }
.bp-empty:focus-visible, .bp-acc:focus-visible{ outline:2px solid #dc2626; outline-offset:2px; }
.bp-skel{ background:#ececef; border-radius:12px; }
@media (max-width:380px){ .bp-name{ font-size:34px; } }
`

export function BusinessPreview({
  businessName,
  theme,
  logoUrl,
  coverUrl,
  about,
  address,
  city,
  state,
  hasPin = false,
  socials,
  gallery,
  galleryPros = {},
  pros = [],
  live,
  onEditSlot,
}: Props) {
  const primary = theme.primary
  // Mesmo fundo, brilho, textura e cartoes do link (estilo do perfil).
  const pageVars = pageStyleVars(theme.primary, theme.bg, theme.style)
  const cover = coverBackground(coverUrl, primary)
  const watermark = isMonogramCover(coverUrl)
  const ini = initialsOf(businessName)
  const editable = typeof onEditSlot === 'function'
  const edit = (slot: PreviewSlot) => () => onEditSlot?.(slot)

  const aboutText = (about ?? '').trim()
  const addressText = (address ?? '').trim()
  const location = [city, state].filter(Boolean).join(' · ')
  const photos = (gallery ?? []).filter(Boolean)
  const whatsapp = (socials?.whatsapp ?? '').replace(/\D/g, '')
  const hasSocials = !!(socials?.instagram || socials?.whatsapp || socials?.website)
  const team = live?.professionals ?? []
  const services = live?.services ?? []
  const hours = live?.hours ?? []
  const status = live?.status ?? null
  const rating = live?.rating ?? null
  const showBack = live ? live.discoverable !== false : true

  // Numero zerado nao entra, igual ao link.
  const stats = [
    { n: photos.length, one: 'foto', many: 'fotos' },
    { n: team.length, one: 'profissional', many: 'profissionais' },
    { n: services.length, one: 'serviço', many: 'serviços' },
  ].filter((s) => s.n > 0)

  // Galeria: Todos + um circulo por profissional + Espaco (so com fotos de trabalho).
  const proName = new Map(pros.map((p) => [p.id, p.name] as const))
  const byPro = new Map<string, { label: string; cover: string; n: number }>()
  let spaceN = 0
  let spaceCover = ''
  for (const url of photos) {
    const pid = galleryPros[url] ?? null
    const name = pid ? proName.get(pid) : undefined
    if (pid && name) {
      const g = byPro.get(pid)
      if (g) g.n++
      else byPro.set(pid, { label: firstName(name), cover: url, n: 1 })
    } else {
      spaceN++
      if (!spaceCover) spaceCover = url
    }
  }
  const groups = [
    { key: 'all', label: 'Todos', cover: photos[0] ?? '', n: photos.length },
    ...[...byPro.entries()].map(([k, g]) => ({ key: k, ...g })),
    ...(spaceN > 0 && byPro.size > 0 ? [{ key: 'space', label: 'Espaço', cover: spaceCover, n: spaceN }] : []),
  ]
  const workN = photos.length - spaceN
  const reelSub = workN === 0 ? 'do espaço, em tela cheia' : workN === photos.length ? 'trabalhos da equipe, em tela cheia' : 'trabalhos e espaço, em tela cheia'
  const fan = photos.slice(0, 3)

  const ratingCount = rating?.count ?? 0
  const ratingAvg = rating?.average ?? null

  const SHOW_SVCS = 3
  const shownSvcs = services.slice(0, SHOW_SVCS)

  const acc = (title: string, slot: PreviewSlot | null, hint?: string) => {
    const content = (
      <>
        <b>{title}</b>
        <span className="r">{hint && <span className="hint">{hint}</span>}{slot && editable ? <Pencil size={15} aria-hidden /> : ICON_CHEVRON}</span>
      </>
    )
    return slot && editable ? (
      <button type="button" className="bp-acc bp-glass can" onClick={edit(slot)} aria-label={`Mudar ${title.toLowerCase()}`}>{content}</button>
    ) : (
      <div className="bp-acc bp-glass">{content}</div>
    )
  }

  return (
    <div className="bp">
      <style>{CSS}</style>
      <div
        className="bp-page"
        style={{
          ...(pageVars as React.CSSProperties),
          backgroundColor: 'var(--background)',
          backgroundImage: 'var(--page-tex), var(--page-glow)',
          backgroundSize: 'var(--page-tex-size), auto',
          backgroundRepeat: 'repeat, no-repeat',
        }}
      >
        {/* CAPA */}
        <div className="bp-cover" style={{ background: cover.background }}>
          {watermark && <div className="bp-wm" aria-hidden style={{ color: primary }}>{ini.slice(0, 1)}</div>}
          <div className="bp-topbar" aria-hidden>
            {showBack ? <span className="bp-round">{ICON_BACK}</span> : <span />}
            <span className="bp-round">{ICON_SHARE}</span>
          </div>
          {editable && <EditPin onClick={edit('cover')} label="Mudar capa" style={{ right: 66, top: 16 }} />}
        </div>

        {/* LOGO */}
        <div className="bp-logo-wrap">
          <div
            className="bp-logo"
            style={logoUrl ? { backgroundImage: `url("${logoUrl}")`, color: primary } : { color: primary }}
            role="img"
            aria-label={logoUrl ? 'Logo' : `Iniciais ${ini}`}
          >
            {!logoUrl && ini}
          </div>
          {editable && <EditPin onClick={edit('logo')} label="Mudar logo" style={{ right: -22, bottom: -14 }} />}
        </div>

        <h3 className="bp-name">{businessName}</h3>

        <div className="bp-lines">
          {status && (
            <div className="bp-status" style={{ color: status.open ? '#0f6e56' : '#b45309' }}>
              <span className="bp-dot" style={{ background: status.open ? '#16a34a' : '#f59e0b' }} />
              <span>{statusLine(status)}</span>
            </div>
          )}
          {location && (
            <div className="bp-loc">
              <span style={{ color: primary, display: 'flex' }}>{ICON_PIN}</span>
              <span>{location}</span>
            </div>
          )}
          {live !== undefined && (
            ratingCount === 0 || ratingAvg === null ? (
              <span className="bp-rating"><span className="st">★</span> Novo
                {ratingCount > 0 && <span className="mu">· {ratingCount} {ratingCount === 1 ? 'avaliação' : 'avaliações'}</span>}
              </span>
            ) : (
              <span className="bp-rating has">
                <span className="st">★</span>
                <span>{ratingAvg.toFixed(1).replace('.', ',')}</span>
                <span className="mu">· {ratingCount} avaliações ›</span>
              </span>
            )
          )}
        </div>

        {stats.length > 0 && (
          <div className="bp-stats" style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}>
            {stats.map((s) => (
              <div key={s.many} className="bp-stat bp-glass">
                <b>{s.n}</b>
                <span>{s.n === 1 ? s.one : s.many}</span>
              </div>
            ))}
          </div>
        )}
        {live === undefined && <div className="bp-skel" style={{ height: 62, marginTop: 20 }} aria-hidden />}

        <div className="bp-actions" style={{ position: 'relative' }}>
          <span className="bp-book" style={{ background: primary, boxShadow: `0 10px 24px color-mix(in srgb, ${primary} 30%, transparent)` }}>Agendar horário</span>
          {whatsapp && <span className="bp-sq bp-glass" style={{ color: '#15803d' }} aria-hidden>{ICON_WHATSAPP}</span>}
          {hasPin && <span className="bp-sq bp-glass" style={{ color: '#18181b' }} aria-hidden>{ICON_ROUTE}</span>}
          {editable && <EditPin onClick={edit('appearance')} label="Mudar cores" style={{ left: -6, top: -14 }} />}
        </div>

        {/* GALERIA */}
        {photos.length > 0 ? (
          <section className="bp-sec">
            <div className="bp-gal-head">
              <h4 className="bp-h2">Galeria</h4>
              <span>toque para ver</span>
            </div>
            <div className="bp-circles">
              {groups.map((g) => (
                <div key={g.key} className="bp-circle">
                  <span className="bp-ring">
                    <i style={{ background: `conic-gradient(${primary}, #f59e0b, ${primary})` }} />
                    <span style={{ backgroundImage: g.cover ? `url("${g.cover}")` : undefined }} />
                  </span>
                  <b>{g.label}</b>
                  <small>{g.n} {g.n === 1 ? 'foto' : 'fotos'}</small>
                </div>
              ))}
            </div>
            <div className="bp-reel">
              <span className="glow" style={{ background: primary }} aria-hidden />
              <div className="txt">
                <b>{photos.length} {photos.length === 1 ? 'foto' : 'fotos'}</b>
                <span>{reelSub}</span>
              </div>
              <div className="bp-fan" aria-hidden>
                {fan.map((url, i) => (
                  <i
                    key={`${i}-${url.slice(-16)}`}
                    style={{
                      backgroundImage: `url("${url}")`,
                      zIndex: i === 1 || fan.length === 1 ? 3 : 1,
                      transform: fan.length === 1 ? undefined : i === 0 ? 'rotate(-14deg) translateX(-30px)' : i === 2 ? 'rotate(12deg) translateX(30px)' : undefined,
                    }}
                  />
                ))}
                <span className="play" style={{ background: primary }}>{ICON_PLAY}</span>
              </div>
            </div>
            {editable && <EditPin onClick={edit('photos')} label="Mudar fotos" style={{ left: 112, top: -8 }} />}
          </section>
        ) : (
          editable && <EmptySlot onClick={edit('photos')} label="Adicionar fotos (a Galeria aparece aqui)" />
        )}

        {/* SERVICOS (vem do link, nao se edita aqui) */}
        <section className="bp-sec">
          <h4 className="bp-h2">Escolha um serviço</h4>
          {live === undefined && (
            <div className="bp-svcs" aria-hidden>
              {[0, 1].map((i) => <div key={i} className="bp-skel" style={{ height: 64 }} />)}
            </div>
          )}
          {live === null && <div className="bp-note">Não foi possível carregar seus serviços agora.</div>}
          {live && services.length === 0 && <div className="bp-note">Nenhum serviço no link ainda.</div>}
          {live && shownSvcs.length > 0 && (
            <div className="bp-svcs">
              {shownSvcs.map((s) => (
                <div key={s.id} className="bp-svc">
                  <span className="bar" style={{ background: primary }} aria-hidden />
                  <div className="top">
                    <span className="nm">{s.name}</span>
                    <span className="pr" style={{ color: primary }}>{priceLabel(s.price, s.priceMode)}</span>
                  </div>
                  <div className="du">{durationLabel(s.duration)}</div>
                </div>
              ))}
              {services.length > SHOW_SVCS && (
                <div className="bp-more">+ {services.length - SHOW_SVCS} {services.length - SHOW_SVCS === 1 ? 'serviço' : 'serviços'}</div>
              )}
            </div>
          )}
        </section>

        {/* SECOES RECOLHIDAS — como no link */}
        <div className="bp-sections">
          {aboutText
            ? acc('Sobre', 'about', aboutText)
            : editable && <EmptySlot onClick={edit('about')} label="Adicionar o Sobre" />}
          {addressText || hasPin || hours.length > 0
            ? acc('Endereço & horários', 'address', addressText || undefined)
            : editable && <EmptySlot onClick={edit('address')} label="Adicionar endereço" />}
          {team.length > 0 || hasSocials
            ? acc('Equipe e contatos', 'socials')
            : editable && <EmptySlot onClick={edit('socials')} label="Adicionar contatos" />}
        </div>
      </div>
    </div>
  )
}

export default BusinessPreview
