import { z } from 'zod';

export const criarConquistaSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(150),
  descricao: z.string().optional(),
});

export const atualizarConquistaSchema = criarConquistaSchema.partial();

export type CriarConquistaDTO = z.infer<typeof criarConquistaSchema>;
export type AtualizarConquistaDTO = z.infer<typeof atualizarConquistaSchema>;