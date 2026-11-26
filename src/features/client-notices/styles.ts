// src/features/client-notices/styles.ts
// @eligi:cnot-styles — CSS da tela Promocoes e avisos (direcao A "Tres abas", nov/2026).
// Fundo claro, selecionado em grafite, vermelho so no botao de enviar.

import { typography } from '@/shared/theme'

export const INK = '#111114'
export const INK_2 = '#4b4b52'
export const INK_3 = '#6b6b73'

export const CSS = `
.cpm{ max-width:1080px; font-family:${typography.fontFamily}; color:${INK}; }
.cpm *{ box-sizing:border-box; }
.cpm :where(span, div, b, i, p, h1, h2, h3, strong, small, label){ color:inherit; } /* vence main span */
.cpm a{ text-decoration:none; color:inherit; }
.cpm button{ font-family:inherit; cursor:pointer; -webkit-tap-highlight-color:transparent; }
.cpm a:focus-visible, .cpm button:focus-visible, .cpm input:focus-visible, .cpm textarea:focus-visible{ outline:2px solid #dc2626; outline-offset:2px; }
.cpm-eyebrow{ font-family:${typography.fontFamilyMono}; font-size:11px; letter-spacing:.08em; text-transform:uppercase; color:${INK_3}; }
.cpm-top{ display:flex; align-items:flex-start; gap:12px; flex-wrap:wrap; }
.cpm-h1{ margin:2px 0 0; font-size:28px; font-weight:600; font-family:${typography.fontFamilyDisplay}; letter-spacing:-.03em; }
.cpm-week{ font-family:${typography.fontFamilyMono}; font-size:11px; letter-spacing:.05em; text-transform:uppercase; border-radius:99px; padding:4px 10px; margin-top:10px; background:#f2f2f5; color:${INK_2}; }
.cpm-week.used{ background:#fffbeb; color:#b45309; }
.cpm-lead{ margin:12px 0 0; font-size:14px; line-height:1.45; color:${INK_3}; max-width:620px; }
.cpm-auto{ display:inline-flex; align-items:center; gap:2px; min-height:44px; font-size:13.5px; font-weight:500; color:${INK_2}; margin-top:4px; background:none; border:0; padding:0; }
.cpm-cap{ font-family:${typography.fontFamilyMono}; font-size:11px; letter-spacing:.07em; text-transform:uppercase; color:${INK_3}; }

.cpm-tabs{ display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:4px; background:#e9e9ee; border-radius:14px; padding:4px; margin-top:14px; max-width:520px; }
.cpm-tab{ min-height:44px; border:0; border-radius:11px; background:transparent; color:${INK_2}; font-size:14px; font-weight:500; }
.cpm-tab[aria-selected="true"]{ background:#fff; color:${INK}; font-weight:600; box-shadow:0 1px 3px rgba(17,17,20,.1); }

.cpm-grid{ display:grid; grid-template-columns:minmax(0,1fr); gap:12px; margin-top:16px; }
@media (min-width:760px){ .cpm-grid{ grid-template-columns:repeat(2,minmax(0,1fr)); } }
.cpm-card{ background:#fff; border:1px solid #ececf0; border-radius:18px; padding:16px; display:flex; flex-direction:column; gap:10px; }
.cpm-card h2{ margin:0; font-size:19px; font-weight:600; font-family:${typography.fontFamilyDisplay}; letter-spacing:-.02em; }
.cpm-bub{ background:#f5f5f7; border-radius:14px; padding:10px 12px; font-size:13px; line-height:1.45; }
.cpm-bub b{ display:block; font-weight:600; }
.cpm-foot{ display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.cpm-n{ font-size:13px; color:#0f6e56; }
.cpm-n.zero{ color:${INK_3}; }
.cpm-btn{ min-height:44px; padding:0 16px; border-radius:12px; font-size:14px; font-weight:600; display:inline-flex; align-items:center; justify-content:center; gap:6px; }
.cpm-btn.pri{ background:${INK}; border:0; color:#fff; }
.cpm-btn.sec{ background:#fff; border:1px solid #dcdce2; color:${INK}; }
.cpm-btn.send{ background:#dc2626; border:0; color:#fff; min-height:52px; padding:0 22px; }
.cpm-btn:disabled{ opacity:.45; cursor:default; }
.cpm-sp{ flex:1; }
.cpm-zero{ margin-top:12px; }

.cpm-form{ display:grid; grid-template-columns:minmax(0,1fr); gap:16px; margin-top:16px; }
@media (min-width:1000px){ .cpm-form{ grid-template-columns:minmax(0,1fr) 320px; align-items:start; } .cpm-side{ position:sticky; top:120px; } }
.cpm-col{ display:flex; flex-direction:column; gap:12px; min-width:0; }
.cpm-sec{ background:#fff; border:1px solid #ececf0; border-radius:18px; padding:16px; display:flex; flex-direction:column; gap:10px; }
.cpm-chips{ display:flex; gap:8px; flex-wrap:wrap; }
.cpm-chip{ min-height:44px; padding:0 14px; border-radius:99px; border:1px solid #dcdce2; background:#fff; font-size:13.5px; font-weight:500; color:${INK}; }
.cpm-chip[aria-pressed="true"]{ background:${INK}; border-color:${INK}; color:#fff; }
.cpm-ok{ font-size:14px; border-radius:10px; padding:8px 12px; background:#ecfdf5; color:#0f6e56; }
.cpm-ok.zero{ background:#f7f7f9; color:${INK_2}; }
.cpm-in{ display:flex; align-items:center; border:1px solid #dcdce2; border-radius:12px; padding:0 12px; min-height:48px; }
.cpm-in:focus-within{ border-color:${INK}; }
.cpm-in span{ color:${INK_3}; font-size:16px; white-space:nowrap; flex-shrink:0; max-width:45%; overflow:hidden; text-overflow:ellipsis; }
.cpm-in input{ flex:1; min-width:0; border:0; outline:0; font:inherit; font-size:16px; color:${INK}; background:transparent; padding:12px 0 12px 4px; }
.cpm-ta{ width:100%; border:1px solid #dcdce2; border-radius:12px; padding:12px; font:inherit; font-size:16px; line-height:1.45; color:${INK}; resize:vertical; min-height:88px; }
.cpm-ta:focus{ outline:0; border-color:${INK}; }
.cpm-dt{ border:1px solid #dcdce2; border-radius:12px; min-height:48px; padding:0 12px; font:inherit; font-size:16px; color:${INK}; background:#fff; max-width:100%; }
.cpm-row{ display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
.cpm-count{ margin-left:auto; font-family:${typography.fontFamilyMono}; font-size:11px; color:${INK_3}; }
.cpm-count.over{ color:#b45309; }
.cpm-note{ font-size:12.5px; color:${INK_3}; line-height:1.45; margin:0; }
.cpm-err{ padding:10px 12px; border-radius:12px; background:#fffbeb; color:#7a4a0f; font-size:13px; line-height:1.4; }
.cpm-notif{ background:#e9e9ee; border-radius:20px; padding:12px 14px; display:flex; gap:10px; }
.cpm-notif .ic{ width:34px; height:34px; border-radius:9px; background:${INK}; flex-shrink:0; }
.cpm-notif b{ display:block; font-size:13.5px; font-weight:600; }
.cpm-notif p{ margin:2px 0 0; font-size:13.5px; color:#3a3a40; line-height:1.4; }
.cpm-banner{ border:1px solid #ececf0; background:#fff; border-radius:14px; padding:10px 12px; display:flex; gap:10px; align-items:flex-start; font-size:13px; line-height:1.4; }
.cpm-banner .bar{ width:4px; align-self:stretch; border-radius:2px; background:${INK}; flex-shrink:0; }
.cpm-banner b{ display:block; font-weight:600; font-size:13.5px; }

.cpm-pin{ display:flex; align-items:center; gap:12px; }
.cpm-pin .txt{ flex:1; min-width:0; }
.cpm-pin .txt b{ display:block; font-size:15px; font-weight:600; }
.cpm-pin .txt small{ display:block; font-size:13px; color:${INK_3}; margin-top:2px; line-height:1.4; }
.cpm-sw{ width:52px; height:32px; border-radius:16px; border:0; background:#d4d4da; position:relative; flex-shrink:0; padding:0; }
.cpm-sw::after{ content:''; position:absolute; top:3px; left:3px; width:26px; height:26px; border-radius:13px; background:#fff; transition:left .18s ease; box-shadow:0 1px 2px rgba(17,17,20,.2); }
.cpm-sw[aria-checked="true"]{ background:${INK}; }
.cpm-sw[aria-checked="true"]::after{ left:23px; }
@media (prefers-reduced-motion: reduce){ .cpm-sw::after{ transition:none; } }

.cpm-reach{ display:flex; flex-direction:column; gap:10px; }
.cpm-reach h3{ margin:0; font-size:15px; font-weight:600; }
.cpm-rbar{ display:flex; height:8px; border-radius:4px; overflow:hidden; gap:2px; background:#f2f2f5; }
.cpm-rbar span{ display:block; min-width:0; }
.cpm-rnums{ display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; }
.cpm-rnums div{ display:flex; flex-direction:column; min-width:0; }
.cpm-rnums b{ font-family:${typography.fontFamilyDisplay}; font-size:22px; font-weight:600; letter-spacing:-.02em; font-variant-numeric:tabular-nums; }
.cpm-rnums small{ font-size:12px; line-height:1.3; }
.cpm-link{ display:inline-flex; align-items:center; gap:2px; min-height:44px; font-size:14px; font-weight:500; color:${INK}; background:none; border:0; padding:0; text-align:left; }

.cpm-hist{ margin-top:28px; display:flex; flex-direction:column; gap:8px; }
.cpm-list{ background:#fff; border:1px solid #ececf0; border-radius:16px; overflow:hidden; }
.cpm-li{ display:flex; align-items:center; gap:12px; padding:12px 14px; flex-wrap:wrap; }
.cpm-li + .cpm-li{ border-top:1px solid #f0f0f3; }
.cpm-li .t{ flex:1; min-width:180px; }
.cpm-li .t b{ display:block; font-size:14px; font-weight:600; }
.cpm-li .t small{ display:block; font-size:12.5px; color:${INK_3}; margin-top:1px; }
.cpm-st{ font-size:12px; font-weight:600; border-radius:99px; padding:3px 9px; background:#f2f2f5; color:${INK_2}; white-space:nowrap; }
.cpm-st.sent{ background:#ecfdf5; color:#0f6e56; }
.cpm-st.sched{ background:#fffbeb; color:#b45309; }
.cpm-st.pin{ background:${INK}; color:#fff; }
.cpm-empty{ padding:16px; font-size:13.5px; color:${INK_3}; }
.cpm-skel{ height:120px; border-radius:18px; background:#f2f2f5; margin-top:12px; }
.cpm-box{ margin-top:22px; padding:16px; border-radius:16px; background:#fff; border:1px solid #ececf0; font-size:14px; color:${INK_2}; display:flex; gap:10px; align-items:flex-start; }

.cpm-al{ display:flex; flex-direction:column; gap:12px; margin-top:16px; max-width:760px; }
.cpm-group{ display:flex; gap:12px; align-items:flex-start; padding:12px 0; }
.cpm-group + .cpm-group{ border-top:1px solid #f0f0f3; }
.cpm-group .dot{ width:10px; height:10px; border-radius:5px; margin-top:6px; flex-shrink:0; }
.cpm-group .g{ flex:1; min-width:0; }
.cpm-group .g b{ display:block; font-size:14.5px; font-weight:600; }
.cpm-group .g small{ display:block; font-size:13px; color:${INK_3}; line-height:1.4; margin-top:2px; }
.cpm-group .num{ font-family:${typography.fontFamilyDisplay}; font-size:20px; font-weight:600; font-variant-numeric:tabular-nums; }
.cpm-search{ width:100%; font:inherit; font-size:16px; min-height:48px; border:1px solid #dcdce2; border-radius:12px; padding:0 12px; color:${INK}; background:#fff; }
.cpm-search:focus{ outline:0; border-color:${INK}; }
.cpm-person{ display:flex; align-items:center; gap:10px; padding:10px 0; }
.cpm-person + .cpm-person{ border-top:1px solid #f0f0f3; }
.cpm-person .p{ flex:1; min-width:0; }
.cpm-person .p b{ display:block; font-size:14.5px; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.cpm-person .p small{ display:block; font-size:12.5px; color:${INK_3}; margin-top:1px; }
.cpm .cpm-inv{ flex-shrink:0; min-height:44px; padding:0 14px; border-radius:12px; font-size:14px; font-weight:600; border:0; background:${INK}; color:#fff; display:inline-flex; align-items:center; gap:6px; }
.cpm .cpm-inv.done{ background:#ecfdf5; color:#0f6e56; border:1px solid #a7f3d0; }
.cpm .cpm-inv.none{ background:#f5f5f7; color:#8a8a93; border:1px solid #ececf0; cursor:default; }

.cpm-toast{ position:fixed; left:50%; transform:translateX(-50%); bottom:calc(64px + env(safe-area-inset-bottom) + 14px); z-index:10000; padding:11px 16px; border-radius:12px; font-size:14px; font-weight:500; box-shadow:0 8px 24px rgba(17,17,20,.18); max-width:calc(100vw - 32px); }
.cpm-toast.ok{ background:${INK}; color:#fff; }
.cpm-toast.err{ background:#fff; color:#a32d2d; border:1px solid #f1d0d0; }
@media (min-width:1024px){ .cpm-toast{ bottom:24px; left:calc(50% + var(--sidebar-width, 0px) / 2); } }
`

/** Cores do alcance: verde recebe, ambar no app sem receber, cinza fora do app. */
export const REACH_COLOR = { recebem: '#16a34a', semReceber: '#b45309', fora: '#d4d4da' } as const
