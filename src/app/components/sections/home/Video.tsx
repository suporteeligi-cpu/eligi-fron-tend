'use client'

import { useState } from 'react'
import { useReveal } from './useReveal'
import s from './_shared.module.css'
import styles from './Video.module.css'

/**
 * Vídeo do Gilson (YouTube), com carregamento lazy: o iframe só
 * é criado no clique (protege a performance no mobile).
 *
 * >>> TROQUE pelo ID do vídeo. Ex.:
 *     https://youtu.be/AbC123XyZ          -> 'AbC123XyZ'
 *     https://www.youtube.com/watch?v=AbC123XyZ -> 'AbC123XyZ'
 */
const VIDEO_ID = 'GiDvjJwu5mk'

export default function Video() {
  const ref = useReveal<HTMLElement>()
  const [playing, setPlaying] = useState(false)
  const thumb = `https://img.youtube.com/vi/${VIDEO_ID}/maxresdefault.jpg`

  return (
    <section ref={ref} id="video" className={`${s.section} ${s.tight} reveal-on`}>
      <div className={s.inner}>
        <div className={s.head}>
          <span className={s.eyebrow}>Bastidores</span>
          <h2 className={s.h2}>A ideia por trás do Eligi.</h2>
          <p className={s.lead}>Conheça o sistema que transforma a maneira como você lida com seu negócio.</p>
        </div>

        <div className={styles.frame}>
          {playing ? (
            <iframe
              className={styles.iframe}
              src={`https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&rel=0`}
              title="A ideia por trás do Eligi"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <button type="button" className={styles.poster} onClick={() => setPlaying(true)} aria-label="Assistir ao vídeo">
              <img
                className={styles.thumb}
                src={thumb}
                alt=""
                aria-hidden
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement
                  if (img.src.includes('maxresdefault')) {
                    img.src = `https://img.youtube.com/vi/${VIDEO_ID}/hqdefault.jpg`
                  } else {
                    img.style.display = 'none'
                  }
                }}
              />
              <span className={styles.play} aria-hidden>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z" /></svg>
              </span>
              <span className={styles.cap}>▶ A ideia por trás do Eligi</span>
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
