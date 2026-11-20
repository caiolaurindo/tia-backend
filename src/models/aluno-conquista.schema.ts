import { z } from 'zod';
import { StatusConquista } from './aluno-conquista.entity';
import { criarIdPositivoCoercao } from './common.schema';

export const atribuirConquistaSchema = z
  .object({
    alunoId: z.number().int().positive('Aluno inválido'),
    conquistaId: z.number().int().positive('Conquista inválida'),
    status: z.enum(StatusConquista).optional(),
    observacao: z.string().trim().optional(),
  })
  .strict();

export const atualizarAlunoConquistaSchema = z
  .object({
    status: z.enum(StatusConquista).optional(),
    observacao: z.string().trim().optional(),
  })
  .strict();

export const listarAlunoConquistaQuerySchema = z.object({
  alunoId: criarIdPositivoCoercao('O parâmetro alunoId é obrigatório e deve ser numérico.'),
});

export type AtribuirConquistaDTO = z.infer<typeof atribuirConquistaSchema>;
export type AtualizarAlunoConquistaDTO = z.infer<typeof atualizarAlunoConquistaSchema>;
export type ListarAlunoConquistaQueryDTO = z.infer<typeof listarAlunoConquistaQuerySchema>;
