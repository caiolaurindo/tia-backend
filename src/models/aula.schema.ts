import { z } from 'zod';
import { criarIdPositivoCoercao, dataISOSchema } from './common.schema';

/**
 * Schemas de validação para as operações da entidade Aula.
 *
 * @author caiolaurindo
 */
export const criarAulaSchema = z
  .object({
    nome: z.string().trim().min(2, 'O nome da aula deve ter pelo menos 2 caracteres'),
    assunto: z.string().trim().min(2, 'O assunto da aula deve ter pelo menos 2 caracteres'),
    data: dataISOSchema(
      'A data da aula deve estar no formato AAAA-MM-DD e ser uma data válida (ex: 2026-10-26)'
    ),
    turmaId: z.number().int().positive('O ID da turma deve ser um número inteiro válido'),
  })
  .strict();

export const atualizarAulaSchema = criarAulaSchema.partial().strict();

export const listarAulaQuerySchema = z.object({
  turmaId: criarIdPositivoCoercao('turmaId inválido.').optional(),
});

export type CriarAulaDTO = z.infer<typeof criarAulaSchema>;
export type AtualizarAulaDTO = z.infer<typeof atualizarAulaSchema>;
export type ListarAulaQueryDTO = z.infer<typeof listarAulaQuerySchema>;
