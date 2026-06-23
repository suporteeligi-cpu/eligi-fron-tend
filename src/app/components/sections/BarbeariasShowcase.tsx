'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'
import { CalendarDays, CreditCard, BarChart3 } from 'lucide-react'
import styles from './BarbeariasShowcase.module.css'

const FEATURES = [
  {
    icon: CalendarDays,
    title: 'Agenda + link online',
    desc: 'Seus clientes agendam sozinhos pelo seu link e cai direto na sua agenda.',
  },
  {
    icon: CreditCard,
    title: 'Caixa, comissões e estoque',
    desc: 'Fecha a venda, calcula a comissão do barbeiro e baixa o estoque na hora.',
  },
  {
    icon: BarChart3,
    title: 'Relatórios automáticos',
    desc: 'Faturamento, ocupação e desempenho de cada barbeiro — sem planilha.',
  },
]

export default function BarbeariasShowcase() {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            el.classList.add(styles.visible)
            io.disconnect()
          }
        })
      },
      { threshold: 0.15 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section ref={ref} className={styles.section}>
      {/* Camadas de fundo (tema barbearia) */}
      <div className={`${styles.layer} ${styles.bgPhoto}`} aria-hidden />
      <div className={`${styles.layer} ${styles.bgOverlay}`} aria-hidden />
      <svg className={`${styles.layer} ${styles.pattern}`} aria-hidden xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="eligiBarber" width="170" height="170" patternUnits="userSpaceOnUse" patternTransform="rotate(6)">
            <g fill="none" stroke="#ffffff" strokeWidth="1.4" strokeOpacity="0.05">
              <circle cx="28" cy="36" r="7" />
              <circle cx="28" cy="60" r="7" />
              <path d="M34 40 L72 62 M34 56 L72 34" />
              <path d="M108 122 h46 M108 122 v-16 M116 122 v-16 M124 122 v-16 M132 122 v-16 M140 122 v-16 M148 122 v-16" />
              <path d="M42 120 q14 -8 30 0" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#eligiBarber)" />
      </svg>
      <div className={`${styles.layer} ${styles.glow}`} aria-hidden />

      <div className={styles.container}>
        {/* Cabeçalho */}
        <header className={`${styles.head} ${styles.reveal} ${styles.d1}`}>
          <span className={styles.eyebrow}>Para barbearias</span>
          <h2 className={styles.title}>Tudo da sua barbearia em um lugar só</h2>
          <p className={styles.subtitle}>
            Agenda, link de agendamento, caixa, comissões e relatórios —
            adeus caderninho e WhatsApp bagunçado.
          </p>
        </header>

        {/* Vitrine do app */}
        <div className={`${styles.showcase} ${styles.reveal} ${styles.d2}`}>
          <div className={styles.appVisual}>
            <div className={styles.window}>
              <Image
                src="/images/dashboard-preview.png"
                alt="Painel do Eligi com a gestão da barbearia"
                width={1920}
                height={1022}
                className={styles.windowImg}
              />
            </div>
            <div className={styles.floatPhone}>
              <Image
                src="/images/agenda-phone.png"
                alt="Agenda do Eligi no celular"
                width={830}
                height={1482}
                className={styles.phoneImg}
              />
            </div>
          </div>

          <ul className={styles.features}>
            {FEATURES.map(f => {
              const Icon = f.icon
              return (
                <li key={f.title}>
                  <span className={styles.fi}><Icon size={20} /></span>
                  <div>
                    <strong>{f.title}</strong>
                    <p>{f.desc}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Barbearia parceira */}
        <div className={`${styles.partner} ${styles.reveal} ${styles.d3}`}>
          <div className={styles.partnerLogo}>
            <Image
              src="/images/gil-barber.png"
              alt="Gil Barber"
              width={900}
              height={675}
              className={styles.partnerImg}
            />
          </div>
          <div className={styles.partnerText}>
            <span className={styles.partnerTag}>Barbearia parceira</span>
            <p>
              A <strong>Gil Barber</strong> — barba, cabelo e bigode — usa o Eligi
              no dia a dia pra cuidar da agenda, do caixa e das comissões.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
