import Link from 'next/link'
import Image from 'next/image'
import styles from './Footer.module.css'

const NAV = [
  { label: 'Funcionalidades', href: '/#modulos' },
  { label: 'Planos',          href: '/#planos'  },
  { label: 'Barbearias',      href: '/barbearias' },
  { label: 'Salões',          href: '/saloes'   },
  { label: 'Entrar',          href: '/login'    },
  { label: 'Criar conta',     href: '/register' },
]

const WHATSAPP  = 'https://wa.me/5511918579495'
const INSTAGRAM = 'https://instagram.com/eligi_sistemas'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* Marca */}
        <div className={styles.brand}>
          <Image
            src="/images/footer-globe-light.png"
            alt="eligi"
            width={256}
            height={256}
            className={styles.globeLight}
          />
          <Image
            src="/images/footer-globe-dark.png"
            alt="eligi"
            width={256}
            height={256}
            className={styles.globeDark}
          />
          <span className={styles.brandName}>eligi</span>
        </div>

        {/* Links */}
        <nav className={styles.nav} aria-label="Links do rodapé">
          {NAV.map(item => (
            <Link key={item.href} href={item.href}>{item.label}</Link>
          ))}
        </nav>

        {/* Redes */}
        <div className={styles.social}>
          <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
            <svg viewBox="0 0 32 32" fill="none" aria-hidden>
              <path d="M19.1 17.6c-.3-.2-1.7-.8-2-.9-.3-.1-.5-.2-.7.2-.2.3-.8.9-1 1-.2 0-.4 0-.7-.2-.3-.2-1.2-.5-2.3-1.4-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.2-.7.2-.2.3-.4.5-.6.2-.2.2-.3.3-.5.1-.2 0-.4 0-.6-.1-.2-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1.1-1.1 2.6 0 1.5 1.1 3 1.2 3.2.1.2 2.2 3.4 5.3 4.8.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.6-.4z" fill="currentColor" />
              <path d="M16 3C9.4 3 4 8.3 4 14.8c0 2.4.7 4.6 2 6.6L4 29l7.8-2c1.9 1 4 1.6 6.2 1.6 6.6 0 12-5.3 12-11.8C30 8.3 24.6 3 16 3zm0 21.5c-2 0-3.9-.5-5.6-1.5l-.4-.2-4.6 1.2 1.2-4.4-.3-.4C5.2 17.5 4.6 15.5 4.6 13.5 4.6 9.6 9.8 4.6 16 4.6s11.4 5 11.4 10.2S22.2 24.5 16 24.5z" fill="currentColor" />
            </svg>
          </a>
          <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8" />
              <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
              <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
            </svg>
          </a>
        </div>

        <div className={styles.divider} />

        {/* Bottom */}
        <div className={styles.bottom}>
          <span>© {year} eligi</span>
          <span className={styles.dot} aria-hidden>·</span>
          <Link href="/termos">Termos</Link>
          <span className={styles.dot} aria-hidden>·</span>
          <Link href="/privacidade">Privacidade</Link>
          <span className={styles.dot} aria-hidden>·</span>
          <span>Feito com <span className={styles.heart}>♥</span> no Brasil</span>
        </div>
      </div>
    </footer>
  )
}
