import { z } from 'zod';
import { dataISOSchema } from './common.schema';

export const createRegistroSchema = z
  .object({
    alunoId: z.number().int().positive('O ID do aluno deve ser um número inteiro positivo'),
    aulaId: z.number().int().positive('O ID da aula deve ser um número inteiro positivo').nullable().optional(),
    conquistaId: z.number().int().positive('O ID da conquista deve ser um número inteiro positivo').nullable().optional(),
    data: dataISOSchema(
      'A data do registro deve estar no formato AAAA-MM-DD e ser uma data válida (ex: 2026-10-26)'
    ),
    participacao: z.string().nullable().optional(),
    realizouAtividade: z.string().nullable().optional(),
    seguiuComandos: z.string().nullable().optional(),
    dificuldades: z.string().nullable().optional(),
    observacoesLivres: z.string().nullable().optional(),
  })
  .strict();

export const updateRegistroSchema = createRegistroSchema.partial().strict();

export type CreateRegistroInput = z.infer<typeof createRegistroSchema>;
export type UpdateRegistroInput = z.infer<typeof updateRegistroSchema>;
export const criarRegistroSchema = createRegistroSchema;
export const atualizarRegistroSchema = updateRegistroSchema;
export type CriarRegistroDTO = CreateRegistroInput;
export type AtualizarRegistroDTO = UpdateRegistroInput;
