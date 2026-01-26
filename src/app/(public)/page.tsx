'use client'

import Image from 'next/image'
import Navbar from '../components/navbar/Navbar'
import Footer from '../components/footer/Footer'
import styles from './Home.module.css'

export default function HomePage() {
  return (
    <div className={styles.root}>
      <Navbar />

      <main className={styles.main}>
        {/* =====================
            HERO
        ===================== */}
        <section className={styles.hero}>
          <div className={styles.heroCard}>
            {/* LOGO — troca via CSS / data-theme */}
            <div className={styles.logoWrapper}>
              <Image
                src="/images/logo.png"
                alt="ELIGI"
                width={88}
                height={88}
                priority
                className={styles.logoLight}
              />

              <Image
                src="/images/logo.branco.png"
                alt="ELIGI"
                width={88}
                height={88}
                priority
                className={styles.logoDark}
              />
            </div>

            <h1 className={styles.title}>
              Gerencie, cresça e transforme seu negócio.
            </h1>

            <p className={styles.subtitle}>
              Agendamentos, gestão, pagamentos e crescimento — tudo em um único
              ecossistema.
            </p>

            <div className={styles.actions}>
              <a href="/register" className={styles.primaryBtn}>
                Criar conta
              </a>
              <a href="/login" className={styles.secondaryBtn}>
                Entrar
              </a>
            </div>
          </div>
        </section>

        {/* =====================
            AGENDA (NOVA SEÇÃO)
        ===================== */}
        <section className={styles.agenda}>
          <div className={styles.agendaContainer}>
            {/* TEXTO */}
            <div className={styles.agendaContent}>
              <div className={styles.agendaBadge}>
                <span className={styles.agendaIcon}>📅</span>
                <span>Agenda</span>
              </div>

              <h2 className={styles.sectionTitle}>
                Chega de perder tempo com ligações e mensagens
              </h2>

              <p className={styles.sectionText}>
                Seus clientes agendam sozinhos, a qualquer hora do dia.
                Enquanto isso, você visualiza sua agenda em tempo real,
                organiza sua rotina e ganha mais tranquilidade no dia a dia.
                <strong>
                  {' '}
                  Mais comodidade para eles, mais controle para você.
                </strong>
              </p>
            </div>

            {/* IMAGEM */}
            <div className={styles.agendaVisual}>
              <Image
                src="/images/agenda-preview.png"
                alt="Agenda ELIGI"
                width={420}
                height={760}
                className={styles.agendaImage}
                priority
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
