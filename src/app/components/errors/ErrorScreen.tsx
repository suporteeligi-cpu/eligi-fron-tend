'use client'

import { CalendarDays, Lock, RotateCcw, TriangleAlert, WifiOff } from 'lucide-react'
import type { ReactNode } from 'react'

export type ErrorScreenKind = 'denied' | 'error' | 'offline'

export interface ErrorScreenProps {
  /** Tipo da tela: acesso negado, erro inesperado ou sem conexão */
  kind: ErrorScreenKind
  /** Rota onde o problema ocorreu (aparece no chip) */
  route?: string
  /** Digest do error boundary do Next — identifica o erro no log do Railway */
  digest?: string
  /** Ação do botão secundário; sem handler = reload da página */
  onRetry?: () => void
  /** true = ocupa a viewport inteira (global-error); false = preenche a área de conteúdo */
  fullPage?: boolean
}

interface KindConfig {
  color: string
  icon: ReactNode
  code: string
  title: string
  message: string
  showAgenda: boolean
  showRetry: boolean
  live: string | null
}

const ICON_PROPS = { size: 26, strokeWidth: 1.8 } as const

const CONFIG: Record<ErrorScreenKind, KindConfig> = {
  denied: {
    color: '#f59e0b',
    icon: <Lock {...ICON_PROPS} color="#f59e0b" />,
    code: '403',
    title: 'Acesso negado',
    message:
      'Seu cargo não tem permissão para acessar esta área. Se precisar deste acesso, fale com o responsável do estabelecimento.',
    showAgenda: true,
    showRetry: false,
    live: null,
  },
  error: {
    color: '#dc2626',
    icon: <TriangleAlert {...ICON_PROPS} color="#dc2626" />,
    code: 'ERRO',
    title: 'Algo deu errado',
    message:
      'Encontramos um erro ao carregar esta página. Você pode tentar de novo ou voltar para a agenda.',
    showAgenda: true,
    showRetry: true,
    live: null,
  },
  offline: {
    color: '#38bdf8',
    icon: <WifiOff {...ICON_PROPS} color="#38bdf8" />,
    code: 'OFFLINE',
    title: 'Sem conexão',
    message:
      'Você está sem internet. Assim que a conexão voltar, esta tela fecha sozinha e você continua de onde parou.',
    showAgenda: false,
    showRetry: true,
    live: 'Reconectando automaticamente',
  },
}

