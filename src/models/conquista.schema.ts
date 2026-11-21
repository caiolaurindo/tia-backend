import { z } from 'zod';
import { CategoriaConquista } from './conquista.entity';

// O validarRequisicao já aplica .strict() no body; mantemos o mesmo padrão dos outros schemas.
export const criarConquistaSchema = z
  .object({
    nome: z.string().trim().min(2, 'Nome deve ter no mínimo 2 caracteres').max(150),
    descricao: z.string().trim().optional(),
    categoria: z.nativeEnum(CategoriaConquista),
    nivel: z.string().trim().max(10).optional(),
  })
  .strict();

// "ativa" só existe na atualização (arquivar/restaurar)
export const atualizarConquistaSchema = criarConquistaSchema
  .partial()
  .extend({ ativa: z.boolean().optional() })
  .strict();

export type CriarConquistaDTO = z.infer<typeof criarConquistaSchema>;
export type AtualizarConquistaDTO = z.infer<typeof atualizarConquistaSchema>;
