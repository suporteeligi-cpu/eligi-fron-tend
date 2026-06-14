// src/features/reports/types.ts
// Tipos do módulo Relatórios. O OverviewData espelha exatamente o que o
// endpoint GET /reports/overview vai devolver — por isso trocar o mock pelo
// fetch real depois é só mexer no hook, sem tocar nos componentes.

export type ReportTab =
  | 'painel'
  | 'agendamentos'
  | 'clientes'
  | 'receita'
  | 'fluxo-de-caixa'
  | 'estoque'
  | 'equipe'
  | 'marketing'

export interface TabDef {
  id: ReportTab
  label: string
}

export interface KpiDelta {
  /** Variação percentual vs período anterior (ex: -59 = caiu 59%) */
  pct: number
}

export interface MonthPoint {
  /** rótulo curto do mês: 'Jan', 'Fev'... */
  mes: string
  /** valor real (null nos meses futuros) */
  real: number | null
  /** valor projetado (null nos meses já realizados, exceto o pivô) */
  projecao: number | null
}

export interface ReceitaTipo {
  tipo: string
  pct: number
  valor: number
  /** cor do marcador (hex) */
  cor: string
}

export interface OverviewData {
  /** 'YYYY-MM' do período consultado */
  periodo: string

  kpis: {
    agendamentos: number
    agendamentosDelta: KpiDelta
    receita: number
    receitaDelta: KpiDelta
    clientes: number
    clientesNovos: number
    /** % do faturamento que veio do link público (canal online) */
    onlinePct: number
  }

  /** série anual de receita (real + projeção) pro gráfico */
  serieReceita: MonthPoint[]

  /** quebra de receita por tipo de venda */
  receitaPorTipo: ReceitaTipo[]
}


export interface MarketingData {
  periodo: string
  kpis: {
    agendamentosOnline: number
    agendamentosOnlineDelta: { pct: number }
    receitaOnline: number
    receitaOnlinePct: number
    novosClientesLink: number
    escolheuProfissionalPct: number
  }
  serieOnline: { mes: string; total: number | null }[]
  origem: { online: number; manual: number }
  topClientes: { nome: string; reservas: number; receita: number }[]
}


export interface AgendamentosData {
  periodo: string
  kpis: { total: number; totalDelta: { pct: number }; finalizados: number; naoCompareceram: number; cancelados: number }
  status: { label: string; status: string; quantidade: number; pct: number; valor: number; cor: string }[]
  topServicos: { nome: string; reservas: number; valor: number }[]
}

export interface ClientesData {
  periodo: string
  kpis: { ativos: number; novos: number; recorrentes: number; ticketMedio: number }
  serie: { mes: string; novos: number | null; recorrentes: number | null }[]
  receitaPorTipo: { novos: number; recorrentes: number }
  topClientes: { nome: string; reservas: number; receita: number }[]
}
