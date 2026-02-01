'use client'

import styles from './PricingSection.module.css'

export default function PricingSection() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <header className={styles.header}>
          <span className={styles.badge}>Preços</span>

          <h2 className={styles.title}>
            Planos que cabem
            <br />
            no seu bolso
          </h2>

          <p className={styles.subtitle}>
            Comece com 7 dias grátis. Sem cartão de crédito.
          </p>
        </header>

        <div className={styles.grid}>
          {/* PLANO AUTÔNOMO */}
          <div className={styles.card}>
            <span className={styles.tag}>Popular</span>

            <h3 className={styles.plan}>Autônomo</h3>
            <p className={styles.description}>
              Ideal para profissionais que trabalham sozinhos
            </p>

            <div className={styles.price}>
              <span className={styles.currency}>R$</span>
              <strong>49,90</strong>
              <span className={styles.period}>/mês</span>
            </div>

            <span className={styles.discount}>
              40% OFF no plano anual
            </span>

            <ul className={styles.features}>
              <li>Agendamento online em tempo real</li>
              <li>Link público de agendamento para clientes</li>
              <li>Controle de disponibilidade de horários</li>
              <li>Cadastro e gestão de clientes</li>
              <li>Histórico completo de atendimentos</li>
              <li>Gestão de serviços com duração configurável</li>
              <li>Prevenção automática de conflitos de horário</li>
              <li>Agenda diária, semanal e mensal</li>
              <li>Operação 100% digital</li>
            </ul>

            <button className={styles.buttonOutline} disabled>
              Começar teste grátis
            </button>
          </div>

          {/* PLANO ESTABELECIMENTO */}
          <div className={`${styles.card} ${styles.highlight}`}>
            <span className={styles.tagPrimary}>
              Melhor custo-benefício
            </span>

            <h3 className={styles.plan}>Estabelecimento</h3>
            <p className={styles.description}>
              Para negócios com 2 ou mais profissionais
            </p>

            <div className={styles.price}>
              <span className={styles.currency}>R$</span>
              <strong>89,90</strong>
              <span className={styles.period}>/mês</span>
            </div>

            <span className={styles.discount}>
              40% OFF no plano anual
            </span>

            <ul className={styles.features}>
              <li>Todos os recursos do plano Autônomo</li>
              <li>Gestão de múltiplos profissionais</li>
              <li>Agenda individual por profissional</li>
              <li>Acesso individual para cada colaborador</li>
              <li>Controle de atendimentos por profissional</li>
              <li>Visão geral da operação do negócio</li>
              <li>Padronização do fluxo de agendamentos</li>
            </ul>

            <button className={styles.buttonPrimary} disabled>
              Começar teste grátis
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
