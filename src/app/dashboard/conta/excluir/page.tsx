'use client'
// src/app/dashboard/conta/excluir/page.tsx
// @eligi:account-deletion-page
// Excluir a propria conta (Apple 5.1.1(v) e Google Play). Direcao A.
// Liberada para qualquer cargo (routeAccess ALWAYS_ALLOWED '/dashboard/conta').
// O servidor decide tudo: tipo de conta (dono, equipe), bloqueio por EligiClub,
// prazo de 7 dias. A tela so explica e pede a palavra EXCLUIR.

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ChevronLeft, MessageCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import {
  CONFIRM_WORD, GRACE_DAYS, type DeletionResult, type DeletionStatus,
  errorMessage, fetchDeletionStatus, formatDay, goToLogin, isConfirmWord,
  requestAccountDeletion, supportLink,
} from '@/features/account/accountDeletion'

const INK = '#111114'
const INK2 = '#4b4b52'
const INK3 = '#8a8a93'
const RED = '#dc2626'
const LINE = 'rgba(17,17,20,.08)'

const CSS = `
.acx-page{max-width:560px;margin:0 auto;padding:calc(var(--navbar-offset,104px) + 16px) 20px 48px;font-family:var(--font-eligi-sans),system-ui,sans-serif;color:${INK}}
@media (max-width:767px){.acx-page{padding:calc(var(--navbar-offset,104px) + 8px) 16px calc(64px + env(safe-area-inset-bottom,0px) + 24px)}}
.acx-page h1,.acx-page p,.acx-page span,.acx-page li{color:inherit}
.acx-back{display:inline-flex;align-items:center;gap:4px;min-height:40px;font-size:13px;font-weight:600;color:${INK3};text-decoration:none;margin-bottom:8px}
.acx-title{margin:0 0 6px;font-family:var(--font-eligi-display),system-ui,sans-serif;font-size:26px;font-weight:600;letter-spacing:-.03em;line-height:1.15;text-wrap:balance}
.acx-lead{margin:0 0 20px;font-size:15px;line-height:1.5;color:${INK2}}
.acx-card{background:#fff;border:1px solid ${LINE};border-radius:16px;padding:18px;box-shadow:0 4px 20px rgba(17,17,20,.05);display:flex;flex-direction:column;gap:16px}
.acx-label{font-size:11px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:${INK3};margin:0 0 6px}
.acx-list{margin:0;padding-left:18px;font-size:14px;line-height:1.55;color:${INK2}}
.acx-hr{height:1px;background:${LINE}}
.acx-note{margin:0;font-size:14px;line-height:1.5;color:${INK2}}
.acx-input{width:100%;box-sizing:border-box;min-height:48px;font-size:16px;font-family:var(--font-eligi-mono),ui-monospace,monospace;letter-spacing:.08em;padding:0 14px;border-radius:12px;border:1px solid rgba(17,17,20,.16);background:#fff;color:${INK}}
.acx-input:focus-visible{outline:2px solid ${RED};outline-offset:2px}
.acx-btn{width:100%;min-height:50px;border:0;border-radius:14px;font-size:15px;font-weight:600;font-family:inherit;cursor:pointer}
.acx-btn:disabled{cursor:not-allowed;opacity:.45}
.acx-red{background:${RED};color:#fff}
.acx-ink{background:${INK};color:#fff;display:inline-flex;align-items:center;justify-content:center;gap:8px;text-decoration:none}
.acx-err{margin:0;font-size:13px;line-height:1.45;color:#b91c1c}
.acx-skel{height:220px;border-radius:16px;background:rgba(17,17,20,.05);animation:acx-p 1.2s ease-in-out infinite}
@keyframes acx-p{50%{opacity:.5}}
@media (prefers-reduced-motion:reduce){.acx-skel{animation:none}}
`

type View =
  | { s: 'loading' }
  | { s: 'error'; msg: string }
  | { s: 'ready'; status: DeletionStatus }
  | { s: 'done'; result: DeletionResult }

