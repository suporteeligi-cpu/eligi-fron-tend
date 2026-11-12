// src/app/dashboard/financeiro/comissoes/components/my/mcStyles.ts
// @eligi:mc-d-css — direcao D "Central" (nov/2026) da tela do profissional.
//
// Um bloco de CSS, layout por @media (nunca isMobile). Todo span/div/b herda a
// cor: o globals.css pinta `main span` de cinza (@eligi:doc-main-span).
// Selecionado = grafite #111114; vermelho so no foco de teclado.
// A janela de modulo vai por portal no <body>, entao tem bloco proprio (.mcw).

import { typography } from '@/shared/theme'

export const INK = '#111114'
export const MUTED = 'rgba(0,0,0,0.5)'
export const FAINT = 'rgba(0,0,0,0.45)'
export const TRACK = '#f0f0f3'
export const OK = '#0f6e56'
export const WARN = '#b45309'
export const BAD = '#a32d2d'

const base = `
:where(.mc-page,.mcw) *{box-sizing:border-box}
.mc-page :where(span,div,b,i,small,p,li),.mcw :where(span,div,b,i,small,p,li){color:inherit} /* 0,1,0 vence main span (0,0,2) */
:where(.mc-page,.mcw) button{font-family:inherit;color:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
:where(.mc-page,.mcw) button:disabled{cursor:not-allowed;opacity:.4}
:where(.mc-page,.mcw) button:focus-visible{outline:2px solid #dc2626;outline-offset:2px}
.mc-num{font-family:${typography.fontFamilyDisplay};font-variant-numeric:tabular-nums;letter-spacing:-.035em;white-space:nowrap}
.mc-mono{font-family:${typography.fontFamilyMono};font-variant-numeric:tabular-nums}
.mc-cents{font-size:.56em;color:${FAINT};letter-spacing:-.01em}
.mc-eyebrow{font-family:${typography.fontFamilyDisplay};font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.09em;color:${FAINT}}
.mc-mut{color:${MUTED}}
.mc-fnt{color:${FAINT}}
.mc-ell{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mc-min0{min-width:0}
.mc-row{display:flex;align-items:center;gap:12px}
.mc-chip{display:inline-flex;align-items:center;gap:5px;height:24px;padding:0 9px;border-radius:999px;font-size:12px;font-weight:600;white-space:nowrap}
.mc-chip.ok{color:${OK};background:rgba(29,158,117,.12)}
.mc-chip.warn{color:${WARN};background:rgba(245,158,11,.12)}
.mc-chip.neu{color:#64748b;background:rgba(100,116,139,.10)}
.mc-card{background:#fff;border:.5px solid rgba(0,0,0,.11);border-radius:16px;box-shadow:0 1px 2px rgba(0,0,0,.04)}
.mc-sk{background:linear-gradient(90deg,#ececf0 0%,#f6f6f8 50%,#ececf0 100%);background-size:200% 100%;animation:mc-sk 1.2s linear infinite;border-radius:8px}
@keyframes mc-sk{to{background-position:-200% 0}}
@keyframes mc-fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes mc-up{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
@keyframes mc-in{from{opacity:0}to{opacity:1}}
@media (prefers-reduced-motion:reduce){.mc-sk{animation:none}.mc-page,.mcw-sheet,.mcw-scrim{animation:none!important}}
.mc-state{padding:40px 22px;text-align:center}
.mc-state .ico{width:52px;height:52px;border-radius:16px;background:${TRACK};display:grid;place-items:center;margin:0 auto 14px;color:${INK}}
.mc-state h3{font-family:${typography.fontFamilyDisplay};font-size:18px;font-weight:600;letter-spacing:-.025em;margin:0 0 6px;color:${INK}}
.mc-state p{font-size:14px;color:${MUTED};margin:0 auto;max-width:340px;line-height:1.45}
.mc-btn{min-height:44px;padding:0 18px;border-radius:12px;border:0;font-weight:600;font-size:14px;background:${INK};color:#fff}
.mc-btn span{color:#fff}
`

