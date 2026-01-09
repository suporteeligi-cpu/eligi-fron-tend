import { z } from 'zod';

export const hoursSchema = z.object({
  hours: z
    .array(
      z.object({
        weekday: z.number().min(0).max(6),
        startTime: z.string().regex(/^\d{2}:\d{2}$/),
        endTime: z.string().regex(/^\d{2}:\d{2}$/)
      })
    )
    .min(1, 'Defina pelo menos um dia de funcionamento')
});

export type HoursFormData = z.infer<typeof hoursSchema>;
