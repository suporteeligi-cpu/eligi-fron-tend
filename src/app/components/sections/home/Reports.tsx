'use client'

import Link from 'next/link'
import { useReveal } from './useReveal'
import s from './_shared.module.css'
import styles from './Reports.module.css'

export default function Reports() {
  const ref = useReveal<HTMLElement>()
  return (
    <section ref={ref} className={`${s.section} ${s.tight} reveal-on`}>
      <div className={`${s.inner} ${styles.split}`}>
        <div className={styles.text}>
          <span className={s.eyebrow}>Controle</span>
          <h2 className={s.h2}>Saiba quanto entra, quanto sai e quanto sobra.</h2>
          <p className={styles.p}>
            Faturamento, comissões, fluxo de caixa e desempenho da equipe. Tudo
            em relatórios claros, atualizados sozinhos.
          </p>
          <ul className={styles.list}>
            <li><span className={styles.ck} aria-hidden>✓</span> Receita do dia, da semana e do mês</li>
            <li><span className={styles.ck} aria-hidden>✓</span> Quanto cada profissional gerou e recebeu</li>
            <li><span className={styles.ck} aria-hidden>✓</span> Quanto veio do agendamento online</li>
          </ul>
          <Link href="/register" className={styles.cta}>Criar conta grátis <span aria-hidden>→</span></Link>
        </div>

        <div className={styles.media}>
          <div className={styles.card}>
            <div className={styles.rlbl}>RECEITA · ÚLTIMOS 30 DIAS</div>
            <div className={styles.kpis}>
              <div className={styles.k}><div className={styles.vRed}>R$ 24.380</div><div className={styles.l}>Faturamento</div></div>
              <div className={styles.k}><div className={styles.vGreen}>+18%</div><div className={styles.l}>vs. mês anterior</div></div>
            </div>
            <div className={styles.bars}>
              <div className={styles.b1} />
              <div className={styles.b2} />
              <div className={styles.b3} />
              <div className={styles.b4} />
              <div className={styles.b5} />
              <div className={styles.b6} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
