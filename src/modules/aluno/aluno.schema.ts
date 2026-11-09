import { z } from 'zod';

export const criarAlunoSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  dataNascimento: z.coerce.date(),
  observacoes: z.string().optional(),
  turmaId: z.number().int().positive('Turma inválida'),
});

export const atualizarAlunoSchema = criarAlunoSchema.partial();

export type CriarAlunoDTO = z.infer<typeof criarAlunoSchema>;
export type AtualizarAlunoDTO = z.infer<typeof atualizarAlunoSchema>;