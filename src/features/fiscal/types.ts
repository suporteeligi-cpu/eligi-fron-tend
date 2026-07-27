// src/features/fiscal/types.ts
export type FiscalStatus = 'INCOMPLETE' | 'READY_TO_TEST' | 'ACTIVE' | 'BLOCKED'
export type FiscalRegime = 'SIMPLES_NACIONAL' | 'MEI'

export interface FiscalCertificate {
  subject: string | null
  expiresAt: string | null
}

export interface FiscalProfile {
  cnpj: string
  inscricaoMunicipal: string
  regime: FiscalRegime
  codigoTributacaoNacional: string
  aliquotaIss: number
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
