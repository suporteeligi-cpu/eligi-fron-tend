'use client'

import { useReveal } from './useReveal'
import s from './_shared.module.css'
import styles from './WhyChange.module.css'

export default function WhyChange() {
  const ref = useReveal<HTMLElement>()
  return (
    <section ref={ref} id="recursos" className={`${s.section} reveal-on`}>
      <div className={s.inner}>
        <div className={s.head}>
          <span className={s.eyebrow}>Por que mudar</span>
          <h2 className={s.h2}>Do caderno e das mensagens soltas pro controle de verdade.</h2>
          <p className={s.lead}>Você não precisa de mais um app. Precisa de um que junte tudo.</p>
        </div>

        <div className={styles.flip}>
          <div className={`${styles.card} ${styles.before}`}>
            <div className={styles.tag}>Como é hoje</div>
            <ul>
              <li><span className={styles.ic} aria-hidden>✕</span> Horário anotado no caderno (e cliente que some)</li>
              <li><span className={styles.ic} aria-hidden>✕</span> Confirmação manual, uma por uma, na mão</li>
              <li><span className={styles.ic} aria-hidden>✕</span> Comissão da equipe calculada com erro</li>
              <li><span className={styles.ic} aria-hidden>✕</span> Sem saber quanto entrou no fim do dia</li>
              <li><span className={styles.ic} aria-hidden>✕</span> Cliente liga, ninguém atende, perde a venda</li>
            </ul>
          </div>

          <div className={`${styles.card} ${styles.after}`}>
            <div className={styles.tag}>Com o Eligi</div>
            <ul>
              <li><span className={styles.ic} aria-hidden>✓</span> Agenda visual de arrastar e soltar, em tempo real</li>
              <li><span className={styles.ic} aria-hidden>✓</span> Cliente agenda sozinho pelo seu link, 24h</li>
              <li><span className={styles.ic} aria-hidden>✓</span> Comissão automática por profissional</li>
              <li><span className={styles.ic} aria-hidden>✓</span> Caixa do dia fechado num toque</li>
              <li><span className={styles.ic} aria-hidden>✓</span> Relatórios que mostram pra onde vai o dinheiro</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
