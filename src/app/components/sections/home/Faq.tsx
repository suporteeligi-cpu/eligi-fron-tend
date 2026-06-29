'use client'

import { useReveal } from './useReveal'
import s from './_shared.module.css'
import styles from './Faq.module.css'

const QA: [string, string][] = [
  ['Preciso de cartão pra testar?', 'Não. São 7 dias grátis, sem pedir cartão. Você só decide se quer continuar no fim do teste.'],
  ['Posso cancelar quando quiser?', 'Sim, a qualquer momento, direto no painel, sem multa e sem fidelidade.'],
  ['Funciona no celular?', 'Funciona. Você e sua equipe usam pelo navegador ou instalam como app. Seu cliente também agenda pelo celular.'],
  ['Meu cliente consegue agendar sozinho?', 'Sim. Você ganha um link público com a sua marca. O cliente escolhe serviço, profissional e horário, e cai direto na sua agenda.'],
  ['É difícil de configurar?', 'Em poucos minutos você cria a conta, cadastra seus serviços e já está agendando. Sem instalação, sem técnico.'],
  ['E os meus dados?', 'Seus dados e os dos seus clientes são tratados conforme a LGPD. Você é o dono das suas informações.'],
]

export default function Faq() {
  const ref = useReveal<HTMLElement>()
  return (
    <section ref={ref} id="faq" className={`${s.section} ${s.tight} reveal-on`}>
      <div className={s.inner}>
        <div className={s.head}>
          <span className={s.eyebrow}>Perguntas</span>
          <h2 className={s.h2}>Antes de você perguntar.</h2>
        </div>

        <div className={styles.faq}>
          {QA.map(([q, a]) => (
            <details key={q} className={styles.q}>
              <summary>{q}<span className={styles.pm} aria-hidden>+</span></summary>
              <div className={styles.a}>{a}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
