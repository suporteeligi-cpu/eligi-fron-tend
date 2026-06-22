// src/shared/legal/legalContent.tsx
// Fonte unica dos textos legais. RASCUNHO v0 — pendente de revisao juridica.

export type LegalKind = 'termos' | 'privacidade' | 'termos-plano'

export type LegalBlock =
  | { kind: 'h'; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'note'; text: string }

export interface LegalDocData {
  title: string
  updated: string
  intro: string
  blocks: LegalBlock[]
}

export const TERMOS: LegalDocData = {
  title: 'Termos de Uso',
  updated: '21 de junho de 2026',
  intro:
    'Estes Termos regem o acesso e o uso da plataforma Eligi por estabelecimentos e profissionais que a contratam (o "Assinante"). A plataforma e fornecida por ELIGI SISTEMAS EMPRESARIAIS LTDA, CNPJ 64.539.922/0001-54, com sede na Avenida Major Benjamin Franco, Centro Residencial, Aruja/SP. Ao se cadastrar, aceitar no onboarding, contratar uma assinatura ou usar a plataforma, voce declara que leu e concorda com estes Termos e que tem poderes para representar o estabelecimento que cadastra.',
  blocks: [
    { kind: 'h', text: '1. Definicoes' },
    { kind: 'ul', items: [
      'Plataforma: o sistema Eligi de gestao de agendamentos, equipe, financeiro, caixa, pacotes, assinaturas de cliente, estoque, link publico de agendamento e relatorios.',
      'Assinante: o estabelecimento ou profissional autonomo que contrata a Plataforma.',
      'Usuarios da Conta: as pessoas que o Assinante autoriza a acessar a Plataforma.',
      'Cliente Final: o consumidor atendido pelo Assinante cujos dados sao tratados na Plataforma.',
    ] },

    { kind: 'h', text: '2. Objeto e licenca de uso' },
    { kind: 'p', text: 'O Eligi concede ao Assinante uma licenca pessoal, nao exclusiva, intransferivel e revogavel para usar a Plataforma como software como servico (SaaS), durante a vigencia da Assinatura e nos limites destes Termos.' },
    { kind: 'p', text: 'A Plataforma e fornecida "no estado em que se encontra". O Eligi desenvolve e licencia o software; nao presta os servicos de beleza/estetica agendados nem e parte na relacao entre o Assinante e o Cliente Final. A licenca nao transfere direito sobre o codigo, a marca ou a propriedade intelectual da Plataforma.' },

    { kind: 'h', text: '3. Cadastro e conta' },
    { kind: 'p', text: 'O Assinante deve fornecer informacoes verdadeiras, completas e atualizadas. E responsavel pela guarda de suas credenciais e por todo uso feito a partir de sua conta, devendo comunicar o Eligi imediatamente em caso de uso indevido. O Assinante declara ser maior de 18 anos e juridicamente capaz.' },

    { kind: 'h', text: '4. Equipe e usuarios da conta' },
    { kind: 'p', text: 'O Assinante pode criar acessos para sua equipe, com cargos de diferentes permissoes, e e responsavel pelos atos de seus Usuarios da Conta e por revogar acessos quando necessario.' },

    { kind: 'h', text: '5. Assinatura e pagamento' },
    { kind: 'p', text: 'As condicoes comerciais da Plataforma — planos, precos, cobranca, periodo de teste, reajuste, cancelamento e reembolso — constam nos Termos de Planos e Assinatura, que integram estes Termos.' },

    { kind: 'h', text: '6. Dados pessoais e responsabilidades do Assinante' },
    { kind: 'p', text: 'Ao inserir, importar ou tratar na Plataforma dados de Clientes Finais e de terceiros, o Assinante atua como controlador desses dados e o Eligi como operador, processando-os conforme as instrucoes do Assinante e o Adendo de Tratamento de Dados (DPA). O Assinante declara possuir base legal adequada (LGPD - Lei no 13.709/2018) para tratar esses dados e responde por essa adequacao.' },

    { kind: 'h', text: '7. Uso aceitavel' },
    { kind: 'ul', items: [
      'Nao usar a Plataforma para fins ilicitos nem violar direitos de terceiros ou do Eligi.',
      'Nao tentar acessar dados ou contas de terceiros sem autorizacao.',
      'Nao realizar engenharia reversa, copiar, sublicenciar ou revender a Plataforma.',
      'Nao introduzir codigo malicioso nem sobrecarregar a infraestrutura.',
      'Nao extrair dados da Plataforma para analise competitiva ou benchmarking.',
    ] },

    { kind: 'h', text: '8. Propriedade intelectual' },
    { kind: 'p', text: 'A Plataforma, o software, a marca "Eligi" e demais elementos sao de titularidade do Eligi ou de seus licenciadores. O conteudo que o Assinante insere (dados do negocio, logo, fotos, textos) permanece dele; o Assinante concede ao Eligi licenca para hospedar e exibir esse conteudo na medida necessaria a prestacao do servico.' },

    { kind: 'h', text: '9. Limitacao de responsabilidade' },
    { kind: 'p', text: 'O Eligi empenha esforcos razoaveis para manter a Plataforma disponivel, sem garantir disponibilidade ininterrupta ou livre de erros, e nao responde por indisponibilidades decorrentes de terceiros, forca maior ou da internet. O Eligi nao e parte na relacao entre o Assinante e seus Clientes Finais e nao responde pela qualidade, execucao ou pagamento dos servicos prestados pelo Assinante.' },

    { kind: 'h', text: '10. Vigencia e alteracoes' },
    { kind: 'p', text: 'Estes Termos vigoram enquanto durar a relacao entre as partes. O Eligi pode altera-los, comunicando o Assinante pela Plataforma e/ou por e-mail; alteracoes relevantes exigem novo aceite, e a continuidade do uso apos o aviso implica concordancia com a versao vigente. O aceite e a versao aceita sao registrados.' },

    { kind: 'h', text: '11. Lei aplicavel e foro' },
    { kind: 'p', text: 'Estes Termos sao regidos pela lei brasileira. Fica eleito o foro do domicilio do Assinante, sem prejuizo das regras protetivas do Codigo de Defesa do Consumidor quando aplicaveis.' },

    { kind: 'note', text: 'Contato: Encarregado pelo Tratamento de Dados (DPO) Elivelton Caio Borges - privacidade@eligi.com.br' },
  ],
}

