// src/shared/components/AsaasSeal.tsx
//
// SELO OFICIAL "Serviços financeiros ASAAS" — obrigatorio no modelo BaaS.
//
// Exigencia regulatoria (Resolucao Conjunta no 16/2025 do Banco Central + playbook
// de BaaS do Asaas): sempre que houver movimentacao ou gestao de valores no nosso
// produto, o cliente final precisa saber que a operacao financeira e prestada pelo
// Asaas — e nao pelo Eligi.
//
// ⚠️ As imagens vem da CDN do Asaas, NAO devem ser baixadas/hospedadas por nos:
// eles atualizam a marca de forma centralizada e o nosso projeto acompanha sozinho.
// As URLs carregam o `id` da nossa homologacao — nao trocar nem remover.
//
// Onde aplicar (playbook): telas de produto (criacao de subconta, comprovantes,
// extratos), fluxos externos de pagamento, comunicacoes com o usuario e
// documentacoes legais.

const SEAL_ID = '00d74901-ea59-403d-818e-c36544d30004'
const BASE = 'https://baas.asaas.com/selos'

/**
 * positivo → fundo claro (azul Asaas)
 * preto    → fundo claro, monocromatico
 * branco   → fundo escuro
 */
export type AsaasSealVariant = 'positivo' | 'preto' | 'branco'

const SRC: Record<AsaasSealVariant, string> = {
  positivo: `${BASE}/Servicos_financeiros_Asaas-Reduzida-Positivo.svg?id=${SEAL_ID}`,
  preto: `${BASE}/Servicos_financeiros_Asaas-Reduzida-Negativo-Preto.svg?id=${SEAL_ID}`,
  branco: `${BASE}/Servicos_financeiros_Asaas-Reduzida-Negativo-Branco.svg?id=${SEAL_ID}`,
}

export default function AsaasSeal({
  variant = 'positivo',
  width = 148,
  linked = true,
  align = 'center',
}: {
  variant?: AsaasSealVariant
  width?: number
  /** selo clicavel abrindo asaas.com em nova aba (recomendado no playbook) */
  linked?: boolean
  align?: 'left' | 'center'
}) {
  const height = Math.round((width / 160) * 48) // proporcao oficial 160x48

  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={SRC[variant]}
      alt="Serviços financeiros Asaas"
      width={width}
      height={height}
      style={{ display: 'inline-block' }}
    />
  )

  return (
    <div style={{ textAlign: align, marginTop: 14 }}>
      {linked ? (
        <a
          href="https://asaas.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'inline-block', lineHeight: 0 }}
        >
          {img}
        </a>
      ) : (
        img
      )}
    </div>
  )
}

/**
 * Canais de suporte do Asaas — o playbook exige que o cliente final saiba
 * que pode acionar o Asaas para questoes da operacao financeira.
 */
export function AsaasSupportNote() {
  return (
    <div style={{
      fontSize: 10.5, color: 'rgba(0,0,0,0.38)', lineHeight: 1.55,
      textAlign: 'center', marginTop: 8,
    }}>
      Dúvidas sobre a operação financeira: Asaas — 0800 009 0037 ·{' '}
      <a
        href="mailto:contato@asaas.com.br"
        style={{ color: 'inherit', textDecoration: 'underline' }}
      >
        contato@asaas.com.br
      </a>
    </div>
  )
}
