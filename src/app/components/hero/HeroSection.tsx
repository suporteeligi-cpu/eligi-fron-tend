'use client'

import Image from 'next/image'
import Link from 'next/link'
import styles from './HeroSection.module.css'

export default function HeroSection() {
  return (
    <section className={styles.hero}>
      <div className={styles.glow1} aria-hidden />
      <div className={styles.glow2} aria-hidden />

      <div className={styles.container}>
        <div className={styles.content}>
          <span className={styles.eyebrow}>Sistema de gestão para o seu negócio</span>

          <h1 className={styles.title}>
            Seu negócio organizado,
            <br />
            do agendamento ao caixa.
          </h1>

          <p className={styles.subtitle}>
            O sistema que cuida da agenda, da equipe e do dinheiro — enquanto
            você cuida do cliente.
          </p>

          <div className={styles.actions}>
            <Link href="/register" className={styles.primary}>
              Criar conta grátis
              <span className={styles.arrow} aria-hidden>→</span>
            </Link>
            <a href="#video" className={styles.secondary}>
              Ver demonstração
            </a>
          </div>

          <ul className={styles.guarantees}>
            <li><span className={styles.ck} aria-hidden>✓</span> 7 dias grátis</li>
            <li><span className={styles.ck} aria-hidden>✓</span> Sem cartão</li>
            <li><span className={styles.ck} aria-hidden>✓</span> Pronto em 5 min</li>
          </ul>
        </div>

        <div className={styles.visual}>
          <div className={styles.devices}>
            {/* @eligi:hero-browser-frame */}
            <div className={styles.browser}>
              <div className={styles.chrome} aria-hidden>
                <span className={styles.dot} />
                <span className={styles.dot} />
                <span className={styles.dot} />
                <span className={styles.url}>eligi.com.br</span>
              </div>
              <Image
                src="/images/hero-desk-v2.png"
                alt="Agenda do Eligi aberta no computador"
                width={1800}
                height={1008}
                priority
                sizes="(max-width: 900px) 1px, 640px"
                className={styles.mockup}
              />
            </div>

            <div className={styles.phone}>
              <Image
                src="/images/hero-phone-v2.png"
                alt="Agenda do Eligi aberta no celular"
                width={415}
                height={809}
                priority
                sizes="(max-width: 900px) 86vw, 210px"
                className={styles.mockup}
              />
            </div>
          </div>

          {/* Card "ao vivo" — assinatura. Se colidir com o mockup, apague este bloco. */}
          <div className={styles.floatCard} aria-hidden>
            <div className={styles.floatHead}>
              <span className={styles.floatTitle}>Hoje</span>
              <span className={styles.live}><i />ao vivo</span>
            </div>
            <div className={styles.floatSlot}>
              <span className={styles.floatTime}>11:00</span>
              <div className={`${styles.floatChip} ${styles.chipRed}`}>
                <span className={styles.seal}>$</span>
                <span className={styles.floatName}>Diego A.</span>
              </div>
            </div>
            <div className={styles.floatSlot}>
              <span className={styles.floatTime}>11:40</span>
              <div className={`${styles.floatChip} ${styles.chipBlue}`}>
                <span className={styles.floatName}>Bruno T.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
