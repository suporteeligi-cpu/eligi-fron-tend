// src/app/excluir-conta/page.tsx
// @eligi:public-excluir-conta
// Pagina PUBLICA exigida pelo Google Play (link de exclusao de conta na ficha
// da loja): explica como excluir a conta e os dados, sem precisar de login.
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Excluir conta | Eligi',
  description: 'Como excluir a sua conta do Eligi e o que acontece com os seus dados.',
}

const SUPPORT_WHATSAPP = 'https://wa.me/5511918579495'

const h2: React.CSSProperties = { margin: '26px 0 8px', fontSize: 17, fontWeight: 600, color: '#111114' }
const p: React.CSSProperties = { margin: '0 0 10px', fontSize: 15, lineHeight: 1.6, color: '#4b4b52' }
const li: React.CSSProperties = { fontSize: 15, lineHeight: 1.6, color: '#4b4b52', marginBottom: 4 }

export default function Page() {
  return (
    <main style={{
      minHeight: '100vh', background: '#f5f5f7', padding: '32px 16px 56px',
      fontFamily: 'var(--font-eligi-sans), system-ui, sans-serif',
    }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <Link href="/" style={{
          display: 'inline-flex', alignItems: 'center', minHeight: 40, marginBottom: 16,
          color: 'rgba(0,0,0,0.5)', fontSize: 13, textDecoration: 'none',
        }}>
          ‹ Voltar ao site
        </Link>

        <article style={{
          background: '#fff', borderRadius: 18, padding: '28px 24px',
          boxShadow: '0 1px 6px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.06)',
        }}>
          <h1 style={{
            margin: '0 0 10px', fontFamily: 'var(--font-eligi-display), system-ui, sans-serif',
            fontSize: 28, fontWeight: 600, letterSpacing: '-0.03em', color: '#111114',
          }}>
            Excluir a sua conta do Eligi
          </h1>
          <p style={p}>
            Você pode excluir a sua conta a qualquer momento, pelo aplicativo Eligi ou pelo
            painel em www.eligi.com.br.
          </p>

          <h2 style={h2}>Como excluir</h2>
          <ol style={{ margin: 0, paddingLeft: 20 }}>
            <li style={li}>Entre na sua conta no aplicativo ou em www.eligi.com.br.</li>
            <li style={li}>Abra o menu da sua conta (no celular, a aba “Mais”).</li>
            <li style={li}>Toque em “Excluir conta”, digite EXCLUIR e confirme.</li>
          </ol>

          <h2 style={h2}>O que acontece</h2>
          <p style={p}>
            <strong>Dono do estabelecimento:</strong> a assinatura é cancelada na hora e o acesso
            de toda a equipe é encerrado. Agenda, clientes, equipe e fotos são apagados em 7 dias.
            Durante esse prazo dá para desistir entrando de novo no Eligi.
          </p>
          <p style={p}>
            <strong>Profissional ou recepção:</strong> o seu acesso é removido na hora. Os
            atendimentos que você fez continuam no estabelecimento, que é o dono desses registros.
          </p>

          <h2 style={h2}>O que fica guardado</h2>
          <p style={p}>
            Notas fiscais emitidas são guardadas por 5 anos, por exigência da legislação fiscal.
            Registros de pagamento podem ser mantidos pelo prazo exigido em lei.
          </p>

          <h2 style={h2}>Precisa de ajuda?</h2>
          <p style={p}>
            Se não conseguir entrar na conta, ou se o estabelecimento usa o EligiClub, fale com o
            suporte pelo WhatsApp:{' '}
            <a href={SUPPORT_WHATSAPP} style={{ color: '#dc2626' }} target="_blank" rel="noopener noreferrer">
              (11) 91857-9495
            </a>
            .
          </p>
          <p style={p}>
            Mais detalhes na <Link href="/privacidade" style={{ color: '#111114' }}>Política de Privacidade</Link>.
          </p>
        </article>

        <div style={{
          textAlign: 'center', fontSize: 11.5, color: 'rgba(0,0,0,0.35)', marginTop: 20, lineHeight: 1.6,
        }}>
          ELIGI SISTEMAS EMPRESARIAIS LTDA · CNPJ 64.539.922/0001-54
        </div>
      </div>
    </main>
  )
}
