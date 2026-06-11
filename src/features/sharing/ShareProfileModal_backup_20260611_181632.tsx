'use client'

import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/hooks/useAuth'
import { X, Link2, Copy, Check, Download, Share2 } from 'lucide-react'
import { colors, typography, radius, shadows, transitions } from '@/shared/theme'
import QRCode from 'qrcode'

interface Props {
  onClose: () => void
}

export default function ShareProfileModal({ onClose }: Props) {
  const { user }                       = useAuth()
  const slug                           = (user as (typeof user & { businessSlug?: string }))?.businessSlug ?? null
  const [loading,    setLoading]       = useState(false)
  const [copied,     setCopied]        = useState(false)
  const [qrDataUrl,  setQrDataUrl]     = useState<string | null>(null)

  const publicUrl = slug ? `app.eligi.com.br/${slug}` : ''
  const fullUrl   = slug ? `https://app.eligi.com.br/${slug}` : ''

  /* ── Gera QR Code quando slug disponível ── */
  useEffect(() => {
    if (!fullUrl) return
    QRCode.toDataURL(fullUrl, {
      width:     200,
      margin:    2,
      color: { dark: '#1a1a1a', light: '#ffffff' },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null))
  }, [fullUrl])

  /* ── Fechar com ESC ── */
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  /* ── Copiar link ── */
  const handleCopy = useCallback(async () => {
    if (!fullUrl) return
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback para navegadores sem clipboard API
      const el = document.createElement('input')
      el.value = fullUrl
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [fullUrl])

  /* ── WhatsApp ── */
  const handleWhatsApp = useCallback(() => {
    if (!fullUrl) return
    const text = encodeURIComponent(`Agende comigo pelo link: ${fullUrl}`)
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener')
  }, [fullUrl])

  /* ── Instagram (copia link + abre instagram) ── */
  const handleInstagram = useCallback(async () => {
    if (!fullUrl) return
    try { await navigator.clipboard.writeText(fullUrl) } catch { /* ignore */ }
    window.open('https://www.instagram.com', '_blank', 'noopener')
  }, [fullUrl])

  /* ── Download QR Code ── */
  const handleDownloadQR = useCallback(() => {
    if (!qrDataUrl || !slug) return
    const a = document.createElement('a')
    a.href     = qrDataUrl
    a.download = `qrcode-${slug}.png`
    a.click()
  }, [qrDataUrl, slug])

  /* ── Render ── */
  const modal = (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position:   'fixed',
          inset:      0,
          background: 'rgba(0,0,0,0.35)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          zIndex:     9998,
        }}
      />

      {/* Modal */}
      <div style={{
        position:   'fixed',
        top:        '50%',
        left:       '50%',
        transform:  'translate(-50%, -50%)',
        width:      440,
        maxWidth:   'calc(100vw - 32px)',
        background: 'var(--glass-bg-hover, rgba(255,255,255,0.99))',
        borderRadius: 20,
        border:     `1px solid ${colors.gray.borderMd}`,
        boxShadow:  shadows.lg,
        zIndex:     9999,
        fontFamily: typography.fontFamily,
        overflow:   'hidden',
        animation:  'shareModalIn 0.22s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <style>{`
          @keyframes shareModalIn {
            from { opacity:0; transform:translate(-50%,-50%) scale(0.94); }
            to   { opacity:1; transform:translate(-50%,-50%) scale(1); }
          }
          .share-action-btn {
            flex:1;
            border: 1px solid ${colors.gray.borderMd};
            border-radius: 10px;
            padding: 10px 6px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 5px;
            background: transparent;
            cursor: pointer;
            transition: background ${transitions.fast}, border-color ${transitions.fast}, transform 120ms ease;
            -webkit-tap-highlight-color: transparent;
          }
          .share-action-btn:hover  { background: ${colors.gray.hover}; border-color: ${colors.gray.border}; }
          .share-action-btn:active { transform: scale(0.95); }
          .share-action-btn span   { font-size: 11px; color: ${colors.gray.dimText}; font-family: ${typography.fontFamily}; }
        `}</style>

        {/* ── Header ── */}
        <div style={{
          display:       'flex',
          alignItems:    'center',
          justifyContent:'space-between',
          padding:       '18px 20px 14px',
          borderBottom:  `1px solid ${colors.gray.border}`,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{
              width:32, height:32, borderRadius:9,
              background: 'linear-gradient(145deg,#ef4444,#dc2626,#b91c1c)',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow: '0 3px 10px rgba(220,38,38,0.3)',
            }}>
              <Share2 size={15} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize:15, fontWeight:700, color:colors.gray[900] }}>
              Compartilhar perfil
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              width:28, height:28, borderRadius:'50%',
              border:`1px solid ${colors.gray.borderMd}`,
              background: colors.background.page,
              display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer', transition:`background ${transitions.fast}`,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = colors.gray.hover)}
            onMouseLeave={e => (e.currentTarget.style.background = colors.background.page)}
          >
            <X size={13} color={colors.gray.dimText} />
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ padding:'20px 22px' }}>

          {loading ? (
            <div style={{ display:'flex', justifyContent:'center', padding:'32px 0' }}>
              <div style={{ width:20, height:20, borderRadius:'50%', border:`2px solid ${colors.red.subtle}`, borderTopColor: colors.red.DEFAULT, animation:'spin 0.7s linear infinite' }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : !slug ? (
            <div style={{ textAlign:'center', padding:'24px 0', color:colors.gray.dimText, fontSize:14 }}>
              Perfil público não configurado ainda.
            </div>
          ) : (
            <>
              {/* ── Link do perfil ── */}
              <p style={{ fontSize:11, fontWeight:700, color:colors.gray.dimText, textTransform:'uppercase', letterSpacing:'.07em', margin:'0 0 8px' }}>
                Link de agendamento
              </p>
              <div style={{
                background:   colors.background.page,
                border:       `1px solid ${colors.gray.borderMd}`,
                borderRadius: 10,
                display:      'flex',
                alignItems:   'center',
                gap:          8,
                padding:      '10px 14px',
              }}>
                <Link2 size={14} color={colors.gray.dimText} strokeWidth={2} style={{ flexShrink:0 }} />
                <span style={{
                  flex:1, fontSize:13, color:colors.gray[700],
                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                }}>
                  {publicUrl}
                </span>
                <button
                  onClick={handleCopy}
                  style={{
                    display:     'flex',
                    alignItems:  'center',
                    gap:         4,
                    fontSize:    12,
                    fontWeight:  600,
                    color:       copied ? '#16a34a' : colors.red.DEFAULT,
                    background:  'none',
                    border:      'none',
                    cursor:      'pointer',
                    padding:     '3px 2px',
                    whiteSpace:  'nowrap',
                    transition:  `color ${transitions.fast}`,
                    fontFamily:  typography.fontFamily,
                  }}
                >
                  {copied
                    ? <><Check size={13} strokeWidth={2.5} /> Copiado!</>
                    : <><Copy  size={13} strokeWidth={2} />   Copiar</>
                  }
                </button>
              </div>
              <p style={{ fontSize:12, color:colors.gray.dimText, margin:'7px 0 0', lineHeight:1.5 }}>
                Envie para seus clientes agendarem diretamente com você.
              </p>

              {/* ── Divider ── */}
              <div style={{ borderTop:`1px solid ${colors.gray.border}`, margin:'18px 0' }} />

              {/* ── Compartilhar via ── */}
              <p style={{ fontSize:11, fontWeight:700, color:colors.gray.dimText, textTransform:'uppercase', letterSpacing:'.07em', margin:'0 0 10px' }}>
                Compartilhar via
              </p>
              <div style={{ display:'flex', gap:8 }}>
                {/* WhatsApp */}
                <button className="share-action-btn" onClick={handleWhatsApp}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" fill="#25D366"/>
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.985-1.412A9.953 9.953 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.95 7.95 0 01-4.076-1.117l-.292-.173-3.032.859.862-3.013-.19-.309A7.96 7.96 0 014 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z" fill="#25D366"/>
                  </svg>
                  <span>WhatsApp</span>
                </button>

                {/* Instagram */}
                <button className="share-action-btn" onClick={handleInstagram}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#igGrad)"/>
                    <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="1.8" fill="none"/>
                    <circle cx="17.2" cy="6.8" r="1.2" fill="white"/>
                    <defs>
                      <radialGradient id="igGrad" cx="30%" cy="107%" r="150%">
                        <stop offset="0%"   stopColor="#ffd600"/>
                        <stop offset="30%"  stopColor="#ff6d00"/>
                        <stop offset="60%"  stopColor="#e1306c"/>
                        <stop offset="85%"  stopColor="#833ab4"/>
                        <stop offset="100%" stopColor="#405de6"/>
                      </radialGradient>
                    </defs>
                  </svg>
                  <span>Instagram</span>
                </button>

                {/* Copiar */}
                <button className="share-action-btn" onClick={handleCopy}>
                  {copied
                    ? <Check size={22} color="#16a34a" strokeWidth={2.5} />
                    : <Copy  size={22} color={colors.red.DEFAULT} strokeWidth={2} />
                  }
                  <span>{copied ? 'Copiado!' : 'Copiar link'}</span>
                </button>
              </div>

              {/* ── Divider ── */}
              <div style={{ borderTop:`1px solid ${colors.gray.border}`, margin:'18px 0' }} />

              {/* ── QR Code ── */}
              <p style={{ fontSize:11, fontWeight:700, color:colors.gray.dimText, textTransform:'uppercase', letterSpacing:'.07em', margin:'0 0 12px' }}>
                QR Code do perfil
              </p>
              <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                {/* QR */}
                <div style={{
                  width:100, height:100, borderRadius:12,
                  background: colors.background.page,
                  border:`1px solid ${colors.gray.borderMd}`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  flexShrink:0, overflow:'hidden',
                }}>
                  {qrDataUrl
                    ? <img src={qrDataUrl} alt="QR Code" width={84} height={84} style={{ borderRadius:6 }} />
                    : <div style={{ width:20, height:20, borderRadius:'50%', border:`2px solid ${colors.gray.border}`, borderTopColor:colors.gray.dimText, animation:'spin 0.7s linear infinite' }} />
                  }
                </div>

                {/* Texto + botão */}
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:13, color:colors.gray.dimText, lineHeight:1.6, margin:'0 0 10px' }}>
                    Coloque na vitrine ou cartão de visita para seus clientes escanearem.
                  </p>
                  <button
                    onClick={handleDownloadQR}
                    disabled={!qrDataUrl}
                    style={{
                      display:    'flex',
                      alignItems: 'center',
                      gap:        6,
                      padding:    '8px 14px',
                      borderRadius: 8,
                      border:     `1px solid ${colors.gray.borderMd}`,
                      background: colors.background.page,
                      color:      colors.gray[700],
                      fontSize:   12,
                      fontWeight: 600,
                      cursor:     qrDataUrl ? 'pointer' : 'not-allowed',
                      opacity:    qrDataUrl ? 1 : 0.5,
                      transition: `background ${transitions.fast}`,
                      fontFamily: typography.fontFamily,
                    }}
                    onMouseEnter={e => { if (qrDataUrl) e.currentTarget.style.background = colors.gray.hover }}
                    onMouseLeave={e => { e.currentTarget.style.background = colors.background.page }}
                  >
                    <Download size={13} strokeWidth={2} />
                    Baixar QR Code
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )

  if (typeof document === 'undefined') return null
  return createPortal(modal, document.body)
}
