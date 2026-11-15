// src/app/dashboard/configuracoes/empresa/components/profileStyles.ts
// @eligi:perfil-css — estilos de Perfil e endereco. Global de proposito: as folhas
// abrem por portal no <body>, fora da pagina. Prefixos pf- e addr-.
// Fundo branco, grafite no selecionado e no botao principal; vermelho so no foco
// e no que apaga. Inputs com 16 px (o iOS nao da zoom), alvos de 44 px.

const INK = '#111114'
const INK_2 = '#4b4b52'
const INK_3 = '#6b6b73'

type Typo = { fontFamily: string; fontFamilyDisplay: string; fontFamilyMono: string }

export const PROFILE_CSS = (t: Typo) => `
.pf{ max-width:1180px; font-family:${t.fontFamily}; color:${INK}; animation:pf-in .25s ease; }
@keyframes pf-in{ from{opacity:0; transform:translateY(6px)} to{opacity:1; transform:none} }
@keyframes pf-pulse{ 0%,100%{opacity:.5} 50%{opacity:1} }
@keyframes addr-rot{ to{ transform:rotate(360deg) } }
.addr-spin{ animation:addr-rot .9s linear infinite; }
.pf *, .pf-sheet *{ box-sizing:border-box; }
.pf :where(span, div, b, i, p, h1, h2, strong, small, li), .pf-sheet :where(span, div, b, i, p, h2, strong, small, label){ color:inherit; } /* vence main span */
.pf a{ color:inherit; text-decoration:none; }
.pf button, .pf-sheet button, .pf-sheet label{ font-family:inherit; -webkit-tap-highlight-color:transparent; }
.pf button, .pf-sheet button{ cursor:pointer; }
.pf a:focus-visible, .pf button:focus-visible, .pf-sheet button:focus-visible, .pf-sheet label:focus-within, .pf-sheet input:focus-visible, .pf-sheet textarea:focus-visible{ outline:2px solid #dc2626; outline-offset:2px; }
.pf-back{ display:inline-flex; align-items:center; gap:4px; min-height:44px; padding:0 10px 0 4px; margin-left:-4px; border-radius:12px; font-size:14px; font-weight:500; color:${INK_2}; }
.pf-h1{ margin:4px 0 0; font-family:${t.fontFamilyDisplay}; letter-spacing:-.03em; font-size:28px; font-weight:600; }
.pf-lead{ margin:6px 0 0; font-size:14px; line-height:1.45; color:${INK_3}; max-width:600px; }
.pf-group{ margin:26px 0 10px; font-family:${t.fontFamilyMono}; font-size:11px; font-weight:500; letter-spacing:.06em; text-transform:uppercase; color:${INK_3}; }
.pf-layout{ display:grid; grid-template-columns:minmax(0,1fr); gap:24px; margin-top:8px; }
.pf-side{ display:none; }
.pf-mobile-only{ margin-top:14px; }
@media (min-width:1024px){
  .pf-layout{ grid-template-columns:minmax(0,1fr) 380px; align-items:start; }
  .pf-side{ display:block; position:sticky; top:120px; }
  .pf-mobile-only{ display:none !important; }
}
/* @eligi:preview-scroll — a previa e alta: rola dentro da coluna fixa */
.pf-side .bp-page{ max-height:calc(100vh - 176px); overflow-y:auto; overscroll-behavior:contain; }
.pf-side-head{ display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin:26px 0 10px; font-size:13px; font-weight:600; color:${INK_2}; }
.pf-side-head span{ font-weight:400; color:${INK_3}; font-size:12px; }

.pf-list{ display:flex; flex-direction:column; gap:10px; }
.pf-card{ background:#fff; border:1px solid #ececf0; border-radius:18px; padding:14px 16px; width:100%; text-align:left; }
.pf-cardbtn{ display:flex; align-items:center; gap:12px; min-height:72px; color:${INK}; }
@media (hover:hover){ .pf-cardbtn:hover{ border-color:#dcdce2; } }
.pf-row-top{ display:flex; align-items:flex-start; gap:12px; }
.pf-tile{ width:38px; height:38px; border-radius:11px; background:#f2f2f5; color:#3c3c43; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.pf-body{ flex:1; min-width:0; display:flex; flex-direction:column; }
.pf-cap{ font-family:${t.fontFamilyMono}; font-size:11px; letter-spacing:.06em; text-transform:uppercase; font-weight:500; color:${INK_3}; }
.pf-now{ font-size:15px; line-height:1.4; margin-top:3px; color:${INK}; overflow-wrap:anywhere; }
.pf-now.muted{ color:${INK_3}; }
.pf-meta{ display:flex; flex-wrap:wrap; gap:4px 12px; margin-top:6px; font-size:12.5px; color:${INK_3}; }
.pf-meta .ok::before, .pf-meta .warn::before{ content:''; display:inline-block; width:7px; height:7px; border-radius:50%; margin-right:6px; vertical-align:1px; }
.pf-meta .ok::before{ background:#10B981; } .pf-meta .warn::before{ background:#b45309; }
.pf-meta .warn{ color:#b45309; }
.pf-warnline{ margin-top:8px; font-size:13px; color:#92400e; background:#fffbeb; border-radius:10px; padding:8px 10px; }
.pf-act{ flex-shrink:0; min-height:44px; padding:0 16px; border-radius:12px; border:1px solid #e3e3e8; background:#fff; font-size:14px; font-weight:600; color:${INK}; }
.pf-act-txt{ flex-shrink:0; display:inline-flex; align-items:center; gap:2px; font-size:14px; font-weight:600; color:${INK_2}; }
.pf-link{ display:inline-flex; align-items:center; gap:6px; min-height:44px; margin:4px 0 -6px 50px; font-size:14px; font-weight:600; color:${INK_2}; }
.pf-mini-logo{ width:40px; height:40px; border-radius:10px; flex-shrink:0; background:#f2f2f5 center/cover no-repeat; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:14px; color:${INK_2}; }
.pf-mini-cover{ width:64px; height:36px; border-radius:8px; flex-shrink:0; box-shadow:inset 0 0 0 1px rgba(17,17,20,.06); }
.pf-mini-photos{ display:flex; flex-shrink:0; }
.pf-mini-photos i{ width:30px; height:30px; border-radius:8px; border:2px solid #fff; margin-left:-8px; background:#eee center/cover no-repeat; }
.pf-mini-sw{ display:flex; gap:3px; flex-shrink:0; }
.pf-mini-sw i{ width:16px; height:28px; border-radius:6px; box-shadow:inset 0 0 0 1px rgba(17,17,20,.1); }
@media (max-width:420px){ .pf-mini-photos, .pf-mini-cover{ display:none; } .pf-cardbtn{ padding:12px 14px; } }
.pf-skel{ height:76px; border-radius:18px; background:#f2f2f5; animation:pf-pulse 1.2s ease-in-out infinite; }
.pf-list > .pf-skel:first-child{ margin-top:22px; height:120px; }
.pf-errbox{ margin-top:22px; padding:16px; border-radius:16px; background:#fff; border:1px solid #ececf0; font-size:14px; color:${INK_2}; }

/* botoes e campos (pagina e folhas) */
.pf-btn{ display:inline-flex; align-items:center; justify-content:center; gap:8px; min-height:44px; padding:0 16px; border-radius:12px; border:1px solid #e3e3e8; background:#fff; font-size:14px; font-weight:600; color:${INK}; cursor:pointer; }
.pf-btn.ink{ background:${INK}; border-color:${INK}; color:#fff; }
.pf-btn.danger{ color:#a32d2d; border-color:#f1d0d0; }
.pf-btn:disabled{ opacity:.5; cursor:default; }
.pf-save{ width:100%; min-height:52px; display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:0 18px; border:0; border-radius:14px; background:${INK}; color:#fff; font-size:15px; font-weight:600; }
.pf-save:disabled{ opacity:.5; cursor:default; }
.pf-link.danger, .pf-link-btn{ border:0; background:transparent; padding:0; }
.pf-sheet .pf-link{ margin:0; }
.pf-sheet .pf-link.danger{ color:#a32d2d; font-weight:500; }
.pf-chip{ display:inline-flex; align-items:center; gap:6px; min-height:44px; padding:0 14px; border-radius:999px; border:1px solid #e3e3e8; background:#fff; font-size:14px; font-weight:500; color:${INK}; }
.pf-chip[aria-pressed="true"]{ background:${INK}; border-color:${INK}; color:#fff; }
.pf-row{ display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }
.pf-p{ margin:0; font-size:14px; line-height:1.5; color:${INK_2}; }
.pf-help{ margin:8px 0 0; font-size:12.5px; line-height:1.45; color:${INK_3}; }
.pf-count{ text-align:right; font-variant-numeric:tabular-nums; }
.pf-block{ margin-top:18px; padding-top:16px; border-top:1px solid #f0f0f3; }
.pf-lb{ display:block; margin-bottom:6px; font-family:${t.fontFamilyMono}; font-size:11px; letter-spacing:.06em; text-transform:uppercase; font-weight:500; color:${INK_3}; }
.pf-lb i{ font-style:normal; text-transform:none; letter-spacing:0; font-family:${t.fontFamily}; }
.pf-fld{ display:block; min-width:0; margin-top:14px; }
.pf-fld input, .pf-fld textarea, .pf-iconinput{ width:100%; min-height:48px; border:1px solid #e3e3e8; border-radius:12px; background:#fff; font-size:16px; color:${INK}; font-family:inherit; }
.pf-fld input, .pf-fld textarea{ padding:0 14px; }
.pf-fld textarea{ padding:12px 14px; line-height:1.5; resize:vertical; min-height:140px; }
.pf-fld input:disabled{ background:#f7f7f9; color:${INK_3}; }
.pf-fld input[aria-invalid="true"]{ border-color:#d97777; }
.pf-iconinput{ display:flex; align-items:center; gap:10px; padding:0 0 0 14px; }
.pf-iconinput > span{ color:${INK_3}; display:flex; }
.pf-iconinput input{ border:0; min-height:46px; padding:0 14px 0 0; outline:none; }
.pf-iconinput:focus-within{ outline:2px solid #dc2626; outline-offset:2px; }
.pf-err{ display:block; margin-top:6px; font-size:13px; color:#a32d2d; }
.pf-note{ padding:11px 13px; border-radius:12px; font-size:13.5px; line-height:1.45; margin-bottom:10px; }
.pf-note.ok{ background:#ecfdf5; color:#0f6e56; }
.pf-note.warn{ background:#fffbeb; color:#92400e; }
.pf-confirm{ padding:14px; border-radius:14px; border:1px solid #f1d0d0; background:#fff7f7; }
.pf-confirm p{ margin:0; font-size:14px; line-height:1.45; color:${INK_2}; }
.pf-confirm-row{ display:flex; gap:8px; margin-top:12px; flex-wrap:wrap; }

/* logo, capa, fotos */
.pf-logo-row{ display:flex; gap:14px; align-items:flex-start; }
.pf-logo-big{ width:88px; height:88px; flex-shrink:0; border-radius:20px; background:#f2f2f5; overflow:hidden; display:flex; align-items:center; justify-content:center; font-size:28px; font-weight:700; color:${INK_2}; box-shadow:inset 0 0 0 1px rgba(17,17,20,.06); }
.pf-logo-big img{ width:100%; height:100%; object-fit:cover; }
.pf-swatch{ width:44px; height:44px; border-radius:12px; border:2px solid #fff; box-shadow:0 0 0 1px #e3e3e8; display:flex; align-items:center; justify-content:center; }
.pf-swatch[aria-pressed="true"]{ box-shadow:0 0 0 2px ${INK}; }
.pf-cover-grid{ display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; margin-top:14px; }
.pf-cover{ position:relative; min-height:84px; border-radius:14px; border:2px solid transparent; box-shadow:0 0 0 1px #e3e3e8; display:flex; align-items:flex-end; padding:10px 12px; color:#fff; font-size:14px; font-weight:600; text-shadow:0 1px 4px rgba(0,0,0,.45); cursor:pointer; overflow:hidden; }
.pf-cover span{ display:inline-flex; align-items:center; gap:6px; }
.pf-cover[aria-pressed="true"], .pf-cover[data-on="true"]{ border-color:${INK}; }
.pf-cover i{ position:absolute; top:8px; right:8px; width:24px; height:24px; border-radius:50%; background:${INK}; color:#fff; display:flex; align-items:center; justify-content:center; text-shadow:none; }
.pf-cover.photo{ background:#f7f7f9; color:${INK}; text-shadow:none; border-style:dashed; box-shadow:none; border-color:#cfcfd6; justify-content:center; align-items:center; }
.pf-cover.photo[data-on="true"]{ color:#fff; text-shadow:0 1px 4px rgba(0,0,0,.6); border-style:solid; border-color:${INK}; }
.pf-cover.photo:focus-within{ outline:2px solid #dc2626; outline-offset:2px; }
.pf-photos{ display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; margin-top:14px; }
@media (min-width:560px){ .pf-photos{ grid-template-columns:repeat(4,minmax(0,1fr)); } }
.pf-photo{ position:relative; aspect-ratio:1; border-radius:12px; overflow:hidden; border:0; padding:0; background:#f2f2f5; box-shadow:inset 0 0 0 1px rgba(17,17,20,.06); }
.pf-photo img{ width:100%; height:100%; object-fit:cover; display:block; }
.pf-photo[aria-pressed="true"]{ outline:3px solid ${INK}; outline-offset:2px; }
.pf-photo-who{ position:absolute; left:6px; bottom:6px; max-width:calc(100% - 12px); padding:2px 8px; border-radius:999px; background:rgba(17,17,20,.72); color:#fff; font-size:11.5px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.pf-photo.add{ display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; border:1.5px dashed #cfcfd6; background:#fafafb; color:${INK_2}; font-size:13px; font-weight:500; cursor:pointer; box-shadow:none; }
.pf-photo.add:focus-within{ outline:2px solid #dc2626; outline-offset:2px; }
.pf-photo-panel .pf-btn.danger{ margin-top:12px; }

/* endereco */
.addr-grid{ display:grid; grid-template-columns:repeat(6,minmax(0,1fr)); column-gap:10px; }
.addr-grid .pf-fld{ grid-column:span 6; }
.addr-grid .addr-cep{ grid-column:span 6; }
.addr-grid [data-field="number"]{ grid-column:span 3; }
.addr-grid .addr-sn{ grid-column:span 3; }
.addr-grid .addr-city{ grid-column:span 4; }
.addr-grid .addr-uf{ grid-column:span 2; }
@media (min-width:640px){
  .addr-grid .addr-cep{ grid-column:span 2; }
  .addr-grid .addr-street{ grid-column:span 4; }
  .addr-grid [data-field="number"]{ grid-column:span 2; }
  .addr-grid .addr-sn{ grid-column:span 2; }
  .addr-grid [data-field="complement"]{ grid-column:span 2; }
  .addr-grid [data-field="district"]{ grid-column:span 2; }
  .addr-grid .addr-city{ grid-column:span 3; }
  .addr-grid .addr-uf{ grid-column:span 1; }
}
.addr-sn .pf-chip{ width:100%; justify-content:center; min-height:48px; border-radius:12px; }
.addr-cepbox{ position:relative; display:block; }
.addr-cepspin{ position:absolute; right:14px; top:50%; margin-top:-8px; color:${INK_3}; }
.addr-mapsec{ margin-top:22px; padding-top:18px; border-top:1px solid #f0f0f3; }
.addr-maphead{ display:flex; align-items:center; justify-content:space-between; gap:10px; }
.addr-mapstate{ display:inline-flex; align-items:center; gap:4px; font-size:13px; color:${INK_3}; }
.addr-mapbtns{ display:grid; grid-template-columns:minmax(0,1fr); gap:8px; margin:12px 0; }
@media (min-width:480px){ .addr-mapbtns{ grid-template-columns:repeat(2,minmax(0,1fr)); } }
.addr-map{ position:relative; border-radius:16px; overflow:hidden; background:#e9eef2; isolation:isolate; }
.addr-map-over{ position:absolute; inset:0; z-index:500; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; padding:20px; text-align:center; font-size:13.5px; line-height:1.4; color:${INK_2}; background:#eef1f4; }
.addr-zoom{ position:absolute; right:10px; top:10px; z-index:500; display:flex; flex-direction:column; border-radius:12px; overflow:hidden; box-shadow:0 2px 10px rgba(17,17,20,.18); }
.addr-zoom button{ width:44px; height:44px; border:0; background:#fff; color:${INK}; display:flex; align-items:center; justify-content:center; }
.addr-zoom button + button{ border-top:1px solid #ececf0; }
.addr-hint{ margin:8px 0 0; font-size:12.5px; line-height:1.45; color:${INK_3}; }
.addr-clear{ margin-top:22px; }
.eligi-addr-pin{ background:transparent; border:0; }

/* folha */
.pf-drop{ position:fixed; inset:0; z-index:9998; background:rgba(17,17,20,.32); animation:pf-fade .18s ease; }
@keyframes pf-fade{ from{opacity:0} to{opacity:1} }
@keyframes pf-up{ from{transform:translateY(24px); opacity:0} to{transform:none; opacity:1} }
.pf-sheet{ position:fixed; z-index:9999; left:0; right:0; bottom:calc(64px + env(safe-area-inset-bottom)); max-height:calc(100dvh - 104px - 64px - env(safe-area-inset-bottom)); display:flex; flex-direction:column; background:#fff; border-radius:22px 22px 0 0; font-family:${t.fontFamily}; color:${INK}; animation:pf-up .22s cubic-bezier(.34,1.56,.64,1); outline:none; }
.pf-grab{ width:40px; height:4px; border-radius:99px; background:#d6d6dc; margin:10px auto 0; flex-shrink:0; }
.pf-sh-top{ display:flex; align-items:flex-start; justify-content:space-between; gap:12px; padding:10px 16px 6px; flex-shrink:0; }
.pf-sh-t{ margin:0; font-family:${t.fontFamilyDisplay}; letter-spacing:-.03em; font-size:21px; font-weight:600; }
.pf-sh-s{ margin:4px 0 0; font-size:13.5px; line-height:1.45; color:${INK_3}; }
.pf-x{ width:44px; height:44px; flex-shrink:0; border:0; border-radius:12px; background:#f2f2f5; color:${INK_2}; display:flex; align-items:center; justify-content:center; }
.pf-sh-body{ flex:1; min-height:0; overflow-y:auto; overscroll-behavior:contain; -webkit-overflow-scrolling:touch; padding:6px 16px 18px; }
.pf-sh-foot{ flex-shrink:0; padding:12px 16px 14px; border-top:1px solid #f0f0f3; background:#fff; }
@media (min-width:1024px){
  .pf-sheet{ left:calc(50% + var(--sidebar-width, 0px) / 2); right:auto; bottom:auto; top:50%; transform:translate(-50%,-50%); width:min(var(--pf-w, 520px), calc(100vw - var(--sidebar-width, 0px) - 48px)); max-height:calc(100dvh - 120px); border-radius:22px; animation:pf-fade .18s ease; }
  .pf-grab{ display:none; }
  .pf-sh-top{ padding:20px 22px 6px; }
  .pf-sh-body{ padding:6px 22px 20px; }
  .pf-sh-foot{ padding:14px 22px 18px; border-radius:0 0 22px 22px; }
}
.pf-toast{ position:fixed; left:50%; transform:translateX(-50%); bottom:calc(64px + env(safe-area-inset-bottom) + 14px); z-index:10001; padding:11px 16px; border-radius:12px; background:${INK}; color:#fff; font-size:14px; font-weight:500; box-shadow:0 8px 24px rgba(17,17,20,.18); max-width:calc(100vw - 32px); font-family:${t.fontFamily}; }
@media (min-width:1024px){ .pf-toast{ bottom:24px; left:calc(50% + var(--sidebar-width, 0px) / 2); } }
@media (prefers-reduced-motion:reduce){ .pf, .pf-skel, .pf-sheet, .pf-drop{ animation:none; } .addr-spin{ animation-duration:2.4s; } }
`
