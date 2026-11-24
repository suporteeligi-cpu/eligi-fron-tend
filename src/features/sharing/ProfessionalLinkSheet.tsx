'use client'
// @eligi:prolink-sheet — link de agendamento de cada profissional (direcao A "Cartao pessoal").
// app.eligi.com.br/<slug>/<apelido>: quem abre ja cai com ele escolhido; com o app
// Eligi Cliente instalado, o mesmo link abre no app.
//  - Sem `data`: busca o link do proprio profissional logado (GET /equipe/me/link).
//  - Com `data` (Equipe): mostra o link daquele profissional; `canEdit` deixa trocar o apelido.
// Celular: folha entre a navbar e a borda de baixo. Computador: janela no centro.

import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import QRCode from 'qrcode'
import { X, Copy, Check, Share2, Download, Pencil } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import ProfAvatar from '@/features/agenda/components/shared/ProfAvatar'
import { waShareLink } from '@/shared/utils/whatsapp'
import { appReceivesFiles, sendFileToApp } from '@/shared/utils/appFiles'

export interface ProLinkData {
  professionalId: string
  name:           string
  avatarUrl:      string | null
  publicHandle:   string
  url:            string
  businessSlug:   string
  businessName:   string | null
  businessCity:   string | null
  online:         boolean
}

interface Props {
  onClose:      () => void
  /** "Ver o link da barbearia": abre a folha do link da casa. */
  onShowHouse?: () => void
  data?:        ProLinkData
  canEdit?:     boolean
  onChanged?:   (publicHandle: string) => void
}

type Load =
  | { kind: 'loading' }
  | { kind: 'ok'; data: ProLinkData }
  | { kind: 'none' }   // conta sem profissional
  | { kind: 'error' }

const INK = '#111114'

