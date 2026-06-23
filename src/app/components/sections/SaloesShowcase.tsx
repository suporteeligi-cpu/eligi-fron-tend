'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { CalendarDays, Sparkles, CreditCard, BarChart3 } from 'lucide-react'
import styles from './SaloesShowcase.module.css'

const FEATURES = [
  {
    icon: CalendarDays,
    title: 'Agenda + link de agendamento',
    desc: 'Cada profissional com sua agenda, e o cliente marca sozinho pelo seu link.',
  },
  {
    icon: Sparkles,
    title: 'Pacotes e assinaturas',
    desc: 'Venda pacotes e planos de assinatura e deixe o consumo do cliente no controle automático.',
    highlight: true,
  },
  {
    icon: CreditCard,
    title: 'Caixa e comissões',
    desc: 'Fecha a venda, divide a comissão por profissional e baixa o estoque na hora.',
  },
  {
    icon: BarChart3,
    title: 'Relatórios automáticos',
    desc: 'Faturamento, ocupação e desempenho da equipe — sem planilha.',
  },
]

export default function SaloesShowcase() {
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
      { threshold: 0.12 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section ref={ref} className={styles.section}>
      <div className={`${styles.glow} ${styles.glowA}`} aria-hidden />
      <div className={`${styles.glow} ${styles.glowB}`} aria-hidden />

      <div className={styles.container}>
        {/* Cabeçalho */}
        <header className={`${styles.head} ${styles.reveal} ${styles.d1}`}>
          <span className={styles.eyebrow}>Para salões</span>
          <h2 className={styles.title}>O seu salão inteiro organizado num lugar só</h2>
          <p className={styles.subtitle}>
            Cabelo, estética, manicure, depilação — agenda, pacotes, assinaturas
            e caixa, tudo conversando entre si.
          </p>
        </header>

        {/* Vitrine do app */}
        <div className={`${styles.showcase} ${styles.reveal} ${styles.d2}`}>
          <div className={styles.window}>
            <Image
              src="/images/dashboard-preview.png"
              alt="Painel do Eligi com a gestão do salão"
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

        {/* Features */}
        <div className={`${styles.grid} ${styles.reveal} ${styles.d3}`}>
          {FEATURES.map(f => {
            const Icon = f.icon
            return (
              <div
                key={f.title}
                className={`${styles.card} ${f.highlight ? styles.cardHi : ''}`}
              >
                <span className={styles.fi}><Icon size={20} /></span>
                <strong>{f.title}</strong>
                <p>{f.desc}</p>
              </div>
            )
          })}
        </div>

        {/* CTA */}
        <div className={`${styles.cta} ${styles.reveal} ${styles.d4}`}>
          <h3>Pronto pra organizar seu salão?</h3>
          <p>7 dias grátis, sem cartão.</p>
          <Link href="/register" className={styles.ctaBtn}>Criar conta grátis</Link>
        </div>
      </div>
    </section>
  )
}
