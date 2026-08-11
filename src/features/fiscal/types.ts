// src/features/fiscal/types.ts
export type FiscalStatus = 'INCOMPLETE' | 'READY_TO_TEST' | 'ACTIVE' | 'BLOCKED'
export type FiscalRegime = 'SIMPLES_NACIONAL' | 'MEI'
export type NfseStatus = 'PENDING' | 'PROCESSING' | 'AUTHORIZED' | 'REJECTED' | 'CANCELED'

export interface FiscalCertificate {
  subject: string | null
  expiresAt: string | null
  /** calculados no back (conta de data no render viola a pureza do Compiler) */
  daysLeft?: number | null
  expiresSoon?: boolean
}

export interface FiscalProfile {
  cnpj: string
  inscricaoMunicipal: string
  regime: FiscalRegime
  codigoTributacaoNacional: string
  aliquotaIss: number
  aliquotaSimplesNacional: number
  codigoMunicipioIbge: string
  status: FiscalStatus
  certificate: FiscalCertificate | null
}

export interface FiscalOverview {
  profile: FiscalProfile | null
  prefill: { cnpj: string | null }
}

export interface BillingSubscriptionView {
  hasSubscription: boolean
  nfseAddon: boolean
}

export interface MonthPoint {
  month: number
  total: number
  count: number
}

export interface ServiceSlice {
  name: string
  count: number
  total: number
}

export interface SimplesGauge {
  rbt12: number
  teto: number
  percentual: number
  faixa: number
  aliquotaFaixa: number
  proximaFaixa: number | null
  aliquotaProxima: number | null
  faltaParaProxima: number | null
  /** o valor considera só o que passou pelo Eligi — a UI PRECISA avisar */
  parcial: boolean
}

export interface FiscalSummary {
  year: number
  business: {
    displayName: string
    cnpj: string
    inscricaoMunicipal: string
    regime: string
    codigoTributacaoNacional: string
    aliquotaIss: number
    aliquotaSimplesNacional: number
    codigoMunicipioIbge: string
    municipio: string | null
    uf: string | null
  }
  monthly: MonthPoint[]
  yearTotal: number
  yearCount: number
  current: {
    month: number
    total: number
    count: number
    deltaPct: number | null
    ticketMedio: number
    maiorNota: number
    issEstimado: number
    tributosAproximados: number
  }
  byService: ServiceSlice[]
  simples: SimplesGauge
  status: { authorized: number; rejected: number; pending: number; canceled: number }
}

export interface MotivoSubstituicao {
  codigo: string
  label: string
}

export interface NfseEmissionState {
  /** master do dono: ligado = toda venda com serviço emite */
  ativa: boolean
  ativadaEm: string | null
  /** liberado pelo Eligi (EligiBrain) para emitir em produção */
  producaoLiberada: boolean
  /** true = as notas emitidas TÊM validade fiscal */
  ambienteProducao: boolean
}

export interface NfseEmission {
  id: string
  saleId: string
  status: NfseStatus
  dpsSerie: string | null
  dpsNumber: number | null
  nfseNumber: string | null
  chaveAcesso: string | null
  valorServicos: number
  tomadorCpf: string | null
  tomadorNome: string | null
  discriminacao: string
  attempts: number
  errorMessage: string | null
  /** esta nota substituiu outra */
  substitutaDeId?: string | null
  /** esta nota foi substituída — deixou de valer */
  substituidaPorId?: string | null
  /** janela de 72h ainda aberta (derivado no back) */
  podeSubstituir?: boolean
  createdAt: string
  updatedAt: string
}