function errorCode(e: unknown): string | null {
  const r = (e as { response?: { status?: number; data?: { code?: unknown } } })?.response
  return typeof r?.data?.code === 'string' ? r.data.code : null
}
function errorMessage(e: unknown): string | null {
  const r = (e as { response?: { data?: { message?: unknown; error?: unknown } } })?.response
  const m = r?.data?.message ?? r?.data?.error
  return typeof m === 'string' ? m : null
}
function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name
}
function shortUrl(url: string): string {
  return url.replace(/^https?:\/\//, '')
}

export default function ProfessionalLinkSheet({ onClose, onShowHouse, data, canEdit = false, onChanged }: Props) {
  const [load, setLoad] = useState<Load>(() => (data ? { kind: 'ok', data } : { kind: 'loading' }))
  const [attempt, setAttempt] = useState(0)
  const [qr, setQr] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [editErr, setEditErr] = useState<string | null>(null)

  useEffect(() => {
    if (data) return
    let alive = true
    api.get('/equipe/me/link')
      .then((r) => { if (alive) setLoad({ kind: 'ok', data: r.data.data as ProLinkData }) })
      .catch((e: unknown) => {
        if (!alive) return
        setLoad(errorCode(e) === 'PROFESSIONAL_NOT_FOUND' ? { kind: 'none' } : { kind: 'error' })
      })
    return () => { alive = false }
  }, [data, attempt])

  const link = load.kind === 'ok' ? load.data : null
  const url = link?.url ?? ''

  useEffect(() => {
    if (!url) return
    let alive = true
    QRCode.toDataURL(url, { width: 240, margin: 1, color: { dark: INK, light: '#ffffff' } })
      .then((d) => { if (alive) setQr(d) })
      .catch(() => { if (alive) setQr(null) })
    return () => { alive = false }
  }, [url])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const copy = useCallback(async () => {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const el = document.createElement('input')
      el.value = url
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }, [url])

  const message = link ? `Agende comigo, ${firstName(link.name)}, pelo link: ${url}` : ''

  const whatsapp = useCallback(() => {
    if (!message) return
    window.open(waShareLink(message), '_blank', 'noopener')
  }, [message])

  const share = useCallback(async () => {
    if (!url) return
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> }
    if (typeof nav.share === 'function') {
      try { await nav.share({ title: 'Link de agendamento', text: message, url }) } catch { /* cancelou */ }
      return
    }
    void copy()
  }, [url, message, copy])

  const downloadQr = useCallback(() => {
    if (!qr || !link) return
    const file = `qrcode-${link.businessSlug}-${link.publicHandle}.png`
    if (appReceivesFiles()) {
      void fetch(qr).then((r) => r.blob()).then((b) => sendFileToApp(b, file, 'share'))
      return
    }
    const a = document.createElement('a')
    a.href = qr
    a.download = file
    a.click()
  }, [qr, link])

  const startEdit = () => {
    if (!link) return
    setDraft(link.publicHandle)
    setEditErr(null)
    setEditing(true)
  }

  const saveEdit = async () => {
    if (!link || saving) return
    setSaving(true)
    setEditErr(null)
    try {
      const r = await api.patch(`/equipe/${link.professionalId}/link`, { handle: draft })
      const d = r.data.data as { publicHandle: string; url: string }
      setLoad({ kind: 'ok', data: { ...link, publicHandle: d.publicHandle, url: d.url } })
      setEditing(false)
      onChanged?.(d.publicHandle)
    } catch (e) {
      setEditErr(errorMessage(e) ?? 'Não deu para salvar. Tente de novo.')
    } finally {
      setSaving(false)
    }
  }

  const title = data ? `Link de ${data.name ? firstName(data.name) : 'agendamento'}` : 'Seu link de agendamento'

  const body = (
    <>
      <style>{`
        .pls-back{position:fixed;inset:0;background:rgba(17,17,20,.32);z-index:9998}
        .pls{position:fixed;z-index:9999;background:#fff;color:${INK};font-family:var(--font-sans, Inter, sans-serif);
          display:flex;flex-direction:column;gap:16px;box-sizing:border-box;overflow-y:auto}
        @media (max-width:767px){.pls{left:0;right:0;top:104px;bottom:0;border-radius:24px 24px 0 0;
          padding:12px 20px calc(24px + env(safe-area-inset-bottom))}}
        @media (min-width:768px){.pls{left:50%;top:50%;transform:translate(-50%,-50%);width:420px;max-height:calc(100vh - 48px);
          border-radius:24px;padding:20px 24px 24px;box-shadow:0 24px 60px rgba(17,17,20,.18)}
          .pls-grip{display:none}}
        .pls span,.pls p,.pls b{color:inherit}
        .pls-grip{width:40px;height:5px;border-radius:999px;background:rgba(17,17,20,.15);align-self:center;flex-shrink:0}
        .pls-x{width:44px;height:44px;border-radius:12px;border:0;background:#f5f5f7;color:${INK};display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0}
        .pls-card{background:${INK};border-radius:22px;padding:20px;display:flex;flex-direction:column;gap:16px}
        .pls-card *{color:#fff}
        .pls-mono{font-family:var(--font-mono, 'JetBrains Mono', monospace);font-size:11px;letter-spacing:.08em;text-transform:uppercase}
        .pls-btns{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
        .pls-btn{min-height:48px;border-radius:14px;padding:0 12px;display:flex;align-items:center;justify-content:center;gap:8px;
          font:600 15px var(--font-sans, Inter, sans-serif);cursor:pointer;background:#fff;color:${INK};border:1px solid rgba(17,17,20,.12)}
        .pls-btn:disabled{opacity:.5;cursor:default}
        .pls-btn-p{background:${INK};color:#fff;border:0}
        .pls-btn-p *{color:#fff}
        .pls-note{background:#f5f5f7;border-radius:14px;padding:12px 14px;font-size:13px;line-height:1.45;color:#4b4b52}
        .pls-warn{background:#fffbeb;border:1px solid #fde68a;border-radius:14px;padding:12px 14px;font-size:13px;line-height:1.45;color:#92400e}
        .pls-link{min-height:44px;border:0;background:transparent;font:600 14px var(--font-sans, Inter, sans-serif);color:#4b4b52;cursor:pointer}
        .pls-in{display:flex;align-items:center;border:1px solid rgba(17,17,20,.18);border-radius:12px;overflow:hidden}
        .pls-in span{padding:0 4px 0 12px;font-size:13px;color:#8a8a93;white-space:nowrap}
        .pls-in input{flex:1;min-width:0;border:0;outline:none;font-size:16px;padding:12px 12px 12px 0;color:${INK};background:transparent}
        .pls-in:focus-within{border-color:${INK};box-shadow:0 0 0 3px rgba(17,17,20,.12)}
        .pls-skel{background:#f0f0f3;border-radius:22px;height:210px;animation:plsP 1.2s ease-in-out infinite}
        @keyframes plsP{50%{opacity:.55}}
        @media (prefers-reduced-motion: reduce){.pls-skel{animation:none}}
      `}</style>
      <div className="pls-back" onClick={onClose} aria-hidden="true" />
      <div className="pls" role="dialog" aria-modal="true" aria-label={title}>
        <div className="pls-grip" aria-hidden="true" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ fontFamily: 'var(--font-display, "Space Grotesk", sans-serif)', fontWeight: 700, fontSize: 22, letterSpacing: '-0.03em' }}>
            {title}
          </span>
          <button type="button" className="pls-x" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
        </div>

        {load.kind === 'loading' && <div className="pls-skel" aria-label="Carregando" />}

        {load.kind === 'error' && (
          <div className="pls-warn" role="alert">
            Não deu para carregar seu link agora.{' '}
            <button type="button" className="pls-link" style={{ color: '#92400e', textDecoration: 'underline' }}
              onClick={() => { setLoad({ kind: 'loading' }); setAttempt((n) => n + 1) }}>
              Tentar de novo
            </button>
          </div>
        )}

        {load.kind === 'none' && (
          <div className="pls-note">Sua conta não está ligada a um profissional, então não tem link próprio. Use o link da casa.</div>
        )}

        {link && (
          <>
            <div className="pls-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <ProfAvatar name={link.name} avatarUrl={link.avatarUrl ?? undefined} size={56} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  <span style={{ fontFamily: 'var(--font-display, "Space Grotesk", sans-serif)', fontWeight: 700, fontSize: 20, letterSpacing: '-0.02em' }}>
                    {firstName(link.name)}
                  </span>
                  <span style={{ fontSize: 13, color: '#c9c9cf' }}>
                    {[link.businessName, link.businessCity].filter(Boolean).join(' · ')}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ background: '#fff', borderRadius: 14, padding: 8, width: 112, height: 112, flexShrink: 0, display: 'flex' }}>
                  {qr
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={qr} alt={`QR code do link de ${firstName(link.name)}`} width={96} height={96} style={{ width: 96, height: 96 }} />
                    : null}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
                  <span className="pls-mono" style={{ color: '#a1a1aa' }}>Quem abre já cai com {data ? firstName(link.name) : 'você'}</span>
                  <span style={{ fontSize: 14, lineHeight: 1.4, wordBreak: 'break-all' }}>{shortUrl(url)}</span>
                </div>
              </div>
            </div>

            {!link.online && (
              <div className="pls-warn" role="status">
                {data ? `${firstName(link.name)} está fora do link online` : 'Você está fora do link online'}: quem abrir
                o link vê a casa, sem ninguém escolhido. {data ? 'Ligue "Aparece no link online" no perfil.' : 'Fale com o dono para ligar.'}
              </div>
            )}

            {editing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label htmlFor="pls-handle" className="pls-mono" style={{ color: '#6b6b73' }}>Final do link</label>
                <div className="pls-in">
                  <span>/{link.businessSlug}/</span>
                  <input id="pls-handle" value={draft} maxLength={30} autoCapitalize="none" autoCorrect="off" spellCheck={false}
                    onChange={(e) => setDraft(e.target.value.toLowerCase())}
                    onKeyDown={(e) => { if (e.key === 'Enter') void saveEdit() }} />
                </div>
                {editErr && <p role="alert" style={{ margin: 0, fontSize: 13, color: '#b91c1c' }}>{editErr}</p>}
                <p style={{ margin: 0, fontSize: 12, color: '#6b6b73' }}>Quem já tem o link antigo vai cair na página da casa.</p>
                <div className="pls-btns">
                  <button type="button" className="pls-btn" onClick={() => setEditing(false)} disabled={saving}>Cancelar</button>
                  <button type="button" className="pls-btn pls-btn-p" onClick={() => void saveEdit()} disabled={saving || draft.trim().length < 2}>
                    {saving ? 'Salvando…' : 'Salvar'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="pls-btns">
                <button type="button" className="pls-btn pls-btn-p" onClick={() => void copy()}>
                  {copied ? <Check size={18} /> : <Copy size={18} />}<span>{copied ? 'Copiado' : 'Copiar link'}</span>
                </button>
                <button type="button" className="pls-btn" onClick={whatsapp}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.4A8.4 8.4 0 1 1 21 11.5z" />
                  </svg>
                  <span>WhatsApp</span>
                </button>
                <button type="button" className="pls-btn" onClick={() => void share()}><Share2 size={18} /><span>Compartilhar</span></button>
                <button type="button" className="pls-btn" onClick={downloadQr} disabled={!qr}><Download size={18} /><span>Baixar QR</span></button>
              </div>
            )}

            {!editing && (
              <div className="pls-note">
                Quem tem o app Eligi Cliente abre direto no app, com {data ? firstName(link.name) : 'você'} escolhido.
                Só os serviços que {data ? firstName(link.name) : 'você'} faz aparecem.
              </div>
            )}

            {canEdit && !editing && (
              <button type="button" className="pls-btn" onClick={startEdit}><Pencil size={16} /><span>Mudar o final do link</span></button>
            )}
          </>
        )}

        {onShowHouse && (
          <button type="button" className="pls-link" onClick={onShowHouse}>Ver o link da casa</button>
        )}
      </div>
    </>
  )

  if (typeof document === 'undefined') return null
  return createPortal(body, document.body)
}
