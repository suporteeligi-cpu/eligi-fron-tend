// src/features/clients/styles.ts
// @eligi:clients-css-v2 — direcao B "Ficha" (nov/2026).
//
// Um bloco de CSS para a lista e a ficha. Layout por @media, nunca por
// useDeviceMode. Todo <span> tem cor propria: o globals.css pinta
// `main span` de cinza (ver @eligi:doc-main-span no CLAUDE.md).
// Vermelho so no "+ Novo" e no foco de teclado.

import { typography } from '@/shared/theme'

export const INK   = '#111114'
export const INK_2 = '#4b4b52'
export const INK_3 = '#6b6b73'
export const LINE  = '#e7e7ec'
export const WARN  = '#b45309'

export const CLIENTS_CSS = `
.cl-page{ max-width:1180px; font-family:${typography.fontFamily}; color:${INK}; animation:cl-fade .25s ease; }
@keyframes cl-fade{ from{opacity:0; transform:translateY(6px)} to{opacity:1; transform:none} }
@keyframes cl-spin{ to{ transform:rotate(360deg) } }
@keyframes cl-up{ from{opacity:0; transform:translateY(120%)} to{opacity:1; transform:none} }
@keyframes cl-pulse{ 0%,100%{opacity:.55} 50%{opacity:1} }
.cl-page *{ box-sizing:border-box; }
.cl-page :where(span, div, b, i){ color:inherit; } /* 0,1,0: vence main span (0,0,2) e perde para as classes abaixo */
.cl-d{ font-family:${typography.fontFamilyDisplay}; }
.cl-m{ font-family:${typography.fontFamilyMono}; }
.cl-n{ font-variant-numeric:tabular-nums; }
.cl-page button{ font-family:inherit; cursor:pointer; -webkit-tap-highlight-color:transparent; }
.cl-page button:disabled{ cursor:not-allowed; opacity:.45; }
.cl-page button:focus-visible, .cl-page a:focus-visible, .cl-page input:focus-visible{ outline:2px solid #dc2626; outline-offset:2px; }

/* ── divisao lista | ficha ─────────────────────────────────────────── */
.cl-split{ display:grid; grid-template-columns:minmax(0,1fr); }
.cl-detail{ display:none; }
@media (min-width:1024px){
  .cl-split{ grid-template-columns:minmax(0,380px) minmax(0,1fr); background:#fff; border:1px solid ${LINE}; border-radius:18px; overflow:hidden; min-height:calc(100vh - 150px); }
  .cl-split .cl-list{ border-right:1px solid ${LINE}; }
  .cl-detail{ display:block; min-width:0; }
  .cl-detail-in{ position:sticky; top:0; max-height:calc(100vh - 150px); overflow-y:auto; }
}

/* ── cabecalho da lista ────────────────────────────────────────────── */
.cl-head{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding:4px 2px 0; }
@media (min-width:1024px){ .cl-head{ padding:20px 16px 0; } }
.cl-h1{ margin:0; font-size:28px; font-weight:600; letter-spacing:-.045em; color:${INK}; display:flex; align-items:baseline; gap:8px; }
.cl-h1 .cl-count{ font-size:14px; font-weight:500; letter-spacing:0; color:${INK_3}; }
.cl-head-actions{ display:flex; align-items:center; gap:6px; }
.cl-btn-new{ height:44px; padding:0 16px; border-radius:22px; border:none; background:#dc2626; color:#fff; font-size:14px; font-weight:600; display:inline-flex; align-items:center; gap:6px; }
.cl-btn-new span{ color:#fff; }
.cl-btn-ghost{ height:44px; padding:0 14px; border-radius:22px; border:1px solid ${LINE}; background:#fff; color:${INK}; font-size:13.5px; font-weight:600; display:inline-flex; align-items:center; gap:6px; }
.cl-btn-ghost span{ color:${INK}; }
.cl-icon-btn{ width:44px; height:44px; border-radius:22px; border:1px solid ${LINE}; background:#fff; color:${INK}; display:inline-flex; align-items:center; justify-content:center; }

.cl-tools{ display:flex; flex-direction:column; gap:12px; padding:14px 2px 0; }
@media (min-width:1024px){ .cl-tools{ padding:14px 16px 0; } }
.cl-search{ height:44px; border-radius:12px; background:#fff; border:1px solid ${LINE}; display:flex; align-items:center; gap:8px; padding:0 12px; color:${INK_3}; }
@media (min-width:1024px){ .cl-search{ background:#f5f5f7; border-color:transparent; } }
.cl-search input{ flex:1; min-width:0; border:none; outline:none; background:transparent; font-size:16px; font-family:inherit; color:${INK}; }
.cl-search input:focus-visible{ outline:none; }
.cl-search:focus-within{ border-color:${INK}; }
.cl-clear{ width:32px; height:32px; border:none; background:transparent; color:${INK_3}; display:inline-flex; align-items:center; justify-content:center; border-radius:16px; }

.cl-tabs{ display:flex; gap:20px; border-bottom:1px solid ${LINE}; overflow-x:auto; scrollbar-width:none; }
.cl-tabs::-webkit-scrollbar{ display:none; }
.cl-tab{ height:44px; border:none; background:transparent; font-size:14px; font-weight:500; color:${INK_3}; border-bottom:2px solid transparent; padding:0 2px; white-space:nowrap; flex-shrink:0; }
.cl-tab.is-on{ color:${INK}; font-weight:700; border-bottom-color:${INK}; }

/* ── linhas ────────────────────────────────────────────────────────── */
.cl-rows{ display:flex; flex-direction:column; padding:4px 0 8px; }
@media (max-width:1023px){ .cl-rows{ background:#fff; border:1px solid ${LINE}; border-radius:16px; margin-top:12px; overflow:hidden; } }
.cl-letter{ padding:14px 16px 4px; font-size:11px; font-weight:600; letter-spacing:.08em; color:${INK_3}; }
.cl-row{ display:flex; align-items:center; gap:12px; width:100%; min-height:60px; padding:10px 16px; border:none; border-left:2px solid transparent; background:transparent; text-align:left; color:${INK}; }
.cl-row + .cl-row{ box-shadow:inset 0 1px 0 #f0f0f3; }
.cl-row:hover{ background:#f7f7f9; }
.cl-row.is-on{ background:#f1f1f4; border-left-color:${INK}; }
.cl-row.is-sel{ background:#f1f1f4; }
.cl-row-main{ flex:1; min-width:0; display:flex; flex-direction:column; gap:3px; }
.cl-row-name{ font-size:14.5px; font-weight:600; color:${INK}; display:flex; align-items:center; gap:6px; min-width:0; }
.cl-row-name .cl-ellipsis{ overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.cl-row-meta{ font-size:11px; color:${INK_3}; letter-spacing:.02em; }
.cl-row-meta.is-warn{ color:${WARN}; }
.cl-row-money{ font-size:15px; font-weight:600; color:${INK}; white-space:nowrap; }
.cl-row-money.is-zero{ color:#b8b8c0; }
.cl-check{ width:22px; height:22px; border-radius:7px; border:1.5px solid #c8c8cf; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; color:#fff; }
.cl-check.is-on{ background:${INK}; border-color:${INK}; }
.cl-more{ display:flex; justify-content:center; padding:14px 16px 18px; }

.cl-state{ padding:48px 24px; text-align:center; display:flex; flex-direction:column; align-items:center; gap:8px; }
.cl-state-title{ font-size:16px; font-weight:600; color:${INK}; }
.cl-state-text{ font-size:14px; color:${INK_3}; max-width:320px; line-height:1.45; }
.cl-skel{ height:60px; margin:0 16px; border-bottom:1px solid #f0f0f3; display:flex; flex-direction:column; justify-content:center; gap:6px; }
.cl-skel i{ display:block; height:10px; border-radius:5px; background:#ececf0; animation:cl-pulse 1.2s ease infinite; }
.cl-spinner{ width:26px; height:26px; border-radius:50%; border:2.5px solid #e4e4e8; border-top-color:${INK}; animation:cl-spin .8s linear infinite; }

/* ── barra de selecao ──────────────────────────────────────────────── */
.cl-selbar-wrap{ position:fixed; left:0; right:0; bottom:calc(64px + env(safe-area-inset-bottom)); z-index:9990; display:flex; justify-content:center; padding:0 16px; pointer-events:none; }
@media (min-width:1024px){ .cl-selbar-wrap{ bottom:24px; } }
.cl-selbar{ pointer-events:auto; width:100%; max-width:520px; background:${INK}; color:#fff; border-radius:18px; padding:10px 12px 10px 16px; display:flex; align-items:center; gap:8px; box-shadow:0 12px 40px rgba(0,0,0,.28); animation:cl-up .3s cubic-bezier(.34,1.56,.64,1); }
.cl-selbar span{ color:#fff; }
.cl-selbar button{ height:40px; border-radius:12px; border:none; font-size:13px; font-weight:600; padding:0 13px; }
.cl-selbar .is-soft{ background:rgba(255,255,255,.14); color:#fff; }
.cl-selbar .is-solid{ background:#fff; color:${INK}; }

/* ── ficha ─────────────────────────────────────────────────────────── */
.cl-prof{ display:flex; flex-direction:column; gap:22px; padding:4px 2px 32px; }
@media (min-width:1024px){ .cl-prof{ padding:30px 40px 40px; max-width:860px; } }
.cl-prof-top{ display:flex; align-items:center; justify-content:space-between; gap:8px; }
.cl-prof-id{ display:flex; align-items:flex-start; justify-content:space-between; gap:16px; flex-wrap:wrap; }
.cl-prof-name{ margin:0; font-size:30px; font-weight:600; letter-spacing:-.045em; line-height:1.08; color:${INK}; display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
@media (min-width:1024px){ .cl-prof-name{ font-size:40px; letter-spacing:-.05em; } }
.cl-prof-sub{ font-size:14px; color:${INK_3}; line-height:1.5; margin-top:4px; }
.cl-prof-sub span{ color:${INK_3}; }
.cl-prof-sub .cl-dot{ margin:0 6px; color:#c8c8cf; }
.cl-actions{ display:flex; gap:8px; flex-wrap:wrap; }
.cl-btn-dark{ height:44px; padding:0 18px; border-radius:22px; border:none; background:${INK}; color:#fff; font-size:14px; font-weight:600; display:inline-flex; align-items:center; gap:7px; text-decoration:none; }
.cl-btn-dark span{ color:#fff; }
.cl-btn-out{ height:44px; padding:0 16px; border-radius:22px; border:1px solid ${LINE}; background:#fff; color:${INK}; font-size:14px; font-weight:600; display:inline-flex; align-items:center; gap:7px; text-decoration:none; }
.cl-btn-out span{ color:${INK}; }
.cl-btn-out.is-danger{ color:#a32d2d; }
.cl-btn-out.is-danger span{ color:#a32d2d; }

.cl-spend-label{ font-size:11px; color:${INK_3}; letter-spacing:.06em; text-transform:uppercase; }
.cl-spend-big{ font-size:56px; font-weight:600; letter-spacing:-.06em; line-height:1; color:${INK}; }
.cl-spend-big .cl-cents{ font-size:28px; color:${INK_3}; letter-spacing:-.03em; }
@media (min-width:1024px){ .cl-spend-big{ font-size:72px; } .cl-spend-big .cl-cents{ font-size:36px; } }
.cl-spend-note{ font-size:12.5px; color:${INK_3}; }
.cl-bar{ display:flex; height:8px; border-radius:4px; overflow:hidden; gap:2px; background:#f0f0f3; }
.cl-bar i{ display:block; height:100%; }
.cl-legend{ display:flex; flex-wrap:wrap; gap:6px 18px; font-size:12.5px; color:${INK_2}; }
.cl-legend span{ color:${INK_2}; display:inline-flex; align-items:center; gap:6px; }
.cl-legend b{ color:${INK}; font-weight:600; }
.cl-legend .cl-sw{ width:8px; height:8px; border-radius:2px; display:inline-block; }

.cl-kpis{ display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); border-top:1px solid ${LINE}; border-bottom:1px solid ${LINE}; }
.cl-kpi{ padding:12px 0 12px 12px; display:flex; flex-direction:column; gap:2px; min-width:0; }
.cl-kpi:first-child{ padding-left:0; }
.cl-kpi + .cl-kpi{ border-left:1px solid ${LINE}; }
.cl-kpi-l{ font-size:11.5px; color:${INK_3}; }
.cl-kpi-v{ font-size:18px; font-weight:600; color:${INK}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.cl-kpi-s{ font-size:11.5px; color:${INK_3}; }
.cl-kpi-s.is-warn{ color:${WARN}; }

.cl-ptabs{ display:flex; gap:20px; border-bottom:1px solid ${LINE}; overflow-x:auto; scrollbar-width:none; }
.cl-ptabs::-webkit-scrollbar{ display:none; }

/* ── historico ─────────────────────────────────────────────────────── */
.cl-hist{ display:flex; flex-direction:column; margin-top:-12px; }
.cl-year{ padding:16px 0 4px; font-size:11px; font-weight:600; letter-spacing:.08em; color:${INK_3}; }
.cl-visit{ display:flex; gap:14px; padding:12px 0; border-bottom:1px solid ${LINE}; }
.cl-visit-date{ width:56px; flex-shrink:0; font-size:11.5px; color:${INK_3}; padding-top:2px; }
.cl-visit-main{ flex:1; min-width:0; display:flex; flex-direction:column; gap:2px; }
.cl-visit-title{ font-size:14.5px; font-weight:600; color:${INK}; }
.cl-visit-sub{ font-size:12px; color:${INK_3}; line-height:1.45; }
.cl-visit-sub span{ color:${INK_3}; }
.cl-visit-money{ font-size:15px; font-weight:600; color:${INK}; white-space:nowrap; text-align:right; }
.cl-visit-money .cl-tag{ display:block; font-family:${typography.fontFamily}; font-size:11px; font-weight:500; color:${INK_3}; margin-top:2px; }
.cl-visit.is-off .cl-visit-title, .cl-visit.is-off .cl-visit-money{ color:#9a9aa2; }
.cl-visit.is-off .cl-visit-title{ text-decoration:line-through; text-decoration-color:#c8c8cf; }
.cl-pill{ display:inline-flex; align-items:center; height:20px; padding:0 7px; border-radius:6px; font-size:10.5px; font-weight:600; letter-spacing:.02em; background:#f0f0f3; color:${INK_2}; }
.cl-pill.is-warn{ background:rgba(245,158,11,.12); color:${WARN}; }
.cl-price{ display:flex; gap:14px; padding:10px 0; border-bottom:1px dashed ${LINE}; }
.cl-price .cl-visit-date{ color:${WARN}; }
.cl-price-text{ font-size:12.5px; color:${WARN}; line-height:1.45; }
.cl-price-text span{ color:${WARN}; }

/* ── dados ─────────────────────────────────────────────────────────── */
.cl-fields{ display:flex; flex-direction:column; margin-top:-12px; }
.cl-field{ display:flex; align-items:center; gap:12px; min-height:60px; padding:10px 0; border-bottom:1px solid ${LINE}; }
.cl-field-main{ flex:1; min-width:0; display:flex; flex-direction:column; gap:3px; }
.cl-field-l{ font-size:11.5px; color:${INK_3}; }
.cl-field-v{ font-size:15px; font-weight:500; color:${INK}; overflow-wrap:anywhere; }
.cl-field-v.is-empty{ color:#a1a1aa; font-weight:400; }
.cl-field input{ width:100%; height:44px; border-radius:10px; border:1px solid ${INK}; padding:0 12px; font-size:16px; font-family:inherit; color:${INK}; background:#fff; outline:none; }
.cl-field-err{ font-size:12px; color:#a32d2d; }
.cl-field-btns{ display:flex; gap:6px; flex-shrink:0; }
.cl-mini{ width:44px; height:44px; border-radius:12px; border:1px solid ${LINE}; background:#fff; color:${INK}; display:inline-flex; align-items:center; justify-content:center; }
.cl-mini.is-dark{ background:${INK}; border-color:${INK}; color:#fff; }
.cl-lock{ font-size:12.5px; color:${INK_3}; padding:12px 0 0; line-height:1.45; }

/* ── clube ─────────────────────────────────────────────────────────── */
.cl-club{ border:1px solid ${LINE}; border-radius:16px; padding:16px; display:flex; flex-direction:column; gap:14px; }
.cl-club-head{ display:flex; align-items:center; gap:10px; }
.cl-club-name{ font-size:16px; font-weight:600; color:${INK}; }
.cl-club-grid{ display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px 12px; }
@media (min-width:640px){ .cl-club-grid{ grid-template-columns:repeat(4,minmax(0,1fr)); } }

/* ── aviso flutuante ───────────────────────────────────────────────── */
.cl-toast{ position:fixed; left:50%; bottom:calc(84px + env(safe-area-inset-bottom)); transform:translateX(-50%); z-index:10000; max-width:calc(100vw - 32px); padding:12px 18px; border-radius:14px; background:${INK}; color:#fff; font-size:14px; font-weight:500; box-shadow:0 12px 32px rgba(0,0,0,.24); }
.cl-toast span{ color:#fff; }
.cl-toast.is-bad{ background:#a32d2d; }
@media (min-width:1024px){ .cl-toast{ bottom:28px; } }
@media (prefers-reduced-motion:reduce){ .cl-page, .cl-selbar{ animation:none; } .cl-skel i{ animation:none; } }
`
