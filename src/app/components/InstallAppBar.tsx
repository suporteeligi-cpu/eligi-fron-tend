'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { eligiApp } from '@/shared/utils/eligiApp' // @eligi:app-shell-import

type Plat = 'android' | 'ios' | 'inapp' | 'desktop' | 'standalone' | 'unknown'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'eligi-install-dismissed'
// @eligi:play-popup-const Android no navegador: convite da Play a cada abertura do painel
// (uma vez por aba, nao a cada troca de tela). Decisao do Eli, 23/10/2026.
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=br.com.eligi.app'
const PLAY_SEEN_KEY = 'eligi-play-popup-seen'
const RED = '#dc2626'

function detectPlatform(): Plat {
  if (typeof window === 'undefined') return 'unknown'
  // Dentro do app do Eligi o convite para instalar nao faz sentido. // @eligi:app-shell-standalone
  if (eligiApp()) return 'standalone'
  const nav = navigator as Navigator & { standalone?: boolean; maxTouchPoints?: number }
  const ua = nav.userAgent || ''
  // Android vai para o app da Play Store, inclusive no atalho instalado e no // @eligi:play-popup-detect
  // navegador do WhatsApp/Instagram (o link da Play abre o app da loja).
  if (/Android/i.test(ua)) return 'android'
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true
  if (standalone) return 'standalone'
  if (/FBAN|FBAV|FB_IAB|Instagram|WhatsApp|Line\/|Messenger|Twitter/i.test(ua)) return 'inapp'
  const iOS =
    /iPhone|iPad|iPod/i.test(ua) || (nav.platform === 'MacIntel' && (nav.maxTouchPoints ?? 0) > 1)
  if (iOS) return 'ios'
  if (/Android/i.test(ua)) return 'android'
  return 'desktop'
}

const ShareGlyph = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#007aff"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: 'inline', transform: 'translateY(-1px)' }}
  >
    <path d="M12 3v13" />
    <path d="M8 7l4-4 4 4" />
    <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
  </svg>
)

function Steps({ plat }: { plat: Plat }) {
  const rows: Array<{ n: number; el: React.ReactNode }> =
    plat === 'ios'
      ? [
          { n: 1, el: <>Toque em <b>Compartilhar</b> {ShareGlyph} na barra do Safari.</> },
          { n: 2, el: <>Escolha <b>Adicionar à Tela de Início</b>.</> },
          { n: 3, el: <>Confirme em <b>Adicionar</b>. Pronto — vira um app.</> },
        ]
      : plat === 'inapp'
        ? [
            { n: 1, el: <>Toque no menu <b>···</b> no canto da tela.</> },
            { n: 2, el: <>Escolha <b>Abrir no navegador</b> (Safari ou Chrome).</> },
            { n: 3, el: <>Lá aparece a opção de instalar / adicionar à tela inicial.</> },
          ]
        : [
            { n: 1, el: <>Toque no menu <b>⋮</b> do Chrome (canto superior).</> },
            { n: 2, el: <>Escolha <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.</> },
          ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {rows.map((r) => (
        <div key={r.n} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span
            style={{
              display: 'flex',
              height: 24,
              width: 24,
              flexShrink: 0,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 9999,
              fontSize: 12,
              fontWeight: 700,
              color: '#fff',
              background: RED,
            }}
          >
            {r.n}
          </span>
          <span style={{ fontSize: 13, lineHeight: 1.5, color: '#374151' }}>{r.el}</span>
        </div>
      ))}
    </div>
  )
}

// @eligi:play-popup-component
function PlayPopup({ onClose }: { onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10050,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        background: 'rgba(7,7,11,0.45)',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="eligi-play-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 480,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          background: '#fff',
          padding: '20px 20px calc(env(safe-area-inset-bottom) + 20px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ margin: '0 auto', height: 4, width: 36, borderRadius: 9999, background: '#d4d4d8' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192x192.png" alt="" style={{ height: 56, width: 56, flexShrink: 0, borderRadius: 14 }} />
          <div style={{ minWidth: 0 }}>
            <h3 id="eligi-play-title" style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111114', lineHeight: 1.25 }}>
              O Eligi agora tem app
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6b7280' }}>Grátis na Google Play</p>
          </div>
        </div>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            'Aviso no celular a cada agendamento',
            'Abre direto no painel, sem digitar endereço',
            'Mesma conta e mesmos dados de agora',
          ].map((t) => (
            <li key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#374151' }}>
              <span aria-hidden style={{ height: 6, width: 6, flexShrink: 0, borderRadius: 9999, background: RED }} />
              {t}
            </li>
          ))}
        </ul>
        <a
          href={PLAY_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 48,
            borderRadius: 14,
            fontSize: 15,
            fontWeight: 700,
            color: '#fff',
            background: RED,
            textDecoration: 'none',
          }}
        >
          Baixar na Google Play
        </a>
        <button
          type="button"
          onClick={onClose}
          style={{
            minHeight: 44,
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 600,
            color: '#6b7280',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Agora não
        </button>
      </div>
    </div>
  )
}

