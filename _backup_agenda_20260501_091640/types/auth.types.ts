export type Role = 'BUSINESS_OWNER' | 'AFFILIATE'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: Role
  businessId?: string | null
  businessName?: string | null
}
