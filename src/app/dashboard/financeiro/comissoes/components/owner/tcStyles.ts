// src/app/dashboard/financeiro/comissoes/components/owner/tcStyles.ts
// @eligi:tcf-css — aba Comparar da tela de comissoes do dono (direcao B "Ficha" +
// visao Equipe da C, nov/2026). Soma-se ao MC_CSS + OC_CSS. Layout por @media.
// Verde = melhorou, vermelho escuro = piorou (sempre com seta e sinal, nunca so cor).

import { typography } from '@/shared/theme'
import { INK, MUTED, FAINT, TRACK, OK, BAD } from '../my/mcStyles'

export const TC_CSS = `
.oc-seg.four{grid-template-columns:repeat(4,minmax(0,1fr))}
@media (min-width:1024px){.oc-seg.four{grid-template-columns:repeat(4,auto)}}
.tc-bar{display:grid;gap:10px;margin-bottom:12px}
@media (min-width:1024px){.tc-bar{grid-template-columns:minmax(0,560px) auto;justify-content:space-between;align-items:center}}
.tc-bar .mcw-cmpw{min-width:0}
.tc-view{display:inline-grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:2px;padding:3px;background:${TRACK};border-radius:12px}
.tc-view button{min-height:40px;padding:0 16px;border:0;border-radius:9px;background:transparent;font-size:13px;font-weight:500;color:${MUTED}}
.tc-view button[aria-pressed=true]{background:#fff;color:${INK};font-weight:600;box-shadow:0 1px 2px rgba(0,0,0,.08)}
.tc-chips{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px}
.tc-chips::-webkit-scrollbar{display:none}
.tc-split{display:grid;gap:12px;grid-template-columns:minmax(0,1fr);align-items:start}
@media (min-width:1024px){.tc-split{grid-template-columns:minmax(0,280px) minmax(0,1fr)}}
.tc-list{display:none;padding:8px}
@media (min-width:1024px){.tc-list{display:block;position:sticky;top:calc(var(--navbar-offset,104px) + 12px)}}
.tc-pro{display:grid;grid-template-columns:40px minmax(0,1fr) auto;gap:10px;align-items:center;width:100%;min-height:58px;padding:8px;border:0;border-radius:12px;background:transparent;text-align:left}
.tc-pro:hover{background:#f7f7f9}
.tc-pro[aria-current=true]{background:${TRACK}}
.tc-pro .nm{font-size:14px;font-weight:600;color:${INK}}
.tc-pro .sm{font-size:12px;color:${FAINT};margin-top:2px}
.tc-pchips{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;margin-bottom:12px;padding:2px 0}
.tc-pchips::-webkit-scrollbar{display:none}
@media (min-width:1024px){.tc-pchips{display:none}}
.tc-pchip{flex-shrink:0;display:flex;align-items:center;gap:8px;min-height:48px;padding:4px 12px 4px 4px;border-radius:999px;border:.5px solid rgba(0,0,0,.14);background:#fff;font-size:13.5px;font-weight:600;color:${INK}}
.tc-pchip .oc-av{width:38px;height:38px;border-radius:999px;font-size:13px}
.tc-pchip[aria-pressed=true]{background:${INK};border-color:${INK};color:#fff}
.tc-pchip[aria-pressed=true] span{color:#fff}
.tc-pchip[aria-pressed=true] .oc-av{color:${INK}}
.tc-main{display:grid;gap:12px;min-width:0}
.tc-head{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.tc-head .nm{font-family:${typography.fontFamilyDisplay};font-size:24px;font-weight:600;letter-spacing:-.035em;line-height:1.1;color:${INK}}
.tc-head .sm{font-size:13px;color:${MUTED};margin-top:3px}
.tc-pdf{display:grid;justify-items:end;gap:4px}
@media (max-width:599px){.tc-pdf{flex-basis:100%;justify-items:stretch}.tc-pdf .mc-btn{width:100%;justify-content:center}}
.tc-cards{display:grid;gap:10px;grid-template-columns:minmax(0,1fr) minmax(0,1fr)}
@media (min-width:768px){.tc-cards{grid-template-columns:repeat(3,minmax(0,1fr))}}
.tc-card{padding:14px;min-width:0}
.tc-card .big{font-size:clamp(24px,7vw,30px);font-weight:600;line-height:1.05;margin-top:6px;color:${INK}}
.tc-card .sm{font-size:12.5px;color:${FAINT};margin-top:6px;line-height:1.4}
.tc-card.wide{grid-column:1/-1}
@media (min-width:768px){.tc-card.wide{grid-column:auto}}
.tc-say{font-size:14px;line-height:1.5;margin-top:6px;color:${INK}}
.tc-say b{font-weight:600}
.tc-say .bad{color:${BAD};font-weight:600}
.tc-dl{display:inline-flex;align-items:center;gap:3px;height:22px;padding:0 8px;border-radius:999px;font-size:12px;font-weight:600;white-space:nowrap;font-variant-numeric:tabular-nums}
.tc-dl.up{color:${OK};background:rgba(29,158,117,.12)}
.tc-dl.dn{color:${BAD};background:rgba(220,38,38,.08)}
.tc-dl.eq{color:#64748b;background:rgba(100,116,139,.10)}
.tc-rows{padding:2px 14px 6px}
.tc-rh{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:10px;padding:10px 0 6px;font-family:${typography.fontFamilyDisplay};font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:${FAINT}}
.tc-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 10px;align-items:center;padding:11px 0;border-top:.5px solid rgba(0,0,0,.07)}
.tc-row .lb{font-size:14px;font-weight:600;color:${INK}}
.tc-row .vs{display:flex;align-items:baseline;justify-content:flex-end;gap:8px;text-align:right}
.tc-row .v1{font-size:16px;font-weight:600;color:${INK}}
.tc-row .v2{font-size:12.5px;color:${FAINT}}
.tc-row .bars{grid-column:1/-1;display:grid;gap:3px}
.tc-row .bars i{display:block;height:6px;border-radius:3px;background:${TRACK};overflow:hidden}
.tc-row .bars i b{display:block;height:100%;border-radius:3px;background:${INK}}
.tc-row .bars i.r b{background:#a1a1aa}
.tc-row .dl{grid-column:2;justify-self:end}
@media (min-width:768px){
  .tc-row{grid-template-columns:minmax(0,170px) minmax(0,1fr) 92px 74px;gap:12px}
  .tc-row .bars{grid-column:auto}
  .tc-row .vs{flex-direction:column;align-items:flex-end;gap:0}
  .tc-row .dl{grid-column:auto}
}
.tc-two{display:grid;gap:12px;grid-template-columns:minmax(0,1fr)}
@media (min-width:768px){.tc-two{grid-template-columns:minmax(0,1.2fr) minmax(0,1fr)}}
.tc-box{padding:14px;min-width:0}
.tc-lg{display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:${MUTED}}
.tc-lg i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:5px;vertical-align:-1px;background:${INK}}
.tc-lg i.r{background:#c4c4cc}
.tc-wk{display:flex;align-items:flex-end;gap:12px;height:130px;margin-top:12px}
.tc-wk>div{flex:1;min-width:0;display:flex;align-items:flex-end;justify-content:center;gap:3px;height:100%}
.tc-wk b{display:block;width:min(18px,40%);border-radius:4px 4px 0 0;background:${INK};min-height:2px}
.tc-wk b.r{background:#c4c4cc}
.tc-wx{display:flex;gap:12px;margin-top:6px}
.tc-wx span{flex:1;text-align:center;font-size:11.5px;color:${FAINT}}
.tc-sv{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 10px;padding:9px 0;border-top:.5px solid rgba(0,0,0,.07)}
.tc-sv:first-of-type{border-top:0}
.tc-sv .nm{font-size:13.5px;font-weight:600;color:${INK}}
.tc-sv .n{font-size:13px;color:${MUTED}}
.tc-sv .bar{grid-column:1/-1;height:5px;border-radius:3px;background:${TRACK};overflow:hidden}
.tc-sv .bar i{display:block;height:100%;background:${INK}}
.tc-foot{font-size:12px;color:${FAINT};line-height:1.45}
/* equipe */
.tc-mx{padding:6px 10px;overflow-x:auto}
.tc-mx table{width:100%;border-collapse:collapse;min-width:560px}
.tc-mx th{padding:8px 6px;text-align:right;font-weight:600;font-size:12.5px;color:${INK};vertical-align:bottom}
.tc-mx th:first-child{text-align:left;font-family:${typography.fontFamilyDisplay};font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:${FAINT}}
.tc-mx th .oc-av{width:30px;height:30px;border-radius:9px;font-size:11px;margin:0 0 4px auto}
.tc-mx td{padding:3px;border-top:.5px solid rgba(0,0,0,.07)}
.tc-mx td:first-child{padding:0 6px;font-size:13.5px;font-weight:600;color:${INK};white-space:nowrap}
.tc-mx td.avg{padding:0 8px;text-align:right;font-size:13.5px;color:${MUTED}}
.tc-cell{display:flex;align-items:center;justify-content:flex-end;gap:4px;min-height:40px;padding:0 10px;border-radius:10px;font-family:${typography.fontFamilyDisplay};font-size:14.5px;font-weight:600;font-variant-numeric:tabular-nums;white-space:nowrap}
.tc-cell.dk{color:#fff}
.tc-cell.dk span{color:#fff}
.tc-mxl{display:flex;gap:14px;flex-wrap:wrap;margin-top:8px;font-size:12px;color:${FAINT}}
.tc-mxm{display:none}
@media (max-width:767px){.tc-mx{display:none}.tc-mxm{display:grid;gap:10px}}
.tc-mc{padding:12px 14px}
.tc-mr{display:grid;grid-template-columns:28px minmax(0,1fr) auto;gap:8px;align-items:center;padding:6px 0}
.tc-mr .oc-av{width:28px;height:28px;border-radius:8px;font-size:10.5px}
.tc-mr .nm{font-size:13px;color:${INK}}
.tc-mr .bar{grid-column:2/3;height:6px;border-radius:3px;background:${TRACK};overflow:hidden;margin-top:4px}
.tc-mr .bar i{display:block;height:100%;background:#52525b}
.tc-mr .bar i.best{background:${OK}}
.tc-mr .v{font-family:${typography.fontFamilyDisplay};font-size:14px;font-weight:600;font-variant-numeric:tabular-nums;text-align:right}
`