export function InstallAppBar() {
  const pathname = usePathname()
  const [plat, setPlat] = useState<Plat>('unknown')
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [hidden, setHidden] = useState(true)
  const [modal, setModal] = useState(false)
  const [playOpen, setPlayOpen] = useState(false) // @eligi:play-popup-state

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      await Promise.resolve()
      if (cancelled) return
      const p = detectPlatform()
      setPlat(p)
      if (p === 'android') { // @eligi:play-popup-open
        let seen = false
        try {
          seen = sessionStorage.getItem(PLAY_SEEN_KEY) === '1'
          sessionStorage.setItem(PLAY_SEEN_KEY, '1')
        } catch {
          seen = false
        }
        setPlayOpen(!seen)
        return
      }
      let dismissed = false
      try {
        dismissed = localStorage.getItem(DISMISS_KEY) === '1'
      } catch {
        dismissed = false
      }
      setHidden(dismissed)
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const onBIP = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setDeferred(null)
      setHidden(true)
      try {
        localStorage.setItem(DISMISS_KEY, '1')
      } catch {
        /* ignore */
      }
    }
    window.addEventListener('beforeinstallprompt', onBIP)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBIP)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const hide = () => {
    setHidden(true)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  // só no dashboard, só mobile, escondido quando já instalado / dispensado / desktop
  const onDashboard = pathname?.startsWith('/dashboard') ?? false
  if (!onDashboard) return null
  if (plat === 'android') { // @eligi:play-popup-render
    return playOpen ? <PlayPopup onClose={() => setPlayOpen(false)} /> : null
  }
  if (hidden || plat === 'standalone' || plat === 'unknown' || plat === 'desktop') return null

  const canInstall = !!deferred
  const cta = canInstall ? 'Instalar' : plat === 'inapp' ? 'Abrir' : 'Instalar'

  const onClick = async () => {
    if (canInstall && deferred) {
      await deferred.prompt()
      const choice = await deferred.userChoice
      setDeferred(null)
      if (choice.outcome === 'accepted') hide()
      return
    }
    setModal(true)
  }

  const modalTitle =
    plat === 'ios' ? 'Adicionar à Tela de Início' : plat === 'inapp' ? 'Abra no navegador' : 'Instalar o app'
  const modalLead =
    plat === 'ios'
      ? 'No iPhone o passo é manual (o Safari não deixa instalar por você):'
      : plat === 'inapp'
        ? 'Aqui dentro do Instagram/WhatsApp não dá pra instalar. Abra no navegador:'
        : 'Pelo menu do Chrome:'

  return (
    <>
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9990,
          padding: '0 12px calc(env(safe-area-inset-bottom) + var(--bottom-nav-h, 64px) + 12px)',
        }}
      >
        <div
          style={{
            margin: '0 auto',
            display: 'flex',
            maxWidth: 420,
            alignItems: 'center',
            gap: 12,
            borderRadius: 18,
            background: 'rgba(12,12,18,0.92)',
            backdropFilter: 'blur(20px) saturate(160%)',
            WebkitBackdropFilter: 'blur(20px) saturate(160%)',
            padding: '10px 12px',
            color: '#fff',
            boxShadow: '0 20px 40px -12px rgba(0,0,0,0.5)',
            border: '0.5px solid rgba(255,255,255,0.1)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192x192.png" alt="Eligi" style={{ height: 44, width: 44, flexShrink: 0, borderRadius: 12 }} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, lineHeight: 1.2 }}>Instale o app Eligi</p>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: 'rgba(255,255,255,0.6)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              Gerencie seu negócio direto do celular.
            </p>
          </div>
          <button
            type="button"
            onClick={onClick}
            style={{
              flexShrink: 0,
              borderRadius: 10,
              padding: '8px 14px',
              fontSize: 12,
              fontWeight: 700,
              color: '#fff',
              background: RED,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {cta}
          </button>
          <button
            type="button"
            onClick={hide}
            aria-label="Fechar"
            style={{
              flexShrink: 0,
              padding: '0 4px',
              fontSize: 18,
              lineHeight: 1,
              color: 'rgba(255,255,255,0.45)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>
      </div>

      {modal && (
        <div
          onClick={() => setModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10050,
            display: 'flex',
            alignItems: 'flex-end',
            background: 'rgba(0,0,0,0.4)',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              background: '#fff',
              padding: '20px 20px calc(env(safe-area-inset-bottom) + 24px)',
            }}
          >
            <div style={{ margin: '0 auto 16px', height: 4, width: 36, borderRadius: 9999, background: '#d4d4d8' }} />
            <h3 style={{ margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 16, fontWeight: 600, color: '#18181b' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/icon-192x192.png" alt="" style={{ height: 32, width: 32, borderRadius: 8 }} />
              {modalTitle}
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6b7280' }}>{modalLead}</p>
            <Steps plat={plat} />
            <button
              type="button"
              onClick={() => setModal(false)}
              style={{
                marginTop: 20,
                width: '100%',
                borderRadius: 12,
                padding: '12px 0',
                fontSize: 14,
                fontWeight: 600,
                color: '#fff',
                background: RED,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  )
}
