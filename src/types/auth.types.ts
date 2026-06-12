export type Role =
  | 'BUSINESS_OWNER'
  | 'MANAGER'
  | 'RECEPTIONIST'
  | 'STAFF'
  | 'BASIC_STAFF'
  | 'PROFESSIONAL'
  | 'AFFILIATE'

export interface AuthUser {
  id:            string
  name:          string
  email:         string
  role:          Role
  emailVerified: boolean
  businessId?:   string | null
  businessName?: string | null
  businessSlug?:  string | null
  logoUrl?:        string | null
  avatarUrl?:      string | null
  professionalId?: string | null
}