const page = `
.mc-page{max-width:1100px;font-family:${typography.fontFamily};color:${INK};animation:mc-fade .25s ease}
@media (max-width:599px){.mc-page{margin:-14px -16px 0}}
.mc-top{display:grid;gap:10px;margin-bottom:12px}
.mc-h1{display:none;margin:0;font-family:${typography.fontFamilyDisplay};font-weight:600;font-size:28px;letter-spacing:-.04em;line-height:1.1;color:${INK}}
@media (min-width:1024px){.mc-top{grid-template-columns:1fr auto;align-items:end;margin-bottom:16px}.mc-h1{display:block}}
.mc-seg{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:2px;padding:3px;background:${TRACK};border-radius:12px}
.mc-seg button{min-height:44px;border:0;border-radius:9px;background:transparent;font-size:13px;font-weight:500;color:${MUTED};padding:0 6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mc-seg button[aria-selected=true]{background:${INK};color:#fff;font-weight:600}
.mc-seg button[aria-selected=true] span{color:#fff}
.mc-seg .s{display:none}
@media (max-width:399px){.mc-seg .l{display:none}.mc-seg .s{display:inline}}
@media (min-width:1024px){.mc-seg{display:inline-grid;grid-template-columns:repeat(3,auto)}.mc-seg button{padding:0 16px;min-height:40px}}
.mc-grid{display:grid;gap:12px;grid-template-columns:minmax(0,1fr)}
@media (min-width:768px){.mc-grid{grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:stretch}}
.mc-hero{padding:16px 16px 14px;min-width:0}
.mc-hero-h{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
.mc-big{font-size:clamp(36px,12vw,52px);font-weight:600;line-height:1;margin:6px 0 10px;color:${INK}}
@media (min-width:768px){.mc-big{font-size:48px}}
.mc-meta{display:flex;flex-wrap:wrap;gap:6px 8px;align-items:center}
.mc-track{display:grid;gap:3px;margin-top:14px}
.mc-track i{height:6px;border-radius:3px;background:${TRACK}}
.mc-track i.p{background:${INK}}
.mc-track i.t{background:${INK};opacity:.35}
.mc-cap{font-size:12px;color:${FAINT};margin-top:7px}
.mc-tiles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;min-width:0}
@media (min-width:768px){.mc-tiles{grid-template-columns:repeat(2,minmax(0,1fr))}}
.mc-tile{display:flex;flex-direction:column;align-items:flex-start;gap:3px;min-height:84px;padding:12px;border-radius:14px;border:.5px solid rgba(0,0,0,.11);background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.04);text-align:left;min-width:0}
.mc-tile:hover{border-color:rgba(0,0,0,.2)}
.mc-ti{width:34px;height:34px;border-radius:10px;background:${TRACK};display:grid;place-items:center;color:${INK};margin-bottom:4px;flex-shrink:0}
.mc-tl1{font-size:13.5px;font-weight:600;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:${INK}}
.mc-tl2{font-size:11.5px;color:${FAINT};max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mc-tl2 .mc-num{font-size:12px;letter-spacing:-.01em}
.mc-tl2 .mc-warn{color:${WARN};font-weight:600}
@media (max-width:429px){.mc-wide{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}}
@media (max-width:359px){.mc-tile{min-height:76px;padding:10px}.mc-ti{width:30px;height:30px}}
@media (max-height:700px) and (max-width:767px){.mc-top{margin-bottom:8px}.mc-hero{padding:12px 14px}.mc-big{margin:4px 0 8px}.mc-track{margin-top:10px}.mc-tiles{gap:6px}.mc-tile{min-height:70px;padding:9px 10px;gap:1px}.mc-ti{width:28px;height:28px;margin-bottom:3px}.mc-ti svg{width:17px;height:17px}.mc-seg button{min-height:42px}}
`

