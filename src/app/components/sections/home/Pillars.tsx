'use client'

import { useReveal } from './useReveal'
import s from './_shared.module.css'
import styles from './Pillars.module.css'

const ITEMS = [
  { icon: '📅', title: 'Agenda', desc: 'Arrastar, soltar e redimensionar. Bloqueios, encaixe e a equipe inteira em tempo real.' },
  { icon: '💳', title: 'Caixa', desc: 'Serviços, produtos e pacotes. Pagamento dividido, fechamento do dia e líquido na hora.' },
  { icon: '👥', title: 'Equipe & comissões', desc: 'Cada profissional com seu horário e sua comissão calculada sozinha por atendimento.' },
  { icon: '📦', title: 'Estoque', desc: 'Entrada e saída de produto, baixa automática na venda e alerta de item acabando.' },
]

export default function Pillars() {
  const ref = useReveal<HTMLElement>()
  return (
    <section ref={ref} className={`${s.section} ${s.tight} reveal-on`}>
      <div className={s.inner}>
        <div className={s.headLeft}>
          <span className={s.eyebrow}>Tudo num lugar</span>
          <h2 className={s.h2}>Quatro ferramentas, um sistema.</h2>
        </div>

        <div className={styles.grid}>
          {ITEMS.map((it) => (
            <div key={it.title} className={styles.pillar}>
              <div className={styles.ico} aria-hidden>{it.icon}</div>
              <h3 className={styles.title}>{it.title}</h3>
              <p className={styles.desc}>{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
