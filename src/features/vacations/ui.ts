// src/features/vacations/ui.ts
// @eligi:vac-fe-ui — estilos do Modo Ferias (aba da ficha + folha).
// Ferias = grafite com listras, o mesmo visual da folga: nenhuma cor nova.
// Ambar so para "precisa de voce" (cliente marcado), verde so para "pode salvar".
import { typography } from '@/shared/theme'

const INK = '#111114'
const INK_2 = '#4b4b52'
const INK_3 = '#6b6b73'
const LINE = 'rgba(17,17,20,.08)'

export const VAC_CSS = `
.vac-root, .vac-sheet{ font-family:${typography.fontFamily}; color:${INK}; }
.vac-root *, .vac-sheet *{ box-sizing:border-box; }
/* main span pinta texto de cinza (globals.css): cor explicita por classe */
.vac-root :where(span, div, b, p, strong), .vac-sheet :where(span, div, b, p, strong){ color:inherit; }
.vac-root button, .vac-sheet button{ font-family:inherit; cursor:pointer; -webkit-tap-highlight-color:transparent; }
.vac-root button:focus-visible, .vac-sheet button:focus-visible, .vac-sheet input:focus-visible{ outline:2px solid #dc2626; outline-offset:2px; }

.vac-eyebrow{ font-family:var(--font-mono, ui-monospace, monospace); font-size:11px; letter-spacing:.08em; text-transform:uppercase; color:${INK_3}; }
.vac-card{ background:#fff; border:1px solid ${LINE}; border-radius:20px; padding:18px; display:flex; flex-direction:column; gap:10px; }
.vac-big{ font-family:var(--font-display, ${typography.fontFamily}); font-size:30px; font-weight:700; letter-spacing:-.03em; line-height:1.05; font-variant-numeric:tabular-nums; }
.vac-sub{ font-size:14px; color:${INK_2}; }
.vac-note{ font-size:13px; color:${INK_2}; line-height:1.45; }
.vac-stripe{ height:14px; border-radius:99px; border:1px solid #e3e3e8; background:repeating-linear-gradient(135deg,#e8e8ed 0 6px,#f5f5f7 6px 12px); }
.vac-tag{ align-self:flex-start; font-size:11.5px; font-weight:700; padding:3px 9px; border-radius:99px; background:#111114; color:#fff; }
.vac-row2{ display:flex; gap:8px; }
.vac-btn{ flex:1; min-height:44px; border-radius:12px; border:1px solid #d6d6dc; background:#fff; font-size:14px; font-weight:600; color:${INK}; }
.vac-btn.danger{ color:#b91c1c; }
.vac-btn:disabled{ opacity:.55; cursor:default; }
.vac-main{ width:100%; min-height:52px; border-radius:14px; border:0; background:${INK}; color:#fff; font-size:15px; font-weight:600; }
.vac-main:disabled{ background:#e3e3e8; color:${INK_3}; cursor:default; }
.vac-past{ display:flex; justify-content:space-between; gap:12px; font-size:14px; padding:6px 0; }
.vac-past span:last-child{ color:${INK_3}; flex-shrink:0; }
.vac-empty{ text-align:center; padding:22px 8px; display:flex; flex-direction:column; gap:6px; align-items:center; }
.vac-empty b{ font-size:16px; }
.vac-empty span{ font-size:13.5px; color:${INK_2}; line-height:1.45; max-width:300px; }
.vac-skel{ border-radius:20px; height:150px; background:linear-gradient(90deg,#f0f0f3,#f7f7f9,#f0f0f3); background-size:200% 100%; animation:vac-sh 1.2s linear infinite; }
@keyframes vac-sh{ to{ background-position:-200% 0 } }
.vac-alert{ border-radius:14px; padding:12px 14px; font-size:13.5px; line-height:1.45; display:flex; gap:8px; align-items:flex-start; }
.vac-alert.warn{ background:#fffbeb; border:1px solid #fde68a; color:#78350f; }
.vac-alert.ok{ background:#ecfdf5; border:1px solid #a7f3d0; color:#0f6e56; }
.vac-alert.bad{ background:rgba(220,38,38,.06); border:1px solid rgba(220,38,38,.22); color:#a32d2d; }
.vac-alert.info{ background:#f5f5f7; border:1px solid #e3e3e8; color:${INK_2}; }
.vac-alert svg{ flex-shrink:0; margin-top:1px; }

/* folha */
.vac-drop{ position:fixed; inset:0; z-index:9998; background:rgba(17,17,20,.32); animation:vac-fade .18s ease; }
@keyframes vac-fade{ from{opacity:0} to{opacity:1} }
@keyframes vac-up{ from{transform:translateY(24px); opacity:0} to{transform:none; opacity:1} }
.vac-sheet{ position:fixed; z-index:9999; left:0; right:0; top:104px; bottom:calc(64px + env(safe-area-inset-bottom)); overflow:auto; background:#fff; border-radius:22px 22px 0 0; padding:14px 18px 18px; display:flex; flex-direction:column; gap:14px; animation:vac-up .22s cubic-bezier(.34,1.56,.64,1); }
.vac-sheet.small{ top:auto; } /* @eligi:vac-fe-ui-small */
@media (min-width:1024px){
  .vac-sheet.small{ top:50%; } /* @eligi:vac-fe-ui-deskq */
  .vac-sheet{ left:calc(50% + var(--sidebar-width, 0px) / 2); right:auto; top:50%; bottom:auto; transform:translate(-50%,-50%); width:480px; max-height:calc(100dvh - 140px); border-radius:22px; padding:20px 22px 22px; animation:vac-fade .18s ease; }
}
.vac-head{ display:flex; align-items:flex-start; gap:10px; }
.vac-head h2{ margin:0; flex:1; font-family:var(--font-display, ${typography.fontFamily}); font-size:24px; font-weight:700; letter-spacing:-.02em; overflow-wrap:anywhere; }
.vac-x{ width:44px; height:44px; border-radius:12px; border:0; background:#f5f5f7; display:grid; place-items:center; color:${INK}; flex-shrink:0; }
.vac-field{ display:flex; flex-direction:column; gap:6px; }
.vac-field > span{ font-size:12px; font-weight:600; color:${INK_3}; }
.vac-step{ display:flex; align-items:center; gap:8px; }
.vac-step button{ width:44px; height:48px; border-radius:12px; border:1px solid #e3e3e8; background:#fff; font-size:20px; font-weight:600; color:${INK}; flex-shrink:0; }
.vac-step button:disabled{ opacity:.4; cursor:default; }
.vac-step label{ flex:1; position:relative; min-height:48px; border-radius:12px; border:1px solid #d6d6dc; display:flex; flex-direction:column; justify-content:center; padding:4px 12px; }
.vac-step label b{ font-size:16px; font-variant-numeric:tabular-nums; }
.vac-step label small{ font-size:11.5px; color:${INK_3}; }
.vac-step input[type=date]{ position:absolute; inset:0; opacity:0; width:100%; height:100%; font-size:16px; cursor:pointer; }
.vac-chips{ display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:8px; }
.vac-chip{ height:58px; border-radius:14px; border:1.5px solid #e3e3e8; background:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; color:${INK}; }
.vac-chip b{ font-family:var(--font-display, ${typography.fontFamily}); font-size:20px; font-weight:700; line-height:1; }
.vac-chip small{ font-size:11px; color:${INK_3}; margin-top:2px; }
.vac-chip[aria-pressed=true]{ background:${INK}; border-color:${INK}; color:#fff; }
.vac-chip[aria-pressed=true] small{ color:#d6d6dc; }
.vac-sum{ border-radius:14px; background:#f5f5f7; padding:12px 14px; font-size:14px; color:${INK_2}; }
.vac-sum b{ color:${INK}; }
.vac-list{ display:flex; flex-direction:column; background:#fff; border-radius:12px; border:1px solid #fde68a; margin-top:8px; }
.vac-list button{ min-height:52px; display:flex; align-items:center; justify-content:space-between; gap:10px; padding:6px 12px; border:0; border-bottom:1px solid #fef3c7; background:transparent; text-align:left; color:${INK}; }
.vac-list button:last-child{ border-bottom:0; }
.vac-list b{ display:block; font-size:14px; }
.vac-list small{ display:block; font-size:12px; color:${INK_3}; }
.vac-list em{ font-style:normal; font-size:13px; font-weight:600; flex-shrink:0; }
.vac-foot{ display:flex; flex-direction:column; gap:6px; margin-top:auto; }
.vac-foot small{ text-align:center; font-size:12.5px; color:${INK_3}; }
@media (prefers-reduced-motion: reduce){ .vac-sheet, .vac-drop, .vac-skel{ animation:none; } }
`
