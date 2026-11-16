// src/features/clients/appStyles.ts
// @eligi:clients-app-css — aba "No app", direcao A (16/11/2026). Somado ao
// CLIENTS_CSS na pagina. Verde = recebe avisos; ambar = desligou; cinza = sem
// celular (so usa pelo navegador). Azul = veio pelo app (mesmo azul do selo
// "online" da agenda).

import { typography } from '@/shared/theme'
import { INK, INK_3, LINE, WARN } from './styles'

export const APP_OK = '#0f6e56'
export const APP_ONLINE = '#2563eb'

export const APP_CSS = `
.cl-app-sum{ display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; padding:12px 2px 0; }
@media (min-width:1024px){ .cl-app-sum{ padding:12px 16px 0; } }
.cl-app-k{ background:#fff; border:1px solid ${LINE}; border-radius:14px; padding:10px 12px; min-width:0; }
.cl-app-k .cl-app-l{ display:block; font-family:${typography.fontFamilyMono}; font-size:10.5px; letter-spacing:.06em; color:${INK_3}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.cl-app-k .cl-app-v{ display:block; font-family:${typography.fontFamilyDisplay}; font-size:24px; font-weight:600; letter-spacing:-.03em; font-variant-numeric:tabular-nums; color:${INK}; line-height:1.15; }
.cl-app-k .cl-app-s{ display:block; font-size:12px; color:${INK_3}; }
.cl-app-k.is-ok .cl-app-v{ color:${APP_OK}; }
.cl-app-k.is-online .cl-app-v{ color:${APP_ONLINE}; }
@media (max-width:599px){ .cl-app-k .cl-app-s{ display:none; } .cl-app-k .cl-app-v{ font-size:21px; } }
.cl-app-pill{ flex-shrink:0; display:inline-flex; align-items:center; gap:4px; font-size:11.5px; font-weight:600; padding:2px 8px; border-radius:999px; }
.cl-app-pill.is-ON{ color:${APP_OK}; background:#ecfdf5; }
.cl-app-pill.is-OFF{ color:${WARN}; background:#fffbeb; }
.cl-app-pill.is-NONE{ color:${INK_3}; background:#f0f0f3; }
.cl-row-meta.is-online{ color:${APP_ONLINE}; }
`
