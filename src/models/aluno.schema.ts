import { z } from 'zod';
import { criarIdPositivoCoercao, dataNaoFuturaSchema } from './common.schema';

export const criarAlunoSchema = z
  .object({
    nome: z.string().trim().min(2, 'Nome deve ter no mínimo 2 caracteres'),
    dataNascimento: dataNaoFuturaSchema(
      'A data de nascimento deve estar no formato AAAA-MM-DD e ser uma data válida (ex: 2018-05-10)',
      'A data de nascimento não pode ser futura'
    ),
    observacoes: z.string().trim().optional(),
    turmaId: z.number().int().positive('Turma inválida'),
  })
  .strict();

export const atualizarAlunoSchema = criarAlunoSchema.partial().strict();

export const listarAlunoQuerySchema = z.object({
  turmaId: criarIdPositivoCoercao('turmaId inválido.').optional(),
});

export type CriarAlunoDTO = z.infer<typeof criarAlunoSchema>;
export type AtualizarAlunoDTO = z.infer<typeof atualizarAlunoSchema>;
export type ListarAlunoQueryDTO = z.infer<typeof listarAlunoQuerySchema>;
