import { z } from 'zod';

export const basicInfoSchema = z.object({
  displayName: z.string().min(2, 'Informe um nome válido'),
  businessType: z.string().min(2, 'Informe o tipo do negócio')
});

export type BasicInfoFormData = z.infer<
  typeof basicInfoSchema
>;
