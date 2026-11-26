// src/features/client-notices/types.ts
// @eligi:cnot-types — contratos do GET /client-promotions, /reach e /reach/out (nov/2026).

export type Kind = 'PROMO' | 'AVISO'
export type Audience = 'ALL' | 'LAPSED' | 'BIRTHDAY_MONTH' | 'SERVICE' | 'PROFESSIONAL'

export type Template = {
  key: string
  label: string
  audience: Audience
  audienceName: string
  title: string
  body: string
  count: number | null
}

export type Promo = {
  id: string
  kind: Kind
  title: string
  body: string
  audience: Audience
  audienceName: string
  status: 'SCHEDULED' | 'SENDING' | 'SENT' | 'CANCELED'
  sendAt: string
  sentAt: string | null
  recipients: number | null
  pinUntil: string | null
}

export type Week = { used: number; max: number; resetsAt: string }
export type Opt = { id: string; name: string }

export type Data = {
  businessName: string
  week: Week
  weeks?: Record<Kind, Week>
  templates: Template[]
  avisoTemplates?: Template[]
  audiences: { key: Audience; label: string; needsRef: boolean }[]
  services: Opt[]
  professionals: Opt[]
  pinned?: { id: string; until: string } | null
  items: Promo[]
}

export type Reach = {
  kind: Kind
  total: number
  recebem: number
  noAppSemReceber: number
  desligaram: number
  semCelular: number
  desligouTipo: number
  foraDoApp: number
  inviteUrl: string
  businessName: string
}

export type OutPerson = { id: string; name: string; phone: string | null; lastVisitAt: string | null; visits: number }
export type OutPage = { total: number; items: OutPerson[]; nextCursor: number | null; inviteUrl: string; businessName: string }
