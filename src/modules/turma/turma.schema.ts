import { z } from 'zod';

export const criarTurmaSchema = z.object({
  nome: z.string().min(2, 'O nome da turma deve ter pelo menos 2 caracteres'),
  serie: z.string().min(1, 'A série/nível é obrigatória'),
  anoLetivo: z.number().int().positive('O ano letivo deve ser válido'),
});

export const atualizarTurmaSchema = criarTurmaSchema.partial();

export type CriarTurmaDTO = z.infer<typeof criarTurmaSchema>;
export type AtualizarTurmaDTO = z.infer<typeof atualizarTurmaSchema>;