export const TERMOS_PLANO: LegalDocData = {
  title: 'Termos de Planos e Assinatura',
  updated: '21 de junho de 2026',
  intro:
    'Estes Termos regem a contratacao e a cobranca da assinatura da plataforma Eligi, fornecida por ELIGI SISTEMAS EMPRESARIAIS LTDA, CNPJ 64.539.922/0001-54. Integram e complementam os Termos de Uso.',
  blocks: [
    { kind: 'h', text: '1. Planos e precos' },
    { kind: 'ul', items: [
      'Autonomo: R$ 59,90/mes - agenda unica do proprio profissional.',
      'Estabelecimento: R$ 99,90/mes - inclui ate 3 profissionais ativos; cada profissional adicional acima de 3 e cobrado a parte, conforme informado na contratacao.',
    ] },
    { kind: 'p', text: 'Os planos e valores vigentes ficam disponiveis na Plataforma e podem variar conforme o porte e os recursos contratados.' },

    { kind: 'h', text: '2. Periodo de teste (trial)' },
    { kind: 'p', text: 'O Assinante pode ter direito a um periodo gratuito de avaliacao de 7 (sete) dias, contado da criacao do estabelecimento. Encerrado o periodo sem contratacao, o acesso e suspenso ate a regularizacao.' },

    { kind: 'h', text: '3. Profissionais adicionais' },
    { kind: 'p', text: 'Quando o plano preve cobranca por profissional adicional, a inclusao de profissional acima do limite ajusta o valor da assinatura a partir do ciclo seguinte, mediante confirmacao do Assinante na Plataforma.' },

    { kind: 'h', text: '4. Cobranca e renovacao' },
    { kind: 'p', text: 'A cobranca e mensal e recorrente, processada por provedor de pagamentos terceirizado (atualmente Asaas), por boleto ou Pix, repetindo-se a cada ciclo ate o cancelamento. O Assinante autoriza a cobranca recorrente e e responsavel por manter meio de pagamento e dados de cobranca atualizados.' },

    { kind: 'h', text: '5. Inadimplencia' },
    { kind: 'p', text: 'O nao pagamento na data de vencimento autoriza o Eligi a suspender o acesso a Plataforma ate a regularizacao, sem prejuizo da cobranca dos valores devidos. Durante a suspensao, os dados sao preservados conforme a clausula 8.' },

    { kind: 'h', text: '6. Reajuste' },
    { kind: 'p', text: 'Os valores podem ser reajustados anualmente pela variacao do IPCA (ou indice que o substitua), mediante aviso previo de 30 (trinta) dias.' },

    { kind: 'h', text: '7. Cancelamento e reembolso' },
    { kind: 'p', text: 'O Assinante pode cancelar a assinatura a qualquer momento, encerrando a renovacao seguinte. Nao ha reembolso proporcional de ciclo ja pago e em curso, ressalvado o direito de arrependimento do art. 49 do CDC: quem contratar pela internet e desistir em ate 7 (sete) dias tem direito a devolucao integral do valor pago naquele ciclo.' },

    { kind: 'h', text: '8. Dados apos o termino' },
    { kind: 'p', text: 'Encerrada a relacao, os dados sao eliminados em ate 90 (noventa) dias, ressalvados os que devam ser retidos por obrigacao legal (por exemplo, fiscais) e as copias em backup, que expiram no ciclo normal de rotacao. O Assinante pode solicitar a exportacao de seus dados antes do termino.' },

    { kind: 'note', text: 'Estes Termos de Planos e Assinatura sao parte integrante dos Termos de Uso da plataforma Eligi.' },
  ],
}