export default function ExcluirContaPage() {
  const { user } = useAuth()
  const [view, setView] = useState<View>({ s: 'loading' })
  const [typed, setTyped] = useState('')
  const [sending, setSending] = useState(false)
  const [sendErr, setSendErr] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    const run = async () => {
      try {
        const status = await fetchDeletionStatus()
        if (alive) setView({ s: 'ready', status })
      } catch (e) {
        if (alive) setView({ s: 'error', msg: errorMessage(e, 'Não foi possível carregar. Tente de novo.') })
      }
    }
    void run()
    return () => { alive = false }
  }, [])

  const business = user?.businessName?.trim() || 'seu negócio'

  async function submit() {
    if (!isConfirmWord(typed) || sending) return
    setSending(true)
    setSendErr(null)
    try {
      const result = await requestAccountDeletion()
      setView({ s: 'done', result })
    } catch (e) {
      setSendErr(errorMessage(e, 'Não foi possível excluir agora. Tente de novo ou fale com o suporte.'))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="acx-page">
      <style>{CSS}</style>
      <Link href="/dashboard" className="acx-back">
        <ChevronLeft size={16} strokeWidth={2.2} /> Voltar
      </Link>

      {view.s === 'loading' && <div className="acx-skel" aria-label="Carregando" />}

      {view.s === 'error' && (
        <div className="acx-card">
          <p className="acx-err">{view.msg}</p>
          <button type="button" className="acx-btn acx-ink" onClick={() => window.location.reload()}>
            Tentar de novo
          </button>
        </div>
      )}

      {view.s === 'done' && <Done result={view.result} business={business} />}

      {view.s === 'ready' && view.status.blockedReason && (
        <>
          <h1 className="acx-title">Excluir a conta do {business}</h1>
          <p className="acx-lead">
            {view.status.blockedReason === 'CLUB_ACCOUNT'
              ? 'Esta conta tem a cobrança do EligiClub ativa, com dinheiro de clientes na conta de pagamentos. Para encerrar sem perder nada, a exclusão é feita com o suporte.'
              : 'Você é dono de mais de um estabelecimento no Eligi. A exclusão é feita com o suporte, para não apagar o negócio errado.'}
          </p>
          <a
            className="acx-btn acx-ink"
            href={supportLink(`Olá! Quero excluir a conta do ${business} no Eligi.`)}
            target="_blank" rel="noopener noreferrer"
          >
            <MessageCircle size={18} /> Falar com o suporte no WhatsApp
          </a>
        </>
      )}

      {view.s === 'ready' && !view.status.blockedReason && (
        view.status.kind === 'OWNER'
          ? (
            <>
              <h1 className="acx-title">Excluir a conta do {business}</h1>
              <p className="acx-lead">O negócio inteiro sai do Eligi, para você e para a sua equipe.</p>
              <div className="acx-card">
                <div>
                  <p className="acx-label">Apagado em {GRACE_DAYS} dias</p>
                  <ul className="acx-list">
                    <li>Agenda, clientes, equipe e fotos</li>
                    <li>A assinatura do Eligi é cancelada hoje</li>
                  </ul>
                </div>
                <div>
                  <p className="acx-label">Fica guardado</p>
                  <ul className="acx-list">
                    <li>Notas fiscais emitidas, por 5 anos (exigência da lei)</li>
                  </ul>
                </div>
                <div className="acx-hr" />
                <p className="acx-note">Até lá dá para desistir entrando no Eligi.</p>
                <Confirm typed={typed} setTyped={setTyped} sending={sending} err={sendErr} onSubmit={submit} />
              </div>
            </>
          )
          : (
            <>
              <h1 className="acx-title">Excluir a sua conta</h1>
              <p className="acx-lead">
                Só o seu acesso sai, na hora. Os atendimentos que você fez continuam no {business}.
              </p>
              <div className="acx-card">
                <p className="acx-note">Depois de excluir, para voltar a usar o Eligi será preciso um convite novo.</p>
                <Confirm typed={typed} setTyped={setTyped} sending={sending} err={sendErr} onSubmit={submit} />
              </div>
            </>
          )
      )}
    </div>
  )
}

function Confirm({ typed, setTyped, sending, err, onSubmit }: {
  typed: string
  setTyped: (v: string) => void
  sending: boolean
  err: string | null
  onSubmit: () => void
}) {
  const ok = isConfirmWord(typed)
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit() }}
      style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
    >
      <label htmlFor="acx-confirm" className="acx-label" style={{ margin: 0 }}>
        Digite {CONFIRM_WORD} para confirmar
      </label>
      <input
        id="acx-confirm"
        className="acx-input"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        autoComplete="off" autoCapitalize="characters" autoCorrect="off" spellCheck={false}
      />
      {err && <p className="acx-err" role="alert">{err}</p>}
      <button type="submit" className="acx-btn acx-red" disabled={!ok || sending}>
        {sending ? 'Excluindo…' : 'Excluir conta'}
      </button>
    </form>
  )
}

function Done({ result, business }: { result: DeletionResult; business: string }) {
  const scheduled = result.status === 'SCHEDULED' && result.scheduledFor
  return (
    <div className="acx-card" style={{ alignItems: 'flex-start' }}>
      <h1 className="acx-title" style={{ margin: 0 }}>
        {scheduled ? 'Exclusão marcada' : 'Conta excluída'}
      </h1>
      <p className="acx-note">
        {scheduled
          ? `O ${business} será apagado em ${formatDay(result.scheduledFor as string)}. Enviamos um e-mail com os detalhes. Até lá, para desistir, é só entrar no Eligi.`
          : 'Seu acesso foi removido. Obrigado por ter usado o Eligi.'}
      </p>
      <button type="button" className="acx-btn acx-ink" onClick={goToLogin}>
        Ok
      </button>
    </div>
  )
}
