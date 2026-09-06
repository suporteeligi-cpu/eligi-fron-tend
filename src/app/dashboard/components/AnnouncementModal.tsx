'use client'
// @eligi:announcement-module
import { useCallback, useEffect, useRef, useState } from 'react'
import api from '@/shared/lib/apiClient'

/* @eligi:announcement-carrossel-modal
   Comunicado do Eligi, agora com ate 5 imagens.

   O back entrega `images` ja resolvida: anuncio novo traz a URL do proxy,
   anuncio antigo traz um `data:` URL montado do base64 legado. Este
   componente nao sabe (nem precisa saber) qual e' qual.

   AUTOPLAY QUE PARA E NAO VOLTA: 4s por imagem, mas o primeiro toque, swipe,
   clique em indicador ou tecla desliga de vez. Automatico que retoma sozinho
   briga com quem parou pra ler — e quem parou e' justamente quem interessa. */

const AUTOPLAY_MS = 4000
/** Deslocamento minimo pra contar como swipe, nao como toque tremido. */
const SWIPE_PX = 40

interface AnnouncementImage {
  url: string
  mimeType: string
}

interface PendingAnnouncement {
  id: string
  images: AnnouncementImage[]
}

export default function AnnouncementModal() {
  const [ann, setAnn] = useState<PendingAnnouncement | null>(null)
  const [closing, setClosing] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [idx, setIdx] = useState(0)
  const [auto, setAuto] = useState(true)
  const touchX = useRef<number | null>(null)

  const total = ann?.images.length ?? 0

  useEffect(() => {
    let alive = true
    const run = async () => {
      try {
        const res = await api.get('/announcements/pending')
        const pending = res.data?.data?.announcement as PendingAnnouncement | null
        if (alive && pending && pending.images?.length) {
          setAnn(pending)
          /* @eligi:announcement-seen-abertura
             Conta a visualizacao na ABERTURA, nao no "Entendi" (decisao do Eli,
             set/2026). Idempotente por @@unique(announcementId,userId), entao o
             dismiss pode chamar de novo sem duplicar — e chama, pra garantir a
             contagem mesmo se a pessoa fechar a aba antes de clicar. */
          void api.post(`/announcements/${pending.id}/seen`).catch(() => undefined)
          requestAnimationFrame(() => {
            if (alive) setMounted(true)
          })
        }
      } catch {
        // silencioso: anuncio nunca pode quebrar o dashboard
      }
    }
    void run()
    return () => {
      alive = false
    }
  }, [])

  /* Autoplay. Respeita prefers-reduced-motion e para de vez apos interacao. */
  useEffect(() => {
    if (!ann || total <= 1 || !auto || closing) return
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }
    const t = setInterval(() => setIdx((i) => (i + 1) % total), AUTOPLAY_MS)
    return () => clearInterval(t)
  }, [ann, total, auto, closing])

  const irPara = useCallback((n: number) => {
    // Qualquer navegacao manual encerra o automatico.
    setAuto(false)
    setIdx((i) => {
      if (total === 0) return i
      return ((n % total) + total) % total
    })
  }, [total])

  const dismiss = useCallback(() => {
    if (!ann || closing) return
    setClosing(true)
    void api.post(`/announcements/${ann.id}/seen`).catch(() => undefined)
    setTimeout(() => setAnn(null), 240)
  }, [ann, closing])

  /* Setas do teclado: no desktop e' o gesto natural, e sai de graca. */
  useEffect(() => {
    if (!ann) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') dismiss()
      if (total <= 1) return
      if (e.key === 'ArrowRight') irPara(idx + 1)
      if (e.key === 'ArrowLeft') irPara(idx - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [ann, idx, total, irPara, dismiss])

  if (!ann) return null

  const shown = mounted && !closing

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Comunicado do Eligi"
      onClick={dismiss}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        background: 'rgba(3,3,6,0.62)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        opacity: shown ? 1 : 0,
        transition: 'opacity 0.22s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 380,
          maxWidth: '88vw',
          transform: shown ? 'scale(1) translateY(0)' : 'scale(0.94) translateY(8px)',
          opacity: shown ? 1 : 0,
          transition: 'transform 0.28s cubic-bezier(0.34,1.56,0.64,1), opacity 0.22s ease',
        }}
      >
        <div
          onTouchStart={(e) => {
            touchX.current = e.touches[0].clientX
          }}
          onTouchEnd={(e) => {
            const inicio = touchX.current
            touchX.current = null
            if (inicio == null || total <= 1) return
            const delta = e.changedTouches[0].clientX - inicio
            if (Math.abs(delta) < SWIPE_PX) return
            irPara(delta < 0 ? idx + 1 : idx - 1)
          }}
          style={{
            borderRadius: '16px 16px 0 0',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.10)',
            borderBottom: 'none',
            lineHeight: 0,
            position: 'relative',
            touchAction: 'pan-y',
          }}
        >
          {/* Trilho: todas as imagens lado a lado, deslocado por translateX.
              Assim a proxima ja esta carregada quando o autoplay vira. */}
          <div
            style={{
              display: 'flex',
              transform: `translateX(-${idx * 100}%)`,
              transition: 'transform 0.32s cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            {ann.images.map((img, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={img.url}
                src={img.url}
                alt={total > 1 ? `Comunicado do Eligi, imagem ${i + 1} de ${total}` : 'Comunicado do Eligi'}
                draggable={false}
                style={{ display: 'block', width: '100%', flex: '0 0 100%', height: 'auto' }}
              />
            ))}
          </div>

          {total > 1 && (
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 10,
                display: 'flex',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              {ann.images.map((img, i) => (
                <button
                  key={img.url}
                  onClick={() => irPara(i)}
                  aria-label={`Ir para a imagem ${i + 1}`}
                  style={{
                    /* Bolinha pequena, alvo grande: 8px visiveis dentro de 24px
                       de area tocavel. Indicador de 8px sem padding e' impossivel
                       de acertar com o polegar. */
                    width: 24,
                    height: 24,
                    padding: 8,
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    lineHeight: 0,
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: i === idx ? '#fff' : 'rgba(255,255,255,0.45)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                      transition: 'background 0.2s ease',
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '14px 16px',
            background: 'rgba(12,12,18,0.92)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderTop: 'none',
            borderRadius: '0 0 16px 16px',
          }}
        >
          <span
            style={{
              fontSize: 11,
              letterSpacing: '0.1em',
              color: '#f09595',
              background: 'rgba(220,38,38,0.16)',
              padding: '4px 10px',
              borderRadius: 999,
            }}
          >
            NOVIDADE
          </span>

          {total > 1 && (
            <span
              style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.45)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {idx + 1}/{total}
            </span>
          )}

          <button
            onClick={dismiss}
            style={{
              marginLeft: 'auto',
              background: '#dc2626',
              border: 'none',
              color: '#fff',
              fontSize: 14,
              fontWeight: 500,
              padding: '9px 22px',
              borderRadius: 10,
              cursor: 'pointer',
            }}
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  )
}