export const PRIVACIDADE: LegalDocData = {
  title: 'Politica de Privacidade',
  updated: '21 de junho de 2026',
  intro:
    'A ELIGI SISTEMAS EMPRESARIAIS LTDA, CNPJ 64.539.922/0001-54, com sede na Avenida Major Benjamin Franco, Centro Residencial, Aruja/SP, explica nesta Politica como trata dados pessoais na plataforma Eligi, conforme a LGPD (Lei no 13.709/2018).',
  blocks: [
    { kind: 'h', text: '1. Nossos papeis: controlador e operador' },
    { kind: 'p', text: 'O Eligi atua como controlador em relacao aos dados dos assinantes e de seus usuarios de conta (cadastro, cobranca, uso e navegacao). Atua como operador em relacao aos dados de clientes finais que o assinante insere ou importa: nesses dados, o assinante e o controlador e o Eligi os trata conforme as instrucoes dele e o Adendo de Tratamento de Dados (DPA). Essa distincao determina a quem o titular deve recorrer para exercer seus direitos.' },

    { kind: 'h', text: '2. Dados que tratamos' },
    { kind: 'p', text: 'Assinante e usuarios da conta: nome, e-mail, telefone, CPF/CNPJ, dados do estabelecimento (nome, endereco, CEP, geolocalizacao), logo, foto de perfil, credenciais (senha cifrada), dados de cobranca e historico de uso.' },
    { kind: 'p', text: 'Cliente final (sob controladoria do assinante): nome, telefone, e-mail, CPF (quando fornecido), historico de agendamentos e preferencias.' },
    { kind: 'p', text: 'Coletados automaticamente: endereco IP, identificadores de dispositivo, data/hora de acesso e dados de uso necessarios ao funcionamento e a seguranca da plataforma.' },

    { kind: 'h', text: '3. Bases legais e finalidades' },
    { kind: 'ul', items: [
      'Criar e manter a conta, prestar o servico e processar a assinatura - execucao de contrato (art. 7o, V).',
      'Emissao de documentos fiscais e obrigacoes contabeis/fiscais - cumprimento de obrigacao legal (art. 7o, II).',
      'Seguranca, prevencao a fraude e melhoria do servico - legitimo interesse (art. 7o, IX).',
      'Comunicacoes promocionais ao assinante, localizacao precisa e cookies nao essenciais - consentimento (art. 7o, I).',
    ] },
    { kind: 'note', text: 'Comunicacoes transacionais (confirmacoes, lembretes, avisos de cobranca, suporte) fazem parte do servico. Promocionais ao assinante dependem de opt-in. O cliente final nao recebe comunicacoes de marketing do Eligi - apenas as do proprio estabelecimento.' },

    { kind: 'h', text: '4. Compartilhamento e operadores subcontratados' },
    { kind: 'p', text: 'Compartilhamos dados apenas quando necessario para operar o servico, com prestadores sob obrigacao de confidencialidade e seguranca:' },
    { kind: 'ul', items: [
      'Hospedagem e banco de dados (atualmente Railway).',
      'Processamento de pagamentos da assinatura (atualmente Asaas).',
      'Envio de e-mails transacionais (atualmente Resend).',
      'Login social (Google; Apple quando disponivel).',
      'Servicos de mapa e geocodificacao.',
      'Envio de SMS/OTP e armazenamento de arquivos em nuvem (quando ativados).',
    ] },
    { kind: 'p', text: 'Tambem podemos compartilhar dados para cumprir obrigacao legal, atender autoridade competente ou em caso de reorganizacao societaria, preservando o nivel de protecao desta Politica.' },

    { kind: 'h', text: '5. Transferencia internacional de dados' },
    { kind: 'p', text: 'Parte da infraestrutura e dos prestadores acima (incluindo hospedagem, e-mail e login social) processa dados fora do Brasil. Nesses casos, a transferencia internacional observa as salvaguardas exigidas pelo art. 33 da LGPD.' },

    { kind: 'h', text: '6. Retencao e eliminacao' },
    { kind: 'p', text: 'Os dados sao mantidos enquanto durar a relacao contratual e, apos o termino, eliminados em ate 90 (noventa) dias, ressalvados os que devam ser retidos por obrigacao legal (por exemplo, fiscais), pelo prazo exigido em lei, e as copias em backup, que expiram no ciclo normal de rotacao.' },

    { kind: 'h', text: '7. Direitos do titular' },
    { kind: 'p', text: 'Nos termos do art. 18 da LGPD, o titular pode solicitar confirmacao e acesso aos dados, correcao, anonimizacao/bloqueio/eliminacao, portabilidade, informacao sobre compartilhamentos e revogacao do consentimento.' },
    { kind: 'note', text: 'Dados sob controladoria do Eligi (assinante/conta): solicite por privacidade@eligi.com.br. Dados de cliente final: como o Eligi atua como operador, o controlador e o estabelecimento em que o cliente foi atendido - o Eligi encaminha o pedido ao estabelecimento ou orienta o titular a procura-lo.' },

    { kind: 'h', text: '8. Seguranca' },
    { kind: 'p', text: 'Adotamos medidas tecnicas e organizacionais para proteger os dados, incluindo cifragem de senhas, comunicacao criptografada (TLS) e cookies de sessao httpOnly. Nenhum sistema e integralmente imune; o titular tambem e responsavel por proteger suas credenciais.' },

    { kind: 'h', text: '9. Cookies e armazenamento local' },
    { kind: 'p', text: 'A plataforma usa cookies e armazenamento local essenciais (sessao e autenticacao) e funcionais (preferencias de tema e de interface). Nao utilizamos cookies de publicidade de terceiros. O navegador permite gerenciar cookies, com possivel impacto em funcionalidades.' },

    { kind: 'h', text: '10. Menores' },
    { kind: 'p', text: 'A plataforma e destinada a maiores de 18 anos e nao e direcionada a menores. Eventual cadastro de cliente final menor de idade e de responsabilidade do estabelecimento e de quem detem a autoridade parental, observada a LGPD.' },

    { kind: 'h', text: '11. Alteracoes desta Politica' },
    { kind: 'p', text: 'Podemos atualizar esta Politica periodicamente, alterando a data de ultima atualizacao e, em mudancas relevantes, comunicando os titulares pelos canais disponiveis.' },

    { kind: 'note', text: 'Encarregado pelo Tratamento de Dados (DPO): Elivelton Caio Borges - privacidade@eligi.com.br' },
  ],
}
