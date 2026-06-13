import { z } from 'zod';

// Valores canônicos — devem bater com o SEGMENTS do backend (onboarding.schemas.ts)
export const SEGMENTS = [
  'BARBEARIA',
  'SALAO_BELEZA',
  'CLINICA_ESTETICA',
  'SOBRANCELHAS_CILIOS',
  'ESMALTERIA',
  'CLINICA_DEPILACAO',
  'SPA_CAPILAR',
  'STUDIO',
] as const;

export type Segment = (typeof SEGMENTS)[number];

export const identitySchema = z.object({
  journeyType: z.enum(['BUSINESS', 'SOLO']),
  displayName: z.string().trim().min(2),
  segment: z.enum(SEGMENTS),
});

export type IdentityForm = z.infer<typeof identitySchema>;
