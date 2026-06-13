import { z } from 'zod';

export const locationSchema = z.object({
  cep: z.string().trim().optional(),
  address: z.string().trim().optional(),
  city: z.string().trim().min(2),
  state: z.string().trim().min(2),
  country: z.string().trim().min(2),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export type LocationForm = z.infer<typeof locationSchema>;
