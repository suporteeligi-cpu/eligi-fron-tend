'use client'

import Link from 'next/link'
import { useReveal } from './useReveal'
import s from './_shared.module.css'
import styles from './OnlineLink.module.css'

export default function OnlineLink() {
  const ref = useReveal<HTMLElement>()
  return (
    <section ref={ref} id="online" className={`${s.section} reveal-on`}>
      <div className={`${s.inner} ${styles.split}`}>
        <div className={styles.text}>
          <span className={s.eyebrow}>O diferencial</span>
          <h2 className={s.h2}>Seu cliente agenda sozinho. Você só atende.</h2>
          <p className={styles.p}>
            Um link próprio, com a sua cara, que funciona 24 horas. O cliente
            escolhe serviço, profissional e horário — e cai direto na sua agenda.
          </p>
          <ul className={styles.list}>
            <li><span className={styles.ck} aria-hidden>✓</span> Página com a sua marca, fotos e localização</li>
            <li><span className={styles.ck} aria-hidden>✓</span> Vários serviços agendados de uma vez</li>
            <li><span className={styles.ck} aria-hidden>✓</span> Cliente remarca e cancela sozinho</li>
            <li><span className={styles.ck} aria-hidden>✓</span> Instala no celular como app, sem loja</li>
          </ul>
          <Link href="/register" className={styles.cta}>Quero meu link grátis <span aria-hidden>→</span></Link>
        </div>

        <div className={styles.media}>
          <div className={styles.phone}>
            <div className={styles.notch} />
            <div className={styles.phHead}>
              <div className={styles.phAv} />
              <div className={styles.phName}>Studio Aurora<small>Centro · São Paulo</small></div>
            </div>
            <div className={styles.phLbl}>ESCOLHA O HORÁRIO</div>
            <div className={styles.phSlot}><span>09:00</span><span className={styles.free}>livre</span></div>
            <div className={`${styles.phSlot} ${styles.sel}`}><span>09:40</span><span className={styles.selTxt}>selecionado</span></div>
            <div className={styles.phSlot}><span>10:10</span><span className={styles.free}>livre</span></div>
            <div className={styles.phBtn}>Confirmar agendamento</div>
          </div>
        </div>
      </div>
    </section>
  )
}