const CSS = `
.eligi-err-wrap{position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden;min-height:min(72dvh,720px);width:100%;padding:24px;font-family:'Inter',system-ui,-apple-system,sans-serif}
.eligi-err-full{min-height:100dvh;background:radial-gradient(1100px 480px at 50% -10%,rgba(220,38,38,.055),transparent 60%),#07070b}
.eligi-err-blob{position:absolute;width:420px;height:420px;border-radius:50%;filter:blur(90px);opacity:.3;pointer-events:none}
.eligi-err-blob-1{background:#dc2626;top:-120px;left:-80px;animation:eligiErrBlob1 14s ease-in-out infinite}
.eligi-err-blob-2{background:#7c3aed;bottom:-140px;right:-90px;animation:eligiErrBlob2 17s ease-in-out infinite}
@keyframes eligiErrBlob1{0%,100%{transform:translate(0,0)}50%{transform:translate(70px,50px)}}
@keyframes eligiErrBlob2{0%,100%{transform:translate(0,0)}50%{transform:translate(-60px,-60px)}}
.eligi-err-card{position:relative;z-index:1;width:min(430px,100%);border-radius:24px;padding:36px 32px;background:rgba(18,18,26,.72);border:1px solid rgba(255,255,255,.10);backdrop-filter:blur(24px) saturate(160%);-webkit-backdrop-filter:blur(24px) saturate(160%);box-shadow:0 30px 80px -30px rgba(0,0,0,.7);text-align:center}
.eligi-err-tile{width:52px;height:52px;border-radius:15px;display:flex;align-items:center;justify-content:center;margin:0 auto 20px}
.eligi-err-title{font-family:'Space Grotesk','Inter',system-ui,sans-serif;font-size:23px;font-weight:600;color:#f4f4f6;margin:0}
.eligi-err-msg{color:rgba(244,244,246,.62);font-size:14px;line-height:1.6;margin:9px 0 0}
.eligi-err-chip{display:inline-flex;align-items:center;gap:8px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11.5px;color:rgba(244,244,246,.45);border:1px solid rgba(255,255,255,.09);border-radius:8px;padding:5px 10px;background:rgba(255,255,255,.02);margin-top:18px;word-break:break-all}
.eligi-err-actions{display:flex;flex-direction:column;gap:9px;margin-top:24px}
.eligi-err-btn{display:inline-flex;align-items:center;gap:8px;justify-content:center;width:100%;border-radius:12px;padding:12px 22px;font-family:inherit;font-size:14px;font-weight:600;cursor:pointer;border:none;transition:transform .15s ease,opacity .15s ease,background .15s ease}
.eligi-err-btn:active{transform:scale(.97)}
.eligi-err-btn-red{background:linear-gradient(135deg,#dc2626,#b91c1c);color:#fff;box-shadow:0 8px 24px -8px rgba(220,38,38,.55)}
.eligi-err-btn-red:hover{opacity:.92}
.eligi-err-btn-ghost{background:transparent;color:#f4f4f6;border:1px solid rgba(255,255,255,.16)}
.eligi-err-btn-ghost:hover{background:rgba(255,255,255,.06)}
.eligi-err-live{display:flex;align-items:center;justify-content:center;gap:8px;font-size:12.5px;color:rgba(244,244,246,.62);margin-top:18px}
.eligi-err-live-dot{width:8px;height:8px;border-radius:99px;background:#38bdf8;animation:eligiErrPulse 1.6s ease infinite}
@keyframes eligiErrPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.8)}}
@media (prefers-reduced-motion:reduce){.eligi-err-blob-1,.eligi-err-blob-2,.eligi-err-live-dot{animation:none}}
`

export default function ErrorScreen({
  kind,
  route,
  digest,
  onRetry,
  fullPage = false,
}: ErrorScreenProps) {
  const cfg = CONFIG[kind]

  const goAgenda = () => {
    // Hard navigation de propósito: limpa qualquer estado client corrompido pelo erro.
    window.location.assign('/dashboard/agenda')
  }

  const retry = () => {
    if (onRetry) {
      onRetry()
      return
    }
    window.location.reload()
  }

  const chipParts = [cfg.code, route, digest ? `digest: ${digest}` : null]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className={`eligi-err-wrap${fullPage ? ' eligi-err-full' : ''}`}>
      <style>{CSS}</style>
      <div className="eligi-err-blob eligi-err-blob-1" aria-hidden="true" />
      <div className="eligi-err-blob eligi-err-blob-2" aria-hidden="true" />
      <div className="eligi-err-card" role="alert">
        <div
          className="eligi-err-tile"
          style={{ background: `${cfg.color}1a`, border: `1px solid ${cfg.color}40` }}
        >
          {cfg.icon}
        </div>
        <h2 className="eligi-err-title">{cfg.title}</h2>
        <p className="eligi-err-msg">{cfg.message}</p>
        <div className="eligi-err-chip">{chipParts}</div>
        <div className="eligi-err-actions">
          {cfg.showAgenda && (
            <button type="button" className="eligi-err-btn eligi-err-btn-red" onClick={goAgenda}>
              <CalendarDays size={16} strokeWidth={2} />
              Voltar para a agenda
            </button>
          )}
          {cfg.showRetry && (
            <button type="button" className="eligi-err-btn eligi-err-btn-ghost" onClick={retry}>
              <RotateCcw size={15} strokeWidth={2} />
              {kind === 'offline' ? 'Tentar agora' : 'Tentar novamente'}
            </button>
          )}
        </div>
        {cfg.live !== null && (
          <div className="eligi-err-live">
            <span className="eligi-err-live-dot" />
            {cfg.live}…
          </div>
        )}
      </div>
    </div>
  )
}
