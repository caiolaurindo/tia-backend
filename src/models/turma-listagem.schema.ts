
import { z } from 'zod';

export const listarTurmaQuerySchema = z.object({
  page: z.coerce
    .number()
    .int('A página deve ser um número inteiro')
    .min(1, 'A página deve ser maior que zero')
    .default(1),

  limit: z.coerce
    .number()
    .int('O limite deve ser um número inteiro')
    .min(1, 'O limite deve ser maior que zero')
    .max(100, 'O limite máximo é 100')
    .default(10),

  nome: z.string().trim().optional(),

  serie: z.string().trim().optional(),

  anoLetivo: z.coerce
    .number()
    .int('O ano letivo deve ser um número inteiro')
    .positive('O ano letivo deve ser positivo')
    .optional(),
});

export type ListarTurmaQueryDTO = z.infer<
  typeof listarTurmaQuerySchema
>;
