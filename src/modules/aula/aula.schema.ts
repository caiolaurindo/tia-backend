import { z } from 'zod';

/**
 * Schemas de validação para as operações da entidade Aula.
 * 
 * @author caiolaurindo
 */
export const criarAulaSchema = z.object({
  nome: z.string().min(2, 'O nome da aula deve ter pelo menos 2 caracteres'),
  assunto: z.string().min(2, 'O assunto da aula deve ter pelo menos 2 caracteres'),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'A data da aula deve estar no formato AAAA-MM-DD (ex: 2026-10-26)'),
  turmaId: z.number().int().positive('O ID da turma deve ser um número inteiro válido'),
});

export const atualizarAulaSchema = criarAulaSchema.partial();

export type CriarAulaDTO = z.infer<typeof criarAulaSchema>;
export type AtualizarAulaDTO = z.infer<typeof atualizarAulaSchema>;

