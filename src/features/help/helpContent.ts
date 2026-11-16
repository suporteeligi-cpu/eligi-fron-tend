// src/features/help/helpContent.ts
// @eligi:help-content
//
// Diretorio de ajuda do painel: um assunto por modulo e, dentro, um guia por
// duvida comum. E a fonte unica do chat de ajuda (HelpWidget). Texto em
// portugues simples: o lojista le no celular, entre um cliente e outro.
//
// Regras do conteudo:
// - `ask` e a frase que a pessoa toca no chat (inteira, na voz dela).
// - `steps` dizem ONDE fica e O QUE tocar, com o nome que aparece na tela.
// - `href` leva a tela certa; so aponte para rota que o cargo pode abrir
//   (o filtro por `roles` cuida disso).
// - `webOnly`: nao aparece dentro do app (loja nao deixa falar de pagamento do
//   plano fora dela).
// - Mudou o texto de um botao no painel? Mude o guia junto.

import type { Role } from '@/app/components/navigation/navigation.config'

export interface HelpGuide {
  id: string
  /** Frase que a pessoa toca no chat. */
  ask: string
  /** Titulo curto (busca e mensagem do WhatsApp). */
  title: string
  steps: string[]
  href?: string
  hrefLabel?: string
  /** Palavras extras para a busca. */
  keywords?: string[]
  /** Quem ve. Sem lista = todos. */
  roles?: Role[]
  webOnly?: boolean
}

export interface HelpTopic {
  id: string
  title: string
  /** Frase do assunto no chat. */
  ask: string
  /** Telas que puxam este assunto primeiro (prefixo de rota). */
  paths: string[]
  guides: HelpGuide[]
}

const OWNER: Role[] = ['BUSINESS_OWNER']
const OWNER_MANAGER: Role[] = ['BUSINESS_OWNER', 'MANAGER']
const DESK: Role[] = ['BUSINESS_OWNER', 'MANAGER', 'RECEPTIONIST']
const CASHIER: Role[] = ['BUSINESS_OWNER', 'MANAGER', 'RECEPTIONIST', 'STAFF', 'BASIC_STAFF']
const CLUB: Role[] = ['BUSINESS_OWNER', 'MANAGER', 'RECEPTIONIST']

