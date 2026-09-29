import { z } from 'zod';

export const vincularConquistaSchema = z.object({
  conquistaId: z.number({ required_error: 'ID da conquista é obrigatório' }).int().positive(),
});

export type VincularConquistaDTO = z.infer<typeof vincularConquistaSchema>;