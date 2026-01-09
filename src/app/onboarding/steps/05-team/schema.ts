import { z } from 'zod';

export const teamSchema = z.object({
  team: z.array(
    z.object({
      name: z.string().min(2),
      email: z.string().email().optional(),
      role: z.string().min(2)
    })
  ).min(1, 'Adicione pelo menos uma pessoa')
});

export type TeamFormData = z.infer<typeof teamSchema>;
