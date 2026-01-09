import { z } from 'zod';

export const servicesSchema = z.object({
  services: z.array(
    z.object({
      name: z.string().min(2),
      duration: z.number().min(5),
      price: z.number().optional()
    })
  ).min(1, 'Cadastre pelo menos um serviço')
});

export type ServicesFormData = z.infer<typeof servicesSchema>;
