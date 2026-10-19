import { z } from 'zod';

/**
 * @author moisesaraujo
 */

export const criarAlunoSchema = z.object({
  nome: z.string().min(2, 'O nome do aluno deve ter pelo menos 2 caracteres'),
  dataNascimento: z.string().optional(),
  observacoesGerais: z.string().optional(),
  turmaId: z.number().int().positive('O ID da turma deve ser válido'),
});

export const atualizarAlunoSchema = criarAlunoSchema.partial();

export type CriarAlunoDTO = z.infer<typeof criarAlunoSchema>;
export type AtualizarAlunoDTO = z.infer<typeof atualizarAlunoSchema>;
