import { z } from 'zod';

export const businessTypeSchema = z.object({
  journeyType: z.enum([
    'BUSINESS',
    'SOLO',
    'PERSONAL',
    'AFFILIATE'
  ])
});

export type BusinessTypeFormData = z.infer<
  typeof businessTypeSchema
>;
