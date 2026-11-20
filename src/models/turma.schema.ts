import { z } from 'zod';

export const criarTurmaSchema = z
  .object({
    nome: z.string().trim().min(2, 'O nome da turma deve ter pelo menos 2 caracteres'),
    serie: z.string().trim().min(1, 'A série/nível é obrigatória'),
    anoLetivo: z.number().int().positive('O ano letivo deve ser válido'),
  })
  .strict();

export const atualizarTurmaSchema = criarTurmaSchema.partial().strict();

export type CriarTurmaDTO = z.infer<typeof criarTurmaSchema>;
export type AtualizarTurmaDTO = z.infer<typeof atualizarTurmaSchema>;
