import Link from 'next/link';

export const metadata = {
  title: 'Política de Privacidade',
};

export default function PrivacidadePage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      <Link href="/" className="text-sm text-neutral-500">
        ← Voltar
      </Link>

      <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
        <strong>Rascunho-base.</strong> Este texto é um esqueleto baseado na LGPD e precisa ser
        revisado e completado com apoio jurídico antes de entrar em vigor.
      </div>

      <h1 className="mt-6 text-2xl font-semibold">Política de Privacidade</h1>
      <p className="mt-1 text-sm text-neutral-500">Última atualização: 13/06/2026</p>

      <div className="mt-6 space-y-6 text-sm leading-relaxed text-neutral-700">
        <section>
          <h2 className="font-semibold text-neutral-900">1. Dados que coletamos</h2>
          <p>
            Coletamos dados de cadastro (nome, e-mail, telefone), dados do negócio (endereço,
            serviços, horários) e dados de uso da plataforma. [Completar com a lista detalhada.]
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-neutral-900">2. Finalidade do tratamento</h2>
          <p>
            Utilizamos os dados para operar a plataforma, processar agendamentos e pagamentos,
            prestar suporte e melhorar o serviço.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-neutral-900">3. Base legal (LGPD)</h2>
          <p>
            O tratamento se apoia na execução do contrato, no consentimento e no legítimo interesse,
            conforme a Lei nº 13.709/2018. [Completar mapeando cada finalidade à sua base legal.]
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-neutral-900">4. Compartilhamento</h2>
          <p>
            Compartilhamos dados com provedores necessários à operação (ex.: processamento de
            pagamento e infraestrutura), sob obrigações de confidencialidade. [Completar com a lista
            de operadores.]
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-neutral-900">5. Direitos do titular</h2>
          <p>
            Você pode solicitar acesso, correção, portabilidade e exclusão dos seus dados, entre
            outros direitos previstos na LGPD.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-neutral-900">6. Retenção e segurança</h2>
          <p>
            Mantemos os dados pelo tempo necessário às finalidades e adotamos medidas de segurança
            para protegê-los. [Completar com prazos de retenção.]
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-neutral-900">7. Cookies</h2>
          <p>
            Utilizamos cookies essenciais à autenticação e ao funcionamento da plataforma.
            [Completar com cookies analíticos, se houver.]
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-neutral-900">8. Encarregado (DPO) e contato</h2>
          <p>
            Para exercer seus direitos ou tirar dúvidas, entre em contato pelo e-mail
            [definir e-mail do encarregado].
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-neutral-900">9. Alterações</h2>
          <p>
            Esta Política pode ser atualizada. Mudanças relevantes serão comunicadas pelos canais
            oficiais.
          </p>
        </section>
      </div>
    </main>
  );
}
