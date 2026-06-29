'use client'

import Link from 'next/link'
import { useReveal } from './useReveal'
import s from './_shared.module.css'
import styles from './Pricing.module.css'

export default function Pricing() {
  const ref = useReveal<HTMLElement>()
  return (
    <section ref={ref} id="precos" className={`${s.section} reveal-on`}>
      <div className={s.inner}>
        <div className={s.head}>
          <span className={s.eyebrow}>Preços</span>
          <h2 className={s.h2}>Simples e justo. Sem pegadinha.</h2>
          <p className={s.lead}>Comece grátis por 7 dias. Sem cartão. Cancele quando quiser.</p>
        </div>

        <div className={styles.plans}>
          <div className={styles.plan}>
            <div className={styles.pname}>Autônomo</div>
            <div className={styles.pdesc}>Pra quem trabalha sozinho</div>
            <div className={styles.price}><sup>R$</sup>59<small>,90/mês</small></div>
            <div className={styles.pextra}>&nbsp;</div>
            <ul className={styles.pfeats}>
              <li><span className={styles.ck} aria-hidden>✓</span> Agenda completa</li>
              <li><span className={styles.ck} aria-hidden>✓</span> Caixa e controle financeiro</li>
              <li><span className={styles.ck} aria-hidden>✓</span> Link de agendamento online</li>
              <li><span className={styles.ck} aria-hidden>✓</span> Relatórios</li>
              <li><span className={styles.ck} aria-hidden>✓</span> Pacotes e assinaturas de cliente</li>
            </ul>
            <Link href="/register" className={styles.btnGhost}>Começar grátis</Link>
          </div>

          <div className={`${styles.plan} ${styles.feat}`}>
            <div className={styles.badge}>Mais escolhido</div>
            <div className={styles.pname}>Estabelecimento</div>
            <div className={styles.pdesc}>Pra quem tem equipe</div>
            <div className={styles.price}><sup>R$</sup>99<small>,90/mês</small></div>
            <div className={styles.pextra}>+ R$ 19,90/mês por profissional acima de 3</div>
            <ul className={styles.pfeats}>
              <li><span className={styles.ck} aria-hidden>✓</span> Tudo do Autônomo</li>
              <li><span className={styles.ck} aria-hidden>✓</span> Até 3 profissionais inclusos</li>
              <li><span className={styles.ck} aria-hidden>✓</span> Comissões por profissional</li>
              <li><span className={styles.ck} aria-hidden>✓</span> Controle de equipe e cargos</li>
              <li><span className={styles.ck} aria-hidden>✓</span> Estoque</li>
            </ul>
            <Link href="/register" className={styles.btnPrimary}>Começar grátis <span aria-hidden>→</span></Link>
          </div>
        </div>

        <p className={styles.note}>
          <span className={styles.ck}>✓</span> 7 dias grátis &nbsp;·&nbsp;
          <span className={styles.ck}>✓</span> sem cartão &nbsp;·&nbsp;
          <span className={styles.ck}>✓</span> cancele quando quiser
        </p>
      </div>
    </section>
  )
}
