import Link from 'next/link'
import styles from './Footer.module.css'

const NAV_COLS = [
  {
    title: 'Produto',
    links: [
      { label: 'Visão geral', href: '/'          },
      { label: 'Dashboard',   href: '/dashboard'  },
      { label: 'Anúncios',    href: '/ads'        },
    ],
  },
  {
    title: 'Negócios',
    links: [
      { label: 'Barbearias', href: '/barbearias' },
      { label: 'Salões',     href: '/saloes'     },
    ],
  },
  {
    title: 'Conta',
    links: [
      { label: 'Entrar',      href: '/login'    },
      { label: 'Criar conta', href: '/register' },
    ],
  },
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* Brand */}
        <div className={styles.brand}>
          <div className={styles.logoWrapper}>
            <div className={styles.logoMark}>
              <span>e</span>
            </div>
            <span className={styles.brandName}>eligi</span>
          </div>
          <p className={styles.tagline}>
            Plataforma inteligente para barbearias e salões.
          </p>
        </div>

        {/* Nav links */}
        <nav className={styles.links} aria-label="Links do rodapé">
          {NAV_COLS.map(col => (
            <div key={col.title} className={styles.col}>
              <span className={styles.colTitle}>{col.title}</span>
              {col.links.map(link => (
                <Link key={link.href} href={link.href}>
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom bar */}
      <div className={styles.bottom}>
        <span className={styles.copyright}>
          © {year} eligi. Todos os direitos reservados.
        </span>
        <span className={styles.made}>
          Feito com <span>♥</span> no Brasil
        </span>
      </div>
    </footer>
  )
}