const win = `
.mcw{font-family:${typography.fontFamily};color:${INK}}
.mcw-scrim{position:fixed;inset:0;background:rgba(0,0,0,.18);z-index:900;animation:mc-in .18s ease}
.mcw-sheet{position:fixed;z-index:901;left:0;right:0;top:var(--navbar-offset,104px);bottom:calc(var(--bottom-nav-h,0px) + env(safe-area-inset-bottom,0px));background:#f5f5f7;border-radius:20px 20px 0 0;display:flex;flex-direction:column;box-shadow:0 -8px 30px rgba(0,0,0,.12);overflow:hidden;animation:mc-up .26s cubic-bezier(.22,1,.36,1)}
@media (min-width:768px){.mcw-sheet{left:calc(var(--sidebar-width,0px) + (100% - var(--sidebar-width,0px)) / 2);right:auto;width:min(720px,calc(100% - var(--sidebar-width,0px) - 48px));transform:translateX(-50%);top:120px;bottom:calc(var(--bottom-nav-h,0px) + env(safe-area-inset-bottom,0px) + 16px);border-radius:20px;animation:mc-in .2s ease}}
@media (min-width:1024px){.mcw-sheet{bottom:40px}}
.mcw-h{display:flex;align-items:center;gap:12px;padding:12px 12px 10px 16px;background:#fff;border-bottom:.5px solid rgba(0,0,0,.07)}
.mcw-t{font-family:${typography.fontFamilyDisplay};font-size:18px;font-weight:600;letter-spacing:-.025em;margin:0;color:${INK}}
.mcw-ib{width:44px;height:44px;border-radius:12px;border:0;background:${TRACK};display:grid;place-items:center;flex-shrink:0;color:${INK}}
.mcw-tabs{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));background:#fff;border-bottom:.5px solid rgba(0,0,0,.11);padding:0 4px}
.mcw-tabs button{min-height:52px;border:0;background:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;font-size:11px;font-weight:500;color:${MUTED};border-bottom:2px solid transparent;margin-bottom:-.5px;min-width:0;padding:0 2px}
.mcw-tabs button span{max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mcw-tabs button[aria-selected=true]{color:${INK};font-weight:600;border-bottom-color:${INK}}
.mcw-body{flex:1;overflow:auto;padding:12px 16px 16px;overscroll-behavior:contain}
@media (max-width:340px){.mcw-body{padding:12px 12px 16px}}
.mcw-card{background:#fff;border:.5px solid rgba(0,0,0,.11);border-radius:14px;overflow:hidden}
.mcw-card + .mcw-card{margin-top:10px}
.mcw-sum{display:flex;justify-content:space-between;align-items:center;padding:10px 4px 0;font-size:13px}
.mcw-empty{padding:32px 18px;text-align:center;font-size:14px;color:${MUTED}}
.mcw-empty b{display:block;font-family:${typography.fontFamilyDisplay};font-size:16px;font-weight:600;color:${INK};margin-bottom:4px}
.mcw-chips{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin-bottom:10px;padding-bottom:2px}
.mcw-chips::-webkit-scrollbar{display:none}
.mcw-dchip{flex-shrink:0;min-height:52px;padding:6px 12px;border-radius:12px;border:.5px solid rgba(0,0,0,.11);background:#fff;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:1px;font-size:12px;color:${MUTED}}
.mcw-dchip b{font-size:15px;color:${INK};font-weight:600}
.mcw-dchip[aria-selected=true]{background:${INK};border-color:${INK};color:rgba(255,255,255,.72)}
.mcw-dchip[aria-selected=true] b{color:#fff}
.mcw-line{display:grid;grid-template-columns:44px minmax(0,1fr) auto;gap:10px;align-items:center;padding:11px 16px;border-bottom:.5px solid rgba(0,0,0,.07)}
.mcw-line:last-child{border-bottom:0}
.mcw-line .tm{font-size:12px;color:${FAINT}}
.mcw-line .nm{font-size:14px;font-weight:500}
.mcw-line .why{font-size:12px;color:${FAINT};margin-top:2px}
.mcw-line .v{font-size:15px;font-weight:600;text-align:right}
.mcw-line .calc{display:block;font-family:${typography.fontFamily};font-size:11px;font-weight:500;color:${FAINT};letter-spacing:0;white-space:nowrap;margin-top:2px}
.mcw-tag{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:#2563eb}
.mcw-svc{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 10px;align-items:center;padding:12px 16px;border-top:.5px solid rgba(0,0,0,.07);min-height:56px}
.mcw-svc:first-child{border-top:0}
.mcw-svc .bar{grid-column:1/-1;height:4px;border-radius:2px;background:${TRACK};overflow:hidden}
.mcw-svc .bar i{display:block;height:100%;background:${INK}}
.mcw-paid{display:flex;align-items:center;gap:12px;padding:12px 16px;border-top:.5px solid rgba(0,0,0,.07)}
.mcw-paid:first-child{border-top:0}
.mcw-paid .ck{width:32px;height:32px;border-radius:10px;background:rgba(29,158,117,.12);display:grid;place-items:center;flex-shrink:0;color:#16A34A}
.mcw-bars{display:flex;align-items:flex-end;gap:var(--bg,4px);height:120px}
.mcw-bars>div{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:flex-end;height:100%}
.mcw-bars .b{border-radius:3px 3px 0 0;background:${INK};min-height:2px}
.mcw-bars .b.f{background:${TRACK}}
.mcw-bars .b.lo{opacity:.28}
.mcw-bx{display:flex;gap:var(--bg,4px);margin-top:6px}
.mcw-bx span{flex:1;min-width:0;text-align:center;font-size:11px;color:${FAINT};white-space:nowrap}
.mcw-kpis{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px;margin-top:10px}
.mcw-kpi{padding:12px 14px;background:#fff;border:.5px solid rgba(0,0,0,.11);border-radius:14px;min-width:0}
.mcw-kpi .v{font-size:20px;font-weight:600;margin-top:6px;line-height:1.05}
.mcw-kpi .h{font-size:12px;color:${FAINT};margin-top:4px}
/* comparar */
.mcw-cmpw{position:relative}
.mcw-cmpsel{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:8px;align-items:center}
.mcw-msel{display:flex;align-items:center;gap:8px;min-height:56px;padding:8px 10px;border-radius:12px;border:.5px solid rgba(0,0,0,.14);background:#fff;text-align:left;min-width:0}
.mcw-msel b{display:block;font-family:${typography.fontFamilyDisplay};font-size:16px;font-weight:600;letter-spacing:-.02em;white-space:nowrap;color:${INK}}
.mcw-msel>svg{margin-left:auto;flex-shrink:0;color:${FAINT}}
.mcw-msel[aria-expanded=true]{border-color:${INK};box-shadow:0 0 0 1px ${INK}}
.mcw-sw{width:10px;height:10px;border-radius:3px;flex-shrink:0}
.mcw-sw.a{background:#fff;border:2px dashed #9a9aa3}
.mcw-sw.b{background:${INK}}
.mcw-vs{font-family:${typography.fontFamilyDisplay};color:${FAINT};font-weight:600}
.mcw-pick{position:absolute;left:0;right:0;top:64px;z-index:5;background:#fff;border:.5px solid ${INK};border-radius:14px;padding:10px 12px 12px;box-shadow:0 10px 30px rgba(0,0,0,.12)}
.mcw-mgrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin-top:8px}
.mcw-mgrid button{min-height:44px;border-radius:10px;border:0;background:${TRACK};font-size:13px;font-weight:500}
.mcw-mgrid button[aria-pressed=true]{background:${INK};color:#fff;font-weight:600}
.mcw-pchip{flex-shrink:0;min-height:40px;padding:0 12px;border-radius:999px;border:.5px solid rgba(0,0,0,.14);background:#fff;font-size:12.5px;font-weight:500;white-space:nowrap}
.mcw-pchip[aria-pressed=true]{background:${INK};border-color:${INK};color:#fff}
.mcw-lg{display:inline-block;width:14px;height:0;border-top:2.4px solid ${INK};vertical-align:middle;margin:0 4px 0 8px}
.mcw-lg.a{border-top:2px dashed #9a9aa3}
.mcw-ctab .ch,.mcw-ctab .cr{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr) minmax(0,1fr) 48px;gap:6px;align-items:center;padding:9px 14px}
.mcw-ctab .ch{font-family:${typography.fontFamilyDisplay};font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:${FAINT};border-bottom:.5px solid rgba(0,0,0,.07)}
.mcw-ctab .cr{border-bottom:.5px solid rgba(0,0,0,.07);min-height:40px;padding-top:7px;padding-bottom:7px}
.mcw-ctab .cr:last-child{border-bottom:0}
.mcw-ctab .cr>span:nth-child(n+2),.mcw-ctab .ch>span:nth-child(n+2){text-align:right}
.mcw-ctab .cr .mc-num{font-size:13.5px;font-weight:600}
@media (max-width:359px){.mcw-ctab .ch,.mcw-ctab .cr{padding:9px 10px;gap:4px;grid-template-columns:minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) 40px}.mcw-ctab .cr .mc-num{font-size:12.5px}}
.mcw-dlt{font-size:12px;font-weight:600;white-space:nowrap}
.mcw-dlt.up{color:${OK}}.mcw-dlt.dn{color:${BAD}}
`

export const MC_CSS = base + page + win
