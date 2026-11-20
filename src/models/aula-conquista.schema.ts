import { z } from 'zod';
import { criarIdPositivoCoercao } from './common.schema';

/**
 * Schemas de validação para a entidade AulaConquista.
 *
 * @author caiolaurindo
 */
export const criarAulaConquistaSchema = z
  .object({
    aulaId: z.number().int().positive('O ID da aula deve ser um número inteiro válido'),
    conquistaId: z.number().int().positive('O ID da conquista deve ser um número inteiro válido'),
    meta: z.string().trim().min(2, 'A meta definida deve ter pelo menos 2 caracteres').optional(),
  })
  .strict();

export const atualizarAulaConquistaSchema = z
  .object({
    meta: z.string().trim().min(2, 'A meta definida deve ter pelo menos 2 caracteres').optional(),
  })
  .strict();

export const listarAulaConquistaQuerySchema = z.object({
  aulaId: criarIdPositivoCoercao('O ID da aula deve ser um número inteiro válido'),
});

export type CriarAulaConquistaDTO = z.infer<typeof criarAulaConquistaSchema>;
export type AtualizarAulaConquistaDTO = z.infer<typeof atualizarAulaConquistaSchema>;
export type ListarAulaConquistaQueryDTO = z.infer<typeof listarAulaConquistaQuerySchema>;
