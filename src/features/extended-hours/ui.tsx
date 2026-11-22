// src/features/extended-hours/ui.tsx
// @eligi:xh-fe-ui — pecas visuais do Modo Dezembro (direcao B "Simulador").
// Laranja so com a funcao "horario estendido" (brand.extendedHours); o vermelho
// fica para a acao primaria. Todo texto tem cor propria: o globals.css pinta
// `main span` de cinza (ver @eligi:doc-main-span).
import { brand } from '@/shared/brand.generated'
import { typography } from '@/shared/theme'

export const XH = brand.extendedHours
export const INK = '#111114'
export const INK_2 = '#4b4b52'
export const INK_3 = '#6b6b73'
export const RED = brand.core.redAction

/** Chama (traco do Lucide "Flame", preenchida). */
export function FlameIcon({ size = 22, color = XH.flame, className }: { size?: number; color?: string; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"
        fill={color}
      />
    </svg>
  )
}

export const XH_CSS = `
.xh-root *, .xh-sheet *, .xh-pill *{ box-sizing:border-box; }
.xh-root :where(span, div, b, i, p, h1, h2, strong, label),
.xh-sheet :where(span, div, b, i, p, h2, strong),
.xh-pill :where(span){ color:inherit; } /* vence main span */
.xh-root button, .xh-sheet button, .xh-pill{ font-family:inherit; cursor:pointer; -webkit-tap-highlight-color:transparent; }
.xh-root a{ color:inherit; text-decoration:none; }
.xh-root a:focus-visible, .xh-root button:focus-visible, .xh-root input:focus-visible, .xh-sheet button:focus-visible{ outline:2px solid ${RED}; outline-offset:2px; }
.xh-pill:focus-visible{ outline:2px solid ${INK}; outline-offset:3px; }
.xh-d{ font-family:${typography.fontFamilyDisplay}; letter-spacing:-.035em; }
.xh-m{ font-family:${typography.fontFamilyMono}; }

/* chama viva */
.xh-flame{ transform-origin:50% 90%; animation:xh-flick 1s ease-in-out infinite; }
@keyframes xh-flick{ 0%,100%{transform:scale(1) rotate(-3deg)} 35%{transform:scale(1.08,1.14) rotate(3deg)} 70%{transform:scale(.95,1.04) rotate(-1deg)} }
.xh-spark{ position:absolute; width:4px; height:4px; border-radius:50%; background:${XH.spark}; opacity:0; animation:xh-rise 1.8s ease-out infinite; }
@keyframes xh-rise{ 0%{transform:translateY(0) scale(1); opacity:.9} 100%{transform:translateY(-26px) scale(.3); opacity:0} }

/* pilula da agenda */
.xh-pill{ position:fixed; z-index:40; left:16px; bottom:calc(64px + env(safe-area-inset-bottom) + 14px); height:48px; padding:0 18px 0 14px; border-radius:999px; border:0; display:flex; align-items:center; gap:8px; font-family:${typography.fontFamily}; font-size:14.5px; font-weight:600; white-space:nowrap; }
.xh-pill.invite{ background:linear-gradient(135deg, ${XH.gradientFrom}, ${XH.gradientTo}); color:#fff; animation:xh-breathe 2.2s ease-in-out infinite; }
.xh-pill.on{ background:${XH.bg}; color:${XH.ink}; border:1px solid ${XH.border}; box-shadow:0 6px 18px rgba(17,17,20,.10); }
@keyframes xh-breathe{ 0%,100%{box-shadow:0 6px 18px rgba(234,88,12,.35), 0 0 0 0 rgba(249,115,22,.45)} 50%{box-shadow:0 8px 22px rgba(234,88,12,.45), 0 0 0 9px rgba(249,115,22,0)} }
.xh-pill-ic{ position:relative; display:flex; width:22px; height:22px; }
@media (min-width:1024px){ .xh-pill{ left:calc(var(--sidebar-width, 72px) + 20px); bottom:24px; transition:left 260ms cubic-bezier(.22,1,.36,1); } }

/* folha do simulador e de confirmacao */
.xh-drop{ position:fixed; inset:0; z-index:9998; background:rgba(17,17,20,.32); animation:xh-fade .18s ease; }
@keyframes xh-fade{ from{opacity:0} to{opacity:1} }
@keyframes xh-up{ from{transform:translateY(24px); opacity:0} to{transform:none; opacity:1} }
.xh-sheet{ position:fixed; z-index:9999; left:0; right:0; top:104px; bottom:calc(64px + env(safe-area-inset-bottom)); overflow:auto; background:#fff; color:${INK}; border-radius:22px 22px 0 0; padding:14px 18px 18px; font-family:${typography.fontFamily}; display:flex; flex-direction:column; animation:xh-up .22s cubic-bezier(.34,1.56,.64,1); }
.xh-sheet.small{ top:auto; max-height:calc(100dvh - 104px - 64px - env(safe-area-inset-bottom)); }
@media (min-width:1024px){
  .xh-sheet{ left:calc(50% + var(--sidebar-width, 0px) / 2); right:auto; top:50%; bottom:auto; transform:translate(-50%,-50%); width:460px; max-height:calc(100dvh - 140px); border-radius:22px; padding:20px 22px 22px; animation:xh-fade .18s ease; }
  .xh-sheet.small{ top:50%; }
}
.xh-x{ width:44px; height:44px; flex-shrink:0; border:0; border-radius:50%; background:#f2f2f5; color:${INK_2}; display:flex; align-items:center; justify-content:center; }
.xh-eyebrow{ display:flex; align-items:center; gap:6px; font-size:11px; font-weight:600; letter-spacing:.08em; text-transform:uppercase; color:${XH.ink}; }
.xh-btn{ min-height:52px; border-radius:16px; border:0; background:${INK}; color:#fff; font-size:15px; font-weight:600; padding:0 18px; }
.xh-btn.red{ background:${RED}; }
.xh-btn.ghost{ background:#fff; color:${INK}; border:1px solid #e3e3e8; }
.xh-btn:disabled{ background:#ececf0; color:#8e8e96; cursor:default; }

/* simulador */
.xh-sim-h{ margin:6px 0 0; font-size:25px; font-weight:700; line-height:1.1; color:${INK}; }
.xh-sim-p{ margin:8px 0 0; font-size:14px; line-height:1.45; color:${INK_2}; }
.xh-sim-body{ display:flex; gap:12px; margin-top:16px; }
.xh-sim-axis{ position:relative; width:44px; flex-shrink:0; }
.xh-sim-axis span{ position:absolute; right:0; transform:translateY(-50%); font-size:11px; color:${INK_3}; }
.xh-sim-axis span.end{ color:${XH.ink}; font-weight:500; }
.xh-sim-lane{ position:relative; flex:1; border-radius:14px; border:1px solid ${XH.border}; background:repeating-linear-gradient(135deg, ${XH.stripe} 0 6px, ${XH.bg} 6px 12px); }
.xh-sim-limit{ position:absolute; left:0; right:0; bottom:-1px; border-top:2px solid ${XH.flame}; }
.xh-sim-card{ position:absolute; left:6px; right:6px; border-radius:10px; background:#fff; border:1px solid #ececf0; box-shadow:0 1px 2px rgba(17,17,20,.06); padding:0 10px; display:flex; align-items:center; gap:8px; font-size:13px; color:${INK}; overflow:hidden; animation:xh-drop .35s cubic-bezier(.2,.8,.2,1); }
.xh-sim-card b{ flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:600; }
.xh-sim-card .xh-m, .xh-sim-card .dur{ font-size:11px; color:${INK_3}; flex-shrink:0; }
@keyframes xh-drop{ from{transform:translateY(-10px); opacity:0} to{transform:none; opacity:1} }
.xh-sim-next{ position:absolute; left:6px; right:6px; height:30px; border-radius:10px; border:1.5px dashed ${XH.flame}; background:#fff; display:flex; align-items:center; padding:0 10px; font-size:12px; font-weight:600; color:${XH.ink}; }
.xh-sim-msg{ margin-top:14px; min-height:40px; font-size:13.5px; line-height:1.45; color:${INK_2}; }
.xh-sim-msg.end{ color:${XH.ink}; }
.xh-sim-acts{ display:flex; gap:10px; margin-top:10px; }
.xh-sim-acts .grow{ flex:1; }

@media (prefers-reduced-motion:reduce){
  .xh-flame, .xh-spark, .xh-pill.invite, .xh-sim-card, .xh-sheet, .xh-drop{ animation:none; }
}
`
