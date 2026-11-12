// src/app/dashboard/financeiro/comissoes/components/owner/ocStyles.ts
// @eligi:ocf-css — tela de comissoes do dono e do gerente, direcao "A + pessoa da C"
// (nov/2026). Soma-se ao MC_CSS (classes base .mc-*, folha .mcw-*). Layout por
// @media, nunca isMobile. Verde #15803d = Gerar liberado; grafite = bloqueado.

import { typography } from '@/shared/theme'
import { INK, MUTED, FAINT, TRACK, OK, WARN } from '../my/mcStyles'

export const GREEN = '#15803d'

export const OC_CSS = `
.oc-page{max-width:1180px}
.oc-head{display:flex;align-items:flex-start;gap:12px;margin:2px 0 14px}
.oc-big{font-size:clamp(34px,11vw,48px);font-weight:600;line-height:1;margin:8px 0 8px;color:${INK}}
.oc-sub{font-size:13px;color:${MUTED};line-height:1.4}
.oc-gear{width:44px;height:44px;border-radius:12px;border:.5px solid rgba(0,0,0,.11);background:#fff;display:grid;place-items:center;flex-shrink:0;margin-left:auto;color:${INK}}
.oc-seg{margin-bottom:14px}
.oc-seg.two{grid-template-columns:repeat(2,minmax(0,1fr))}
@media (min-width:1024px){.oc-seg.two{grid-template-columns:repeat(2,auto)}}
.oc-split{display:grid;gap:12px;grid-template-columns:minmax(0,1fr);align-items:start}
.oc-side{display:none}
@media (min-width:1024px){.oc-split{grid-template-columns:minmax(0,1fr) minmax(0,420px)}.oc-side{display:block;position:sticky;top:calc(var(--navbar-offset,104px) + 12px)}}
.oc-col{display:grid;gap:12px;min-width:0}
.oc-card{padding:14px 14px 12px;min-width:0}
.oc-step{display:flex;align-items:center;justify-content:space-between;gap:8px}
.oc-pill{display:inline-flex;align-items:center;height:22px;padding:0 9px;border-radius:999px;font-size:11.5px;font-weight:600;white-space:nowrap}
.oc-pill.done{color:${INK};background:${TRACK}}
.oc-pill.run{color:${WARN};background:rgba(245,158,11,.12)}
.oc-pill.wait{color:#64748b;background:rgba(100,116,139,.10)}
.oc-title{font-family:${typography.fontFamilyDisplay};font-size:18px;font-weight:600;letter-spacing:-.025em;margin:8px 0 2px;color:${INK}}
.oc-hint{font-size:12.5px;color:${FAINT};margin-bottom:10px}
.oc-people{display:grid;gap:8px}
.oc-person{display:grid;grid-template-columns:40px minmax(0,1fr) auto 16px;gap:10px;align-items:center;width:100%;min-height:60px;padding:9px 10px 9px 9px;border-radius:14px;border:1px solid rgba(0,0,0,.09);background:#fff;text-align:left}
.oc-person:hover{border-color:rgba(0,0,0,.2)}
.oc-person[aria-current=true]{border-color:${INK};box-shadow:0 0 0 1px ${INK}}
.oc-person .nm{font-size:14px;font-weight:600;color:${INK}}
.oc-person .sm{display:flex;flex-wrap:wrap;gap:4px 8px;font-size:11.5px;color:${FAINT};margin-top:2px;align-items:center}
.oc-person .v{font-size:16px;font-weight:600;text-align:right;color:${INK}}
.oc-person>svg{color:${FAINT}}
.oc-club{display:inline-flex;align-items:center;gap:4px;height:18px;padding:0 6px;border-radius:6px;font-size:11px;font-weight:600;color:${WARN};background:rgba(245,158,11,.12)}
.oc-av{width:40px;height:40px;border-radius:12px;background:${TRACK};display:grid;place-items:center;overflow:hidden;font-family:${typography.fontFamilyDisplay};font-weight:600;font-size:14px;color:${INK};flex-shrink:0}
.oc-av img{width:100%;height:100%;object-fit:cover}
.oc-av.lg{width:52px;height:52px;border-radius:15px;font-size:18px}
.oc-go{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:52px;margin-top:12px;border:0;border-radius:14px;font-size:15px;font-weight:600;padding:0 14px}
.oc-go span{color:inherit}
.oc-go.ok{background:${GREEN};color:#fff}
.oc-go.lock{background:${INK};color:#fff;cursor:default}
.oc-go.lock:disabled{opacity:1;cursor:default}
.oc-go .mc-num{font-size:15px;letter-spacing:-.02em}
.oc-note{font-size:12px;color:${FAINT};margin-top:10px;line-height:1.45}
.oc-msg{font-size:13px;padding:10px 12px;border-radius:12px;margin-top:10px}
.oc-msg.ok{color:${OK};background:rgba(29,158,117,.10)}
.oc-msg.bad{color:#a32d2d;background:rgba(220,38,38,.08)}
.oc-line{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:8px 0;border-top:.5px solid rgba(0,0,0,.07)}
.oc-who{display:flex;align-items:center;gap:10px;min-width:0;min-height:48px;border:0;background:none;padding:0;text-align:left}
.oc-line:first-of-type{border-top:0}
.oc-line .nm{font-size:14px;font-weight:600;color:${INK}}
.oc-line .sm{font-size:11.5px;color:${FAINT};margin-top:2px}
.oc-line .rt{display:flex;align-items:center;gap:10px}
.oc-line .v{font-size:15px;font-weight:600;color:${INK}}
.oc-btn2{min-height:40px;padding:0 12px;border-radius:11px;border:1px solid rgba(0,0,0,.16);background:#fff;font-size:13px;font-weight:600;color:${INK};white-space:nowrap}
@media (max-width:479px){.oc-line{grid-template-columns:minmax(0,1fr)}.oc-line .rt{justify-content:space-between;padding-left:50px}}
.oc-btn2{min-height:44px}
.oc-run{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;margin-top:8px}
.oc-run .v{font-size:24px;font-weight:600;color:${INK}}
.oc-empty{padding:22px 8px 10px;text-align:center;font-size:13.5px;color:${MUTED}}
.oc-empty b{display:block;font-family:${typography.fontFamilyDisplay};font-size:16px;font-weight:600;color:${INK};margin-bottom:4px}
.oc-filters{display:grid;gap:4px;margin-bottom:6px}
/* detalhe da pessoa */
.oc-det{padding:16px;min-width:0}
.oc-det-h{display:flex;align-items:center;gap:12px}
.oc-det-h .nm{font-family:${typography.fontFamilyDisplay};font-size:19px;font-weight:600;letter-spacing:-.025em;color:${INK}}
.oc-det-h .sm{font-size:12.5px;color:${FAINT};margin-top:2px}
.oc-boxes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:14px 0}
.oc-box{padding:10px 11px;border-radius:12px;background:#f5f5f7;min-width:0}
.oc-box .l{font-size:11px;color:${FAINT};text-transform:uppercase;letter-spacing:.06em;font-weight:600}
.oc-box .v{font-size:17px;font-weight:600;margin-top:4px;color:${INK}}
.oc-box.main{background:${INK}}
.oc-box.main .l{color:rgba(255,255,255,.65)}
.oc-box.main .v{color:#fff}
.oc-box.main .mc-cents{color:rgba(255,255,255,.6)}
.oc-ith{display:flex;justify-content:space-between;align-items:center;gap:8px;margin:4px 0 4px}
.oc-it{display:grid;grid-template-columns:44px minmax(0,1fr) auto;gap:10px;align-items:center;padding:10px 0;border-top:.5px solid rgba(0,0,0,.07)}
.oc-it .d{font-size:12px;color:${FAINT}}
.oc-it .nm{font-size:13.5px;font-weight:500;color:${INK}}
.oc-it .why{font-size:11.5px;color:${FAINT};margin-top:2px}
.oc-it .v{font-size:14.5px;font-weight:600;text-align:right;color:${INK}}
.oc-more{width:100%;min-height:44px;margin-top:8px;border-radius:12px;border:.5px solid rgba(0,0,0,.14);background:#fff;font-size:13.5px;font-weight:600;color:${INK}}
.oc-info{font-size:12.5px;color:${MUTED};background:#f5f5f7;border-radius:12px;padding:10px 12px;margin-top:12px;line-height:1.45}
.mcw-sheet .oc-det{padding:4px 0 0}
.mcw-sheet .oc-box:not(.main),.mcw-sheet .oc-info{background:#fff;border:.5px solid rgba(0,0,0,.08)}
`