export const HELP_TOPICS: HelpTopic[] = [
  {
    id: 'inicio',
    title: 'Primeiros passos',
    ask: 'Estou começando e quero deixar tudo pronto',
    paths: ['/dashboard/configuracoes'],
    guides: [
      {
        id: 'pronto-para-usar', roles: OWNER,
        ask: 'Quero deixar tudo pronto para os clientes começarem a marcar',
        title: 'Deixar tudo pronto para começar',
        steps: [
          'Em Configurações › Perfil e endereço, coloque o endereço e confira o pino no mapa.',
          'Em Configurações › Horário de funcionamento, ligue os dias em que abre e ajuste os horários.',
          'Em Serviços, toque em Novo serviço e cadastre cada serviço com preço e duração.',
          'Em Equipe, confira quem atende e quais serviços cada pessoa faz.',
          'No topo do painel, toque no ícone de link e mande o seu link para os clientes.',
        ],
        href: '/dashboard/configuracoes', hrefLabel: 'Abrir Configurações',
        keywords: ['começar', 'configurar', 'inicio', 'primeiro acesso', 'onboarding'],
      },
      {
        id: 'mandar-link', roles: DESK,
        ask: 'Quero mandar o meu link de agendamento para os clientes',
        title: 'Mandar o link de agendamento',
        steps: [
          'No topo do painel, toque no ícone de link (Link de agendamento).',
          'Copie o link ou mande direto pelo WhatsApp.',
          'Dica: coloque o link na bio do Instagram e no status do WhatsApp.',
        ],
        keywords: ['link', 'compartilhar', 'instagram', 'bio', 'agendar online'],
      },
      {
        id: 'logo-capa', roles: OWNER,
        ask: 'Quero colocar meu logo, a capa e as fotos do lugar',
        title: 'Logo, capa e fotos',
        steps: [
          'Abra Configurações › Perfil e endereço.',
          'Toque em Logo para enviar a imagem do seu negócio.',
          'Em Capa, escolha uma foto ou um dos fundos prontos.',
          'Em Fotos, mostre o espaço e trabalhos feitos. Salve cada parte.',
        ],
        href: '/dashboard/configuracoes/empresa', hrefLabel: 'Abrir Perfil e endereço',
        keywords: ['logo', 'foto', 'capa', 'imagem', 'perfil', 'galeria'],
      },
      {
        id: 'cores-link', roles: OWNER,
        ask: 'Quero mudar as cores e o estilo do meu link',
        title: 'Cores e estilo do link',
        steps: [
          'Abra Configurações › Perfil e endereço.',
          'Toque em Cores e escolha a cor principal do seu negócio.',
          'Escolha o estilo da página: Claro, Marca ou Papel.',
          'Toque em Salvar. A prévia mostra como o cliente vê.',
        ],
        href: '/dashboard/configuracoes/empresa', hrefLabel: 'Abrir Perfil e endereço',
        keywords: ['cor', 'tema', 'estilo', 'fundo', 'aparência do link'],
      },
      {
        id: 'endereco-mapa', roles: OWNER,
        ask: 'O endereço ou o mapa do meu negócio está errado',
        title: 'Corrigir endereço e mapa',
        steps: [
          'Abra Configurações › Perfil e endereço e toque em Endereço.',
          'Digite o CEP: a rua, o bairro e a cidade se preenchem sozinhos.',
          'Coloque o número (ou marque Sem número).',
          'Arraste o pino até a porta do seu negócio e toque em Salvar.',
        ],
        href: '/dashboard/configuracoes/empresa', hrefLabel: 'Abrir Perfil e endereço',
        keywords: ['endereço', 'mapa', 'pino', 'cep', 'localização', 'waze'],
      },
    ],
  },
  {
    id: 'agenda',
    title: 'Agenda',
    ask: 'Agenda e horários dos clientes',
    paths: ['/dashboard/agenda'],
    guides: [
      {
        id: 'marcar-horario', roles: CASHIER,
        ask: 'Quero marcar um horário para um cliente',
        title: 'Marcar um horário',
        steps: [
          'Na Agenda, toque em + (Novo agendamento) ou num horário vazio.',
          'Escolha o cliente (ou cadastre na hora), o serviço e o profissional.',
          'Confira o início e o fim e confirme.',
          'Quer mandar a confirmação? Toque no cartão e use o botão do WhatsApp.',
        ],
        href: '/dashboard/agenda', hrefLabel: 'Abrir Agenda',
        keywords: ['agendar', 'marcar', 'novo agendamento', 'horário'],
      },
      {
        id: 'varios-servicos', roles: CASHIER,
        ask: 'Quero marcar mais de um serviço no mesmo atendimento',
        title: 'Vários serviços no mesmo atendimento',
        steps: [
          'Comece um agendamento normal na Agenda.',
          'No painel, adicione outro serviço logo abaixo do primeiro.',
          'Cada serviço pode ser com um profissional diferente, um depois do outro ou ao mesmo tempo.',
          'Já marcado? Toque no cartão e use Adicionar serviço.',
        ],
        href: '/dashboard/agenda', hrefLabel: 'Abrir Agenda',
        keywords: ['dois serviços', 'combo', 'grupo', 'adicionar serviço'],
      },
      {
        id: 'mudar-horario', roles: CASHIER,
        ask: 'Quero mudar o horário de um cliente que já está marcado',
        title: 'Mudar um horário marcado',
        steps: [
          'No computador: arraste o cartão para o novo horário ou para outra coluna.',
          'No celular: segure o cartão até ele soltar e arraste.',
          'Ou toque no cartão, edite o horário e salve.',
          'Para esticar ou encurtar, puxe a borda de baixo do cartão.',
        ],
        href: '/dashboard/agenda', hrefLabel: 'Abrir Agenda',
        keywords: ['remarcar', 'arrastar', 'mudar horário', 'trocar horário'],
      },
      {
        id: 'bloquear', roles: CASHIER,
        ask: 'Quero bloquear um horário para almoço, folga ou compromisso',
        title: 'Bloquear um horário',
        steps: [
          'Na Agenda, toque num horário vazio e escolha Bloquear horário (no computador também tem o botão Bloquear no topo).',
          'Escolha o profissional, o início, o fim e, se quiser, o motivo.',
          'Salve. O link deixa de oferecer esse horário.',
          'Para tirar, toque no bloqueio e apague.',
        ],
        href: '/dashboard/agenda', hrefLabel: 'Abrir Agenda',
        keywords: ['bloqueio', 'almoço', 'folga', 'pausa', 'fechar horário'],
      },
      {
        id: 'cancelar-falta', roles: CASHIER,
        ask: 'Quero cancelar um horário ou marcar que o cliente não veio',
        title: 'Cancelar ou marcar falta',
        steps: [
          'Toque no cartão do cliente na Agenda.',
          'Para desmarcar, use Cancelar.',
          'Se o cliente não apareceu, use Não compareceu: o cartão fica apagado e conta nas faltas dele.',
        ],
        href: '/dashboard/agenda', hrefLabel: 'Abrir Agenda',
        keywords: ['cancelar', 'falta', 'não veio', 'no-show', 'desmarcar'],
      },
      {
        id: 'repetir', roles: OWNER_MANAGER,
        ask: 'Quero marcar um cliente que vem toda semana',
        title: 'Horário que se repete',
        steps: [
          'Comece um agendamento com um serviço só.',
          'No painel, ligue Repetir e escolha de quantas em quantas semanas.',
          'Diga até quando: por número de vezes ou por data.',
          'Confira as datas: as que batem com outro horário aparecem para você decidir.',
        ],
        href: '/dashboard/agenda', hrefLabel: 'Abrir Agenda',
        keywords: ['repetir', 'toda semana', 'recorrente', 'fixo', 'semanal'],
      },
      {
        id: 'nao-apareceu', roles: CASHIER,
        ask: 'Um cliente agendou pelo link e não apareceu na agenda',
        title: 'Agendamento do link não aparece',
        steps: [
          'Confira o dia: deslize a régua de dias até a data que o cliente escolheu.',
          'Confira se o profissional está ligado para aparecer na agenda (Equipe › ficha do profissional).',
          'Feche e abra a Agenda de novo para atualizar.',
          'Agendamentos do link têm o selo de foguete no cartão.',
        ],
        href: '/dashboard/agenda', hrefLabel: 'Abrir Agenda',
        keywords: ['sumiu', 'não aparece', 'link', 'online', 'foguete'],
      },
      {
        id: 'confirmar-whats', roles: DESK,
        ask: 'Quero mandar a confirmação do horário pelo WhatsApp',
        title: 'Confirmação pelo WhatsApp',
        steps: [
          'Toque no cartão do cliente na Agenda.',
          'Toque no botão verde do WhatsApp ao lado do nome: a mensagem já vai escrita.',
          'Para mudar o que vai na mensagem, abra Configurações › Mensagem de confirmação.',
        ],
        href: '/dashboard/agenda', hrefLabel: 'Abrir Agenda',
        keywords: ['whatsapp', 'confirmação', 'lembrete', 'mensagem'],
      },
    ],
  },
  {
    id: 'clientes',
    title: 'Clientes',
    ask: 'Clientes e cadastro',
    paths: ['/dashboard/clientes'],
    guides: [
      {
        id: 'importar', roles: DESK,
        ask: 'Quero trazer meus clientes de outro sistema ou da agenda do celular',
        title: 'Importar clientes',
        steps: [
          'Em Clientes, toque em Importar clientes.',
          'Escolha o arquivo (planilha CSV ou contatos vCard) ou cole os contatos.',
          'Confira a prévia: novos, repetidos e telefones com erro.',
          'Toque em Importar. Quem já existe não é criado de novo.',
        ],
        href: '/dashboard/clientes', hrefLabel: 'Abrir Clientes',
        keywords: ['importar', 'planilha', 'excel', 'csv', 'contatos', 'outro sistema'],
      },
      {
        id: 'novo-cliente', roles: DESK,
        ask: 'Quero cadastrar um cliente novo',
        title: 'Cadastrar cliente',
        steps: [
          'Em Clientes, toque em Novo.',
          'Preencha nome e celular. CPF, e-mail e aniversário são opcionais.',
          'Salve. Dá também para cadastrar na hora de marcar o horário.',
        ],
        href: '/dashboard/clientes', hrefLabel: 'Abrir Clientes',
        keywords: ['cadastrar', 'novo cliente', 'adicionar cliente'],
      },
      {
        id: 'sumidos', roles: DESK,
        ask: 'Quero chamar de volta os clientes que sumiram',
        title: 'Chamar quem sumiu',
        steps: [
          'Em Clientes, abra a aba Sumidos.',
          'Toque no nome de um profissional para ver só os clientes dele.',
          'Toque no botão do WhatsApp do cliente: a mensagem já vem pronta.',
        ],
        href: '/dashboard/clientes', hrefLabel: 'Abrir Clientes',
        keywords: ['sumido', 'voltar', 'recuperar', 'inativo'],
      },
      {
        id: 'apagar-cliente', roles: OWNER_MANAGER,
        ask: 'Não consigo apagar um cliente ou tem cliente repetido',
        title: 'Apagar cliente ou repetido',
        steps: [
          'Abra a ficha do cliente e vá em Dados.',
          'Toque em Apagar cliente e confirme.',
          'Se ele tem pacote, assinatura ou clube, o Eligi não deixa apagar, para não perder o histórico de pagamento.',
          'Repetido: o celular não se repete, então confira se um dos cadastros está com outro número.',
        ],
        href: '/dashboard/clientes', hrefLabel: 'Abrir Clientes',
        keywords: ['apagar', 'excluir', 'repetido', 'duplicado'],
      },
      {
        id: 'exportar', roles: DESK,
        ask: 'Quero tirar a lista dos meus clientes',
        title: 'Exportar clientes',
        steps: [
          'Em Clientes, toque em Selecionar para exportar (ou segure um cliente).',
          'Marque os clientes que quer.',
          'Toque em Exportar CSV: o arquivo abre no Excel ou no Google Planilhas.',
        ],
        href: '/dashboard/clientes', hrefLabel: 'Abrir Clientes',
        keywords: ['exportar', 'lista', 'csv', 'baixar clientes'],
      },
    ],
  },
  {
    id: 'caixa',
    title: 'Caixa e vendas',
    ask: 'Caixa, cobrança e vendas',
    paths: ['/dashboard/caixa', '/dashboard/financeiro/vendas'],
    guides: [
      {
        id: 'cobrar-atendimento', roles: CASHIER,
        ask: 'Quero cobrar um atendimento que está na agenda',
        title: 'Cobrar um atendimento',
        steps: [
          'Na Agenda, toque no cartão do cliente e em Cobrar.',
          'Confira os serviços e acrescente produtos, se tiver.',
          'Escolha a forma de pagamento e confirme a venda.',
          'O cartão ganha o selo de pago e a comissão é calculada sozinha.',
        ],
        href: '/dashboard/agenda', hrefLabel: 'Abrir Agenda',
        keywords: ['cobrar', 'pagar', 'fechar conta', 'receber'],
      },
      {
        id: 'venda-avulsa', roles: CASHIER,
        ask: 'Quero vender um produto ou serviço sem agendamento',
        title: 'Venda sem agendamento',
        steps: [
          'Abra o Caixa e comece uma Nova venda.',
          'Escolha nas abas Produtos, Serviços ou Pacotes.',
          'Confira o profissional de cada item e confirme o pagamento.',
        ],
        href: '/dashboard/caixa', hrefLabel: 'Abrir Caixa',
        keywords: ['vender', 'produto', 'venda avulsa', 'balcão'],
      },
      {
        id: 'duas-formas', roles: CASHIER,
        ask: 'O cliente quer pagar com duas formas (ex.: Pix e cartão)',
        title: 'Pagar com duas formas',
        steps: [
          'Na hora de confirmar a venda, coloque o valor da primeira forma.',
          'Adicione a segunda forma com o valor que falta.',
          'Quando a soma bater com o total, confirme.',
        ],
        href: '/dashboard/caixa', hrefLabel: 'Abrir Caixa',
        keywords: ['dividir', 'duas formas', 'pix e cartão', 'pagamento misto'],
      },
      {
        id: 'desconto', roles: CASHIER,
        ask: 'Quero dar um desconto',
        title: 'Dar desconto',
        steps: [
          'Na venda aberta, toque em Desconto.',
          'Digite o valor ou a porcentagem e diga quem paga esse desconto.',
          'Toque em Aplicar desconto. Para desfazer, use Tirar desconto.',
        ],
        href: '/dashboard/caixa', hrefLabel: 'Abrir Caixa',
        keywords: ['desconto', 'abatimento', 'promoção'],
      },
      {
        id: 'usar-pacote', roles: CASHIER,
        ask: 'Quero usar o pacote, a assinatura ou o clube do cliente',
        title: 'Usar pacote, assinatura ou clube',
        steps: [
          'Cobre o atendimento normalmente.',
          'No serviço, escolha usar o pacote, a assinatura ou o clube do cliente.',
          'O serviço fica R$ 0 para o cliente e o saldo do pacote diminui.',
          'A comissão do profissional continua sobre o preço cheio.',
        ],
        href: '/dashboard/caixa', hrefLabel: 'Abrir Caixa',
        keywords: ['pacote', 'clube', 'assinatura', 'usar saldo'],
      },
      {
        id: 'errei-venda', roles: DESK,
        ask: 'Errei uma venda que já foi fechada',
        title: 'Corrigir venda fechada',
        steps: [
          'No Caixa, abra a aba Confirmadas e toque na venda.',
          'Use Emitir nota de crédito para devolver o valor todo ou parte dele.',
          'A venda fica registrada, com a devolução ao lado. Depois, lance a venda certa.',
        ],
        href: '/dashboard/caixa', hrefLabel: 'Abrir Caixa',
        keywords: ['erro', 'estornar', 'devolver', 'cancelar venda', 'nota de crédito'],
      },
    ],
  },
  {
    id: 'servicos',
    title: 'Serviços',
    ask: 'Serviços, preços e categorias',
    paths: ['/dashboard/servicos'],
    guides: [
      {
        id: 'novo-servico', roles: DESK,
        ask: 'Quero cadastrar ou mudar um serviço',
        title: 'Cadastrar serviço',
        steps: [
          'Em Serviços, toque em Novo serviço (ou toque num serviço para editar).',
          'Coloque nome, preço, duração e cor.',
          'Escolha a categoria e quem faz esse serviço.',
          'Salve. A duração define o tamanho do horário na agenda.',
        ],
        href: '/dashboard/servicos', hrefLabel: 'Abrir Serviços',
        keywords: ['serviço', 'preço', 'duração', 'cadastrar serviço'],
      },
      {
        id: 'preco-a-partir', roles: DESK,
        ask: 'O preço do serviço varia (cobro "a partir de")',
        title: 'Preço "a partir de"',
        steps: [
          'Abra o serviço em Serviços.',
          'Escolha A partir de e coloque o valor mínimo.',
          'No caixa, o valor final é digitado na hora de cobrar.',
        ],
        href: '/dashboard/servicos', hrefLabel: 'Abrir Serviços',
        keywords: ['a partir de', 'preço variável', 'valor mínimo'],
      },
      {
        id: 'esconder-servico', roles: DESK,
        ask: 'Quero tirar um serviço do link sem apagar',
        title: 'Esconder serviço do link',
        steps: [
          'Abra o serviço em Serviços.',
          'No fim, desligue a opção de aparecer no link online.',
          'Ele continua na agenda e no caixa, só o cliente não vê pelo link.',
        ],
        href: '/dashboard/servicos', hrefLabel: 'Abrir Serviços',
        keywords: ['esconder', 'ocultar', 'tirar do link'],
      },
      {
        id: 'categorias', roles: DESK,
        ask: 'Quero organizar os serviços em categorias',
        title: 'Categorias de serviço',
        steps: [
          'Em Serviços, abra as categorias.',
          'Crie com Nova categoria, escolha a cor e mude a ordem com as setas.',
          'A ordem das categorias é a mesma no link do cliente.',
        ],
        href: '/dashboard/servicos', hrefLabel: 'Abrir Serviços',
        keywords: ['categoria', 'organizar', 'ordem'],
      },
    ],
  },
  {
    id: 'equipe',
    title: 'Equipe e comissões',
    ask: 'Equipe, acessos e comissões',
    paths: ['/dashboard/equipe', '/dashboard/financeiro/comissoes'],
    guides: [
      {
        id: 'add-profissional', roles: OWNER_MANAGER,
        ask: 'Quero adicionar um profissional na equipe',
        title: 'Adicionar profissional',
        steps: [
          'Em Equipe, toque em Adicionar profissional.',
          'Coloque nome, foto e os serviços que ele faz.',
          'Ajuste o horário dele e a comissão nas abas da ficha.',
          'No plano Estabelecimento, a partir do 4º profissional ativo a mensalidade aumenta; o Eligi avisa antes.',
        ],
        href: '/dashboard/equipe', hrefLabel: 'Abrir Equipe',
        keywords: ['profissional', 'funcionário', 'barbeiro', 'adicionar'],
      },
      {
        id: 'dar-acesso', roles: OWNER_MANAGER,
        ask: 'Quero que um funcionário entre no sistema com o login dele',
        title: 'Dar acesso a um funcionário',
        steps: [
          'Em Equipe, abra a aba Acessos.',
          'Toque em Convidar, coloque o e-mail e escolha o cargo.',
          'Mande o link do convite para a pessoa. Ela cria a senha e já entra.',
          'Cada cargo vê só o que precisa (o profissional vê a agenda e as comissões dele).',
        ],
        href: '/dashboard/equipe', hrefLabel: 'Abrir Equipe',
        keywords: ['acesso', 'login', 'convite', 'senha do funcionário', 'cargo'],
      },
      {
        id: 'horario-profissional', roles: OWNER_MANAGER,
        ask: 'Quero mudar o horário de trabalho de um profissional',
        title: 'Horário do profissional',
        steps: [
          'Em Equipe, toque no profissional e abra Horários.',
          'Ligue os dias em que ele trabalha e ajuste início e fim.',
          'Use o atalho para copiar um dia para os outros.',
          'O link só oferece horários dentro desse horário.',
        ],
        href: '/dashboard/equipe', hrefLabel: 'Abrir Equipe',
        keywords: ['horário do profissional', 'escala', 'folga do profissional'],
      },
      {
        id: 'comissao-config', roles: OWNER_MANAGER,
        ask: 'Quero definir quanto cada profissional ganha de comissão',
        title: 'Configurar comissão',
        steps: [
          'Em Equipe, toque no profissional e abra Comissões.',
          'Defina a porcentagem ou o valor por serviço e por produto.',
          'A comissão é calculada sozinha em cada venda.',
        ],
        href: '/dashboard/equipe', hrefLabel: 'Abrir Equipe',
        keywords: ['comissão', 'porcentagem', 'quanto ganha'],
      },
      {
        id: 'pagar-comissoes', roles: OWNER,
        ask: 'Quero fechar e pagar as comissões da equipe',
        title: 'Pagar comissões',
        steps: [
          'Abra Financeiro › Comissões.',
          'Na engrenagem, escolha se paga por semana, quinzena ou mês.',
          'Quando o período fechar, toque em Gerar os pagamentos.',
          'Depois de pagar, toque em Marcar como pago.',
        ],
        href: '/dashboard/financeiro/comissoes', hrefLabel: 'Abrir Comissões',
        keywords: ['pagar comissão', 'fechamento', 'semana', 'quinzena'],
      },
      {
        id: 'minhas-comissoes', roles: ['STAFF', 'BASIC_STAFF', 'RECEPTIONIST'],
        ask: 'Quero ver quanto eu vou receber de comissão',
        title: 'Ver minhas comissões',
        steps: [
          'Abra Comissões no menu.',
          'No topo aparece o valor do período e o dia do pagamento.',
          'Toque em Extrato, Serviços ou Comparar para ver os detalhes.',
        ],
        href: '/dashboard/financeiro/comissoes', hrefLabel: 'Abrir Comissões',
        keywords: ['minha comissão', 'quanto vou receber', 'extrato'],
      },
    ],
  },
  {
    id: 'link',
    title: 'Link e agendamento online',
    ask: 'Link de agendamento e clientes marcando sozinhos',
    paths: ['/dashboard/configuracoes/agendamento', '/dashboard/configuracoes/mensagens'],
    guides: [
      {
        id: 'sem-horario', roles: DESK,
        ask: 'O cliente diz que não aparece horário livre no link',
        title: 'Link sem horário livre',
        steps: [
          'Confira o horário de funcionamento em Configurações › Horário de funcionamento.',
          'Confira o horário do profissional em Equipe › Horários.',
          'Confira se o profissional faz aquele serviço e está ligado para atender online.',
          'Em Configurações › Regras do agendamento, veja a antecedência mínima e até quantos dias a agenda fica aberta.',
        ],
        href: '/dashboard/equipe', hrefLabel: 'Abrir Equipe',
        keywords: ['sem horário', 'não aparece horário', 'indisponível', 'link vazio'],
      },
      {
        id: 'regras', roles: OWNER,
        ask: 'Quero mudar até quando o cliente pode marcar ou cancelar',
        title: 'Regras do agendamento',
        steps: [
          'Abra Configurações › Regras do agendamento.',
          'Escolha a antecedência mínima para marcar e até quantos dias a agenda fica aberta.',
          'Defina até quando o cliente pode remarcar ou cancelar sozinho.',
          'Muda na hora, sem botão de salvar.',
        ],
        href: '/dashboard/configuracoes/agendamento', hrefLabel: 'Abrir Regras do agendamento',
        keywords: ['antecedência', 'cancelar', 'prazo', 'dias', 'regras'],
      },
      {
        id: 'perto-de-voce', roles: OWNER,
        ask: 'Quero aparecer para clientes novos perto de mim',
        title: 'Aparecer no Perto de você',
        steps: [
          'Abra Configurações › Perfil e endereço.',
          'Em Perto de você, deixe ligado.',
          'Para aparecer, é preciso ter endereço com pino no mapa, um serviço e um profissional no link e a assinatura em dia. A tela mostra o que falta.',
        ],
        href: '/dashboard/configuracoes/empresa', hrefLabel: 'Abrir Perfil e endereço',
        keywords: ['perto de você', 'descoberta', 'clientes novos', 'aparecer'],
      },
      {
        id: 'mensagem-confirmacao', roles: OWNER_MANAGER,
        ask: 'Quero mudar a mensagem de confirmação que vai pelo WhatsApp',
        title: 'Mensagem de confirmação',
        steps: [
          'Abra Configurações › Mensagem de confirmação.',
          'Ligue ou desligue os blocos: endereço, Pix, política, observação e assinatura.',
          'A prévia mostra exatamente o que o cliente recebe. Toque em Salvar.',
        ],
        href: '/dashboard/configuracoes/mensagens', hrefLabel: 'Abrir Mensagem de confirmação',
        keywords: ['mensagem', 'whatsapp', 'pix', 'confirmação'],
      },
    ],
  },
  {
    id: 'clube',
    title: 'EligiClub',
    ask: 'EligiClub (assinatura do meu clube)',
    paths: ['/dashboard/eligiclub', '/dashboard/configuracoes/eligiclub'],
    guides: [
      {
        id: 'ativar-clube', roles: OWNER,
        ask: 'Quero ativar a cobrança automática do clube',
        title: 'Ativar a cobrança do clube',
        steps: [
          'Abra Configurações › Cobrança do EligiClub.',
          'Preencha os dados que faltarem e toque em ativar.',
          'Envie os documentos que o Asaas pedir. A análise leva até 2 dias úteis.',
          'Aprovada, o clube cobra os clientes no cartão todo mês.',
        ],
        href: '/dashboard/configuracoes/eligiclub', hrefLabel: 'Abrir Cobrança do EligiClub',
        keywords: ['ativar clube', 'asaas', 'conta de pagamento', 'documentos'],
      },
      {
        id: 'plano-clube', roles: OWNER_MANAGER,
        ask: 'Quero criar um plano do clube',
        title: 'Criar plano do clube',
        steps: [
          'Abra EligiClub › Planos e toque em Novo plano.',
          'Dê o nome, o preço por mês e escolha os serviços incluídos.',
          'Se quiser, limite quantas vezes por mês cada serviço pode ser usado.',
          'Defina quanto da mensalidade vai para a equipe.',
        ],
        href: '/dashboard/eligiclub', hrefLabel: 'Abrir EligiClub',
        keywords: ['plano', 'clube', 'mensalidade', 'assinatura do cliente'],
      },
      {
        id: 'assinar-membro', roles: CLUB,
        ask: 'Quero colocar um cliente no clube',
        title: 'Colocar cliente no clube',
        steps: [
          'Abra EligiClub › Membros e toque em Novo assinante.',
          'Escolha o cliente e o plano.',
          'Cartão: o Eligi gera um link para o cliente cadastrar o cartão. Manual: você cobra no balcão todo mês.',
          'Mande o link pelo WhatsApp direto da tela.',
        ],
        href: '/dashboard/eligiclub', hrefLabel: 'Abrir EligiClub',
        keywords: ['membro', 'assinante', 'clube', 'novo assinante'],
      },
      {
        id: 'pagou-balcao', roles: CLUB,
        ask: 'O membro pagou a mensalidade no balcão',
        title: 'Mensalidade paga no balcão',
        steps: [
          'Abra EligiClub › Membros e toque no cliente.',
          'Plano manual: use Registrar pagamento.',
          'Plano no cartão atrasado: use Recebi no balcão (a cobrança do cartão deixa de valer).',
          'O vencimento continua no mesmo dia do mês.',
        ],
        href: '/dashboard/eligiclub', hrefLabel: 'Abrir EligiClub',
        keywords: ['pagou', 'balcão', 'dinheiro', 'mensalidade', 'atrasado'],
      },
      {
        id: 'saque-clube', roles: OWNER,
        ask: 'Quero ver o saldo ou sacar o dinheiro do clube',
        title: 'Saldo e saque do clube',
        steps: [
          'Abra EligiClub › Financeiro.',
          'Lá aparecem o saldo, o que ainda vai cair e as datas.',
          'Para sacar, use a chave Pix do CNPJ do seu negócio e confirme com sua senha.',
        ],
        href: '/dashboard/eligiclub?tab=financeiro', hrefLabel: 'Abrir Financeiro do clube',
        keywords: ['saque', 'sacar', 'saldo', 'dinheiro do clube', 'pix'],
      },
    ],
  },
  {
    id: 'pacotes',
    title: 'Pacotes',
    ask: 'Pacotes de serviços',
    paths: ['/dashboard/pacotes'],
    guides: [
      {
        id: 'criar-pacote', roles: DESK,
        ask: 'Quero criar um pacote (ex.: 10 cortes)',
        title: 'Criar pacote',
        steps: [
          'Abra Pacotes e toque em Novo pacote.',
          'Escolha os serviços, quantas vezes cada um e o preço do pacote.',
          'Defina a validade e salve.',
        ],
        href: '/dashboard/pacotes', hrefLabel: 'Abrir Pacotes',
        keywords: ['pacote', '10 cortes', 'combo', 'crédito'],
      },
      {
        id: 'vender-pacote', roles: CASHIER,
        ask: 'Quero vender um pacote para um cliente',
        title: 'Vender pacote',
        steps: [
          'Abra o Caixa e comece uma venda para o cliente.',
          'Na aba Pacotes, escolha o pacote e confirme o pagamento.',
          'O saldo fica na ficha do cliente e é usado nas próximas cobranças.',
        ],
        href: '/dashboard/caixa', hrefLabel: 'Abrir Caixa',
        keywords: ['vender pacote', 'saldo', 'pacote do cliente'],
      },
    ],
  },
  {
    id: 'estoque',
    title: 'Estoque e produtos',
    ask: 'Estoque e produtos',
    paths: ['/dashboard/estoque'],
    guides: [
      {
        id: 'novo-produto', roles: DESK,
        ask: 'Quero cadastrar um produto',
        title: 'Cadastrar produto',
        steps: [
          'Abra Estoque e toque em Novo produto.',
          'Coloque nome, preço de venda, custo e foto.',
          'Ligue o controle de estoque e diga quantos tem.',
          'Quer vender no link? Ligue Vender no link online.',
        ],
        href: '/dashboard/estoque', hrefLabel: 'Abrir Estoque',
        keywords: ['produto', 'cadastrar produto', 'pomada', 'shampoo'],
      },
      {
        id: 'entrada-estoque', roles: DESK,
        ask: 'Chegou mercadoria e quero dar entrada',
        title: 'Dar entrada no estoque',
        steps: [
          'Em Estoque, toque no produto.',
          'Use Nova movimentação e escolha entrada.',
          'Coloque a quantidade e o custo, se quiser lançar como despesa.',
        ],
        href: '/dashboard/estoque', hrefLabel: 'Abrir Estoque',
        keywords: ['entrada', 'comprei', 'chegou', 'repor'],
      },
      {
        id: 'conferir-estoque', roles: DESK,
        ask: 'O estoque do sistema não bate com a prateleira',
        title: 'Conferir estoque',
        steps: [
          'Em Estoque, toque em Conferir estoque.',
          'Digite quanto tem de verdade de cada produto.',
          'Escreva o motivo e confirme: o Eligi ajusta tudo de uma vez.',
        ],
        href: '/dashboard/estoque', hrefLabel: 'Abrir Estoque',
        keywords: ['contagem', 'não bate', 'conferir', 'ajustar estoque'],
      },
    ],
  },
  {
    id: 'financeiro',
    title: 'Financeiro e relatórios',
    ask: 'Despesas, financeiro e relatórios',
    paths: ['/dashboard/financeiro', '/dashboard/relatorios'],
    guides: [
      {
        id: 'despesa', roles: OWNER,
        ask: 'Quero lançar uma despesa (aluguel, luz, compras)',
        title: 'Lançar despesa',
        steps: [
          'Abra Financeiro › Despesas e toque em Nova despesa.',
          'Coloque o valor, a data e a categoria (ou crie a sua).',
          'Se ela se repete todo mês, ligue Despesa fixa.',
        ],
        href: '/dashboard/financeiro/despesas', hrefLabel: 'Abrir Despesas',
        keywords: ['despesa', 'gasto', 'aluguel', 'conta', 'fixa'],
      },
      {
        id: 'relatorios', roles: OWNER,
        ask: 'Quero ver quanto entrou e como o negócio está indo',
        title: 'Ver relatórios',
        steps: [
          'Abra Relatórios.',
          'Escolha o período no topo.',
          'Use as abas: Receita, Fluxo de caixa, Clientes, Equipe, Link online e Clube.',
        ],
        href: '/dashboard/relatorios', hrefLabel: 'Abrir Relatórios',
        keywords: ['relatório', 'faturamento', 'quanto entrou', 'lucro'],
      },
    ],
  },
  {
    id: 'notas',
    title: 'Notas fiscais',
    ask: 'Notas fiscais (NFS-e)',
    paths: ['/dashboard/notas-fiscais'],
    guides: [
      {
        id: 'ativar-notas', roles: OWNER,
        ask: 'Quero começar a emitir nota fiscal',
        title: 'Emitir notas fiscais',
        steps: [
          'Abra Notas Fiscais e ative o módulo.',
          'Preencha os dados fiscais (CNPJ, inscrição municipal, código do serviço e alíquota) com o seu contador.',
          'Envie o certificado digital A1 (.pfx) e a senha dele.',
          'Ligue a emissão: cada venda com serviço vira nota sozinha.',
        ],
        href: '/dashboard/notas-fiscais', hrefLabel: 'Abrir Notas Fiscais',
        keywords: ['nota fiscal', 'nfs-e', 'nfse', 'certificado', 'a1'],
      },
      {
        id: 'nota-rejeitada', roles: OWNER,
        ask: 'Uma nota foi rejeitada',
        title: 'Nota rejeitada',
        steps: [
          'Abra Notas Fiscais e toque na nota rejeitada.',
          'Leia o motivo que a prefeitura devolveu.',
          'Corrija o dado (perfil fiscal ou cliente) e emita de novo.',
          'Não entendeu o motivo? Fale com o suporte com o código do erro.',
        ],
        href: '/dashboard/notas-fiscais', hrefLabel: 'Abrir Notas Fiscais',
        keywords: ['rejeitada', 'erro na nota', 'prefeitura'],
      },
    ],
  },
  {
    id: 'conta',
    title: 'Minha conta e plano',
    ask: 'Minha conta, senha e plano do Eligi',
    paths: ['/dashboard/configuracoes/assinatura', '/dashboard/conta'],
    guides: [
      {
        id: 'pagar-plano', roles: OWNER, webOnly: true,
        ask: 'Quero pagar a mensalidade ou ver a fatura do Eligi',
        title: 'Mensalidade do Eligi',
        steps: [
          'Abra Configurações › Assinatura.',
          'No topo aparece a situação e o botão para pagar a fatura em aberto.',
          'Pix e boleto são confirmados pelo banco; pode levar alguns minutos.',
        ],
        href: '/dashboard/configuracoes/assinatura', hrefLabel: 'Abrir Assinatura',
        keywords: ['mensalidade', 'fatura', 'boleto', 'pagar eligi', 'plano'],
      },
      {
        id: 'trocar-plano', roles: OWNER, webOnly: true,
        ask: 'Quero trocar de plano ou cancelar',
        title: 'Trocar ou cancelar o plano',
        steps: [
          'Abra Configurações › Assinatura.',
          'Escolha o outro plano: o valor novo aparece antes de confirmar.',
          'Para cancelar, use Cancelar assinatura: o acesso continua até o fim do período pago.',
        ],
        href: '/dashboard/configuracoes/assinatura', hrefLabel: 'Abrir Assinatura',
        keywords: ['trocar plano', 'cancelar', 'autônomo', 'estabelecimento'],
      },
      {
        id: 'esqueci-senha',
        ask: 'Esqueci a senha ou quero trocar a senha',
        title: 'Senha',
        steps: [
          'Saia da conta e, na tela de entrar, toque em Esqueci minha senha.',
          'Digite o seu e-mail e abra o link que chegar.',
          'Crie a senha nova. Se entra com o Google, use o botão do Google.',
        ],
        keywords: ['senha', 'esqueci', 'trocar senha', 'login'],
      },
      {
        id: 'avisos',
        ask: 'Quero mudar os avisos que chegam no sino e no celular',
        title: 'Avisos',
        steps: [
          'Abra Configurações › Avisos.',
          'Ligue ou desligue cada tipo de aviso.',
          'Cobrança e notas fiscais ficam sempre ligados.',
        ],
        href: '/dashboard/configuracoes/notificacoes', hrefLabel: 'Abrir Avisos',
        roles: OWNER_MANAGER,
        keywords: ['aviso', 'notificação', 'sino', 'celular'],
      },
    ],
  },
  {
    id: 'problema',
    title: 'Algo deu errado',
    ask: 'Algo não está funcionando',
    paths: [],
    guides: [
      {
        id: 'lento',
        ask: 'O sistema está lento, travado ou não carrega',
        title: 'Lento ou não carrega',
        steps: [
          'Confira a internet: abra outro site para testar.',
          'Feche e abra o Eligi de novo (no celular, feche o app ou a aba).',
          'Se continuar, fale com o suporte e diga em qual tela travou.',
        ],
        keywords: ['lento', 'travou', 'não carrega', 'tela branca', 'fora do ar'],
      },
      {
        id: 'mensagem-erro',
        ask: 'Apareceu uma mensagem de erro',
        title: 'Mensagem de erro',
        steps: [
          'Tire um print da mensagem.',
          'Tente de novo uma vez: muitas vezes era a internet.',
          'Se repetir, fale com o suporte e mande o print. O código do erro ajuda a achar rápido.',
        ],
        keywords: ['erro', 'mensagem de erro', 'falhou', 'não salvou'],
      },
      {
        id: 'sem-acesso',
        ask: 'Não consigo abrir uma tela ("Acesso negado")',
        title: 'Acesso negado',
        steps: [
          'Cada cargo vê só algumas telas: o dono decide o seu cargo em Equipe › Acessos.',
          'Se você precisa dessa tela, peça ao dono para mudar o seu cargo.',
        ],
        keywords: ['acesso negado', 'permissão', 'não abre', 'cargo'],
      },
    ],
  },
]
