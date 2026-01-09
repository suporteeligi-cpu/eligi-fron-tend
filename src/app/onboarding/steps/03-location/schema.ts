import { z } from 'zod';

export const locationSchema = z.object({
  name: z.string().min(2, 'Informe o nome legal'),
  city: z.string().min(2, 'Informe a cidade'),
  state: z.string().min(2, 'Informe o estado'),
  country: z.string().min(2, 'Informe o país'),
  timezone: z.string().min(3, 'Informe o fuso horário')
});

export type LocationFormData = z.infer<
  typeof locationSchema
>;
