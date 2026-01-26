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
            AGENDA
        ===================== */}
        <section className={styles.agenda}>
          <div className={styles.agendaContainer}>
            {/* TEXTO */}
            <div className={styles.agendaContent}>
              <div className={styles.agendaBadge}>
                {/* ÍCONE SVG (calendário minimal) */}
                <svg
                  className={styles.agendaIcon}
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="3"
                    y="4"
                    width="18"
                    height="17"
                    rx="3"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                  <line
                    x1="3"
                    y1="9"
                    x2="21"
                    y2="9"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                  <line
                    x1="8"
                    y1="2.5"
                    x2="8"
                    y2="6"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <line
                    x1="16"
                    y1="2.5"
                    x2="16"
                    y2="6"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>

                <span>Agenda</span>
              </div>

              <h2 className={styles.sectionTitle}>
                Chega de perder tempo com ligações e mensagens
              </h2>

              <p className={styles.sectionText}>
                Seus clientes agendam sozinhos, a qualquer hora do dia.
                Enquanto isso, você acompanha sua agenda em tempo real,
                organiza sua rotina e trabalha com mais tranquilidade.
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
