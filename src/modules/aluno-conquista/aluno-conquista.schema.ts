import { z } from 'zod';
import { StatusConquista } from './aluno-conquista.entity';

export const atribuirConquistaSchema = z.object({
  alunoId: z.number().int().positive('Aluno inválido'),
  conquistaId: z.number().int().positive('Conquista inválida'),
  status: z.nativeEnum(StatusConquista).optional(),
  observacao: z.string().optional(),
});

export const atualizarAlunoConquistaSchema = z.object({
  status: z.nativeEnum(StatusConquista).optional(),
  observacao: z.string().optional(),
});

export type AtribuirConquistaDTO = z.infer<typeof atribuirConquistaSchema>;
export type AtualizarAlunoConquistaDTO = z.infer<typeof atualizarAlunoConquistaSchema>;