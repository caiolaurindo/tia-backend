import { z } from 'zod';

export const vincularConquistaSchema = z.object({
  conquistaId: z.number().int().positive('ID da conquista deve ser um número inteiro positivo'),
});

export type VincularConquistaDTO = z.infer<typeof vincularConquistaSchema>;
