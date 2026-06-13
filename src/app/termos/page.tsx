import Link from 'next/link';

export const metadata = {
  title: 'Termos de Uso',
};

export default function TermosPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      <Link href="/" className="text-sm text-neutral-500">
        ← Voltar
      </Link>

      <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
        <strong>Rascunho-base.</strong> Este texto é um esqueleto e precisa ser revisado e
        completado com apoio jurídico antes de entrar em vigor.
      </div>

      <h1 className="mt-6 text-2xl font-semibold">Termos de Uso</h1>
      <p className="mt-1 text-sm text-neutral-500">Última atualização: 13/06/2026</p>

      <div className="mt-6 space-y-6 text-sm leading-relaxed text-neutral-700">
        <section>
          <h2 className="font-semibold text-neutral-900">1. Aceitação</h2>
          <p>
            Ao criar uma conta e utilizar a plataforma Eligi, você concorda com estes Termos de
            Uso. Caso não concorde, não utilize o serviço.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-neutral-900">2. Descrição do serviço</h2>
          <p>
            A Eligi é uma plataforma de gestão para negócios de beleza e bem-estar, oferecendo
            agendamento, gestão de equipe, financeiro, caixa e link público de reservas.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-neutral-900">3. Cadastro e conta</h2>
          <p>
            Você é responsável pelas informações fornecidas e pela segurança das suas credenciais.
            As informações devem ser verdadeiras e mantidas atualizadas. [Completar com regras de
            elegibilidade e responsabilidade pela conta.]
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-neutral-900">4. Assinatura, planos e pagamento</h2>
          <p>
            A Eligi é oferecida por assinatura. Pode haver período de teste gratuito de 7 dias. As
            cobranças são processadas por provedor de pagamento terceirizado. [Completar com valores,
            ciclo de cobrança, renovação automática e política de reembolso.]
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-neutral-900">5. Cancelamento</h2>
          <p>
            Você pode cancelar a assinatura a qualquer momento. [Completar com efeitos do
            cancelamento, acesso aos dados e prazos.]
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-neutral-900">6. Obrigações do usuário</h2>
          <p>
            Você se compromete a usar a plataforma de forma lícita e a não violar direitos de
            terceiros. [Completar com condutas proibidas.]
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-neutral-900">7. Limitação de responsabilidade</h2>
          <p>
            [Completar com os limites de responsabilidade da Eligi, na forma da legislação
            aplicável.]
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-neutral-900">8. Propriedade intelectual</h2>
          <p>
            A marca, o software e os conteúdos da Eligi são protegidos. [Completar com termos de
            licença de uso.]
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-neutral-900">9. Alterações destes Termos</h2>
          <p>
            Estes Termos podem ser atualizados. Mudanças relevantes serão comunicadas e poderão
            exigir novo aceite.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-neutral-900">10. Lei aplicável e foro</h2>
          <p>
            Estes Termos são regidos pela legislação brasileira. [Completar com a comarca de foro.]
          </p>
        </section>
      </div>
    </main>
  );
}
