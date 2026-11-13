// src/features/clients/lapsedStyles.ts
// @eligi:lapsed-css — aba Sumidos por profissional, direcao A "Chips" (nov/2026).
// Somado ao CLIENTS_CSS na pagina. A folha do WhatsApp vai por portal no <body>
// (fora do <main>), por isso traz o proprio bloco (.clw).

import { typography } from '@/shared/theme'
import { INK, INK_2, INK_3, LINE, WARN } from './styles'

export const OK_INK = '#0f6e56'

export const LAPSED_CSS = `
.cl-lp{ display:flex; flex-direction:column; gap:10px; padding:12px 2px 0; }
@media (min-width:1024px){ .cl-lp{ padding:12px 16px 0; } }
.cl-chips{ display:flex; gap:8px; overflow-x:auto; scrollbar-width:none; margin:0 -2px; padding:0 2px 2px; }
.cl-chips::-webkit-scrollbar{ display:none; }
.cl-chip{ flex-shrink:0; display:inline-flex; align-items:center; gap:6px; min-height:40px; padding:0 14px; border-radius:999px; border:1px solid ${LINE}; background:#fff; font-size:13.5px; font-weight:600; color:${INK}; white-space:nowrap; }
.cl-chip .cl-chip-n{ font-family:${typography.fontFamilyDisplay}; font-variant-numeric:tabular-nums; color:${INK_3}; font-weight:600; }
.cl-chip.is-gone{ background:#fffbeb; border-color:rgba(180,83,9,.3); color:${WARN}; }
.cl-chip.is-gone .cl-chip-n{ color:${WARN}; }
.cl-chip.is-on{ background:${INK}; border-color:${INK}; color:#fff; }
.cl-chip.is-on .cl-chip-n{ color:rgba(255,255,255,.72); }
.cl-risk{ display:flex; align-items:center; gap:12px; padding:12px 14px; border-radius:14px; background:#fff; border:1px solid ${LINE}; }
.cl-risk-t{ font-size:14px; font-weight:600; color:${INK}; }
.cl-risk-s{ font-size:12.5px; color:${INK_3}; margin-top:2px; }
.cl-risk-v{ margin-left:auto; text-align:right; flex-shrink:0; }
.cl-risk-v b{ display:block; font-family:${typography.fontFamilyDisplay}; font-size:17px; font-weight:600; letter-spacing:-.02em; font-variant-numeric:tabular-nums; color:${INK}; }
.cl-risk-v span{ font-size:11.5px; color:${INK_3}; }
.cl-risk.is-gone{ background:#fffbeb; border-color:rgba(180,83,9,.22); }
.cl-li{ display:flex; align-items:center; }
.cl-li + .cl-li{ box-shadow:inset 0 1px 0 #f0f0f3; }
.cl-li .cl-row{ flex:1; min-width:0; }
.cl-li .cl-row + .cl-row{ box-shadow:none; }
.cl-fid{ display:inline-flex; align-self:flex-start; align-items:center; height:20px; padding:0 7px; border-radius:6px; background:#f0f0f3; color:${INK}; font-size:11.5px; font-weight:600; margin-top:2px; max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.cl-fid.is-gone{ background:#fffbeb; color:${WARN}; }
.cl-wa{ flex-shrink:0; width:44px; height:44px; margin-right:12px; border-radius:12px; border:1px solid ${LINE}; background:#fff; display:flex; align-items:center; justify-content:center; color:${OK_INK}; }
.cl-wa:hover{ background:#ecfdf5; }

.clw{ position:fixed; inset:0; z-index:900; font-family:${typography.fontFamily}; color:${INK}; }
.clw *{ box-sizing:border-box; }
.clw-scrim{ position:absolute; inset:0; background:rgba(17,17,20,.35); }
.clw-sheet{ position:absolute; left:0; right:0; top:var(--navbar-offset,104px); bottom:calc(var(--bottom-nav-h,64px) + env(safe-area-inset-bottom)); background:#f5f5f7; border-radius:20px 20px 0 0; padding:18px 16px 20px; overflow-y:auto; display:flex; flex-direction:column; gap:14px; }
@media (min-width:1024px){
  .clw-sheet{ top:50%; bottom:auto; left:calc(50% + var(--sidebar-width,0px) / 2); right:auto; width:440px; max-height:calc(100vh - 160px); transform:translate(-50%,-50%); border-radius:20px; box-shadow:0 20px 60px rgba(17,17,20,.25); }
}
.clw-h{ display:flex; align-items:flex-start; gap:12px; }
.clw-t{ margin:0; font-family:${typography.fontFamilyDisplay}; font-size:19px; font-weight:600; letter-spacing:-.02em; color:${INK}; }
.clw-s{ font-size:12.5px; color:${INK_3}; margin-top:2px; }
.clw-x{ margin-left:auto; flex-shrink:0; width:44px; height:44px; border-radius:12px; border:0; background:#ebebef; display:flex; align-items:center; justify-content:center; color:${INK}; }
.clw-l{ font-family:${typography.fontFamilyMono}; font-size:11px; letter-spacing:.06em; text-transform:uppercase; color:${INK_3}; }
.clw-pick{ display:flex; flex-wrap:wrap; gap:8px; margin-top:8px; }
.clw-bub{ background:#efeae2; border-radius:16px; padding:14px; }
.clw-msg{ background:#d9fdd3; color:#111b21; border-radius:12px 12px 4px 12px; padding:10px 12px; font-size:14.5px; line-height:1.45; margin-left:24px; white-space:pre-wrap; }
.clw-note{ font-size:12px; color:${INK_2}; }
.clw-go{ display:flex; align-items:center; justify-content:center; gap:8px; min-height:52px; border-radius:14px; background:${INK}; color:#fff; font-size:15px; font-weight:600; text-decoration:none; margin-top:auto; }
.clw-go span{ color:#fff; }
`
