// src/lib/planTerms.ts
// Fonte unica do termo de planos. A versao deve casar com PLAN_TERMS_VERSION do back.
export const PLAN_TERMS_VERSION = '2026-06-v1'

export interface PlanTermsSection {
  n: number
  title: string
  body: string
}

export const PLAN_TERMS_SECTIONS: PlanTermsSection[] = [
  { n: 1, title: 'Teste grátis de 7 dias', body: 'Ao criar sua conta, você tem 7 dias de acesso completo, sem cobrança e sem cadastrar forma de pagamento.' },
  { n: 2, title: 'Planos e valores', body: 'Autônomo — R$ 59,90/mês (agenda individual, para quem atende sozinho). Estabelecimento — R$ 99,90/mês (equipe com até 3 profissionais ativos inclusos, incluindo você); cada profissional ativo acima de 3 custa R$ 19,90/mês. Valores mensais, cobrados de forma recorrente enquanto a assinatura estiver ativa.' },
  { n: 3, title: 'Forma de pagamento', body: 'As cobranças são por boleto bancário ou Pix. A cada mês geramos uma cobrança que você paga por um desses meios para manter o acesso. Não trabalhamos com cartão de crédito.' },
  { n: 4, title: 'Início e renovação', body: 'A primeira cobrança é gerada quando você ativa a assinatura (ao fim do teste, ou antes se preferir). A partir daí, uma nova cobrança é gerada a cada mês, no mesmo ciclo, enquanto a assinatura estiver ativa.' },
  { n: 5, title: 'Fim do teste sem assinar', body: 'Terminados os 7 dias sem assinatura, o acesso ao painel é bloqueado até a regularização. Seus dados não são apagados — voltam assim que você assinar.' },
  { n: 6, title: 'Atraso no pagamento', body: 'Cobrança não paga até o vencimento bloqueia o acesso até a regularização. Os dados permanecem preservados.' },
  { n: 7, title: 'Profissionais adicionais (Estabelecimento)', body: 'Ativar o 4º profissional (ou além) aumenta a assinatura em R$ 19,90/mês por profissional, valendo na próxima cobrança (sem cobrança proporcional no meio do ciclo). Desativar profissionais reduz o valor, também na próxima cobrança.' },
  { n: 8, title: 'Mudança de plano', body: 'Do Autônomo para o Estabelecimento: os recursos são liberados na hora e o novo valor vale na próxima cobrança (sem proporcional no ciclo atual).' },
  { n: 9, title: 'Cancelamento', body: 'Você pode cancelar quando quiser, pela página do seu plano (Configurações). Após o cancelamento não geramos novas cobranças; o acesso vale até o fim do período já pago e, depois, o painel é bloqueado.' },
  { n: 10, title: 'Alteração de valores', body: 'Reajustes serão informados com antecedência, e você decide se mantém a assinatura.' },
  { n: 11, title: 'Seus dados', body: 'O bloqueio não exclui seus dados — ficam preservados por até 3 meses após o bloqueio; depois desse prazo podem ser removidos definitivamente.' },
  { n: 12, title: 'Reembolso', body: 'Pagamentos já confirmados não são reembolsados, integral ou proporcionalmente.' },
]
